import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  fetchCachedPublicData,
  invalidatePublicDataCache,
  readPublicDataCache,
} from "./public-data-timeout.ts";

test("invalidating a public data key removes its cached value", async () => {
  await fetchCachedPublicData("page-content:brand", async () => "new-image");
  assert.equal(readPublicDataCache("page-content:brand"), "new-image");

  invalidatePublicDataCache("page-content:brand");

  assert.equal(readPublicDataCache("page-content:brand"), undefined);
});
