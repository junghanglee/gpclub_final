import assert from "node:assert/strict";
import test from "node:test";
import { fetchCachedPublicData, readPublicDataCache } from "./public-data-timeout.ts";
import {
  invalidateProductCatalogCache,
  PRODUCT_CATALOG_CACHE_KEY,
} from "./product-catalog-cache.ts";

test("catalog save invalidation removes the stale catalog list", async () => {
  await fetchCachedPublicData(PRODUCT_CATALOG_CACHE_KEY, async () => ["old-catalog"]);
  assert.deepEqual(readPublicDataCache(PRODUCT_CATALOG_CACHE_KEY), ["old-catalog"]);

  invalidateProductCatalogCache();

  assert.equal(readPublicDataCache(PRODUCT_CATALOG_CACHE_KEY), undefined);
});
