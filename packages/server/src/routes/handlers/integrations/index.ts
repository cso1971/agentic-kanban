import { createGitLabClient } from "@agentic-kanban/gitlab";
import type { RouteHandler } from "@hono/zod-openapi";
import type { integrationsRoute } from "#routes/integrations.ts";

export function createIntegrationsHandler(
	configDir: string,
): RouteHandler<typeof integrationsRoute> {
	return async (c) => {
		const gitlabHost = Bun.env.GITLAB_HOST ?? "";
		const gitlabToken = Bun.env.GITLAB_TOKEN ?? "";

		let connected = false;
		if (gitlabHost && gitlabToken) {
			try {
				const client = createGitLabClient({
					host: gitlabHost,
					token: gitlabToken,
				});
				await client.Metadata.show();
				connected = true;
			} catch {
				connected = false;
			}
		}

		return c.json({
			configDir,
			gitlab: {
				url: gitlabHost,
				connected,
			},
		});
	};
}
