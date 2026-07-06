# Normalize Brand Management and Product Filtering

## Bead Metadata

```yaml
depends_on: []
parallel: false
conflicts_with: []
blocks: []
estimated_hours: 18
```

## Problem Statement

The product catalog currently treats brand as free text on `admin_products.brand_name`. Admin users type brand names manually, public `/products` builds brand filters from a limited product slice, and several public/admin surfaces infer brand identity differently. The recent audit proved that the database has multiple published brands, but `/products` shows only `JMELLA` because the first 48 published rows are all `JMELLA` and the brand dropdown is derived from that truncated response.

WHEN a catalog has published products across multiple brands, THEN `/products` must expose every published brand as visible chip filters regardless of product sort order.

WHEN a user selects a brand chip, THEN the product grid must show only published products for that brand.

WHEN a user selects all products, THEN product cards must show a clear brand tag/sticky note so mixed-brand results remain understandable.

WHEN an admin creates or edits a product, THEN brand assignment must come from an authoritative brand entity, not arbitrary free text.

## Goals

- Replace free-text brand management with normalized brand entities.
- Migrate existing product brand data to required product-brand relationships.
- Preserve a safe compatibility path for code that still renders `brand_name` during migration.
- Update `/products` brand filtering from dropdown to visible chip buttons.
- Ensure filter counts and total counts come from the full published catalog, not the first 48 rows.
- Show brand identity clearly on product cards, especially in the `All` view.
- Clean existing brand data inconsistencies found in the audit.

## Non-Goals

- Redesign the entire products page visual system beyond the brand filter/card tag requirements.
- Replace product type filtering unless needed to keep layout coherent.
- Rewrite Gippy recommendation logic beyond preventing brand visibility regressions in the shared catalog data path.
- Remove every legacy `brand_name` render in one pass if compatibility requires a transition field.
- Build external CMS integrations for brand content.

## Scope

### In Scope

- Supabase migration adding a `brands` table and product-brand relationship.
- Data backfill from existing `admin_products.brand_name` values.
- Cleanup handling for `JMELLA`/`Jmella`, empty brand rows, and current sort-order skew.
- Supabase generated type updates.
- Admin product form/filter updates to use normalized brands.
- A brand management admin surface or section sufficient to create, publish, sort, and rename brands.
- Public catalog helpers that fetch published brand summaries and filter products by brand identity.
- `/products` chip-based brand filter UX and visible brand sticky tag/card badge.
- Product catalog admin/public filters updated to use normalized brand identity or compatibility display safely.
- Verification through SQL/read-only data checks, lint/build, and Playwright runtime checks.

### Out of Scope

- Full content migration of `/brand` editorial pages unless needed for navigation correctness.
- Rewriting static marketing copy that mentions brands.
- Changing B2B inquiry schema except where brand identity is forwarded from product data.
- Deleting compatibility columns before all consumers are migrated and verified.

## Technical Context

- `src/lib/catalog-products.ts` defines `CatalogProduct` with `brand_name`, fetches `admin_products`, filters `published = true`, orders by `sort_order desc, created_at desc`, and `useCatalogProducts()` defaults to `limit = 48`.
- `src/routes/products.tsx` calls `useCatalogProducts()` without options, builds `brandOptions` and counts from `rows`, renders `ProductRadixFilter` dropdown, filters client-side by normalized `brand_name`, and renders small brand text on cards.
- `src/components/admin/tabs/ProductsTab.tsx` stores `brand_name` through a text input and filters by `canonicalBrandName(brandFilter)`. Its brand dropdown is based on current paged rows plus hardcoded labels.
- `src/components/admin/tabs/ProductCatalogsTab.tsx` loads all `admin_products`, derives brand filters from product rows, and filters with exact `product.brand_name === brandFilter`.
- `supabase/migrations/20260603201300_create_admin_products.sql` creates `admin_products` with `brand_name text not null default ''` and no `brand_id`.
- `.opencode/artifacts/products-brand-visibility-audit/audit.md` records runtime evidence: public `/products` request returned 48 rows, all `JMELLA`; full-table evidence showed 347 published rows across `JMsolution`, `JMELLA`, `Jmella`, `GPCLUB`, and one empty brand row.
- `src/lib/brand-details.ts` stores editorial brand details in `home_content.brand_details`; this is not currently the product brand authority.
- `src/routes/brand.tsx`, `src/routes/b2b.tsx`, `src/components/site/GippyChat.tsx`, catalog routes, and home product cards render or reason about brand names and must be checked for compatibility.

## Proposed Solution

Implement Option C as a full normalization program with a controlled transition:

1. Add an authoritative `public.brands` table with stable identifiers, display names, slugs/keys, publication state, and ordering.
2. Add `admin_products.brand_id` and backfill it from normalized `brand_name` values.
3. Make product brand assignment required after backfill, while retaining `brand_name` as a denormalized display/compatibility column during rollout.
4. Update product/admin/catalog/public helpers to use `brand_id`/brand joins for filtering and summaries.
5. Replace `/products` brand dropdown with accessible chip buttons sourced from full published brand summaries.
6. Add visible brand tags/sticky notes to product cards in mixed-brand views.
7. Verify data correctness with SQL, runtime browser checks, and build/lint gates.

## Functional Requirements

### Data Model

- `brands` must include at minimum: `id`, `key` or `slug`, `name`, `published`, `sort_order`, `created_at`, and `updated_at`.
- `admin_products.brand_id` must reference `brands.id`.
- Existing `admin_products` rows must be backfilled to valid brands before enforcing required product-brand relationships.
- `JMELLA` and `Jmella` must resolve to one brand identity unless explicitly configured otherwise.
- Empty brand rows must be repaired or assigned to a deliberate fallback brand before `brand_id` is required.

### Admin

- Product creation/editing must use a brand picker/select/chip sourced from `brands`.
- Admin product filters must use normalized brand identity, not current page row strings.
- Admin must have a way to manage brand name, slug/key, publish state, and sort order.
- Product saves must persist `brand_id`; compatibility `brand_name` must be kept synchronized while still used.

### Public `/products`

- Brand filters must be visible chip buttons, not a dropdown/select box.
- The chip list must include every published brand with at least one published product.
- Chip counts must represent published products for that brand across the full catalog.
- Selecting a brand chip must filter products by that brand identity.
- Selecting all must show all published products in the current catalog scope.
- Product cards must show a clear brand tag/sticky note so users can identify the brand while browsing all products.
- Total/count labels must not describe a limited fetch as the total registered catalog.

### Catalog and Adjacent Consumers

- Product catalog admin filters must use normalized brand identity.
- Public catalog display must still show correct brand names.
- Product detail and B2B inquiry flows must preserve brand display names.
- Gippy/home/B2B routes must not regress due to removal or change of `brand_name` assumptions.

## Non-Functional Requirements

- Migrations must be idempotent and safe to run against the current Supabase project.
- Public reads must preserve RLS behavior: anonymous users only see published products and published brand metadata needed for catalog browsing.
- The `/products` page must not depend on fetching only the first 48 products for filter correctness.
- Brand chip controls must be keyboard-accessible native buttons with selected state conveyed visually and semantically.
- Loading, empty, and no-results states must remain clear after the filter UI changes.
- No secrets may be printed during verification or data scripts.

## Success Criteria

- Verify: SQL shows every `admin_products` row has a non-null valid `brand_id` after migration.
- Verify: SQL shows `JMELLA`/`Jmella` product rows map to one canonical brand unless intentionally split.
- Verify: SQL shows no published product has an empty or unknown brand relation.
- Verify: Browser runtime on `/products` shows brand chips for all published product brands, including brands outside the first 48 sorted products.
- Verify: Clicking each brand chip filters the grid to that brand only.
- Verify: Clicking `All` shows mixed-brand results with visible brand tags on product cards.
- Verify: Admin product create/edit assigns brands from managed brand entities.
- Verify: Product catalog admin filtering still works after brand normalization.
- Verify: `npm run lint` exits 0.
- Verify: `npm run build` exits 0.
- Verify: Playwright smoke test of `/products` exits 0 and confirms chip labels/counts match SQL summary.

## Affected Files

- `supabase/migrations/*_create_brands_and_normalize_products.sql`
- `src/integrations/supabase/types.ts`
- `src/lib/catalog-products.ts`
- `src/lib/brand-details.ts`
- `src/components/admin/tabs/ProductsTab.tsx`
- `src/components/admin/tabs/ProductCatalogsTab.tsx`
- `src/components/admin/AdminPage.tsx`
- `src/routes/products.tsx`
- `src/routes/products.$productId.tsx`
- `src/routes/catalog.index.tsx`
- `src/routes/catalog.$catalogId.tsx`
- `src/routes/index.tsx`
- `src/routes/b2b.tsx`
- `src/components/site/GippyChat.tsx`
- `scripts/seed-supabase.ts`
- `.opencode/artifacts/products-brand-visibility-audit/audit.md`

## Risks

- Full normalization touches many consumers of `brand_name`; removing or changing it too early can break product cards, catalogs, B2B inquiry text, and Gippy recommendations.
- Existing production data has dirty brand values and one empty brand row, so the backfill must be explicit and verified.
- Public RLS for joined brand/product data may need careful policies so anonymous catalog browsing works without exposing admin-only rows.
- Query changes can reintroduce loading regressions previously fixed in `e15b052` and `3be9753`.
- Chip UI can become cramped on mobile if counts and labels are not responsive.

## Open Questions

- Should `GPCLUB` remain a product brand in the public catalog or be treated as internal/company-level content?
- Should brand editorial content currently stored in `home_content.brand_details` be migrated into `brands` now or in a follow-up?
- Should product sorting become brand-local after selecting a brand, or continue global `sort_order desc, created_at desc`?

## Tasks

### Normalize Brand Schema [database]

The database has a `brands` authority table and every product has a valid required brand relationship while retaining compatibility display data.

**Metadata:**

```yaml
depends_on: []
parallel: false
conflicts_with:
  [
    "Update Supabase Types",
    "Update Catalog Product Data Layer",
    "Update Admin Product Brand Management",
  ]
files:
  - supabase/migrations/*_create_brands_and_normalize_products.sql
  - scripts/seed-supabase.ts
```

**Verification:**

- Verify: `select count(*) from public.admin_products where brand_id is null;` returns `0` after migration.
- Verify: `select b.name, count(*) from public.admin_products p join public.brands b on b.id = p.brand_id group by b.name order by b.name;` returns expected canonical brand counts.
- Verify: migration can be run against current schema without duplicate-object errors.

### Update Supabase Types [types]

Generated Supabase TypeScript types include `brands`, `admin_products.brand_id`, and the product-brand relationship.

**Metadata:**

```yaml
depends_on: ["Normalize Brand Schema"]
parallel: false
conflicts_with: ["Update Catalog Product Data Layer", "Update Admin Product Brand Management"]
files:
  - src/integrations/supabase/types.ts
```

**Verification:**

- Verify: TypeScript references to `brands` and `admin_products.brand_id` compile without local hand-written `any` casts.
- Verify: `npm run build` exits 0 after type updates and consumer changes.

### Update Catalog Product Data Layer [data]

Public catalog helpers expose normalized brand identity, published brand summaries, and product queries that can filter by brand without depending on the first 48 rows.

**Metadata:**

```yaml
depends_on: ["Normalize Brand Schema", "Update Supabase Types"]
parallel: false
conflicts_with: ["Update Products Page Brand UX", "Update Adjacent Product Consumers"]
files:
  - src/lib/catalog-products.ts
```

**Verification:**

- Verify: public brand summary query returns all published brands with published product counts.
- Verify: product query filtered by a brand identity returns only products for that brand.
- Verify: unfiltered product query no longer determines brand chip availability from a limited page.

### Update Admin Product Brand Management [admin]

Admin users can manage brands and assign products to normalized brands without typing arbitrary brand text.

**Metadata:**

```yaml
depends_on: ["Normalize Brand Schema", "Update Supabase Types"]
parallel: false
conflicts_with: ["Update Product Catalog Admin Brand Filtering"]
files:
  - src/components/admin/AdminPage.tsx
  - src/components/admin/tabs/ProductsTab.tsx
  - src/components/admin/tabs/BrandsTab.tsx
```

**Verification:**

- Verify: admin product form displays managed brand options.
- Verify: creating a product stores `brand_id` and synchronized display brand data.
- Verify: editing a product brand moves it to the correct admin brand filter.
- Verify: unpublished brands cannot be accidentally exposed as public filter chips unless they have intended public state.

### Update Products Page Brand UX [ui]

The public products page uses visible accessible brand chip buttons and cards show clear brand tags in all-product browsing.

**Metadata:**

```yaml
depends_on: ["Update Catalog Product Data Layer"]
parallel: false
conflicts_with: ["Update Adjacent Product Consumers"]
files:
  - src/routes/products.tsx
```

**Verification:**

- Verify: browser DOM for `/products` contains brand chip buttons, not the previous brand dropdown menu.
- Verify: clicking a brand chip filters visible products to that brand.
- Verify: clicking the all chip restores mixed-brand results.
- Verify: each product card in the all view has a visible brand tag/sticky note.

### Update Product Catalog Admin Brand Filtering [admin]

Product catalog selection and catalog displays use normalized brand identity and preserve correct brand labels.

**Metadata:**

```yaml
depends_on: ["Update Admin Product Brand Management", "Update Catalog Product Data Layer"]
parallel: false
conflicts_with: ["Update Adjacent Product Consumers"]
files:
  - src/components/admin/tabs/ProductCatalogsTab.tsx
  - src/routes/catalog.index.tsx
  - src/routes/catalog.$catalogId.tsx
```

**Verification:**

- Verify: catalog product selection filtered by brand returns all matching products regardless of casing legacy data had before migration.
- Verify: public catalog pages render expected brand names for selected products.

### Update Adjacent Product Consumers [compatibility]

Home, product detail, B2B, and Gippy continue to render and reason about product brands correctly after normalization.

**Metadata:**

```yaml
depends_on: ["Update Catalog Product Data Layer"]
parallel: false
conflicts_with: ["Update Products Page Brand UX", "Update Product Catalog Admin Brand Filtering"]
files:
  - src/routes/index.tsx
  - src/routes/products.$productId.tsx
  - src/routes/b2b.tsx
  - src/components/site/GippyChat.tsx
```

**Verification:**

- Verify: product detail page shows the correct brand and B2B inquiry includes it.
- Verify: home featured products render brand labels without runtime errors.
- Verify: Gippy product recommendations are not limited to a brand-hidden 48-row slice when brand diversity matters.

### Verify Migration and Runtime Behavior [verification]

The implementation is validated with SQL checks, lint/build, and browser runtime checks against the original failure mode.

**Metadata:**

```yaml
depends_on:
  - "Update Products Page Brand UX"
  - "Update Product Catalog Admin Brand Filtering"
  - "Update Adjacent Product Consumers"
parallel: false
conflicts_with: []
files:
  - .beads/artifacts/gpclub_final-ivb/progress.txt
```

**Verification:**

- Verify: SQL full-table brand counts match `/products` chip counts.
- Verify: Playwright opens `/products`, observes all expected brand chips, clicks each chip, and confirms card brand tags.
- Verify: `npm run lint` exits 0.
- Verify: `npm run build` exits 0.
