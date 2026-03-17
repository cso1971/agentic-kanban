import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { agent, logger } from "@agentic-kanban/core";
import type { RouteHandler } from "@hono/zod-openapi";
import type { configValidateSkillRoute } from "#routes/config";

const log = logger.server;

const SYSTEM_PROMPT = `You are a skill validation assistant. You have access to the skill-creator plugin.
Use /skill-creator to run evals and validate the skill file content provided by the user.

After the plugin completes, respond with ONLY valid JSON (no markdown fences, no extra text) matching this exact structure:
{
  "valid": boolean,
  "score": number,
  "feedback": string,
  "improvements": [string]
}

- "valid": true if the skill passes validation (score >= 0.7), false otherwise.
- "score": the numeric quality/validation score from the skill-creator evaluation (0 to 1).
- "feedback": the skill-creator's evaluation summary or feedback.
- "improvements": list of specific improvements suggested by the skill-creator.`;

export function createConfigValidateSkillHandler(
	configDir: string,
): RouteHandler<typeof configValidateSkillRoute> {
	return async (c) => {
		const { path: filePath } = c.req.valid("json");

		// Prevent path traversal
		const fullPath = resolve(join(configDir, filePath));

		if (!fullPath.startsWith(resolve(configDir))) {
			return c.json({ error: "Invalid path" }, 400);
		}

		// Must be in skills/ directory and be a .md file
		if (!filePath.startsWith("skills/") || !filePath.endsWith(".md")) {
			return c.json(
				{ error: "Path must be a .md file within the skills/ directory" },
				400,
			);
		}

		try {
			await stat(fullPath);
		} catch {
			return c.json({ error: "File not found" }, 404);
		}

		const content = await readFile(fullPath, "utf-8");

		try {
			const response = await agent.ask({
				prompt: `Validate the following skill file using /skill-creator:\n\n${content}`,
				systemPrompt: SYSTEM_PROMPT,
				requiredPlugins: ["skill-creator@claude-plugins-official"],
			});

			// Try to extract JSON from the response (handle possible markdown fences)
			let jsonStr = response.trim();
			if (jsonStr.startsWith("```")) {
				jsonStr = jsonStr
					.replace(/^```(?:json)?\n?/, "")
					.replace(/\n?```$/, "");
			}

			const result = JSON.parse(jsonStr);

			return c.json(
				{
					path: filePath,
					valid: result.valid ?? false,
					score: result.score ?? 0,
					feedback: result.feedback ?? "",
					improvements: result.improvements ?? [],
				},
				200,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Validation failed";
			log.error`Skill validation error for ${filePath}: ${message}`;
			return c.json({ error: `Skill validation failed: ${message}` }, 400);
		}
	};
}
