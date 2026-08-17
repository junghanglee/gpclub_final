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
        ? "min(2.25rem, 9vw)"
        : style.titleSize === "standard"
          ? "min(2.5rem, 10vw)"
          : "min(3rem, 11vw)",
    fontWeight: style.titleWeight === "semibold" ? 600 : style.titleWeight === "bold" ? 700 : 900,
    textAlign: style.align,
    ...(style.titleColor ? { color: style.titleColor } : {}),
  };
}

export function pageHeroCopyClass(style: PageHeroStyle) {
  return style.align === "center" ? "mx-auto text-center" : "text-left";
}
