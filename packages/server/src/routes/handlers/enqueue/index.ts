import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { logger, store } from "@agentic-kanban/core";
import {
	AGENT_QUEUE_NAME,
	enqueuer,
	getAgentQueue,
} from "@agentic-kanban/queue";
import type { RouteHandler } from "@hono/zod-openapi";
import type { enqueueRoute } from "#routes/enqueue.ts";

const log = logger.server;

export function createEnqueueHandler(
	configDir: string,
): RouteHandler<typeof enqueueRoute> {
	return async (c) => {
		const body = c.req.valid("json");

		if (!body.promptPath && !body.promptText) {
			return c.json(
				{ error: "Either promptPath or promptText is required" },
				400,
			);
		}

		const agentSessionId = randomUUID();
		const workingDir = await store.workingDirectory(agentSessionId);

		let jobId: string;

		if (body.promptText) {
			log.info`Manual enqueue (text): session=${agentSessionId}`;

			const queue = getAgentQueue();
			const job = await queue.add(AGENT_QUEUE_NAME, {
				type: "agent",
				prompt: body.promptText,
				model: "haiku",
				cwd: workingDir,
				agentSessionId,
			});
			jobId = job.id ?? "";
		} else {
			const promptPath = resolve(configDir, body.promptPath ?? "");

			if (!promptPath.startsWith(configDir)) {
				return c.json({ error: "Invalid prompt path" }, 400);
			}

			log.info`Manual enqueue (file): prompt="${body.promptPath}" session=${agentSessionId}`;

			jobId = await enqueuer.enqueueAgentJob(
				agentSessionId,
				workingDir,
				promptPath,
				{
					projectId: body.projectId ?? "",
					issueId: body.issueId,
					issueTitle: body.issueTitle,
					issueDescription: body.issueDescription,
					mrIid: body.mrIid,
					mrTitle: body.mrTitle,
					sourceBranch: body.sourceBranch,
					reviewerName: body.reviewerName,
					discussionId: body.discussionId,
					reviewComment: body.reviewComment,
					teammatesTable: body.teammatesTable,
				},
			);
		}

		log.info`Queued manual job ${jobId}`;

		return c.json(
			{
				status: "accepted" as const,
				jobId,
				agentSessionId,
				promptPath: body.promptPath ?? "",
			},
			200,
		);
	};
}
