import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import type { RouteHandler } from "@hono/zod-openapi";
import type { configImageRoute } from "../../config";

function getImageContentType(ext: string): string {
	const types: Record<string, string> = {
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".webp": "image/webp",
	};
	return types[ext] ?? "application/octet-stream";
}

export function createConfigImageHandler(configDir: string): RouteHandler<typeof configImageRoute> {
	return async (c) => {
		const { path: filePath } = c.req.valid("query");

		// Prevent path traversal
		const fullPath = resolve(join(configDir, filePath));
		if (!fullPath.startsWith(resolve(configDir))) {
			return c.json({ error: "Image not found" }, 404);
		}

		try {
			await stat(fullPath);
		} catch {
			return c.json({ error: "Image not found" }, 404);
		}

		const ext = extname(fullPath).toLowerCase();
		const contentType = getImageContentType(ext);
		const buffer = await readFile(fullPath);

		return new Response(buffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=3600",
			},
		});
	};
}
