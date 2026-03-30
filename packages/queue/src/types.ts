import type { RunAgentOptions } from "@agentic-kanban/core";

export interface AgentJobData extends RunAgentOptions {
	type?: "agent";
	agentSessionId: string;
	jobId?: string;
}

export type JobData = AgentJobData;

export interface AgentJobResult {
	agentSessionId: string;
	result: string;
	durationMs?: number;
	durationApiMs?: number;
	totalCostUsd?: number;
	numTurns?: number;
	inputTokens?: number;
	outputTokens?: number;
	stopReason?: string | null;
}

export type JobResult = AgentJobResult;
