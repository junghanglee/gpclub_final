import * as React from "react";

/**
 * Bilingual layer (VI default for VN browsers, EN otherwise).
 * Scope: header/footer/menu/key CTAs & section titles only.
 */
export type Lang = "vi" | "en";

type Dict = Record<string, { vi: string; en: string }>;

export const STRINGS: Dict = {
  // Nav
  "nav.home": { vi: "TRANG CHỦ", en: "HOME" },
  "nav.brand": { vi: "THƯƠNG HIỆU", en: "BRAND" },
  "nav.products": { vi: "SẢN PHẨM", en: "PRODUCTS" },
  "nav.b2b": { vi: "B2B", en: "B2B" },
  "nav.contact": { vi: "LIÊN HỆ", en: "CONTACT" },
  "nav.gippyAi": { vi: "GIPPY AI", en: "GIPPY AI" },
  "nav.events": { vi: "SỰ KIỆN", en: "EVENT" },
  "nav.becomeDealer": { vi: "TRỞ THÀNH ĐỐI TÁC", en: "BECOME A PARTNER" },

  // Footer
  "footer.ribbon": {
    vi: "Nền tảng đối tác K-Beauty chính thức · Việt Nam",
    en: "Official K-Beauty Partner Platform · Vietnam",
  },
  "footer.ribbonCTA": { vi: "Trở thành đối tác →", en: "Become a Partner →" },
  "footer.explore": { vi: "Khám phá", en: "Explore" },
  "footer.connect": { vi: "Kết nối", en: "Connect" },
  "footer.company": { vi: "Công ty", en: "Company" },
  "footer.taxCode": { vi: "Mã số thuế", en: "Tax Code" },
  "footer.representative": { vi: "Người đại diện", en: "Representative" },
  "footer.address": { vi: "Địa chỉ", en: "Address" },

  // Common CTAs
  "cta.b2bInquiry": {
    vi: "Yêu cầu hợp tác B2B",
    en: "B2B Partnership Inquiry",
  },
  "cta.contactUs": { vi: "Liên hệ", en: "Contact Us" },
  "cta.discover": { vi: "Tìm hiểu thêm", en: "Discover" },
  "cta.viewAll": { vi: "Xem tất cả", en: "View all" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof STRINGS) => string;
};

const I18nCtx = React.createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => STRINGS[k]?.en ?? String(k),
});

const LS_KEY = "gpclub.lang";

function applyDocumentLang(lang: Lang) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

function getQueryLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("lang");
  return value === "vi" || value === "en" ? value : null;
}

function detectDefaultLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const langs = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((l) => l.toLowerCase());
  for (const l of langs) {
    if (l.startsWith("vi")) return "vi";
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    try {
      const queryLang = getQueryLang();
      if (queryLang) {
        setLangState(queryLang);
        applyDocumentLang(queryLang);
        return;
      }

      const stored = localStorage.getItem(LS_KEY) as Lang | null;
      if (stored === "vi" || stored === "en") {
        setLangState(stored);
        applyDocumentLang(stored);
      } else {
        const detectedLang = detectDefaultLang();
        setLangState(detectedLang);
        applyDocumentLang(detectedLang);
      }
    } catch {
      const detectedLang = detectDefaultLang();
      setLangState(detectedLang);
      applyDocumentLang(detectedLang);
    }
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LS_KEY, l);
    } catch {
      /* noop */
    }
    applyDocumentLang(l);
  }, []);

  const t = React.useCallback(
    (key: keyof typeof STRINGS) => STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? String(key),
    [lang],
  );

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return React.useContext(I18nCtx);
}

/** Inline switcher (VI · EN). */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const items: { code: Lang; label: string }[] = [
    { code: "vi", label: "VI" },
    { code: "en", label: "EN" },
  ];
  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-background/70 p-0.5 text-[11px] font-bold tracking-[0.14em] backdrop-blur ${className}`}
      role="group"
      aria-label="Language"
    >
      {items.map((it) => {
        const active = it.code === lang;
        return (
          <button
            key={it.code}
            onClick={() => setLang(it.code)}
            aria-pressed={active}
            className={
              "rounded-full px-2.5 py-1 transition " +
              (active
                ? "bg-foreground text-background"
                : "text-foreground/55 hover:text-foreground")
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
