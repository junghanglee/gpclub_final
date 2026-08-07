import assert from "node:assert/strict";
import test from "node:test";

import { isStorageFile, safeStoragePath } from "./supabase-storage-backup-lib.mjs";

test("keeps valid storage object paths inside the bucket directory", () => {
  assert.equal(
    safeStoragePath("event-media", "page-content/brand/card.jpeg"),
    "event-media/page-content/brand/card.jpeg",
  );
});

test("rejects storage paths that can escape the backup directory", () => {
  assert.throws(() => safeStoragePath("event-media", "../secret.txt"), /unsafe/i);
  assert.throws(() => safeStoragePath("../bucket", "image.png"), /unsafe/i);
  assert.throws(() => safeStoragePath("event-media", "/absolute.png"), /unsafe/i);
});

test("distinguishes files from virtual storage folders", () => {
  assert.equal(isStorageFile({ id: "object-id", name: "image.png" }), true);
  assert.equal(isStorageFile({ id: null, name: "page-content" }), false);
});
