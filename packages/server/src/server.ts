// Load .env file (Bun automatically loads .env files when this is imported at the top)
import "bun";

import { loadConfig, logger } from "@agentic-kanban/core";
import { createApp } from "./app";

const log = logger.server;

const CONFIG_PATH = Bun.env.SERVER_AGENT_CONFIG ?? "./config.json";
const PORT = Number.parseInt(Bun.env.SERVER_PORT ?? "3000", 10);
const GITLAB_SECRET_TOKEN = Bun.env.GITLAB_SECRET_TOKEN;

const config = await loadConfig(CONFIG_PATH);
log.info`Loaded config from ${CONFIG_PATH} with ${config.rules.length} rules`;

const app = createApp({
	config,
	configPath: CONFIG_PATH,
	secretToken: GITLAB_SECRET_TOKEN,
});

const server = Bun.serve({
	port: PORT,
	fetch: app.fetch,
});

log.info`Server listening on http://localhost:${server.port}`;
log.info`Swagger UI available at http://localhost:${server.port}`;
log.info`OpenAPI spec at http://localhost:${server.port}/openapi.json`;
log.info`BullBoard spec at http://localhost:${server.port}/queues`;
