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
	const rows = teammates.map(
		(name) => `| ${name} | agents/${name}/agent.md |`,
	);
	return `${header}\n${rows.join("\n")}`;
}

async function enqueueAgentJob(
	agentSessionId: string,
	workingDir: string,
	promptPath: string,
	payload: EnqueuePayload,
	requiredPlugins?: ClaudePlugin[],
): Promise<string> {
	const promptTemplate = await loadPrompt(promptPath);

	const title = payload.issueTitle ?? payload.mrTitle ?? "";

	const serverPort = process.env.SERVER_PORT ?? "3000";
	const serverUrl = process.env.SERVER_URL ?? `http://localhost:${serverPort}`;

	const replacements: Record<string, string> = {
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
		"{{TEAMMATES_PROGRESS_REPORTING_INSTRUCTIONS}}": `**Append the following reporting instructions** to each teammate's prompt so they report their progress:

## Progress Reporting

You MUST report your progress by running this command after every significant action (responding to a round, voting, completing analysis):

curl -s -X POST {{SERVER_URL}}/api/agent-sessions/{{AGENT_SESSION_ID}}/teammate-messages \\
  -H "Content-Type: application/json" \\
  -d '{"agentId": "<your-unique-id>", "agentName": "<your-role-name>", "content": "<brief description of what you just did>"}'

Replace <your-unique-id> with a stable identifier for yourself (e.g. your role slug), <your-role-name> with your role name, and <content> with a brief summary of the action you took.
`,
	};

	const values = Object.entries(replacements)
		.filter(([_, v]) => !!v && v.length > 0)
		.map(([key, value]) => `#### ${key}\n ${value}`)
		.join("\n");

	const appendSystemPrompt = `## Context Variables

You are working with these runtime values:

Whenever you encounter a {{PLACEHOLDER}} in any file you read during this session, substitute it with the matching value from this Context.

${values}`;

	const promptContent = promptTemplate.replaceAll("@CONTEXT_VARIABLES", "").trim();

	const queue = getAgentQueue();

	const job = await queue.add(AGENT_QUEUE_NAME, {
		type: "agent",
		prompt: promptContent,
		model: "sonnet",
		cwd: workingDir,
		agentSessionId,
		requiredPlugins,
		appendSystemPrompt,
	});

	return job.id ?? "";
}

export const enqueuer = { enqueueAgentJob };
