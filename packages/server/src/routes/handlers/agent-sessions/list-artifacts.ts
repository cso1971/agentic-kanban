import { store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { listAgentSessionArtifactsRoute } from "../../agent-sessions";

export const listAgentSessionArtifactsHandler: RouteHandler<
	typeof listAgentSessionArtifactsRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const artifacts = await store.listArtifacts(id);
	return c.json(artifacts);
};
