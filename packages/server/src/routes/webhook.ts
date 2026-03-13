import { createRoute } from "@hono/zod-openapi";
import {
	GitLabWebhookPayloadSchema,
	WebhookAcceptedResponseSchema,
	WebhookIgnoredResponseSchema,
	WebhookUnauthorizedResponseSchema,
} from "../schemas/webhook";

export const gitlabWebhookRoute = createRoute({
	method: "post",
	path: "/webhook/gitlab",
	tags: ["Webhook"],
	summary: "GitLab webhook endpoint",
	description:
		"Receives GitLab webhook events and triggers agent invocations based on configured rules",
	request: {
		body: {
			content: {
				"application/json": {
					schema: GitLabWebhookPayloadSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Webhook processed",
			content: {
				"application/json": {
					schema: WebhookAcceptedResponseSchema.or(WebhookIgnoredResponseSchema),
				},
			},
		},
		401: {
			description: "Unauthorized - invalid or missing X-Gitlab-Token",
			content: {
				"application/json": {
					schema: WebhookUnauthorizedResponseSchema,
				},
			},
		},
	},
});
