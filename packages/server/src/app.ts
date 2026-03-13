import type { AgentConfig } from "@agentic-kanban/core";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { registerBullBoard } from "./bull-board";
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
			allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
			allowHeaders: ["Content-Type", "X-Gitlab-Token"],
		}),
	);

	// Register all routes
	registerRoutes(app, {
		config: options.config,
		configPath: options.configPath,
		secretToken: options.secretToken,
	});

	// Bull Board for queue monitoring
	registerBullBoard(app);

	// OpenAPI spec endpoint
	app.doc("/openapi.json", {
		openapi: "3.1.0",
		info: {
			title: "Agents API",
			version: "0.1.0",
			description:
				"API for managing agent sessions triggered by GitLab webhooks",
		},
	});

	// Swagger UI
	app.get("/", swaggerUI({ url: "/openapi.json" }));

	return app;
}
