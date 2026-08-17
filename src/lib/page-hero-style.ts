import type { CSSProperties } from "react";
import type { PageHeroStyle } from "@/lib/page-content";

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
  };
}

export function pageHeroCopyClass(style: PageHeroStyle) {
  return style.align === "center" ? "mx-auto text-center" : "text-left";
}
