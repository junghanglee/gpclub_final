import type { CSSProperties } from "react";
import type { PageHeroStyle } from "@/lib/page-content";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalizeHeroColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
}

export function pageHeroTitleStyle(style: PageHeroStyle): CSSProperties {
  return {
    fontSize:
      style.titleSize === "compact"
        ? "clamp(2rem, 4vw, 3rem)"
        : style.titleSize === "standard"
          ? "clamp(2.25rem, 5vw, 4rem)"
          : "clamp(2.5rem, 6vw, 5.5rem)",
    fontWeight: style.titleWeight === "semibold" ? 600 : style.titleWeight === "bold" ? 700 : 900,
    textAlign: style.align,
    ...(style.titleColor ? { color: style.titleColor } : {}),
  };
}

export function pageHeroCopyClass(style: PageHeroStyle) {
  return style.align === "center" ? "mx-auto text-center" : "text-left";
}
