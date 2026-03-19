import { loadPrompt, store } from "@agentic-kanban/core";
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
	teammatesTable?: string;
}

async function enqueueAgentJob(
	agentSessionId: string,
	workingDir: string,
	promptPath: string,
	payload: EnqueuePayload,
): Promise<string> {
	const promptTemplate = await loadPrompt(promptPath);

	const title = payload.issueTitle ?? payload.mrTitle ?? "";

	const promptContent = promptTemplate
		.replaceAll("{{PROJECT_ID}}", payload.projectId)
		.replaceAll("{{ISSUE_IID}}", payload.issueId ?? "")
		.replaceAll("{{ISSUE_TITLE}}", payload.issueTitle ?? "")
		.replaceAll("{{ISSUE_DESCRIPTION}}", payload.issueDescription ?? "")
		.replaceAll("{{MR_IID}}", payload.mrIid ?? "")
		.replaceAll("{{MR_TITLE}}", payload.mrTitle ?? "")
		.replaceAll("{{SOURCE_BRANCH}}", payload.sourceBranch ?? "")
		.replaceAll("{{REVIEWER_NAME}}", payload.reviewerName ?? "")
		.replaceAll("{{DISCUSSION_ID}}", payload.discussionId ?? "")
		.replaceAll("{{REVIEW_COMMENT}}", payload.reviewComment ?? "")
		.replaceAll("{{TEAMMATES_TABLE}}", payload.teammatesTable ?? "")
		.replaceAll("{{TOPIC}}", title)
		.replaceAll("{{TOPIC_SLUG}}", title.toLowerCase().replace(/ /g, "-"))
		.replaceAll(
			"{{ARTIFACT_DIR}}",
			await store.artifactsDirectory(agentSessionId),
		);

	const queue = getAgentQueue();

	const job = await queue.add(AGENT_QUEUE_NAME, {
		type: "agent",
		prompt: promptContent,
		model: "haiku",
		cwd: workingDir,
		agentSessionId,
	});

	return job.id ?? "";
}

export const enqueuer = { enqueueAgentJob };
