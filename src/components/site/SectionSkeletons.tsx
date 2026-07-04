import { Link } from "@tanstack/react-router";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type CountProps = {
  count?: number;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10 ${className}`}
      data-skeleton="true"
      aria-hidden="true"
    />
  );
}

function VisualSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full animate-pulse items-center justify-center border border-primary/10 bg-gradient-to-br from-primary/15 via-secondary to-primary/10 text-primary/60 ${className}`}
      data-skeleton="true"
      aria-hidden="true"
    >
      <ImageIcon className="h-8 w-8" />
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="max-w-3xl space-y-4" aria-busy="true">
      <SkeletonLine className="h-4 w-28" />
      <SkeletonLine className="h-10 w-4/5 md:h-14" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}

export function HeroCopySkeleton({ withCta = false }: { withCta?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5 lg:mx-0" aria-busy="true">
      <SkeletonLine className="mx-auto h-3 w-32 lg:mx-0" />
      <div className="space-y-3">
        <SkeletonLine className="h-12 w-full md:h-16" />
        <SkeletonLine className="mx-auto h-12 w-3/4 md:h-16 lg:mx-0" />
      </div>
      <div className="space-y-3 pt-2">
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="mx-auto h-4 w-5/6 lg:mx-0" />
      </div>
      {withCta ? (
        <div className="flex flex-wrap justify-center gap-3 pt-3 lg:justify-start">
          <SkeletonLine className="h-12 w-40 rounded-none bg-primary/20" />
          <SkeletonLine className="h-12 w-36 rounded-none" />
        </div>
      ) : null}
    </div>
  );
}

export function ProductImageSkeleton({ small = false }: { small?: boolean }) {
  return <VisualSkeleton className={small ? "aspect-square p-3" : "aspect-square p-4"} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card" aria-hidden="true">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <ProductImageSkeleton />
        <div className="absolute left-3 top-3 h-6 w-16 rounded-full bg-background/80" />
      </div>
      <div className="space-y-3 p-4">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-3 w-2/3" />
        <SkeletonLine className="h-3 w-24 bg-primary/20" />
      </div>
    </div>
  );
}

export function ProductCardSkeletonGrid({ count = 8 }: CountProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton({ backLabel }: { backLabel: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 rounded-full">
        <Link to="/products">
          <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
        </Link>
      </Button>
      <div className="grid gap-10 lg:grid-cols-12" aria-busy="true">
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-muted">
            <ProductImageSkeleton />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-dashed border-border bg-card"
              >
                <ProductImageSkeleton small />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="flex flex-wrap gap-2">
            <SkeletonLine className="h-6 w-24 bg-secondary" />
            <div className="h-6 w-28 rounded-full border border-border" />
          </div>
          <SkeletonLine className="mt-6 h-12 w-4/5 md:h-16" />
          <SkeletonLine className="mt-4 h-5 w-full" />
          <SkeletonLine className="mt-3 h-5 w-2/3" />
          <div className="mt-8 rounded-3xl border border-border bg-card p-5">
            <SkeletonLine className="h-7 w-48" />
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-secondary p-4">
                  <SkeletonLine className="h-4 w-1/2 bg-muted-foreground/20" />
                  <SkeletonLine className="mt-2 h-3 w-3/4 bg-muted-foreground/15" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-border bg-card p-5">
            <SkeletonLine className="h-7 w-44" />
            <div className="mt-5 space-y-3">
              <SkeletonLine className="h-4 w-full" />
              <SkeletonLine className="h-4 w-11/12" />
              <SkeletonLine className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CatalogTabsSkeleton({ includedProductsLabel }: { includedProductsLabel: string }) {
  return (
    <div aria-busy="true">
      <div className="sticky top-20 z-20 flex h-auto w-full flex-wrap justify-start gap-2 rounded-3xl border border-border bg-white/90 p-2 shadow-soft backdrop-blur">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-secondary px-4 py-3">
            <SkeletonLine className="h-4 w-36" />
            <SkeletonLine className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <article className="mt-6 rounded-[2rem] border border-border bg-white/90 p-5 shadow-soft backdrop-blur md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <SkeletonLine className="h-6 w-28 bg-secondary" />
              <div className="h-6 w-24 rounded-full border border-border" />
            </div>
            <SkeletonLine className="mt-5 h-9 w-3/4 bg-secondary" />
            <SkeletonLine className="mt-3 h-5 w-2/3 bg-secondary" />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <div className="h-10 w-32 bg-foreground" />
            <div className="h-10 w-32 border border-border bg-white" />
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
            {includedProductsLabel}
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <IncludedProductsSkeleton />
          </div>
        </div>
      </article>
    </div>
  );
}

export function IncludedProductsSkeleton({ count = 6 }: CountProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <SkeletonLine className="h-3 w-20 bg-secondary" />
          <SkeletonLine className="mt-3 h-4 w-full bg-secondary" />
          <SkeletonLine className="mt-2 h-3 w-1/2 bg-secondary" />
        </div>
      ))}
    </>
  );
}

export function CatalogProductSkeleton({ count = 4 }: CountProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="break-inside-avoid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm print:rounded-2xl print:shadow-none"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-[#f6efe9]">
            <VisualSkeleton className="text-pink-500/70" />
            <div className="absolute left-4 top-4 h-6 w-10 rounded-full bg-white/92 shadow-sm" />
          </div>
          <div className="space-y-3 p-6">
            <div className="h-5 w-28 rounded-full bg-slate-100" />
            <div className="h-7 w-4/5 rounded-full bg-slate-100" />
            <div className="h-4 w-full rounded-full bg-slate-100" />
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          </div>
        </article>
      ))}
    </>
  );
}

export function CatalogCoverSkeleton() {
  return (
    <section
      className="catalog-cover relative isolate grid min-h-[820px] overflow-hidden bg-[#151014] text-white md:grid-cols-2 print:min-h-[980px] print:grid-cols-2"
      aria-busy="true"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.45),transparent_34%),linear-gradient(135deg,#120e11,#2a1622_55%,#f7b6c9)]" />
      <div className="flex flex-col justify-between p-10 md:p-14 print:p-12">
        <div>
          <div className="inline-flex items-center gap-2 border-b border-white/40 pb-2">
            <SkeletonLine className="h-3 w-36 bg-white/30" />
          </div>
          <div className="mt-10 space-y-4">
            <div className="h-16 w-full max-w-xl rounded-full bg-white/18 md:h-20" />
            <div className="h-16 w-4/5 rounded-full bg-white/18 md:h-20" />
          </div>
          <div className="mt-7 space-y-3">
            <div className="h-5 w-full max-w-xl rounded-full bg-white/16" />
            <div className="h-5 w-2/3 rounded-full bg-white/16" />
          </div>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-3 text-center">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="mx-auto h-9 w-14 rounded-full bg-white/20" />
              <div className="mx-auto mt-3 h-3 w-16 rounded-full bg-white/16" />
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-h-[420px] p-10 md:p-14 print:p-12">
        <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="relative h-full min-h-[620px] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl print:min-h-[760px]">
          <VisualSkeleton className="bg-transparent text-white/45" />
        </div>
      </div>
    </section>
  );
}

export function EventTimelineSkeleton() {
  return (
    <>
      <article className="grid gap-8 rounded-[2rem] border border-border/60 bg-card p-4 shadow-soft lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
        <div className="aspect-video overflow-hidden rounded-[1.75rem] bg-muted">
          <VisualSkeleton />
        </div>
        <div className="flex flex-col justify-center space-y-4 p-3 lg:p-6">
          <SkeletonLine className="h-5 w-24" />
          <SkeletonLine className="h-10 w-4/5" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="h-10 w-32" />
        </div>
      </article>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <EventCardSkeleton count={3} />
      </div>
    </>
  );
}

export function EventCardSkeleton({ count = 3 }: CountProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft"
        >
          <div className="aspect-video overflow-hidden bg-muted">
            <VisualSkeleton />
          </div>
          <div className="space-y-3 p-5">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-6 w-4/5" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-2/3" />
          </div>
        </article>
      ))}
    </>
  );
}

export function EventMediaSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`aspect-video overflow-hidden bg-muted ${className}`} aria-hidden="true">
      <VisualSkeleton />
    </div>
  );
}

export function ImageSlotSkeletonGrid({ slots }: { slots: string[] }) {
  return (
    <>
      {slots.map((slot) => (
        <div
          key={slot}
          className="group relative overflow-hidden border border-border bg-background"
        >
          <div className="aspect-[4/3] overflow-hidden border border-dashed border-primary/40 bg-primary/5">
            <VisualSkeleton />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
            <div className="text-xs font-bold uppercase tracking-[0.2em]">{slot}</div>
            <div className="mt-2 h-2 w-24 rounded-full bg-white/30" />
          </div>
        </div>
      ))}
    </>
  );
}

export function BrandImageSkeleton() {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-sm border border-dashed border-primary/30 bg-primary/5 shadow-sm md:col-span-2">
      <VisualSkeleton />
    </div>
  );
}

export function ContactRowSkeleton() {
  return (
    <span
      className="inline-block h-3 w-36 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10"
      data-skeleton="true"
      aria-hidden="true"
    />
  );
}

export function FaqSkeletonItems({ count = 4 }: CountProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <AccordionItem key={index} value={`loading-${index}`} className="px-4">
          <AccordionTrigger className="text-left text-base font-semibold">
            <SkeletonLine className="h-4 w-3/4" />
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 py-2">
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-2/3" />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </>
  );
}
