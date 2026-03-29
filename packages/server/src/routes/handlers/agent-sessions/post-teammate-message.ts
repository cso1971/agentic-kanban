import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { postTeammateMessageRoute } from "#routes/agent-sessions.ts";

export const postTeammateMessageHandler: RouteHandler<
	typeof postTeammateMessageRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");

	const session = await store.get(id);
	if (!session) {
		return c.json({ error: "Agent session not found" }, 404);
	}

	await store.appendTeammateMessage(id, {
		timestamp: new Date().toISOString(),
		agentId: body.agentId,
		agentName: body.agentName,
		content: body.content,
	});

	return c.json({ status: "ok" as const }, 200);
};
