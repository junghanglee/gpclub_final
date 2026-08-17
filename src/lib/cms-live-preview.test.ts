import assert from "node:assert/strict";
import test from "node:test";
import { getDraftValue, readCmsPreviewMessage, setDraftValue } from "./cms-live-preview.ts";

test("accepts a matching page draft preview message", () => {
  const content = { title: { vi: "Xin chao", en: "Hello" } };
  assert.deepEqual(
    readCmsPreviewMessage({ source: "gpclub-cms-preview", page: "brand", content }, "brand"),
    content,
  );
});

test("reads and immutably updates nested localized and image values", () => {
  const draft = { section: { title: { vi: "Cu", en: "Old" }, images: [{ url: "old.jpg" }] } };
  assert.equal(getDraftValue(draft, "section.title.vi"), "Cu");
  const next = setDraftValue(draft, "section.images.0.url", "new.jpg") as typeof draft;
  assert.equal(next.section.images[0].url, "new.jpg");
  assert.equal(draft.section.images[0].url, "old.jpg");
});

test("rejects unrelated pages and malformed preview messages", () => {
  assert.equal(readCmsPreviewMessage({ source: "gpclub-cms-preview", page: "b2b" }, "brand"), null);
  assert.equal(
    readCmsPreviewMessage({ source: "other", page: "brand", content: {} }, "brand"),
    null,
  );
});
