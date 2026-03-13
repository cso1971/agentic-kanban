import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { logger } from "./logger";

export interface WebhookRule {
	/** GitLab event type, e.g. "issue" */
	event: string;
	/** Action within the event, e.g. "update" */
	action?: string;
	/** Label that must be present or just added */
	label: string;
	/** Path to the prompt file (relative to config file or absolute) */
	prompt: string;
}

export interface AgentConfig {
	rules: WebhookRule[];
}

export async function loadConfig(configPath: string): Promise<AgentConfig> {
	const resolved = resolve(configPath);
	logger.core.info`Loading config from: ${resolved}`;
	const content = await readFile(resolved, "utf-8");
	return JSON.parse(content) as AgentConfig;
}
