import { loadPrompt, store } from "@agentic-kanban/core";
import { AGENT_QUEUE_NAME, getAgentQueue } from ".";

async function enqueueAgentJob(
	agentSessionId: string,
	workingDir: string,
	promptPath: string,
	payload: {
		projectId: string;
		issueId: string;
		issueTitle: string;
		issueDescription: string;
	},
): Promise<string> {
	const promptTemplate = await loadPrompt(promptPath);

	const promptContent = promptTemplate
		.replaceAll("{{PROJECT_ID}}", payload.projectId)
		.replaceAll("{{ISSUE_IID}}", payload.issueId)
		.replaceAll("{{ISSUE_TITLE}}", payload.issueTitle)
		.replaceAll("{{ISSUE_DESCRIPTION}}", payload.issueDescription)
		.replaceAll("{{TOPIC}}", payload.issueTitle)
		.replaceAll(
			"{{TOPIC_SLUG}}",
			payload.issueTitle.toLowerCase().replace(/ /g, "-"),
		)
		.replaceAll(
			"{{ARTIFACT_DIR}}",
			await store.artifactsDirectory(agentSessionId),
		);

	const queue = getAgentQueue();

	const job = await queue.add(AGENT_QUEUE_NAME, {
		type: "agent",
		prompt: promptContent,
    model: "sonnet-4.5",
		cwd: workingDir,
		agentSessionId,
	});

	return job.id ?? "";
}

export const enqueuer = { enqueueAgentJob };
