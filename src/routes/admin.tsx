import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminPage = lazy(() => import("@/components/admin/AdminPage"));

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin - GPCLUB Vietnam" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
          <div>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Loading admin...</p>
          </div>
        </main>
      }
    >
      <AdminPage />
    </Suspense>
  );
}
