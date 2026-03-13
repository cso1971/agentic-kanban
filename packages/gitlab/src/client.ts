import { Gitlab } from "@gitbeaker/rest";

export type GitLabClient = InstanceType<typeof Gitlab>;

export interface GitLabConfig {
	host?: string;
	token: string;
}

export function createGitLabClient(config: GitLabConfig): GitLabClient {
	return new Gitlab({
		host: config.host ?? "https://gitlab.com",
		token: config.token,
	});
}
