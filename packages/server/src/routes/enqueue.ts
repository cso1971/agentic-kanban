import { createRoute } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "#schemas/common.ts";
import { EnqueueBodySchema, EnqueueResponseSchema } from "#schemas/enqueue.ts";

export const enqueueRoute = createRoute({
	method: "post",
	path: "/api/enqueue",
	tags: ["Enqueue"],
	summary: "Enqueue an agent run",
	description:
		"Manually enqueue an agent job by selecting a prompt file and providing template variables",
	request: {
		body: {
			content: {
				"application/json": {
					schema: EnqueueBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Job enqueued successfully",
			content: {
				"application/json": {
					schema: EnqueueResponseSchema,
				},
			},
		},
		400: {
			description: "Invalid request",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
