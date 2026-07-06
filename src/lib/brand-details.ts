import { Droplets, FlaskConical, Leaf, type LucideIcon, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withPublicDataTimeout } from "@/lib/public-data-timeout";

export type BrandKey = string;

export type BrandDetail = {
  key: string;
  name: string;
  sub: string;
  tagline: string;
  story: string;
  heritage: string;
  hero: string;
  meta: {
    title: string;
    description: string;
  };
  signature: Array<{
    line: string;
    name: string;
    note: string;
  }>;
  features: Array<{
    iconKey: string;
    sub: string;
    title: string;
    text: string;
  }>;
};

export const BRAND_KEYS: BrandKey[] = ["jmsolution", "jmella"];

// Map icon keys (stored in Supabase JSON) to lucide components. The chat UI
// keeps the icon map client-side so the JSON stays serializable.
export const ICON_MAP: Record<string, LucideIcon> = {
  flask: FlaskConical,
  droplets: Droplets,
  shield: ShieldCheck,
  sparkles: Sparkles,
  leaf: Leaf,
};

export function iconForKey(key: string): LucideIcon {
  return ICON_MAP[key] ?? Sparkles;
}

// Fallback content shown when admin hasn't saved brand_details to Supabase yet.
// Mirrors the original local src/data/brand-details.ts so the page never breaks.
export const DEFAULT_BRAND_DETAILS: Record<string, BrandDetail> = {
  jmsolution: {
    key: "jmsolution",
    name: "JMsolution",
    sub: "Skin Science",
    tagline: "Professional K-beauty skincare built for hydration, recovery, and visible radiance.",
    story:
      "JMsolution combines Korean dermatology-inspired research with globally sourced active ingredients for modern skincare channels in Vietnam.",
    heritage:
      "The brand is known for mask and skincare routines designed around hydration, soothing recovery, brightening, and firming. GPCLUB Vietnam positions JMsolution for retailers and B2B partners who need proven K-beauty products with clear customer education.",
    hero: "/brand-jmsolution.jpg",
    meta: {
      title: "JMsolution Vietnam | GPCLUB",
      description:
        "Explore JMsolution skincare, sheet mask, hydration, brightening and anti-aging product lines for Vietnam B2B partners.",
    },
    signature: [
      {
        line: "Hydration",
        name: "Water Luminous Mask",
        note: "A moisture-focused sheet mask concept for dry and dull-looking skin.",
      },
      {
        line: "Recovery",
        name: "Soothing Skin Care",
        note: "Gentle partner-ready care for stressed and sensitive skin routines.",
      },
      {
        line: "Firming",
        name: "Collagen Care",
        note: "Anti-aging support for customers seeking firmer, more resilient skin.",
      },
    ],
    features: [
      {
        iconKey: "flask",
        sub: "R&D",
        title: "Korean skin research",
        text: "Product stories are built around clear skin concerns and active ingredient education.",
      },
      {
        iconKey: "droplets",
        sub: "Moisture",
        title: "Hydration-led routines",
        text: "Hero products focus on moisture, glow, and barrier-friendly care for daily use.",
      },
      {
        iconKey: "shield",
        sub: "Partners",
        title: "B2B-ready positioning",
        text: "The lineup is structured for reseller, retailer, and distributor consultation flows.",
      },
    ],
  },
  jmella: {
    key: "jmella",
    name: "Jmella",
    sub: "Perfume Body & Hair",
    tagline: "French-inspired fragrance care for body, hair, and daily self-care rituals.",
    story:
      "Jmella blends body and hair care with premium fragrance storytelling, making everyday routines easier for retail teams to explain and sell.",
    heritage:
      "The brand turns cleansing, moisturizing, and hair care into a sensorial ritual. GPCLUB Vietnam presents Jmella as a daily-use fragrance care portfolio for retail shelves, reseller content, and B2B partner bundles.",
    hero: "/brand-jmella.jpg",
    meta: {
      title: "Jmella Vietnam | GPCLUB",
      description:
        "Explore Jmella perfume body care and hair care products for Vietnam retail and B2B distribution partners.",
    },
    signature: [
      {
        line: "Body",
        name: "Perfume Body Wash",
        note: "Daily cleansing with a fragrance-led customer story.",
      },
      {
        line: "Body",
        name: "Perfume Body Lotion",
        note: "Moisturizing care that supports scent layering routines.",
      },
      {
        line: "Hair",
        name: "Hair Fragrance Care",
        note: "Hair care positioned around softness, freshness, and long-lasting scent.",
      },
    ],
    features: [
      {
        iconKey: "sparkles",
        sub: "Scent",
        title: "Fragrance storytelling",
        text: "Each product is easier to merchandise through a clear scent and lifestyle concept.",
      },
      {
        iconKey: "leaf",
        sub: "Daily",
        title: "Everyday care rituals",
        text: "Body and hair products fit repeat-purchase routines for broad retail audiences.",
      },
      {
        iconKey: "droplets",
        sub: "Care",
        title: "Gentle moisture support",
        text: "The line combines soft cleansing, hydration, and a polished fragrance finish.",
      },
    ],
  },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function mergeDetail(base: BrandDetail, extra: unknown): BrandDetail {
  const src = isObj(extra) ? extra : {};
  const str = (k: "key" | "name" | "sub" | "tagline" | "story" | "heritage" | "hero") =>
    typeof src[k] === "string" ? (src[k] as string) : base[k];
  const meta = isObj(src.meta) ? src.meta : {};
  return {
    key: str("key"),
    name: str("name"),
    sub: str("sub"),
    tagline: str("tagline"),
    story: str("story"),
    heritage: str("heritage"),
    hero: str("hero"),
    meta: {
      title: typeof meta.title === "string" ? meta.title : base.meta.title,
      description: typeof meta.description === "string" ? meta.description : base.meta.description,
    },
    signature: Array.isArray(src.signature)
      ? (src.signature as BrandDetail["signature"])
      : base.signature,
    features: Array.isArray(src.features)
      ? (src.features as BrandDetail["features"])
      : base.features,
  };
}

const EMPTY_DETAIL: BrandDetail = {
  key: "",
  name: "",
  sub: "",
  tagline: "",
  story: "",
  heritage: "",
  hero: "",
  meta: { title: "", description: "" },
  signature: [],
  features: [],
};

export function mergeBrandDetails(stored: unknown): Record<string, BrandDetail> {
  const src = isObj(stored) ? stored : {};
  const out: Record<string, BrandDetail> = { ...DEFAULT_BRAND_DETAILS };
  for (const key of Object.keys(DEFAULT_BRAND_DETAILS)) {
    if (isObj(src[key])) out[key] = mergeDetail(DEFAULT_BRAND_DETAILS[key], src[key]);
  }
  // Also accept brand keys that only exist in stored data (admin-added brands).
  for (const key of Object.keys(src)) {
    if (!out[key] && isObj(src[key])) out[key] = mergeDetail(EMPTY_DETAIL, src[key]);
  }
  return out;
}

export async function fetchBrandDetails(): Promise<Record<string, BrandDetail>> {
  const { data } = await withPublicDataTimeout(
    supabase.from("home_content").select("value").eq("key", "brand_details").maybeSingle(),
    "brand details",
  );
  return mergeBrandDetails(data?.value);
}

export function useBrandDetails() {
  const [details, setDetails] = useState<Record<string, BrandDetail>>(DEFAULT_BRAND_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchBrandDetails()
      .then((rows) => alive && setDetails(rows))
      .catch(() => alive && setDetails(DEFAULT_BRAND_DETAILS))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { details, loading };
}
