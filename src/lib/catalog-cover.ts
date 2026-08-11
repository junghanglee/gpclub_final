import type { CatalogProduct } from "./catalog-products.ts";
import type { ProductCatalog } from "./product-catalogs.ts";

export function resolveCatalogCoverImage(
  catalog: Pick<ProductCatalog, "cover_image_url" | "cover_product_id" | "product_ids">,
  products: CatalogProduct[],
) {
  const imageFor = (product: CatalogProduct) =>
    product.cover_image_url || product.media?.find((media) => media.type === "image")?.url || "";
  if (catalog.cover_image_url?.trim()) return catalog.cover_image_url.trim();
  const selected =
    catalog.cover_product_id && products.find((product) => product.id === catalog.cover_product_id);
  if (selected) return imageFor(selected);
  const first = products.find((product) => product.id === catalog.product_ids[0]) || products[0];
  return first ? imageFor(first) : "";
}
