# Implement full admin CMS i18n workflow

## Bead Metadata

```yaml
depends_on: []
parallel: false
conflicts_with:
  - gpclub_final-u1l
blocks: []
estimated_hours: 28
```

## Problem Statement

The admin CMS currently presents Vietnamese and English fields side by side as the default editing experience. Editors must maintain two locales at once while the admin interface language selector controls only admin chrome, not the website content locale. This makes it easy to publish incomplete translations, Vietnamese without diacritics, missing alt text, and mismatched CTA copy directly to public routes.

When an admin edits public CMS content, they need a workflow that clearly separates admin UI language from website content language, edits one content locale at a time, exposes translation completeness, supports compare/review mode, and prevents publishing incomplete localized content. The existing `home_content` JSON schema must remain in place so current public route fallbacks and existing rows keep working.

## Goals

- Provide single-language editing for existing public CMS locales: `vi` and `en`.
- Keep admin UI language independent from website content language.
- Add compare mode for translation review without making both locales editable by default.
- Block unsafe saves with locale-specific validation and a publish-readiness checklist.
- Add preview controls that make the selected public locale explicit.
- Refactor the admin CMS form architecture so editor shell, localized fields, media fields, validation status, and page sections are separated into focused components.
- Redesign the Content Edit workflow with progressive disclosure so operators can edit one page area at a time without scanning the full form.
- Clean known no-diacritic Vietnamese admin/default literals relevant to this workflow.
- Preserve existing `home_content` JSON rows, keys, unknown branches, and non-edited locale values.

## Non-Goals

- Do not add Korean as a public website content locale. Korean remains admin-chrome only.
- Do not migrate `home_content` to a new table or add a Supabase schema migration.
- Do not migrate unrelated admin tabs such as dealers, popups, products, FAQ, or chatbot into this workflow.
- Do not add machine translation generation, approval routing, scheduling, or version history.
- Do not convert all hardcoded public route copy into CMS-managed content in this bead.
- Do not replace the current CMS with a schema-driven form builder in this phase.
- Do not change public route rendering behavior except where required to preserve existing preview behavior.

## Scope

### In Scope

- `Content Management > Content Edit` workflow in `/admin`.
- Homepage content stored under `home_content` key `home`.
- Non-home page content stored under `home_content` keys `page:${key}`.
- Existing managed page keys: `brand`, `products`, `gippy-ai`, `events`, `b2b`, and `contact`.
- Existing typed section editors for `brand`, `b2b`, and `gippy-ai`.
- Locale validation for required public-facing localized text and optional image metadata already represented in `home_content`.
- Shared admin CMS form primitives used by the Content Edit workflow.
- Shared image/media editing patterns for hero images and section image assets.
- Homepage form sections currently rendered inline inside `HomeEditorTab`.
- Progressive disclosure for dense page and section editors.

### Out of Scope

- Full section editors for pages whose `sections` are intentionally empty today, except explicit empty-state messaging or checklist support.
- Changing Supabase RLS or storage bucket policy.
- Public URL routing redesign beyond the minimum needed for locale preview.
- Data migration for existing persisted rows.
- Dynamic add/remove/reorder for fixed-shape CMS arrays.
- Refactoring unrelated admin tabs unless required for shared components used by Content Edit.

## Proposed Solution

Add a content-locale workflow inside the admin content editor while preserving the existing data model. The editor shell gets a persistent `contentLang` control for `Tiếng Việt` and `English`, separate from `adminLang`. Localized fields render only the active locale as editable by default; compare mode shows the other locale as read-only reference and highlights missing fields.

The save path must become locale-safe. A locale-scoped save must preserve unknown JSON keys, unrelated branches, nested section objects, and the inactive locale. Reset actions must state the affected page and locale. Validation must run before save and publish-readiness checks must summarize missing required localized fields, CTA labels, fallback usage, and optional image metadata status for the active page.

Preview controls should let admins open or inspect the public route for `vi` or `en` with the target locale explicit. If query-driven preview is implemented, `I18nProvider` may read a preview query parameter without changing normal public language behavior. If not, preview may use a controlled local preview panel or a documented localStorage strategy. In all cases, preview must not blur admin UI language with content language.

The follow-up form redesign should keep the already-implemented locale workflow intact while reducing the operational load of the form. `HomeEditorTab` should become an orchestrator rather than a 900+ line form body: selection/actions/status move into a reusable shell, duplicated localized field rendering moves into shared admin form primitives, image URL/upload/optional description handling moves into a shared media editor, and homepage subsections move into focused section editor components. Dense content groups should be collapsed or otherwise progressively disclosed by default, with status summaries that make missing required content visible without showing every optional field at once.

## Technical Context

- Admin content hub: `src/components/admin/tabs/HomeEditorTab.tsx` owns page selection, load, save, and reset.
- Section editors: `src/components/admin/page-section-editor.tsx` owns `brand`, `b2b`, and `gippy-ai` nested CMS forms.
- Public content locales: `src/lib/home-content.tsx` defines `LocalizedText = { vi: string; en: string }` and `src/lib/page-content.tsx` defines `SiteLang = "vi" | "en"`.
- Admin chrome language: `src/components/admin/admin-i18n.ts` defines `AdminLang = "en" | "vi" | "ko"` and must remain separate from content locale.
- Storage: `src/components/admin/tabs/HomeEditorTab.tsx` upserts into `home_content`; `src/lib/page-content.tsx` stores non-home rows as `page:${key}`.
- Public consumers: `src/routes/index.tsx`, `src/routes/brand.tsx`, `src/routes/products.tsx`, `src/routes/events.tsx`, `src/routes/b2b.tsx`, `src/routes/contact.tsx`, and `src/routes/gippy-ai.tsx` render localized CMS fields through `useI18n()` and page/home content hooks.
- Existing risk: `mergeHomeContent` and `mergePageContent` fill defaults, so validation must inspect editable draft state and surface fallback usage instead of allowing defaults to hide missing data.
- Existing risk: many files in this area are already dirty/untracked from related work; implementation must preserve unrelated changes and coordinate with `gpclub_final-u1l`.
- Follow-up audit: image alt/description fields were made optional and hidden behind details controls; future refactors must preserve that behavior.
- Current architecture issue: `HomeEditorTab.tsx` owns page selection, content language selection, compare mode, validation, Supabase load/save, reset defaults, preview links, home form rendering, non-home hero editing, and section editor orchestration.
- Reusable component opportunity: `TextPair` exists in both `HomeEditorTab.tsx` and `page-section-editor.tsx`; media editing also repeats optional image metadata behavior around `AdminImageUploader`.

## Affected Files

- `src/components/admin/tabs/HomeEditorTab.tsx`
- `src/components/admin/page-section-editor.tsx`
- `src/components/admin/admin-i18n.ts`
- `src/components/admin/admin-image-uploader.tsx`
- `src/components/admin/cms-form-shell.tsx`
- `src/components/admin/cms-form-fields.tsx`
- `src/components/admin/cms-media-field.tsx`
- `src/components/admin/home-content-sections.tsx`
- `src/lib/home-content.tsx`
- `src/lib/page-content.tsx`
- `src/lib/i18n.tsx`
- `src/lib/site-settings.tsx`
- `src/components/admin/tabs/SettingsTab.tsx`
- `src/routes/index.tsx`
- `src/routes/brand.tsx`
- `src/routes/products.tsx`
- `src/routes/events.tsx`
- `src/routes/b2b.tsx`
- `src/routes/contact.tsx`
- `src/routes/gippy-ai.tsx`
- `.beads/artifacts/gpclub_final-my4/prd.md`
- `.beads/artifacts/gpclub_final-my4/prd.json`
- `.beads/artifacts/gpclub_final-my4/progress.txt`

## Functional Requirements

1. WHEN an admin opens Content Edit, THEN the UI shows an explicit website content language selector for `Tiếng Việt` and `English` that is separate from the admin UI language selector.
2. WHEN a content locale is selected, THEN localized fields for that locale are editable and the inactive locale is not editable unless compare behavior explicitly permits a scoped action.
3. WHEN compare mode is enabled, THEN the inactive locale is visible as reference, missing fields are highlighted, and accidental dual-locale editing is prevented.
4. WHEN an admin saves, THEN validation blocks required missing fields for the active page and content locale.
5. WHEN an admin saves one locale, THEN existing values for the inactive locale and unknown JSON branches in `home_content.value` are preserved.
6. WHEN an admin resets content, THEN the action clearly states page and locale scope and does not silently wipe the other locale.
7. WHEN preview is used, THEN the preview clearly targets `vi` or `en` public content and does not depend on the admin chrome language.
8. WHEN a page has no editable sections, THEN the CMS states that only top-level/hero content is managed instead of implying missing controls are a bug.
9. WHEN default/admin Vietnamese text is shown in this workflow, THEN it uses proper Vietnamese diacritics and valid UTF-8.
10. WHEN an admin opens a dense Content Edit page, THEN the editor shows a compact workflow with page-level actions/status separated from the content form body.
11. WHEN an admin edits localized text, THEN all Content Edit surfaces use one shared localized field pattern instead of duplicated `TextPair` implementations.
12. WHEN an admin edits image/media content, THEN the upload/URL control and optional image description are grouped consistently through a shared media editor.
13. WHEN an admin edits homepage content, THEN hero, stats, partner hook, trust/process/media, and CTA content are rendered as focused sections rather than one long inline form.
14. WHEN a section is collapsed or hidden by progressive disclosure, THEN required validation and dirty/status indicators still surface problems at the section level.

## Non-Functional Requirements

- Maintain current public route fallback behavior and avoid blank-loading regressions.
- Keep the current Supabase `home_content` schema unchanged.
- Preserve accessibility basics: field errors must be inline, focusable, and associated with the relevant input.
- Keep UI controls consistent with existing admin form styling and avoid nested cards.
- Avoid broad refactors outside files required for this workflow.
- Preserve keyboard access and native semantics for disclosure controls.
- Avoid moving persistence, locale merge, and validation behavior in the same task as broad visual restructuring.

## Success Criteria

- Verify: `npx tsc --noEmit --pretty false`
- Verify: `npm run lint`
- Verify: `npm run build`
- Verify: `npx vite build --config vite.spa.config.ts`
- Verify: authenticated browser check through `/auth` -> `/admin` -> Content Edit can edit/save/reload a single locale without changing the other locale.
- Verify: preview checks for at least one home page flow and one non-home page flow show the intended locale.
- Verify: validation blocks an empty required Vietnamese field and reports the specific field.
- Verify: compare mode shows both locales while only the active locale is editable.
- Verify: no known no-diacritic Vietnamese literals remain in `admin-i18n.ts`, `site-settings.tsx`, or `SettingsTab.tsx` for fields covered by this workflow.
- Verify: clearing optional image descriptions does not block Content Edit save.
- Verify: Content Edit can be operated by section, with collapsed sections still exposing validation status.
- Verify: shared field/media components are used by both homepage and non-home section editors.

## Risks

- Locale-scoped saves can cause data loss if they overwrite whole JSON rows without deep merging latest stored content.
- Defaults can hide missing translations unless validation distinguishes authored value from fallback value.
- Preview may require a small `I18nProvider` extension; that must not change normal public language detection.
- Existing dirty files and the active `gpclub_final-u1l` bead overlap with this work.
- Full dynamic array editing is not part of this bead; fixed-shape section arrays must be presented honestly in the UI/checklist.
- Refactoring too much of `HomeEditorTab` at once can break locale-safe save/reset behavior; split shell, field primitives, media editor, and home section extraction into separate tasks.
- New shared components can create circular imports if they depend on tab-specific types; keep shared components dumb and pass callbacks/values from `HomeEditorTab`.

## Decisions

- Content locales for this bead are `vi` and `en` only.
- Admin UI language remains `en`, `vi`, and `ko`, and does not determine the edited content locale.
- Keep `home_content` JSON schema and row keys unchanged.
- Treat publish checklist as a pre-save/readiness gate in the current live-save CMS, not a separate draft/publish backend.
- Preserve the audit decision that image alt/description fields are optional operator metadata, not required save blockers.
- Use native disclosure or existing accessible primitives for progressive disclosure; do not add a new dependency.

## Tasks

### Content Locale Editor Shell [ux]

The Content Edit tab exposes a persistent website content language selector and makes active page, active locale, compare state, and save/reset scope explicit.

**Metadata:**

```yaml
depends_on: []
parallel: false
conflicts_with:
  - Locale Field Components And Compare Mode
  - Locale-Safe Save And Reset
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: `/admin` Content Edit displays separate controls for admin UI language and website content language.
- Verify: switching website content language does not change `gpclub-admin-lang` or admin chrome labels.
- Verify: page selector, save, reset, and preview controls visibly identify the active page and content locale.

### Locale Field Components And Compare Mode [ux]

Localized text and image-alt fields render one editable locale by default, with compare mode showing the inactive locale as read-only reference across top-level and section editors.

**Metadata:**

```yaml
depends_on:
  - Content Locale Editor Shell
parallel: false
conflicts_with:
  - Content Locale Editor Shell
  - Locale Validation And Publish Checklist
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/page-section-editor.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: localized homepage fields show only the selected locale as editable when compare mode is off.
- Verify: localized Brand/B2B/Gippy section fields show only the selected locale as editable when compare mode is off.
- Verify: compare mode shows the inactive locale as read-only and does not allow accidental editing of both locales.

### Locale-Safe Save And Reset [data]

Saves and resets preserve inactive locale values, unknown JSON branches, and unrelated page content while applying only the intended page/locale change.

**Metadata:**

```yaml
depends_on:
  - Content Locale Editor Shell
parallel: false
conflicts_with:
  - Locale Field Components And Compare Mode
  - Locale Validation And Publish Checklist
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/lib/home-content.tsx
  - src/lib/page-content.tsx
```

**Verification:**

- Verify: saving Vietnamese text does not change existing English values in the same `home_content` row.
- Verify: saving English text does not change existing Vietnamese values in the same `home_content` row.
- Verify: reset action identifies page and locale scope and does not wipe the inactive locale.
- Verify: existing unknown JSON keys in a loaded row survive save/reload.

### Locale Validation And Publish Checklist [validation]

The editor blocks unsafe saves and shows a page-aware checklist for missing required localized text, CTA labels, unsupported/fallback states, and optional image metadata status.

**Metadata:**

```yaml
depends_on:
  - Locale Field Components And Compare Mode
  - Locale-Safe Save And Reset
parallel: false
conflicts_with:
  - Locale-Safe Save And Reset
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/page-section-editor.tsx
  - src/lib/home-content.tsx
  - src/lib/page-content.tsx
```

**Verification:**

- Verify: saving with an empty required active-locale title or description is blocked.
- Verify: saving with blank optional image descriptions is allowed while required active-locale text remains blocked.
- Verify: validation errors are inline, field-specific, and focusable.
- Verify: publish checklist updates when changing page or content locale.

### Locale Preview Controls [preview]

Admins can preview managed pages in Vietnamese or English with the preview locale explicit and independent from admin chrome language.

**Metadata:**

```yaml
depends_on:
  - Content Locale Editor Shell
  - Locale-Safe Save And Reset
parallel: true
conflicts_with: []
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/lib/i18n.tsx
  - src/routes/index.tsx
  - src/routes/brand.tsx
  - src/routes/products.tsx
  - src/routes/events.tsx
  - src/routes/b2b.tsx
  - src/routes/contact.tsx
  - src/routes/gippy-ai.tsx
```

**Verification:**

- Verify: previewing `vi` opens or renders the public page in Vietnamese content mode.
- Verify: previewing `en` opens or renders the public page in English content mode.
- Verify: preview behavior does not change admin UI language preference.
- Verify: normal public language behavior remains unchanged when not using preview controls.

### Vietnamese Copy Cleanup [content]

Known no-diacritic Vietnamese admin labels and fallback strings in this workflow are replaced with valid Vietnamese with diacritics.

**Metadata:**

```yaml
depends_on: []
parallel: true
conflicts_with:
  - Content Locale Editor Shell
files:
  - src/components/admin/admin-i18n.ts
  - src/lib/site-settings.tsx
  - src/components/admin/tabs/SettingsTab.tsx
  - src/lib/page-content.tsx
```

**Verification:**

- Verify: no known no-diacritic Vietnamese literals from the audit remain in `admin-i18n.ts`, `site-settings.tsx`, or `SettingsTab.tsx`.
- Verify: page-content Vietnamese defaults used by managed routes render valid UTF-8 Vietnamese text.
- Verify: existing persisted Supabase content is not overwritten by cleanup code.

### Unsupported Section States And Fixed-Shape Policy [cms]

Pages without section editors and fixed-shape arrays are represented honestly in the UI and checklist so admins understand what is editable today.

**Metadata:**

```yaml
depends_on:
  - Locale Field Components And Compare Mode
parallel: true
conflicts_with: []
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/page-section-editor.tsx
  - src/lib/page-content.tsx
```

**Verification:**

- Verify: Products, Events, and Contact communicate that section editing is not available when selected.
- Verify: fixed-shape section lists do not imply admins can add/remove arbitrary items.
- Verify: checklist reflects editable fields only and does not report non-CMS hardcoded route copy as missing CMS data.

### End-To-End Verification And Handoff [qa]

The completed workflow has static verification, build verification, browser workflow evidence, and progress notes for follow-up shipping.

**Metadata:**

```yaml
depends_on:
  - Locale Validation And Publish Checklist
  - Locale Preview Controls
  - Vietnamese Copy Cleanup
  - Unsupported Section States And Fixed-Shape Policy
parallel: false
conflicts_with: []
files:
  - .beads/artifacts/gpclub_final-my4/progress.txt
```

**Verification:**

- Verify: `npx tsc --noEmit --pretty false`
- Verify: `npm run lint`
- Verify: `npm run build`
- Verify: `npx vite build --config vite.spa.config.ts`
- Verify: authenticated `/admin` save/reload flow preserves inactive locale for one home page edit and one non-home page edit.
- Verify: public preview renders the intended locale for one home page and one non-home page.

### Shared CMS Form Primitives [architecture]

Shared localized field and panel primitives replace duplicated Content Edit field implementations while preserving active-locale editing and compare-mode behavior.

**Metadata:**

```yaml
depends_on:
  - Locale Field Components And Compare Mode
parallel: false
conflicts_with:
  - CMS Form Shell And Status Layout
  - Shared CMS Media Field
files:
  - src/components/admin/cms-form-fields.tsx
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/page-section-editor.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: homepage localized fields use the shared field primitive and still edit only the active content locale.
- Verify: Brand, B2B, and Gippy AI section fields use the shared field primitive and still support compare mode.
- Verify: duplicated `TextPair` implementations are removed or reduced to thin wrappers around the shared primitive.
- Verify: `rtk npm run lint` and `rtk npm run build` pass or report only known unrelated warnings.

### CMS Form Shell And Status Layout [ux]

The Content Edit page selector, content language selector, compare toggle, preview controls, save/reset controls, dirty state, and validation status move into a focused shell so the form body contains only editable content.

**Metadata:**

```yaml
depends_on:
  - Shared CMS Form Primitives
parallel: false
conflicts_with:
  - Shared CMS Form Primitives
  - Progressive Disclosure And Section Status
files:
  - src/components/admin/cms-form-shell.tsx
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: Content Edit page-level controls remain visible and clearly identify active page and content locale.
- Verify: save/reset/preview behavior remains wired to the same `HomeEditorTab` persistence state.
- Verify: validation summary is visible outside the dense content form body.
- Verify: `rtk npm run lint` and `rtk npm run build` pass or report only known unrelated warnings.

### Shared CMS Media Field [ux]

Image URL/upload controls and optional image descriptions are grouped through one shared media editor that wraps `AdminImageUploader` and preserves optional alt-description behavior.

**Metadata:**

```yaml
depends_on:
  - Shared CMS Form Primitives
parallel: false
conflicts_with:
  - Home Content Section Editors
files:
  - src/components/admin/cms-media-field.tsx
  - src/components/admin/admin-image-uploader.tsx
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/page-section-editor.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: non-home hero images use the shared media field.
- Verify: Brand, B2B, and Gippy AI section image assets use the shared media field.
- Verify: home hero and homepage image slots keep optional image descriptions and do not require them to save.
- Verify: keyboard users can open and edit optional image details through native or accessible disclosure controls.

### Home Content Section Editors [architecture]

Homepage hero, stats, partner hook, trust/process/media, and CTA content move out of the inline `HomeEditorTab` body into focused section editor components while preserving draft state and callbacks.

**Metadata:**

```yaml
depends_on:
  - Shared CMS Form Primitives
  - Shared CMS Media Field
parallel: false
conflicts_with:
  - Shared CMS Media Field
  - Progressive Disclosure And Section Status
files:
  - src/components/admin/home-content-sections.tsx
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/cms-form-fields.tsx
  - src/components/admin/cms-media-field.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: homepage hero, stats, partner hook, trust/process/media, and CTA content are rendered by focused section components.
- Verify: changing each homepage section still updates the same `home_content` draft shape.
- Verify: locale-safe save/reset behavior remains unchanged for homepage content.
- Verify: `rtk tsc --noEmit --pretty false` reports no new errors in the touched files.

### Progressive Disclosure And Section Status [ux]

Dense Content Edit sections are progressively disclosed by default, and each collapsed section exposes validation or dirty-state summaries so operators can navigate directly to the area that needs work.

**Metadata:**

```yaml
depends_on:
  - CMS Form Shell And Status Layout
  - Home Content Section Editors
parallel: false
conflicts_with: []
files:
  - src/components/admin/tabs/HomeEditorTab.tsx
  - src/components/admin/page-section-editor.tsx
  - src/components/admin/cms-form-shell.tsx
  - src/components/admin/home-content-sections.tsx
  - src/components/admin/admin-i18n.ts
```

**Verification:**

- Verify: long homepage and section-editor forms can be operated by opening one focused section at a time.
- Verify: collapsed sections surface missing required content or dirty status without hiding blockers.
- Verify: disclosure controls are keyboard reachable and keep native semantics or equivalent Radix semantics.
- Verify: optional image details remain secondary and do not clutter default data-entry flow.

### Form Refactor Verification And Handoff [qa]

The form architecture refactor has static gates, build gates, and updated progress notes documenting any remaining authenticated-browser QA gap.

**Metadata:**

```yaml
depends_on:
  - Progressive Disclosure And Section Status
parallel: false
conflicts_with: []
files:
  - .beads/artifacts/gpclub_final-my4/progress.txt
```

**Verification:**

- Verify: `rtk npm run lint`
- Verify: `rtk tsc --noEmit --pretty false`
- Verify: `rtk npm run build`
- Verify: authenticated `/auth` -> `/admin` -> Content Edit smoke test is run when an admin Supabase session is available, or the missing session is recorded as a manual QA gap.
- Verify: progress notes identify form-refactor files changed, commands run, warnings, and remaining risks.
