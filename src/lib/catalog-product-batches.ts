export function batchCatalogProductIds(productIds: string[], batchSize = 100) {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  const safeBatchSize = Math.max(1, Math.floor(batchSize));
  const batches: string[][] = [];

  for (let index = 0; index < uniqueIds.length; index += safeBatchSize) {
    batches.push(uniqueIds.slice(index, index + safeBatchSize));
  }

  return batches;
}
