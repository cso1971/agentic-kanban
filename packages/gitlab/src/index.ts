export {
	createGitLabClient,
	type GitLabClient,
	type GitLabConfig,
} from "#client.ts";
export {
	type AgentConfig,
	type SetupConfig,
	type SetupResult,
	setupGitLabProject,
} from "#config.ts";
export {
	type GetRootTokenOptions,
	type GetRootTokenResult,
	getRootAccessToken,
} from "#local.ts";
