import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import gippyB2BHero from "@/assets/gippy-b2b-hero.png";
import gippyBrandHero from "@/assets/gippy-brand-hero.png";
import gippyContactHero from "@/assets/gippy-contact-hero.png";
import gippyEventHero from "@/assets/gippy-event-hero.png";
import gippyAiHero from "@/assets/gippy-ai-hero.png";
import gippyProductsHero from "@/assets/gippy-products-hero.png";
import { type ADMIN_I18N, type AdminLang, tx } from "@/components/admin/admin-i18n";
import {
  type CmsContentLang,
  CmsPanel,
  LocalizedTextField,
} from "@/components/admin/cms-form-fields";
import { CmsFormShell } from "@/components/admin/cms-form-shell";
import { CmsMediaField } from "@/components/admin/cms-media-field";
import { HomeContentSections } from "@/components/admin/home-content-sections";
import { HeroBackgroundEditor } from "@/components/admin/hero-background-editor";
import { PageSectionEditor } from "@/components/admin/page-section-editor";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { DEFAULT_HOME_CONTENT, type HomeAdminContent, mergeHomeContent } from "@/lib/home-content";
import { jsonValuesEqual } from "@/lib/json-value-equality";
import { invalidatePublicDataCache } from "@/lib/public-data-timeout";
import {
  DEFAULT_PAGE_CONTENT,
  mergePageContent,
  PAGE_CONTENT_OPTIONS,
  type PageContentKey,
  type PageEditableContent,
  pageContentStorageKey,
} from "@/lib/page-content";

type HomeContentInsert = Database["public"]["Tables"]["home_content"]["Insert"];
type ContentLang = CmsContentLang;
type ContentRevision = Database["public"]["Tables"]["home_content_revisions"]["Row"];

const CONTENT_LANG_OPTIONS: {
  value: ContentLang;
  labelKey: keyof typeof ADMIN_I18N;
}[] = [
  { value: "vi", labelKey: "vietnameseContent" },
  { value: "en", labelKey: "englishContent" },
];

const PAGE_PREVIEW_PATHS: Record<"home" | PageContentKey, string> = {
  home: "/",
  brand: "/brand",
  products: "/products",
  "gippy-ai": "/gippy-ai",
  events: "/events",
  b2b: "/b2b",
  contact: "/contact",
};

const PAGE_DEFAULT_HERO_IMAGES: Record<PageContentKey, string> = {
  brand: gippyBrandHero,
  products: gippyProductsHero,
  "gippy-ai": gippyAiHero,
  events: gippyEventHero,
  b2b: gippyB2BHero,
  contact: gippyContactHero,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isLocalizedContainer(value: unknown): value is Record<ContentLang, unknown> {
  return isRecord(value) && ("vi" in value || "en" in value);
}

function mergeActiveLocaleValue(base: unknown, draft: unknown, lang: ContentLang): unknown {
  if (isLocalizedContainer(draft)) {
    const baseRecord = isRecord(base) ? base : {};
    const inactiveLang: ContentLang = lang === "vi" ? "en" : "vi";
    return {
      ...draft,
      ...baseRecord,
      [lang]: draft[lang],
      [inactiveLang]: baseRecord[inactiveLang] ?? draft[inactiveLang],
    };
  }

  if (Array.isArray(draft)) {
    const baseArray = Array.isArray(base) ? base : [];
    const length = Math.max(baseArray.length, draft.length);
    return Array.from({ length }, (_, index) => {
      if (index >= draft.length) return baseArray[index];
      return mergeActiveLocaleValue(baseArray[index], draft[index], lang);
    });
  }

  if (isRecord(draft)) {
    const baseRecord = isRecord(base) ? base : {};
    const keys = new Set([...Object.keys(baseRecord), ...Object.keys(draft)]);
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] =
        key in draft ? mergeActiveLocaleValue(baseRecord[key], draft[key], lang) : baseRecord[key];
    }
    return out;
  }

  return draft;
}

function hasText(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => hasText(item));
  return false;
}

const OPTIONAL_LOCALIZED_FIELD_SUFFIXES = [
  ".hero.imageAlt",
  ".heroImage.alt",
  ".image.alt",
  ".images.alts",
];

function isOptionalLocalizedField(path: string): boolean {
  return OPTIONAL_LOCALIZED_FIELD_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

function collectLocaleIssues(value: unknown, lang: ContentLang, path = "Content"): string[] {
  if (isOptionalLocalizedField(path)) return [];

  if (isLocalizedContainer(value)) {
    const inactiveLang: ContentLang = lang === "vi" ? "en" : "vi";
    const activeValue = value[lang];
    const inactiveValue = value[inactiveLang];

    if (Array.isArray(activeValue) || Array.isArray(inactiveValue)) {
      const activeItems = Array.isArray(activeValue) ? activeValue : [];
      const inactiveItems = Array.isArray(inactiveValue) ? inactiveValue : [];
      return inactiveItems.flatMap((item, index) =>
        hasText(item) && !hasText(activeItems[index]) ? [`${path} ${index + 1}`] : [],
      );
    }

    return hasText(inactiveValue) && !hasText(activeValue) ? [path] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectLocaleIssues(item, lang, `${path} ${index + 1}`));
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectLocaleIssues(entry, lang, `${path}.${key}`),
    );
  }

  return [];
}

function collectMissingRequiredLocalized(
  fields: Array<[path: string, value: { vi?: unknown; en?: unknown }]>,
  lang: ContentLang,
): string[] {
  return fields.flatMap(([path, value]) => (hasText(value[lang]) ? [] : [path]));
}

function collectRequiredHomeIssues(form: HomeAdminContent, lang: ContentLang, path: string) {
  return collectMissingRequiredLocalized(
    [
      [`${path}.hero.title`, form.hero.title],
      [`${path}.hero.subtitle`, form.hero.subtitle],
      [`${path}.hero.primaryCta`, form.hero.primaryCta],
      [`${path}.hero.secondaryCta`, form.hero.secondaryCta],
    ],
    lang,
  );
}

function collectRequiredPageIssues(form: PageEditableContent, lang: ContentLang, path: string) {
  return collectMissingRequiredLocalized(
    [
      [`${path}.title`, form.title],
      [`${path}.highlight`, form.highlight],
      [`${path}.description`, form.description],
      [`${path}.primaryCta`, form.primaryCta],
      [`${path}.secondaryCta`, form.secondaryCta],
    ],
    lang,
  );
}

function PageTextEditor({
  form,
  onChange,
  pageKey,
  contentLang,
  compareMode,
  t,
  validationIssues,
  onRestoreSavedHero,
}: {
  form: PageEditableContent;
  onChange: (next: PageEditableContent) => void;
  pageKey: PageContentKey;
  contentLang: ContentLang;
  compareMode: boolean;
  t: (key: keyof typeof ADMIN_I18N) => string;
  validationIssues: string[];
  onRestoreSavedHero: () => void;
}) {
  const patch = (next: Partial<PageEditableContent>) => onChange({ ...form, ...next });
  const localizedFieldProps = { activeLang: contentLang, compareMode };
  const contentIssues = validationIssues.filter(
    (issue) =>
      issue.includes(".title") ||
      issue.includes(".highlight") ||
      issue.includes(".description") ||
      issue.includes(".primaryCta") ||
      issue.includes(".secondaryCta"),
  ).length;

  return (
    <div className="space-y-4">
      <CmsPanel title={t("content")} defaultOpen issueCount={contentIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={form.kicker}
          onChange={(v) => patch({ kicker: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={form.title}
          onChange={(v) => patch({ title: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("highlight")}
          value={form.highlight}
          onChange={(v) => patch({ highlight: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("description")}
          value={form.description}
          onChange={(v) => patch({ description: v })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("primaryCta")}
          value={form.primaryCta}
          onChange={(v) => patch({ primaryCta: v })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("secondaryCta")}
          value={form.secondaryCta}
          onChange={(v) => patch({ secondaryCta: v })}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            {t("restoreSavedHeroHint")}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onRestoreSavedHero}>
            <RotateCcw className="h-4 w-4" />
            {t("restoreSavedHero")}
          </Button>
        </div>
        <CmsMediaField
          label={t("heroImageUrl")}
          value={form.heroImage}
          onChange={(heroImage) => patch({ heroImage })}
          uploadPrefix={`page-content/hero/${pageKey}`}
          contentLang={contentLang}
          compareMode={compareMode}
          imageAltLabel={t("heroImageAlt")}
          imageDetailsLabel={t("imageDetails")}
          imageDetailsHint={t("imageDetailsHint")}
          uploadHint={t("pageHeroImageHint")}
          clearLabel={t("clearImage")}
          chooseLabel={t("chooseHeroImage")}
          uploadingLabel={t("uploadingImage")}
          fallbackPreviewUrl={PAGE_DEFAULT_HERO_IMAGES[pageKey]}
        />
        <HeroBackgroundEditor
          value={form.heroBackground}
          onChange={(heroBackground) => patch({ heroBackground })}
          pageKey={pageKey}
        />
      </CmsPanel>
      <PageSectionEditor
        pageKey={pageKey}
        sections={form.sections}
        contentLang={contentLang}
        compareMode={compareMode}
        onChange={(sections) => patch({ sections })}
        validationIssues={validationIssues}
        t={(key) => t(key as keyof typeof ADMIN_I18N)}
      />
    </div>
  );
}

export default function HomeEditorTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [selectedPage, setSelectedPage] = useState<"home" | PageContentKey>("home");
  const [contentLang, setContentLang] = useState<ContentLang>("vi");
  const [compareMode, setCompareMode] = useState(false);
  const [form, setForm] = useState<HomeAdminContent>(DEFAULT_HOME_CONTENT);
  const [pageForm, setPageForm] = useState<PageEditableContent>(DEFAULT_PAGE_CONTENT.brand);
  const [savedPageForm, setSavedPageForm] = useState<PageEditableContent>(
    DEFAULT_PAGE_CONTENT.brand,
  );
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<ContentRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selectedPageLabel =
    selectedPage === "home"
      ? "HOME"
      : PAGE_CONTENT_OPTIONS.find((page) => page.key === selectedPage)?.label || selectedPage;
  const selectedContentLangLabel = t(
    CONTENT_LANG_OPTIONS.find((option) => option.value === contentLang)?.labelKey ||
      "vietnameseContent",
  );
  const activeDraft = selectedPage === "home" ? form : pageForm;
  const requiredIssues =
    selectedPage === "home"
      ? collectRequiredHomeIssues(form, contentLang, selectedPageLabel)
      : collectRequiredPageIssues(pageForm, contentLang, selectedPageLabel);
  const validationIssues = Array.from(
    new Set([
      ...requiredIssues,
      ...collectLocaleIssues(activeDraft, contentLang, selectedPageLabel),
    ]),
  );

  const load = useCallback(async () => {
    setLoading(true);
    if (selectedPage === "home") {
      const { data, error } = await supabase
        .from("home_content")
        .select("value,updated_at")
        .eq("key", "home")
        .maybeSingle();
      if (error) toast.error(error.message);
      setForm(mergeHomeContent(data?.value));
      setLoadedUpdatedAt(data?.updated_at ?? null);
    } else {
      const { data, error } = await supabase
        .from("home_content")
        .select("value,updated_at")
        .eq("key", pageContentStorageKey(selectedPage))
        .maybeSingle();
      if (error) toast.error(error.message);
      const nextPageForm = mergePageContent(selectedPage, data?.value);
      setPageForm(nextPageForm);
      setSavedPageForm(nextPageForm);
      setLoadedUpdatedAt(data?.updated_at ?? null);
    }
    const revisionKey = selectedPage === "home" ? "home" : pageContentStorageKey(selectedPage);
    const { data: revisionRows } = await supabase
      .from("home_content_revisions")
      .select("*")
      .eq("content_key", revisionKey)
      .order("created_at", { ascending: false })
      .limit(10);
    setRevisions(revisionRows ?? []);
    setLoading(false);
  }, [selectedPage]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = (next: Partial<HomeAdminContent>) => setForm((prev) => ({ ...prev, ...next }));
  const patchHero = (next: Partial<HomeAdminContent["hero"]>) =>
    patch({ hero: { ...form.hero, ...next } });
  const patchStats = (next: Partial<HomeAdminContent["stats"]>) =>
    patch({ stats: { ...form.stats, ...next } });
  const patchPartner = (next: Partial<HomeAdminContent["partnerHook"]>) =>
    patch({ partnerHook: { ...form.partnerHook, ...next } });
  const patchTrust = (next: Partial<HomeAdminContent["trust"]>) =>
    patch({ trust: { ...form.trust, ...next } });
  const patchProcess = (next: Partial<HomeAdminContent["process"]>) =>
    patch({ process: { ...form.process, ...next } });
  const patchImages = (next: Partial<HomeAdminContent["images"]>) =>
    patch({ images: { ...form.images, ...next } });
  const patchCta = (next: Partial<HomeAdminContent["cta"]>) =>
    patch({ cta: { ...form.cta, ...next } });
  const localizedFieldProps = { activeLang: contentLang, compareMode };

  const openPreview = (langToPreview: ContentLang) => {
    const path = PAGE_PREVIEW_PATHS[selectedPage];
    window.open(`${path}?lang=${langToPreview}`, "_blank", "noopener,noreferrer");
  };

  const save = async () => {
    if (validationIssues.length > 0) {
      toast.error(
        `Publish checklist has ${validationIssues.length} missing ${selectedContentLangLabel} field${
          validationIssues.length === 1 ? "" : "s"
        }.`,
      );
      return;
    }

    setSaving(true);
    const key = selectedPage === "home" ? "home" : pageContentStorageKey(selectedPage);
    const { data, error: loadError } = await supabase
      .from("home_content")
      .select("value,updated_at")
      .eq("key", key)
      .maybeSingle();
    if (loadError) {
      setSaving(false);
      return toast.error(loadError.message);
    }

    const draft = selectedPage === "home" ? form : pageForm;
    const mergedValue = mergeActiveLocaleValue(data?.value, draft, contentLang) as Json;
    const row =
      selectedPage === "home"
        ? ({ key, value: mergedValue } satisfies HomeContentInsert)
        : ({
            key,
            value: mergedValue,
          } satisfies HomeContentInsert);
    const { data: savedRow, error } = await supabase.rpc("save_home_content_version", {
      p_key: row.key,
      p_value: mergedValue,
      p_expected_updated_at: loadedUpdatedAt ?? undefined,
    });
    setSaving(false);
    if (error) {
      if (error.code === "40001") {
        toast.error(
          "This content changed in another editor. Your draft was kept; review before reloading.",
        );
        return;
      }
      return toast.error(error.message);
    }
    if (!savedRow || !jsonValuesEqual(savedRow.value, mergedValue)) {
      return toast.error("The save could not be verified. Your draft is still open; please retry.");
    }
    setLoadedUpdatedAt(savedRow.updated_at);
    if (selectedPage === "home") setForm(mergeHomeContent(mergedValue));
    else {
      const nextPageForm = mergePageContent(selectedPage, mergedValue);
      setPageForm(nextPageForm);
      setSavedPageForm(nextPageForm);
      invalidatePublicDataCache(`page-content:${selectedPage}`);
    }
    if (selectedPage === "home") invalidatePublicDataCache("home-content:home");
    toast.success(t("saved"));
  };

  const resetDefaults = () => {
    const resetConfirmMessage = `${t("resetHomeConfirm")}\n\n${t(
      "resetScopeHint",
    )}: ${selectedPageLabel} / ${selectedContentLangLabel}`;
    if (!confirm(resetConfirmMessage)) return;
    if (selectedPage === "home") {
      setForm(mergeHomeContent(mergeActiveLocaleValue(form, DEFAULT_HOME_CONTENT, contentLang)));
    } else {
      setPageForm(
        mergePageContent(
          selectedPage,
          mergeActiveLocaleValue(pageForm, DEFAULT_PAGE_CONTENT[selectedPage], contentLang),
        ),
      );
    }
  };

  const restoreRevision = (revision: ContentRevision) => {
    if (!confirm("Restore this saved version into the editor? You must save to publish it."))
      return;
    if (selectedPage === "home") setForm(mergeHomeContent(revision.value));
    else setPageForm(mergePageContent(selectedPage, revision.value));
    toast.success("Revision loaded into the editor. Save it to publish.");
  };

  if (loading)
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
        {t("loadingHomeEditor")}
      </div>
    );

  return (
    <div className="space-y-5">
      <CmsFormShell
        title={t("homeEditor")}
        description={t("homeEditorDesc")}
        pageLabel={t("pageToEdit")}
        languageLabel={t("contentLanguage")}
        pageOptions={PAGE_CONTENT_OPTIONS}
        selectedPage={selectedPage}
        onSelectedPageChange={setSelectedPage}
        languageOptions={CONTENT_LANG_OPTIONS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        selectedLanguage={contentLang}
        onSelectedLanguageChange={setContentLang}
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
        compareLabel={t("compareTranslations")}
        editingScopeLabel={t("editingScope")}
        selectedPageLabel={selectedPageLabel}
        selectedLanguageLabel={selectedContentLangLabel}
        previewVietnameseLabel={t("previewVietnamese")}
        previewEnglishLabel={t("previewEnglish")}
        onPreview={openPreview}
        onReload={load}
        onReset={resetDefaults}
        onSave={save}
        saving={saving}
        reloadLabel={t("reload")}
        resetLabel={t("reset")}
        saveLabel={t("saveHome")}
        savingLabel={t("saving")}
        saveScopeLabel={t("saveScopeHint")}
        resetScopeLabel={t("resetScopeHint")}
        validationIssues={validationIssues}
      />

      {revisions.length > 0 ? (
        <details className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <summary className="cursor-pointer text-sm font-semibold">Recent saved versions</summary>
          <div className="mt-3 space-y-2">
            {revisions.map((revision) => (
              <div
                key={revision.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
              >
                <span className="text-xs text-muted-foreground">
                  {new Date(revision.created_at).toLocaleString()}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => restoreRevision(revision)}
                >
                  Load version
                </Button>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {selectedPage !== "home" ? (
        <PageTextEditor
          form={pageForm}
          onChange={setPageForm}
          pageKey={selectedPage}
          contentLang={contentLang}
          compareMode={compareMode}
          validationIssues={validationIssues}
          t={t}
          onRestoreSavedHero={() => {
            setPageForm((current) => ({
              ...current,
              heroImage: savedPageForm.heroImage,
              heroBackground: savedPageForm.heroBackground,
            }));
            toast.success(t("restoredSavedHero"));
          }}
        />
      ) : (
        <HomeContentSections
          form={form}
          patch={patch}
          patchHero={patchHero}
          patchStats={patchStats}
          patchPartner={patchPartner}
          patchTrust={patchTrust}
          patchProcess={patchProcess}
          patchImages={patchImages}
          patchCta={patchCta}
          localizedFieldProps={localizedFieldProps}
          validationIssues={validationIssues}
          t={t}
        />
      )}
    </div>
  );
}
