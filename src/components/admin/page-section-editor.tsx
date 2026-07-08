import {
  type CmsContentLang,
  CmsPanel,
  LocalizedTextField,
  PlainTextField,
} from "@/components/admin/cms-form-fields";
import { CmsMediaField } from "@/components/admin/cms-media-field";
import type {
  B2BSectionContent,
  BrandSectionContent,
  GippyAiSectionContent,
  PageContentKey,
  PageImageAsset,
  PageSections,
} from "@/lib/page-content";

type T = (key: string) => string;
type ContentLang = CmsContentLang;

function countIssues(issues: string[], needles: string[]) {
  return issues.filter((issue) => needles.some((needle) => issue.includes(needle))).length;
}

const PAGE_LABELS: Record<PageContentKey, string> = {
  brand: "BRAND",
  products: "Products",
  "gippy-ai": "GIPPY AI",
  events: "EVENT",
  b2b: "B2B",
  contact: "CONTACT",
};

function ImageAssetField({
  label,
  value,
  onChange,
  uploadPrefix,
  contentLang,
  compareMode,
  t,
}: {
  label: string;
  value: PageImageAsset;
  onChange: (value: PageImageAsset) => void;
  uploadPrefix: string;
  contentLang: ContentLang;
  compareMode: boolean;
  t: T;
}) {
  return (
    <CmsMediaField
      label={label}
      value={value}
      onChange={onChange}
      uploadPrefix={uploadPrefix}
      contentLang={contentLang}
      compareMode={compareMode}
      imageAltLabel={t("imageAlt")}
      imageDetailsLabel={t("imageDetails")}
      imageDetailsHint={t("imageDetailsHint")}
      uploadHint={t("sectionImageHint")}
      clearLabel={t("clearImage")}
      chooseLabel={t("chooseSectionImage")}
      uploadingLabel={t("uploadingImage")}
    />
  );
}

function SectionPolicyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
      {children}
    </div>
  );
}

function BrandSectionsEditor({
  value,
  onChange,
  contentLang,
  compareMode,
  validationIssues,
  t,
}: {
  value: BrandSectionContent;
  onChange: (value: BrandSectionContent) => void;
  contentLang: ContentLang;
  compareMode: boolean;
  validationIssues: string[];
  t: T;
}) {
  const localizedFieldProps = { activeLang: contentLang, compareMode };
  const positioningIssues = countIssues(validationIssues, [".positioning."]);
  const coreValueIssues = countIssues(validationIssues, [".coreValues"]);
  const brandIssues = countIssues(validationIssues, [".brands"]);
  const advisorIssues = countIssues(validationIssues, [".advisor."]);
  const imageSlotIssues = countIssues(validationIssues, [".imageSlots"]);

  return (
    <div className="space-y-4">
      <SectionPolicyNotice>
        Brand sections use fixed counts from the public page layout. Edit existing text and images
        here; adding or removing cards requires a separate layout change.
      </SectionPolicyNotice>
      <CmsPanel title={t("brandPositioningSection")} defaultOpen issueCount={positioningIssues}>
        <PlainTextField
          label={t("kicker")}
          value={value.positioning.kicker}
          onChange={(kicker) =>
            onChange({
              ...value,
              positioning: { ...value.positioning, kicker },
            })
          }
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.positioning.title}
          onChange={(title) => onChange({ ...value, positioning: { ...value.positioning, title } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("highlight")}
          value={value.positioning.highlight}
          onChange={(highlight) =>
            onChange({
              ...value,
              positioning: { ...value.positioning, highlight },
            })
          }
          multiline
        />
        {value.positioning.body.map((body, index) => (
          <LocalizedTextField
            {...localizedFieldProps}
            key={index}
            label={`${t("body")} ${index + 1}`}
            value={body}
            onChange={(next) => {
              const items = [...value.positioning.body];
              items[index] = next;
              onChange({
                ...value,
                positioning: { ...value.positioning, body: items },
              });
            }}
            multiline
          />
        ))}
      </CmsPanel>

      <CmsPanel title={t("brandCoreValuesSection")} issueCount={coreValueIssues}>
        <div className="grid gap-4 lg:grid-cols-3">
          {value.coreValues.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <PlainTextField
                label={t("label")}
                value={item.label}
                onChange={(label) => {
                  const items = [...value.coreValues];
                  items[index] = { ...item, label };
                  onChange({ ...value, coreValues: items });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("text")}
                value={item.text}
                onChange={(text) => {
                  const items = [...value.coreValues];
                  items[index] = { ...item, text };
                  onChange({ ...value, coreValues: items });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("brandCardsSection")} issueCount={brandIssues}>
        <div className="grid gap-4 lg:grid-cols-2">
          {value.brands.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <PlainTextField
                  label={t("name")}
                  value={item.name}
                  onChange={(name) => {
                    const items = [...value.brands];
                    items[index] = { ...item, name };
                    onChange({ ...value, brands: items });
                  }}
                />
                <PlainTextField
                  label={t("category")}
                  value={item.category}
                  onChange={(category) => {
                    const items = [...value.brands];
                    items[index] = { ...item, category };
                    onChange({ ...value, brands: items });
                  }}
                />
              </div>
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("headline")}
                value={item.headline}
                onChange={(headline) => {
                  const items = [...value.brands];
                  items[index] = { ...item, headline };
                  onChange({ ...value, brands: items });
                }}
                multiline
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("quote")}
                value={item.quote}
                onChange={(quote) => {
                  const items = [...value.brands];
                  items[index] = { ...item, quote };
                  onChange({ ...value, brands: items });
                }}
                multiline
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("body")}
                value={item.body}
                onChange={(body) => {
                  const items = [...value.brands];
                  items[index] = { ...item, body };
                  onChange({ ...value, brands: items });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("brandAdvisorSection")} issueCount={advisorIssues}>
        <PlainTextField
          label={t("kicker")}
          value={value.advisor.kicker}
          onChange={(kicker) => onChange({ ...value, advisor: { ...value.advisor, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.advisor.title}
          onChange={(title) => onChange({ ...value, advisor: { ...value.advisor, title } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("body")}
          value={value.advisor.body}
          onChange={(body) => onChange({ ...value, advisor: { ...value.advisor, body } })}
          multiline
        />
        <ImageAssetField
          label={t("advisorImage")}
          value={value.advisor.image}
          onChange={(image) => onChange({ ...value, advisor: { ...value.advisor, image } })}
          uploadPrefix="page-content/sections/brand/advisor"
          contentLang={contentLang}
          compareMode={compareMode}
          t={t}
        />
      </CmsPanel>

      <CmsPanel title={t("imageSlotsSection")} issueCount={imageSlotIssues}>
        <div className="grid gap-4 lg:grid-cols-3">
          {value.imageSlots.map((slot, index) => (
            <div key={slot.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("imageSlotLabel")}
                value={slot.label}
                onChange={(label) => {
                  const items = [...value.imageSlots];
                  items[index] = { ...slot, label };
                  onChange({ ...value, imageSlots: items });
                }}
              />
              <ImageAssetField
                label={`${t("imageSlot")} ${index + 1}`}
                value={slot.image}
                onChange={(image) => {
                  const items = [...value.imageSlots];
                  items[index] = { ...slot, image };
                  onChange({ ...value, imageSlots: items });
                }}
                uploadPrefix={`page-content/sections/brand/slot-${index + 1}`}
                contentLang={contentLang}
                compareMode={compareMode}
                t={t}
              />
            </div>
          ))}
        </div>
      </CmsPanel>
    </div>
  );
}

function B2BSectionsEditor({
  value,
  onChange,
  contentLang,
  compareMode,
  validationIssues,
  t,
}: {
  value: B2BSectionContent;
  onChange: (value: B2BSectionContent) => void;
  contentLang: ContentLang;
  compareMode: boolean;
  validationIssues: string[];
  t: T;
}) {
  const localizedFieldProps = { activeLang: contentLang, compareMode };
  const whyIssues = countIssues(validationIssues, [".why."]);
  const valueIssues = countIssues(validationIssues, [".values."]);
  const brandIssues = countIssues(validationIssues, [".brand."]);
  const processIssues = countIssues(validationIssues, [".process."]);
  const imageSpaceIssues = countIssues(validationIssues, [".imageSpaces."]);
  const contactIssues = countIssues(validationIssues, [".contact."]);

  return (
    <div className="space-y-4">
      <SectionPolicyNotice>
        B2B sections use fixed counts from the public page layout. Edit existing copy, image spaces,
        and CTAs here; changing the number of cards or steps requires a separate layout change.
      </SectionPolicyNotice>
      <CmsPanel title={t("b2bWhySection")} defaultOpen issueCount={whyIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={value.why.kicker}
          onChange={(kicker) => onChange({ ...value, why: { ...value.why, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.why.title}
          onChange={(title) => onChange({ ...value, why: { ...value.why, title } })}
          multiline
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {value.why.cards.map((card, index) => (
            <div key={card.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <PlainTextField
                label={t("numberLabel")}
                value={card.num}
                onChange={(num) => {
                  const cards = [...value.why.cards];
                  cards[index] = { ...card, num };
                  onChange({ ...value, why: { ...value.why, cards } });
                }}
              />
              <PlainTextField
                label={t("title")}
                value={card.title}
                onChange={(title) => {
                  const cards = [...value.why.cards];
                  cards[index] = { ...card, title };
                  onChange({ ...value, why: { ...value.why, cards } });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("headline")}
                value={card.hook}
                onChange={(hook) => {
                  const cards = [...value.why.cards];
                  cards[index] = { ...card, hook };
                  onChange({ ...value, why: { ...value.why, cards } });
                }}
                multiline
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("body")}
                value={card.copy}
                onChange={(copy) => {
                  const cards = [...value.why.cards];
                  cards[index] = { ...card, copy };
                  onChange({ ...value, why: { ...value.why, cards } });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("b2bValuesSection")} issueCount={valueIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={value.values.kicker}
          onChange={(kicker) => onChange({ ...value, values: { ...value.values, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.values.title}
          onChange={(title) => onChange({ ...value, values: { ...value.values, title } })}
          multiline
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {value.values.cards.map((card, index) => (
            <div key={card.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <PlainTextField
                label={t("numberLabel")}
                value={card.num}
                onChange={(num) => {
                  const cards = [...value.values.cards];
                  cards[index] = { ...card, num };
                  onChange({ ...value, values: { ...value.values, cards } });
                }}
              />
              <PlainTextField
                label={t("smallLabel")}
                value={card.eyebrow}
                onChange={(eyebrow) => {
                  const cards = [...value.values.cards];
                  cards[index] = { ...card, eyebrow };
                  onChange({ ...value, values: { ...value.values, cards } });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("title")}
                value={card.title}
                onChange={(title) => {
                  const cards = [...value.values.cards];
                  cards[index] = { ...card, title };
                  onChange({ ...value, values: { ...value.values, cards } });
                }}
                multiline
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("subtitle")}
                value={card.sub}
                onChange={(sub) => {
                  const cards = [...value.values.cards];
                  cards[index] = { ...card, sub };
                  onChange({ ...value, values: { ...value.values, cards } });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("body")}
                value={card.copy}
                onChange={(copy) => {
                  const cards = [...value.values.cards];
                  cards[index] = { ...card, copy };
                  onChange({ ...value, values: { ...value.values, cards } });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("b2bBrandSection")} issueCount={brandIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={value.brands.kicker}
          onChange={(kicker) => onChange({ ...value, brands: { ...value.brands, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.brands.title}
          onChange={(title) => onChange({ ...value, brands: { ...value.brands, title } })}
          multiline
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {value.brands.items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <PlainTextField
                label={t("name")}
                value={item.name}
                onChange={(name) => {
                  const items = [...value.brands.items];
                  items[index] = { ...item, name };
                  onChange({ ...value, brands: { ...value.brands, items } });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("body")}
                value={item.copy}
                onChange={(copy) => {
                  const items = [...value.brands.items];
                  items[index] = { ...item, copy };
                  onChange({ ...value, brands: { ...value.brands, items } });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("b2bProcessSection")} issueCount={processIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={value.process.kicker}
          onChange={(kicker) => onChange({ ...value, process: { ...value.process, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.process.title}
          onChange={(title) => onChange({ ...value, process: { ...value.process, title } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("description")}
          value={value.process.description}
          onChange={(description) =>
            onChange({ ...value, process: { ...value.process, description } })
          }
          multiline
        />
        {value.process.steps.map((step, index) => (
          <LocalizedTextField
            {...localizedFieldProps}
            key={index}
            label={`${t("processStep")} ${index + 1}`}
            value={step}
            onChange={(next) => {
              const steps = [...value.process.steps];
              steps[index] = next;
              onChange({ ...value, process: { ...value.process, steps } });
            }}
          />
        ))}
      </CmsPanel>

      <CmsPanel title={t("b2bImageSpacesSection")} issueCount={imageSpaceIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={value.imageSpaces.kicker}
          onChange={(kicker) =>
            onChange({
              ...value,
              imageSpaces: { ...value.imageSpaces, kicker },
            })
          }
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.imageSpaces.title}
          onChange={(title) => onChange({ ...value, imageSpaces: { ...value.imageSpaces, title } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("description")}
          value={value.imageSpaces.description}
          onChange={(description) =>
            onChange({
              ...value,
              imageSpaces: { ...value.imageSpaces, description },
            })
          }
          multiline
        />
        {value.imageSpaces.slots.map((slot, index) => (
          <LocalizedTextField
            {...localizedFieldProps}
            key={index}
            label={`${t("imageSlot")} ${index + 1}`}
            value={slot}
            onChange={(next) => {
              const slots = [...value.imageSpaces.slots];
              slots[index] = next;
              onChange({
                ...value,
                imageSpaces: { ...value.imageSpaces, slots },
              });
            }}
          />
        ))}
      </CmsPanel>

      <CmsPanel title={t("b2bContactSection")} issueCount={contactIssues}>
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("kicker")}
          value={value.contact.kicker}
          onChange={(kicker) => onChange({ ...value, contact: { ...value.contact, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.contact.title}
          onChange={(title) => onChange({ ...value, contact: { ...value.contact, title } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("description")}
          value={value.contact.description}
          onChange={(description) =>
            onChange({ ...value, contact: { ...value.contact, description } })
          }
          multiline
        />
      </CmsPanel>
    </div>
  );
}

function GippyAiSectionsEditor({
  value,
  onChange,
  contentLang,
  compareMode,
  validationIssues,
  t,
}: {
  value: GippyAiSectionContent;
  onChange: (value: GippyAiSectionContent) => void;
  contentLang: ContentLang;
  compareMode: boolean;
  validationIssues: string[];
  t: T;
}) {
  const localizedFieldProps = { activeLang: contentLang, compareMode };
  const guideIssues = countIssues(validationIssues, [".guide."]);
  const suggestionIssues = countIssues(validationIssues, [".suggestions"]);
  const quickActionIssues = countIssues(validationIssues, [".quickActions"]);
  const statChipIssues = countIssues(validationIssues, [".statChips"]);

  return (
    <div className="space-y-4">
      <SectionPolicyNotice>
        Gippy AI sections use fixed counts from the public page layout. Edit existing guide,
        suggestion, action, and stat content here; adding new items requires a separate layout
        change.
      </SectionPolicyNotice>
      <CmsPanel title={t("gippyGuideSection")} defaultOpen issueCount={guideIssues}>
        <PlainTextField
          label={t("kicker")}
          value={value.guide.kicker}
          onChange={(kicker) => onChange({ ...value, guide: { ...value.guide, kicker } })}
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("title")}
          value={value.guide.title}
          onChange={(title) => onChange({ ...value, guide: { ...value.guide, title } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("description")}
          value={value.guide.description}
          onChange={(description) => onChange({ ...value, guide: { ...value.guide, description } })}
          multiline
        />
        <LocalizedTextField
          {...localizedFieldProps}
          label={t("askLabel")}
          value={value.guide.askLabel}
          onChange={(askLabel) => onChange({ ...value, guide: { ...value.guide, askLabel } })}
        />
      </CmsPanel>

      <CmsPanel title={t("gippySuggestionSection")} issueCount={suggestionIssues}>
        <div className="grid gap-4 lg:grid-cols-2">
          {value.suggestions.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("title")}
                value={item.title}
                onChange={(title) => {
                  const suggestions = [...value.suggestions];
                  suggestions[index] = { ...item, title };
                  onChange({ ...value, suggestions });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("subtitle")}
                value={item.sub}
                onChange={(sub) => {
                  const suggestions = [...value.suggestions];
                  suggestions[index] = { ...item, sub };
                  onChange({ ...value, suggestions });
                }}
                multiline
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("prompt")}
                value={item.prompt}
                onChange={(prompt) => {
                  const suggestions = [...value.suggestions];
                  suggestions[index] = { ...item, prompt };
                  onChange({ ...value, suggestions });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("gippyQuickActionSection")} issueCount={quickActionIssues}>
        <div className="grid gap-4 lg:grid-cols-3">
          {value.quickActions.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("label")}
                value={item.label}
                onChange={(label) => {
                  const quickActions = [...value.quickActions];
                  quickActions[index] = { ...item, label };
                  onChange({ ...value, quickActions });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("body")}
                value={item.body}
                onChange={(body) => {
                  const quickActions = [...value.quickActions];
                  quickActions[index] = { ...item, body };
                  onChange({ ...value, quickActions });
                }}
                multiline
              />
              {item.kind === "gippy" ? (
                <LocalizedTextField
                  {...localizedFieldProps}
                  label={t("prompt")}
                  value={item.prompt}
                  onChange={(prompt) => {
                    const quickActions = [...value.quickActions];
                    quickActions[index] = { ...item, prompt };
                    onChange({ ...value, quickActions });
                  }}
                  multiline
                />
              ) : null}
            </div>
          ))}
        </div>
      </CmsPanel>

      <CmsPanel title={t("gippyStatsSection")} issueCount={statChipIssues}>
        <div className="grid gap-4 lg:grid-cols-3">
          {value.statChips.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border/60 p-4">
              <PlainTextField
                label={t("smallLabel")}
                value={item.top}
                onChange={(top) => {
                  const statChips = [...value.statChips];
                  statChips[index] = { ...item, top };
                  onChange({ ...value, statChips });
                }}
              />
              <LocalizedTextField
                {...localizedFieldProps}
                label={t("label")}
                value={item.bottom}
                onChange={(bottom) => {
                  const statChips = [...value.statChips];
                  statChips[index] = { ...item, bottom };
                  onChange({ ...value, statChips });
                }}
              />
            </div>
          ))}
        </div>
      </CmsPanel>
    </div>
  );
}

export function PageSectionEditor({
  pageKey,
  sections,
  contentLang,
  compareMode,
  onChange,
  validationIssues,
  t,
}: {
  pageKey: PageContentKey;
  sections: PageSections;
  contentLang: ContentLang;
  compareMode: boolean;
  onChange: (sections: PageSections) => void;
  validationIssues: string[];
  t: T;
}) {
  if (pageKey === "brand" && sections.brand) {
    return (
      <BrandSectionsEditor
        value={sections.brand}
        onChange={(brand) => onChange({ ...sections, brand })}
        contentLang={contentLang}
        compareMode={compareMode}
        validationIssues={validationIssues}
        t={t}
      />
    );
  }
  if (pageKey === "b2b" && sections.b2b) {
    return (
      <B2BSectionsEditor
        value={sections.b2b}
        onChange={(b2b) => onChange({ ...sections, b2b })}
        contentLang={contentLang}
        compareMode={compareMode}
        validationIssues={validationIssues}
        t={t}
      />
    );
  }
  if (pageKey === "gippy-ai" && sections.gippyAi) {
    return (
      <GippyAiSectionsEditor
        value={sections.gippyAi}
        onChange={(gippyAi) => onChange({ ...sections, gippyAi })}
        contentLang={contentLang}
        compareMode={compareMode}
        validationIssues={validationIssues}
        t={t}
      />
    );
  }
  return (
    <section className="space-y-2 rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground shadow-soft md:p-6">
      <h3 className="font-display text-xl text-foreground">Section editing</h3>
      <p>
        {PAGE_LABELS[pageKey]} currently supports hero and page-level content editing only. No
        structured section editor is wired for this page yet.
      </p>
      <p>
        This is intentional in the current CMS workflow so editors do not expect unsupported
        section, card, or list changes to publish from this screen.
      </p>
    </section>
  );
}
