import { createRoute, z } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "#schemas/common.ts";
import {
	ConfigFileQuerySchema,
	ConfigFileResponseSchema,
	ConfigFileWriteBodySchema,
	ConfigFileWriteResponseSchema,
	ConfigTreeResponseSchema,
} from "#schemas/config.ts";

export const configTreeRoute = createRoute({
	method: "get",
	path: "/api/config/tree",
	tags: ["Config"],
	summary: "Get config directory tree",
	description: "Returns the file tree structure of the config directory",
	responses: {
		200: {
			description: "Config directory tree",
			content: {
				"application/json": {
					schema: ConfigTreeResponseSchema,
				},
			},
		},
	},
});

export const configReadFileRoute = createRoute({
	method: "get",
	path: "/api/config/file",
	tags: ["Config"],
	summary: "Read a config file",
	description:
		"Reads a file from the config directory. Returns text content for text files and base64-encoded content for binary files.",
	request: {
		query: ConfigFileQuerySchema,
	},
	responses: {
		200: {
			description: "File content",
			content: {
				"application/json": {
					schema: ConfigFileResponseSchema,
				},
			},
		},
		400: {
			description: "Invalid path",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: "File not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const configWriteFileRoute = createRoute({
	method: "put",
	path: "/api/config/file",
	tags: ["Config"],
	summary: "Write a config file",
	description: "Creates or updates a file in the config directory",
	request: {
		query: ConfigFileQuerySchema,
		body: {
			content: {
				"application/json": {
					schema: ConfigFileWriteBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "File written successfully",
			content: {
				"application/json": {
					schema: ConfigFileWriteResponseSchema,
				},
			},
		},
		400: {
			description: "Invalid path",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const configImageRoute = createRoute({
	method: "get",
	path: "/api/config/image",
	tags: ["Config"],
	summary: "Serve a config image file",
	description:
		"Serves an image file from the config directory with proper content type",
	request: {
		query: ConfigFileQuerySchema,
	},
	responses: {
		200: {
			description: "Image file",
			content: {
				"image/*": {
					schema: z.string(),
				},
			},
		},
		404: {
			description: "Image not found",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});
