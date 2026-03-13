import path from "node:path";
import * as readline from "node:readline";
import { env, logger } from "@agentic-kanban/core";
import { getRootAccessToken } from "@agentic-kanban/gitlab";
import type { Command } from "commander";

const log = logger.cli;

function prompt(question: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

export function registerLocalCommand(program: Command) {
	const local = program
		.command("local")
		.description("Local development commands");

	local
		.command("get-gitlab-token")
		.description("Get GitLab root access token from Docker and write to .env")
		.option(
			"--env <path>",
			"Path to .env file",
			path.resolve(process.cwd(), "packages/server/.env"),
		)
		.action(async (options) => {
			const envPath = path.resolve(options.env);

			log.debug`Gonna update .env to ${envPath}`;
			log.info`Fetching GitLab root access token from Docker container...`;

			try {
				const result = await getRootAccessToken({
					containerName: "gitlab",
					tokenName: "agents-root-token",
				});

				log.info`Token retrieved successfully!`;
				log.info`  Name: ${result.name}`;
				log.info`  Scopes: ${result.scopes.join(", ")}`;
				log.info`  Token: ${result.token.slice(0, 10)}...`;

				const absoluteEnvPath = path.resolve(envPath);
				const answer = await prompt(
					`Write GITLAB_TOKEN to ${absoluteEnvPath}? [y/N] `,
				);

				if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
					await env.updateOrAppendKey(
						absoluteEnvPath,
						"GITLAB_TOKEN",
						result.token,
					);
					log.info`GITLAB_TOKEN written to ${absoluteEnvPath}`;
				} else {
					log.info`Skipped writing to .env file.`;
					log.info`To use manually, set: GITLAB_TOKEN=${result.token}`;
				}
			} catch (error) {
				log.error`Error: ${error instanceof Error ? error.message : String(error)}`;
				process.exit(1);
			}
		});
}
