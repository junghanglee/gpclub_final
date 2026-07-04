import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useRouter } from "@tanstack/react-router";
import { lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import { FloatingChat } from "@/components/site/FloatingChat";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { SiteSettingsProvider } from "@/lib/site-settings";
import appCss from "../styles.css?url";

const GippyChat = lazy(() =>
  import("@/components/site/GippyChat").then((module) => ({
    default: module.GippyChat,
  })),
);
const PopupHost = lazy(() =>
  import("@/components/site/PopupHost").then((module) => ({
    default: module.PopupHost,
  })),
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GPCLUB Vietnam — JMsolution & Jmella K-Beauty Distributor" },
      {
        name: "description",
        content:
          "Official Vietnam distributor for JMsolution & Jmella. Premium K-beauty skincare, fragrance & body care for retailers and B2B partners.",
      },
      { name: "author", content: "GPCLUB Vietnam" },
      {
        property: "og:title",
        content: "GPCLUB Vietnam — JMsolution & Jmella K-Beauty Distributor",
      },
      {
        property: "og:description",
        content:
          "JMsolution & Jmella in Vietnam. AI beauty consultant, B2B inquiries, dealer recruitment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "GPCLUB Vietnam — JMsolution & Jmella K-Beauty Distributor",
      },
      {
        name: "description",
        content: "Builds a K-Beauty B2B platform for GPCLUB Vietnam with an AI beauty consultant.",
      },
      {
        property: "og:description",
        content: "Builds a K-Beauty B2B platform for GPCLUB Vietnam with an AI beauty consultant.",
      },
      {
        name: "twitter:description",
        content: "Builds a K-Beauty B2B platform for GPCLUB Vietnam with an AI beauty consultant.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1cea9c9b-bf19-4ed5-adf4-b71abaef0d50/id-preview-931a4c25--4e9a5c57-b454-4ff9-b423-c8a1f775d5b1.lovable.app-1778212868704.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1cea9c9b-bf19-4ed5-adf4-b71abaef0d50/id-preview-931a4c25--4e9a5c57-b454-4ff9-b423-c8a1f775d5b1.lovable.app-1778212868704.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isAdminArea = pathname === "/auth" || pathname.startsWith("/admin");

  if (isAdminArea) {
    return (
      <RootDocument>
        <QueryClientProvider client={queryClient}>
          <main key={pathname} className="min-h-screen flex-1">
            <Outlet />
          </main>
          <Toaster />
        </QueryClientProvider>
      </RootDocument>
    );
  }

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <SiteSettingsProvider>
          <I18nProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main key={pathname} className="flex-1 animate-page-in">
                <Outlet />
              </main>
              <Footer />
              <PublicEngagementLayer />
              <Toaster />
            </div>
          </I18nProvider>
        </SiteSettingsProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function PublicEngagementLayer() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(load, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(load, 1200);
    return () => globalThis.clearTimeout(id);
  }, []);

  if (!ready) return null;

  return (
    <>
      <Suspense fallback={null}>
        <GippyChat />
        <PopupHost />
      </Suspense>
      <FloatingChat />
    </>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
