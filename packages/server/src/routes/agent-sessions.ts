import { createRoute, z } from "@hono/zod-openapi";
import {
	AgentSessionIdParamSchema,
	AgentSessionMessageSchema,
	AgentSessionSchema,
	ArtifactContentQuerySchema,
	ArtifactContentSchema,
	ArtifactFileSchema,
	AskSessionBodySchema,
	AskSessionResponseSchema,
	TeammateMessageBodySchema,
	TeammateMessageSchema,
} from "#schemas/agent-sessions.ts";
import { ErrorResponseSchema } from "#schemas/common.ts";

export const listAgentSessionsRoute = createRoute({
	method: "get",
	path: "/api/agent-sessions",
	tags: ["Agent Sessions"],
	summary: "List all agent sessions",
	description:
		"Returns a list of all agent sessions, sorted by most recent first",
	responses: {
		200: {
			description: "List of agent sessions",
			content: {
				"application/json": {
					schema: z.array(AgentSessionSchema),
				},
			},
		},
	},
});

export const getAgentSessionRoute = createRoute({
	method: "get",
	path: "/api/agent-sessions/{id}",
	tags: ["Agent Sessions"],
	summary: "Get agent session by ID",
	description: "Returns a single agent session by its ID",
	request: {
		params: AgentSessionIdParamSchema,
	},
	responses: {
		200: {
			description: "Agent session found",
			content: {
				"application/json": {
					schema: AgentSessionSchema,
				},
			},
		},
		404: {
			description: "Agent session not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const getAgentSessionMessagesRoute = createRoute({
	method: "get",
	path: "/api/agent-sessions/{id}/messages",
	tags: ["Agent Sessions"],
	summary: "Get agent session messages",
	description: "Returns all messages for a specific agent session",
	request: {
		params: AgentSessionIdParamSchema,
	},
	responses: {
		200: {
			description: "List of messages",
			content: {
				"application/json": {
					schema: z.array(AgentSessionMessageSchema),
				},
			},
		},
	},
});

export const listAgentSessionArtifactsRoute = createRoute({
	method: "get",
	path: "/api/agent-sessions/{id}/artifacts",
	tags: ["Agent Sessions"],
	summary: "List agent session artifacts",
	description: "Returns all artifact files for a specific agent session",
	request: {
		params: AgentSessionIdParamSchema,
	},
	responses: {
		200: {
			description: "List of artifact files",
			content: {
				"application/json": {
					schema: z.array(ArtifactFileSchema),
				},
			},
		},
	},
});

export const getAgentSessionArtifactRoute = createRoute({
	method: "get",
	path: "/api/agent-sessions/{id}/artifact",
	tags: ["Agent Sessions"],
	summary: "Get artifact file content",
	description:
		"Returns the content of a specific artifact file by its relative path",
	request: {
		params: AgentSessionIdParamSchema,
		query: ArtifactContentQuerySchema,
	},
	responses: {
		200: {
			description: "Artifact file content",
			content: {
				"application/json": {
					schema: ArtifactContentSchema,
				},
			},
		},
		404: {
			description: "Artifact not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const postTeammateMessageRoute = createRoute({
	method: "post",
	path: "/api/agent-sessions/{id}/teammate-messages",
	tags: ["Agent Sessions"],
	summary: "Append a teammate message",
	description:
		"Appends a message from a teammate agent to the coordinator's session",
	request: {
		params: AgentSessionIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: TeammateMessageBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Message appended",
			content: {
				"application/json": {
					schema: z.object({ status: z.literal("ok") }),
				},
			},
		},
		404: {
			description: "Agent session not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const getTeammateMessagesRoute = createRoute({
	method: "get",
	path: "/api/agent-sessions/{id}/teammate-messages",
	tags: ["Agent Sessions"],
	summary: "Get teammate messages",
	description: "Returns all teammate messages for a specific agent session",
	request: {
		params: AgentSessionIdParamSchema,
	},
	responses: {
		200: {
			description: "List of teammate messages",
			content: {
				"application/json": {
					schema: z.array(TeammateMessageSchema),
				},
			},
		},
	},
});

export const askAgentSessionRoute = createRoute({
	method: "post",
	path: "/api/agent-sessions/{id}/ask",
	tags: ["Agent Sessions"],
	summary: "Ask a question about an agent session",
	description:
		"Asks Claude a question using the session context (messages, metadata) as context",
	request: {
		params: AgentSessionIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: AskSessionBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Answer from Claude",
			content: {
				"application/json": {
					schema: AskSessionResponseSchema,
				},
			},
		},
		404: {
			description: "Agent session not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
