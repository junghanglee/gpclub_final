import { invalidatePublicDataCache } from "./public-data-timeout.ts";

export const PRODUCT_CATALOG_CACHE_KEY = "product-catalogs";

export function invalidateProductCatalogCache() {
  invalidatePublicDataCache(PRODUCT_CATALOG_CACHE_KEY);
}
