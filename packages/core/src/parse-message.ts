import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { logger } from "#logger.ts";

export type ParsedMessage =
	| ParsedAssistantText
	| ParsedToolUse
	| ParsedToolResult
	| ParsedTaskProgress
	| ParsedTaskNotification
	| ParsedResult
	| ParsedInit
	| ParsedUnknown;

export interface ParsedAssistantText {
	type: "assistant_text";
	text: string;
	messageId: string;
}

export interface ParsedToolUse {
	type: "tool_use";
	toolName: string;
	toolUseId: string;
	input: Record<string, unknown>;
}

export interface ParsedToolResult {
	type: "tool_result";
	toolUseId: string;
	content: string;
	isError: boolean;
}

export interface ParsedTaskProgress {
	type: "task_progress";
	taskId: string;
	description: string;
	toolName?: string;
	usage: { totalTokens: number; toolUses: number; durationMs: number };
}

export interface ParsedTaskNotification {
	type: "task_notification";
	taskId: string;
	status: "completed" | "failed" | "stopped";
	summary: string;
}

export interface ModelUsageInfo {
	inputTokens: number;
	outputTokens: number;
	cacheReadInputTokens: number;
	cacheCreationInputTokens: number;
	costUsd: number;
}

export interface ParsedResult {
	type: "result";
	subtype: "success" | string;
	result?: string;
	error?: string;
	durationMs: number;
	durationApiMs: number;
	totalCostUsd: number;
	numTurns: number;
	inputTokens: number;
	outputTokens: number;
	stopReason: string | null;
	modelUsage: Record<string, ModelUsageInfo>;
}

export interface ParsedInit {
	type: "init";
	model: string;
	sessionId: string;
	tools: string[];
}

export interface ParsedUnknown {
	type: "unknown";
	sdkType: string;
	raw: SDKMessage;
}

/**
 * Extracts the human-readable text portion from a parsed message.
 * Returns an empty string for message types that have no meaningful text.
 */
export function extractText(message: ParsedMessage | undefined): string {
	if (!message) return "";
	switch (message.type) {
		case "assistant_text":
			return message.text;
		case "result":
			return message.result ?? message.error ?? "";
		case "task_notification":
			return message.summary;
		default:
			return "";
	}
}

export function parseMessage(
	json: string | undefined,
): ParsedMessage | undefined {
	if (!json) return undefined;
	try {
		const msg = JSON.parse(json) as SDKMessage;
		return parseSDKMessage(msg);
	} catch (error) {
		logger.core.error`Failed to parse message JSON: ${error}`;
		return undefined;
	}
}

export function parseSDKMessage(msg: SDKMessage): ParsedMessage {
	switch (msg.type) {
		case "assistant": {
			const content = msg.message.content;

			if (!Array.isArray(content) || content.length === 0) {
				return { type: "unknown", sdkType: "assistant", raw: msg };
			}

			const block = content[content.length - 1];

			if (block.type === "text") {
				return {
					type: "assistant_text",
					text: block.text,
					messageId: msg.message.id,
				};
			}

			if (block.type === "tool_use") {
				return {
					type: "tool_use",
					toolName: block.name,
					toolUseId: block.id,
					input: block.input as Record<string, unknown>,
				};
			}

			return { type: "unknown", sdkType: "assistant", raw: msg };
		}

		case "user": {
			const content = msg.message.content;
			const blocks = Array.isArray(content) ? content : [];
			const block = blocks[0];

			if (
				block &&
				typeof block === "object" &&
				"type" in block &&
				block.type === "tool_result"
			) {
				return {
					type: "tool_result",
					toolUseId: (block as { tool_use_id: string }).tool_use_id,
					content:
						typeof block.content === "string"
							? block.content
							: JSON.stringify(block.content),
					isError: (block as { is_error?: boolean }).is_error ?? false,
				};
			}

			return { type: "unknown", sdkType: "user", raw: msg };
		}

		case "system": {
			if (msg.subtype === "init") {
				return {
					type: "init",
					model: (msg as Record<string, unknown>).model as string,
					sessionId: (msg as Record<string, unknown>).session_id as string,
					tools: (msg as Record<string, unknown>).tools as string[],
				};
			}

			if (msg.subtype === "task_progress") {
				return {
					type: "task_progress",
					taskId: msg.task_id,
					description: msg.description,
					toolName: msg.last_tool_name,
					usage: {
						totalTokens: msg.usage.total_tokens,
						toolUses: msg.usage.tool_uses,
						durationMs: msg.usage.duration_ms,
					},
				};
			}

			if (msg.subtype === "task_notification") {
				return {
					type: "task_notification",
					taskId: msg.task_id,
					status: msg.status,
					summary: msg.summary,
				};
			}

			return { type: "unknown", sdkType: `system/${msg.subtype}`, raw: msg };
		}

		case "result": {
			const modelUsage: Record<string, ModelUsageInfo> = {};
			if (msg.modelUsage) {
				for (const [model, usage] of Object.entries(msg.modelUsage)) {
					modelUsage[model] = {
						inputTokens: usage.inputTokens,
						outputTokens: usage.outputTokens,
						cacheReadInputTokens: usage.cacheReadInputTokens,
						cacheCreationInputTokens: usage.cacheCreationInputTokens,
						costUsd: usage.costUSD,
					};
				}
			}

			return {
				type: "result",
				subtype: msg.subtype,
				result: msg.subtype === "success" ? msg.result : undefined,
				error: msg.subtype !== "success" ? msg.subtype : undefined,
				durationMs: msg.duration_ms,
				durationApiMs: msg.duration_api_ms,
				totalCostUsd: msg.total_cost_usd,
				numTurns: msg.num_turns,
				inputTokens: msg.usage.input_tokens,
				outputTokens: msg.usage.output_tokens,
				stopReason: msg.stop_reason,
				modelUsage,
			};
		}

		default:
			return { type: "unknown", sdkType: msg.type, raw: msg };
	}
}
