import type { AgentConfig } from "@agentic-kanban/core";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { dirname, resolve } from "node:path";
import {
	getAgentSessionArtifactHandler,
	getAgentSessionHandler,
	getAgentSessionMessagesHandler,
	listAgentSessionArtifactsHandler,
	listAgentSessionsHandler,
} from "./handlers/agent-sessions";
import {
	createConfigImageHandler,
	createConfigReadFileHandler,
	createConfigTreeHandler,
	createConfigWriteFileHandler,
} from "./handlers/config";
import { createGitlabWebhookHandler } from "./handlers/webhook";
import { healthRoute } from "./health";
import {
	getAgentSessionArtifactRoute,
	getAgentSessionMessagesRoute,
	getAgentSessionRoute,
	listAgentSessionArtifactsRoute,
	listAgentSessionsRoute,
} from "./agent-sessions";
import {
	configImageRoute,
	configReadFileRoute,
	configTreeRoute,
	configWriteFileRoute,
} from "./config";
import { gitlabWebhookRoute } from "./webhook";

export interface RouteContext {
	config: AgentConfig;
	configPath: string;
	secretToken?: string;
}

export function registerRoutes(app: OpenAPIHono, ctx: RouteContext): void {
	// Health
	app.openapi(healthRoute, (c) => {
		return c.json({ status: "ok" as const });
	});

	// Agent Sessions
	app.openapi(listAgentSessionsRoute, listAgentSessionsHandler);
	app.openapi(getAgentSessionRoute, getAgentSessionHandler);
	app.openapi(getAgentSessionMessagesRoute, getAgentSessionMessagesHandler);
	app.openapi(
		listAgentSessionArtifactsRoute,
		listAgentSessionArtifactsHandler,
	);
	app.openapi(
		getAgentSessionArtifactRoute,
		getAgentSessionArtifactHandler,
	);

	// Config
	const configDir = resolve(dirname(resolve(ctx.configPath)));
	app.openapi(configTreeRoute, createConfigTreeHandler(configDir));
	app.openapi(configReadFileRoute, createConfigReadFileHandler(configDir));
	app.openapi(configWriteFileRoute, createConfigWriteFileHandler(configDir));
	app.openapi(configImageRoute, createConfigImageHandler(configDir));

	// Webhook
	app.openapi(gitlabWebhookRoute, createGitlabWebhookHandler(ctx));
}
