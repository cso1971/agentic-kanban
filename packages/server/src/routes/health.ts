import { createRoute } from "@hono/zod-openapi";
import { HealthResponseSchema } from "#schemas/health";

export const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	summary: "Health check",
	description: "Returns the health status of the server",
	responses: {
		200: {
			description: "Server is healthy",
			content: {
				"application/json": {
					schema: HealthResponseSchema,
				},
			},
		},
	},
});
