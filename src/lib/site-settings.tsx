import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  WHATSAPP_PHONE as DEFAULT_WA,
  ZALO_PHONE as DEFAULT_ZALO,
  COMPANY as DEFAULTS,
} from "@/lib/contact";

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

type SiteSettingsContextValue = { info: CompanyInfo; loading: boolean };

const Ctx = createContext<SiteSettingsContextValue>({
  info: FALLBACK,
  loading: false,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CompanyInfo>(() => readCachedInfo());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "contact")
          .maybeSingle();
        const value = (data?.value as Stored) ?? null;
        writeCachedInfo(value);
        if (!cancelled) setInfo(merge(value));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={{ info, loading }}>{children}</Ctx.Provider>;
}

export const useCompanyInfo = () => useContext(Ctx).info;
export const useCompanyInfoLoading = () => useContext(Ctx).loading;

export const buildZaloLink = (phone: string, msg = "Hello GPCLUB Vietnam!") =>
  `https://zalo.me/${phone}?msg=${encodeURIComponent(msg)}`;

export const buildWhatsappLink = (phone: string, msg = "Hello GPCLUB Vietnam!") =>
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
