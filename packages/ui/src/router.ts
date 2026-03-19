import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "#routes/__root.tsx";
import { AgentSessionsPage } from "#routes/agent-sessions.tsx";
import { ConfigPage } from "#routes/config.tsx";
import { EnqueuePage } from "#routes/enqueue.tsx";
import { Dashboard } from "#routes/index.tsx";
import { IntegrationsPage } from "#routes/integrations.tsx";

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

const enqueueRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/enqueue",
	component: EnqueuePage,
});

const integrationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/integrations",
	component: IntegrationsPage,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	agentSessionsRoute,
	agentSessionDetailRoute,
	configRoute,
	enqueueRoute,
	integrationsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
