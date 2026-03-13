import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { logger, store } from "@agentic-kanban/core";
import { closeQueue, enqueuer } from "@agentic-kanban/queue";
import type { Command } from "commander";

export function registerRunCommand(program: Command) {
	program
		.command("run")
		.description("Run an agent with a prompt file")
		.requiredOption("-p, --prompt <path>", "Path to prompt file (.md)")
		.option("-w, --working-directory <path>", "Working directory", ".")
		.option(
			"-m, --permission-mode <mode>",
			"Permission mode",
			"bypassPermissions",
		)
		.option("--max-turns <n>", "Maximum number of turns")
		.option("--model <id>", "Model ID to use")
		.action(async (options) => {
			const log = logger.cli;

			const promptPath = resolve(options.prompt);

			if (!existsSync(promptPath)) {
				throw new Error(`Prompt file not found: ${promptPath}`);
			}

			const agentSessionId = randomUUID();
			const workingDir = await store.workingDirectory(agentSessionId);

			if (!existsSync(workingDir)) {
				throw new Error(`Working directory not found: ${workingDir}`);
			}

			const jobId = await enqueuer.enqueueAgentJob(
				agentSessionId,
				workingDir,
				promptPath,
				{
					projectId: "some-project-id",
					issueId: "some-issue-id",
					issueTitle: "some-issue-title",
					issueDescription: "some-issue-description",
				},
			);

			log.info`---`;
			log.info`Agent Session ID: ${agentSessionId}`;
			log.info`Job ID: ${jobId}`;

			await closeQueue();
		});
}
