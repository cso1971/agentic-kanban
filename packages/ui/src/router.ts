import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { Dashboard } from "./routes/index";
import { InvocationsPage } from "./routes/invocations";

const rootRoute = createRootRoute({
	component: RootLayout,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: Dashboard,
});

const invocationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/invocations",
	component: InvocationsPage,
});

const routeTree = rootRoute.addChildren([indexRoute, invocationsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
