import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateAdminMediaFile } from "./admin-media-validation.ts";

const mediaFile = (size: number, type: string) =>
  new File([new Uint8Array(size)], "campaign", { type });

test("accepts supported event images and videos", () => {
  assert.equal(validateAdminMediaFile(mediaFile(1024, "image/webp")), null);
  assert.equal(validateAdminMediaFile(mediaFile(1024, "video/mp4")), null);
});

test("rejects empty, unsupported, and oversized event media", () => {
  assert.match(validateAdminMediaFile(mediaFile(0, "video/mp4")) ?? "", /empty/i);
  assert.match(validateAdminMediaFile(mediaFile(1024, "video/quicktime")) ?? "", /MP4 or WebM/i);
  assert.match(
    validateAdminMediaFile(mediaFile(100 * 1024 * 1024 + 1, "video/mp4")) ?? "",
    /100 MB/i,
  );
});
