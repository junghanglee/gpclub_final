import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function RoutePending() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80]"
    >
      <div className="h-0.5 w-full overflow-hidden bg-border/70">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>
      <div className="absolute right-4 top-3 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-soft backdrop-blur">
        Loading page...
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPendingComponent: RoutePending,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
