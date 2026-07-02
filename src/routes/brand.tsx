import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Heart,
  ImagePlus,
  Leaf,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";
import jmsolutionImg from "@/assets/brand-jmsolution.jpg";
import jmellaImg from "@/assets/brand-jmella.jpg";
import aiAssistantImg from "@/assets/brand-ai-assistant.jpg";
import labImg from "@/assets/brand-lab.jpg";
import gippyBrandHero from "@/assets/gippy-brand-hero.png";

export const Route = createFileRoute("/brand")({
  head: () => ({
    meta: [
      { title: "GPCLUB Vietnam Brand Story | JMsolution & Jmella" },
      {
        name: "description",
        content:
          "GPCLUB Vietnam connects Korean beauty science, French fragrance, and AI-powered consultation for Vietnamese reseller, retail and B2B partners.",
      },
      { property: "og:title", content: "GPCLUB Vietnam Brand Story" },
      { property: "og:image", content: jmsolutionImg },
    ],
  }),
  component: BrandPage,
});

type LocalText = { vi: string; en: string };
type ValueItem = { icon: LucideIcon; label: string; text: LocalText };
type BrandItem = {
  key: string;
  name: string;
  category: string;
  image: string;
  headline: LocalText;
  quote: LocalText;
  body: LocalText;
  bullets: ValueItem[];
};

const t = (vi: string, en: string): LocalText => ({ vi, en });

const CORE_VALUES: ValueItem[] = [
  {
    icon: Heart,
    label: "PASSION",
    text: t(
      "Sự nhiệt huyết, chủ động đón đầu các làn sóng xu hướng làm đẹp tại Việt Nam.",
      "We move first with Vietnam’s beauty trends and bring the right solutions to partner channels before demand peaks.",
    ),
  },
  {
    icon: Sparkles,
    label: "INNOVATION",
    text: t(
      "Đổi mới không ngừng để thích ứng với khí hậu, môi trường và đặc tính làn da của người Việt.",
      "We continuously adapt formulas and experiences to Vietnam’s climate, environment, and skin needs.",
    ),
  },
  {
    icon: ShieldCheck,
    label: "EXPERTISE",
    text: t(
      "Xây dựng niềm tin bằng sự chuyên nghiệp, minh bạch và kiến thức chuyên sâu về da và tóc.",
      "We build trust through transparent expertise in skincare, haircare, and product education.",
    ),
  },
];

const BRANDS: BrandItem[] = [
  {
    key: "jmsolution",
    name: "JMsolution",
    category: "Skin Science",
    image: jmsolutionImg,
    headline: t(
      "Giải pháp khoa học đột phá cho làn da tỏa sáng",
      "Breakthrough skin science for visible radiance",
    ),
    quote: t(
      "Chuyên gia chăm sóc da chuyên sâu – Dẫn dắt xu hướng K-Beauty toàn cầu.",
      "A professional skincare expert leading global K-Beauty trends.",
    ),
    body: t(
      "JMsolution kết hợp công nghệ da liễu hiện đại với các thành phần hoạt tính quý hiếm được chọn lọc trên toàn thế giới. Từ cột mốc hơn 3 tỷ mặt nạ được bán ra toàn cầu, thương hiệu tiếp tục phát triển các giải pháp cấp ẩm, phục hồi, dưỡng sáng và chống lão hóa dành cho người tiêu dùng hiện đại.",
      "JMsolution combines advanced dermatological technology with rare active ingredients selected worldwide. From the milestone of over 3 billion masks sold globally, the brand continues to deliver hydration, recovery, brightening, and anti-aging solutions for modern reseller and retail channels.",
    ),
    bullets: [
      {
        icon: FlaskConical,
        label: "JOR R&D",
        text: t(
          "Sản phẩm được phát triển từ nền tảng nghiên cứu của viện JOR R&D tại Hàn Quốc.",
          "Products are developed through Korea’s JOR R&D research platform.",
        ),
      },
      {
        icon: Droplets,
        label: "Skin Solution",
        text: t(
          "Tập trung vào các vấn đề cốt lõi của da: cấp ẩm sâu, phục hồi, dưỡng trắng và chống lão hóa.",
          "Focused on core skin concerns: deep hydration, recovery, brightening, and anti-aging.",
        ),
      },
      {
        icon: CheckCircle2,
        label: "Global Proof",
        text: t(
          "Hơn 3 tỷ mặt nạ bán ra toàn cầu là bằng chứng mạnh mẽ về sức hút thương hiệu.",
          "Over 3 billion masks sold worldwide proves the brand’s powerful market appeal.",
        ),
      },
    ],
  },
  {
    key: "jmella",
    name: "Jmella",
    category: "Perfume Body & Hair",
    image: jmellaImg,
    headline: t(
      "Liệu pháp hương thơm nâng niu làn da và mái tóc",
      "Fragrance therapy for skin, hair, and everyday confidence",
    ),
    quote: t(
      "Nghệ thuật ướp hương cơ thể – Chạm vào cảm xúc, nuông chiều bản thân.",
      "The art of body fragrance — emotional, sensorial, and self-loving.",
    ),
    body: t(
      "Jmella là sự giao thoa giữa công nghệ chăm sóc da/tóc chuyên sâu và nghệ thuật chế tác hương thơm cao cấp từ Pháp. Thương hiệu biến việc tắm gội, dưỡng da hàng ngày thành một nghi thức chăm sóc bản thân, giúp người dùng tự tin hơn nhờ hương thơm độc bản lưu lại suốt ngày dài.",
      "Jmella bridges advanced skin and haircare technology with premium French fragrance artistry. It turns daily cleansing and moisturizing into a self-care ritual, helping partners sell daily fragrance care through a signature scent story.",
    ),
    bullets: [
      {
        icon: Sparkles,
        label: "Fragrance Layering",
        text: t(
          "Tiên phong xu hướng ướp hương đa tầng cho body care và hair care.",
          "A pioneer in fragrance layering across body care and hair care.",
        ),
      },
      {
        icon: Leaf,
        label: "Daily Ritual",
        text: t(
          "Biến sản phẩm thiết yếu hằng ngày thành trải nghiệm thư giãn và nuông chiều giác quan.",
          "Transforms everyday essentials into a relaxing, sensorial ritual.",
        ),
      },
      {
        icon: Droplets,
        label: "Gentle Care",
        text: t(
          "Công thức làm sạch nhẹ dịu, cấp ẩm sâu và nuôi dưỡng tóc chắc khỏe từ gốc đến ngọn.",
          "Gentle cleansing, deep hydration, and nourishing hair care from root to tip.",
        ),
      },
    ],
  },
];

const IMAGE_SLOTS = [
  { label: "Brand campaign / KV image", ratio: "aspect-[16/10]" },
  { label: "Retail shelf or partner store image", ratio: "aspect-[4/5]" },
  { label: "Product texture / usage cut", ratio: "aspect-[16/10]" },
];

function BrandPage() {
  const { lang } = useI18n();
  const page = usePageContent("brand");
  const pick = (copy: LocalText) => copy[lang];

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
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
            <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-none bg-primary px-8 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/b2b">
                  {page.primaryCta[lang]} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-none px-8 text-sm font-bold uppercase tracking-[0.18em]"
              >
                <Link to="/products">{page.secondaryCta[lang]}</Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <img
              src={gippyBrandHero}
              alt="Gippy AI partner advisor mascot giving a thumbs up"
              loading="eager"
              decoding="async"
              className="mx-auto aspect-[3/4] max-h-[414px] w-full max-w-[311px] object-contain lg:ml-auto"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              GPVN POSITIONING
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight md:text-5xl">
              {lang === "vi" ? "Không chỉ phân phối. " : "Not only distribution. "}
              <span className="text-primary">
                {lang === "vi" ? "GPVN là cầu nối chiến lược." : "GPVN is a strategic bridge."}
              </span>
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-foreground/75 lg:col-span-7">
            <p>
              {lang === "vi"
                ? "GPVN kết nối DNA đột phá của tập đoàn mẹ với nhu cầu thực tế của người tiêu dùng Việt Nam thông qua hai đại diện thương hiệu trọng tâm: JMsolution và Jmella."
                : "GPVN connects the parent company’s innovation DNA with the real needs of Vietnamese partner channels through strategic brand representatives: JMsolution and Jmella."}
            </p>
            <p>
              {lang === "vi"
                ? "Triết lý của GPVN là biến chăm sóc da và tóc thành hành trình nâng niu, bồi đắp giá trị bản thân mỗi ngày."
                : "GPVN’s philosophy is to turn skin and hair care into a daily journey of cherishing and building personal value."}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              CORE VALUES
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight md:text-5xl">
              Passion. Innovation. Expertise.
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
            {CORE_VALUES.map((item) => (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-background p-8 transition hover:bg-accent/30 md:p-10"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  {item.label}
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-foreground/75">
                  {pick(item.text)}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              STRATEGIC BRAND PROFILE
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight md:text-5xl">
              {lang === "vi"
                ? "Hai thương hiệu. Một danh mục làm đẹp mạnh mẽ cho Việt Nam."
                : "Three brands. One powerful partner-ready beauty portfolio for Vietnam."}
            </h2>
          </div>
          <div className="mt-14 space-y-20">
            {BRANDS.map((brand, index) => (
              <article
                key={brand.key}
                className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14"
              >
                <div className={`${index % 2 ? "lg:order-2" : ""} lg:col-span-5`}>
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="aspect-[4/5] w-full rounded-sm object-cover shadow-sm"
                  />
                </div>
                <div className="lg:col-span-7">
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                    {brand.category}
                  </div>
                  <h3 className="mt-3 font-display text-3xl font-black tracking-tight md:text-4xl">
                    {brand.name}
                  </h3>
                  <p className="mt-4 border-l-2 border-primary pl-5 font-display text-2xl font-black leading-tight">
                    {pick(brand.headline)}
                  </p>
                  <p className="mt-3 pl-5 text-sm italic text-foreground/70">
                    “{pick(brand.quote)}”
                  </p>
                  <p className="mt-7 text-[15px] leading-relaxed text-foreground/75">
                    {pick(brand.body)}
                  </p>
                  <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
                    {brand.bullets.map((b) => (
                      <div key={b.label} className="bg-background p-5">
                        <b.icon className="h-5 w-5 text-primary" />
                        <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                          {b.label}
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-foreground/70">
                          {pick(b.text)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary py-20 md:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <img
              src={aiAssistantImg}
              alt="GPVN AI partner advisor"
              className="aspect-[4/5] w-full rounded-sm object-cover shadow-sm"
            />
          </div>
          <div className="lg:col-span-7">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              AI PARTNER ADVISOR
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight md:text-5xl">
              {lang === "vi" ? "Trợ lý AI chuyên sâu của GPVN" : "GPVN advanced AI partner advisor"}
            </h2>
            <p className="mt-7 text-[15px] leading-relaxed text-foreground/75">
              {lang === "vi"
                ? "GPVN tiên phong tích hợp hệ thống trợ lý AI thông minh ngay trên website: giải đáp sản phẩm, phân tích thành phần, cố vấn công dụng và cá nhân hóa lộ trình chăm sóc cho khí hậu, thói quen và làn da Việt Nam."
                : "GPVN pioneers an intelligent AI advisor on the website: answering product questions, decoding ingredients, explaining functions, and personalizing routines for Vietnam’s climate, habits, and skin needs."}
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-none bg-primary px-8 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/gippy-ai">
                {lang === "vi" ? "Trò chuyện với Gippy AI" : "Talk to Gippy AI"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              IMAGE PLACEMENT
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight md:text-4xl">
              {lang === "vi"
                ? "Không gian hình ảnh được căn chỉnh theo nội dung"
                : "Image spaces aligned with surrounding content"}
            </h2>
            <p className="mt-3 text-sm text-foreground/60">
              {lang === "vi"
                ? "Khi có ảnh thật, các khung này sẽ được thay bằng hình chiến dịch, kệ bán hàng và texture sản phẩm theo bố cục trái/phải cân bằng."
                : "When final assets are supplied, these frames will be replaced with campaign, retail, and product texture images in a balanced left/right layout."}
            </p>
          </div>
          <div className="mt-10 grid items-start gap-5 md:grid-cols-12">
            {IMAGE_SLOTS.map((slot, i) => (
              <div
                key={slot.label}
                className={`${slot.ratio} ${i === 1 ? "md:col-span-4" : "md:col-span-4 md:mt-10"} grid place-items-center border border-dashed border-primary/40 bg-primary/5 p-6 text-center`}
              >
                <div>
                  <ImagePlus className="mx-auto h-8 w-8 text-primary" />
                  <div className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    {slot.label}
                  </div>
                  <p className="mt-2 text-xs text-foreground/55">Replace with final image asset</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
