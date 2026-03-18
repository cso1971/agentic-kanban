import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import type { RouteHandler } from "@hono/zod-openapi";
import type { configTreeRoute } from "#routes/config.ts";

interface TreeNode {
	name: string;
	path: string;
	type: "file" | "directory";
	children?: TreeNode[];
}

async function buildTree(dirPath: string, basePath: string): Promise<TreeNode[]> {
	const entries = await readdir(dirPath, { withFileTypes: true });
	const nodes: TreeNode[] = [];

	for (const entry of entries.sort((a, b) => {
		// Directories first, then files
		if (a.isDirectory() && !b.isDirectory()) return -1;
		if (!a.isDirectory() && b.isDirectory()) return 1;
		return a.name.localeCompare(b.name);
	})) {
		const fullPath = join(dirPath, entry.name);
		const relPath = relative(basePath, fullPath);

		if (entry.isDirectory()) {
			const children = await buildTree(fullPath, basePath);
			nodes.push({
				name: entry.name,
				path: relPath,
				type: "directory",
				children,
			});
		} else {
			nodes.push({
				name: entry.name,
				path: relPath,
				type: "file",
			});
		}
	}

	return nodes;
}

export function createConfigTreeHandler(configDir: string): RouteHandler<typeof configTreeRoute> {
	return async (c) => {
		const tree = await buildTree(configDir, configDir);
		return c.json({ tree });
	};
}
