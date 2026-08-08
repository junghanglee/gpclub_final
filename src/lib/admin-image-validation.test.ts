import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateAdminImageFile } from "./admin-image-validation.ts";

const imageFile = (size: number, type = "image/jpeg") =>
  new File([new Uint8Array(size)], "hero.jpg", { type });

test("accepts supported images within the upload limit", () => {
  assert.equal(validateAdminImageFile(imageFile(1024)), null);
});

test("rejects empty, unsupported, and oversized files with actionable messages", () => {
  assert.match(validateAdminImageFile(imageFile(0)) ?? "", /empty/i);
  assert.match(validateAdminImageFile(imageFile(1024, "image/svg+xml")) ?? "", /JPG, PNG or WebP/i);
  assert.match(validateAdminImageFile(imageFile(10 * 1024 * 1024 + 1)) ?? "", /10 MB/i);
});
