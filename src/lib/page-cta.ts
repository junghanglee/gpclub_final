type SiteLang = "vi" | "en";
type LocalizedText = Record<SiteLang, string>;
type PageCtaState = {
  ctaEnabled?: boolean;
  primaryCta: LocalizedText;
  secondaryCta: LocalizedText;
};

export function resolvePageCtaEnabled(page: PageCtaState) {
  if (typeof page.ctaEnabled === "boolean") return page.ctaEnabled;
  return [...Object.values(page.primaryCta), ...Object.values(page.secondaryCta)].some(
    (value) => value.trim().length > 0,
  );
}

export function collectPageCtaIssues(page: PageCtaState, lang: SiteLang, path: string) {
  if (!resolvePageCtaEnabled(page)) return [];
  return [
    page.primaryCta[lang].trim() ? null : `${path}.primaryCta`,
    page.secondaryCta[lang].trim() ? null : `${path}.secondaryCta`,
  ].filter((issue): issue is string => Boolean(issue));
}

export function filterDisabledPageCtaIssues(issues: string[], enabled: boolean) {
  if (enabled) return issues;
  return issues.filter(
    (issue) => !issue.endsWith(".primaryCta") && !issue.endsWith(".secondaryCta"),
  );
}
