import { z } from "@hono/zod-openapi";

export const ValidateSkillBodySchema = z
	.object({
		path: z
			.string()
			.openapi({
				description: "Relative path within config directory",
				example: "skills/my-skill.md",
			}),
	})
	.openapi("ValidateSkillBody");

export const ValidateSkillResponseSchema = z
	.object({
		path: z.string(),
		valid: z.boolean(),
		score: z
			.number()
			.min(0)
			.max(1)
			.openapi({ description: "Quality/validation score from skill-creator (0 to 1)" }),
		feedback: z
			.string()
			.openapi({ description: "Evaluation summary from the skill-creator plugin" }),
		improvements: z
			.array(z.string())
			.openapi({ description: "Specific improvements suggested by skill-creator" }),
	})
	.openapi("ValidateSkillResponse");
