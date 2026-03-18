import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { getAgentSessionArtifactRoute } from "#routes/agent-sessions.ts";

export const getAgentSessionArtifactHandler: RouteHandler<
	typeof getAgentSessionArtifactRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const { path } = c.req.valid("query");
	const content = await store.getArtifactContent(id, path);
	if (content === null) {
		return c.json({ error: "Artifact not found" }, 404);
	}
	return c.json({ name: path, content }, 200);
};
