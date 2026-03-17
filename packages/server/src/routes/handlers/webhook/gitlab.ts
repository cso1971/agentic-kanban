import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import {
	type AgentConfig,
	logger,
	store,
	type WebhookRule,
} from "@agentic-kanban/core";
import { enqueuer } from "@agentic-kanban/queue";
import type { RouteHandler } from "@hono/zod-openapi";
import type { IssueEvent } from "gitlab-event-types";
import type { RouteContext } from "#routes/index";
import type { gitlabWebhookRoute } from "#routes/webhook";

const log = logger.server;

export function createGitlabWebhookHandler(
	ctx: RouteContext,
): RouteHandler<typeof gitlabWebhookRoute> {
	return async (c) => {
		if (ctx.secretToken) {
			const token = c.req.header("x-gitlab-token");
			if (token !== ctx.secretToken) {
				return c.json({ error: "Unauthorized" as const }, 401);
			}
		}

		// const rawPayload = await c.req.json();
		// log.info`Webhook payload: ${JSON.stringify(rawPayload, null, 2)}`;

		const payload = c.req.valid("json") as unknown as IssueEvent;

		const addedLabels = getAddedLabels(payload);

		const rule = matchWebhookToPrompt(payload, addedLabels, ctx.config);

		if (!rule) {
			log.info`No matching rule for added labels ${addedLabels} with available ${ctx.config.rules.map((r) => r.label)}`;

			return c.json(
				{ status: "ignored" as const, reason: "no matching rule" },
				200,
			);
		}

		const agentSessionId = randomUUID();
		const workingDir = await store.workingDirectory(agentSessionId);
		const configDir = dirname(resolve(ctx.configPath));
		const promptPath = resolve(configDir, rule.prompt);

		log.info`Matched rule: label="${rule.label}" -> prompt="${rule.prompt}"`;
		log.info`Working directory: ${workingDir}`;

		const jobId = await enqueuer.enqueueAgentJob(
			agentSessionId,
			workingDir,
			promptPath,
			{
				projectId: String(payload.project?.id ?? ""),
				issueId: String(payload.object_attributes?.iid ?? ""),
				issueTitle: payload.object_attributes?.title ?? "",
				issueDescription: payload.object_attributes?.description ?? "",
			},
		);

		log.info`Queued job ${jobId} for rule="${rule.label}"`;

		return c.json(
			{
				status: "accepted" as const,
				matched_rule: { label: rule.label, prompt: rule.prompt },
				jobId,
				agentSessionId,
			},
			200,
		);
	};
}

function getAddedLabels(payload: IssueEvent): string[] {
  console.log(payload);
  
	console.log(payload.changes.labels);
  
	const previousLabels = new Set(
		(payload.changes?.labels?.previous ?? []).map((l) => l.title),
	);

	const currentLabels = (payload.changes?.labels?.current ?? []).map(
		(l) => l.title,
	);

	console.log("Previous labels:", previousLabels);
	console.log("Current labels:", currentLabels);

	return currentLabels.filter((title) => !previousLabels.has(title));
}

function matchWebhookToPrompt(
	payload: IssueEvent,
	addedLabels: string[],
	config: AgentConfig,
): WebhookRule | null {
	const eventType = payload.object_kind;
	const action = payload.object_attributes?.action;

	for (const rule of config.rules) {
		if (rule.event !== eventType) continue;
		if (rule.action && rule.action !== action) continue;

		if (addedLabels.includes(rule.label)) {
			return rule;
		}
	}

	return null;
}
