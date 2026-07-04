import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { RoutePendingShell } from "./components/site/RoutePendingShell";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPendingComponent: RoutePendingShell,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
