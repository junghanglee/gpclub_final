import { RefreshCw } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type AdminLang, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  DEFAULT_HOME_CONTENT,
  type HomeAdminContent,
  type LocalizedText,
  mergeHomeContent,
} from "@/lib/home-content";
import {
  DEFAULT_PAGE_CONTENT,
  mergePageContent,
  PAGE_CONTENT_OPTIONS,
  type PageContentKey,
  type PageEditableContent,
  pageContentStorageKey,
} from "@/lib/page-content";

type HomeContentInsert = Database["public"]["Tables"]["home_content"]["Insert"];

function TextPair({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
}) {
  const Comp = multiline ? Textarea : Input;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <Label>{label} VI</Label>
        <Comp
          className="mt-1.5"
          value={value.vi}
          rows={multiline ? 3 : undefined}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, vi: e.target.value })
          }
        />
      </div>
      <div>
        <Label>{label} EN</Label>
        <Comp
          className="mt-1.5"
          value={value.en}
          rows={multiline ? 3 : undefined}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, en: e.target.value })
          }
        />
      </div>
    </div>
  );
}

function PageTextEditor({
  form,
  onChange,
  t,
}: {
  form: PageEditableContent;
  onChange: (next: PageEditableContent) => void;
  t: (key: keyof typeof ADMIN_I18N) => string;
}) {
  const patch = (next: Partial<PageEditableContent>) => onChange({ ...form, ...next });
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
      <h3 className="font-display text-xl">{t("content")}</h3>
      <TextPair label={t("kicker")} value={form.kicker} onChange={(v) => patch({ kicker: v })} />
      <TextPair
        label={t("title")}
        value={form.title}
        onChange={(v) => patch({ title: v })}
        multiline
      />
      <TextPair
        label={t("highlight")}
        value={form.highlight}
        onChange={(v) => patch({ highlight: v })}
        multiline
      />
      <TextPair
        label={t("description")}
        value={form.description}
        onChange={(v) => patch({ description: v })}
        multiline
      />
      <TextPair
        label={t("primaryCta")}
        value={form.primaryCta}
        onChange={(v) => patch({ primaryCta: v })}
      />
      <TextPair
        label={t("secondaryCta")}
        value={form.secondaryCta}
        onChange={(v) => patch({ secondaryCta: v })}
      />
    </section>
  );
}

export default function HomeEditorTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [selectedPage, setSelectedPage] = useState<"home" | PageContentKey>("home");
  const [form, setForm] = useState<HomeAdminContent>(DEFAULT_HOME_CONTENT);
  const [pageForm, setPageForm] = useState<PageEditableContent>(DEFAULT_PAGE_CONTENT.brand);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    if (selectedPage === "home") {
      const { data, error } = await supabase
        .from("home_content")
        .select("value")
        .eq("key", "home")
        .maybeSingle();
      if (error) toast.error(error.message);
      setForm(mergeHomeContent(data?.value));
    } else {
      const { data, error } = await supabase
        .from("home_content")
        .select("value")
        .eq("key", pageContentStorageKey(selectedPage))
        .maybeSingle();
      if (error) toast.error(error.message);
      setPageForm(mergePageContent(selectedPage, data?.value));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [selectedPage]);

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

  const save = async () => {
    setSaving(true);
    const row =
      selectedPage === "home"
        ? ({ key: "home", value: form as Json } satisfies HomeContentInsert)
        : ({
            key: pageContentStorageKey(selectedPage),
            value: pageForm as Json,
          } satisfies HomeContentInsert);
    const { error } = await supabase.from("home_content").upsert(row);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
  };

  const resetDefaults = () => {
    if (!confirm(t("resetHomeConfirm"))) return;
    if (selectedPage === "home") setForm(DEFAULT_HOME_CONTENT);
    else setPageForm(DEFAULT_PAGE_CONTENT[selectedPage]);
  };

  if (loading)
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
        {t("loadingHomeEditor")}
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">{t("homeEditor")}</h2>
          <p className="text-sm text-muted-foreground">{t("homeEditorDesc")}</p>
          <div className="mt-4 max-w-xs">
            <Label>{t("pageToEdit")}</Label>
            <Select
              value={selectedPage}
              onValueChange={(v) => setSelectedPage(v as "home" | PageContentKey)}
            >
              <SelectTrigger className="mt-1.5 rounded-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_CONTENT_OPTIONS.map((page) => (
                  <SelectItem key={page.key} value={page.key}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("reload")}
          </Button>
          <Button variant="outline" onClick={resetDefaults} className="rounded-full">
            {t("reset")}
          </Button>
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving ? t("saving") : t("saveHome")}
          </Button>
        </div>
      </div>

      {selectedPage !== "home" ? (
        <PageTextEditor form={pageForm} onChange={setPageForm} t={t} />
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("heroSection")}</h3>
            <TextPair
              label={t("kicker")}
              value={form.hero.kicker}
              onChange={(v) => patchHero({ kicker: v })}
            />
            <TextPair
              label={t("title")}
              value={form.hero.title}
              onChange={(v) => patchHero({ title: v })}
              multiline
            />
            <TextPair
              label={t("subtitle")}
              value={form.hero.subtitle}
              onChange={(v) => patchHero({ subtitle: v })}
              multiline
            />
            <TextPair
              label={t("primaryCta")}
              value={form.hero.primaryCta}
              onChange={(v) => patchHero({ primaryCta: v })}
            />
            <TextPair
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
            <TextPair
              label={t("heroImageAlt")}
              value={form.hero.imageAlt}
              onChange={(v) => patchHero({ imageAlt: v })}
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("heroStats")}</h3>
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
            <TextPair
              label={t("masksLabel")}
              value={form.stats.masksLabel}
              onChange={(v) => patchStats({ masksLabel: v })}
            />
            <TextPair
              label={t("countriesLabel")}
              value={form.stats.countriesLabel}
              onChange={(v) => patchStats({ countriesLabel: v })}
            />
            <TextPair
              label={t("vietnamLabel")}
              value={form.stats.vietnamLabel}
              onChange={(v) => patchStats({ vietnamLabel: v })}
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("partnerHook")}</h3>
            <TextPair
              label={t("kicker")}
              value={form.partnerHook.kicker}
              onChange={(v) => patchPartner({ kicker: v })}
            />
            <TextPair
              label={t("title")}
              value={form.partnerHook.title}
              onChange={(v) => patchPartner({ title: v })}
              multiline
            />
            <TextPair
              label={t("highlight")}
              value={form.partnerHook.highlight}
              onChange={(v) => patchPartner({ highlight: v })}
            />
            <TextPair
              label={t("body")}
              value={form.partnerHook.body}
              onChange={(v) => patchPartner({ body: v })}
              multiline
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("trustPillars")}</h3>
            <TextPair
              label={t("trustKicker")}
              value={form.trust.kicker}
              onChange={(v) => patchTrust({ kicker: v })}
            />
            <TextPair
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
                    <TextPair
                      label={t("smallLabel")}
                      value={pillar.eng}
                      onChange={(v) => {
                        const xs = [...form.pillars];
                        xs[i] = { ...pillar, eng: v };
                        patch({ pillars: xs });
                      }}
                    />
                  </div>
                  <TextPair
                    label={t("title")}
                    value={pillar.title}
                    onChange={(v) => {
                      const xs = [...form.pillars];
                      xs[i] = { ...pillar, title: v };
                      patch({ pillars: xs });
                    }}
                  />
                  <TextPair
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
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("processImagesCta")}</h3>
            <TextPair
              label={t("processKicker")}
              value={form.process.kicker}
              onChange={(v) => patchProcess({ kicker: v })}
            />
            <TextPair
              label={t("processTitle")}
              value={form.process.title}
              onChange={(v) => patchProcess({ title: v })}
              multiline
            />
            <TextPair
              label={t("processBody")}
              value={form.process.body}
              onChange={(v) => patchProcess({ body: v })}
              multiline
            />
            <TextPair
              label={t("imageKicker")}
              value={form.images.kicker}
              onChange={(v) => patchImages({ kicker: v })}
            />
            <TextPair
              label={t("imageTitle")}
              value={form.images.title}
              onChange={(v) => patchImages({ title: v })}
              multiline
            />
            <TextPair
              label={t("imageBody")}
              value={form.images.body}
              onChange={(v) => patchImages({ body: v })}
              multiline
            />
            <TextPair
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
                </div>
              ))}
            </div>
            <TextPair
              label={t("ctaKicker")}
              value={form.cta.kicker}
              onChange={(v) => patchCta({ kicker: v })}
            />
            <TextPair
              label={t("ctaTitle")}
              value={form.cta.title}
              onChange={(v) => patchCta({ title: v })}
              multiline
            />
            <TextPair
              label={t("ctaHighlight")}
              value={form.cta.highlight}
              onChange={(v) => patchCta({ highlight: v })}
              multiline
            />
            <TextPair
              label={t("ctaBody")}
              value={form.cta.body}
              onChange={(v) => patchCta({ body: v })}
              multiline
            />
            <TextPair
              label={t("ctaButton")}
              value={form.cta.button}
              onChange={(v) => patchCta({ button: v })}
            />
          </section>
        </>
      )}
    </div>
  );
}
