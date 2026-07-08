# Admin CMS I18n Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use skill({ name: "executing-plans" }) to implement this plan task-by-task.

**Goal:** Build a safe `/admin` Content Edit workflow where editors choose one website content locale at a time, compare translations intentionally, validate required localized fields, preview the public locale, and preserve the existing `home_content` JSON contract.

**Architecture:** Keep the current Supabase `home_content` rows and content types (`home`, `page:${key}`, `vi`, `en`). Move the admin editor from dual editable `VI`/`EN` fields to locale-aware controls, then layer locale-safe persistence, validation/checklist, preview, and content cleanup.

**Tech Stack:** React 18, TanStack Router/Vite, TypeScript, Supabase client, existing admin UI components, existing `HomeAdminContent` and `PageEditableContent` models.

---

## Must-Haves

**Goal:** Admin editors can safely edit and verify Vietnamese or English CMS content independently without losing the other locale or publishing incomplete localized content.

### Observable Truths

1. `/admin` Content Edit shows a website content language selector that is clearly separate from admin chrome language.
2. Localized fields edit only the active locale by default.
3. Compare mode shows the inactive locale as read-only reference.
4. Save blocks missing required fields for the active locale and identifies the specific fields.
5. Save preserves the inactive locale, unknown JSON branches, and unrelated page content.
6. Reset is scoped to the selected page and active locale, not the whole JSON row.
7. Preview opens public pages with an explicit `vi` or `en` mode without changing admin chrome language.
8. Pages without section editors state the limitation honestly.
9. Known no-diacritic/corrupted Vietnamese defaults and admin labels in this workflow are cleaned.

### Required Artifacts

| Artifact                     | Provides                                                               | Path                                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content editor shell         | Page selector, content locale selector, compare toggle, scoped actions | `src/components/admin/tabs/HomeEditorTab.tsx`                                                                                                                          |
| Localized field controls     | Active-locale editing and read-only compare UI                         | `src/components/admin/tabs/HomeEditorTab.tsx`, `src/components/admin/page-section-editor.tsx`                                                                          |
| Locale save helpers          | Deep locale merge and scoped reset behavior                            | `src/components/admin/tabs/HomeEditorTab.tsx`, `src/lib/home-content.tsx`, `src/lib/page-content.tsx`                                                                  |
| Validation/checklist helpers | Required-field checks and readiness UI                                 | `src/components/admin/tabs/HomeEditorTab.tsx`, `src/components/admin/page-section-editor.tsx`, `src/lib/home-content.tsx`, `src/lib/page-content.tsx`                  |
| Preview bridge               | Query-driven public language override for preview                      | `src/lib/i18n.tsx`, public route files if needed                                                                                                                       |
| Clean copy                   | Proper Vietnamese admin/default fallback strings                       | `src/components/admin/admin-i18n.ts`, `src/lib/site-settings.tsx`, `src/components/admin/tabs/SettingsTab.tsx`, `src/lib/page-content.tsx`, `src/lib/home-content.tsx` |
| QA notes                     | Evidence and residual manual checks                                    | `.beads/artifacts/gpclub_final-my4/progress.txt`                                                                                                                       |

### Key Links

| From                            | To                      | Via                                             | Risk                                                                            |
| ------------------------------- | ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `HomeEditorTab.save()`          | Supabase `home_content` | `upsert(row)`                                   | Whole-row overwrite can clobber inactive locale or unknown keys.                |
| `HomeEditorTab.resetDefaults()` | Defaults                | `DEFAULT_HOME_CONTENT` / `DEFAULT_PAGE_CONTENT` | Existing reset wipes the entire selected page in local state.                   |
| `PageSectionEditor`             | Nested section data     | `sections` prop                                 | Section fields currently assume both locales are editable.                      |
| `I18nProvider`                  | Public preview          | localStorage/browser/query                      | Preview must not alter normal site language behavior unexpectedly.              |
| Defaults                        | Public rendering        | merge helpers                                   | Defaults can mask missing authored values unless validation checks draft state. |

## Constraints And Assumptions

- Public CMS locales remain exactly `vi` and `en` for this bead.
- Admin UI language remains `en`, `vi`, `ko`; Korean is admin chrome only.
- No Supabase migration, no RLS changes, no storage bucket changes.
- No broad migration of hardcoded route copy into CMS.
- Existing dirty files are treated as user/previous-session work; do not revert them.
- Because most PRD tasks share `HomeEditorTab.tsx`, `page-section-editor.tsx`, `admin-i18n.ts`, and `page-content.tsx`, execute waves sequentially. Do not dispatch parallel agents against shared files.

## Dependency Graph

### Task Dependencies

Task 1 (Content Locale Editor Shell): needs nothing, modifies `HomeEditorTab.tsx`, `admin-i18n.ts`.
Task 2 (Locale Field Components And Compare Mode): needs Task 1, modifies `HomeEditorTab.tsx`, `page-section-editor.tsx`, `admin-i18n.ts`.
Task 3 (Locale-Safe Save And Reset): needs Task 1, modifies `HomeEditorTab.tsx`, `home-content.tsx`, `page-content.tsx`.
Task 4 (Locale Validation And Publish Checklist): needs Task 2 + Task 3, modifies `HomeEditorTab.tsx`, `page-section-editor.tsx`, `home-content.tsx`, `page-content.tsx`.
Task 5 (Locale Preview Controls): needs Task 1 + Task 3, modifies `HomeEditorTab.tsx`, `i18n.tsx`, route files only if query preview requires them.
Task 6 (Vietnamese Copy Cleanup): needs nothing, modifies `admin-i18n.ts`, `site-settings.tsx`, `SettingsTab.tsx`, `page-content.tsx`, `home-content.tsx`.
Task 7 (Unsupported Section States And Fixed-Shape Policy): needs Task 2, modifies `HomeEditorTab.tsx`, `page-section-editor.tsx`, `page-content.tsx`.
Task 8 (End-To-End Verification And Handoff): needs Tasks 4, 5, 6, 7, modifies artifact notes only.

Wave 1: Task 1 (foundational editor shell)
Wave 2: Task 2 (field model and compare mode)
Wave 3: Task 3 (locale-safe persistence)
Wave 4: Task 4 (validation and checklist)
Wave 5: Task 5 (preview controls)
Wave 6: Task 7 (unsupported section and fixed-shape policy)
Wave 7: Task 6 (Vietnamese copy cleanup; late to avoid repeated conflicts with admin labels/defaults)
Wave 8: Task 8 (verification and handoff)

## Wave 1: Content Locale Editor Shell

### Task 1: Add Content Locale Shell

**Files:**

- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/components/admin/admin-i18n.ts`

**Steps:**

1. Add a local type or import for website locale: `type ContentLang = "vi" | "en"` (prefer importing `SiteLang` from `src/lib/page-content.tsx` if it does not create awkward coupling).
2. In `HomeEditorTab`, add state:
   - `contentLang`, default `"vi"`.
   - `compareMode`, default `false`.
3. Add admin i18n keys for:
   - `contentLanguage`
   - `vietnameseContent`
   - `englishContent`
   - `compareTranslations`
   - `editingScope`
   - `previewVietnamese`
   - `previewEnglish`
   - `saveScopeHint`
   - `resetScopeHint`
4. In the header card, render:
   - Existing page selector.
   - A segmented/select control for content language labelled as website content language, not admin language.
   - A compare toggle/checkbox.
   - A concise scope line: selected page + selected locale + compare state.
5. Update Save/Reset button text or nearby helper text so it identifies active page and locale.
6. Do not change persistence behavior in this wave.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Expected: no new type errors from `HomeEditorTab.tsx` or `admin-i18n.ts`.
- Manual code check: `gpclub-admin-lang` remains controlled only by `AdminPage.tsx`, not by the new content locale selector.

**Commit:**

```bash
git add src/components/admin/tabs/HomeEditorTab.tsx src/components/admin/admin-i18n.ts
git commit -m "feat(gpclub_final-my4): add CMS content locale shell"
```

## Wave 2: Locale Field Components And Compare Mode

### Task 2: Replace Dual Editable Localized Fields

**Files:**

- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/components/admin/page-section-editor.tsx`
- Modify: `src/components/admin/admin-i18n.ts`

**Steps:**

1. Replace `TextPair` in `HomeEditorTab.tsx` with a locale-aware field component:
   - Props: `label`, `value`, `activeLang`, `compareMode`, `onChange`, `multiline`, optional `error` and `fieldId`.
   - Editable input uses `value[activeLang]` only.
   - In compare mode, show the inactive locale as read-only text/input with `readOnly` and muted styling.
   - Labels should say `Tiếng Việt` or `English`, not `VI`/`EN`.
2. Thread `contentLang` and `compareMode` into `PageTextEditor`.
3. Replace all top-level page field usage with the new component.
4. Update homepage field usages in `HomeEditorTab` similarly.
5. In `page-section-editor.tsx`, replace its duplicated `TextPair` with the same behavior locally or export a shared small component from `HomeEditorTab` only if that does not create a circular import. Prefer a local duplicate for now if it keeps the diff small.
6. Add `contentLang` and `compareMode` props to `PageSectionEditor` and every nested section editor.
7. Ensure inactive locale cannot be edited in compare mode.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Run: `npm run lint`
- Expected: localized homepage, page hero, and Brand/B2B/Gippy section fields compile with active locale props.
- Manual code check: no remaining `{label} VI` / `{label} EN` patterns in `HomeEditorTab.tsx` or `page-section-editor.tsx`.

**Commit:**

```bash
git add src/components/admin/tabs/HomeEditorTab.tsx src/components/admin/page-section-editor.tsx src/components/admin/admin-i18n.ts
git commit -m "feat(gpclub_final-my4): add locale-aware CMS fields"
```

## Wave 3: Locale-Safe Save And Reset

### Task 3: Preserve Inactive Locale And Unknown JSON Branches

**Files:**

- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/lib/home-content.tsx`
- Modify: `src/lib/page-content.tsx`

**Steps:**

1. Add utility helpers in content libs or inside `HomeEditorTab` if simpler:
   - `mergeHomeContentForLocale(current: HomeAdminContent, latest: unknown, lang: SiteLang): HomeAdminContent`
   - `mergePageContentForLocale(pageKey: PageContentKey, current: PageEditableContent, latest: unknown, lang: SiteLang): PageEditableContent`
2. Helpers must start from the latest stored row, preserve unknown keys where possible, then copy only localized values for the active locale from the draft.
3. For non-localized fields edited in the CMS (image URLs, string labels, numeric strings), apply the current draft value because they are page-level fields, not locale-specific fields.
4. In `save()`, fetch latest row value immediately before upsert.
5. Upsert the locale-merged object instead of the whole local draft.
6. Preserve current load behavior with `mergeHomeContent` / `mergePageContent` after save.
7. Change reset behavior to reset only the active locale for localized fields. Non-localized fields should either remain unchanged or require a separate clearly labelled full reset confirmation; for this bead, keep non-localized fields unchanged during locale reset.
8. Update reset confirmation copy to identify page and locale.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Add a temporary/manual reasoning check in notes: saving `vi` updates `*.vi` fields and leaves `*.en` fields untouched.
- Confirm unknown keys are not intentionally stripped in helper logic.

**Commit:**

```bash
git add src/components/admin/tabs/HomeEditorTab.tsx src/lib/home-content.tsx src/lib/page-content.tsx
git commit -m "feat(gpclub_final-my4): make CMS saves locale-safe"
```

## Wave 4: Locale Validation And Publish Checklist

### Task 4: Block Unsafe Locale Saves

**Files:**

- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/components/admin/page-section-editor.tsx`
- Modify: `src/lib/home-content.tsx`
- Modify: `src/lib/page-content.tsx`

**Steps:**

1. Define a validation result type:
   - `path: string`
   - `label: string`
   - `message: string`
   - `severity: "error" | "warning"`
2. Add validators for home and page content. Required localized fields at minimum:
   - Home hero title, subtitle, primary CTA, image alt when image URL exists.
   - Home partner/trust/process/CTA public text.
   - Page title, description, primary CTA, secondary CTA, hero image alt when hero image URL exists.
   - Existing editable nested section localized titles/body/copy/image alts for Brand/B2B/Gippy.
3. Make validators inspect the current draft for `contentLang`, not merged fallback output.
4. In `HomeEditorTab.save()`, run validation before fetching/upserting. Block if any `error` exists.
5. Render a publish checklist panel near the action header:
   - Complete required fields count.
   - Missing active-locale fields.
   - Warnings for fixed-shape sections or unsupported sections.
6. Add inline field error support to locale-aware field components. Use stable field paths as IDs where practical.
7. On blocked save, focus the first invalid field if the DOM element exists; otherwise toast the first error.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Run: `npm run lint`
- Manual code check: save returns before Supabase write when required active-locale fields are empty.
- Manual browser later: clear Vietnamese title, click save, observe specific field error.

**Commit:**

```bash
git add src/components/admin/tabs/HomeEditorTab.tsx src/components/admin/page-section-editor.tsx src/lib/home-content.tsx src/lib/page-content.tsx
git commit -m "feat(gpclub_final-my4): add CMS locale validation checklist"
```

## Wave 5: Locale Preview Controls

### Task 5: Add Explicit Public Locale Preview

**Files:**

- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/lib/i18n.tsx`
- Modify only if needed: `src/routes/index.tsx`, `src/routes/brand.tsx`, `src/routes/products.tsx`, `src/routes/events.tsx`, `src/routes/b2b.tsx`, `src/routes/contact.tsx`, `src/routes/gippy-ai.tsx`

**Steps:**

1. In `src/lib/i18n.tsx`, add support for a preview query parameter such as `?lang=vi` or `?previewLang=vi`.
2. Query override must accept only `vi` or `en`.
3. Query override should set the current render language for that page load without changing admin language storage.
4. Preserve normal public behavior when no query parameter is present.
5. In `HomeEditorTab`, add preview buttons for active page:
   - Preview active locale.
   - Optional direct buttons for Vietnamese and English.
6. Map selected page to route path:
   - `home` -> `/`
   - `brand` -> `/brand`
   - `products` -> `/products`
   - `gippy-ai` -> `/gippy-ai`
   - `events` -> `/events`
   - `b2b` -> `/b2b`
   - `contact` -> `/contact`
7. Use `window.open(pathWithLang, "_blank", "noopener,noreferrer")` or existing route preview pattern.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Run: `npm run lint`
- Manual browser later: open `/brand?lang=vi` and `/brand?lang=en`; confirm public language changes and admin chrome preference is untouched.

**Commit:**

```bash
git add src/components/admin/tabs/HomeEditorTab.tsx src/lib/i18n.tsx src/routes/index.tsx src/routes/brand.tsx src/routes/products.tsx src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx src/routes/gippy-ai.tsx
git commit -m "feat(gpclub_final-my4): add CMS locale preview controls"
```

Only stage route files that actually changed.

## Wave 6: Unsupported Section States And Fixed-Shape Policy

### Task 6: Make Section Coverage Honest

**Files:**

- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/components/admin/page-section-editor.tsx`
- Modify: `src/lib/page-content.tsx`

**Steps:**

1. Add metadata for section support in `page-content.tsx` or a local helper:
   - `brand`, `b2b`, `gippy-ai`: section editor supported.
   - `products`, `events`, `contact`: top-level/hero CMS only.
2. In `PageSectionEditor`, replace silent `return null` for unsupported pages with a small neutral empty-state block.
3. In checklist logic, add a warning/info item for unsupported section pages instead of missing errors.
4. Add copy explaining fixed-shape arrays where lists are rendered from defaults and admins can edit existing slots but not add/remove arbitrary items in this bead.
5. Do not add dynamic add/remove list controls.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Run: `npm run lint`
- Manual code check: selecting Products/Events/Contact does not produce a blank section area with no explanation.

**Commit:**

```bash
git add src/components/admin/tabs/HomeEditorTab.tsx src/components/admin/page-section-editor.tsx src/lib/page-content.tsx
git commit -m "feat(gpclub_final-my4): clarify CMS section coverage"
```

## Wave 7: Vietnamese Copy Cleanup

### Task 7: Clean Admin And Fallback Vietnamese Text

**Files:**

- Modify: `src/components/admin/admin-i18n.ts`
- Modify: `src/lib/site-settings.tsx`
- Modify: `src/components/admin/tabs/SettingsTab.tsx`
- Modify: `src/lib/page-content.tsx`
- Modify: `src/lib/home-content.tsx`

**Steps:**

1. Replace known no-diacritic admin labels from the audit, including:
   - `Dan URL anh cong khai hoac tai anh cho section.` -> `Dán URL ảnh công khai hoặc tải ảnh cho section.`
   - `Chon anh section` -> `Chọn ảnh section`
   - `Dinh vi thuong hieu` -> `Định vị thương hiệu`
   - `Gia tri cot loi` -> `Giá trị cốt lõi`
   - `The thuong hieu chien luoc` -> `Thẻ thương hiệu chiến lược`
   - B2B/Gippy labels listed in the audit.
2. Replace footer defaults in `site-settings.tsx` and `SettingsTab.tsx`:
   - `Nen tang doi tac...` -> proper Vietnamese with diacritics.
   - `Da dang ky ban quyen.` -> `Đã đăng ký bản quyền.`
3. Normalize managed-route Vietnamese defaults in `home-content.tsx` and `page-content.tsx` where text is obviously mojibake/no-diacritic. Keep wording simple and close to current English meaning.
4. Do not write code that overwrites persisted Supabase rows. This is source fallback cleanup only.
5. Run a targeted search for known audit strings and common no-diacritic labels.

**Verification:**

- Run: `npx tsc --noEmit --pretty false`
- Run: `npm run lint`
- Run targeted searches:
  - `Select-String -Path src/components/admin/admin-i18n.ts,src/lib/site-settings.tsx,src/components/admin/tabs/SettingsTab.tsx -Pattern 'Dan URL|Chon anh|Dinh vi|Gia tri cot loi|Nen tang doi tac|Da dang ky'`
  - Expected: no matches for old strings.

**Commit:**

```bash
git add src/components/admin/admin-i18n.ts src/lib/site-settings.tsx src/components/admin/tabs/SettingsTab.tsx src/lib/page-content.tsx src/lib/home-content.tsx
git commit -m "fix(gpclub_final-my4): clean Vietnamese CMS copy"
```

## Wave 8: Verification And Handoff

### Task 8: Run Final Gates And Record Evidence

**Files:**

- Modify: `.beads/artifacts/gpclub_final-my4/progress.txt`
- Modify: `.beads/artifacts/gpclub_final-my4/reflections.md`

**Steps:**

1. Run full static verification:
   - `npx tsc --noEmit --pretty false`
   - `npm run lint`
   - `npm run build`
   - `npx vite build --config vite.spa.config.ts`
2. If browser/admin credentials are available, run manual/browser verification:
   - `/auth` -> `/admin` -> Content Management -> Content Edit.
   - Edit/save/reload one home Vietnamese field and verify English remains unchanged.
   - Edit/save/reload one non-home English field and verify Vietnamese remains unchanged.
   - Verify compare mode read-only inactive locale.
   - Verify preview for one home and one non-home page in `vi` and `en`.
3. If credentials are not available, record the exact blocker and what remains manual.
4. Update `progress.txt` with commands, pass/fail, changed files, and residual risks.
5. Add a final reflection entry.

**Verification:**

- Required static gates must run fresh before completion claim.
- Browser checks may be marked blocked only with explicit blocker details.

**Commit:**

```bash
git add .beads/artifacts/gpclub_final-my4/progress.txt .beads/artifacts/gpclub_final-my4/reflections.md
git commit -m "chore(gpclub_final-my4): record CMS i18n verification"
```

## Review Plan

After Wave 8 static verification, run full 5-agent review using `requesting-code-review` with this packet:

- Requirements: PRD success criteria in `.beads/artifacts/gpclub_final-my4/prd.md`.
- Diff range: `BASE_SHA=$(git rev-parse origin/main 2>/dev/null || git merge-base HEAD origin/main)` and `HEAD_SHA=$(git rev-parse HEAD)`.
- Risk areas: data loss in `home_content`, locale validation gaps, public route preview regression, corrupted Vietnamese copy, accessibility of inline validation.
- Already verified: include exact command outputs from Wave 8.

Auto-fix critical and important review findings when the fix is clear and scoped. Defer minor findings to bead comments/progress notes.

## Final Verification Commands

Run in this order before claiming completion:

```bash
npx tsc --noEmit --pretty false
npm run lint
npm run build
npx vite build --config vite.spa.config.ts
```

If a dev server/browser check is possible:

```bash
npm run dev
```

Then manually verify authenticated `/admin` Content Edit workflows described in Wave 8.

## Checkpoints

- No architecture checkpoint is required before Wave 1 because the PRD already decided to preserve `home_content` JSON, keep `vi/en` only, and treat publish checklist as a pre-save gate.
- Stop and ask only if implementation discovers a need for a DB migration, Korean public content, destructive row migration, or an irreversible reset/data rewrite.
- Stop and ask if authenticated admin verification requires credentials or live Supabase changes that are not available locally.

---

## 2026-07-08 Extension Plan: Admin CMS Form Architecture Refactor

**Goal:** Refactor the existing Content Edit form so operators work through a compact shell, shared field/media controls, focused homepage sections, and progressive disclosure while preserving the already-implemented `home_content` save/locale behavior.

**Architecture:** Keep `HomeEditorTab.tsx` as the state and persistence orchestrator. Extract presentation-only components into `src/components/admin/cms-form-fields.tsx`, `src/components/admin/cms-media-field.tsx`, `src/components/admin/cms-form-shell.tsx`, and `src/components/admin/home-content-sections.tsx`. Shared components must be dumb: receive values, labels, callbacks, validation counts/status, and do not import Supabase or content-tab state.

**Tech Stack:** React 18, TypeScript, existing shadcn-style `Button`, `Input`, `Label`, `Select`, `Textarea`, existing `AdminImageUploader`, native `<details>` for disclosure.

### Extension Must-Haves

1. `HomeEditorTab.tsx` no longer defines its own localized `TextPair`; homepage and non-home editors use one shared localized field primitive.
2. Page and section image controls use a shared media wrapper around `AdminImageUploader`; optional image descriptions stay optional and secondary.
3. The top Content Edit controls/status move into a reusable shell component, keeping save/reset/preview handlers owned by `HomeEditorTab`.
4. Homepage form groups render through focused section components rather than one long inline body.
5. Dense sections can be opened one at a time through accessible disclosure with section-level missing-field summaries.
6. Static gates run after implementation; authenticated browser QA remains a recorded manual gap if no admin Supabase session is available.

### Extension Dependency Graph

Task 9 (Shared CMS Form Primitives): needs existing Wave 2, creates `cms-form-fields.tsx`, modifies `HomeEditorTab.tsx` and `page-section-editor.tsx`.
Task 10 (Shared CMS Media Field): needs Task 9, creates `cms-media-field.tsx`, modifies `HomeEditorTab.tsx` and `page-section-editor.tsx`.
Task 11 (CMS Form Shell And Status Layout): needs Task 9, creates `cms-form-shell.tsx`, modifies `HomeEditorTab.tsx`.
Task 12 (Home Content Section Editors): needs Tasks 9 and 10, creates `home-content-sections.tsx`, modifies `HomeEditorTab.tsx`.
Task 13 (Progressive Disclosure And Section Status): needs Tasks 11 and 12, modifies `cms-form-shell.tsx`, `home-content-sections.tsx`, and `page-section-editor.tsx`.
Task 14 (Form Refactor Verification And Handoff): needs Task 13, modifies artifact notes only.

Wave 9: Task 9 (shared localized fields and panels)
Wave 10: Task 10 (shared media field)
Wave 11: Task 11 (form shell)
Wave 12: Task 12 (home section extraction)
Wave 13: Task 13 (progressive disclosure/status summaries)
Wave 14: Task 14 (verification, review handoff notes)

Because every extension task shares `HomeEditorTab.tsx` or adjacent form components, execute extension waves sequentially in the main agent. Do not dispatch parallel implementation agents for these waves.

## Wave 9: Shared CMS Form Primitives

### Task 9: Extract Shared Localized Field And Panel Primitives

**Files:**

- Create: `src/components/admin/cms-form-fields.tsx`
- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/components/admin/page-section-editor.tsx`

**Steps:**

1. Create `cms-form-fields.tsx` exporting:
   - `type CmsContentLang = "vi" | "en"`.
   - `type CmsLocalizedText = { vi: string; en: string }`.
   - `langLabel(lang)` returning `Tiếng Việt` or `English`.
   - `LocalizedTextField` with props `label`, `value`, `onChange`, `activeLang`, `compareMode`, and optional `multiline`.
   - `PlainTextField` for non-localized string inputs.
   - `CmsPanel` for a card section with `title`, optional `summary`, optional `children`.
2. Replace `TextPair` in `HomeEditorTab.tsx` with `LocalizedTextField` import.
3. Replace `TextPair`, `StringField`, and `Panel` in `page-section-editor.tsx` with shared primitives.
4. Keep current visual class names close to the existing implementation.

**Verification:**

- `rtk npx prettier --write src/components/admin/cms-form-fields.tsx src/components/admin/tabs/HomeEditorTab.tsx src/components/admin/page-section-editor.tsx`
- `rtk npm run lint`
- Code search confirms local `function TextPair` is gone from `HomeEditorTab.tsx` and `page-section-editor.tsx`.

## Wave 10: Shared CMS Media Field

### Task 10: Wrap AdminImageUploader With Shared Optional Metadata UI

**Files:**

- Create: `src/components/admin/cms-media-field.tsx`
- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`
- Modify: `src/components/admin/page-section-editor.tsx`

**Steps:**

1. Create `cms-media-field.tsx` exporting `CmsMediaField` for `{ url, alt }` images:
   - Wraps `AdminImageUploader`.
   - Accepts labels and upload props.
   - Renders optional localized image description inside native `<details>` using `LocalizedTextField`.
2. Export `CmsImageDetails` or a small helper for legacy home image slots where URL and alt arrays are stored separately.
3. Replace non-home hero media details in `PageTextEditor` with `CmsMediaField`.
4. Replace `ImageAssetField` internals in `page-section-editor.tsx` with `CmsMediaField`.
5. Keep home hero/image-slot legacy arrays compatible; do not reshape `HomeAdminContent`.

**Verification:**

- `rtk npx prettier --write src/components/admin/cms-media-field.tsx src/components/admin/tabs/HomeEditorTab.tsx src/components/admin/page-section-editor.tsx`
- `rtk npm run lint`
- Code check confirms optional image descriptions remain behind details and are not in required validation.

## Wave 11: CMS Form Shell And Status Layout

### Task 11: Extract Page Controls And Status Into Shell

**Files:**

- Create: `src/components/admin/cms-form-shell.tsx`
- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`

**Steps:**

1. Create `cms-form-shell.tsx` exporting `CmsFormShell` with props for title, description, page options, selected page, content language options, compare mode, preview, reload, reset, save, saving state, validation issues, and children.
2. Move only presentation markup from the top card in `HomeEditorTab.tsx` into the shell.
3. Keep all state, `load`, `save`, `resetDefaults`, `openPreview`, and validation calculation in `HomeEditorTab.tsx`.
4. Use `CmsFormShell` to wrap the selected page form body.

**Verification:**

- `rtk npx prettier --write src/components/admin/cms-form-shell.tsx src/components/admin/tabs/HomeEditorTab.tsx`
- `rtk npm run lint`
- Code check confirms `HomeEditorTab` still owns Supabase calls and the shell imports no Supabase client.

## Wave 12: Home Content Section Editors

### Task 12: Move Homepage Sections Out Of HomeEditorTab

**Files:**

- Create: `src/components/admin/home-content-sections.tsx`
- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`

**Steps:**

1. Create `home-content-sections.tsx` exporting `HomeContentSections`.
2. Move homepage hero, stats, partner hook, trust/pillars, process/images, and CTA rendering into focused internal components in that file.
3. Pass `form`, `onChange`, `contentLang`, `compareMode`, and `t` from `HomeEditorTab`.
4. Keep the same `HomeAdminContent` shape and immutable patch behavior.
5. Keep legacy home image URL/labels/alts array behavior intact.

**Verification:**

- `rtk npx prettier --write src/components/admin/home-content-sections.tsx src/components/admin/tabs/HomeEditorTab.tsx`
- `rtk tsc --noEmit --pretty false`
- Code check confirms `HomeEditorTab.tsx` no longer contains the full inline homepage section body.

## Wave 13: Progressive Disclosure And Section Status

### Task 13: Add Section-Level Disclosure And Validation Summaries

**Files:**

- Modify: `src/components/admin/home-content-sections.tsx`
- Modify: `src/components/admin/page-section-editor.tsx`
- Modify: `src/components/admin/cms-form-shell.tsx`
- Modify: `src/components/admin/tabs/HomeEditorTab.tsx`

**Steps:**

1. Add a shared or local `SectionDisclosure` pattern based on native `<details>`.
2. Open the first/most important section by default; keep other dense sections collapsed by default.
3. Pass validation issues from `HomeEditorTab` to section renderers as string paths, and display count summaries per section based on path prefix.
4. Wrap major homepage sections and page section editors in section-level disclosure without hiding the global publish checklist.
5. Keep optional image details as secondary nested details where already present.

**Verification:**

- `rtk npx prettier --write src/components/admin/home-content-sections.tsx src/components/admin/page-section-editor.tsx src/components/admin/cms-form-shell.tsx src/components/admin/tabs/HomeEditorTab.tsx`
- `rtk npm run lint`
- Code check confirms collapsed sections still surface missing counts and use native `<details>`/`<summary>`.

## Wave 14: Form Refactor Verification And Handoff

### Task 14: Run Gates, Review, And Record Progress

**Files:**

- Modify: `.beads/artifacts/gpclub_final-my4/progress.txt`
- Modify: `.beads/artifacts/gpclub_final-my4/reflections.md`

**Steps:**

1. Run final verification:
   - `rtk npm run lint`
   - `rtk tsc --noEmit --pretty false`
   - `rtk npm run build`
2. Run 5-agent review with `requesting-code-review` against the working tree/diff and the PRD extension scope.
3. Fix critical and important findings when the fix is clear and scoped.
4. Record any authenticated browser QA blocker if no admin Supabase session is available.
5. Append progress/reflection notes with changed files, verification results, review results, and remaining risks.

**Verification:**

- The three final static/build gates above must have fresh output before completion is claimed.
- `prd.json` tasks for the extension can be marked pass only after the relevant evidence exists.

## Extension Checkpoints

- Stop and ask before adding a new dependency, changing `home_content` schema, or converting the CMS into a schema-driven form builder.
- Stop and ask before destructive git cleanup because this workspace has broad pre-existing dirty/untracked files.
- Authenticated browser QA may remain a recorded manual gap if no admin Supabase session is available.
