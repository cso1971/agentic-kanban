import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { components, paths } from "./schema";

const fetchClient = createFetchClient<paths>({
	baseUrl: "",
});

export const $api = createClient(fetchClient);

export type AgentSession = components["schemas"]["AgentSession"];
export type AgentSessionMessage = components["schemas"]["AgentSessionMessage"];
