import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export interface Invocation {
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
}

export interface InvocationMessage {
	timestamp: string;
	type: string;
	text?: string;
	raw: unknown;
}

const DEFAULT_STORE_DIR = ".agent-invocations";

function getStoreDir(): string {
	return process.env.AGENT_STORE_DIR ?? join(process.cwd(), DEFAULT_STORE_DIR);
}

function invocationDir(id: string): string {
	return join(getStoreDir(), id);
}

export async function createInvocation(
	id: string,
	prompt: string,
	cwd: string,
): Promise<Invocation> {
	const inv: Invocation = {
		id,
		status: "running",
		prompt,
		cwd,
		startedAt: new Date().toISOString(),
	};
	const dir = invocationDir(id);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "invocation.json"), JSON.stringify(inv, null, 2));
	await writeFile(join(dir, "messages.jsonl"), "");
	return inv;
}

export async function appendMessage(
	id: string,
	message: InvocationMessage,
): Promise<void> {
	const filePath = join(invocationDir(id), "messages.jsonl");
	await writeFile(filePath, JSON.stringify(message) + "\n", { flag: "a" });
}

export async function completeInvocation(
	id: string,
	update: Partial<Invocation>,
): Promise<void> {
	const filePath = join(invocationDir(id), "invocation.json");
	const existing: Invocation = JSON.parse(await readFile(filePath, "utf-8"));
	const updated = {
		...existing,
		...update,
		completedAt: new Date().toISOString(),
	};
	await writeFile(filePath, JSON.stringify(updated, null, 2));
}

export async function listInvocations(): Promise<Invocation[]> {
	const storeDir = getStoreDir();
	let entries: string[];
	try {
		entries = await readdir(storeDir);
	} catch {
		return [];
	}

	const invocations: Invocation[] = [];
	for (const entry of entries) {
		try {
			const data = await readFile(
				join(storeDir, entry, "invocation.json"),
				"utf-8",
			);
			invocations.push(JSON.parse(data));
		} catch {
			// skip invalid entries
		}
	}

	return invocations.sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);
}

export async function getInvocation(id: string): Promise<Invocation | null> {
	try {
		const data = await readFile(
			join(invocationDir(id), "invocation.json"),
			"utf-8",
		);
		return JSON.parse(data);
	} catch {
		return null;
	}
}

export async function getInvocationMessages(
	id: string,
): Promise<InvocationMessage[]> {
	try {
		const data = await readFile(
			join(invocationDir(id), "messages.jsonl"),
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
