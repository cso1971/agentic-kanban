#!/usr/bin/env bun
// Load .env file (Bun automatically loads .env files when this is imported at the top)
import "bun";

import { loadPrompt, logger, runAgent, setupLogger } from "@agents/core";
import { resolve } from "path";
import { parseArgs } from "util";

await setupLogger();

const log = logger.cli;

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		prompt: { type: "string", short: "p" },
		"working-directory": { type: "string", short: "w" },
		"permission-mode": { type: "string", short: "m" },
		"max-turns": { type: "string", short: "t" },
		model: { type: "string" },
	},
	strict: true,
});

if (!values.prompt) {
	log.error`Usage: agent --prompt <path> [--working-directory <path>] [--permission-mode <mode>] [--max-turns <n>] [--model <id>]`;
	process.exit(1);
}

const promptContent = await loadPrompt(values.prompt);
const cwd = resolve(values["working-directory"] ?? ".");

log.info`Running agent in ${cwd}`;
log.info`Prompt: ${values.prompt}`;
log.info`---`;

const { invocationId, result } = await runAgent({
	prompt: promptContent,
	cwd,
	permissionMode: (values["permission-mode"] as any) ?? "bypassPermissions",
	maxTurns: values["max-turns"] ? parseInt(values["max-turns"], 10) : undefined,
	model: values.model,
});

log.info`---`;
log.info`Invocation ID: ${invocationId}`;
log.info`${result}`;
