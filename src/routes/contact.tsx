import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import gippyContactHero from "@/assets/gippy-contact-hero.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";
import { buildZaloLink, useCompanyInfo, useCompanyInfoLoading } from "@/lib/site-settings";

const ZALO_EN_PHONE = "0911412309";
const ZALO_VN_PHONE = "0703321243";
const ZALO_VN_DISPLAY = "070 332 1243";

type FaqLang = "ko" | "en" | "vi";
type FaqItem = { question: string; answer: string; category?: string };

const FAQ_LANG_OPTIONS: { value: FaqLang; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
];

const FAQ_TOPIC_FALLBACK: Record<string, { vi: string; ko: string; en: string }> = {
  partnership: { vi: "Đại lý / hợp tác", ko: "대리점 / 협력", en: "Dealer / Partnership" },
  products: { vi: "Sản phẩm / chính hãng", ko: "상품 / 정품", en: "Products / Authenticity" },
  orders: { vi: "Đặt hàng / MOQ", ko: "주문 / MOQ", en: "Orders / MOQ" },
  support: { vi: "Marketing / hỗ trợ", ko: "마케팅 / 지원", en: "Marketing / Support" },
  general: { vi: "Khác", ko: "기타", en: "General" },
};

function normalizeFaqLang(appLang: "vi" | "en"): FaqLang {
  return appLang === "vi" ? "vi" : "en";
}

function splitCategory(category?: string) {
  const value = category?.trim() ?? "";
  const match = value.match(/^(KO|KR|EN|VI)\s*\|\s*(.+)$/i);
  if (!match) return { lang: "ko" as FaqLang, topic: value || "general" };
  const lang =
    match[1].toUpperCase() === "EN" ? "en" : match[1].toUpperCase() === "VI" ? "vi" : "ko";
  return { lang: lang as FaqLang, topic: match[2].trim() || "general" };
}

function topicKey(topic: string) {
  const value = topic.toLowerCase();
  if (/dealer|partner|b2b|대리|협력|đại lý|hợp tác/.test(value)) return "partnership";
  if (/product|authentic|brand|상품|제품|정품|sản phẩm|chính hãng/.test(value)) return "products";
  if (/order|moq|price|quote|주문|가격|발주|đặt hàng|báo giá/.test(value)) return "orders";
  if (/marketing|support|training|마케팅|지원|hỗ trợ|đào tạo/.test(value)) return "support";
  return value.replace(/\s+/g, "-") || "general";
}

function topicLabel(key: string, topic: string, lang: FaqLang) {
  return FAQ_TOPIC_FALLBACK[key]?.[lang] ?? topic.replace(/[-_]/g, " ");
}

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — GPCLUB Vietnam" },
      {
        name: "description",
        content:
          "Reach GPCLUB Vietnam via Zalo, email or phone. Headquartered in Ho Chi Minh City.",
      },
      { property: "og:title", content: "Contact GPCLUB Vietnam" },
      {
        property: "og:description",
        content: "Connect via Zalo, email or phone.",
      },
    ],
  }),
  component: ContactPage,
});

const FALLBACK_FAQS = [
  {
    question: "How do I become an authorized dealer?",
    answer:
      "Submit your application through our B2B inquiry form. Our partnership team reviews each application within 24 business hours.",
  },
  {
    question: "Are your products 100% authentic?",
    answer:
      "Yes. GPCLUB is the official authorized distributor of JMsolution and Jmella in Vietnam, sourced directly from Korea.",
  },
  {
    question: "What is the minimum order quantity (MOQ)?",
    answer:
      "Retail partners typically start at $1,000 USD per order, wholesale partners at $5,000 USD. Contact us for a tailored quote.",
  },
  {
    question: "Do you provide marketing support?",
    answer:
      "Authorized partners receive product training, sample kits, and seasonal campaign materials.",
  },
];

const contactText = {
  vi: {
    heroA: "Cùng xây dựng",
    heroB: "câu chuyện thành công làm đẹp tiếp theo tại Việt Nam.",
    heroDesc:
      "Nhà phân phối, nhà bán lẻ và đối tác OEM/ODM — hãy chia sẻ nhu cầu của bạn. Tư vấn viên chuyên trách sẽ phản hồi trong 24 giờ với đề xuất phù hợp.",
    zaloDesc: "Kênh phản hồi nhanh bằng tiếng Việt",
    zaloEnDesc: "Hỗ trợ đối tác bằng tiếng Anh",
    openZalo: "Mở Zalo",
    sendEmail: "Gửi email",
    call: "Gọi ngay",
    hq: "TP. Hồ Chí Minh — Trụ sở chính",
    hours: "Thứ 2–Thứ 6 · 9:00–18:00",
    maps: "Mở bằng Google Maps",
    companyInfo: "Thông tin công ty",
    legalName: "Tên pháp lý (VN)",
    tax: "Mã số thuế",
    rep: "Người đại diện pháp luật",
    est: "Thành lập",
    address: "Địa chỉ đăng ký",
    type: "Loại hình doanh nghiệp",
    status: "Trạng thái",
    llc: "Công ty trách nhiệm hữu hạn",
    active: "Đang hoạt động",
    registry: "Xem đăng ký công khai",
    faqTitle: "Câu hỏi thường gặp",
    faqDesc: "Câu trả lời nhanh cho những câu hỏi đối tác thường hỏi nhất.",
    faqLanguage: "Ngôn ngữ",
    faqTopic: "Chủ đề",
    faqAllTopics: "Tất cả chủ đề",
    chatZalo: "Chat trên Zalo",
    emailUs: "Gửi email cho chúng tôi",
    formKicker: "Gửi tin nhắn",
    formTitle: "Cho chúng tôi biết bạn cần hỗ trợ gì",
    name: "Họ và tên",
    email: "Email",
    phone: "Số điện thoại",
    optional: "không bắt buộc",
    subject: "Chủ đề",
    message: "Nội dung",
    sending: "Đang gửi…",
    send: "Gửi tin nhắn",
    thanks: "Cảm ơn! Chúng tôi sẽ phản hồi sớm.",
    faqs: [
      {
        question: "Làm sao để trở thành đại lý ủy quyền?",
        answer:
          "Vui lòng gửi yêu cầu qua form B2B. Đội ngũ hợp tác sẽ xem xét và phản hồi trong vòng 24 giờ làm việc.",
      },
      {
        question: "Sản phẩm có phải hàng chính hãng 100% không?",
        answer:
          "Có. GPCLUB là nhà phân phối ủy quyền chính thức của JMsolution và Jmella tại Việt Nam, nguồn hàng trực tiếp từ Hàn Quốc.",
      },
      {
        question: "Số lượng đặt hàng tối thiểu là bao nhiêu?",
        answer:
          "Đối tác bán lẻ thường bắt đầu từ 1.000 USD/đơn hàng, đối tác bán sỉ từ 5.000 USD. Hãy liên hệ để nhận báo giá phù hợp.",
      },
      {
        question: "Có hỗ trợ marketing không?",
        answer:
          "Đối tác ủy quyền được hỗ trợ đào tạo sản phẩm, bộ mẫu và tài liệu chiến dịch theo mùa.",
      },
    ],
  },
  en: {
    heroA: "Let's build Vietnam's",
    heroB: "next beauty success story.",
    heroDesc:
      "Distributors, retailers, and OEM/ODM partners — tell us about your business. A dedicated consultant will reply within 24 hours with a tailored proposal.",
    zaloDesc: "Fast Vietnamese-language partner support",
    zaloEnDesc: "English-language partner support",
    openZalo: "Open Zalo",
    sendEmail: "Send email",
    call: "Call us",
    hq: "Ho Chi Minh City — Headquarters",
    hours: "Mon–Fri · 9:00–18:00",
    maps: "Open in Google Maps",
    companyInfo: "Company information",
    legalName: "Legal name (VN)",
    tax: "Tax code",
    rep: "Legal representative",
    est: "Established",
    address: "Registered address",
    type: "Business type",
    status: "Status",
    llc: "Limited liability company",
    active: "Active",
    registry: "View public registry",
    faqTitle: "Frequently asked",
    faqDesc: "Quick answers to the questions partners ask us most often.",
    faqLanguage: "Language",
    faqTopic: "Topic",
    faqAllTopics: "All topics",
    chatZalo: "Chat on Zalo",
    emailUs: "Email us",
    formKicker: "Send a message",
    formTitle: "Tell us how we can help",
    name: "Name",
    email: "Email",
    phone: "Phone",
    optional: "optional",
    subject: "Subject",
    message: "Message",
    sending: "Sending…",
    send: "Send message",
    thanks: "Thanks! We'll get back to you soon.",
    faqs: FALLBACK_FAQS,
  },
};

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(5).max(1000),
});

function ContactPage() {
  const { lang } = useI18n();
  const { content: page, loading: pageLoading } = usePageContent("contact");
  const COMPANY = useCompanyInfo();
  const companyLoading = useCompanyInfoLoading();
  const t = contactText[lang];
  const zaloEnLink = () => buildZaloLink(ZALO_EN_PHONE);
  const zaloVnLink = () => buildZaloLink(ZALO_VN_PHONE);
  const offices = [
    {
      city: t.hq,
      address: COMPANY.address,
      phone: ZALO_VN_DISPLAY,
      hours: t.hours,
      mapsQuery: COMPANY.mapsQuery,
    },
  ];

  const [faqs, setFaqs] = useState<FaqItem[]>(t.faqs);
  const [faqLang, setFaqLang] = useState<FaqLang>(normalizeFaqLang(lang));
  const [faqTopic, setFaqTopic] = useState("all");

  useEffect(() => {
    setFaqLang(normalizeFaqLang(lang));
    setFaqTopic("all");
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    const loadFaqs = async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("question, answer, category, sort_order")
        .eq("published", true)
        .order("sort_order")
        .order("created_at");

      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setFaqs(t.faqs);
        return;
      }

      setFaqs(data);
    };

    loadFaqs();
    return () => {
      cancelled = true;
    };
  }, [t.faqs]);

  const faqRows = useMemo(() => {
    const source = faqs.length > 0 ? faqs : t.faqs;
    return source.map((faq) => {
      const meta = splitCategory(faq.category);
      const key = topicKey(meta.topic);
      return { ...faq, faqLang: meta.lang, topic: meta.topic, topicKey: key };
    });
  }, [faqs, t.faqs]);

  const topicOptions = useMemo(() => {
    const seen = new Map<string, string>();
    faqRows
      .filter((faq) => faq.faqLang === faqLang)
      .forEach((faq) => {
        if (!seen.has(faq.topicKey)) seen.set(faq.topicKey, faq.topic);
      });

    return Array.from(seen, ([key, topic]) => ({
      key,
      label: topicLabel(key, topic, faqLang),
    }));
  }, [faqLang, faqRows]);

  const visibleFaqs = useMemo(() => {
    const byLang = faqRows.filter((faq) => faq.faqLang === faqLang);
    const byTopic = faqTopic === "all" ? byLang : byLang.filter((faq) => faq.topicKey === faqTopic);
    const rows = byTopic.length > 0 ? byTopic : byLang;

    return rows.slice(0, 5);
  }, [faqLang, faqRows, faqTopic]);

  // Inquiry form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = inquirySchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("contact_inquiries").insert(parsed.data);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(t.thanks);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  if (pageLoading || companyLoading) {
    return <main className="min-h-[60vh] bg-background" />;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1100px] items-center gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              {page.kicker[lang]}
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              {page.title[lang]}{" "}
              <span className="bg-gradient-pink bg-clip-text text-transparent">
                {page.highlight[lang]}
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-relaxed text-foreground/75 lg:mx-0">
              {page.description[lang]}
            </p>
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <img
              src={gippyContactHero}
              alt="Gippy AI contact consultant mascot"
              loading="eager"
              decoding="async"
              className="aspect-[3/4] max-h-[414px] w-full max-w-[311px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* Contact channels */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ChannelCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Zalo VN"
            desc={t.zaloDesc}
            cta={t.openZalo}
            href={zaloVnLink()}
            highlight
          />
          <ChannelCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Zalo EN"
            desc={t.zaloEnDesc}
            cta={t.openZalo}
            href={zaloEnLink()}
          />
          <ChannelCard
            icon={<Mail className="h-5 w-5" />}
            title="Email"
            desc={COMPANY.email}
            cta={t.sendEmail}
            href={`mailto:${COMPANY.email}`}
          />
          <ChannelCard
            icon={<Phone className="h-5 w-5" />}
            title="Phone"
            desc={ZALO_VN_DISPLAY}
            cta={t.call}
            href={`tel:${ZALO_VN_PHONE}`}
          />
        </div>
      </section>

      {/* Office + Map + Company info */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {offices.map((o) => (
            <article
              key={o.city}
              className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                <iframe
                  title={`Map of ${o.city}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(o.mapsQuery)}&output=embed`}
                  loading="lazy"
                  className="h-full w-full border-0"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-6 md:p-7">
                <div className="font-display text-2xl">{o.city}</div>
                <div className="mt-4 space-y-2.5 text-sm">
                  <Line icon={<MapPin className="h-4 w-4" />}>{o.address}</Line>
                  <Line icon={<Phone className="h-4 w-4" />}>
                    <a href={`tel:${ZALO_VN_PHONE}`} className="hover:text-primary">
                      {o.phone}
                    </a>
                  </Line>
                  <Line icon={<Clock className="h-4 w-4" />}>{o.hours}</Line>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-5 rounded-full">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.mapsQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.maps} <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </article>
          ))}

          {/* Legal company info */}
          <article className="overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-navy text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  {t.companyInfo}
                </div>
                <div className="font-display text-2xl">{COMPANY.legalName}</div>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-border/60 text-sm">
              <Row label={t.legalName} value={COMPANY.legalNameVi} />
              <Row label={t.tax} value={COMPANY.taxCode} />
              <Row label={t.rep} value={COMPANY.representative} />
              <Row label={t.est} value={COMPANY.established} />
              <Row label={t.address} value={COMPANY.address} />
              <Row label={t.type} value={t.llc} />
              <Row label={t.status} value={t.active} />
            </dl>
            <Button asChild variant="outline" size="sm" className="mt-6 rounded-full">
              <a
                href="https://masothue.com/0317324490-cong-ty-tnhh-gpclub-viet-nam"
                target="_blank"
                rel="noreferrer"
              >
                {t.registry} <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-luxe py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">FAQ</div>
            <h2 className="mt-2 font-display text-3xl md:text-5xl">{t.faqTitle}</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">{t.faqDesc}</p>
          </div>

          <div className="mt-8 space-y-4 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <div>
              <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t.faqLanguage}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {FAQ_LANG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFaqLang(option.value);
                      setFaqTopic("all");
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      faqLang === option.value
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t.faqTopic}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFaqTopic("all")}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    faqTopic === "all"
                      ? "border-foreground bg-foreground text-background shadow-soft"
                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t.faqAllTopics}
                </button>
                {topicOptions.map((topic) => (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => setFaqTopic(topic.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      faqTopic === topic.key
                        ? "border-foreground bg-foreground text-background shadow-soft"
                        : "border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-6 rounded-3xl border border-border/60 bg-card px-2 shadow-soft"
          >
            {visibleFaqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="px-4">
                <AccordionTrigger className="text-left text-base font-semibold">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full">
              <a href={zaloVnLink()} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" /> {t.chatZalo}
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={`mailto:${COMPANY.email}`}>
                <Mail className="mr-1 h-4 w-4" /> {t.emailUs}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {t.formKicker}
          </div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">{t.formTitle}</h2>
        </div>
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.name}</Label>
              <Input
                className="mt-1.5"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label>{t.email}</Label>
              <Input
                className="mt-1.5"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={200}
                required
              />
            </div>
            <div>
              <Label>
                {t.phone} <span className="text-muted-foreground">({t.optional})</span>
              </Label>
              <Input
                className="mt-1.5"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={40}
              />
            </div>
            <div>
              <Label>{t.subject}</Label>
              <Input
                className="mt-1.5"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={150}
              />
            </div>
          </div>
          <div>
            <Label>{t.message}</Label>
            <Textarea
              className="mt-1.5"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={1000}
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="rounded-full">
            <Send className="mr-1 h-4 w-4" /> {submitting ? t.sending : t.send}
          </Button>
        </form>
      </section>
    </>
  );
}

function ChannelCard({
  icon,
  title,
  desc,
  cta,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className={`group relative flex flex-col gap-3 rounded-2xl border p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elegant ${
        highlight
          ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
          : "border-border/60 bg-card"
      }`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-navy text-primary-foreground">
        {icon}
      </span>
      <div>
        <div className="font-display text-xl">{title}</div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="text-sm font-medium text-primary">{cta} →</div>
    </a>
  );
}

function Line({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-muted-foreground">
      <span className="mt-0.5 text-gold">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value}</dd>
    </div>
  );
}
