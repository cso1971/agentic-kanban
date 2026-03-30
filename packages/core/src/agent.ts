import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { logger } from "#logger.ts";
import { parseError } from "#parse-error.ts";
import {
	extractText,
	type ParsedResult,
	parseMessage,
} from "#parse-message.ts";
import { type AgentSession, type AgentSessionMessage, store } from "#store.ts";

const execFileAsync = promisify(execFile);
const log = logger.core;

/** Env vars from .env that the agent subprocess needs */
const APP_ENV_KEYS = [
	"GITLAB_ROOT_PASSWORD",
	"GITLAB_TOKEN",
	"GITLAB_HOST",
	"ANTHROPIC_API_KEY",
] as const;

const AGENT_TOKEN_PATTERN = /^AGENT_.+_TOKEN$/;

/** System env vars required for the subprocess to function */
const SYSTEM_ENV_KEYS = ["PATH", "SHELL"] as const;

function buildAgentEnv(extra?: Record<string, string>): Record<string, string> {
	const env: Record<string, string> = {};

	for (const key of [...SYSTEM_ENV_KEYS, ...APP_ENV_KEYS]) {
		if (process.env[key]) {
			env[key] = process.env[key];
		}
	}

	for (const key of Object.keys(process.env)) {
		if (AGENT_TOKEN_PATTERN.test(key) && process.env[key]) {
			env[key] = process.env[key];
		}
	}

	if (extra) {
		Object.assign(env, extra);
	}

	return env;
}

export type Models = "sonnet" | "opus" | "haiku";
export type ClaudePlugin =
	| "skill-creator@claude-plugins-official"
	| "ralph-loop";

export interface AskQuestionOptions {
	prompt: string;
	cwd?: string;
	model?: Models;
	systemPrompt?: string;
	/** Plugins that must be installed before running */
	requiredPlugins?: ClaudePlugin[];
}

export interface RunAgentOptions {
	prompt: string;
	cwd: string;
	model?: Models;
	/** Pre-generated agent session ID */
	agentSessionId?: string;
	/** Associated job ID for queue correlation */
	jobId?: string;
	/** Extra CLI flags passed to `claude` */
	extraArgs?: string[];
	/** Permission mode flag (--dangerously-skip-permissions, etc.) */
	permissionMode?: "default" | "bypassPermissions";
	/** Plugins that must be installed before running */
	requiredPlugins?: ClaudePlugin[];
	/** Additional system prompt appended via --append-system-prompt */
	appendSystemPrompt?: string;
}

export interface RunAgentResult {
	agentSessionId: string;
	result: string;
}

const RESUMABLE_STATUSES: AgentSession["status"][] = ["running", "failed"];

function getResumableClaudeSessionId(
	session: AgentSession | null,
): string | undefined {
	if (!session?.claudeSessionId) return undefined;
	if (!RESUMABLE_STATUSES.includes(session.status)) return undefined;
	return session.claudeSessionId;
}

/**
 * Runs the `claude` CLI executable as a subprocess, creates an agent session,
 * and streams all stdout output as session messages.
 */
export async function runAgent(
	options: RunAgentOptions,
): Promise<RunAgentResult> {
	if (options.requiredPlugins?.length) {
		await checkPlugins(options.requiredPlugins);
	}

	const sessionId = options.agentSessionId ?? randomUUID();
	const cwd = options.cwd;

	// Check if we can resume an existing session
	const existingSession = await store.get(sessionId);
	const resumeClaudeSessionId = getResumableClaudeSessionId(existingSession);

	if (resumeClaudeSessionId) {
		await store.update(sessionId, {
			status: "running",
			error: undefined,
		});
		log.info`Resuming session ${sessionId} (claude session: ${resumeClaudeSessionId})`;
	} else {
		await store.create(
			sessionId,
			options.prompt,
			cwd,
			options.jobId,
			options.appendSystemPrompt,
		);
	}

	const args: string[] = [
		"--print",
		"--verbose",
		"--output-format",
		"stream-json",
	];

	if (resumeClaudeSessionId) {
		args.push("--resume", resumeClaudeSessionId);
		args.push(
			"Continue the previous task. If it was completed, confirm the result.",
		);
	} else {
		args.push(options.prompt);
	}

	if (options.model) {
		args.push("--model", options.model);
	}

	if (options.permissionMode === "bypassPermissions") {
		args.push("--dangerously-skip-permissions");
	}

	if (options.appendSystemPrompt) {
		args.push("--append-system-prompt", options.appendSystemPrompt);
	}

	if (options.extraArgs) {
		args.push(...options.extraArgs);
	}

	log.info`Starting CLI session ${sessionId} with: claude ${args.join(" ")}`;

	return new Promise<RunAgentResult>((resolve, reject) => {
		const child = spawn("claude", args, {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			env: buildAgentEnv({ CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1" }),
		});

		let fullOutput = "";
		let stderrOutput = "";
		let parsedResult: ParsedResult | undefined;

		child.stdout.on("data", async (chunk: Buffer) => {
			const raw = chunk.toString();

			const lines = raw.split("\n").filter((line) => line.trim());
			for (const json of lines) {
				const message = parseMessage(json);
				const text = extractText(message);

				if (text) fullOutput += text;

				if (message?.type === "result") {
					parsedResult = message;
				}

				if (message?.type === "init") {
					store
						.update(sessionId, {
							claudeSessionId: message.sessionId,
							model: message.model,
						})
						.catch((err: unknown) => {
							log.error`Failed to persist claudeSessionId: ${err}`;
						});
				}

				const msg: AgentSessionMessage = {
					timestamp: new Date().toISOString(),
					type: "cli_stdout",
					message,
					raw: { stream: "stdout", chunk: json },
				};

				await store.appendMessage(sessionId, msg).catch((err) => {
					log.error`Failed to append stdout message: ${err}`;
				});
			}
		});

		child.stderr.on("data", async (chunk: Buffer) => {
			const raw = chunk.toString();
			stderrOutput += raw;

			const lines = raw.split("\n").filter((line) => line.trim());
			for (const json of lines) {
				const error = parseError(json);

				const msg: AgentSessionMessage = {
					timestamp: new Date().toISOString(),
					type: "cli_stderr",
					message: error,
					raw: { stream: "stderr", chunk: json },
				};

				await store.appendMessage(sessionId, msg).catch((err) => {
					log.error`Failed to append stderr message: ${err}`;
				});
			}
		});

		child.on("close", async (code) => {
			const status = code === 0 ? "completed" : "failed";
			const detail = stderrOutput.trim() || fullOutput.slice(-2000).trim();
			const errorMessage =
				status === "failed"
					? `claude exited with code ${code}${detail ? `\n${detail}` : ""}`
					: undefined;

			if (errorMessage) {
				log.error`${errorMessage}`;
			}

			await store.complete(sessionId, {
				status,
				result: status === "completed" ? fullOutput : undefined,
				error: errorMessage,
				durationMs: parsedResult?.durationMs,
				durationApiMs: parsedResult?.durationApiMs,
				totalCostUsd: parsedResult?.totalCostUsd,
				numTurns: parsedResult?.numTurns,
				inputTokens: parsedResult?.inputTokens,
				outputTokens: parsedResult?.outputTokens,
				stopReason: parsedResult?.stopReason,
				modelUsage: parsedResult?.modelUsage,
			});

			if (status === "completed") {
				resolve({ agentSessionId: sessionId, result: fullOutput });
			} else {
				reject(new Error(errorMessage));
			}
		});

		child.on("error", async (err) => {
			await store.complete(sessionId, {
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

	const args: string[] = ["--print", "--max-turns", "20", options.prompt];

	if (options.model) {
		args.push("--model", options.model);
	}

	if (options.systemPrompt) {
		args.push("--system-prompt", options.systemPrompt);
	}

	return new Promise<string>((resolve, reject) => {
		const child = spawn("claude", args, {
			cwd: options.cwd,
			stdio: ["ignore", "pipe", "pipe"],
			env: buildAgentEnv(),
		});

		let output = "";
		let stderrOutput = "";

		child.stdout.on("data", (chunk: Buffer) => {
			output += chunk.toString();
		});

		child.stderr.on("data", (chunk: Buffer) => {
			stderrOutput += chunk.toString();
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve(output.trim());
			} else {
				const detail = stderrOutput.trim() || output.trim();
				const errorMessage = `claude exited with code ${code}${detail ? `\n${detail}` : ""}`;
				log.error`${errorMessage}`;
				reject(new Error(errorMessage));
			}
		});

		child.on("error", (err) => reject(err));
	});
}

export const agent = {
	ask: askQuestion,
	run: runAgent,
};
