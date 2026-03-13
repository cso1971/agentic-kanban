import type { SDKResultError } from "@anthropic-ai/claude-agent-sdk";
import { logger } from "./logger.js";

export type ParsedError = ParsedUnknown;

export interface ParsedUnknown {
	type: "unknown";
	sdkType: string;
	raw: SDKResultError;
}

export function parseError(json: string | undefined): ParsedError | undefined {
	if (!json) return undefined;
	try {
		const msg = JSON.parse(json) as SDKResultError;
		return parseSDKMessage(msg);
	} catch (error) {
		logger.core.error`Failed to parse error JSON: ${error}`;
		return undefined;
	}
}

export function parseSDKMessage(msg: SDKResultError): ParsedError {
	return { type: "unknown", sdkType: msg.type, raw: msg };
}
