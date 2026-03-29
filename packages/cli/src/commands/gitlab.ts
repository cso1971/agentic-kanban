import { resolve } from "node:path";
import { createGitLabClient, setupGitLabProject } from "@agentic-kanban/gitlab";
import type { Command } from "commander";

function getGitLabClient() {
	const token = process.env.GITLAB_TOKEN;

	if (!token) {
		console.error("Error: GITLAB_TOKEN environment variable is required");
		process.exit(1);
	}

	return createGitLabClient({
		host: process.env.GITLAB_HOST,
		token,
	});
}

export function registerGitlabCommand(program: Command) {
	const gitlab = program
		.command("gitlab")
		.description("GitLab integration commands");

	gitlab
		.command("projects")
		.description("List GitLab projects")
		.option("--owned", "Only show owned projects", false)
		.option("--membership", "Only show projects with membership", false)
		.action(async (options) => {
			const client = getGitLabClient();
			const projects = await client.Projects.all({
				owned: options.owned,
				membership: options.membership,
				maxPages: 1,
				perPage: 20,
			});

			for (const project of projects) {
				console.log(`${project.id}: ${project.path_with_namespace}`);
			}
		});

	gitlab
		.command("mrs")
		.description("List merge requests for a project")
		.requiredOption("-p, --project <id>", "Project ID or path")
		.option("-s, --state <state>", "MR state filter", "opened")
		.action(async (options) => {
			const client = getGitLabClient();
			const mrs = await client.MergeRequests.all({
				projectId: options.project,
				state: options.state,
				maxPages: 1,
				perPage: 20,
			});

			for (const mr of mrs) {
				console.log(`!${mr.iid}: ${mr.title} [${mr.state}]`);
			}
		});

	gitlab
		.command("issues")
		.description("List issues for a project")
		.requiredOption("-p, --project <id>", "Project ID or path")
		.option("-s, --state <state>", "Issue state filter", "opened")
		.action(async (options) => {
			const client = getGitLabClient();
			const issues = await client.Issues.all({
				projectId: options.project,
				state: options.state,
				maxPages: 1,
				perPage: 20,
			});

			for (const issue of issues) {
				console.log(`#${issue.iid}: ${issue.title} [${issue.state}]`);
			}
		});

	gitlab
		.command("pipelines")
		.description("List pipelines for a project")
		.requiredOption("-p, --project <id>", "Project ID or path")
		.option("-s, --status <status>", "Pipeline status filter")
		.action(async (options) => {
			const client = getGitLabClient();
			const pipelines = await client.Pipelines.all(options.project, {
				status: options.status,
				maxPages: 1,
				perPage: 20,
			});

			for (const pipeline of pipelines) {
				console.log(`#${pipeline.id}: ${pipeline.ref} [${pipeline.status}]`);
			}
		});

	gitlab
		.command("config")
		.description("Configure GitLab projects for agent integration")
		.requiredOption("-g, --group <name>", "Group name")
		.requiredOption(
			"-r, --repo <paths...>",
			"Repository folders to upload (folder name used as project name)",
		)
		.requiredOption(
			"-t, --target <path>",
			"Target repository for kanban board and webhook (must be one of --repo paths)",
		)
		.requiredOption("-w, --webhook <url>", "Webhook URL")
		.requiredOption("-c, --config <path>", "Config directory path", "./config")
		.option("-f, --force", "Delete existing projects and recreate", false)
		.action(async (options) => {
			const token = process.env.GITLAB_TOKEN;

			if (!token) {
				console.error("Error: GITLAB_TOKEN environment variable is required");
				process.exit(1);
			}

			await setupGitLabProject({
				groupName: options.group,
				repoPaths: (options.repo as string[]).map((r: string) => resolve(r)),
				targetRepo: resolve(options.target),
				webhookUrl: options.webhook,
				configDir: resolve(options.config),
				gitlabHost: process.env.GITLAB_HOST,
				adminToken: token,
				force: options.force,
			});
		});
}
