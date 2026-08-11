import assert from "node:assert/strict";
import test from "node:test";
import {
  collectPageCtaIssues,
  filterDisabledPageCtaIssues,
  resolvePageCtaEnabled,
} from "./page-cta.ts";

const emptyCta = { primaryCta: { vi: "", en: "" }, secondaryCta: { vi: "", en: "" } };

test("legacy pages infer CTA visibility from their existing text", () => {
  assert.equal(resolvePageCtaEnabled(emptyCta), false);
  assert.equal(
    resolvePageCtaEnabled({ ...emptyCta, primaryCta: { vi: "Liên hệ", en: "Contact" } }),
    true,
  );
});

test("disabled CTA fields never block content saving", () => {
  assert.deepEqual(collectPageCtaIssues({ ...emptyCta, ctaEnabled: false }, "en", "Products"), []);
});

test("enabled CTA fields remain required for the active language", () => {
  assert.deepEqual(collectPageCtaIssues({ ...emptyCta, ctaEnabled: true }, "en", "Products"), [
    "Products.primaryCta",
    "Products.secondaryCta",
  ]);
});

test("disabled CTA fields are removed from cross-language validation issues", () => {
  assert.deepEqual(
    filterDisabledPageCtaIssues(
      ["Products.title", "Products.primaryCta", "Products.secondaryCta"],
      false,
    ),
    ["Products.title"],
  );
});
