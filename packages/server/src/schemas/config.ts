import { z } from "@hono/zod-openapi";

export const ConfigTreeNodeSchema: z.ZodType = z.lazy(() =>
	z
		.object({
			name: z.string(),
			path: z.string(),
			type: z.enum(["file", "directory"]),
			children: z.array(ConfigTreeNodeSchema).optional(),
		})
		.openapi("ConfigTreeNode"),
);

export const ConfigTreeResponseSchema = z
	.object({
		tree: z.array(ConfigTreeNodeSchema),
	})
	.openapi("ConfigTreeResponse");

export const ConfigFileQuerySchema = z.object({
	path: z.string().openapi({ description: "Relative path within config directory", example: "agents/it-architect/agent.md" }),
});

export const ConfigFileResponseSchema = z
	.object({
		path: z.string(),
		content: z.string(),
		mimeType: z.string(),
	})
	.openapi("ConfigFileResponse");

export const ConfigFileWriteBodySchema = z
	.object({
		content: z.string(),
	})
	.openapi("ConfigFileWriteBody");

export const ConfigFileWriteResponseSchema = z
	.object({
		path: z.string(),
		success: z.boolean(),
	})
	.openapi("ConfigFileWriteResponse");
