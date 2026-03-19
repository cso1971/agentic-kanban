import { logger } from "@agentic-kanban/core";
import { $ } from "bun";

const log = logger.gitlab;

export interface GetRootTokenOptions {
	containerName?: string;
	tokenName?: string;
}

export interface GetRootTokenResult {
	token: string;
	name: string;
	scopes: string[];
}

/**
 * Gets or creates a root access token from GitLab running in Docker.
 * Uses `docker exec` to run gitlab-rails commands.
 */
export async function getRootAccessToken(
	options: GetRootTokenOptions = {},
): Promise<GetRootTokenResult> {
	const { containerName = "gitlab", tokenName = "agents-root-token" } = options;

	log.debug(
		"Fetching all available scopes from GitLab container {containerName}",
		{ containerName },
	);
	const scopesResult =
		await $`docker exec ${containerName} gitlab-rails runner ${"puts Gitlab::Auth.all_available_scopes.join(',')"}`
			.text()
			.catch((error) => {
				throw new Error(
					`Failed to fetch GitLab scopes. Is the GitLab container "${containerName}" running?\n${error.message}`,
				);
			});

	const scopes = scopesResult.trim().split(",");

	if (!scopes.length || scopes[0] === "") {
		throw new Error(`Failed to fetch GitLab scopes: ${scopesResult}`);
	}

	log.debug("Fetched {count} scopes: {scopes}", {
		count: scopes.length,
		scopes: scopes.join(", "),
	});

	log.debug("Creating root access token with all scopes");
	const rubyScript = `
token_name = "${tokenName}"
scopes = %w[${scopes.join(" ")}]
user = User.find_by_username("root")

existing = PersonalAccessToken.find_by(user: user, name: token_name, revoked: false)
if existing && !existing.expired?
  existing.revoke!
end

token = user.personal_access_tokens.create!(
  name: token_name,
  scopes: scopes,
  expires_at: 1.year.from_now
)

puts token.token
`.trim();

	const result =
		await $`docker exec ${containerName} gitlab-rails runner ${rubyScript}`
			.text()
			.catch((error) => {
				throw new Error(
					`Failed to execute gitlab-rails command. Is the GitLab container "${containerName}" running?\n${error.message}`,
				);
			});

	const token = result.trim();

	if (!token || token.includes("Error") || token.includes("error")) {
		throw new Error(`Failed to create GitLab access token: ${result}`);
	}

	log.debug("Enabling local network requests for webhooks");
	await $`docker exec ${containerName} gitlab-rails runner ${"settings = ApplicationSetting.current; settings.allow_local_requests_from_web_hooks_and_services = true; settings.save!"}`
		.quiet()
		.catch((error) => {
			log.warn("Failed to enable local webhook requests: {error}", {
				error: error.message,
			});
		});

	log.debug("Root access token created successfully");

	return {
		token,
		name: tokenName,
		scopes,
	};
}
