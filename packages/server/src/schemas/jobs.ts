import { z } from "@hono/zod-openapi";

export const CreateJobRequestSchema = z
	.object({
		prompt: z
			.string()
			.openapi({ description: "The prompt to send to the agent" }),
		cwd: z.string().openapi({ description: "Working directory for the agent" }),
		allowedTools: z.array(z.string()).optional(),
		permissionMode: z
			.enum(["default", "plan", "acceptEdits", "bypassPermissions"])
			.optional(),
		maxTurns: z.number().optional(),
		model: z.string().optional(),
		systemPrompt: z.string().optional(),
	})
	.openapi("CreateJobRequest");

export const JobResponseSchema = z
	.object({
		jobId: z.string(),
		agentSessionId: z.string(),
		status: z.string(),
	})
	.openapi("JobResponse");

export const JobStatusSchema = z
	.object({
		jobId: z.string(),
		agentSessionId: z.string(),
		status: z.string(),
		progress: z.number().optional(),
		failedReason: z.string().optional(),
		finishedOn: z.number().optional(),
		processedOn: z.number().optional(),
		attemptsMade: z.number().optional(),
	})
	.openapi("JobStatus");

export const JobIdParamSchema = z.object({
	jobId: z.string().openapi({ description: "Job ID", example: "job_123" }),
});

export const JobListQuerySchema = z.object({
	status: z
		.enum(["waiting", "active", "completed", "failed", "delayed"])
		.optional(),
});
