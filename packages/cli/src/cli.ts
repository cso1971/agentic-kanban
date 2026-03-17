#!/usr/bin/env bun
import "bun";
import { Command } from "commander";

import { registerGitlabCommand } from "#commands/gitlab";
import { registerLocalCommand } from "#commands/local";
import { registerRunCommand } from "#commands/run";

const program = new Command();

program
	.name("agent")
	.description("CLI for running and managing AI agents")
	.version("0.1.0");

registerRunCommand(program);
registerGitlabCommand(program);
registerLocalCommand(program);

program.parse();
