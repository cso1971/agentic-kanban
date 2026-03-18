import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { logger } from "#logger.ts";

export interface WebhookRule {
	/** GitLab event type, e.g. "issue", "note" */
	event: string;
	/** Action within the event, e.g. "update", "create" */
	action?: string;
	/** Label that must be present or just added (for issue events) */
	label?: string;
	/** Noteable type filter for note events, e.g. "MergeRequest" */
	noteable_type?: string;
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
