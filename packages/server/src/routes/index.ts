import type { OpenAPIHono } from "@hono/zod-openapi";
import {
	type AgentConfig,
	getInvocation,
	getInvocationMessages,
	listInvocations,
	loadPrompt,
	matchWebhookToPrompt,
	runAgent,
	logger,
} from "@agents/core";
import { dirname, resolve } from "path";

const log = logger.server;
import { healthRoute } from "./health";
import {
	getInvocationMessagesRoute,
	getInvocationRoute,
	listInvocationsRoute,
} from "./invocations";
import { gitlabWebhookRoute } from "./webhook";

interface RouteContext {
	config: AgentConfig;
	configPath: string;
	secretToken?: string;
}

export function registerRoutes(app: OpenAPIHono, ctx: RouteContext): void {
	// Health
	app.openapi(healthRoute, (c) => {
		return c.json({ status: "ok" as const });
	});

	// Invocations
	app.openapi(listInvocationsRoute, async (c) => {
		const invocations = await listInvocations();
		return c.json(invocations);
	});

	app.openapi(getInvocationRoute, async (c) => {
		const { id } = c.req.valid("param");
		const invocation = await getInvocation(id);
		if (!invocation) {
			return c.json({ error: "not found" }, 404);
		}
		return c.json(invocation, 200);
	});

	app.openapi(getInvocationMessagesRoute, async (c) => {
		const { id } = c.req.valid("param");
		const messages = await getInvocationMessages(id);
		return c.json(messages);
	});

	// Webhook
	app.openapi(gitlabWebhookRoute, async (c) => {
		if (ctx.secretToken) {
			const token = c.req.header("x-gitlab-token");
			if (token !== ctx.secretToken) {
				return c.json({ error: "Unauthorized" as const }, 401);
			}
		}

		const payload = c.req.valid("json");
		const rule = matchWebhookToPrompt(payload, ctx.config);

		if (!rule) {
			return c.json({ status: "ignored" as const, reason: "no matching rule" }, 200);
		}

		const configDir = dirname(resolve(ctx.configPath));
		const promptPath = resolve(configDir, rule.prompt);
		const workingDir = resolve(
			configDir,
			(rule.workingDirectory ?? ".").replace(
				"{{project_path}}",
				payload.project?.path_with_namespace ?? "unknown",
			),
		);

		log.info`Matched rule: label="${rule.label}" -> prompt="${rule.prompt}"`;
		log.info`Working directory: ${workingDir}`;

		// Fire-and-forget: run agent in background
		(async () => {
			try {
				const promptContent = await loadPrompt(promptPath);
				const { invocationId, result } = await runAgent({
					prompt: promptContent,
					cwd: workingDir,
				});
				log.info`Agent completed (${invocationId}) for label="${rule.label}": ${result.slice(0, 200)}`;
			} catch (err) {
				log.error`Agent failed for label="${rule.label}": ${err}`;
			}
		})();

		return c.json({
			status: "accepted" as const,
			matched_rule: { label: rule.label, prompt: rule.prompt },
		}, 200);
	});
}
