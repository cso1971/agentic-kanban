import { createRoute, z } from "@hono/zod-openapi";
import {
	AgentSessionIdParamSchema,
	AgentSessionMessageSchema,
	AgentSessionSchema,
	ArtifactContentQuerySchema,
	ArtifactContentSchema,
	ArtifactFileSchema,
} from "../schemas/agent-sessions";
import { ErrorResponseSchema } from "../schemas/common";

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
	description: "Returns the content of a specific artifact file by its relative path",
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
