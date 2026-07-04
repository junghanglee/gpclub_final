import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  WHATSAPP_PHONE as DEFAULT_WA,
  ZALO_PHONE as DEFAULT_ZALO,
  COMPANY as DEFAULTS,
} from "@/lib/contact";
import { withPublicDataTimeout } from "@/lib/public-data-timeout";

export type SeoInfo = {
  siteName: string;
  title: string;
  description: string;
  author: string;
  ogImage: string;
  faviconUrl: string;
};

export type FooterInfo = {
  taglineEn: string;
  taglineVi: string;
  copyrightEn: string;
  copyrightVi: string;
  brandLine: string;
  zaloVnPhone: string;
  zaloEnPhone: string;
  displayPhone: string;
};

export type SocialLink = {
  id: string;
  type: string;
  label: string;
  url: string;
};

export type BrandSocial = {
  id: string;
  brand: string;
  links: SocialLink[];
};

export type CompanyInfo = {
  legalName: string;
  legalNameVi: string;
  taxCode: string;
  representative: string;
  established: string;
  address: string;
  addressShort: string;
  phone: string;
  phoneTel: string;
  email: string;
  mapsQuery: string;
  zaloPhone: string;
  whatsappPhone: string;
};

const FALLBACK: CompanyInfo = {
  ...DEFAULTS,
  zaloPhone: DEFAULT_ZALO,
  whatsappPhone: DEFAULT_WA,
};

const DEFAULT_SEO: SeoInfo = {
  siteName: "GPCLUB Vietnam",
  title: "GPCLUB Vietnam - JMsolution & Jmella K-Beauty Distributor",
  description:
    "Official Vietnam distributor for JMsolution & Jmella. Premium K-beauty skincare, fragrance & body care for retailers and B2B partners.",
  author: "GPCLUB Vietnam",
  ogImage:
    "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1cea9c9b-bf19-4ed5-adf4-b71abaef0d50/id-preview-931a4c25--4e9a5c57-b454-4ff9-b423-c8a1f775d5b1.lovable.app-1778212868704.png",
  faviconUrl: "/favicon.png",
};

const DEFAULT_FOOTER: FooterInfo = {
  taglineEn:
    "Official partner platform for JMsolution, Jmella and Trois Touch in Vietnam - supporting supply, wholesale and channel growth.",
  taglineVi:
    "Nen tang doi tac chinh thuc cho JMsolution, Jmella va Trois Touch tai Viet Nam - ho tro nguon hang, ban si va tang truong kenh phan phoi.",
  copyrightEn: "All rights reserved.",
  copyrightVi: "Da dang ky ban quyen.",
  brandLine: "JMsolution - Jmella - Trois Touch",
  zaloVnPhone: "0703321243",
  zaloEnPhone: "0911412309",
  displayPhone: "070 332 1243",
};

const DEFAULT_BRAND_SOCIALS: BrandSocial[] = [
  {
    id: "jmella-vietnam",
    brand: "Jmella Vietnam",
    links: [
      {
        id: "jmella-facebook",
        type: "facebook",
        label: "Facebook",
        url: "https://www.facebook.com/share/18aaeXRVWN/?mibextid=wwXIfr",
      },
      {
        id: "jmella-instagram",
        type: "instagram",
        label: "Instagram",
        url: "https://www.instagram.com/jmella.vn?igsh=MTkwZm90N2x1dXI1dw==",
      },
      {
        id: "jmella-tiktok",
        type: "tiktok",
        label: "TikTok",
        url: "https://www.tiktok.com/@jmellavn_official?lang=vi-VN",
      },
    ],
  },
  {
    id: "jmsolution-vietnam",
    brand: "JMsolution Vietnam",
    links: [
      {
        id: "jmsolution-facebook",
        type: "facebook",
        label: "Facebook",
        url: "https://www.facebook.com/share/1aSGGcEqEU/?mibextid=wwXIfr",
      },
      {
        id: "jmsolution-instagram",
        type: "instagram",
        label: "Instagram",
        url: "https://www.instagram.com/jmsolution.vn?igsh=M200a2VuMGEzb3Y5",
      },
      {
        id: "jmsolution-tiktok",
        type: "tiktok",
        label: "TikTok",
        url: "https://www.tiktok.com/@jmsolutionvn_official?lang=vi-VN",
      },
    ],
  },
];

const CACHE_KEY = "gpclub:site-settings:v1";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type Stored = Partial<{
  legal_name: string;
  legal_name_vi: string;
  tax_code: string;
  representative: string;
  address: string;
  phone: string;
  email: string;
  zalo_phone: string;
  whatsapp_phone: string;
}>;

type StoredSettings = {
  contact?: Stored | null;
  seo?: Partial<SeoInfo> | null;
  footer?: Partial<FooterInfo> | null;
  brand_socials?: BrandSocial[] | null;
};

export const SITE_SETTING_KEYS = ["contact", "seo", "footer", "brand_socials"] as const;

function merge(stored: Stored | null): CompanyInfo {
  if (!stored) return FALLBACK;
  const phone = stored.phone?.trim() || FALLBACK.phone;
  return {
    ...FALLBACK,
    legalName: stored.legal_name?.trim() || FALLBACK.legalName,
    legalNameVi: stored.legal_name_vi?.trim() || FALLBACK.legalNameVi,
    taxCode: stored.tax_code?.trim() || FALLBACK.taxCode,
    representative: stored.representative?.trim() || FALLBACK.representative,
    address: stored.address?.trim() || FALLBACK.address,
    addressShort: stored.address?.trim() || FALLBACK.addressShort,
    phone,
    phoneTel: phone.replace(/\s+/g, ""),
    email: stored.email?.trim() || FALLBACK.email,
    mapsQuery: stored.address?.trim() || FALLBACK.mapsQuery,
    zaloPhone: stored.zalo_phone?.trim() || FALLBACK.zaloPhone,
    whatsappPhone: stored.whatsapp_phone?.trim() || FALLBACK.whatsappPhone,
  };
}

function readCachedInfo(): CompanyInfo {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (!cached) return FALLBACK;
    const parsed = JSON.parse(cached) as { savedAt?: number; value?: Stored };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > CACHE_MAX_AGE_MS) return FALLBACK;
    return merge(parsed.value ?? null);
  } catch {
    return FALLBACK;
  }
}

function writeCachedInfo(value: Stored | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), value }));
  } catch {
    // Ignore storage failures; the fallback content is enough to render the site.
  }
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function mergeSeo(stored: Partial<SeoInfo> | null | undefined): SeoInfo {
  return {
    siteName: text(stored?.siteName, DEFAULT_SEO.siteName),
    title: text(stored?.title, DEFAULT_SEO.title),
    description: text(stored?.description, DEFAULT_SEO.description),
    author: text(stored?.author, DEFAULT_SEO.author),
    ogImage: text(stored?.ogImage, DEFAULT_SEO.ogImage),
    faviconUrl: text(stored?.faviconUrl, DEFAULT_SEO.faviconUrl),
  };
}

function mergeFooter(stored: Partial<FooterInfo> | null | undefined): FooterInfo {
  return {
    taglineEn: text(stored?.taglineEn, DEFAULT_FOOTER.taglineEn),
    taglineVi: text(stored?.taglineVi, DEFAULT_FOOTER.taglineVi),
    copyrightEn: text(stored?.copyrightEn, DEFAULT_FOOTER.copyrightEn),
    copyrightVi: text(stored?.copyrightVi, DEFAULT_FOOTER.copyrightVi),
    brandLine: text(stored?.brandLine, DEFAULT_FOOTER.brandLine),
    zaloVnPhone: text(stored?.zaloVnPhone, DEFAULT_FOOTER.zaloVnPhone),
    zaloEnPhone: text(stored?.zaloEnPhone, DEFAULT_FOOTER.zaloEnPhone),
    displayPhone: text(stored?.displayPhone, DEFAULT_FOOTER.displayPhone),
  };
}

function mergeBrandSocials(stored: BrandSocial[] | null | undefined): BrandSocial[] {
  if (!Array.isArray(stored) || !stored.length) return DEFAULT_BRAND_SOCIALS;
  return stored
    .map((brand, brandIndex) => ({
      id: text(brand.id, `brand-${brandIndex}`),
      brand: text(brand.brand, "Brand"),
      links: Array.isArray(brand.links)
        ? brand.links
            .map((link, linkIndex) => ({
              id: text(link.id, `link-${brandIndex}-${linkIndex}`),
              type: text(link.type, "website"),
              label: text(link.label, text(link.type, "Website")),
              url: text(link.url, ""),
            }))
            .filter((link) => link.url)
        : [],
    }))
    .filter((brand) => brand.brand && brand.links.length);
}

function applyDocumentSeo(seo: SeoInfo) {
  if (typeof document === "undefined") return;
  document.title = seo.title;

  const setMeta = (selector: string, attr: "content" | "href", value: string) => {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement(selector.startsWith("link") ? "link" : "meta");
      if (selector.includes('name="description"')) node.setAttribute("name", "description");
      if (selector.includes('name="author"')) node.setAttribute("name", "author");
      if (selector.includes('property="og:title"')) node.setAttribute("property", "og:title");
      if (selector.includes('property="og:description"'))
        node.setAttribute("property", "og:description");
      if (selector.includes('property="og:image"')) node.setAttribute("property", "og:image");
      if (selector.includes('name="twitter:title"')) node.setAttribute("name", "twitter:title");
      if (selector.includes('name="twitter:description"'))
        node.setAttribute("name", "twitter:description");
      if (selector.includes('name="twitter:image"')) node.setAttribute("name", "twitter:image");
      if (selector.includes('rel="icon"')) node.setAttribute("rel", "icon");
      if (selector.includes('rel="shortcut icon"')) node.setAttribute("rel", "shortcut icon");
      if (selector.includes('rel="apple-touch-icon"')) node.setAttribute("rel", "apple-touch-icon");
      document.head.appendChild(node);
    }
    node.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', "content", seo.description);
  setMeta('meta[name="author"]', "content", seo.author);
  setMeta('meta[property="og:title"]', "content", seo.title);
  setMeta('meta[property="og:description"]', "content", seo.description);
  setMeta('meta[property="og:image"]', "content", seo.ogImage);
  setMeta('meta[name="twitter:title"]', "content", seo.title);
  setMeta('meta[name="twitter:description"]', "content", seo.description);
  setMeta('meta[name="twitter:image"]', "content", seo.ogImage);
  setMeta('link[rel="icon"]', "href", seo.faviconUrl);
  setMeta('link[rel="shortcut icon"]', "href", seo.faviconUrl);
  setMeta('link[rel="apple-touch-icon"]', "href", seo.faviconUrl);
}

type SiteSettingsContextValue = {
  info: CompanyInfo;
  seo: SeoInfo;
  footer: FooterInfo;
  brandSocials: BrandSocial[];
  loading: boolean;
};

const Ctx = createContext<SiteSettingsContextValue>({
  info: FALLBACK,
  seo: DEFAULT_SEO,
  footer: DEFAULT_FOOTER,
  brandSocials: DEFAULT_BRAND_SOCIALS,
  loading: false,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CompanyInfo>(() => readCachedInfo());
  const [seo, setSeo] = useState<SeoInfo>(DEFAULT_SEO);
  const [footer, setFooter] = useState<FooterInfo>(DEFAULT_FOOTER);
  const [brandSocials, setBrandSocials] = useState<BrandSocial[]>(DEFAULT_BRAND_SOCIALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await withPublicDataTimeout(
          supabase
            .from("site_settings")
            .select("key,value")
            .in("key", SITE_SETTING_KEYS as unknown as string[]),
          "site settings",
        );
        const settings = Object.fromEntries(
          (data ?? []).map((row) => [row.key, row.value]),
        ) as StoredSettings;
        const contact = settings.contact ?? null;
        const nextSeo = mergeSeo(settings.seo);
        writeCachedInfo(contact);
        if (!cancelled) {
          setInfo(merge(contact));
          setSeo(nextSeo);
          setFooter(mergeFooter(settings.footer));
          setBrandSocials(mergeBrandSocials(settings.brand_socials));
          applyDocumentSeo(nextSeo);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Ctx.Provider value={{ info, seo, footer, brandSocials, loading }}>{children}</Ctx.Provider>
  );
}

export const useCompanyInfo = () => useContext(Ctx).info;
export const useSeoInfo = () => useContext(Ctx).seo;
export const useFooterInfo = () => useContext(Ctx).footer;
export const useBrandSocials = () => useContext(Ctx).brandSocials;
export const useCompanyInfoLoading = () => useContext(Ctx).loading;

export const buildZaloLink = (phone: string, msg = "Hello GPCLUB Vietnam!") =>
  `https://zalo.me/${phone}?msg=${encodeURIComponent(msg)}`;

export const buildWhatsappLink = (phone: string, msg = "Hello GPCLUB Vietnam!") =>
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
