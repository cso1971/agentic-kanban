import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { agent, env, logger } from "@agentic-kanban/core";
import {
	type Camelize,
	Gitlab,
	type GroupSchema,
	type ProjectSchema,
} from "@gitbeaker/rest";
import { $ } from "bun";

const log = logger.gitlab;

type GitlabClient = InstanceType<typeof Gitlab<true>>;

export interface AgentConfig {
	name: string;
	content: string;
}

export interface SetupConfig {
	groupName: string;
	repoPaths: string[];
	targetRepo: string;
	webhookUrl: string;
	configDir: string;
	gitlabHost?: string;
	adminToken: string;
	force?: boolean;
}

export interface SetupResult {
	group: { id: number; webUrl: string };
	projects: Array<{
		id: number;
		name: string;
		webUrl: string;
		boardId: number | null;
	}>;
	users: Array<{ username: string; token: string }>;
	webhookId: number;
}

async function readAgents(configDir: string): Promise<AgentConfig[]> {
	const agentsDir = join(configDir, "agents");
	const agents: AgentConfig[] = [];

	if (!existsSync(agentsDir)) {
		throw new Error(`Agents directory not found: ${agentsDir}`);
	}

	const entries = await readdir(agentsDir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			const agentFile = join(agentsDir, entry.name, "agent.md");
			if (existsSync(agentFile)) {
				const content = await readFile(agentFile, "utf-8");
				agents.push({
					name: entry.name,
					content,
				});
			}
		}
	}

	return agents;
}

async function readLifecycle(configDir: string): Promise<string[]> {
	const lifecycleFile = join(configDir, "lifecycle.md");

	if (!existsSync(lifecycleFile)) {
		throw new Error(`Lifecycle file not found: ${lifecycleFile}`);
	}

	const content = await readFile(lifecycleFile, "utf-8");

	const result = await agent.ask({
		prompt: `Analyze this lifecycle document and extract the kanban board column names in order. Return ONLY a JSON array of strings, nothing else.

${content}`,
		systemPrompt:
			"You extract structured data from documents. Always respond with valid JSON only, no markdown fences, no explanation.",
	});

	const columns: string[] = JSON.parse(result);

	if (!Array.isArray(columns) || !columns.every((c) => typeof c === "string")) {
		throw new Error(`Unexpected response from agent: ${result}`);
	}

	return columns;
}

function agentNameToUsername(name: string): string {
	return `agent-${name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
}

function agentNameToDisplayName(name: string): string {
	return name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

async function writeTokenToEnv(
	username: string,
	token: string,
	envPath: string,
): Promise<void> {
	const key = `${username.toUpperCase().replace(/-/g, "_")}_TOKEN`;
	await env.updateOrAppendKey(envPath, key, token);
}

async function findOrCreateGroup(
	client: GitlabClient,
	groupName: string,
	force: boolean,
): Promise<Camelize<GroupSchema>> {
	log.info("Checking if group {groupName} already exists", { groupName });
	const existingGroups = await client.Groups.search(groupName);
	const existing = existingGroups.find((g) => g.name === groupName);

	if (existing) {
		if (force) {
			log.info("Deleting existing group {groupName} (--force)", {
				groupName,
			});
			await client.Groups.remove(existing.id);
		} else {
			log.info("Group {groupName} already exists", { groupName });
			return existing;
		}
	}

	log.info("Creating group {groupName}", { groupName });
	return await client.Groups.create(groupName, groupName);
}

async function findOrCreateProject(
	client: GitlabClient,
	projectName: string,
	groupId: number,
	force: boolean,
): Promise<
	| { created: true; project: Camelize<ProjectSchema> }
	| { created: false; project: Camelize<ProjectSchema> }
> {
	log.info("Checking if project {projectName} already exists", {
		projectName,
	});
	const existingProjects = await client.Projects.search(projectName);
	const existing = existingProjects.find(
		(p) => p.name === projectName && p.namespace?.id === groupId,
	);

	if (existing) {
		if (force) {
			log.info("Deleting existing project {projectName} (--force)", {
				projectName,
			});
			await client.Projects.remove(existing.id);
		} else {
			log.info(
				"Project {projectName} already exists at {webUrl}, skipping setup",
				{ projectName, webUrl: existing.web_url },
			);
			return { created: false, project: existing };
		}
	}

	log.info("Creating project {projectName}", { projectName });
	const project = await client.Projects.create({
		name: projectName,
		namespaceId: groupId,
		visibility: "private",
		initializeWithReadme: false,
	});

	return { created: true, project };
}

async function pushRepo(
	repoPath: string,
	gitlabHost: string,
	groupPath: string,
	projectName: string,
	token: string,
): Promise<void> {
	log.info("Pushing repository from {repoPath} to project", { repoPath });
	const repoUrl = `${gitlabHost}/${groupPath}/${projectName}.git`;
	const authenticatedUrl = repoUrl.replace("://", `://oauth2:${token}@`);

	await $`git -C ${repoPath} init`.quiet();
	await $`git -C ${repoPath} add -A`.quiet();
	await $`git -C ${repoPath} commit -m "Initial commit" --allow-empty`.quiet();
	await $`git -C ${repoPath} remote add origin ${authenticatedUrl}`
		.quiet()
		.catch(() =>
			$`git -C ${repoPath} remote set-url origin ${authenticatedUrl}`.quiet(),
		);
	await $`git -C ${repoPath} push -u origin HEAD:main --force`.quiet();
}

async function createUser(
	client: GitlabClient,
	agent: AgentConfig,
	configDir: string,
	envPath: string,
	force: boolean,
): Promise<{ username: string; token: string; userId: number } | null> {
	const username = agentNameToUsername(agent.name);
	const displayName = agentNameToDisplayName(agent.name);
	const email = `${username}@agentic-kanban.local`;

	const existingUsers = await client.Users.all({ username });
	const existingUser = existingUsers.find((u) => u.username === username);

	let user: { id: number };

	if (existingUser) {
		if (!force) {
			log.info("User {username} already exists, skipping", { username });
			return null;
		}

		log.info("Deleting existing user {username} (--force)", { username });
		await client.Users.remove(existingUser.id);
	}

	log.info("Creating user {username}", { username });
	user = await client.Users.create({
		email,
		name: displayName,
		username,
		password: crypto.randomUUID(),
		skipConfirmation: true,
	});

	const avatarPath = join(configDir, "agents", agent.name, "avatar.png");

	if (existsSync(avatarPath)) {
		log.info("Uploading avatar for {username}", { username });
		const avatarData = await readFile(avatarPath);
		await client.Users.edit(user.id, {
			avatar: {
				content: new Blob([avatarData], { type: "image/png" }),
				filename: "avatar.png",
			},
		});
	} else {
		log.warn("Avatar not found for {username} at {path}", {
			username,
			path: avatarPath,
		});
	}

	const expiresAt = new Date();
	expiresAt.setFullYear(expiresAt.getFullYear() + 1);
	expiresAt.setDate(expiresAt.getDate() - 1);

	const tokenResponse = await client.UserImpersonationTokens.create(
		user.id,
		"agent-token",
		["api", "read_user", "write_repository"],
		{ expiresAt: expiresAt.toISOString().split("T")[0] },
	);

	const token = tokenResponse.token;
	if (!token) {
		throw new Error("could not get token");
	}

	log.info("Writing token for {username} to .env", { username });
	await writeTokenToEnv(username, token, envPath);

	return { username, token, userId: user.id as number };
}

async function createUsers(
	client: GitlabClient,
	agents: AgentConfig[],
	configDir: string,
	force: boolean,
): Promise<Array<{ username: string; token: string; userId: number }>> {
	log.info("Creating users");
	const users: Array<{ username: string; token: string; userId: number }> = [];
	const envPath = join(process.cwd(), ".env");

	for (const agentConfig of agents) {
		try {
			const result = await createUser(
				client,
				agentConfig,
				configDir,
				envPath,
				force,
			);
			if (result) {
				users.push(result);
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				log.error("failed to create user. {error}", { error });
			} else {
				log.error("failed to create user. {error}", { error: String(error) });
			}
		}
	}

	return users;
}

async function addUsersToProject(
	client: GitlabClient,
	users: Array<{ username: string; userId: number }>,
	projectId: number,
): Promise<void> {
	for (const user of users) {
		try {
			log.info("Adding {username} to project as developer", {
				username: user.username,
			});
			await client.ProjectMembers.add(projectId, 30, {
				userId: user.userId,
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				log.error("failed to add user to project. {error}", { error });
			} else {
				log.error("failed to add user to project. {error}", {
					error: String(error),
				});
			}
		}
	}
}

async function createLabels(
	client: GitlabClient,
	projectId: number,
	columns: string[],
): Promise<void> {
	log.info("Creating lifecycle labels");
	const labelColors = ["#428BCA", "#44AD8E", "#A295D6", "#5CB85C", "#69D100"];

	for (let i = 0; i < columns.length; i++) {
		const column = columns[i];
		try {
			await client.ProjectLabels.create(
				projectId,
				column,
				labelColors[i % labelColors.length],
			);
		} catch (error: unknown) {
			if (error instanceof Error) {
				log.error("failed to create label. {error}", { error });
			} else {
				log.error("failed to create label. {error}", {
					error: String(error),
				});
			}
		}
	}

	log.info("Creating special labels");
	const specialLabels = [
		{ name: "blocked", color: "#D9534F" },
		{ name: "urgent", color: "#F0AD4E" },
		{ name: "spike", color: "#777777" },
	];

	for (const label of specialLabels) {
		try {
			await client.ProjectLabels.create(projectId, label.name, label.color);
		} catch (error) {
			if (error instanceof Error) {
				log.error("failed to add special label. {error}", { error });
			} else {
				log.error("failed to add special label. {error}", {
					error: String(error),
				});
			}
		}
	}
}

async function createBoard(
	client: GitlabClient,
	projectId: number,
	columns: string[],
): Promise<number> {
	log.info("Creating Kanban board");
	const board = await client.ProjectIssueBoards.create(projectId, "Kanban");

	log.info("Creating board lists from labels");
	const projectLabels = await client.ProjectLabels.all(projectId);
	const labelMap = new Map(projectLabels.map((l) => [l.name, l.id]));

	const columnsToCreate = columns.filter(
		(c) => c !== "Backlog" && c !== "Done",
	);

	for (const column of columnsToCreate) {
		const labelId = labelMap.get(column);
		if (labelId) {
			try {
				await client.ProjectIssueBoards.createList(projectId, board.id, {
					labelId: labelId as number,
				});
			} catch (error: unknown) {
				if (error instanceof Error) {
					log.error("creating column. {error}", { error });
				} else {
					log.error("creating column. {error}", { error: String(error) });
				}
			}
		}
	}

	return board.id;
}

async function registerWebhook(
	client: GitlabClient,
	projectId: number,
	webhookUrl: string,
): Promise<number> {
	log.info("Registering webhook on project at {webhookUrl}", { webhookUrl });

	const webhook = await client.ProjectHooks.add(projectId, webhookUrl, {
		pushEvents: true,
		issuesEvents: true,
		mergeRequestsEvents: true,
		noteEvents: true,
		pipelineEvents: true,
		enableSslVerification: webhookUrl.startsWith("https"),
	});

	return webhook.id;
}

export async function setupGitLabProject(
	config: SetupConfig,
): Promise<SetupResult> {
	const gitlabHost = config.gitlabHost ?? "https://gitlab.com";

	const client = new Gitlab({
		host: gitlabHost,
		token: config.adminToken,
		camelize: true,
	});

	const agents = await readAgents(config.configDir);
	const columns = await readLifecycle(config.configDir);
	const force = config.force ?? false;

	const group = await findOrCreateGroup(client, config.groupName, force);

	const users = await createUsers(client, agents, config.configDir, force);

	const targetProjectName = config.targetRepo.split("/").pop() as string;

	const projects: Array<{
		id: number;
		name: string;
		webUrl: string;
		boardId: number | null;
	}> = [];

	let webhookId = 0;

	for (const repoPath of config.repoPaths) {
		const projectName = repoPath.split("/").pop() as string;
		const isTarget = projectName === targetProjectName;

		log.info("Setting up project {projectName} from {repoPath}", {
			projectName,
			repoPath,
		});

		const result = await findOrCreateProject(
			client,
			projectName,
			group.id,
			force,
		);

		if (result.created) {
			await pushRepo(
				repoPath,
				gitlabHost,
				group.fullPath,
				projectName,
				config.adminToken,
			);
		}

		let boardId: number | null = null;

		if (isTarget) {
			await addUsersToProject(client, users, result.project.id);
			await createLabels(client, result.project.id, columns);
			boardId = await createBoard(client, result.project.id, columns);
			webhookId = await registerWebhook(
				client,
				result.project.id,
				config.webhookUrl,
			);
		}

		projects.push({
			id: result.project.id,
			name: projectName,
			webUrl: result.project.webUrl,
			boardId,
		});
	}

	return {
		group: { id: group.id, webUrl: group.webUrl },
		projects,
		users: users.map(({ username, token }) => ({ username, token })),
		webhookId,
	};
}
