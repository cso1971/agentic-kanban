import { z } from "@hono/zod-openapi";

export const InvocationSchema = z
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
	})
	.openapi("Invocation");

export const InvocationMessageSchema = z
	.object({
		timestamp: z.string(),
		type: z.string(),
		text: z.string().optional(),
		raw: z.unknown(),
	})
	.openapi("InvocationMessage");

export const InvocationIdParamSchema = z.object({
	id: z.string().openapi({ description: "Invocation ID", example: "inv_123" }),
});
