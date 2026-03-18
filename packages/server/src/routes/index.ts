import type { AgentConfig } from "@agentic-kanban/core";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { dirname, resolve } from "node:path";
import {
	getAgentSessionArtifactHandler,
	getAgentSessionHandler,
	getAgentSessionMessagesHandler,
	listAgentSessionArtifactsHandler,
	listAgentSessionsHandler,
} from "#routes/handlers/agent-sessions/index.ts";
import {
	createConfigImageHandler,
	createConfigReadFileHandler,
	createConfigTreeHandler,
	createConfigValidateSkillHandler,
	createConfigWriteFileHandler,
} from "#routes/handlers/config/index.ts";
import { createGitlabWebhookHandler } from "#routes/handlers/webhook/index.ts";
import { healthRoute } from "#routes/health.ts";
import {
	getAgentSessionArtifactRoute,
	getAgentSessionMessagesRoute,
	getAgentSessionRoute,
	listAgentSessionArtifactsRoute,
	listAgentSessionsRoute,
} from "#routes/agent-sessions.ts";
import {
	configImageRoute,
	configReadFileRoute,
	configTreeRoute,
	configValidateSkillRoute,
	configWriteFileRoute,
} from "#routes/config.ts";
import { gitlabWebhookRoute } from "#routes/webhook.ts";

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
	app.openapi(
		configValidateSkillRoute,
		createConfigValidateSkillHandler(configDir),
	);

	// Webhook
	app.openapi(gitlabWebhookRoute, createGitlabWebhookHandler(ctx));
}
