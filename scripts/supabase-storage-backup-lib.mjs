import path from "node:path";

export function isStorageFile(entry) {
  return typeof entry?.id === "string" && entry.id.length > 0;
}

export function safeStoragePath(bucket, objectPath) {
  for (const value of [bucket, objectPath]) {
    if (
      typeof value !== "string" ||
      !value ||
      value.includes("\\") ||
      value.includes("\0") ||
      path.posix.isAbsolute(value)
    ) {
      throw new Error(`Unsafe storage path: ${String(value)}`);
    }
  }

  const segments = `${bucket}/${objectPath}`.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`Unsafe storage path: ${bucket}/${objectPath}`);
  }

  return segments.join("/");
}
