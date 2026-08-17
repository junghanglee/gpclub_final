import assert from "node:assert/strict";
import test from "node:test";
import { readCmsPreviewMessage } from "./cms-live-preview.ts";

test("accepts a matching page draft preview message", () => {
  const content = { title: { vi: "Xin chao", en: "Hello" } };
  assert.deepEqual(
    readCmsPreviewMessage({ source: "gpclub-cms-preview", page: "brand", content }, "brand"),
    content,
  );
});

test("rejects unrelated pages and malformed preview messages", () => {
  assert.equal(readCmsPreviewMessage({ source: "gpclub-cms-preview", page: "b2b" }, "brand"), null);
  assert.equal(
    readCmsPreviewMessage({ source: "other", page: "brand", content: {} }, "brand"),
    null,
  );
});
