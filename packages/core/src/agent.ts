import {
	type Options,
	query,
	type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { randomUUID } from "crypto";
import {
	appendMessage,
	completeInvocation,
	createInvocation,
	type InvocationMessage,
} from "./store";
import { logger } from "./logger";

export interface RunAgentOptions {
	prompt: string;
	cwd: string;
	allowedTools?: string[];
	permissionMode?: "default" | "plan" | "acceptEdits" | "bypassPermissions";
	maxTurns?: number;
	model?: string;
	systemPrompt?: string;
}

export interface RunAgentResult {
	invocationId: string;
	result: string;
}

function extractText(message: SDKMessage): string | undefined {
	if (message.type === "assistant") {
		const blocks = message.message?.content;
		if (Array.isArray(blocks)) {
			return blocks
				.filter((b: any) => b.type === "text")
				.map((b: any) => b.text)
				.join("\n");
		}
	}

	if (message.type === "result" && "result" in message) {
		return message.result;
	}

	return undefined;
}

export async function runAgent(
	options: RunAgentOptions,
): Promise<RunAgentResult> {
	const invocationId = randomUUID();
	await createInvocation(invocationId, options.prompt, options.cwd);

	const bypassPermissions =
		options.permissionMode === "bypassPermissions" || !options.permissionMode;

	const agentOptions: Options = {
		cwd: options.cwd,
		allowedTools: options.allowedTools ?? [
			"Read",
			"Write",
			"Edit",
			"Bash",
			"Glob",
			"Grep",
		],
		permissionMode: options.permissionMode ?? "bypassPermissions",
		allowDangerouslySkipPermissions: bypassPermissions,
		maxTurns: options.maxTurns ?? 30,
		model: options.model,
		systemPrompt: options.systemPrompt,
	};

	let result = "";
	let durationMs: number | undefined;
	let totalCostUsd: number | undefined;
	let numTurns: number | undefined;

	try {
		for await (const message of query({
			prompt: options.prompt,
			options: agentOptions,
		})) {
			logger.core.debug`Agent message: ${message}`;

			const text = extractText(message);

			const invMsg: InvocationMessage = {
				timestamp: new Date().toISOString(),
				type: message.type,
				text,
				raw: message,
			};

			await appendMessage(invocationId, invMsg);

			if (message.type === "result" && "result" in message) {
				result = message.result ?? "";
				durationMs = message.duration_ms;
				totalCostUsd = message.total_cost_usd;
				numTurns = message.num_turns;
			}
		}

		await completeInvocation(invocationId, {
			status: "completed",
			result,
			durationMs,
			totalCostUsd,
			numTurns,
			model: options.model,
		});
	} catch (err) {
		await completeInvocation(invocationId, {
			status: "failed",
			error: err instanceof Error ? err.message : String(err),
		});
		throw err;
	}

	return { invocationId, result };
}
