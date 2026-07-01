import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ExternalLink, PackageOpen, PlayCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";
import gippyEventHero from "@/assets/gippy-event-hero.png";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Event — GPCLUB Vietnam" }] }),
  component: EventsPage,
});

type EventRow = {
  id: string;
  title_vi: string;
  title_en: string;
  summary_vi: string | null;
  summary_en: string | null;
  body_vi: string | null;
  body_en: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "embed";
  cta_label_vi: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  event_date: string | null;
  featured: boolean;
  published: boolean;
  post_type?: "event" | "new_product" | null;
};

function isEmbeddable(url: string) {
  return url.includes("youtube.com/embed/") || url.includes("player.vimeo.com/");
}

function MediaPreview({ item }: { item: EventRow }) {
  if (!item.media_url) {
    return (
      <div className="grid aspect-video place-items-center rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-gold/15 to-secondary text-sm font-bold uppercase tracking-[0.2em] text-foreground/50">
        {item.post_type === "new_product" ? "New Product" : "GPCLUB Event"}
      </div>
    );
  }
  if (item.media_type === "video") {
    return (
      <video
        src={item.media_url}
        controls
        className="aspect-video w-full rounded-[1.75rem] bg-black object-cover"
      />
    );
  }
  if (item.media_type === "embed" && isEmbeddable(item.media_url)) {
    return (
      <iframe
        src={item.media_url}
        title={item.title_en}
        className="aspect-video w-full rounded-[1.75rem] bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <img
      src={item.media_url}
      alt={item.title_en}
      className="aspect-video w-full rounded-[1.75rem] object-cover"
    />
  );
}

function EventsPage() {
  const { lang } = useI18n();
  const page = usePageContent("events");
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: false })
        .order("event_date", { ascending: false })
        .order("created_at", { ascending: false });
      setRows((data ?? []) as EventRow[]);
      setLoading(false);
    })();
  }, []);

  const newProducts = useMemo(
    () => rows.filter((r) => r.post_type === "new_product").slice(0, 3),
    [rows],
  );
  const eventRows = useMemo(() => rows.filter((r) => r.post_type !== "new_product"), [rows]);
  const featured = useMemo(() => eventRows.find((r) => r.featured) ?? eventRows[0], [eventRows]);
  const rest = useMemo(() => eventRows.filter((r) => r.id !== featured?.id), [eventRows, featured]);

  return (
    <main className="overflow-hidden bg-background">
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-36 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-accent/50 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {page.kicker[lang]}
            </div>
            <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              {page.title[lang]}{" "}
              <span className="bg-gradient-pink bg-clip-text text-transparent">
                {page.highlight[lang]}
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-[16px] leading-relaxed text-foreground/75 lg:mx-0">
              {page.description[lang]}
            </p>
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <img
              src={gippyEventHero}
              alt="Gippy AI event mascot giving a thumbs up"
              loading="eager"
              decoding="async"
              className="aspect-[3/4] max-h-[414px] w-full max-w-[311px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {!loading && newProducts.length > 0 && (
        <section className="border-b border-border/60 bg-secondary/35">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                <Sparkles className="h-4 w-4" /> New Product Spotlight
              </div>
              <h2 className="mt-3 font-display text-3xl font-black tracking-tight md:text-5xl">
                {lang === "vi" ? "Sản phẩm mới trong tháng" : "This month’s new arrivals"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/65 md:text-base">
                {lang === "vi"
                  ? "Các sản phẩm mới do quản trị viên cập nhật sẽ được ưu tiên hiển thị tại đây."
                  : "Admin-selected launches are highlighted here so visitors can see the latest 2–3 products immediately."}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {newProducts.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative">
                    <MediaPreview item={item} />
                    <Badge className="absolute left-4 top-4 gap-1 rounded-full bg-primary text-primary-foreground">
                      <PackageOpen className="h-3.5 w-3.5" /> New
                    </Badge>
                  </div>
                  <div className="p-6">
                    {item.event_date && (
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {new Date(item.event_date).toLocaleDateString()}
                      </div>
                    )}
                    <h3 className="mt-2 font-display text-2xl font-black leading-tight">
                      {lang === "vi" ? item.title_vi : item.title_en}
                    </h3>
                    {(item.summary_vi || item.summary_en) && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {lang === "vi" ? item.summary_vi : item.summary_en}
                      </p>
                    )}
                    {item.cta_url && (
                      <Button asChild variant="outline" size="sm" className="mt-5 rounded-full">
                        <a href={item.cta_url} target="_blank" rel="noreferrer">
                          {lang === "vi"
                            ? item.cta_label_vi || "Xem sản phẩm"
                            : item.cta_label_en || "View product"}
                        </a>
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {loading && (
          <div className="rounded-3xl border border-dashed border-border/70 p-16 text-center text-muted-foreground">
            Loading events…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/70 p-16 text-center">
            <h2 className="font-display text-2xl">
              {lang === "vi" ? "Chưa có sự kiện được đăng." : "No published events yet."}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {lang === "vi"
                ? "Các sự kiện mới sẽ được cập nhật tại đây."
                : "New events will appear here once published."}
            </p>
          </div>
        )}

        {featured && (
          <article className="grid gap-8 rounded-[2rem] border border-border/60 bg-card p-4 shadow-soft lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
            <MediaPreview item={featured} />
            <div className="flex flex-col justify-center p-3 lg:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge>{lang === "vi" ? "Nổi bật" : "Featured"}</Badge>
                {featured.event_date && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />{" "}
                    {new Date(featured.event_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2 className="font-display text-3xl font-black leading-tight md:text-5xl">
                {lang === "vi" ? featured.title_vi : featured.title_en}
              </h2>
              {(featured.summary_vi || featured.summary_en) && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/65 md:text-base">
                  {lang === "vi" ? featured.summary_vi : featured.summary_en}
                </p>
              )}
              {(featured.body_vi || featured.body_en) && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/75">
                  {lang === "vi" ? featured.body_vi : featured.body_en}
                </p>
              )}
              {featured.cta_url && (
                <Button asChild className="mt-6 w-fit rounded-full">
                  <a href={featured.cta_url} target="_blank" rel="noreferrer">
                    {lang === "vi"
                      ? featured.cta_label_vi || "Xem thêm"
                      : featured.cta_label_en || "Learn more"}{" "}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </article>
        )}

        {rest.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative">
                  <MediaPreview item={item} />
                  {item.media_type !== "image" && (
                    <PlayCircle className="absolute bottom-4 right-4 h-9 w-9 rounded-full bg-background/80 p-1 text-primary" />
                  )}
                </div>
                <div className="p-5">
                  {item.event_date && (
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {new Date(item.event_date).toLocaleDateString()}
                    </div>
                  )}
                  <h3 className="mt-2 font-display text-xl font-black leading-tight">
                    {lang === "vi" ? item.title_vi : item.title_en}
                  </h3>
                  {(item.summary_vi || item.summary_en) && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {lang === "vi" ? item.summary_vi : item.summary_en}
                    </p>
                  )}
                  {item.cta_url && (
                    <a
                      href={item.cta_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-bold text-primary"
                    >
                      {lang === "vi"
                        ? item.cta_label_vi || "Xem thêm"
                        : item.cta_label_en || "Learn more"}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
