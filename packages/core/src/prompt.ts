import { readFile } from "fs/promises";
import { resolve } from "path";
import { logger } from "./logger";

export async function loadPrompt(promptPath: string): Promise<string> {
	const resolved = resolve(promptPath);
	logger.core.debug`Loading prompt from ${resolved}`;
	return readFile(resolved, "utf-8");
}
