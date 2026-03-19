import { createRoute } from "@hono/zod-openapi";
import { IntegrationsResponseSchema } from "#schemas/integrations.ts";

export const integrationsRoute = createRoute({
	method: "get",
	path: "/api/integrations",
	tags: ["Integrations"],
	summary: "Get integrations status",
	description: "Returns the config directory path and GitLab connection status",
	responses: {
		200: {
			description: "Integrations status",
			content: {
				"application/json": {
					schema: IntegrationsResponseSchema,
				},
			},
		},
	},
});
