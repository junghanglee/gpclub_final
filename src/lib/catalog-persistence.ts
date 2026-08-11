type CatalogSelection = { id: string; product_ids: string[] };

export function catalogSelectionWasPersisted(
  persisted: CatalogSelection[],
  expected: CatalogSelection,
) {
  const row = persisted.find((catalog) => catalog.id === expected.id);
  return Boolean(
    row &&
    row.product_ids.length === expected.product_ids.length &&
    row.product_ids.every((id, index) => id === expected.product_ids[index]),
  );
}
