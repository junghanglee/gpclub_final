import assert from "node:assert/strict";
import test from "node:test";

import { resolveBrandCardImage } from "./brand-card-image.ts";

test("uses the CMS brand card image URL", () => {
  assert.equal(
    resolveBrandCardImage(
      { url: "https://cdn.example.com/brand-card.webp", alt: "Brand card" },
      "/fallback.webp",
    ),
    "https://cdn.example.com/brand-card.webp",
  );
});

test("supports legacy string images and falls back for empty values", () => {
  assert.equal(resolveBrandCardImage("/legacy.webp", "/fallback.webp"), "/legacy.webp");
  assert.equal(resolveBrandCardImage({ url: "   " }, "/fallback.webp"), "/fallback.webp");
  assert.equal(resolveBrandCardImage(undefined, "/fallback.webp"), "/fallback.webp");
});
