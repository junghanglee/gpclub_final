import assert from "node:assert/strict";
import test from "node:test";
import { CATALOG_TEMPLATES, normalizeCatalogTemplate } from "./catalog-templates.ts";

test("offers six distinct catalog templates", () => {
  assert.deepEqual(
    CATALOG_TEMPLATES.map((template) => template.id),
    ["premium", "compact", "lineup", "editorial", "minimal", "spotlight"],
  );
});

test("preserves supported templates and safely falls back for legacy invalid values", () => {
  assert.equal(normalizeCatalogTemplate("editorial"), "editorial");
  assert.equal(normalizeCatalogTemplate("unknown"), "premium");
});
