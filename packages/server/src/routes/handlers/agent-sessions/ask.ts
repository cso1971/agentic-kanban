import { agent, store } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { askAgentSessionRoute } from "#routes/agent-sessions.ts";

export const askAgentSessionHandler: RouteHandler<
	typeof askAgentSessionRoute
> = async (c) => {
	const { id } = c.req.valid("param");
	const { prompt, history } = c.req.valid("json");

	const session = await store.get(id);
	if (!session) {
		return c.json({ error: "Agent session not found" }, 404);
	}

	const agentSessionDir = store.dir(id);
	const messagesPath = store.getMessagesPath(id);
	const artifactsDir = store.getArtifactsDir(id);

	const systemPrompt = `You are an assistant that answers questions about an agent session. 
${messagesPath} here you should see the history of the claude code instance.
${artifactsDir} here you should see the artifacts produced by the claude code instance.`;

	const conversationContext = history?.length
		? `${history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")}\n\nUser: ${prompt}`
		: prompt;

	const answer = await agent.ask({
		prompt: conversationContext,
		cwd: agentSessionDir,
		systemPrompt,
		model: "sonnet",
	});

	return c.json({ answer }, 200);
};
