import assert from "node:assert/strict";
import test from "node:test";
import { selectCatalogTemplate, toggleCatalogProduct } from "./catalog-editor-state.ts";

test("product selection never overwrites a newly selected template", () => {
  const initial = { template: "premium" as const, product_ids: [] as string[] };
  const withTemplate = selectCatalogTemplate(initial, "editorial");
  const withProduct = toggleCatalogProduct(withTemplate, "product-a", true);

  assert.equal(withProduct.template, "editorial");
  assert.deepEqual(withProduct.product_ids, ["product-a"]);
});
