import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { listAgentSessionsRoute } from "../../agent-sessions";

export const listAgentSessionsHandler: RouteHandler<
	typeof listAgentSessionsRoute
> = async (c) => {
	const sessions = await store.list();
	return c.json(sessions);
};
