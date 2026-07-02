import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Factory,
  ImagePlus,
  Layers,
  type LucideIcon,
  Megaphone,
  PackageCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import jmellaImg from "@/assets/brand-jmella.jpg";
import jmsolutionImg from "@/assets/brand-jmsolution.jpg";
import gippyB2BHero from "@/assets/gippy-b2b-hero.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getCoverImage, useCatalogProducts } from "@/lib/catalog-products";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/b2b")({
  head: () => ({
    meta: [
      { title: "B2B Partnership | GPCLUB Vietnam" },
      {
        name: "description",
        content:
          "Join GPCLUB Vietnam as a B2B partner for JMsolution and Jmella: proven K-Beauty brands, direct supply, localized marketing, AI consultation, and partner growth support.",
      },
      { property: "og:title", content: "B2B Partnership | GPCLUB Vietnam" },
    ],
  }),
  component: B2BPage,
});

const PURPOSES = [
  "Official distribution / wholesale bulk purchase",
  "Exclusive local agency / flagship store opening",
  "Custom OEM / ODM manufacturing request",
  "Marketing collaboration & other business proposals",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email").max(200),
  company: z.string().trim().min(2, "Please enter your company name").max(200),
  purposes: z.array(z.string()).min(1, "Select at least one purpose"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, { message: "Please agree to the privacy policy" }),
});

type FormData = z.infer<typeof schema>;
type LocalText = { vi: string; en: string };
type Card = {
  num: string;
  icon: LucideIcon;
  hook: LocalText;
  title: string;
  copy: LocalText;
};
type Value = {
  num: string;
  icon: LucideIcon;
  eng: string;
  title: LocalText;
  sub: LocalText;
  copy: LocalText;
};
type BrandSellingPoint = {
  name: string;
  fallbackImage: string;
  copy: LocalText;
};
const tx = (vi: string, en: string): LocalText => ({ vi, en });

const WHY_CARDS: Card[] = [
  {
    num: "01",
    icon: PackageCheck,
    hook: tx(
      "Danh mục có lực bán thật: JMsolution + Jmella.",
      "A sales-ready portfolio: JMsolution + Jmella.",
    ),
    title: "Strategic Brand Portfolio",
    copy: tx(
      "JMsolution đã ghi dấu với hơn 3 tỷ mặt nạ bán ra toàn cầu; Jmella mở ra phân khúc chăm sóc tóc và cơ thể bằng hương thơm Pháp. Hai thương hiệu giúp đối tác bao phủ skincare, hair care và body care bằng một danh mục dễ truyền thông, dễ bán và dễ mở rộng.",
      "JMsolution is proven by over 3 billion masks sold worldwide; Jmella opens a fragrance-led hair and body care category. Together, they help partners cover skincare, hair care, and body care with one marketable, sellable, scalable portfolio.",
    ),
  },
  {
    num: "02",
    icon: ShieldCheck,
    hook: tx(
      "Khoa học Hàn Quốc. Cảm xúc Pháp. Phù hợp Việt Nam.",
      "Korean science. French emotion. Fit for Vietnam.",
    ),
    title: "Localized Beauty Solution",
    copy: tx(
      "GPVN không chỉ nhập khẩu sản phẩm. Chúng tôi định vị giải pháp theo khí hậu, làn da, thói quen mua sắm và xu hướng làm đẹp của người Việt — để sản phẩm lên kệ có câu chuyện rõ ràng và lý do mua thuyết phục.",
      "GPVN does more than import products. We position solutions around Vietnam’s climate, skin needs, shopping behavior, and beauty trends — giving every product a clear story and a compelling reason to buy.",
    ),
  },
  {
    num: "03",
    icon: Megaphone,
    hook: tx(
      "Bạn bán hàng. GPVN hỗ trợ tăng tốc chuyển đổi.",
      "You sell. GPVN helps accelerate conversion.",
    ),
    title: "Marketing & Sales Enablement",
    copy: tx(
      "Đối tác được hỗ trợ nội dung bản địa hóa, đào tạo sản phẩm, tài sản hình ảnh, thông điệp bán hàng và định hướng campaign. Mục tiêu là biến nhận diện thương hiệu thành doanh số thực tế.",
      "Partners receive localized content, product training, brand assets, sales messaging, and campaign direction. The goal is to turn brand awareness into real sell-through.",
    ),
  },
];

const VALUES: Value[] = [
  {
    num: "01",
    icon: TrendingUp,
    eng: "Market-Ready Growth",
    title: tx(
      "Danh mục làm đẹp được thiết kế để chuyển đổi.",
      "A beauty portfolio built to convert.",
    ),
    sub: tx("Từ bằng chứng toàn cầu đến nhu cầu địa phương", "From global proof to local demand"),
    copy: tx(
      "Danh mục có sẵn câu chuyện tăng trưởng: mặt nạ bán chạy toàn cầu, hoạt chất chăm sóc da chuyên sâu, hương thơm cao cấp ứng dụng vào sản phẩm thiết yếu hằng ngày.",
      "A portfolio with built-in growth stories: globally proven masks, advanced skincare actives, and premium fragrance applied to everyday essentials.",
    ),
  },
  {
    num: "02",
    icon: CheckCircle2,
    eng: "Trust & Authenticity",
    title: tx(
      "Chính hãng, minh bạch và an toàn cho đối tác.",
      "Official, transparent, and partner-safe.",
    ),
    sub: tx("Nền tảng B2B chuyên nghiệp", "Professional B2B foundation"),
    copy: tx(
      "GPVN xây dựng niềm tin bằng sự minh bạch, chuyên môn và định vị chính hãng — giúp đối tác yên tâm khi tư vấn, bán hàng và mở rộng kênh.",
      "GPVN builds trust through transparency, expertise, and official brand positioning — helping partners sell, advise, and scale with confidence.",
    ),
  },
  {
    num: "03",
    icon: Bot,
    eng: "AI-Powered Consultation",
    title: tx("Cỗ máy giáo dục sản phẩm thông minh hơn.", "A smarter product education engine."),
    sub: tx("Cố vấn làm đẹp kỹ thuật số 24/7", "24/7 partner product advisor"),
    copy: tx(
      "Trợ lý AI của GPVN hỗ trợ giải thích sản phẩm, thành phần, công dụng và routine. Đây là công cụ giúp khách hàng hiểu nhanh hơn và giúp đối tác giảm ma sát tư vấn.",
      "GPVN AI advisor helps partners explain products, ingredients, benefits, and sales stories faster across reseller and retail channels.",
    ),
  },
  {
    num: "04",
    icon: Factory,
    eng: "OEM / ODM Potential",
    title: tx(
      "Từ ý tưởng đến kệ hàng với kinh nghiệm GPCLUB.",
      "From concept to shelf with GPCLUB know-how.",
    ),
    sub: tx("Cho nhà bán lẻ và đối tác doanh nghiệp", "For retailers and enterprise partners"),
    copy: tx(
      "Với nền tảng R&D, sản xuất, thiết kế và hiểu biết thị trường, GPCLUB có thể đồng hành cùng các đối tác muốn phát triển thương hiệu riêng hoặc dòng sản phẩm độc quyền.",
      "With R&D, production, design, and market insight, GPCLUB can support partners developing private labels or exclusive product lines.",
    ),
  },
];

const BRAND_SELLING_POINTS: BrandSellingPoint[] = [
  {
    name: "JMsolution",
    fallbackImage: jmsolutionImg,
    copy: tx(
      "Giải pháp chăm sóc da chuyên sâu, nổi bật với nền tảng JOR R&D, hoạt chất chọn lọc và cột mốc hơn 3 tỷ mặt nạ bán ra toàn cầu.",
      "Advanced skincare powered by JOR R&D, selected active ingredients, and the global milestone of over 3 billion masks sold.",
    ),
  },
  {
    name: "Jmella",
    fallbackImage: jmellaImg,
    copy: tx(
      "Chăm sóc tóc và cơ thể kết hợp nghệ thuật hương thơm Pháp, biến sản phẩm thiết yếu hằng ngày thành nghi thức nuông chiều bản thân.",
      "Hair and body care blended with French fragrance artistry, turning everyday essentials into a self-care ritual.",
    ),
  },
];

const PARTNER_PROCESS = [
  "Business fit review",
  "Portfolio & channel proposal",
  "Training, assets & launch plan",
  "Campaign execution & sell-through support",
];

const IMAGE_SLOTS = [
  "Partner store / shelf image",
  "Campaign visual / KOL content",
  "Training or product demo image",
];

const steps = [
  { id: 0, title: "Purpose", subtitle: "Inquiry purpose" },
  { id: 1, title: "Company", subtitle: "Company info" },
  { id: 2, title: "Contact", subtitle: "Contact & consent" },
] as const;

const b2bText = {
  vi: {
    heroTitleA: "Đưa K-Beauty có sức bán thật vào",
    heroTitleB: "kênh tăng trưởng của bạn.",
    heroDesc:
      "Trở thành đối tác của GPCLUB Vietnam để khai thác danh mục JMsolution và Jmella — hai thương hiệu kết hợp khoa học chăm sóc da Hàn Quốc, hương thơm Pháp và chiến lược bản địa hóa cho thị trường Việt Nam.",
    start: "Gửi yêu cầu hợp tác",
    whyKicker: "Vì sao chọn GPCLUB Vietnam",
    whyTitle: "Đối tác cần nhiều hơn sản phẩm. Họ cần câu chuyện có thể bán được.",
    valueKicker: "Giá trị đối tác",
    valueTitle: "Bạn nhận được gì khi trở thành đối tác.",
    brandsKicker: "Thương hiệu đối tác có thể bán",
    brandsTitle: "Danh mục được thiết kế cho nhu cầu người tiêu dùng và câu chuyện bán lẻ.",
    processKicker: "Quy trình ra mắt",
    processTitle: "Từ liên hệ đầu tiên đến hỗ trợ bán hàng thực tế.",
    processDesc:
      "Chúng tôi cùng đối tác xác định kênh, danh mục, thông điệp và kế hoạch triển khai phù hợp.",
    process: [
      "Đánh giá mức độ phù hợp kinh doanh",
      "Đề xuất danh mục và kênh bán",
      "Đào tạo, tài sản thương hiệu và kế hoạch ra mắt",
      "Triển khai chiến dịch và hỗ trợ bán hàng",
    ],
    imagesKicker: "Không gian hình ảnh",
    imagesTitle: "Không gian hình ảnh giúp tăng sức thuyết phục B2B.",
    imagesDesc:
      "Các khung ảnh được bố trí cân bằng cho hình ảnh kệ bán hàng, chiến dịch và đào tạo sản phẩm.",
    slots: [
      "Hình ảnh cửa hàng / kệ đối tác",
      "Visual chiến dịch / nội dung KOL",
      "Hình ảnh đào tạo hoặc demo sản phẩm",
    ],
    replace: "Thay bằng hình ảnh chính thức",
    contactKicker: "Liên hệ",
    contactTitle: "Bắt đầu cuộc trao đổi.",
    contactDesc:
      "Chia sẻ mục tiêu kinh doanh, đội ngũ hợp tác của chúng tôi sẽ phản hồi trong 24 giờ.",
    step: "Bước",
    doneTitle: "Đã gửi yêu cầu",
    doneDesc:
      "Tư vấn viên hợp tác chuyên trách sẽ liên hệ trong 24 giờ với đề xuất kinh doanh phù hợp.",
    backHome: "Về trang chủ",
    qPurpose: "Bạn đang quan tâm điều gì?",
    qPurposeDesc: "Có thể chọn nhiều mục.",
    purposes: [
      "Phân phối chính hãng / mua sỉ số lượng lớn",
      "Đại lý độc quyền địa phương / mở flagship store",
      "Yêu cầu sản xuất OEM / ODM riêng",
      "Hợp tác marketing và đề xuất kinh doanh khác",
    ],
    companyLabel: "Tên công ty và kênh bán lẻ",
    companyPh: "Tên công ty và các kênh bán hiện tại",
    detailLabel: "Thông tin bổ sung (không bắt buộc)",
    detailPh: "Sản lượng dự kiến, khu vực mục tiêu hoặc yêu cầu cụ thể.",
    name: "Họ và tên",
    namePh: "Tên của bạn",
    email: "Địa chỉ email",
    consent:
      "Tôi đồng ý cho thu thập và sử dụng thông tin cá nhân (tên, email, công ty) để xem xét đề xuất kinh doanh.",
    back: "Quay lại",
    continue: "Tiếp tục",
    sending: "Đang gửi…",
    send: "Gửi yêu cầu hợp tác",
    toastOk: "Đã nhận yêu cầu",
    toastOkDesc: "Tư vấn viên hợp tác sẽ phản hồi trong 24 giờ.",
    toastFail: "Gửi thất bại",
    toastFailDesc: "Vui lòng thử lại sau.",
    formSteps: ["Mục đích yêu cầu", "Thông tin công ty", "Liên hệ & đồng ý"],
  },
  en: {
    heroTitleA: "Bring proven K-Beauty into",
    heroTitleB: "your growth channel.",
    heroDesc:
      "Partner with GPCLUB Vietnam to grow with JMsolution and Jmella — brands combining Korean skin science, French fragrance, and localized strategy for the Vietnamese market.",
    start: "Start Partnership Inquiry",
    whyKicker: "Why GPCLUB Vietnam",
    whyTitle: "Partners need more than products. They need a story that sells.",
    valueKicker: "Partner Value",
    valueTitle: "What you gain as a partner.",
    brandsKicker: "Brands Partners Can Sell",
    brandsTitle:
      "A portfolio designed for reseller demand, wholesale channels and retail storytelling.",
    processKicker: "Launch Process",
    processTitle: "From first contact to sell-through support.",
    processDesc: "We align channels, portfolio, messaging, and launch execution with each partner.",
    process: [
      "Business fit review",
      "Portfolio & channel proposal",
      "Training, assets & launch plan",
      "Campaign execution & sell-through support",
    ],
    imagesKicker: "Image Spaces",
    imagesTitle: "Image spaces that strengthen B2B persuasion.",
    imagesDesc:
      "Prepared as balanced image spaces for retail, campaign, and product training images supplied later.",
    slots: [
      "Partner store / shelf image",
      "Campaign visual / KOL content",
      "Training or product demo image",
    ],
    replace: "Replace with final image asset",
    contactKicker: "Contact",
    contactTitle: "Start the conversation.",
    contactDesc: "Share your business goals and our partnership team will respond within 24 hours.",
    step: "Step",
    doneTitle: "Inquiry sent",
    doneDesc:
      "Our dedicated partnership consultant will reach out within 24 hours with a tailored business proposal.",
    backHome: "Back to Home",
    qPurpose: "What brings you here?",
    qPurposeDesc: "Select all that apply.",
    purposes: [
      "Official distribution / wholesale bulk purchase",
      "Exclusive local agency / flagship store opening",
      "Custom OEM / ODM manufacturing request",
      "Marketing collaboration & other business proposals",
    ],
    companyLabel: "Company name & retail channels",
    companyPh: "Company name and active sales channels",
    detailLabel: "Additional details (optional)",
    detailPh: "Expected volumes, target regions, or any specific requirements.",
    name: "Full name",
    namePh: "Your name",
    email: "Email address",
    consent:
      "I consent to the collection and use of my personal information (name, email, company) for business proposal review.",
    back: "Back",
    continue: "Continue",
    sending: "Sending…",
    send: "Send partnership inquiry",
    toastOk: "Inquiry received",
    toastOkDesc: "Our partnership consultant will reply within 24 hours.",
    toastFail: "Send failed",
    toastFailDesc: "Please try again later.",
    formSteps: ["Inquiry purpose", "Company info", "Contact & consent"],
  },
};

function B2BPage() {
  const { lang } = useI18n();
  const { content: page, loading: pageLoading } = usePageContent("b2b");
  const pick = (copy: LocalText) => copy[lang];
  const t = b2bText[lang];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows: catalogRows } = useCatalogProducts();

  const brandProductImages = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of catalogRows) {
      const image = getCoverImage(product);
      const brandKey = product.brand_name.trim().toLowerCase();
      if (image && !map.has(brandKey)) map.set(brandKey, image);
    }
    return map;
  }, [catalogRows]);

  const sampleProductImages = useMemo(() => {
    const preferredBrands = ["JMsolution", "JMELLA", "JMELLA"];
    const picked: { src: string; alt: string }[] = [];
    const used = new Set<string>();

    for (const brandName of preferredBrands) {
      const product = catalogRows.find(
        (row) =>
          row.brand_name === brandName && getCoverImage(row) && !used.has(getCoverImage(row)),
      );
      if (product) {
        const src = getCoverImage(product);
        picked.push({ src, alt: product.product_name });
        used.add(src);
      }
    }

    for (const product of catalogRows) {
      if (picked.length >= 3) break;
      const src = getCoverImage(product);
      if (src && !used.has(src)) {
        picked.push({ src, alt: product.product_name });
        used.add(src);
      }
    }

    return picked;
  }, [catalogRows]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      company: "",
      purposes: [],
      message: "",
      consent: undefined as unknown as true,
    },
  });

  const fieldsByStep: (keyof FormData)[][] = [
    ["purposes"],
    ["company"],
    ["name", "email", "consent"],
  ];

  const next = async () => {
    const ok = await form.trigger(fieldsByStep[step]);
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const purposeLine = `[Purpose] ${data.purposes.join(", ")}`;
      const msg = [purposeLine, data.message?.trim()].filter(Boolean).join("\n\n");
      const { error } = await supabase.from("b2b_inquiries").insert({
        company: data.company,
        position: "—",
        city: "—",
        channel: data.purposes[0] ?? "—",
        monthly_volume: "—",
        brands: null,
        name: data.name,
        email: data.email,
        phone: "—",
        message: msg,
      });
      if (error) throw error;
      toast.success(t.toastOk, { description: t.toastOkDesc });
      setDone(true);
    } catch (e) {
      toast.error(t.toastFail, {
        description: e instanceof Error ? e.message : t.toastFailDesc,
      });
    } finally {
      setSubmitting(false);
    }
  });

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6">
        <motion.div
          initial={{ scale: 1, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.7 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="h-10 w-10" />
        </motion.div>
        <h1 className="mt-8 font-display text-4xl font-black tracking-tight md:text-5xl">
          {t.doneTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-foreground/70">{t.doneDesc}</p>
        <Button
          asChild
          className="mt-8 h-12 rounded-none bg-foreground px-7 text-sm font-bold uppercase tracking-[0.18em] text-background hover:bg-primary"
        >
          <Link to="/">{t.backHome}</Link>
        </Button>
      </section>
    );
  }

  const progress = ((step + 1) / steps.length) * 100;

  if (pageLoading) {
    return <main className="min-h-[60vh] bg-background" />;
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {page.kicker[lang]}
            </div>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              {page.title[lang]}{" "}
              <span className="bg-gradient-pink bg-clip-text text-transparent">
                {page.highlight[lang]}
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-foreground/75 lg:mx-0">
              {page.description[lang]}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-9 h-12 rounded-none bg-primary px-8 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
            >
              <a href="#partner-form">
                {page.primaryCta[lang] || t.start} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <img
              src={gippyB2BHero}
              alt="Gippy AI B2B partnership mascot"
              loading="eager"
              decoding="async"
              className="aspect-[3/4] max-h-[414px] w-full max-w-[311px] object-contain"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {t.whyKicker}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {t.whyTitle}
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {WHY_CARDS.map((c) => (
              <article
                key={c.num}
                className="group border border-border bg-background p-8 transition hover:border-primary/40 hover:bg-accent/30 md:p-10"
              >
                <div className="flex items-start justify-between">
                  <div className="font-display text-5xl font-black text-foreground/10 transition group-hover:text-primary/30">
                    {c.num}
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-6 font-display text-xl font-black leading-snug tracking-tight text-foreground">
                  {pick(c.hook)}
                </div>
                <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  {c.title}
                </div>
                <p className="mt-5 text-[14px] leading-relaxed text-foreground/75">
                  {pick(c.copy)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {t.valueKicker}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {t.valueTitle}
            </h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
            {VALUES.map((v) => (
              <article
                key={v.num}
                className="group bg-background p-8 transition hover:bg-accent/30 md:p-12"
              >
                <div className="flex items-start justify-between">
                  <div className="font-display text-5xl font-black text-foreground/10 transition group-hover:text-primary/30">
                    {v.num}
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <v.icon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  {v.eng}
                </div>
                <div className="mt-2 font-display text-2xl font-black tracking-tight">
                  {pick(v.title)}
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground/55">{pick(v.sub)}</div>
                <p className="mt-5 text-[14px] leading-relaxed text-foreground/75">
                  {pick(v.copy)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {t.brandsKicker}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {t.brandsTitle}
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {BRAND_SELLING_POINTS.map((brand) => (
              <article
                key={brand.name}
                className="grid items-center gap-6 border border-border p-6 md:grid-cols-5 md:p-8"
              >
                <img
                  src={
                    brandProductImages.get(brand.name.trim().toLowerCase()) || brand.fallbackImage
                  }
                  alt={brand.name}
                  className="aspect-square w-full rounded-sm object-cover shadow-sm md:col-span-2"
                />
                <div className="md:col-span-3">
                  <div className="font-display text-2xl font-black tracking-tight">
                    {brand.name}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                    {pick(brand.copy)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {t.processKicker}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {t.processTitle}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-foreground/65">{t.processDesc}</p>
          </div>
          <div className="space-y-3 lg:col-span-7">
            {t.process.map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-5 border border-border bg-background p-5"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                  {i + 1}
                </div>
                <div className="font-display text-lg font-black tracking-tight">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {t.imagesKicker}
            </div>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight md:text-4xl">
              {t.imagesTitle}
            </h2>
            <p className="mt-3 text-sm text-foreground/60">{t.imagesDesc}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.slots.map((slot, index) => {
              const sample = sampleProductImages[index];
              return (
                <div
                  key={slot}
                  className="group relative overflow-hidden border border-border bg-background"
                >
                  {sample ? (
                    <img
                      src={sample.src}
                      alt={sample.alt}
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                      <ImagePlus className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
                    <div className="text-xs font-bold uppercase tracking-[0.2em]">{slot}</div>
                    {sample ? (
                      <p className="mt-2 line-clamp-1 text-xs text-white/75">{sample.alt}</p>
                    ) : (
                      <p className="mt-2 text-xs text-white/75">{t.replace}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="partner-form" className="border-t border-border bg-background py-24">
        <div className="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-10">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {t.contactKicker}
            </div>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight md:text-4xl">
              {t.contactTitle}
            </h2>
            <p className="mt-3 text-sm text-foreground/65">{t.contactDesc}</p>
          </div>

          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              <span>
                {t.step} {step + 1} / {steps.length} · {t.formSteps[step]}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 rounded-none" />
          </div>

          <form onSubmit={submit} className="mt-8 border border-border bg-background p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <div>
                    <h3 className="font-display text-xl font-black tracking-tight">{t.qPurpose}</h3>
                    <p className="mt-1 text-sm text-foreground/60">{t.qPurposeDesc}</p>
                    <div className="mt-6 grid gap-3">
                      {t.purposes.map((p) => {
                        const checked = form.watch("purposes").includes(p);
                        return (
                          <label
                            key={p}
                            className={`flex cursor-pointer items-center gap-4 border p-4 transition ${checked ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"}`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const cur = form.getValues("purposes");
                                form.setValue(
                                  "purposes",
                                  v ? [...cur, p] : cur.filter((x) => x !== p),
                                  { shouldValidate: true },
                                );
                              }}
                            />
                            <span className="text-sm font-semibold">{p}</span>
                          </label>
                        );
                      })}
                    </div>
                    {form.formState.errors.purposes && (
                      <p className="mt-2 text-xs text-destructive">
                        {form.formState.errors.purposes.message as string}
                      </p>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <Field label={t.companyLabel} error={form.formState.errors.company?.message}>
                      <Input
                        maxLength={200}
                        {...form.register("company")}
                        placeholder={t.companyPh}
                      />
                    </Field>
                    <Field label={t.detailLabel}>
                      <Textarea
                        rows={6}
                        maxLength={1000}
                        {...form.register("message")}
                        placeholder={t.detailPh}
                      />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <Field label={t.name} error={form.formState.errors.name?.message}>
                      <Input maxLength={80} {...form.register("name")} placeholder={t.namePh} />
                    </Field>
                    <Field label={t.email} error={form.formState.errors.email?.message}>
                      <Input
                        type="email"
                        maxLength={200}
                        {...form.register("email")}
                        placeholder="partner@company.com"
                      />
                    </Field>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 border border-border p-4 transition hover:border-foreground/30">
                      <Checkbox
                        checked={!!form.watch("consent")}
                        onCheckedChange={(v) =>
                          form.setValue(
                            "consent",
                            v === true ? true : (undefined as unknown as true),
                            {
                              shouldValidate: true,
                            },
                          )
                        }
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-relaxed text-foreground/75">
                        <span className="font-semibold text-foreground">
                          [{lang === "vi" ? "Đồng ý" : "Agreed"}]
                        </span>{" "}
                        {t.consent}
                      </span>
                    </label>
                    {form.formState.errors.consent && (
                      <p className="-mt-2 text-xs text-destructive">
                        {form.formState.errors.consent.message as string}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0 || submitting}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-none uppercase tracking-wider"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> {t.back}
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={next}
                  className="h-11 rounded-none bg-foreground px-7 text-sm font-bold uppercase tracking-[0.18em] text-background hover:bg-primary"
                >
                  {t.continue} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 rounded-none bg-primary px-7 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? t.sending : t.send}
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/60">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
