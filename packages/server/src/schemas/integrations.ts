import { z } from "@hono/zod-openapi";

export const IntegrationsResponseSchema = z
	.object({
		configDir: z.string(),
		gitlab: z.object({
			url: z.string(),
			connected: z.boolean(),
		}),
	})
	.openapi("IntegrationsResponse");
