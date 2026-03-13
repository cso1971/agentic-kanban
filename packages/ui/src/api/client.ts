import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths, components } from "./schema";

const fetchClient = createFetchClient<paths>({
	baseUrl: "",
});

export const $api = createClient(fetchClient);

export type Invocation = components["schemas"]["Invocation"];
export type InvocationMessage = components["schemas"]["InvocationMessage"];
