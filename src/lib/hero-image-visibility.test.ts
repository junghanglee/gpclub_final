import assert from "node:assert/strict";
import test from "node:test";
import { isHeroImageEnabled } from "./hero-image-visibility.ts";

test("keeps hero images enabled for existing content without a visibility field", () => {
  assert.equal(isHeroImageEnabled(undefined), true);
  assert.equal(isHeroImageEnabled({}), true);
});

test("hides a hero image only when an administrator explicitly disables it", () => {
  assert.equal(isHeroImageEnabled({ enabled: false }), false);
  assert.equal(isHeroImageEnabled({ enabled: true }), true);
});
