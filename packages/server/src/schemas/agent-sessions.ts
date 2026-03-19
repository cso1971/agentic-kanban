import { z } from "@hono/zod-openapi";

export const AgentSessionSchema = z
	.object({
		id: z.string(),
		status: z.enum(["running", "completed", "failed"]),
		prompt: z.string(),
		cwd: z.string(),
		startedAt: z.string(),
		completedAt: z.string().optional(),
		result: z.string().optional(),
		error: z.string().optional(),
		durationMs: z.number().optional(),
		totalCostUsd: z.number().optional(),
		numTurns: z.number().optional(),
		model: z.string().optional(),
		jobId: z.string().optional(),
	})
	.openapi("AgentSession");

const ParsedAssistantTextSchema = z.object({
	type: z.literal("assistant_text"),
	text: z.string(),
	messageId: z.string(),
});

const ParsedToolUseSchema = z.object({
	type: z.literal("tool_use"),
	toolName: z.string(),
	toolUseId: z.string(),
	input: z.record(z.string(), z.unknown()),
});

const ParsedToolResultSchema = z.object({
	type: z.literal("tool_result"),
	toolUseId: z.string(),
	content: z.string(),
	isError: z.boolean(),
});

const ParsedTaskProgressSchema = z.object({
	type: z.literal("task_progress"),
	taskId: z.string(),
	description: z.string(),
	toolName: z.string().optional(),
	usage: z.object({
		totalTokens: z.number(),
		toolUses: z.number(),
		durationMs: z.number(),
	}),
});

const ParsedTaskNotificationSchema = z.object({
	type: z.literal("task_notification"),
	taskId: z.string(),
	status: z.enum(["completed", "failed", "stopped"]),
	summary: z.string(),
});

const ParsedResultSchema = z.object({
	type: z.literal("result"),
	subtype: z.string(),
	result: z.string().optional(),
	error: z.string().optional(),
	durationMs: z.number(),
	totalCostUsd: z.number(),
	numTurns: z.number(),
});

const ParsedInitSchema = z.object({
	type: z.literal("init"),
	model: z.string(),
	sessionId: z.string(),
	tools: z.array(z.string()),
});

const ParsedUnknownSchema = z.object({
	type: z.literal("unknown"),
	sdkType: z.string(),
	raw: z.unknown(),
});

const ParsedMessageSchema = z
	.discriminatedUnion("type", [
		ParsedAssistantTextSchema,
		ParsedToolUseSchema,
		ParsedToolResultSchema,
		ParsedTaskProgressSchema,
		ParsedTaskNotificationSchema,
		ParsedResultSchema,
		ParsedInitSchema,
		ParsedUnknownSchema,
	])
	.openapi("ParsedMessage");

export const AgentSessionMessageSchema = z
	.object({
		timestamp: z.string(),
		type: z.string(),
		message: ParsedMessageSchema.optional(),
		raw: z.unknown(),
	})
	.openapi("AgentSessionMessage");

export const AgentSessionIdParamSchema = z.object({
	id: z
		.string()
		.openapi({ description: "Agent Session ID", example: "sess_123" }),
});

export const ArtifactFileSchema = z
	.object({
		name: z.string(),
		size: z.number(),
		modifiedAt: z.string(),
	})
	.openapi("ArtifactFile");

export const ArtifactContentQuerySchema = z.object({
	path: z.string().openapi({
		description: "Relative path within the artifacts directory",
		example: "report.md",
	}),
});

export const ArtifactContentSchema = z
	.object({
		name: z.string(),
		content: z.string(),
	})
	.openapi("ArtifactContent");
