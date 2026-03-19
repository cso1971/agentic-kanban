import { z } from "@hono/zod-openapi";

export const EnqueueBodySchema = z
	.object({
		promptPath: z
			.string()
			.optional()
			.describe(
				"Relative path to the prompt .md file within the config directory",
			),
		promptText: z
			.string()
			.optional()
			.describe("Raw prompt text to use directly instead of a file"),
		projectId: z.string().default(""),
		issueId: z.string().optional(),
		issueTitle: z.string().optional(),
		issueDescription: z.string().optional(),
		mrIid: z.string().optional(),
		mrTitle: z.string().optional(),
		sourceBranch: z.string().optional(),
		reviewerName: z.string().optional(),
		discussionId: z.string().optional(),
		reviewComment: z.string().optional(),
	})
	.openapi("EnqueueBody");

export const EnqueueResponseSchema = z
	.object({
		status: z.literal("accepted"),
		jobId: z.string(),
		agentSessionId: z.string(),
		promptPath: z.string(),
	})
	.openapi("EnqueueResponse");
