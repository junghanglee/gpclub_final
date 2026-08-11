import assert from "node:assert/strict";
import test from "node:test";
import { catalogSelectionWasPersisted } from "./catalog-persistence.ts";

test("verifies that a saved catalog keeps every selected product in order", () => {
  const saved = { id: "catalog-a", product_ids: ["p2", "p1", "p3"] };
  assert.equal(catalogSelectionWasPersisted([saved], saved), true);
  assert.equal(
    catalogSelectionWasPersisted([{ ...saved, product_ids: ["p2", "p1"] }], saved),
    false,
  );
  assert.equal(
    catalogSelectionWasPersisted([{ ...saved, product_ids: ["p1", "p2", "p3"] }], saved),
    false,
  );
});
