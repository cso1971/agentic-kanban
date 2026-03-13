import type { Options } from "@anthropic-ai/claude-agent-sdk";

export interface RunSessionParams {
	/** The user prompt sent to query() */
	prompt: string;
	/** SDK options for query() */
	options: Options;
	/** Pre-generated session ID, or one will be created */
	sessionId?: string;
	/** Prompt text stored in the session metadata (may differ from the query prompt) */
	sessionPrompt?: string;
	/** Working directory stored in session metadata */
	cwd?: string;
	/** Associated queue job ID */
	jobId?: string;
	/** Model name stored in session metadata on completion */
	model?: string;
}

export interface SessionResult {
	sessionId: string;
	result: string;
}
