import { z } from "@hono/zod-openapi";

const LabelSchema = z.object({
	title: z.string(),
});

export const GitLabWebhookPayloadSchema = z
	.object({
		object_kind: z.string(),
		object_attributes: z
			.object({
				action: z.string().optional(),
				labels: z.array(LabelSchema).optional(),
			})
			.optional(),
		labels: z.array(LabelSchema).optional(),
		changes: z
			.object({
				labels: z
					.object({
						previous: z.array(LabelSchema).optional(),
						current: z.array(LabelSchema).optional(),
					})
					.optional(),
			})
			.optional(),
		project: z
			.object({
				path_with_namespace: z.string().optional(),
			})
			.optional(),
	})
	.openapi("GitLabWebhookPayload");

export const WebhookAcceptedResponseSchema = z
	.object({
		status: z.literal("accepted"),
		matched_rule: z.object({
			label: z.string(),
			prompt: z.string(),
		}),
	})
	.openapi("WebhookAcceptedResponse");

export const WebhookIgnoredResponseSchema = z
	.object({
		status: z.literal("ignored"),
		reason: z.string(),
	})
	.openapi("WebhookIgnoredResponse");

export const WebhookUnauthorizedResponseSchema = z
	.object({
		error: z.literal("Unauthorized"),
	})
	.openapi("WebhookUnauthorizedResponse");
