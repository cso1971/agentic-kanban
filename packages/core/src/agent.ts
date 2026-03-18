import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { logger } from "#logger.ts";
import { parseError } from "#parse-error.ts";
import { extractText, parseMessage } from "#parse-message.ts";
import {
	type AgentSessionMessage,
	appendMessage,
	completeAgentSession,
	createAgentSession,
} from "#store.ts";

const execFileAsync = promisify(execFile);
const log = logger.core;

export type Models = "sonnet" | "opus" | "haiku";
export type ClaudePlugin = "skill-creator@claude-plugins-official";

export interface AskQuestionOptions {
	prompt: string;
	model?: Models;
	systemPrompt?: string;
	/** Plugins that must be installed before running */
	requiredPlugins?: ClaudePlugin[];
}

export interface RunAgentOptions {
	prompt: string;
	cwd?: string;
	model?: Models;
	/** Pre-generated agent session ID */
	agentSessionId?: string;
	/** Associated job ID for queue correlation */
	jobId?: string;
	/** Extra CLI flags passed to `claude` */
	extraArgs?: string[];
	/** Permission mode flag (--dangerously-skip-permissions, etc.) */
	permissionMode?: "default" | "bypassPermissions";
}

export interface RunAgentResult {
	agentSessionId: string;
	result: string;
}

/**
 * Runs the `claude` CLI executable as a subprocess, creates an agent session,
 * and streams all stdout output as session messages.
 */
export async function runAgent(
	options: RunAgentOptions,
): Promise<RunAgentResult> {
	const sessionId = options.agentSessionId ?? randomUUID();
	const cwd = options.cwd ?? process.cwd();

	await createAgentSession(sessionId, options.prompt, cwd, options.jobId);

	const args: string[] = [
		"--print",
		"--verbose",
		"--output-format",
		"stream-json",
		options.prompt,
	];

	if (options.model) {
		args.push("--model", options.model);
	}

	if (options.permissionMode === "bypassPermissions") {
		args.push("--dangerously-skip-permissions");
	}

	if (options.extraArgs) {
		args.push(...options.extraArgs);
	}

	log.info`Starting CLI session ${sessionId} with: claude ${args.join(" ")}`;

	return new Promise<RunAgentResult>((resolve, reject) => {
		const child = spawn("claude", args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			// TODO: check this env, dangerous
			env: { ...process.env, CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1" },
		});

		let fullOutput = "";

		child.stdout.on("data", async (chunk: Buffer) => {
			const raw = chunk.toString();

			const lines = raw.split("\n").filter((line) => line.trim());
			for (const json of lines) {
				const message = parseMessage(json);
				const text = extractText(message);

				if (text) fullOutput += text;

				const msg: AgentSessionMessage = {
					timestamp: new Date().toISOString(),
					type: "cli_stdout",
					message,
					raw: { stream: "stdout", chunk: json },
				};

				await appendMessage(sessionId, msg).catch((err) => {
					log.error`Failed to append stdout message: ${err}`;
				});
			}
		});

		child.stderr.on("data", async (chunk: Buffer) => {
			const raw = chunk.toString();

			const lines = raw.split("\n").filter((line) => line.trim());
			for (const json of lines) {
				const error = parseError(json);

				const msg: AgentSessionMessage = {
					timestamp: new Date().toISOString(),
					type: "cli_stderr",
					message: error,
					raw: { stream: "stderr", chunk: json },
				};

				await appendMessage(sessionId, msg).catch((err) => {
					log.error`Failed to append stderr message: ${err}`;
				});
			}
		});

		child.on("close", async (code) => {
			const status = code === 0 ? "completed" : "failed";

			await completeAgentSession(sessionId, {
				status,
				result: status === "completed" ? fullOutput : undefined,
				error:
					status === "failed" ? `claude exited with code ${code}` : undefined,
			});

			if (status === "completed") {
				resolve({ agentSessionId: sessionId, result: fullOutput });
			} else {
				reject(new Error(`claude exited with code ${code}`));
			}
		});

		child.on("error", async (err) => {
			await completeAgentSession(sessionId, {
				status: "failed",
				error: err.message,
			});
			reject(err);
		});
	});
}

async function checkPlugins(plugins: ClaudePlugin[]): Promise<void> {
	const { stdout } = await execFileAsync("claude", ["plugins", "list"]);
	const missing = plugins.filter((p) => !stdout.includes(p));
	if (missing.length > 0) {
		throw new Error(
			`Required Claude plugin(s) not installed: ${missing.join(", ")}. Install with: ${missing.map((p) => `claude plugin install ${p}`).join(" && ")}`,
		);
	}
}

export async function askQuestion(
	options: AskQuestionOptions,
): Promise<string> {
	if (options.requiredPlugins?.length) {
		await checkPlugins(options.requiredPlugins);
	}

	const args: string[] = ["--print", "--max-turns", "1", options.prompt];

	if (options.model) {
		args.push("--model", options.model);
	}

	if (options.systemPrompt) {
		args.push("--system-prompt", options.systemPrompt);
	}

	return new Promise<string>((resolve, reject) => {
		const child = spawn("claude", args, {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let output = "";

		child.stdout.on("data", (chunk: Buffer) => {
			output += chunk.toString();
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve(output.trim());
			} else {
				reject(new Error(`claude exited with code ${code}`));
			}
		});

		child.on("error", (err) => reject(err));
	});
}

export const agent = {
	ask: askQuestion,
	run: runAgent,
};
