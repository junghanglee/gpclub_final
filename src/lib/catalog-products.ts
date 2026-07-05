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

const CATALOG_PRODUCT_LIST_COLUMNS =
  "id,brand_name,product_name,product_type,short_intro,cover_image_url,sort_order,published,is_new,is_popular,is_featured,created_at,updated_at";
export const catalogProductsQueryKey = ["catalog-products", "published"] as const;
const EMPTY_CATALOG_PRODUCTS: CatalogProduct[] = [];

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
      p.brand_name,
      p.product_name,
      p.product_type,
      p.short_intro,
      productDetailTextFromHtml(p.detail_html),
      (p.conditions ?? []).map((c) => `${c.label} ${c.value}`).join(" "),
    ].join(" "),
  );
}

function normalizeCatalogProductRow(row: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: row.id || "",
    brand_name: row.brand_name || "",
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

export async function fetchPublishedCatalogProducts(limit = 120) {
  let query = supabase
    .from("admin_products")
    .select(CATALOG_PRODUCT_LIST_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit > 0) query = query.limit(limit);

  try {
    const { data, error } = await withPublicDataTimeout(query, "catalog products");

    if (error) throw error;
    return (data || []).map((row) => normalizeCatalogProductRow(row as Partial<CatalogProduct>));
  } catch {
    return EMPTY_CATALOG_PRODUCTS;
  }
}

export async function fetchPublishedCatalogProductById(id: string) {
  try {
    const { data, error } = await withPublicDataTimeout(
      supabase.from("admin_products").select("*").eq("published", true).eq("id", id).maybeSingle(),
      "catalog product detail",
    );

    if (error) throw error;
    return (data ?? null) as CatalogProduct | null;
  } catch {
    return null;
  }
}

export function useCatalogProducts(options: { enabled?: boolean; limit?: number } = {}) {
  const limit = options.limit ?? 48;
  const query = useQuery({
    queryKey: [...catalogProductsQueryKey, limit],
    queryFn: () => fetchPublishedCatalogProducts(limit),
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
    () => ["All", ...Array.from(new Set(rows.map((p) => p.brand_name).filter(Boolean)))],
    [rows],
  );

  return { rows, loading, error: query.error, source, types, brands };
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
        lc.includes((p.brand_name ?? "").toLowerCase())
      );
    })
    .slice(0, limit);
}
