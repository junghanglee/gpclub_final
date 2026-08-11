import test from "node:test";
import assert from "node:assert/strict";
import { resolveCatalogCoverImage } from "./catalog-cover.ts";
import type { CatalogProduct } from "./catalog-products.ts";

const products = [
  { id: "a", product_name: "A", cover_image_url: "https://a.test/a.jpg" },
  { id: "b", product_name: "B", cover_image_url: "https://a.test/b.jpg" },
] as unknown as CatalogProduct[];

test("catalog cover prefers an explicit uploaded URL", () => {
  assert.equal(
    resolveCatalogCoverImage(
      {
        cover_image_url: " https://custom.test/cover.jpg ",
        cover_product_id: null,
        product_ids: [],
      },
      products,
    ),
    "https://custom.test/cover.jpg",
  );
});

test("catalog cover can resolve the selected product", () => {
  assert.equal(
    resolveCatalogCoverImage(
      { cover_image_url: "", cover_product_id: "b", product_ids: [] },
      products,
    ),
    "https://a.test/b.jpg",
  );
});

test("legacy catalogs fall back to their first selected product", () => {
  assert.equal(
    resolveCatalogCoverImage(
      { cover_image_url: "", cover_product_id: null, product_ids: ["b", "a"] },
      products,
    ),
    "https://a.test/b.jpg",
  );
});
