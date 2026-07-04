import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminPage = lazy(() => import("@/components/admin/AdminPage"));

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin - GPCLUB Vietnam" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminPage />
    </Suspense>
  );
}

function AdminShellSkeleton() {
  return (
    <main className="min-h-screen bg-background" aria-busy="true">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-muted" />
            <div className="h-7 w-56 rounded-full bg-muted" />
          </div>
          <div className="h-10 w-28 rounded-full bg-muted" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3 rounded-2xl border border-border bg-card p-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-10 rounded-xl bg-muted" />
          ))}
        </aside>
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-card p-5">
                <div className="h-4 w-24 rounded-full bg-muted" />
                <div className="mt-4 h-8 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="h-5 w-40 rounded-full bg-muted" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
                  <div className="h-10 rounded-xl bg-muted" />
                  <div className="h-10 rounded-xl bg-muted" />
                  <div className="h-10 rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
