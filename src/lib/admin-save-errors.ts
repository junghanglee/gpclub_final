export function isOptimisticConflict(error: { code?: string } | null | undefined): boolean {
  return error?.code === "PGRST116";
}
