import { readFile } from "fs/promises";
import { resolve } from "path";
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
	/** Working directory for the agent (can use {{project_path}} placeholder) */
	workingDirectory?: string;
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

export interface GitLabWebhookPayload {
	object_kind: string;
	object_attributes?: {
		action?: string;
		labels?: Array<{ title: string }>;
	};
	labels?: Array<{ title: string }>;
	changes?: {
		labels?: {
			previous?: Array<{ title: string }>;
			current?: Array<{ title: string }>;
		};
	};
	project?: {
		path_with_namespace?: string;
	};
}

export function matchWebhookToPrompt(
	payload: GitLabWebhookPayload,
	config: AgentConfig,
): WebhookRule | null {
	const eventType = payload.object_kind;
	const action = payload.object_attributes?.action;

	// Determine which labels were just added
	const previousLabels = new Set(
		(payload.changes?.labels?.previous ?? []).map((l) => l.title),
	);
	const currentLabels =
		payload.changes?.labels?.current ??
		payload.object_attributes?.labels ??
		payload.labels ??
		[];
	const addedLabels = currentLabels
		.map((l) => l.title)
		.filter((title) => !previousLabels.has(title));

	for (const rule of config.rules) {
		if (rule.event !== eventType) continue;
		if (rule.action && rule.action !== action) continue;
		if (addedLabels.includes(rule.label)) {
			return rule;
		}
	}

	return null;
}
