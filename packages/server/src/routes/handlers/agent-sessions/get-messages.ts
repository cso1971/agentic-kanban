import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { getAgentSessionMessagesRoute } from "#routes/agent-sessions";

export const getAgentSessionMessagesHandler: RouteHandler<
	typeof getAgentSessionMessagesRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const messages = await store.getMessages(id);
	return c.json(messages.reverse());
};
