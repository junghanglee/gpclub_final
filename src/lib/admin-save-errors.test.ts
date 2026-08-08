import { strict as assert } from "node:assert";
import { test } from "node:test";
import { isOptimisticConflict } from "./admin-save-errors.ts";

test("recognizes the no-row response from an optimistic update", () => {
  assert.equal(isOptimisticConflict({ code: "PGRST116" }), true);
  assert.equal(isOptimisticConflict({ code: "42501" }), false);
  assert.equal(isOptimisticConflict(null), false);
});
