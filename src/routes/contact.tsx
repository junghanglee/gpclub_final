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
  ContactRowSkeleton,
  FaqSkeletonItems,
  HeroCopySkeleton,
} from "@/components/site/SectionSkeletons";
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
import { fetchCachedPublicData, withPublicDataTimeout } from "@/lib/public-data-timeout";
import {
  buildWhatsappLink,
  buildZaloLink,
  useCompanyInfo,
  useCompanyInfoLoading,
} from "@/lib/site-settings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — GPCLUB Vietnam" },
      {
        name: "description",
        content:
          "Reach GPCLUB Vietnam via Zalo, WhatsApp, email or phone. Headquartered in Ho Chi Minh City.",
      },
      { property: "og:title", content: "Contact GPCLUB Vietnam" },
      {
        property: "og:description",
        content: "Connect via Zalo, WhatsApp, email.",
      },
    ],
  }),
  component: ContactPage,
});

const contactText = {
  vi: {
    heroA: "Cùng xây dựng",
    heroB: "câu chuyện thành công làm đẹp tiếp theo tại Việt Nam.",
    heroDesc:
      "Nhà phân phối, nhà bán lẻ và đối tác OEM/ODM — hãy chia sẻ nhu cầu của bạn. Tư vấn viên chuyên trách sẽ phản hồi trong 24 giờ với đề xuất phù hợp.",
    zaloDesc: "Kênh phản hồi nhanh cho đối tác Việt Nam",
    openZalo: "Mở Zalo",
    whatsappDesc: "Hỗ trợ đối tác quốc tế",
    openWhatsapp: "Mở WhatsApp",
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
  },
  en: {
    heroA: "Let's build Vietnam's",
    heroB: "next beauty success story.",
    heroDesc:
      "Distributors, retailers, and OEM/ODM partners — tell us about your business. A dedicated consultant will reply within 24 hours with a tailored proposal.",
    zaloDesc: "Fastest channel for Vietnam partners",
    openZalo: "Open Zalo",
    whatsappDesc: "International partners welcome",
    openWhatsapp: "Open WhatsApp",
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
  },
};

const INITIAL_FAQ_COUNT = 12;
const FAQ_BATCH_SIZE = 12;

async function fetchContactFaqs() {
  return fetchCachedPublicData("contact-faqs", async () => {
    const { data, error } = await withPublicDataTimeout(
      supabase
        .from("faqs")
        .select("question, answer, category, sort_order")
        .eq("published", true)
        .order("sort_order")
        .order("created_at"),
      "contact faqs",
    );

    if (error) throw error;
    return data ?? [];
  });
}

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
  const contactLoading = pageLoading || companyLoading;
  const t = contactText[lang];
  const zaloLink = () => buildZaloLink(COMPANY.zaloPhone);
  const whatsappLink = () => buildWhatsappLink(COMPANY.whatsappPhone);
  const heroImageSrc = page.heroImage.url || gippyContactHero;
  const heroImageAlt = page.heroImage.alt[lang] || "Gippy AI contact consultant mascot";
  const offices = [
    {
      city: t.hq,
      address: COMPANY.address,
      phone: COMPANY.phone,
      hours: t.hours,
      mapsQuery: COMPANY.mapsQuery,
    },
  ];

  const [faqs, setFaqs] = useState<{ question: string; answer: string; category?: string }[]>([]);
  const [faqLang, setFaqLang] = useState<"ko" | "en" | "vi">(lang);
  const [faqLoading, setFaqLoading] = useState(true);
  const [visibleFaqCount, setVisibleFaqCount] = useState(INITIAL_FAQ_COUNT);
  useEffect(() => {
    setFaqLang(lang);
    setVisibleFaqCount(INITIAL_FAQ_COUNT);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    const loadFaqs = async () => {
      setFaqLoading(true);
      try {
        const data = await fetchContactFaqs();

        if (cancelled) return;
        if (!data || data.length === 0) {
          setFaqs([]);
          return;
        }

        setFaqs(data);
      } catch {
        if (!cancelled) setFaqs([]);
      } finally {
        if (!cancelled) setFaqLoading(false);
      }
    };

    loadFaqs();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleFaqs = useMemo(() => {
    const byLang = faqs.filter((faq) => {
      const category = faq.category ?? "";
      if (faqLang === "en") return category.startsWith("EN | ");
      if (faqLang === "vi") return category.startsWith("VI | ");
      return !category.startsWith("EN | ") && !category.startsWith("VI | ");
    });

    return byLang;
  }, [faqLang, faqs]);
  const displayedFaqs = visibleFaqs.slice(0, visibleFaqCount);
  const hasMoreFaqs = visibleFaqCount < visibleFaqs.length;

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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto grid min-h-[560px] max-w-[1100px] items-center gap-10 px-4 py-20 sm:min-h-[620px] sm:px-6 md:py-28 lg:min-h-[640px] lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            {pageLoading ? (
              <HeroCopySkeleton />
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <img
              src={heroImageSrc}
              alt={heroImageAlt}
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
            title="Zalo"
            desc={t.zaloDesc}
            cta={t.openZalo}
            href={zaloLink()}
            loading={contactLoading}
            highlight
          />
          <ChannelCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="WhatsApp"
            desc={t.whatsappDesc}
            cta={t.openWhatsapp}
            href={whatsappLink()}
            loading={contactLoading}
          />
          <ChannelCard
            icon={<Mail className="h-5 w-5" />}
            title="Email"
            desc={COMPANY.email}
            cta={t.sendEmail}
            href={`mailto:${COMPANY.email}`}
            loading={contactLoading}
          />
          <ChannelCard
            icon={<Phone className="h-5 w-5" />}
            title="Phone"
            desc={COMPANY.phone}
            cta={t.call}
            href={`tel:${COMPANY.phoneTel}`}
            loading={contactLoading}
          />
        </div>
      </section>

      {/* Office + Map + Company info */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {companyLoading ? (
            <ContactOfficeSkeleton />
          ) : (
            offices.map((o) => (
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
                      <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="hover:text-primary">
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
            ))
          )}

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
                <div className="font-display text-2xl">
                  {companyLoading ? <ContactRowSkeleton /> : COMPANY.legalName}
                </div>
              </div>
            </div>
            <dl className="mt-6 divide-y divide-border/60 text-sm">
              <Row label={t.legalName} value={COMPANY.legalNameVi} loading={companyLoading} />
              <Row label={t.tax} value={COMPANY.taxCode} loading={companyLoading} />
              <Row label={t.rep} value={COMPANY.representative} loading={companyLoading} />
              <Row label={t.est} value={COMPANY.established} loading={companyLoading} />
              <Row label={t.address} value={COMPANY.address} loading={companyLoading} />
              <Row label={t.type} value={t.llc} loading={companyLoading} />
              <Row label={t.status} value={t.active} loading={companyLoading} />
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

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { value: "ko", label: "한국어" },
              { value: "en", label: "English" },
              { value: "vi", label: "Tiếng Việt" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFaqLang(option.value as "ko" | "en" | "vi");
                  setVisibleFaqCount(INITIAL_FAQ_COUNT);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  faqLang === option.value
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-6 rounded-3xl border border-border/60 bg-card px-2 shadow-soft"
          >
            {faqLoading ? (
              <FaqSkeletonItems />
            ) : visibleFaqs.length === 0 ? (
              <ContactFaqEmptyState />
            ) : (
              displayedFaqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="px-4">
                  <AccordionTrigger className="text-left text-base font-semibold">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))
            )}
          </Accordion>

          {!faqLoading && hasMoreFaqs && (
            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setVisibleFaqCount((count) => count + FAQ_BATCH_SIZE)}
              >
                {lang === "vi" ? "Xem thêm câu hỏi" : "Load more questions"}
              </Button>
            </div>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full">
              <a href={zaloLink()} target="_blank" rel="noreferrer">
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
  loading,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  loading?: boolean;
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
        {loading ? <ContactRowSkeleton /> : <p className="text-sm text-muted-foreground">{desc}</p>}
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

function Row({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">
        {loading ? <ContactRowSkeleton /> : value}
      </dd>
    </div>
  );
}

function ContactOfficeSkeleton() {
  return (
    <article
      className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft"
      aria-busy="true"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-primary/5">
        <div
          className="h-full w-full animate-pulse bg-gradient-to-br from-primary/15 via-secondary to-primary/10"
          data-skeleton="true"
          aria-hidden="true"
        />
      </div>
      <div className="p-6 md:p-7">
        <div className="h-7 w-36 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
          <div className="h-4 w-56 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
        </div>
        <div className="mt-5 h-9 w-28 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
      </div>
    </article>
  );
}

function ContactFaqEmptyState() {
  return (
    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
      FAQ entries will appear here once they are published.
    </div>
  );
}
