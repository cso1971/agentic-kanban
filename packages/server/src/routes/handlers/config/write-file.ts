import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { RouteHandler } from "@hono/zod-openapi";
import type { configWriteFileRoute } from "#routes/config.ts";

export function createConfigWriteFileHandler(
	configDir: string,
): RouteHandler<typeof configWriteFileRoute> {
	return async (c) => {
		const { path: filePath } = c.req.valid("query");

		// Prevent path traversal
		const fullPath = resolve(join(configDir, filePath));
		if (!fullPath.startsWith(resolve(configDir))) {
			return c.json({ error: "Invalid path" }, 400);
		}

		const body = c.req.valid("json");

		// Ensure parent directory exists
		await mkdir(dirname(fullPath), { recursive: true });
		await writeFile(fullPath, body.content, "utf-8");

		return c.json({ path: filePath, success: true }, 200);
	};
}
