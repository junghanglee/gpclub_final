export function resolveBrandCardImage(image: unknown, fallback: string): string {
  if (typeof image === "string") {
    return image.trim() || fallback;
  }

  if (image && typeof image === "object" && "url" in image) {
    const url = image.url;

    if (typeof url === "string" && url.trim()) {
      return url;
    }
  }

  return fallback;
}
