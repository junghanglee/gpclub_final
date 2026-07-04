import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withPublicDataTimeout } from "@/lib/public-data-timeout";

export type LocalizedText = { vi: string; en: string };

export type HomeAdminContent = {
  hero: {
    kicker: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    primaryCta: LocalizedText;
    secondaryCta: LocalizedText;
    imageUrl: string;
    imageAlt: LocalizedText;
  };
  stats: {
    masksValue: string;
    masksLabel: LocalizedText;
    countriesValue: string;
    countriesLabel: LocalizedText;
    vietnamValue: string;
    vietnamLabel: LocalizedText;
  };
  partnerHook: {
    kicker: LocalizedText;
    title: LocalizedText;
    highlight: LocalizedText;
    body: LocalizedText;
  };
  trust: {
    kicker: LocalizedText;
    title: LocalizedText;
  };
  pillars: Array<{
    num: string;
    eng: LocalizedText;
    title: LocalizedText;
    text: LocalizedText;
  }>;
  process: {
    kicker: LocalizedText;
    title: LocalizedText;
    body: LocalizedText;
  };
  images: {
    kicker: LocalizedText;
    title: LocalizedText;
    body: LocalizedText;
    cta: LocalizedText;
    labels: { vi: string[]; en: string[] };
    urls: string[];
    alts: { vi: string[]; en: string[] };
  };
  cta: {
    kicker: LocalizedText;
    title: LocalizedText;
    highlight: LocalizedText;
    body: LocalizedText;
    button: LocalizedText;
  };
};

export const DEFAULT_HOME_CONTENT: HomeAdminContent = {
  hero: {
    kicker: {
      vi: "CHƯƠNG TRÌNH ĐỐI TÁC GPCLUB VIETNAM",
      en: "GPCLUB VIETNAM PARTNER PROGRAM",
    },
    title: {
      vi: "Đưa thương hiệu K-Beauty đã được kiểm chứng đến thị trường Việt Nam.",
      en: "Bring proven K-Beauty brands to Vietnam's fastest-moving shelves.",
    },
    subtitle: {
      vi: "Nguồn hàng chính hãng, chiến dịch bản địa hóa và đội ngũ đồng hành thực tế cho nhà phân phối, bán lẻ và đối tác làm đẹp.",
      en: "Official supply, localized campaigns and hands-on support for distributors, retailers and beauty builders.",
    },
    primaryCta: { vi: "Trở thành đối tác", en: "Become a partner" },
    secondaryCta: { vi: "Danh mục sản phẩm", en: "View Product Catalog" },
    imageUrl: "",
    imageAlt: {
      vi: "K-Beauty bởi GPCLUB Vietnam",
      en: "K-Beauty by GPCLUB Vietnam",
    },
  },
  stats: {
    masksValue: "3B+",
    masksLabel: {
      vi: "Sản phẩm đã bán toàn cầu",
      en: "Product units sold globally",
    },
    countriesValue: "30+",
    countriesLabel: { vi: "Quốc gia phân phối", en: "Countries served" },
    vietnamValue: "2022",
    vietnamLabel: { vi: "Pháp nhân Việt Nam", en: "Vietnam entity" },
  },
  partnerHook: {
    kicker: { vi: "Lợi thế đối tác", en: "Partner Hook" },
    title: {
      vi: "Không chỉ nhập hàng. Cùng xây kênh bán thắng lợi.",
      en: "Not just supply. Build a winning sell-through channel.",
    },
    highlight: {
      vi: "Cùng xây kênh bán thắng lợi.",
      en: "winning sell-through channel.",
    },
    body: {
      vi: "GPCLUB Vietnam giúp đối tác xây dựng động cơ bán hàng bằng niềm tin thương hiệu, marketing bản địa hóa và hỗ trợ ra mắt thực tế.",
      en: "GPCLUB Vietnam helps partners build a sell-through engine with brand trust, localized marketing and practical launch support.",
    },
  },
  trust: {
    kicker: { vi: "Vì sao đối tác tin tưởng", en: "Why partners trust us" },
    title: {
      vi: "Ba nền tảng cho tăng trưởng B2B.",
      en: "Three foundations for B2B growth.",
    },
  },
  pillars: [
    {
      num: "01",
      eng: { vi: "Niềm tin chính hãng", en: "Official Trust" },
      title: { vi: "Chính hãng và minh bạch", en: "Official and transparent" },
      text: {
        vi: "Nguồn nhập khẩu được ủy quyền, truy xuất lô hàng và tài liệu giúp bảo vệ uy tín kênh bán.",
        en: "Authorized import paths, batch traceability and documentation that protects your channel reputation.",
      },
    },
    {
      num: "02",
      eng: { vi: "Phù hợp địa phương", en: "Local Fit" },
      title: {
        vi: "Phù hợp khí hậu Việt Nam",
        en: "Fit for Vietnam's climate",
      },
      text: {
        vi: "Sản phẩm chủ lực được chọn theo thời tiết ẩm, lối sống năng động và hành vi làm đẹp địa phương.",
        en: "Hero products and formulas selected for humid weather, active lifestyles and local beauty behavior.",
      },
    },
    {
      num: "03",
      eng: { vi: "Nguồn cung mở rộng", en: "Scalable Supply" },
      title: { vi: "Sẵn sàng mở rộng", en: "Ready to scale" },
      text: {
        vi: "Danh mục và mô hình cung ứng phù hợp nhà bán lẻ, nhà phân phối, chuỗi và đối tác OEM/ODM.",
        en: "A portfolio and supply model designed for retailers, distributors, chains and OEM/ODM builders.",
      },
    },
  ],
  process: {
    kicker: { vi: "Quy trình ra mắt", en: "Launch process" },
    title: {
      vi: "Từ trao đổi đến ra mắt trong một quy trình rõ ràng.",
      en: "From first inquiry to launch through a clear process.",
    },
    body: {
      vi: "Lộ trình hợp tác được cấu trúc để đội ngũ của bạn đánh giá cơ hội nhanh và triển khai tự tin.",
      en: "The partnership path is structured so your team can evaluate opportunity quickly and execute with confidence.",
    },
  },
  images: {
    kicker: { vi: "Không gian hình ảnh", en: "Image placeholders" },
    title: {
      vi: "Không gian cho hình ảnh chiến dịch sắp cung cấp.",
      en: "Spaces ready for upcoming campaign visuals.",
    },
    body: {
      vi: "Các khu vực placeholder đã sẵn sàng cho key visual thương hiệu, minh chứng đối tác, trưng bày bán lẻ và hình ảnh ra mắt sản phẩm.",
      en: "Placeholder areas are ready for future brand key visuals, partner proof, retail displays and product launch imagery.",
    },
    labels: {
      vi: ["Hình ảnh chiến dịch", "Ảnh trưng bày bán lẻ", "Minh chứng đối tác"],
      en: ["Brand campaign key visual", "Retail shelf / display photo", "Partner success proof"],
    },
    cta: { vi: "Sản phẩm", en: "Products" },
    urls: ["", "", ""],
    alts: {
      vi: ["Hình ảnh chiến dịch", "Ảnh trưng bày bán lẻ", "Minh chứng đối tác"],
      en: ["Brand campaign key visual", "Retail shelf / display photo", "Partner success proof"],
    },
  },
  cta: {
    kicker: { vi: "Hợp tác", en: "Partnership" },
    title: {
      vi: "Sẵn sàng trở thành đối tác GPCLUB Vietnam?",
      en: "Ready to become a GPCLUB Vietnam partner?",
    },
    highlight: {
      vi: "Cùng xây dựng câu chuyện tăng trưởng làm đẹp.",
      en: "Let's build a beauty growth story together.",
    },
    body: {
      vi: "Chia sẻ kênh bán và mục tiêu kinh doanh. Đội ngũ của chúng tôi sẽ chuẩn bị đề xuất hợp tác thực tế.",
      en: "Share your target channel and business goals. Our team will prepare a practical partner proposal.",
    },
    button: { vi: "Gửi yêu cầu B2B", en: "Start B2B inquiry" },
  },
};
function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(base: T, extra: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(extra) ? extra : base) as T;
  if (!isObj(base)) return (extra === undefined || extra === null ? base : extra) as T;
  const out: Record<string, unknown> = { ...base };
  const src = isObj(extra) ? extra : {};
  for (const key of Object.keys(base))
    out[key] = deepMerge((base as Record<string, unknown>)[key], src[key]);
  return out as T;
}

export function mergeHomeContent(value: unknown): HomeAdminContent {
  return deepMerge(DEFAULT_HOME_CONTENT, value);
}

type HomeContentContextValue = { content: HomeAdminContent; loading: boolean };

const Ctx = createContext<HomeContentContextValue>({
  content: DEFAULT_HOME_CONTENT,
  loading: true,
});

export function HomeContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<HomeAdminContent>(DEFAULT_HOME_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await withPublicDataTimeout(
          supabase.from("home_content").select("value").eq("key", "home").maybeSingle(),
          "home content",
        );
        if (!cancelled) setContent(mergeHomeContent(data?.value));
      } catch {
        if (!cancelled) setContent(DEFAULT_HOME_CONTENT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={{ content, loading }}>{children}</Ctx.Provider>;
}

export const useHomeContent = () => useContext(Ctx);
