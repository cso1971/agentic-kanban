import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import type { RouteHandler } from "@hono/zod-openapi";
import type { configReadFileRoute } from "#routes/config";

const TEXT_EXTENSIONS = new Set([".md", ".json", ".txt", ".yaml", ".yml"]);

function getMimeType(ext: string): string {
	const mimeTypes: Record<string, string> = {
		".md": "text/markdown",
		".json": "application/json",
		".txt": "text/plain",
		".yaml": "text/yaml",
		".yml": "text/yaml",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".webp": "image/webp",
	};
	return mimeTypes[ext] ?? "application/octet-stream";
}

export function createConfigReadFileHandler(configDir: string): RouteHandler<typeof configReadFileRoute> {
	return async (c) => {
		const { path: filePath } = c.req.valid("query");

		// Prevent path traversal
		const fullPath = resolve(join(configDir, filePath));
		if (!fullPath.startsWith(resolve(configDir))) {
			return c.json({ error: "Invalid path" }, 400);
		}

		try {
			await stat(fullPath);
		} catch {
			return c.json({ error: "File not found" }, 404);
		}

		const ext = extname(fullPath).toLowerCase();
		const mimeType = getMimeType(ext);

		let content: string;
		if (TEXT_EXTENSIONS.has(ext)) {
			content = await readFile(fullPath, "utf-8");
		} else {
			const buffer = await readFile(fullPath);
			content = Buffer.from(buffer).toString("base64");
		}

		return c.json({ path: filePath, content, mimeType }, 200);
	};
}
