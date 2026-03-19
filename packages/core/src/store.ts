import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ParsedMessage } from "#parse-message.ts";

export interface AgentSession {
	id: string;
	status: "running" | "completed" | "failed";
	prompt: string;
	cwd: string;
	startedAt: string;
	completedAt?: string;
	result?: string;
	error?: string;
	durationMs?: number;
	totalCostUsd?: number;
	numTurns?: number;
	model?: string;
	/** Claude CLI session ID for resume support */
	claudeSessionId?: string;
	/** Associated queue job ID for correlation */
	jobId?: string;
}

export interface AgentSessionMessage {
	timestamp: string;
	type: string;
	message?: ParsedMessage;
	raw: unknown;
}

const DEFAULT_STORE_DIR = "../../.agent-sessions";

function getStoreDir(): string {
	return process.env.AGENT_STORE_DIR ?? join(process.cwd(), DEFAULT_STORE_DIR);
}

function agentSessionDir(id: string): string {
	return join(getStoreDir(), id);
}

export async function createAgentSession(
	id: string,
	prompt: string,
	cwd: string,
	jobId?: string,
): Promise<AgentSession> {
	const session: AgentSession = {
		id,
		status: "running",
		prompt,
		cwd,
		startedAt: new Date().toISOString(),
		jobId,
	};

	const dir = agentSessionDir(id);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "session.json"), JSON.stringify(session, null, 2));
	await writeFile(join(dir, "messages.jsonl"), "");

	return session;
}

export async function appendMessage(
	id: string,
	message: AgentSessionMessage,
): Promise<void> {
	const filePath = join(agentSessionDir(id), "messages.jsonl");

	await writeFile(filePath, `${JSON.stringify(message)}\n`, { flag: "a" });
}

async function getAgentSessionWorkingDirectory(id: string): Promise<string> {
	const dir = join(agentSessionDir(id), "working-directory");

	await mkdir(dir, { recursive: true });

	return dir;
}

async function getAgentSessionArtifacts(id: string): Promise<string> {
	const dir = join(agentSessionDir(id), "artifacts");

	await mkdir(dir, { recursive: true });

	return dir;
}

export interface ArtifactFile {
	name: string;
	size: number;
	modifiedAt: string;
}

async function listAgentSessionArtifacts(id: string): Promise<ArtifactFile[]> {
	const baseDir = await getAgentSessionArtifacts(id);

	async function walkDir(dir: string, prefix: string): Promise<ArtifactFile[]> {
		const entries = await readdir(dir, { withFileTypes: true });
		const files: ArtifactFile[] = [];

		for (const entry of entries) {
			const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
			const fullPath = join(dir, entry.name);

			if (entry.isFile()) {
				const fileStat = await stat(fullPath);
				files.push({
					name: relativeName,
					size: fileStat.size,
					modifiedAt: fileStat.mtime.toISOString(),
				});
			} else if (entry.isDirectory()) {
				const nested = await walkDir(fullPath, relativeName);
				files.push(...nested);
			}
		}

		return files;
	}

	try {
		const files = await walkDir(baseDir, "");
		return files.sort(
			(a, b) =>
				new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
		);
	} catch {
		return [];
	}
}

async function getAgentSessionArtifactContent(
	id: string,
	filePath: string,
): Promise<string | null> {
	// Prevent path traversal
	if (filePath.includes("\\") || filePath.includes("..")) {
		return null;
	}
	const baseDir = join(agentSessionDir(id), "artifacts");
	const resolved = resolve(baseDir, filePath);
	if (!resolved.startsWith(baseDir)) {
		return null;
	}
	try {
		return await readFile(resolved, "utf-8");
	} catch {
		return null;
	}
}

export async function updateAgentSession(
	id: string,
	update: Partial<AgentSession>,
): Promise<void> {
	const filePath = join(agentSessionDir(id), "session.json");
	const existing: AgentSession = JSON.parse(await readFile(filePath, "utf-8"));
	const updated = { ...existing, ...update };
	await writeFile(filePath, JSON.stringify(updated, null, 2));
}

export async function completeAgentSession(
	id: string,
	update: Partial<AgentSession>,
): Promise<void> {
	const filePath = join(agentSessionDir(id), "session.json");
	const existing: AgentSession = JSON.parse(await readFile(filePath, "utf-8"));
	const updated = {
		...existing,
		...update,
		completedAt: new Date().toISOString(),
	};
	await writeFile(filePath, JSON.stringify(updated, null, 2));
}

export async function listAgentSessions(): Promise<AgentSession[]> {
	const storeDir = getStoreDir();
	let entries: string[];
	try {
		entries = await readdir(storeDir);
	} catch {
		return [];
	}

	const sessions: AgentSession[] = [];
	for (const entry of entries) {
		try {
			const data = await readFile(
				join(storeDir, entry, "session.json"),
				"utf-8",
			);
			sessions.push(JSON.parse(data));
		} catch {
			// skip invalid entries
		}
	}

	return sessions.sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);
}

export async function getAgentSession(
	id: string,
): Promise<AgentSession | null> {
	try {
		const data = await readFile(
			join(agentSessionDir(id), "session.json"),
			"utf-8",
		);
		return JSON.parse(data);
	} catch {
		return null;
	}
}

export async function getAgentSessionMessages(
	id: string,
): Promise<AgentSessionMessage[]> {
	try {
		const data = await readFile(
			join(agentSessionDir(id), "messages.jsonl"),
			"utf-8",
		);
		return data
			.split("\n")
			.filter(Boolean)
			.map((line) => JSON.parse(line));
	} catch {
		return [];
	}
}

export const store = {
	get: getAgentSession,
	update: updateAgentSession,
	getMessages: getAgentSessionMessages,
	list: listAgentSessions,
	workingDirectory: getAgentSessionWorkingDirectory,
	artifactsDirectory: getAgentSessionArtifacts,
	listArtifacts: listAgentSessionArtifacts,
	getArtifactContent: getAgentSessionArtifactContent,
};
