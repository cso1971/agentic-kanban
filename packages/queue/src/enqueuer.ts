import { type ClaudePlugin, loadPrompt, store } from "@agentic-kanban/core";
import { AGENT_QUEUE_NAME, getAgentQueue } from ".";

export interface EnqueuePayload {
	projectId: string;
	issueId?: string;
	issueTitle?: string;
	issueDescription?: string;
	mrIid?: string;
	mrTitle?: string;
	sourceBranch?: string;
	reviewerName?: string;
	discussionId?: string;
	reviewComment?: string;
	teammates?: string[];
}

function buildTeammatesTable(teammates?: string[]): string {
	if (!teammates || teammates.length === 0) return "";
	const header = "| Role | Spawn Prompt |\n|------|-------------|";
	const rows = teammates.map((name) => `| ${name} | agents/${name}/agent.md |`);
	return `${header}\n${rows.join("\n")}`;
}

async function enqueueAgentJob(
	agentSessionId: string,
	workingDir: string,
	promptPath: string,
	payload: EnqueuePayload,
	configDir: string,
	requiredPlugins?: ClaudePlugin[],
): Promise<string> {
	const promptTemplate = await loadPrompt(promptPath);

	const title = payload.issueTitle ?? payload.mrTitle ?? "";

	const serverPort = process.env.SERVER_PORT ?? "3000";
	const serverUrl = process.env.SERVER_URL ?? `http://localhost:${serverPort}`;

	const contextVariables: Record<string, string> = {
		"{{PROJECT_ID}}": payload.projectId,
		"{{ISSUE_IID}}": payload.issueId ?? "",
		"{{ISSUE_TITLE}}": payload.issueTitle ?? "",
		"{{ISSUE_DESCRIPTION}}": payload.issueDescription ?? "",
		"{{MR_IID}}": payload.mrIid ?? "",
		"{{MR_TITLE}}": payload.mrTitle ?? "",
		"{{SOURCE_BRANCH}}": payload.sourceBranch ?? "",
		"{{REVIEWER_NAME}}": payload.reviewerName ?? "",
		"{{DISCUSSION_ID}}": payload.discussionId ?? "",
		"{{REVIEW_COMMENT}}": payload.reviewComment ?? "",
		"{{TEAMMATES_TABLE}}": buildTeammatesTable(payload.teammates),
		"{{TOPIC}}": title,
		"{{TOPIC_SLUG}}": title.toLowerCase().replace(/ /g, "-"),
		"{{SERVER_URL}}": serverUrl,
		"{{AGENT_SESSION_ID}}": agentSessionId,
		"{{ARTIFACT_DIR}}": await store.artifactsDirectory(agentSessionId),
	};

	const teammatesProgressReportingInstructions = `## Teammate Progress Reporting

Every time you spawn a new teammate agent, you MUST append the following instructions to its prompt so that it reports everything it does:

---

You MUST report your progress by running this command after every significant action you take:

curl -s -X POST ${serverUrl}/api/agent-sessions/${agentSessionId}/teammate-messages \\
  -H "Content-Type: application/json" \\
  -d '{"agentId": "<your-unique-id>", "agentName": "<your-role-name>", "content": "<brief description of what you just did>"}'

Replace <your-unique-id> with a stable identifier for yourself (e.g. your role slug), <your-role-name> with your role name, and <content> with a brief summary of the action you took.

---
`;

	const values = Object.entries(contextVariables)
		.filter(([_, v]) => !!v && v.length > 0)
		.map(([key, value]) => `#### ${key}\n ${value}`)
		.join("\n");

	const configDirInstructions = `## Config Directory

Whenever you encounter a file path starting with \`@config\` (e.g. \`@config/agents/foo/agent.md\`), replace \`@config\` with: ${configDir}
`;
  
	const denyWorkarounds = `## Hard Stops

If any of the following happen, STOP IMMEDIATELY and report the failure. Do NOT attempt workarounds, retries, or alternative approaches.

- **Repository clone fails**: If you cannot clone the repository, stop everything. Do not proceed with any other steps.
- **Agent token authentication fails**: If an agent token (e.g. AGENT_COORDINATOR_TOKEN, AGENT_PRODUCT_ANALYST_TOKEN, etc.) fails to authenticate or lacks permissions for the requested operation, stop everything. Do not fall back to a different token or skip the operation.
`;

	const appendSystemPrompt = `## Context Variables

You are working with these runtime values:

Whenever you encounter a {{PLACEHOLDER}} in any file you read during this session, substitute it with the matching value from this Context.

${values}

${configDirInstructions}
${denyWorkarounds}
${teammatesProgressReportingInstructions}`;

	const queue = getAgentQueue();

	const job = await queue.add(AGENT_QUEUE_NAME, {
		type: "agent",
		prompt: promptTemplate,
		model: "sonnet",
		cwd: workingDir,
		agentSessionId,
		requiredPlugins,
		appendSystemPrompt,
	});

	return job.id ?? "";
}

export const enqueuer = { enqueueAgentJob };
