export function isHeroImageEnabled(image: { enabled?: boolean } | undefined): boolean {
  return image?.enabled !== false;
}
