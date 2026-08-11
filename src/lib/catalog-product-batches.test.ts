import assert from "node:assert/strict";
import test from "node:test";
import { batchCatalogProductIds } from "./catalog-product-batches.ts";

test("keeps all 65 selected catalog product ids in the fetch plan", () => {
  const ids = Array.from({ length: 65 }, (_, index) => `product-${index + 1}`);

  const batches = batchCatalogProductIds(ids);

  assert.equal(batches.flat().length, 65);
  assert.deepEqual(batches.flat(), ids);
});

test("deduplicates ids and splits large catalog fetches without losing order", () => {
  const ids = ["a", "b", "a", "c", "d"];

  assert.deepEqual(batchCatalogProductIds(ids, 2), [
    ["a", "b"],
    ["c", "d"],
  ]);
});
