function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export function jsonValuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export function jsonRecordContains(saved: unknown, requested: Record<string, unknown>): boolean {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return false;
  const savedRecord = saved as Record<string, unknown>;
  return Object.entries(requested).every(([key, value]) =>
    jsonValuesEqual(savedRecord[key], value),
  );
}
