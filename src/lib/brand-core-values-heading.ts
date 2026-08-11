export type BrandCoreValuesHeading = {
  kicker: { vi: string; en: string };
  title: { vi: string; en: string };
};

const DEFAULT_HEADING: BrandCoreValuesHeading = {
  kicker: { vi: "GIÁ TRỊ CỐT LÕI", en: "CORE VALUES" },
  title: {
    vi: "Đam mê. Đổi mới. Chuyên môn.",
    en: "Passion. Innovation. Expertise.",
  },
};

export function resolveBrandCoreValuesHeading(
  heading: BrandCoreValuesHeading | undefined,
  lang: "vi" | "en",
) {
  return {
    kicker: heading?.kicker[lang] || DEFAULT_HEADING.kicker[lang],
    title: heading?.title[lang] || DEFAULT_HEADING.title[lang],
  };
}
