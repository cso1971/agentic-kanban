import { describe, expect, test } from "bun:test";
import { parseMessage } from "./parse-message";

describe("parseMessage", () => {
	test("parses system init message", () => {
		const json = JSON.stringify({
			type: "system",
			subtype: "init",
			cwd: "/Users/test/repo",
			session_id: "04a04f14-aee4-4536-bbda-c69a45193e82",
			tools: ["Bash", "Glob", "Grep", "Read", "Edit", "Write"],
			model: "claude-opus-4-6[1m]",
			permissionMode: "bypassPermissions",
			uuid: "d8d2a7d4-c41b-4d13-b823-8a63303cd5d3",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "init",
			model: "claude-opus-4-6[1m]",
			sessionId: "04a04f14-aee4-4536-bbda-c69a45193e82",
			tools: ["Bash", "Glob", "Grep", "Read", "Edit", "Write"],
		});
	});

	test("parses assistant text message", () => {
		const json = JSON.stringify({
			type: "assistant",
			message: {
				model: "claude-opus-4-6",
				id: "msg_018iHq8CBWrQepvQWhgyeA3y",
				type: "message",
				role: "assistant",
				content: [
					{
						type: "text",
						text: "I'll start by checking glab availability and reading the project context.",
					},
				],
				stop_reason: null,
				stop_sequence: null,
				usage: { input_tokens: 2, output_tokens: 2 },
			},
			parent_tool_use_id: null,
			session_id: "04a04f14-aee4-4536-bbda-c69a45193e82",
			uuid: "6f52c239-9171-484c-8d0d-f3d7c1743f9e",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "assistant_text",
			text: "I'll start by checking glab availability and reading the project context.",
			messageId: "msg_018iHq8CBWrQepvQWhgyeA3y",
		});
	});

	test("parses assistant tool_use message", () => {
		const json = JSON.stringify({
			type: "assistant",
			message: {
				model: "claude-opus-4-6",
				id: "msg_018iHq8CBWrQepvQWhgyeA3y",
				type: "message",
				role: "assistant",
				content: [
					{
						type: "tool_use",
						id: "toolu_01Aco8cB79uDqtYc2zri4a1S",
						name: "Bash",
						input: {
							command: "glab --version",
							description: "Check glab CLI availability",
						},
					},
				],
				stop_reason: null,
				stop_sequence: null,
				usage: { input_tokens: 2, output_tokens: 2 },
			},
			parent_tool_use_id: null,
			session_id: "04a04f14-aee4-4536-bbda-c69a45193e82",
			uuid: "5133c8e4-0b81-4d43-bce6-d9a7422fab19",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "tool_use",
			toolName: "Bash",
			toolUseId: "toolu_01Aco8cB79uDqtYc2zri4a1S",
			input: {
				command: "glab --version",
				description: "Check glab CLI availability",
			},
		});
	});

	test("parses user tool_result message", () => {
		const json = JSON.stringify({
			type: "user",
			message: {
				role: "user",
				content: [
					{
						tool_use_id: "toolu_01Aco8cB79uDqtYc2zri4a1S",
						type: "tool_result",
						content: "glab 1.89.0 (c6fca530)",
						is_error: false,
					},
				],
			},
			parent_tool_use_id: null,
			session_id: "04a04f14-aee4-4536-bbda-c69a45193e82",
			uuid: "e3001834-ba13-4395-8c31-7db8c5e1958b",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "tool_result",
			toolUseId: "toolu_01Aco8cB79uDqtYc2zri4a1S",
			content: "glab 1.89.0 (c6fca530)",
			isError: false,
		});
	});

	test("parses user tool_result with error", () => {
		const json = JSON.stringify({
			type: "user",
			message: {
				role: "user",
				content: [
					{
						tool_use_id: "toolu_01xyz",
						type: "tool_result",
						content: "command not found: glab",
						is_error: true,
					},
				],
			},
			parent_tool_use_id: null,
			session_id: "session-1",
			uuid: "uuid-1",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "tool_result",
			toolUseId: "toolu_01xyz",
			content: "command not found: glab",
			isError: true,
		});
	});

	test("parses task_progress message", () => {
		const json = JSON.stringify({
			type: "system",
			subtype: "task_progress",
			task_id: "a77876cbfd860f933",
			tool_use_id: "toolu_01Hq7n1Q44jzGx5LCWDpYfTN",
			description: "Reading package.json",
			usage: { total_tokens: 10191, tool_uses: 5, duration_ms: 9599 },
			last_tool_name: "Read",
			uuid: "b5d59a5c-075a-4f8a-9bb2-4d61a158c068",
			session_id: "04a04f14-aee4-4536-bbda-c69a45193e82",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "task_progress",
			taskId: "a77876cbfd860f933",
			description: "Reading package.json",
			toolName: "Read",
			usage: { totalTokens: 10191, toolUses: 5, durationMs: 9599 },
		});
	});

	test("parses task_notification message", () => {
		const json = JSON.stringify({
			type: "system",
			subtype: "task_notification",
			task_id: "a2fea5246153231d4",
			tool_use_id: "toolu_018KQudVGyKASpviSLsxe3U6",
			status: "completed",
			output_file: "",
			summary: "Product Analyst perspective",
			usage: { total_tokens: 10562, tool_uses: 2, duration_ms: 25434 },
			uuid: "a62cb9d4-bd5a-4808-8589-e64725eec884",
			session_id: "04a04f14-aee4-4536-bbda-c69a45193e82",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "task_notification",
			taskId: "a2fea5246153231d4",
			status: "completed",
			summary: "Product Analyst perspective",
		});
	});

	test("parses result success message", () => {
		const json = JSON.stringify({
			type: "result",
			subtype: "success",
			duration_ms: 45000,
			duration_api_ms: 30000,
			is_error: false,
			num_turns: 8,
			result: "Task completed successfully.",
			stop_reason: "end_turn",
			total_cost_usd: 0.12,
			usage: { input_tokens: 5000, output_tokens: 2000 },
			modelUsage: {},
			permission_denials: [],
			uuid: "result-uuid",
			session_id: "session-1",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "result",
			subtype: "success",
			result: "Task completed successfully.",
			error: undefined,
			durationMs: 45000,
			totalCostUsd: 0.12,
			numTurns: 8,
		});
	});

	test("parses result error message", () => {
		const json = JSON.stringify({
			type: "result",
			subtype: "error_max_turns",
			duration_ms: 60000,
			duration_api_ms: 40000,
			is_error: true,
			num_turns: 20,
			stop_reason: null,
			total_cost_usd: 0.5,
			usage: { input_tokens: 10000, output_tokens: 5000 },
			modelUsage: {},
			permission_denials: [],
			uuid: "error-uuid",
			session_id: "session-1",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "result",
			subtype: "error_max_turns",
			result: undefined,
			error: "error_max_turns",
			durationMs: 60000,
			totalCostUsd: 0.5,
			numTurns: 20,
		});
	});

	test("parses rate_limit_event as unknown", () => {
		const json = JSON.stringify({
			type: "rate_limit_event",
			rate_limit_info: { status: "allowed", resetsAt: 1775001600 },
			uuid: "uuid-1",
			session_id: "session-1",
		});

		const result = parseMessage(json);

		if (!result) {
			expect(result).toBeDefined();
			return;
		}

		expect(result.type).toBe("unknown");
		if (result.type === "unknown") {
			expect(result.sdkType).toBe("rate_limit_event");
		}
	});

	test("parses assistant message with multiple content blocks (takes last)", () => {
		const json = JSON.stringify({
			type: "assistant",
			message: {
				model: "claude-opus-4-6",
				id: "msg_multi",
				type: "message",
				role: "assistant",
				content: [
					{ type: "text", text: "Let me check that." },
					{
						type: "tool_use",
						id: "toolu_01abc",
						name: "Read",
						input: { file_path: "/tmp/test.ts" },
					},
				],
				stop_reason: null,
				stop_sequence: null,
				usage: { input_tokens: 1, output_tokens: 1 },
			},
			parent_tool_use_id: null,
			session_id: "session-1",
			uuid: "uuid-multi",
		});

		const result = parseMessage(json);
		expect(result).toEqual({
			type: "tool_use",
			toolName: "Read",
			toolUseId: "toolu_01abc",
			input: { file_path: "/tmp/test.ts" },
		});
	});
});
