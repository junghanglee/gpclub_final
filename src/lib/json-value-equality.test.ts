import { strict as assert } from "node:assert";
import { test } from "node:test";
import { jsonRecordContains, jsonValuesEqual } from "./json-value-equality.ts";

test("compares persisted JSON independently of object key order", () => {
  const requested = { hero: { desktopUrl: "desktop.jpg", mobileUrl: "mobile.jpg" }, order: 1 };
  const persisted = { order: 1, hero: { mobileUrl: "mobile.jpg", desktopUrl: "desktop.jpg" } };

  assert.equal(jsonValuesEqual(requested, persisted), true);
});

test("detects a changed nested media URL", () => {
  assert.equal(
    jsonValuesEqual({ image: { url: "old.jpg" } }, { image: { url: "new.jpg" } }),
    false,
  );
});

test("verifies a saved database row contains the requested fields", () => {
  const requested = { title: "Campaign", image_url: "image.jpg", active: true };
  const saved = {
    id: "row-1",
    created_at: "now",
    active: true,
    image_url: "image.jpg",
    title: "Campaign",
  };

  assert.equal(jsonRecordContains(saved, requested), true);
  assert.equal(jsonRecordContains({ ...saved, image_url: "old.jpg" }, requested), false);
});
