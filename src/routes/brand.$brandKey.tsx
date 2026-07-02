import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BRAND_KEYS,
  DEFAULT_BRAND_DETAILS,
  fetchBrandDetails,
  iconForKey,
  useBrandDetails,
  type BrandDetail,
} from "@/lib/brand-details";

export const Route = createFileRoute("/brand/$brandKey")({
  loader: async ({ params }) => {
    const details = await fetchBrandDetails();
    const data = details[params.brandKey] ?? DEFAULT_BRAND_DETAILS[params.brandKey];
    if (!data) throw notFound();
    return { data };
  },
  head: ({ loaderData }) => {
    const meta = loaderData?.data?.meta;
    return {
      meta: meta
        ? [
            { title: meta.title },
            { name: "description", content: meta.description },
            { property: "og:title", content: meta.title },
            { property: "og:description", content: meta.description },
            { property: "og:image", content: loaderData!.data.hero },
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-32 text-center">
      <h1 className="font-display text-4xl font-black">Brand not found</h1>
      <p className="mt-3 text-foreground/65">요청하신 브랜드를 찾을 수 없습니다.</p>
      <Link to="/brand" className="mt-6 inline-flex items-center gap-2 text-primary">
        <ArrowLeft className="h-4 w-4" /> 브랜드 허브로
      </Link>
    </div>
  ),
  component: BrandDetailPage,
});

function BrandDetailPage() {
  const { data } = Route.useLoaderData() as { data: BrandDetail };
  const { details } = useBrandDetails();
  const otherKeys = Object.keys(details).filter((k) => k !== data.key);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-luxe">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-6">
            <Link
              to="/brand"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/55 hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" /> Brands
            </Link>
            <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {data.sub}
            </div>
            <h1 className="mt-4 font-display text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              {data.name}
            </h1>
            <p className="mt-6 max-w-xl font-display text-lg font-semibold text-foreground/80 md:text-xl">
              {data.tagline}
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-foreground/70">
              {data.story}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-none bg-foreground px-7 text-sm font-bold uppercase tracking-[0.18em] text-background hover:bg-primary">
                <Link to="/b2b">파트너십 문의 <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-foreground px-7 text-sm font-bold uppercase tracking-[0.18em] text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground">
                <Link to="/contact">제품 카탈로그 요청</Link>
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6"
          >
            <div className="overflow-hidden">
              <img
                src={data.hero}
                alt={data.name}
                className="aspect-[4/5] w-full object-cover"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* HERITAGE */}
      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
          <div className="md:col-span-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">HERITAGE</div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight md:text-4xl">
              브랜드의 흔적
            </h2>
          </div>
          <p className="md:col-span-8 text-[15px] leading-relaxed text-foreground/75">
            {data.heritage}
          </p>
        </div>
      </section>

      {/* SIGNATURE LINEUP */}
      <section className="border-t border-border bg-secondary/40 py-20 md:py-28">
        <div className="mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">SIGNATURE LINEUP</div>
              <h2 className="mt-4 font-display text-3xl font-black tracking-tight md:text-5xl">
                대표 시그니처 컬렉션
              </h2>
            </div>
            <Link to="/products" className="text-[12px] font-bold uppercase tracking-[0.22em] text-foreground/65 hover:text-primary">
              전체 라인업 보기 →
            </Link>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {data.signature.map((p, i) => (
              <motion.article
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
                className="group flex flex-col gap-3 bg-background p-7 transition hover:bg-accent/30"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{p.line}</div>
                <div className="font-display text-[15px] font-bold leading-snug text-foreground">{p.name}</div>
                <p className="text-[13px] text-foreground/65">{p.note}</p>
                <Link to="/b2b" className="mt-auto inline-flex items-center gap-1 pt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/55 transition group-hover:text-primary">
                  B2B 가격 문의 <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / TECHNOLOGY */}
      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">TECHNOLOGY & CARE</div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
              브랜드를 떠받치는 기술
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
            {data.features.map((f) => {
              const Icon = iconForKey(f.iconKey);
              return (
                <div key={f.title} className="flex flex-col gap-4 bg-background p-8">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{f.sub}</div>
                  <div className="font-display text-xl font-black tracking-tight">{f.title}</div>
                  <p className="text-[14px] leading-relaxed text-foreground/70">{f.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Verified by GPCLUB Vietnam R&D
          </div>
        </div>
      </section>

      {/* OTHER BRANDS */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">OTHER BRANDS</div>
          <h3 className="mt-3 font-display text-2xl font-black tracking-tight md:text-3xl">
            다른 브랜드도 둘러보세요
          </h3>
          <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
            {otherKeys.map((k) => {
              const b = details[k];
              if (!b) return null;
              return (
                <Link
                  key={k}
                  to="/brand/$brandKey"
                  params={{ brandKey: k }}
                  className="group flex items-end justify-between bg-background p-8 transition hover:bg-accent/30"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{b.sub}</div>
                    <div className="mt-1 font-display text-2xl font-black tracking-tight">{b.name}</div>
                    <p className="mt-2 max-w-md text-[13px] text-foreground/65">{b.tagline}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-foreground/40 transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
