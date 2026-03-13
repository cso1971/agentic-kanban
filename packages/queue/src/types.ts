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
	totalCostUsd?: number;
	numTurns?: number;
}

export type JobResult = AgentJobResult;
