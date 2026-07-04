export function RoutePendingShell() {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80]">
        <div className="h-0.5 w-full overflow-hidden bg-border/70">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      </div>
      <section
        aria-live="polite"
        aria-busy="true"
        className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-luxe"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-36 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-accent/50 blur-3xl"
        />
        <div className="relative mx-auto grid min-h-[560px] max-w-[1200px] items-center gap-12 px-4 py-20 sm:min-h-[620px] sm:px-6 md:py-28 lg:min-h-[640px] lg:grid-cols-12 lg:px-10">
          <div className="mx-auto w-full max-w-2xl space-y-5 text-center lg:col-span-7 lg:mx-0 lg:text-left">
            <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10 lg:mx-0" />
            <div className="space-y-3">
              <div className="h-12 w-full animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10 md:h-16" />
              <div className="mx-auto h-12 w-3/4 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10 md:h-16 lg:mx-0" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
              <div className="mx-auto h-4 w-5/6 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10 lg:mx-0" />
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-3 lg:justify-start">
              <div className="h-12 w-40 animate-pulse rounded-none bg-primary/20 ring-1 ring-primary/10" />
              <div className="h-12 w-36 animate-pulse rounded-none bg-primary/15 ring-1 ring-primary/10" />
            </div>
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <div className="aspect-[3/4] max-h-[414px] w-full max-w-[311px] animate-pulse rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/15 via-secondary to-primary/10" />
          </div>
        </div>
        <span className="sr-only">Loading page</span>
      </section>
    </>
  );
}
