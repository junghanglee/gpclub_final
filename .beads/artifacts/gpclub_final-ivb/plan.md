# Normalize Brand Management and Product Filtering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use skill({ name: "executing-plans" }) to implement this plan task-by-task.

**Goal:** Fully normalize product brand management so admin product assignment, public `/products` brand chips, catalog filtering, and product card brand tags use an authoritative brand model instead of a truncated free-text product slice.

**Architecture:** Add `public.brands` as the canonical brand entity, backfill `admin_products.brand_id`, and keep `admin_products.brand_name` as a synchronized compatibility/display field. Public product helpers will fetch normalized brand summaries from the full published catalog, and `/products` will render chip buttons and visible card tags from that metadata.

**Tech Stack:** React 18, TanStack Router/Start, React Query, Supabase JS, Supabase SQL migrations, shadcn/Radix UI primitives, Tailwind CSS, Playwright.

---

## Must-Haves

**Goal:** Users and admins can manage/filter products by stable brand identity, and `/products` no longer hides non-JMELLA brands because of the first 48 sorted rows.

### Observable Truths

1. Supabase has a `brands` table and every `admin_products` row has a valid `brand_id`.
2. `src/lib/catalog-products.ts` can fetch published brand summaries across the full published catalog.
3. `/products` renders brand filter chip buttons, not the existing brand dropdown.
4. Clicking a chip filters products by normalized brand identity.
5. Product cards in the all-products view show a prominent brand tag/sticky note.
6. Admin product editing assigns brands from managed brand rows, not arbitrary text.
7. Product catalog admin filtering uses normalized brand identity/canonical keys instead of exact raw text casing.

### Required Artifacts

| Artifact                        | Provides                                                                | Path                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Brands migration                | Canonical brand table, `admin_products.brand_id`, backfill, RLS/indexes | `supabase/migrations/20260706090000_create_brands_and_normalize_products.sql`                                           |
| Supabase types                  | Compile-time table/relationship support                                 | `src/integrations/supabase/types.ts`                                                                                    |
| Catalog product helpers         | Product query + brand summary API                                       | `src/lib/catalog-products.ts`                                                                                           |
| Admin brands tab                | Minimal brand management surface                                        | `src/components/admin/tabs/BrandsTab.tsx`                                                                               |
| Product admin changes           | Brand picker/filter via `brands`                                        | `src/components/admin/tabs/ProductsTab.tsx`                                                                             |
| Admin tabs wiring               | Brands tab entry under Product Management                               | `src/components/admin/AdminPage.tsx`                                                                                    |
| Public products UI              | Chip buttons + card brand tags                                          | `src/routes/products.tsx`                                                                                               |
| Catalog filtering compatibility | Canonical brand filtering in catalog admin/public surfaces              | `src/components/admin/tabs/ProductCatalogsTab.tsx`, `src/routes/catalog.index.tsx`, `src/routes/catalog.$catalogId.tsx` |
| Runtime smoke script            | Browser evidence for chips and tag rendering                            | temporary Playwright script via `node` stdin or artifact note                                                           |

### Key Links

| From               | To                       | Via                                                    | Risk                                                      |
| ------------------ | ------------------------ | ------------------------------------------------------ | --------------------------------------------------------- |
| `/products`        | Supabase products/brands | `useCatalogProducts`, new `usePublishedBrandSummaries` | Chip counts must not depend on `limit=48`.                |
| Admin product form | `admin_products`         | `brand_id` + synced `brand_name` payload               | Existing rows/components still expect `brand_name`.       |
| Product catalogs   | product rows             | brand display and filters                              | Exact raw-text filters can miss migrated/cased values.    |
| RLS                | public brand summaries   | `brands` and `admin_products` policies                 | Public should see only published products/brand metadata. |

## Dependency Graph

### Task Dependencies

Task A (Schema): needs nothing, creates migration and updates seed/backfill rules.
Task B (Types): needs Task A, updates Supabase TypeScript types.
Task C (Data layer): needs Task B, updates `src/lib/catalog-products.ts` with brand-aware types/helpers.
Task D (Admin brand management): needs Task C, creates `BrandsTab` and updates product admin/wiring.
Task E (Public products UX): needs Task C, updates `/products` chips/card tags.
Task F (Catalog/adjacent compatibility): needs Task C, updates catalog/home/detail/B2B/Gippy compatibility where required.
Task G (Verification): needs Tasks D/E/F, runs SQL/runtime/build/lint checks and updates progress/reflections.

Wave 1: Task A (schema)
Wave 2: Task B (types)
Wave 3: Task C (data layer)
Wave 4: Task D, Task E, Task F (file-disjoint except shared imports; execute sequentially in current agent because this branch has dirty bead artifacts)
Wave 5: Task G (verification/review/compound)

## Task 1: Normalize Brand Schema

**Files:**

- Create: `supabase/migrations/20260706090000_create_brands_and_normalize_products.sql`
- Modify: `scripts/seed-supabase.ts`

**Steps:**

1. Create a migration that:
   - creates `public.brands` with `id uuid primary key default gen_random_uuid()`, `key text`, `slug text`, `name text`, `description text`, `published boolean default true`, `sort_order integer default 0`, `created_at`, `updated_at`;
   - adds uniqueness on `key` and `slug`;
   - enables RLS;
   - grants public select only for `published = true` and admin full mutation through `has_role`;
   - adds `admin_products.brand_id uuid references public.brands(id)`;
   - inserts canonical brands for `jmsolution`, `jmella`, `gpclub`, and `unknown-brand`;
   - backfills by normalized `brand_name`, mapping `JMELLA`/`Jmella` to `jmella`, `JMsolution` to `jmsolution`, `GPCLUB` to `gpclub`, and empty/malformed to `unknown-brand`;
   - synchronizes `brand_name` from `brands.name` for backfilled rows;
   - sets `brand_id` not null after backfill;
   - adds indexes for `admin_products(brand_id)`, `admin_products(published, brand_id, sort_order desc, created_at desc)`, and `brands(published, sort_order, name)`;
   - creates triggers for `brands.updated_at` and optional `admin_products.brand_name` synchronization on brand changes.
2. Update seed script product insert/update payloads to resolve or insert brands before inserting products, then write `brand_id` plus display `brand_name`.
3. Run a syntax check by reading the migration and searching for required clauses.

**Verification:**

- `Select-String supabase/migrations/20260706090000_create_brands_and_normalize_products.sql -Pattern "create table if not exists public.brands|brand_id|not null|Public can view published brands|admin_products_brand_id"`
- `npm run build` after all TypeScript consumers are updated.

## Task 2: Update Supabase Types

**Files:**

- Modify: `src/integrations/supabase/types.ts`

**Steps:**

1. Add a `brands` table shape under `Database.public.Tables` with Row/Insert/Update/Relationships fields.
2. Add `brand_id: string` to `admin_products.Row`, optional `brand_id?: string` to Insert/Update.
3. Replace the `admin_products.Relationships: []` with a relationship to `brands.id`.
4. Keep existing `brand_name` fields intact for compatibility.

**Verification:**

- `npm run build` after data/admin/UI updates.

## Task 3: Update Catalog Product Data Layer

**Files:**

- Modify: `src/lib/catalog-products.ts`

**Steps:**

1. Extend `CatalogProduct` with `brand_id: string | null`, optional `brand_key`, `brand_slug`, and `brand_display_name` fields.
2. Add `CatalogBrandSummary` type with `id`, `key`, `slug`, `name`, `count`, `sort_order`.
3. Update list/detail select columns to include `brand_id` and joined `brands(id,key,slug,name,sort_order,published)`.
4. Normalize joined rows so legacy `brand_name` still renders, but `brand_display_name` prefers joined brand name.
5. Add `fetchPublishedCatalogBrandSummaries()` that fetches all published products with joined published brands and returns counts over the full catalog.
6. Add `usePublishedCatalogBrandSummaries()` with React Query caching.
7. Add optional `brandId`/`brandKey` filter support to `fetchPublishedCatalogProducts` and `useCatalogProducts`, keeping the existing `limit` default for existing consumers.
8. Keep error handling consistent with existing public timeout behavior.

**Verification:**

- `npm run build` after consumers are updated.
- Runtime `/products` network checks should show a brand summary request independent of `limit=48`.

## Task 4: Update Admin Brand Management

**Files:**

- Create: `src/components/admin/tabs/BrandsTab.tsx`
- Modify: `src/components/admin/AdminPage.tsx`
- Modify: `src/components/admin/tabs/ProductsTab.tsx`

**Steps:**

1. Create `BrandsTab` that lists brands, allows create/edit of `name`, `key`, `slug`, `published`, `sort_order`, and saves to `supabase.from("brands")`.
2. Add lazy import/preload/wiring for `BrandsTab` under Product Management tabs.
3. In `ProductsTab`, load brands separately from products.
4. Replace free-text brand input with `Select` sourced from brands.
5. Store `brand_id` and synchronized `brand_name` in create/edit payloads.
6. Update admin brand filter to use selected `brand_id` instead of exact `brand_name` where possible.
7. Keep quick table display showing `brand_display_name`/`brand_name` for compatibility.

**Verification:**

- `npm run build`.
- Manual admin smoke if auth/session available: product form shows managed brand options.

## Task 5: Update Products Page Brand UX

**Files:**

- Modify: `src/routes/products.tsx`

**Steps:**

1. Replace brand dropdown state with selected brand id/key state while keeping `All` as sentinel.
2. Use `usePublishedCatalogBrandSummaries()` for chip data and counts.
3. Use `useCatalogProducts({ limit: 0, brandId })` or full product rows filtered client-side by brand id if server-side filter is not viable with current generated types.
4. Render brand chip buttons as native `button`/`Button` controls with `aria-pressed` and visible selected state.
5. Keep type filter/search behavior stable.
6. Update totals so `All` count comes from full published brand summary/product rows, not a limited slice.
7. Add a visible brand tag/sticky badge in `ProductCard`, preferably near the image top edge.
8. Remove unused dropdown imports if brand dropdown no longer needs them; keep product type dropdown if still used.

**Verification:**

- Browser DOM has brand chip buttons and no brand dropdown trigger.
- Clicking each brand chip filters products to that brand.
- Product cards in All view show visible brand tags.

## Task 6: Update Catalog and Adjacent Consumers

**Files:**

- Modify: `src/components/admin/tabs/ProductCatalogsTab.tsx`
- Modify as needed: `src/routes/catalog.index.tsx`, `src/routes/catalog.$catalogId.tsx`, `src/routes/index.tsx`, `src/routes/products.$productId.tsx`, `src/routes/b2b.tsx`, `src/components/site/GippyChat.tsx`

**Steps:**

1. Update catalog admin product filter options to dedupe by normalized brand id/display name instead of exact raw text.
2. Preserve product brand display in catalog routes using `brand_display_name ?? brand_name`.
3. Confirm product detail and B2B inquiry text continue using display brand name.
4. For Gippy, use a wider or brand-aware catalog query where needed to avoid the original top-48 visibility bias.
5. Keep changes minimal outside files that fail build or directly consume changed data shapes.

**Verification:**

- `npm run build`.
- Product catalog admin filter logic can match migrated brand casing.

## Task 7: Verify, Review, and Compound

**Files:**

- Modify: `.beads/artifacts/gpclub_final-ivb/progress.txt`
- Create/modify: `.beads/artifacts/gpclub_final-ivb/reflections.md`

**Steps:**

1. Run lint and build.
2. Run a Playwright smoke script against local `/products` if dev server is available; otherwise start a dev server and run the check.
3. Dispatch full review agents because this change touches schema, admin, public UI, and data helpers.
4. Auto-fix Critical/Important issues that are clear and verify again.
5. Record compound learnings in memory observations and append progress/reflection notes.

**Verification:**

- `npm run lint` exits 0.
- `npm run build` exits 0.
- Playwright confirms brand chips and visible card brand tags on `/products`.
- Review synthesis reports no unresolved Critical/Important issues.
