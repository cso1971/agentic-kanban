import { type AgentConfig, logger } from "@agentic-kanban/core";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { registerBullBoard } from "#bull-board";
import { registerRoutes } from "#routes/index";

const log = logger.server;

interface AppOptions {
	config: AgentConfig;
	configPath: string;
	secretToken?: string;
}

export function createApp(options: AppOptions): OpenAPIHono {
	const app = new OpenAPIHono();

	// Request logging middleware
	app.use("*", async (c, next) => {
		const start = performance.now();
		const method = c.req.method;
		const path = c.req.path;

		log.info`--> ${method} ${path}`;

		await next();

		const elapsed = (performance.now() - start).toFixed(1);
		const status = c.res.status;

		log.info`<-- ${method} ${path} ${status} ${elapsed}ms`;
	});

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
