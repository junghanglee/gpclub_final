import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogProduct } from "@/lib/catalog-products";

export type ProductCatalog = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  template: "premium" | "compact" | "lineup";
  product_ids: string[];
  is_representative: boolean;
  created_at: string;
  updated_at: string;
};

export const PRODUCT_CATALOGS_KEY = "product_catalogs";

export function createCatalogId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `catalog-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeCatalog(value: Partial<ProductCatalog>): ProductCatalog {
  const now = new Date().toISOString();
  return {
    id: String(value.id || createCatalogId()),
    title: String(value.title || "GPCLUB Vietnam Product Catalog"),
    subtitle: String(value.subtitle || "Curated K-Beauty portfolio for B2B partners"),
    description: String(value.description || ""),
    template: value.template === "compact" || value.template === "lineup" ? value.template : "premium",
    product_ids: Array.isArray(value.product_ids) ? value.product_ids.map(String) : [],
    is_representative: Boolean(value.is_representative),
    created_at: String(value.created_at || now),
    updated_at: String(value.updated_at || now),
  };
}

function normalizeCatalogs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeCatalog(item as Partial<ProductCatalog>));
}

export async function fetchProductCatalogs() {
  const { data, error } = await supabase
    .from("home_content")
    .select("value")
    .eq("key", PRODUCT_CATALOGS_KEY)
    .maybeSingle();

  if (error) throw error;
  return normalizeCatalogs(data?.value);
}

export async function saveProductCatalogs(catalogs: ProductCatalog[]) {
  const normalized = catalogs.map((catalog, index) => ({
    ...normalizeCatalog(catalog),
    is_representative: catalog.is_representative && catalogs.findIndex((item) => item.is_representative) === index,
  }));
  const { error } = await supabase
    .from("home_content")
    .upsert({ key: PRODUCT_CATALOGS_KEY, value: normalized });
  if (error) throw error;
  return normalized;
}

export async function fetchRepresentativeCatalog() {
  const catalogs = await fetchProductCatalogs();
  return catalogs.find((catalog) => catalog.is_representative) || catalogs[0] || null;
}

export async function fetchCatalogById(id: string) {
  const catalogs = await fetchProductCatalogs();
  return catalogs.find((catalog) => catalog.id === id) || null;
}

export function sortCatalogProducts(catalog: ProductCatalog | null, products: CatalogProduct[]) {
  if (!catalog) return [];
  const byId = new Map(products.map((product) => [product.id, product]));
  return catalog.product_ids.map((id) => byId.get(id)).filter(Boolean) as CatalogProduct[];
}

export function useRepresentativeCatalog() {
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchRepresentativeCatalog()
      .then((data) => alive && setCatalog(data))
      .catch(() => alive && setCatalog(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const downloadPath = useMemo(() => (catalog ? `/catalog/${catalog.id}` : "/catalog"), [catalog]);

  return { catalog, loading, downloadPath };
}
