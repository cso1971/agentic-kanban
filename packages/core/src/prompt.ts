import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { logger } from "./logger";

export async function loadPrompt(promptPath: string): Promise<string> {
	const resolved = resolve(promptPath);
	logger.core.debug`Loading prompt from ${resolved}`;

	if (!existsSync(resolved)) {
		throw new Error(`Prompt file not found: ${resolved}`);
	}

	return readFile(resolved, "utf-8");
}
