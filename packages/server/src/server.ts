// Load .env file (Bun automatically loads .env files when this is imported at the top)
import "bun";

import { loadConfig, setupLogger, logger } from "@agents/core";
import { createApp } from "./app";

await setupLogger();

const log = logger.server;

const CONFIG_PATH = Bun.env.AGENT_CONFIG ?? "./agent-config.json";
const PORT = Number.parseInt(Bun.env.PORT ?? "3000", 10);
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
log.info`Swagger UI available at http://localhost:${server.port}/docs`;
log.info`OpenAPI spec at http://localhost:${server.port}/openapi.json`;
