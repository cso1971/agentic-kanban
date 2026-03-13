import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { getAgentSessionRoute } from "../../agent-sessions";

export const getAgentSessionHandler: RouteHandler<
	typeof getAgentSessionRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const session = await store.get(id);
	if (!session) {
		return c.json({ error: "not found" }, 404);
	}
	return c.json(session, 200);
};
