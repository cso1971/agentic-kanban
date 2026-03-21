import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import {
	type AgentConfig,
	logger,
	store,
	type WebhookRule,
} from "@agentic-kanban/core";
import { type EnqueuePayload, enqueuer } from "@agentic-kanban/queue";
import type { RouteHandler } from "@hono/zod-openapi";
import type { CommentEvent, IssueEvent } from "gitlab-event-types";
import type { RouteContext } from "#routes/index.ts";
import type { gitlabWebhookRoute } from "#routes/webhook.ts";

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

		const payload = c.req.valid("json") as unknown as IssueEvent | CommentEvent;

		const eventType = payload.object_kind;

		if (eventType === "note") {
			return handleNoteEvent(c, payload as CommentEvent, ctx);
		}

		return handleIssueEvent(c, payload as IssueEvent, ctx);
	};
}

async function handleIssueEvent(
	c: Parameters<RouteHandler<typeof gitlabWebhookRoute>>[0],
	payload: IssueEvent,
	ctx: RouteContext,
) {
	const addedLabels = getAddedLabels(payload);
	const rule = matchIssueRule(payload, addedLabels, ctx.config);

	if (!rule) {
		log.info`No matching rule for added labels ${addedLabels}`;
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
		rule.plugins,
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
}

async function handleNoteEvent(
	c: Parameters<RouteHandler<typeof gitlabWebhookRoute>>[0],
	payload: CommentEvent,
	ctx: RouteContext,
) {
	const noteAttrs = payload.object_attributes;
	const rule = matchNoteRule(payload, ctx.config);

	if (!rule) {
		log.info`No matching note rule for noteable_type="${noteAttrs.noteable_type}"`;
		return c.json(
			{ status: "ignored" as const, reason: "no matching rule" },
			200,
		);
	}

	const mr = payload.merge_request;
	if (!mr) {
		log.info`Note event matched but no merge_request data present`;
		return c.json(
			{ status: "ignored" as const, reason: "no merge request context" },
			200,
		);
	}

	const agentSessionId = randomUUID();
	const workingDir = await store.workingDirectory(agentSessionId);
	const configDir = dirname(resolve(ctx.configPath));
	const promptPath = resolve(configDir, rule.prompt);

	const enqueuePayload: EnqueuePayload = {
		projectId: String(payload.project?.id ?? ""),
		mrIid: String(mr.iid ?? ""),
		mrTitle: mr.title ?? "",
		sourceBranch: mr.source_branch ?? "",
		reviewerName: payload.user?.name ?? payload.user?.username ?? "",
		discussionId:
			((noteAttrs as unknown as Record<string, unknown>)
				.discussion_id as string) ?? "",
		reviewComment: noteAttrs.note ?? "",
	};

	log.info`Matched note rule -> prompt="${rule.prompt}" on MR !${enqueuePayload.mrIid}`;

	const jobId = await enqueuer.enqueueAgentJob(
		agentSessionId,
		workingDir,
		promptPath,
		enqueuePayload,
		rule.plugins,
	);

	log.info`Queued job ${jobId} for note on MR !${enqueuePayload.mrIid}`;

	return c.json(
		{
			status: "accepted" as const,
			matched_rule: { prompt: rule.prompt },
			jobId,
			agentSessionId,
		},
		200,
	);
}

function getAddedLabels(payload: IssueEvent): string[] {
	const previousLabels = new Set(
		(payload.changes?.labels?.previous ?? []).map((l) => l.title),
	);

	const currentLabels = (payload.changes?.labels?.current ?? []).map(
		(l) => l.title,
	);

	return currentLabels.filter((title) => !previousLabels.has(title));
}

function matchIssueRule(
	payload: IssueEvent,
	addedLabels: string[],
	config: AgentConfig,
): WebhookRule | null {
	const eventType = payload.object_kind;
	const action = payload.object_attributes?.action;

	for (const rule of config.rules) {
		if (rule.event !== eventType) continue;
		if (rule.action && rule.action !== action) continue;
		if (rule.label && addedLabels.includes(rule.label)) {
			return rule;
		}
	}

	return null;
}

function matchNoteRule(
	payload: CommentEvent,
	config: AgentConfig,
): WebhookRule | null {
	const noteAttrs = payload.object_attributes;

	for (const rule of config.rules) {
		if (rule.event !== "note") continue;
		if (rule.action && rule.action !== noteAttrs.action) continue;
		if (rule.noteable_type && rule.noteable_type !== noteAttrs.noteable_type) {
			continue;
		}
		return rule;
	}

	return null;
}
