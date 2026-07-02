import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Download, FlaskConical, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import gippyMainHero from "@/assets/gippy-main-hero.png";
import { B2BInquiryDialog } from "@/components/site/B2BInquiryDialog";
import { Button } from "@/components/ui/button";
import { getCoverImage, useCatalogProducts } from "@/lib/catalog-products";
import { useHomeContent } from "@/lib/home-content";
import { useI18n } from "@/lib/i18n";
import { useRepresentativeCatalog } from "@/lib/product-catalogs";

type BrandShowcaseItem = {
  name: "JMsolution" | "Jmella" | "Trois Touch";
  tagline: string;
  description: string;
  accent: string;
};

const brands: BrandShowcaseItem[] = [
  {
    name: "JMsolution",
    tagline: "Marine science meets K-Beauty",
    description:
      "Korea's leading sheet-mask brand, trusted across Asia with marine-derived ingredients and dermatologically tested formulas.",
    accent: "from-sky-50 via-white to-cyan-50",
  },
  {
    name: "Jmella",
    tagline: "Parisian elegance, Korean craft",
    description:
      "A French-inspired fragrance and body-care house — bottled in Korea and loved across Southeast Asia.",
    accent: "from-pink-50 via-white to-rose-50",
  },
  {
    name: "Trois Touch",
    tagline: "Makeup for modern retail",
    description:
      "A color cosmetics line designed for trend-driven beauty shelves and everyday customer routines.",
    accent: "from-amber-50 via-white to-yellow-50",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GPCLUB Vietnam — K-Beauty B2B Growth Partner" },
      {
        name: "description",
        content:
          "Official Vietnam partner platform for JMsolution, Jmella and Trois Touch. Built for resellers, wholesale distributors, retail chains and OEM/ODM beauty partners.",
      },
      {
        property: "og:title",
        content: "GPCLUB Vietnam — K-Beauty B2B Growth Partner",
      },
      {
        property: "og:description",
        content: "Marketing and B2B partnership hub for proven K-Beauty brands in Vietnam.",
      },
    ],
  }),
  component: HomePage,
});

type BilingualText = { vi: string; en: string };

const brandCopy: Record<string, Record<"vi" | "en", { tagline: string; description: string }>> = {
  JMsolution: {
    vi: {
      tagline: "Khoa học biển gặp gỡ K-Beauty",
      description:
        "Thương hiệu mặt nạ hàng đầu Hàn Quốc, được tin dùng rộng rãi tại châu Á với thành phần từ biển và công thức được kiểm nghiệm da liễu.",
    },
    en: {
      tagline: "Marine science meets K-Beauty",
      description:
        "Korea's leading sheet-mask brand, trusted across Asia with marine-derived ingredients and dermatologically tested formulas.",
    },
  },
  Jmella: {
    vi: {
      tagline: "Thanh lịch kiểu Paris, chế tác tại Hàn Quốc",
      description:
        "Thương hiệu hương thơm và chăm sóc cơ thể lấy cảm hứng từ Pháp, sản xuất tại Hàn Quốc và được yêu thích khắp Đông Nam Á.",
    },
    en: {
      tagline: "Parisian elegance, Korean craft",
      description:
        "A French-inspired fragrance and body-care house — bottled in Korea and loved across Southeast Asia.",
    },
  },
  "Trois Touch": {
    vi: {
      tagline: "Trang điểm hiện đại cho bán lẻ",
      description:
        "Dòng mỹ phẩm trang điểm bắt nhịp xu hướng, phù hợp cho kệ hàng làm đẹp và thói quen sử dụng hằng ngày.",
    },
    en: {
      tagline: "Makeup for modern retail",
      description:
        "A color cosmetics line designed for trend-driven beauty shelves and everyday customer routines.",
    },
  },
};

const partnerBenefits: { title: BilingualText; text: BilingualText }[] = [
  {
    title: { vi: "Biên lợi nhuận rõ ràng", en: "Clear partner margin" },
    text: {
      vi: "Nguồn hàng trực tiếp giúp tối ưu giá nhập và hạn chế rủi ro trung gian.",
      en: "Direct official supply helps protect pricing, margin and channel transparency.",
    },
  },
  {
    title: { vi: "Danh mục dễ bán", en: "Shelf-ready portfolio" },
    text: {
      vi: "Nước hoa, chăm sóc da, tóc và body care phù hợp nhiều phân khúc khách hàng.",
      en: "Skincare, fragrance, body care and makeup designed for multiple reseller and retail channels.",
    },
  },
  {
    title: { vi: "Marketing cùng triển khai", en: "Co-marketing support" },
    text: {
      vi: "Hỗ trợ nội dung, đào tạo sản phẩm và chiến dịch địa phương hóa cho đối tác.",
      en: "Localized content, product training and launch assets to help move inventory.",
    },
  },
];

const partnerProcess: {
  step: string;
  title: BilingualText;
  text: BilingualText;
}[] = [
  {
    step: "01",
    title: { vi: "Chia sẻ mục tiêu", en: "Share your goal" },
    text: {
      vi: "Kênh bán, khu vực, sản lượng dự kiến hoặc nhu cầu OEM/ODM.",
      en: "Tell us your channel, region, volume target or OEM/ODM requirement.",
    },
  },
  {
    step: "02",
    title: { vi: "Nhận đề xuất", en: "Get a proposal" },
    text: {
      vi: "Đội ngũ GPCLUB tư vấn danh mục, giá và kế hoạch ra mắt phù hợp.",
      en: "We recommend portfolio, pricing structure and go-to-market plan.",
    },
  },
  {
    step: "03",
    title: { vi: "Ra mắt và tăng trưởng", en: "Launch and scale" },
    text: {
      vi: "Đồng hành với tài liệu bán hàng, chiến dịch và kế hoạch bổ sung hàng.",
      en: "We support sales materials, campaigns and replenishment planning.",
    },
  },
];

function HomePage() {
  const { lang } = useI18n();
  const { content: homeContent, loading: homeContentLoading } = useHomeContent();
  const { rows: catalogProducts } = useCatalogProducts();
  const { downloadPath } = useRepresentativeCatalog();
  const homeProducts = catalogProducts
    .filter((p) => p.is_featured || p.is_new || p.is_popular)
    .slice(0, 3);
  const hero = {
    kicker: homeContent.hero.kicker[lang],
    title: homeContent.hero.title[lang],
    subtitle: homeContent.hero.subtitle[lang],
    primaryCta: homeContent.hero.primaryCta[lang],
    secondaryCta: homeContent.hero.secondaryCta[lang],
    imageUrl: homeContent.hero.imageUrl,
    imageAlt: homeContent.hero.imageAlt[lang],
    stats: {
      masksValue: homeContent.stats.masksValue,
      masks: homeContent.stats.masksLabel[lang],
      countriesValue: homeContent.stats.countriesValue,
      countries: homeContent.stats.countriesLabel[lang],
      vietnamValue: homeContent.stats.vietnamValue,
      vietnam: homeContent.stats.vietnamLabel[lang],
    },
  };
  const heroTitleParts = hero.title.split("K-Beauty");
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    mass: 0.5,
  });
  const mascotY = useTransform(smooth, [0, 1], [0, -120]);
  const headlineY = useTransform(smooth, [0, 1], [0, 80]);
  const headlineOpacity = useTransform(smooth, [0, 0.8], [1, 0]);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  if (homeContentLoading) {
    return <main className="min-h-[60vh] bg-background" />;
  }

  return (
    <>
      <section ref={heroRef} className="relative isolate overflow-hidden bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-accent/60 blur-3xl"
        />

        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[1400px] grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[92vh] lg:grid-cols-12 lg:gap-10 lg:px-10">
          <motion.div
            style={{ y: headlineY, opacity: headlineOpacity }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="col-span-12 text-center lg:col-span-7 lg:text-left"
          >
            <div className="inline-flex max-w-full items-center gap-2 border-b border-primary/40 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:text-[11px] sm:tracking-[0.28em]">
              <Sparkles className="h-3 w-3" /> {hero.kicker}
            </div>

            <h1 className="mt-6 font-display font-black leading-[1.05] tracking-[-0.025em] text-foreground text-[clamp(2.15rem,10vw,5rem)] sm:mt-7">
              {heroTitleParts.length > 1 ? (
                <>
                  {heroTitleParts[0]}
                  <span className="bg-gradient-pink bg-clip-text text-transparent">K-Beauty</span>
                  {heroTitleParts.slice(1).join("K-Beauty")}
                </>
              ) : (
                hero.title
              )}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] font-semibold leading-relaxed text-foreground/80 md:text-lg lg:mx-0">
              {hero.subtitle}
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:items-start lg:justify-start">
              <Button
                type="button"
                size="lg"
                onClick={() => setInquiryOpen(true)}
                className="group h-12 w-full justify-center rounded-none bg-foreground px-5 text-xs font-bold uppercase tracking-[0.14em] text-background hover:bg-primary sm:w-auto sm:px-7 sm:text-sm sm:tracking-[0.18em]"
              >
                {hero.primaryCta}{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group h-12 w-full justify-center rounded-none border-foreground px-5 text-xs font-bold uppercase tracking-[0.14em] text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground sm:w-auto sm:px-7 sm:text-sm sm:tracking-[0.18em]"
              >
                <Link
                  to={downloadPath}
                  target={downloadPath.startsWith("/catalog/") ? "_blank" : undefined}
                >
                  <Download className="mr-2 h-4 w-4" /> {hero.secondaryCta}
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid w-full grid-cols-3 gap-3 text-sm text-foreground/70 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-12 sm:gap-y-4 lg:justify-start">
              <Stat value={hero.stats.masksValue} label={hero.stats.masks} />
              <Stat value={hero.stats.countriesValue} label={hero.stats.countries} />
              <Stat value={hero.stats.vietnamValue} label={hero.stats.vietnam} />
            </div>
          </motion.div>

          <motion.div
            className="relative col-span-12 lg:col-span-5"
            style={{ y: mascotY }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[300px] sm:max-w-[380px] lg:ml-auto lg:mr-0 lg:max-w-[421px]">
              <PinkStar
                className="absolute left-[6%] top-[14%] h-10 w-10 rotate-[12deg]"
                delay={0}
              />
              <PinkStar
                className="absolute right-[12%] top-[6%] h-16 w-16 -rotate-12"
                delay={0.4}
              />
              <PinkStar
                className="absolute right-[4%] top-[40%] h-8 w-8 rotate-[24deg]"
                delay={0.8}
              />
              <motion.img
                src={hero.imageUrl || gippyMainHero}
                alt={hero.imageAlt}
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_40px_60px_oklch(0.70_0.18_350/0.25)]"
                animate={{ y: [0, -16, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-16 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 md:grid-cols-12 lg:px-10">
          <div className="md:col-span-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {homeContent.partnerHook.kicker[lang]}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {homeContent.partnerHook.title[lang].replace(
                homeContent.partnerHook.highlight[lang],
                "",
              )}
              <span className="bg-gradient-pink bg-clip-text text-transparent">
                {homeContent.partnerHook.highlight[lang]}
              </span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-foreground/65">
              {homeContent.partnerHook.body[lang]}
            </p>
          </div>
          <div className="grid gap-4 md:col-span-7">
            {partnerBenefits.map((item) => (
              <BilingualCard key={item.title.en} title={item.title[lang]} text={item.text[lang]} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 md:grid-cols-3">
          {brands.map((b, idx) => {
            const copy = brandCopy[b.name]?.[lang] ?? {
              tagline: b.tagline,
              description: b.description,
            };
            return (
              <Link
                key={b.name}
                to="/brand"
                className={`group relative flex min-h-[320px] flex-col justify-end overflow-hidden bg-gradient-to-br ${b.accent} p-6 sm:p-10 md:min-h-[460px] md:p-16 ${
                  idx > 0 ? "md:border-l border-border" : ""
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/60 sm:text-[11px] sm:tracking-[0.3em]">
                  {copy.tagline}
                </div>
                <div className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
                  {b.name}
                </div>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/70">
                  {copy.description}
                </p>
                <span className="mt-7 inline-flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-primary">
                  {lang === "vi" ? "Tìm hiểu" : "Discover"}{" "}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-secondary py-16 md:py-32">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {homeContent.trust.kicker[lang]}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {homeContent.trust.title[lang]}
            </h2>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:mt-14 md:grid-cols-3">
            <Pillar
              num="01"
              icon={<ShieldCheck className="h-5 w-5" />}
              eng={homeContent.pillars[0].eng[lang]}
              title={homeContent.pillars[0].title[lang]}
              text={homeContent.pillars[0].text[lang]}
            />
            <Pillar
              num="02"
              icon={<FlaskConical className="h-5 w-5" />}
              eng={homeContent.pillars[1].eng[lang]}
              title={homeContent.pillars[1].title[lang]}
              text={homeContent.pillars[1].text[lang]}
            />
            <Pillar
              num="03"
              icon={<Globe2 className="h-5 w-5" />}
              eng={homeContent.pillars[2].eng[lang]}
              title={homeContent.pillars[2].title[lang]}
              text={homeContent.pillars[2].text[lang]}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-16 md:py-32">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
                {homeContent.process.kicker[lang]}
              </div>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
                {homeContent.process.title[lang]}
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-foreground/65">
                {homeContent.process.body[lang]}
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-border bg-border lg:col-span-7">
              {partnerProcess.map((p) => (
                <div
                  key={p.step}
                  className="grid gap-4 bg-background p-6 sm:grid-cols-[80px_1fr] sm:p-8"
                >
                  <div className="font-display text-5xl font-black text-primary/30">{p.step}</div>
                  <div>
                    <h3 className="font-display text-2xl font-black">{p.title[lang]}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                      {p.text[lang]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-16 md:py-32">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
                {homeContent.images.kicker[lang]}
              </div>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
                {homeContent.images.title[lang]}
              </h2>
              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-foreground/65">
                {homeContent.images.body[lang]}
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-foreground transition hover:text-primary"
            >
              {homeContent.images.cta[lang]} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
            {(homeProducts.length > 0 ? homeProducts : []).map((product) => (
              <Link
                key={product.id}
                to="/products/$productId"
                params={{ productId: product.id }}
                className="group overflow-hidden border border-border bg-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                {getCoverImage(product) ? (
                  <img
                    src={getCoverImage(product)}
                    alt={product.product_name}
                    className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <ImagePlaceholder label={product.product_name} />
                )}
                <div className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    {product.brand_name}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-black">{product.product_name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/65">
                    {product.short_intro}
                  </p>
                </div>
              </Link>
            ))}
            {homeProducts.length === 0 &&
              homeContent.images.labels[lang].map((label, index) => (
                <ImagePlaceholder
                  key={`${label}-${index}`}
                  label={label}
                  src={homeContent.images.urls[index]}
                  alt={homeContent.images.alts[lang][index] || label}
                />
              ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-foreground py-16 text-background md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10"
        />
        <div className="relative mx-auto max-w-[1200px] px-4 text-center sm:px-6 lg:px-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
            {homeContent.cta.kicker[lang]}
          </div>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
            {homeContent.cta.title[lang]}
            <br />
            <span className="text-primary">{homeContent.cta.highlight[lang]}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm opacity-80 md:text-base">
            {homeContent.cta.body[lang]}
          </p>
          <Button
            type="button"
            size="lg"
            onClick={() => setInquiryOpen(true)}
            className="mt-10 h-12 w-full justify-center rounded-none bg-primary px-6 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90 sm:w-auto sm:px-8 sm:text-sm sm:tracking-[0.18em]"
          >
            {homeContent.cta.button[lang]} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
      <B2BInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        source="Home page B2B CTA"
        defaultMessage="I am interested in becoming a GPCLUB Vietnam B2B partner."
        title="Register B2B inquiry without leaving this page"
      />
    </>
  );
}

function BilingualCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-accent/20 sm:p-6">
      <h3 className="font-display text-xl font-black">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-foreground/70">{text}</p>
    </article>
  );
}

function ImagePlaceholder({ label, src, alt }: { label: string; src?: string; alt?: string }) {
  return (
    <div className="group relative flex aspect-[4/3] min-h-[180px] flex-col items-center justify-center overflow-hidden border border-dashed border-primary/40 bg-primary/5 p-6 text-center sm:p-8">
      {src ? (
        <>
          <img
            src={src}
            alt={alt || label}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
          <div className="relative z-10 text-[11px] font-bold uppercase tracking-[0.28em] text-background drop-shadow">
            {label}
          </div>
        </>
      ) : (
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:text-[11px] sm:tracking-[0.28em]">
          {label}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <div className="font-display text-xl font-black text-foreground sm:text-2xl">{value}</div>
      <div className="mt-1 break-words text-[9px] font-bold uppercase leading-snug tracking-[0.12em] text-muted-foreground sm:text-[10px] sm:tracking-[0.22em]">
        {label}
      </div>
    </div>
  );
}

function Pillar({
  num,
  icon,
  eng,
  title,
  text,
}: {
  num: string;
  icon: React.ReactNode;
  eng: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative flex flex-col gap-5 bg-background p-6 transition hover:bg-accent/40 sm:p-10">
      <div className="flex items-start justify-between">
        <div className="font-display text-5xl font-black text-foreground/10 transition group-hover:text-primary/30">
          {num}
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">{eng}</div>
        <div className="mt-2 font-display text-2xl font-black tracking-tight">{title}</div>
      </div>
      <p className="text-[14px] leading-relaxed text-foreground/70">{text}</p>
    </div>
  );
}

function PinkStar({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0.8, 1.1, 0.9],
        opacity: [0.7, 1, 0.7],
        rotate: [0, 12, 0],
      }}
      transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
      fill="url(#pinkstar)"
      aria-hidden
    >
      <defs>
        <linearGradient id="pinkstar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.14 10)" />
          <stop offset="100%" stopColor="oklch(0.70 0.18 350)" />
        </linearGradient>
      </defs>
      <path d="M12 1.5l2 7.5 7.5 2-7.5 2-2 7.5-2-7.5-7.5-2 7.5-2z" />
    </motion.svg>
  );
}
