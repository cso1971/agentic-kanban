import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { getTeammateMessagesRoute } from "#routes/agent-sessions.ts";

export const getTeammateMessagesHandler: RouteHandler<
	typeof getTeammateMessagesRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const messages = await store.getTeammateMessages(id);
	return c.json(messages, 200);
};
