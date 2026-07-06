import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { productDetailTextFromHtml } from "@/lib/product-detail-html";
import { withPublicDataTimeout } from "@/lib/public-data-timeout";

export type ProductFlag = "new" | "popular" | "featured";
export type ProductMedia = {
  type: "image" | "video";
  url: string;
  alt?: string;
};
export type ProductCondition = {
  label: string;
  value: string;
  visible: boolean;
};

export type CatalogProduct = {
  id: string;
  brand_id: string | null;
  brand_key?: string;
  brand_slug?: string;
  brand_display_name?: string;
  brand_name: string;
  product_name: string;
  product_type: string;
  short_intro: string;
  detail_html: string | null;
  media: ProductMedia[];
  conditions: ProductCondition[];
  cover_image_url: string | null;
  sort_order: number;
  published: boolean;
  is_new: boolean;
  is_popular: boolean;
  is_featured: boolean;
  skin_types: string[];
  concerns: string[];
  created_at?: string;
  updated_at?: string;
};

export type CatalogBrandSummary = {
  id: string;
  key: string;
  slug: string;
  name: string;
  count: number;
  sort_order: number;
};

type CatalogBrandJoin = {
  id: string;
  key: string;
  slug: string;
  name: string;
  sort_order: number;
  published: boolean;
};

type CatalogProductRow = Partial<CatalogProduct> & {
  brands?: CatalogBrandJoin | CatalogBrandJoin[] | null;
};

type CatalogBrandSummaryRow = {
  brand_id: string | null;
  brands?: CatalogBrandJoin | CatalogBrandJoin[] | null;
};

const CATALOG_PRODUCT_LIST_COLUMNS =
  "id,brand_id,brand_name,product_name,product_type,short_intro,cover_image_url,sort_order,published,is_new,is_popular,is_featured,created_at,updated_at,brands!inner(id,key,slug,name,sort_order,published)";
const LEGACY_CATALOG_PRODUCT_LIST_COLUMNS =
  "id,brand_name,product_name,product_type,short_intro,cover_image_url,sort_order,published,is_new,is_popular,is_featured,created_at,updated_at";
export const catalogProductsQueryKey = ["catalog-products", "published"] as const;
export const catalogBrandSummariesQueryKey = [
  "catalog-products",
  "published-brand-summaries",
] as const;
const EMPTY_CATALOG_PRODUCTS: CatalogProduct[] = [];
const EMPTY_CATALOG_BRAND_SUMMARIES: CatalogBrandSummary[] = [];

export function normalizeBrandText(value?: string | null) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function canonicalBrandName(value: string) {
  const normalized = normalizeBrandText(value);
  if (normalized === "jmella") return "JMELLA";
  if (normalized === "jmsolution") return "JMsolution";
  return value.trim();
}

export function normalizedSearchText(value?: string | null) {
  const text = (value || "").toLowerCase();
  return `${text} ${normalizeBrandText(text)}`;
}

export function productSearchText(p: CatalogProduct) {
  return normalizedSearchText(
    [
      p.brand_display_name || p.brand_name,
      p.product_name,
      p.product_type,
      p.short_intro,
      productDetailTextFromHtml(p.detail_html),
      (p.conditions ?? []).map((c) => `${c.label} ${c.value}`).join(" "),
    ].join(" "),
  );
}

function getJoinedBrand(row: { brands?: CatalogBrandJoin | CatalogBrandJoin[] | null }) {
  if (Array.isArray(row.brands)) return row.brands[0] ?? null;
  return row.brands ?? null;
}

function isMissingBrandSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    code === "PGRST200" ||
    code === "PGRST205" ||
    message.includes("Could not find the table 'public.brands'") ||
    message.includes("Could not find a relationship") ||
    message.includes("admin_products_brand_id_fkey")
  );
}

function normalizeCatalogProductRow(row: CatalogProductRow): CatalogProduct {
  const joinedBrand = getJoinedBrand(row);
  const brandDisplayName = joinedBrand?.name || row.brand_name || "";

  return {
    id: row.id || "",
    brand_id: row.brand_id ?? joinedBrand?.id ?? null,
    brand_key: joinedBrand?.key,
    brand_slug: joinedBrand?.slug,
    brand_display_name: brandDisplayName,
    brand_name: brandDisplayName,
    product_name: row.product_name || "",
    product_type: row.product_type || "",
    short_intro: row.short_intro || "",
    detail_html: row.detail_html ?? null,
    media: Array.isArray(row.media) ? row.media : [],
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    cover_image_url: row.cover_image_url ?? null,
    sort_order: Number.isFinite(row.sort_order) ? Number(row.sort_order) : 0,
    published: row.published ?? true,
    is_new: row.is_new ?? false,
    is_popular: row.is_popular ?? false,
    is_featured: row.is_featured ?? false,
    skin_types: Array.isArray(row.skin_types) ? row.skin_types : [],
    concerns: Array.isArray(row.concerns) ? row.concerns : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeLegacyCatalogProductRow(row: CatalogProductRow): CatalogProduct {
  const product = normalizeCatalogProductRow(row);
  const brandName = canonicalBrandName(product.brand_name || "");
  const brandKey = normalizeBrandText(brandName);
  return {
    ...product,
    brand_id: null,
    brand_key: brandKey,
    brand_slug: brandKey,
    brand_display_name: brandName,
    brand_name: brandName,
  };
}

async function fetchLegacyPublishedCatalogProducts(
  limit = 120,
  options: { brandId?: string; brandKey?: string } = {},
) {
  let query = supabase
    .from("admin_products")
    .select(LEGACY_CATALOG_PRODUCT_LIST_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit > 0) query = query.limit(limit);

  const { data, error } = await withPublicDataTimeout(query, "legacy catalog products");
  if (error) throw error;

  const brandFilter = normalizeBrandText(options.brandKey || options.brandId || "");
  return (data || [])
    .map((row) => normalizeLegacyCatalogProductRow(row as CatalogProductRow))
    .filter((product) => {
      const productBrand = normalizeBrandText(product.brand_name);
      return productBrand && (!brandFilter || productBrand === brandFilter);
    });
}

export async function fetchPublishedCatalogProducts(
  limit = 120,
  options: { brandId?: string; brandKey?: string } = {},
) {
  let query = supabase
    .from("admin_products")
    .select(CATALOG_PRODUCT_LIST_COLUMNS)
    .eq("published", true)
    .eq("brands.published", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.brandId) query = query.eq("brand_id", options.brandId);
  if (options.brandKey) query = query.eq("brands.key", options.brandKey);

  if (limit > 0) query = query.limit(limit);

  try {
    const { data, error } = await withPublicDataTimeout(query, "catalog products");

    if (error) throw error;
    return (data || []).map((row) => normalizeCatalogProductRow(row as CatalogProductRow));
  } catch (error) {
    if (isMissingBrandSchemaError(error)) {
      try {
        return await fetchLegacyPublishedCatalogProducts(limit, options);
      } catch {
        return EMPTY_CATALOG_PRODUCTS;
      }
    }

    return EMPTY_CATALOG_PRODUCTS;
  }
}

export async function fetchPublishedCatalogBrandSummaries() {
  const query = supabase
    .from("admin_products")
    .select("brand_id,brands!inner(id,key,slug,name,sort_order,published)")
    .eq("published", true)
    .eq("brands.published", true);

  try {
    const { data, error } = await withPublicDataTimeout(query, "catalog brand summaries");

    if (error) throw error;

    const counts = new Map<string, CatalogBrandSummary>();
    for (const row of (data || []) as CatalogBrandSummaryRow[]) {
      const brand = getJoinedBrand(row);
      if (!brand?.id) continue;

      const existing = counts.get(brand.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(brand.id, {
          id: brand.id,
          key: brand.key,
          slug: brand.slug,
          name: brand.name,
          sort_order: Number.isFinite(brand.sort_order) ? Number(brand.sort_order) : 0,
          count: 1,
        });
      }
    }

    return Array.from(counts.values()).sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    );
  } catch (error) {
    if (isMissingBrandSchemaError(error)) {
      try {
        const legacyProducts = await fetchLegacyPublishedCatalogProducts(0);
        const counts = new Map<string, CatalogBrandSummary>();

        for (const product of legacyProducts) {
          const key = normalizeBrandText(product.brand_display_name || product.brand_name);
          if (!key) continue;

          const existing = counts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(key, {
              id: key,
              key,
              slug: key,
              name: product.brand_display_name || product.brand_name,
              sort_order: 0,
              count: 1,
            });
          }
        }

        return Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        return EMPTY_CATALOG_BRAND_SUMMARIES;
      }
    }

    return EMPTY_CATALOG_BRAND_SUMMARIES;
  }
}

export async function fetchPublishedCatalogProductById(id: string) {
  try {
    const { data, error } = await withPublicDataTimeout(
      supabase
        .from("admin_products")
        .select("*,brands(id,key,slug,name,sort_order,published)")
        .eq("published", true)
        .eq("brands.published", true)
        .eq("id", id)
        .maybeSingle(),
      "catalog product detail",
    );

    if (error) throw error;
    return data ? normalizeCatalogProductRow(data as CatalogProductRow) : null;
  } catch (error) {
    if (isMissingBrandSchemaError(error)) {
      try {
        const { data, error: legacyError } = await withPublicDataTimeout(
          supabase
            .from("admin_products")
            .select("*")
            .eq("published", true)
            .eq("id", id)
            .maybeSingle(),
          "legacy catalog product detail",
        );

        if (legacyError) throw legacyError;
        return data ? normalizeLegacyCatalogProductRow(data as CatalogProductRow) : null;
      } catch {
        return null;
      }
    }

    return null;
  }
}

export function useCatalogProducts(
  options: {
    enabled?: boolean;
    limit?: number;
    brandId?: string;
    brandKey?: string;
  } = {},
) {
  const limit = options.limit ?? 48;
  const query = useQuery({
    queryKey: [
      ...catalogProductsQueryKey,
      limit,
      options.brandId ?? null,
      options.brandKey ?? null,
    ],
    queryFn: () =>
      fetchPublishedCatalogProducts(limit, {
        brandId: options.brandId,
        brandKey: options.brandKey,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    enabled: options.enabled ?? true,
  });
  const rows = query.data ?? EMPTY_CATALOG_PRODUCTS;
  const loading = query.isLoading;
  const source: "admin" | "empty" = rows.length > 0 ? "admin" : "empty";

  const types = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((p) => p.product_type).filter(Boolean)))],
    [rows],
  );
  const brands = useMemo(
    () => [
      "All",
      ...Array.from(new Set(rows.map((p) => p.brand_display_name || p.brand_name).filter(Boolean))),
    ],
    [rows],
  );

  return { rows, loading, error: query.error, source, types, brands };
}

export function usePublishedCatalogBrandSummaries(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: catalogBrandSummariesQueryKey,
    queryFn: fetchPublishedCatalogBrandSummaries,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    enabled: options.enabled ?? true,
  });

  return {
    rows: query.data ?? EMPTY_CATALOG_BRAND_SUMMARIES,
    loading: query.isLoading,
    error: query.error,
  };
}

export function getCoverImage(p: CatalogProduct) {
  return p.cover_image_url || (p.media ?? []).find((m) => m.type === "image")?.url || "";
}

/**
 * Product recommendation helpers for the Gippy AI consultant.
 * All filter against the Supabase-backed catalog (admin_products) instead of
 * the deleted local `@/data/products` module. Each helper returns at most 3
 * matches so chat bubbles stay small and memory-bounded.
 */
export type SkinType = "Dry" | "Oily" | "Combination" | "Sensitive" | "All";

export function pickBySkin(rows: CatalogProduct[], t: SkinType, limit = 3) {
  return rows
    .filter((p) => {
      const types = p.skin_types ?? [];
      return types.includes(t) || types.includes("All");
    })
    .slice(0, limit);
}

export function pickByConcern(rows: CatalogProduct[], c: string, limit = 3) {
  const lc = c.toLowerCase();
  return rows
    .filter((p) => {
      const concerns = (p.concerns ?? []).some((x) => x.toLowerCase().includes(lc));
      const tagline = (p.short_intro ?? "").toLowerCase().includes(lc);
      return concerns || tagline;
    })
    .slice(0, limit);
}

export function pickByQuery(rows: CatalogProduct[], q: string, limit = 3) {
  const lc = q.toLowerCase();
  return rows
    .filter((p) => {
      const haystack = productSearchText(p).toLowerCase();
      return (
        haystack.includes(lc) ||
        (p.concerns ?? []).some((c) => lc.includes(c.toLowerCase())) ||
        lc.includes((p.brand_display_name || p.brand_name || "").toLowerCase())
      );
    })
    .slice(0, limit);
}
