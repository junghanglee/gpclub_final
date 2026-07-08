import type { ADMIN_I18N } from "@/components/admin/admin-i18n";
import {
  type CmsContentLang,
  CmsPanel,
  LocalizedTextField,
} from "@/components/admin/cms-form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomeAdminContent } from "@/lib/home-content";

type LocalizedFieldProps = {
  activeLang: CmsContentLang;
  compareMode: boolean;
};

type T = (key: keyof typeof ADMIN_I18N) => string;

function countIssues(issues: string[], needles: string[]) {
  return issues.filter((issue) => needles.some((needle) => issue.includes(needle))).length;
}

export function HomeContentSections({
  form,
  patch,
  patchHero,
  patchStats,
  patchPartner,
  patchTrust,
  patchProcess,
  patchImages,
  patchCta,
  localizedFieldProps,
  t,
  validationIssues,
}: {
  form: HomeAdminContent;
  patch: (next: Partial<HomeAdminContent>) => void;
  patchHero: (next: Partial<HomeAdminContent["hero"]>) => void;
  patchStats: (next: Partial<HomeAdminContent["stats"]>) => void;
  patchPartner: (next: Partial<HomeAdminContent["partnerHook"]>) => void;
  patchTrust: (next: Partial<HomeAdminContent["trust"]>) => void;
  patchProcess: (next: Partial<HomeAdminContent["process"]>) => void;
  patchImages: (next: Partial<HomeAdminContent["images"]>) => void;
  patchCta: (next: Partial<HomeAdminContent["cta"]>) => void;
  localizedFieldProps: LocalizedFieldProps;
  t: T;
  validationIssues: string[];
}) {
  const heroIssues = countIssues(validationIssues, [".hero."]);
  const statsIssues = countIssues(validationIssues, [".stats."]);
  const partnerIssues = countIssues(validationIssues, [".partnerHook."]);
  const trustIssues = countIssues(validationIssues, [".trust.", ".pillars"]);
  const processIssues = countIssues(validationIssues, [".process.", ".images.", ".cta."]);

  return (
    <>
      <CmsPanel title={t("heroSection")} defaultOpen issueCount={heroIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={form.hero.kicker}
          onChange={(v) => patchHero({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={form.hero.title}
          onChange={(v) => patchHero({ title: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("subtitle")}
          value={form.hero.subtitle}
          onChange={(v) => patchHero({ subtitle: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("primaryCta")}
          value={form.hero.primaryCta}
          onChange={(v) => patchHero({ primaryCta: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("secondaryCta")}
          value={form.hero.secondaryCta}
          onChange={(v) => patchHero({ secondaryCta: v })}
        />
        <div>
          <Label>{t("heroImageUrl")}</Label>
          <Input
            className="mt-1.5"
            placeholder="https://..."
            value={form.hero.imageUrl}
            onChange={(e) => patchHero({ imageUrl: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("defaultHeroImageHint")}</p>
        </div>
        <details className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            {t("imageDetails")}
          </summary>
          <div className="mt-3 space-y-2">
            <LocalizedTextField
              {...localizedFieldProps}
              label={t("heroImageAlt")}
              value={form.hero.imageAlt}
              onChange={(v) => patchHero({ imageAlt: v })}
            />
            <p className="text-xs text-muted-foreground">{t("imageDetailsHint")}</p>
          </div>
        </details>
      </CmsPanel>

      <CmsPanel title={t("heroStats")} issueCount={statsIssues}>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>{t("masksValue")}</Label>
            <Input
              className="mt-1.5"
              value={form.stats.masksValue}
              onChange={(e) => patchStats({ masksValue: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("countriesValue")}</Label>
            <Input
              className="mt-1.5"
              value={form.stats.countriesValue}
              onChange={(e) => patchStats({ countriesValue: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("vietnamValue")}</Label>
            <Input
              className="mt-1.5"
              value={form.stats.vietnamValue}
              onChange={(e) => patchStats({ vietnamValue: e.target.value })}
            />
          </div>
        </div>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("masksLabel")}
          value={form.stats.masksLabel}
          onChange={(v) => patchStats({ masksLabel: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("countriesLabel")}
          value={form.stats.countriesLabel}
          onChange={(v) => patchStats({ countriesLabel: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("vietnamLabel")}
          value={form.stats.vietnamLabel}
          onChange={(v) => patchStats({ vietnamLabel: v })}
        />
      </CmsPanel>

      <CmsPanel title={t("partnerHook")} issueCount={partnerIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={form.partnerHook.kicker}
          onChange={(v) => patchPartner({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={form.partnerHook.title}
          onChange={(v) => patchPartner({ title: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("highlight")}
          value={form.partnerHook.highlight}
          onChange={(v) => patchPartner({ highlight: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("body")}
          value={form.partnerHook.body}
          onChange={(v) => patchPartner({ body: v })}
          multiline
        />
      </CmsPanel>

      <CmsPanel title={t("trustPillars")} issueCount={trustIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("trustKicker")}
          value={form.trust.kicker}
          onChange={(v) => patchTrust({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("trustTitle")}
          value={form.trust.title}
          onChange={(v) => patchTrust({ title: v })}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {form.pillars.map((pillar, i) => (
            <div key={pillar.num} className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="grid grid-cols-[70px_1fr] gap-2">
                <div>
                  <Label>{t("numberLabel")}</Label>
                  <Input
                    className="mt-1.5"
                    value={pillar.num}
                    onChange={(e) => {
                      const xs = [...form.pillars];
                      xs[i] = { ...pillar, num: e.target.value };
                      patch({ pillars: xs });
                    }}
                  />
                </div>
                <LocalizedTextField
                  {...localizedFieldProps}
                  label={t("smallLabel")}
                  value={pillar.eng}
                  onChange={(v) => {
                    const xs = [...form.pillars];
                    xs[i] = { ...pillar, eng: v };
                    patch({ pillars: xs });
                  }}
                />
              </div>
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("title")}
                value={pillar.title}
                onChange={(v) => {
                  const xs = [...form.pillars];
                  xs[i] = { ...pillar, title: v };
                  patch({ pillars: xs });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("text")}
                value={pillar.text}
                onChange={(v) => {
                  const xs = [...form.pillars];
                  xs[i] = { ...pillar, text: v };
                  patch({ pillars: xs });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("processImagesCta")} issueCount={processIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("processKicker")}
          value={form.process.kicker}
          onChange={(v) => patchProcess({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("processTitle")}
          value={form.process.title}
          onChange={(v) => patchProcess({ title: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("processBody")}
          value={form.process.body}
          onChange={(v) => patchProcess({ body: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("imageKicker")}
          value={form.images.kicker}
          onChange={(v) => patchImages({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("imageTitle")}
          value={form.images.title}
          onChange={(v) => patchImages({ title: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("imageBody")}
          value={form.images.body}
          onChange={(v) => patchImages({ body: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("imageCta")}
          value={form.images.cta}
          onChange={(v) => patchImages({ cta: v })}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 rounded-xl border border-border/60 p-4">
              <h4 className="font-semibold">
                {t("imageSlot")} {index + 1}
              </h4>
              <div>
                <Label>{t("imageUrl")}</Label>
                <Input
                  className="mt-1.5"
                  placeholder="https://..."
                  value={form.images.urls[index] || ""}
                  onChange={(e) => {
                    const urls = [...form.images.urls];
                    urls[index] = e.target.value;
                    patchImages({ urls });
                  }}
                />
              </div>
              <div>
                <Label>{t("labelVi")}</Label>
                <Input
                  className="mt-1.5"
                  value={form.images.labels.vi[index] || ""}
                  onChange={(e) => {
                    const labels = {
                      vi: [...form.images.labels.vi],
                      en: [...form.images.labels.en],
                    };
                    labels.vi[index] = e.target.value;
                    patchImages({ labels });
                  }}
                />
              </div>
              <div>
                <Label>{t("labelEn")}</Label>
                <Input
                  className="mt-1.5"
                  value={form.images.labels.en[index] || ""}
                  onChange={(e) => {
                    const labels = {
                      vi: [...form.images.labels.vi],
                      en: [...form.images.labels.en],
                    };
                    labels.en[index] = e.target.value;
                    patchImages({ labels });
                  }}
                />
              </div>
              <details className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  {t("imageDetails")}
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>{t("altVi")}</Label>
                    <Input
                      className="mt-1.5"
                      value={form.images.alts.vi[index] || ""}
                      onChange={(e) => {
                        const alts = {
                          vi: [...form.images.alts.vi],
                          en: [...form.images.alts.en],
                        };
                        alts.vi[index] = e.target.value;
                        patchImages({ alts });
                      }}
                    />
                  </div>
                  <div>
                    <Label>{t("altEn")}</Label>
                    <Input
                      className="mt-1.5"
                      value={form.images.alts.en[index] || ""}
                      onChange={(e) => {
                        const alts = {
                          vi: [...form.images.alts.vi],
                          en: [...form.images.alts.en],
                        };
                        alts.en[index] = e.target.value;
                        patchImages({ alts });
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("imageDetailsHint")}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("ctaKicker")}
          value={form.cta.kicker}
          onChange={(v) => patchCta({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("ctaTitle")}
          value={form.cta.title}
          onChange={(v) => patchCta({ title: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("ctaHighlight")}
          value={form.cta.highlight}
          onChange={(v) => patchCta({ highlight: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("ctaBody")}
          value={form.cta.body}
          onChange={(v) => patchCta({ body: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("ctaButton")}
          value={form.cta.button}
          onChange={(v) => patchCta({ button: v })}
        />
      </CmsPanel>
    </>
  );
}
