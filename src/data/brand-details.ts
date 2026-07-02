import type { LucideIcon } from "lucide-react";
import { Droplets, FlaskConical, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import jmellaHero from "@/assets/brand-jmella.jpg";
import jmsolutionHero from "@/assets/brand-jmsolution.jpg";

export type BrandKey = "jmsolution" | "jmella";

export type BrandDetail = {
  key: BrandKey;
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
    icon: LucideIcon;
    sub: string;
    title: string;
    text: string;
  }>;
};

export const BRAND_KEYS: BrandKey[] = ["jmsolution", "jmella"];

export const BRAND_DETAILS: Record<BrandKey, BrandDetail> = {
  jmsolution: {
    key: "jmsolution",
    name: "JMsolution",
    sub: "Skin Science",
    tagline: "Professional K-beauty skincare built for hydration, recovery, and visible radiance.",
    story:
      "JMsolution combines Korean dermatology-inspired research with globally sourced active ingredients for modern skincare channels in Vietnam.",
    heritage:
      "The brand is known for mask and skincare routines designed around hydration, soothing recovery, brightening, and firming. GPCLUB Vietnam positions JMsolution for retailers and B2B partners who need proven K-beauty products with clear customer education.",
    hero: jmsolutionHero,
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
        icon: FlaskConical,
        sub: "R&D",
        title: "Korean skin research",
        text: "Product stories are built around clear skin concerns and active ingredient education.",
      },
      {
        icon: Droplets,
        sub: "Moisture",
        title: "Hydration-led routines",
        text: "Hero products focus on moisture, glow, and barrier-friendly care for daily use.",
      },
      {
        icon: ShieldCheck,
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
    hero: jmellaHero,
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
        icon: Sparkles,
        sub: "Scent",
        title: "Fragrance storytelling",
        text: "Each product is easier to merchandise through a clear scent and lifestyle concept.",
      },
      {
        icon: Leaf,
        sub: "Daily",
        title: "Everyday care rituals",
        text: "Body and hair products fit repeat-purchase routines for broad retail audiences.",
      },
      {
        icon: Droplets,
        sub: "Care",
        title: "Gentle moisture support",
        text: "The line combines soft cleansing, hydration, and a polished fragrance finish.",
      },
    ],
  },
};
