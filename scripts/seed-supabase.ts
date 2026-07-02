/**
 * One-shot seed script: pushes the original local product + brand-detail data
 * (formerly in src/data/) into Supabase so the public site reads everything
 * from the database instead of deleted local files.
 *
 * Run once after applying the migration:
 *   npx tsx scripts/seed-supabase.ts
 *
 * Requires env vars in your shell (do NOT hardcode secrets in the repo):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * On Windows Git Bash you can do:
 *   export SUPABASE_URL=...; export SUPABASE_SERVICE_ROLE_KEY=...; npx tsx scripts/seed-supabase.ts
 *
 * Idempotent: products are upserted by product_name, brand_details by key.
 */
import { supabaseAdmin } from "../src/integrations/supabase/client.server";

type SeedProduct = {
  product_name: string;
  brand_name: string;
  product_type: string;
  short_intro: string;
  cover_image_url: string;
  skin_types: string[];
  concerns: string[];
  published: boolean;
  is_new: boolean;
  is_popular: boolean;
  is_featured: boolean;
};

// Verbatim from the deleted src/data/products.ts — every field filled, none empty.
const SEED_PRODUCTS: SeedProduct[] = [
  {
    product_name: "Water Luminous Mask",
    brand_name: "JMsolution",
    product_type: "Sheet Mask",
    short_intro: "Hydrating care for dull and dry-looking skin.",
    cover_image_url: "/brand-jmsolution.jpg",
    skin_types: ["Dry", "Combination", "Sensitive"],
    concerns: ["Hydration", "Brightening"],
    published: true,
    is_new: false,
    is_popular: true,
    is_featured: true,
  },
  {
    product_name: "Collagen Firming Care",
    brand_name: "JMsolution",
    product_type: "Skin Care",
    short_intro: "Firming routine support for anti-aging partner channels.",
    cover_image_url: "/brand-jmsolution.jpg",
    skin_types: ["Dry", "Combination", "All"],
    concerns: ["Anti-aging", "Hydration"],
    published: true,
    is_new: true,
    is_popular: false,
    is_featured: false,
  },
  {
    product_name: "Perfume Body Care Collection",
    brand_name: "Jmella",
    product_type: "Body Care",
    short_intro: "French-inspired daily fragrance care for body routines.",
    cover_image_url: "/brand-jmella.jpg",
    skin_types: ["All"],
    concerns: ["Fragrance", "Body care", "Hydration"],
    published: true,
    is_new: false,
    is_popular: true,
    is_featured: true,
  },
  {
    product_name: "Hair Fragrance Care",
    brand_name: "Jmella",
    product_type: "Hair Care",
    short_intro: "Scented hair care for daily retail and reseller demand.",
    cover_image_url: "/brand-jmella.jpg",
    skin_types: ["All"],
    concerns: ["Fragrance", "Body care"],
    published: true,
    is_new: false,
    is_popular: false,
    is_featured: false,
  },
  {
    product_name: "GPCLUB B2B Partner Curation",
    brand_name: "GPCLUB",
    product_type: "B2B Set",
    short_intro: "A balanced K-beauty starter lineup for wholesale partners.",
    cover_image_url: "/hero-kbeauty.jpg",
    skin_types: ["All"],
    concerns: ["Hydration", "Brightening", "Pores", "Body care"],
    published: true,
    is_new: false,
    is_popular: false,
    is_featured: false,
  },
];

// Verbatim from the deleted src/data/brand-details.ts — icon stored as a string
// key; the route maps it to a lucide component client-side via ICON_MAP.
const BRAND_DETAILS_VALUE = {
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

async function seedProducts() {
  let inserted = 0;
  let updated = 0;
  for (const p of SEED_PRODUCTS) {
    // Match on product_name so re-running the script updates instead of duplicating.
    const { data: existing } = await supabaseAdmin
      .from("admin_products")
      .select("id")
      .eq("product_name", p.product_name)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("admin_products")
        .update({ ...p, sort_order: 0 })
        .eq("id", existing.id);
      if (error) throw new Error(`Update ${p.product_name} failed: ${error.message}`);
      updated += 1;
    } else {
      const { error } = await supabaseAdmin.from("admin_products").insert({ ...p, sort_order: 0 });
      if (error) throw new Error(`Insert ${p.product_name} failed: ${error.message}`);
      inserted += 1;
    }
  }
  console.log(
    `Products: ${inserted} inserted, ${updated} updated (total ${SEED_PRODUCTS.length}).`,
  );
}

async function seedBrandDetails() {
  const { error } = await supabaseAdmin
    .from("home_content")
    .upsert({ key: "brand_details", value: BRAND_DETAILS_VALUE });
  if (error) throw new Error(`Brand details upsert failed: ${error.message}`);
  console.log("Brand details: upserted into home_content (key=brand_details).");
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Put them in .env or export them before running.",
    );
    process.exit(1);
  }
  console.log("Seeding Supabase from local data...");
  await seedProducts();
  await seedBrandDetails();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
