import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "#routes/__root.tsx";
import { Dashboard } from "#routes/index.tsx";
import { AgentSessionsPage } from "#routes/agent-sessions.tsx";
import { ConfigPage } from "#routes/config.tsx";

const rootRoute = createRootRoute({
	component: RootLayout,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: Dashboard,
});

const agentSessionsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/agent-sessions",
	component: AgentSessionsPage,
});

const agentSessionDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/agent-sessions/$sessionId",
	component: AgentSessionsPage,
});

const configRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/config",
	component: ConfigPage,
});

const routeTree = rootRoute.addChildren([indexRoute, agentSessionsRoute, agentSessionDetailRoute, configRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
