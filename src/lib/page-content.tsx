import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withPublicDataTimeout } from "@/lib/public-data-timeout";

export type SiteLang = "vi" | "en";
export type PageContentKey = "brand" | "products" | "gippy-ai" | "events" | "b2b" | "contact";
export type PageLocalizedText = Record<SiteLang, string>;

export type PageEditableContent = {
  kicker: PageLocalizedText;
  title: PageLocalizedText;
  highlight: PageLocalizedText;
  description: PageLocalizedText;
  primaryCta: PageLocalizedText;
  secondaryCta: PageLocalizedText;
};

const text = (vi: string, en: string): PageLocalizedText => ({ vi, en });

export const PAGE_CONTENT_OPTIONS: {
  key: "home" | PageContentKey;
  label: string;
}[] = [
  { key: "home", label: "HOME" },
  { key: "brand", label: "BRAND" },
  { key: "products", label: "Products" },
  { key: "gippy-ai", label: "GIPPY AI" },
  { key: "events", label: "EVENT" },
  { key: "b2b", label: "B2B" },
  { key: "contact", label: "CONTACT" },
];

export const DEFAULT_PAGE_CONTENT: Record<PageContentKey, PageEditableContent> = {
  brand: {
    kicker: text("GPCLUB VIETNAM", "GPCLUB VIETNAM"),
    title: text("Kiến tạo vẻ đẹp vượt trội từ", "Building partner growth through"),
    highlight: text("sự cải tiến không ngừng.", "proven K-Beauty brands."),
    description: text(
      "GPCLUB là doanh nghiệp mỹ phẩm toàn cầu mang trọn giá trị lành mạnh cho vẻ đẹp. Từ nền tảng phân phối năm 2003 đến thương hiệu chiến lược JMsolution năm 2016, GPCLUB đã phát triển thành hệ sinh thái làm đẹp toàn diện: skincare, makeup, hair & body và fragrance.",
      "GPCLUB is a global beauty company with a proven K-Beauty portfolio. GPCLUB Vietnam connects that brand power with resellers, retail chains, distributors, and OEM/ODM partners ready to grow in Vietnam.",
    ),
    primaryCta: text("Trở thành đối tác", "Become a Partner"),
    secondaryCta: text("Xem sản phẩm", "View Products"),
  },
  products: {
    kicker: text("Products", "Products"),
    title: text("Products,", "Products,"),
    highlight: text("ready to sell.", "ready to sell."),
    description: text(
      "JMsolution, Jmella and Trois Touch - curated for Vietnam partner channels. For wholesale pricing,",
      "JMsolution, Jmella, and Trois Touch - curated for Vietnam partner channels. For wholesale pricing,",
    ),
    primaryCta: text("gửi yêu cầu B2B", "start a B2B inquiry"),
    secondaryCta: text("Brochure", "Brochure"),
  },
  "gippy-ai": {
    kicker: text("GIPPY PARTNER AI", "GIPPY PARTNER AI"),
    title: text("Tư vấn đối tác K-Beauty", "K-Beauty partner sourcing, made"),
    highlight: text("dễ triển khai.", "business-ready."),
    description: text(
      "Danh mục sản phẩm, câu chuyện bán hàng và yêu cầu B2B — Gippy giúp đối tác chọn đúng hướng trao đổi.",
      "Product lineup, sales story and B2B inquiry — choose the right partner topic with Gippy.",
    ),
    primaryCta: text("Liên hệ GPCLUB", "Contact GPCLUB"),
    secondaryCta: text("Xem chủ đề", "View topics"),
  },
  events: {
    kicker: text("GPCLUB EVENT", "GPCLUB EVENT"),
    title: text("Tin tức, sự kiện và", "Events, campaigns and"),
    highlight: text("khoảnh khắc thương hiệu.", "brand moments."),
    description: text(
      "Theo dõi các chương trình ra mắt, hình ảnh sự kiện, video chiến dịch và hoạt động đối tác của GPCLUB Vietnam.",
      "Explore launch programs, event galleries, campaign videos and partner activities from GPCLUB Vietnam.",
    ),
    primaryCta: text("", ""),
    secondaryCta: text("", ""),
  },
  b2b: {
    kicker: text("B2B PARTNERSHIP", "B2B PARTNERSHIP"),
    title: text("Đưa K-Beauty có sức bán thật vào", "Bring proven K-Beauty into"),
    highlight: text("kênh tăng trưởng của bạn.", "your growth channel."),
    description: text(
      "Trở thành đối tác của GPCLUB Vietnam để khai thác danh mục JMsolution và Jmella — hai thương hiệu kết hợp khoa học chăm sóc da Hàn Quốc, hương thơm Pháp và chiến lược bản địa hóa cho thị trường Việt Nam.",
      "Become a GPCLUB Vietnam partner and unlock JMsolution and Jmella — brands combining Korean skincare science, French fragrance, and localization for Vietnam.",
    ),
    primaryCta: text("Gửi yêu cầu hợp tác", "Start partnership inquiry"),
    secondaryCta: text("", ""),
  },
  contact: {
    kicker: text("CONTACT US", "CONTACT US"),
    title: text("Cùng xây dựng", "Let's build Vietnam's"),
    highlight: text(
      "câu chuyện thành công làm đẹp tiếp theo tại Việt Nam.",
      "next beauty success story.",
    ),
    description: text(
      "Nhà phân phối, nhà bán lẻ và đối tác OEM/ODM — hãy chia sẻ nhu cầu của bạn. Tư vấn viên chuyên trách sẽ phản hồi trong 24 giờ với đề xuất phù hợp.",
      "Distributors, retailers, and OEM/ODM partners — tell us about your business. A dedicated consultant will reply within 24 hours with a tailored proposal.",
    ),
    primaryCta: text("", ""),
    secondaryCta: text("", ""),
  },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function mergeLocalized(base: PageLocalizedText, extra: unknown): PageLocalizedText {
  const src = isObj(extra) ? extra : {};
  return {
    vi: typeof src.vi === "string" ? src.vi : base.vi,
    en: typeof src.en === "string" ? src.en : base.en,
  };
}

export function mergePageContent(key: PageContentKey, value: unknown): PageEditableContent {
  const base = DEFAULT_PAGE_CONTENT[key];
  const src = isObj(value) ? value : {};
  return {
    kicker: mergeLocalized(base.kicker, src.kicker),
    title: mergeLocalized(base.title, src.title),
    highlight: mergeLocalized(base.highlight, src.highlight),
    description: mergeLocalized(base.description, src.description),
    primaryCta: mergeLocalized(base.primaryCta, src.primaryCta),
    secondaryCta: mergeLocalized(base.secondaryCta, src.secondaryCta),
  };
}

export const pageContentStorageKey = (key: PageContentKey) => `page:${key}`;

export function usePageContent(key: PageContentKey) {
  const [content, setContent] = useState<PageEditableContent>(() => DEFAULT_PAGE_CONTENT[key]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContent(DEFAULT_PAGE_CONTENT[key]);
    (async () => {
      try {
        const { data } = await withPublicDataTimeout(
          supabase
            .from("home_content")
            .select("value")
            .eq("key", pageContentStorageKey(key))
            .maybeSingle(),
          `page content ${key}`,
        );
        if (!cancelled) setContent(mergePageContent(key, data?.value));
      } catch {
        if (!cancelled) setContent(DEFAULT_PAGE_CONTENT[key]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { content, loading };
}
