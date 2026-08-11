export const CATALOG_TEMPLATES = [
  { id: "premium", labelKey: "premiumTemplate", tone: "rose" },
  { id: "compact", labelKey: "compactTemplate", tone: "ink" },
  { id: "lineup", labelKey: "lineupTemplate", tone: "coral" },
  { id: "editorial", labelKey: "editorialTemplate", tone: "magazine" },
  { id: "minimal", labelKey: "minimalTemplate", tone: "paper" },
  { id: "spotlight", labelKey: "spotlightTemplate", tone: "gold" },
] as const;

export type CatalogTemplate = (typeof CATALOG_TEMPLATES)[number]["id"];

export function normalizeCatalogTemplate(value: unknown): CatalogTemplate {
  return CATALOG_TEMPLATES.some((template) => template.id === value)
    ? (value as CatalogTemplate)
    : "premium";
}
