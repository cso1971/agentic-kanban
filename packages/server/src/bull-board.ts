import { getAgentQueue } from "@agentic-kanban/queue";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { serveStatic } from "hono/bun";

export function registerBullBoard(app: OpenAPIHono): void {
	const serverAdapter = new HonoAdapter(serveStatic);
	serverAdapter.setBasePath("/queues");

	createBullBoard({
		queues: [new BullMQAdapter(getAgentQueue())],
		serverAdapter,
	});

	app.route("/queues", serverAdapter.registerPlugin());
}
