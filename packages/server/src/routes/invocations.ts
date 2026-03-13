import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "../schemas/common";
import {
	InvocationIdParamSchema,
	InvocationMessageSchema,
	InvocationSchema,
} from "../schemas/invocations";

export const listInvocationsRoute = createRoute({
	method: "get",
	path: "/api/invocations",
	tags: ["Invocations"],
	summary: "List all invocations",
	description: "Returns a list of all agent invocations, sorted by most recent first",
	responses: {
		200: {
			description: "List of invocations",
			content: {
				"application/json": {
					schema: z.array(InvocationSchema),
				},
			},
		},
	},
});

export const getInvocationRoute = createRoute({
	method: "get",
	path: "/api/invocations/{id}",
	tags: ["Invocations"],
	summary: "Get invocation by ID",
	description: "Returns a single invocation by its ID",
	request: {
		params: InvocationIdParamSchema,
	},
	responses: {
		200: {
			description: "Invocation found",
			content: {
				"application/json": {
					schema: InvocationSchema,
				},
			},
		},
		404: {
			description: "Invocation not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const getInvocationMessagesRoute = createRoute({
	method: "get",
	path: "/api/invocations/{id}/messages",
	tags: ["Invocations"],
	summary: "Get invocation messages",
	description: "Returns all messages for a specific invocation",
	request: {
		params: InvocationIdParamSchema,
	},
	responses: {
		200: {
			description: "List of messages",
			content: {
				"application/json": {
					schema: z.array(InvocationMessageSchema),
				},
			},
		},
	},
});
