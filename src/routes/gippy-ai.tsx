import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  MessageCircle,
  Package,
  Search,
  Sparkle,
  Sparkles,
} from "lucide-react";
import gippyAiHero from "@/assets/gippy-ai-hero.png";
import { HeroCopySkeleton } from "@/components/site/SectionSkeletons";
import { Button } from "@/components/ui/button";
import { openGippy } from "@/lib/gippy-bus";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/gippy-ai")({
  head: () => ({
    meta: [
      { title: "Gippy AI — K-Beauty 상담 · 제품 추천 · B2B | GPCLUB Vietnam" },
      {
        name: "description",
        content:
          "Gippy AI와 1:1 대화로 K-Beauty 제품 추천, 피부 고민 상담, B2B 파트너십, 고객 문의까지 한 번에 해결하세요.",
      },
      { property: "og:title", content: "Gippy AI — K-Beauty AI Consultant" },
      {
        property: "og:description",
        content: "JMsolution, Jmella and Trois Touch partner guidance from GPCLUB Vietnam.",
      },
    ],
  }),
  component: GippyAIPage,
});

const SUGGESTIONS: {
  icon: React.ReactNode;
  title: { vi: string; en: string };
  sub: { vi: string; en: string };
  prompt: { vi: string; en: string };
}[] = [
  {
    icon: <Sparkle className="h-4 w-4" />,
    title: { vi: "Danh mục bán lại", en: "Reseller Lineup" },
    sub: {
      vi: "Gợi ý danh mục JMsolution / Jmella / Trois Touch theo kênh bán",
      en: "JMsolution / Jmella / Trois Touch lineup guidance by sales channel",
    },
    prompt: {
      vi: "Hãy gợi ý danh mục sản phẩm GPCLUB phù hợp cho kênh bán của tôi.",
      en: "Please recommend a GPCLUB product lineup for my sales channel.",
    },
  },
  {
    icon: <Package className="h-4 w-4" />,
    title: { vi: "Câu chuyện bán hàng", en: "Sales Story" },
    sub: {
      vi: "Thông điệp bán hàng, điểm mạnh sản phẩm và cách trưng bày",
      en: "Sales messages, product strengths and merchandising angles",
    },
    prompt: {
      vi: "Hãy giúp tôi tạo câu chuyện bán hàng cho JMsolution, Jmella hoặc Trois Touch.",
      en: "Help me build a sales story for JMsolution, Jmella or Trois Touch.",
    },
  },
  {
    icon: <Briefcase className="h-4 w-4" />,
    title: { vi: "Hợp tác B2B", en: "B2B Partnership" },
    sub: {
      vi: "Kết nối đại lý, phân phối và yêu cầu bán sỉ",
      en: "Dealer, distribution and wholesale inquiry connection",
    },
    prompt: {
      vi: "Tôi muốn hỏi về hợp tác B2B, đại lý hoặc phân phối với GPCLUB.",
      en: "I want to ask about GPCLUB B2B, dealer or distribution partnership.",
    },
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    title: { vi: "Hỗ trợ đối tác", en: "Partner Support" },
    sub: {
      vi: "Kết nối báo giá, tài liệu sản phẩm và thông tin hợp tác",
      en: "Quote, product material and partnership support routing",
    },
    prompt: {
      vi: "Tôi cần báo giá, tài liệu sản phẩm hoặc thông tin hỗ trợ đối tác.",
      en: "I need pricing, product materials or partner support information.",
    },
  },
];

const QUICK_ACTIONS = [
  {
    icon: <MessageCircle className="h-4 w-4" />,
    label: { vi: "Mở Gippy AI", en: "Open Gippy AI" },
    body: {
      vi: "Bắt đầu hỏi về sản phẩm, cách bán, hoặc hợp tác.",
      en: "Ask about products, selling angles, or partnership flow.",
    },
    kind: "gippy",
  },
  {
    icon: <Search className="h-4 w-4" />,
    label: { vi: "Xem sản phẩm", en: "Browse products" },
    body: {
      vi: "Mở danh mục sản phẩm đang được đăng trên GPCLUB.",
      en: "Open the current GPCLUB product catalog.",
    },
    kind: "products",
  },
  {
    icon: <Briefcase className="h-4 w-4" />,
    label: { vi: "Yêu cầu B2B", en: "B2B inquiry" },
    body: {
      vi: "Gửi yêu cầu hợp tác nếu đã sẵn sàng trao đổi với đội ngũ.",
      en: "Send a partnership inquiry when you are ready to talk to the team.",
    },
    kind: "b2b",
  },
] as const;

function GippyAIPage() {
  const { lang } = useI18n();
  const { content: page, loading: pageLoading } = usePageContent("gippy-ai");
  const pick = (text: { vi: string; en: string }) => text[lang];

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-background via-background to-secondary/30">
      <GippyHeroSection page={page} loading={pageLoading} />
      <section
        id="gippy-guide"
        className="border-t border-border/60 bg-background/90 py-10 md:py-14"
      >
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Gippy Quick Guide
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-foreground md:text-3xl">
                {lang === "vi" ? "Chọn chủ đề tư vấn" : "Choose your consultation topic"}
              </h2>
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-muted-foreground">
              {lang === "vi"
                ? "Chọn chủ đề để Gippy mở cuộc trò chuyện đúng mục đích, hoặc đi thẳng đến danh mục sản phẩm và biểu mẫu B2B."
                : "Choose a topic to open the right Gippy conversation, or go directly to products and the B2B inquiry flow."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.title.en}
                type="button"
                onClick={() => openGippy(item.prompt[lang])}
                className="group rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  {item.icon}
                </div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {pick(item.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pick(item.sub)}
                </p>
                <div className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {lang === "vi" ? "Hỏi Gippy" : "Ask Gippy"}{" "}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {QUICK_ACTIONS.map((item) => {
              const content = (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">
                      {item.label[lang]}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.body[lang]}
                    </p>
                  </div>
                </>
              );

              if (item.kind === "products") {
                return (
                  <Link
                    key={item.kind}
                    to="/products"
                    className="flex gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    {content}
                  </Link>
                );
              }

              if (item.kind === "b2b") {
                return (
                  <Link
                    key={item.kind}
                    to="/b2b"
                    className="flex gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() =>
                    openGippy(
                      lang === "vi"
                        ? "Xin chào Gippy, hãy hướng dẫn tôi cách chọn chủ đề tư vấn phù hợp."
                        : "Hi Gippy, please guide me to the right consultation topic.",
                    )
                  }
                  className="flex gap-3 rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- pieces ---------- */

function GippyHeroSection({
  page,
  loading,
}: {
  page: ReturnType<typeof usePageContent>["content"];
  loading: boolean;
}) {
  const { lang } = useI18n();
  if (loading) {
    return (
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-36 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-44 -left-24 h-[420px] w-[420px] rounded-full bg-accent/60 blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            <HeroCopySkeleton withCta />
          </div>
          <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
            <div className="relative aspect-[4/5] w-full max-w-[342px] sm:max-w-[342px]">
              <img
                src={gippyAiHero}
                alt="Gippy AI K-Beauty partner consultant mascot"
                loading="eager"
                decoding="async"
                className="relative z-10 h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-luxe">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-36 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -left-24 h-[420px] w-[420px] rounded-full bg-accent/60 blur-3xl"
      />
      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-12 lg:px-10">
        <div className="text-center lg:col-span-7 lg:text-left">
          <div className="inline-flex items-center gap-2 border-b border-primary/40 pb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            <Sparkles className="h-3 w-3" /> {page.kicker[lang]}
          </div>
          <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,4.75rem)] font-black leading-[1.04] tracking-[-0.025em] text-foreground">
            {page.title[lang]}{" "}
            <span className="bg-gradient-pink bg-clip-text text-transparent">
              {page.highlight[lang]}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] font-semibold leading-relaxed text-foreground/75 md:text-lg lg:mx-0">
            {page.description[lang]}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              size="lg"
              className="group h-12 rounded-none bg-foreground px-7 text-sm font-bold uppercase tracking-[0.16em] text-background hover:bg-primary"
              onClick={() =>
                openGippy(
                  lang === "vi"
                    ? "Xin chào Gippy, tôi muốn được tư vấn sản phẩm và hợp tác với GPCLUB."
                    : "Hi Gippy, I want product and partnership guidance from GPCLUB.",
                )
              }
            >
              <span className="inline-flex items-center">
                {lang === "vi" ? "Hỏi Gippy AI" : "Ask Gippy AI"}{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-none border-foreground px-7 text-sm font-bold uppercase tracking-[0.16em] text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <a href="#gippy-guide">{page.secondaryCta[lang]}</a>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2 text-left sm:max-w-xl">
            {[
              ["Product", lang === "vi" ? "Gợi ý sản phẩm" : "Partner catalog"],
              ["Sales", lang === "vi" ? "Câu chuyện bán hàng" : "Sales story"],
              ["B2B", lang === "vi" ? "Yêu cầu đối tác" : "B2B inquiry"],
            ].map(([top, bottom]) => (
              <div
                key={top}
                className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm backdrop-blur"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {top}
                </div>
                <div className="mt-1 text-xs font-semibold text-foreground/75">{bottom}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
          <div className="relative aspect-[4/5] w-full max-w-[342px] sm:max-w-[342px]">
            <div
              aria-hidden
              className="absolute left-[10%] top-[8%] h-10 w-10 rounded-full bg-primary/20 blur-sm"
            />
            <img
              src={gippyAiHero}
              alt="Gippy AI K-Beauty partner consultant mascot"
              loading="eager"
              decoding="async"
              className="relative z-10 h-full w-full object-contain "
            />
          </div>
        </div>
      </div>
    </section>
  );
}
