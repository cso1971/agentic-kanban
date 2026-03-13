import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import type { AgentConfig } from "@agents/core";
import { registerRoutes } from "./routes";

interface AppOptions {
	config: AgentConfig;
	configPath: string;
	secretToken?: string;
}

export function createApp(options: AppOptions): OpenAPIHono {
	const app = new OpenAPIHono();

	// CORS middleware
	app.use(
		"*",
		cors({
			origin: "*",
			allowMethods: ["GET", "POST", "OPTIONS"],
			allowHeaders: ["Content-Type", "X-Gitlab-Token"],
		}),
	);

	// Register all routes
	registerRoutes(app, {
		config: options.config,
		configPath: options.configPath,
		secretToken: options.secretToken,
	});

	// OpenAPI spec endpoint
	app.doc("/openapi.json", {
		openapi: "3.1.0",
		info: {
			title: "Agents API",
			version: "0.1.0",
			description: "API for managing agent invocations triggered by GitLab webhooks",
		},
	});

	// Swagger UI
	app.get("/docs", swaggerUI({ url: "/openapi.json" }));

	return app;
}
