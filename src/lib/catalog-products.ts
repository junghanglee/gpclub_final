import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { productDetailTextFromHtml } from "@/lib/product-detail-html";

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
  created_at?: string;
  updated_at?: string;
};

const CATALOG_PRODUCT_LIST_COLUMNS =
  "id,brand_name,product_name,product_type,short_intro,media,conditions,cover_image_url,sort_order,published,is_new,is_popular,is_featured,created_at,updated_at";

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
      p.conditions.map((c) => `${c.label} ${c.value}`).join(" "),
    ].join(" "),
  );
}

export async function fetchPublishedCatalogProducts(limit = 120) {
  let query = supabase
    .from("admin_products")
    .select(CATALOG_PRODUCT_LIST_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit > 0) query = query.limit(limit);

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as CatalogProduct[];
}

export async function fetchPublishedCatalogProductById(id: string) {
  const { data, error } = await supabase
    .from("admin_products")
    .select("*")
    .eq("published", true)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as CatalogProduct | null;
}

export function useCatalogProducts() {
  const [rows, setRows] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"admin" | "empty">("empty");

  useEffect(() => {
    let alive = true;
    fetchPublishedCatalogProducts()
      .then((data) => {
        if (!alive) return;
        setRows(data);
        setSource(data.length > 0 ? "admin" : "empty");
      })
      .catch(() => {
        if (!alive) return;
        setRows([]);
        setSource("empty");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((p) => p.product_type).filter(Boolean)))],
    [rows],
  );
  const brands = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((p) => p.brand_name).filter(Boolean)))],
    [rows],
  );

  return { rows, loading, source, types, brands };
}

export function getCoverImage(p: CatalogProduct) {
  return p.cover_image_url || p.media.find((m) => m.type === "image")?.url || "";
}
