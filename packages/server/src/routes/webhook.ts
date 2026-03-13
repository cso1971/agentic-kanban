import { createRoute, z } from "@hono/zod-openapi";

export const gitlabWebhookRoute = createRoute({
	method: "post",
	path: "/webhook/gitlab",
	tags: ["Webhook"],
	summary: "GitLab webhook endpoint",
	description:
		"Receives GitLab webhook events and triggers agent sessions based on configured rules",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.any(),
				},
			},
		},
	},
	responses: {
		200: {
			description: "Webhook processed",
			content: {
				"application/json": {
					schema: z.any(),
				},
			},
		},
		401: {
			description: "Unauthorized - invalid or missing X-Gitlab-Token",
			content: {
				"application/json": {
					schema: z.any(),
				},
			},
		},
	},
});
