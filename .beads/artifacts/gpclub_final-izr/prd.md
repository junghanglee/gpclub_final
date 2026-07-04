# Shared Skeleton Components for Public Loading

## Bead Metadata

depends_on: []
parallel: true
conflicts_with: []
blocks: []
estimated_hours: 6

## Problem Statement

Public pages currently mix three different behaviors: static UI, remote-data loading, and fallback data. That makes some sections look populated with fake records while other sections collapse to text-only loading states. Users should see the page structure immediately, but dynamic content areas must show skeletons until real data arrives.

## Scope

### In Scope

- Create a shared public skeleton component set for reusable section-shaped loading states.
- Replace route-local loading text, fake preview objects, and fallback records/images used for dynamic loading with shared skeleton components.
- Keep static UI visible immediately: route hero areas, fixed headings, CTAs, forms, static cards, and local design assets that are not pretending to be remote records.
- Use skeletons for sections backed by remote products, product details, catalogs, events, FAQs, company settings, contact settings, and product-derived B2B images.
- Show empty states only after loading has finished and real data is empty or unavailable.

### Out of Scope

- Admin/editor-only loading behavior.
- Adding new data sources, database columns, or public content models.
- Rewriting routing, SSR, Supabase clients, or React Query architecture.
- Visual redesign beyond replacing loading states with skeletons that preserve existing layouts.
- Using hardcoded dynamic records to simulate loaded products, catalogs, events, contacts, or FAQs.

## Requirements

- Public pages must render fixed/static sections immediately without waiting for remote data.
- Dynamic content sections must render shared skeleton components during loading.
- Dynamic loading must not use fallback data objects, fake titles, fake product cards, fake event cards, fake catalog metadata, or fallback product images that imply real data exists.
- After loading completes with no data, routes must render explicit empty states, not skeletons and not fake content.
- Skeleton components must be presentational only; they must not fetch data or encode product/event/catalog copy.
- Skeleton components must preserve the shape of the target section closely enough that layout does not jump when data resolves.
- Fullscreen loading gates must stay out of ordinary public route flows unless a route genuinely cannot render any static shell.
- Existing static copy defaults may remain for fixed page framing, but record-like dynamic collections must use skeletons while loading.

## Success Criteria

- Verify: `rtk npm run build` passes.
- Verify: `rtk npx eslint src/components/site src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx` passes.
- Verify: `rtk npx prettier --check .beads/artifacts/gpclub_final-izr/prd.md .beads/artifacts/gpclub_final-izr/plan.md .beads/artifacts/gpclub_final-izr/prd.json src/components/site src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx` passes.
- Verify: no product/catalog/event/contact/B2B dynamic loading section renders fake loaded records while its loading flag is true.
- Verify: product, catalog, events, B2B, and contact pages keep their static framing visible while dynamic sections show skeletons.

## Technical Context

- `src/routes/products.tsx` and `src/routes/products.$productId.tsx` contain product grid/detail loading states that should use shared product/detail skeletons.
- `src/routes/catalog.index.tsx` and `src/routes/catalog.$catalogId.tsx` contain catalog loading states and must not create fake catalog metadata for dynamic detail loading.
- `src/routes/events.tsx` contains event/new-product dynamic sections that should use shared event/product skeletons without fake event titles.
- `src/routes/b2b.tsx` contains catalog-derived brand/product image slots that should show image skeletons while catalog rows load.
- `src/routes/contact.tsx` contains company/contact/FAQ data sections that should show row/card/accordion skeletons while settings and FAQ data load.
- `src/components/site/LoadingModal.tsx` may remain for true blocking flows, but ordinary public dynamic sections should use inline shared skeletons instead.
- `src/lib/catalog-products.ts` and `src/lib/product-catalogs.ts` may return empty arrays/null on error; routes decide whether to show skeletons during loading or empty states after loading.

## Affected Files

- `src/components/site/SectionSkeletons.tsx`
- `src/routes/products.tsx`
- `src/routes/products.$productId.tsx`
- `src/routes/catalog.index.tsx`
- `src/routes/catalog.$catalogId.tsx`
- `src/routes/events.tsx`
- `src/routes/b2b.tsx`
- `src/routes/contact.tsx`
- `src/routes/index.tsx`
- `src/routes/brand.tsx`
- `src/routes/gippy-ai.tsx`
- `src/router.tsx`
- `src/components/site/LoadingModal.tsx`
- `src/lib/catalog-products.ts`
- `src/lib/product-catalogs.ts`
- `src/lib/page-content.tsx`
- `src/lib/home-content.tsx`
- `src/lib/site-settings.tsx`

## Tasks

### [component] Add shared public skeleton components

Public routes have a reusable skeleton component set for section headers, product cards, event cards, contact rows, image slots, and detail panels.

**Metadata:**

```yaml
depends_on: []
parallel: false
conflicts_with: []
files:
  - src/components/site/SectionSkeletons.tsx
```

**Verification:**

- `rtk npx eslint src/components/site/SectionSkeletons.tsx`
- `rtk npx prettier --check src/components/site/SectionSkeletons.tsx`

### [functional] Convert product and catalog dynamic loading to shared skeletons

Product and catalog routes use shared skeletons while product rows, product details, catalog metadata, and catalog product selections are loading, and they do not create fake dynamic records.

**Metadata:**

```yaml
depends_on:
  - Add shared public skeleton components
parallel: true
conflicts_with: []
files:
  - src/routes/products.tsx
  - src/routes/products.$productId.tsx
  - src/routes/catalog.index.tsx
  - src/routes/catalog.$catalogId.tsx
  - src/lib/catalog-products.ts
  - src/lib/product-catalogs.ts
```

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx`
- `rtk npx prettier --check src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx`
- `Select-String -Path src/routes/catalog.$catalogId.tsx -Pattern 'createCatalogPreview'` returns no matches.

### [functional] Convert events, B2B, and contact dynamic loading to shared skeletons

Events, B2B, and contact routes keep static section framing visible while remote event rows, catalog-derived images, company settings, contact settings, and FAQs load through shared skeletons.

**Metadata:**

```yaml
depends_on:
  - Add shared public skeleton components
parallel: true
conflicts_with: []
files:
  - src/routes/events.tsx
  - src/routes/b2b.tsx
  - src/routes/contact.tsx
  - src/lib/site-settings.tsx
```

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx`
- `rtk npx prettier --check src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx`
- Dynamic skeletons in these routes contain no fake event, product, company, or FAQ copy.

### [functional] Preserve static shells on remaining public pages

Homepage, brand, Gippy AI, and router pending behavior keep static UI visible and use skeletons only for remote dynamic sections that would otherwise block or fake data.

**Metadata:**

```yaml
depends_on:
  - Add shared public skeleton components
parallel: true
conflicts_with: []
files:
  - src/routes/index.tsx
  - src/routes/brand.tsx
  - src/routes/gippy-ai.tsx
  - src/router.tsx
  - src/components/site/LoadingModal.tsx
  - src/lib/home-content.tsx
  - src/lib/page-content.tsx
```

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/routes/index.tsx src/routes/brand.tsx src/routes/gippy-ai.tsx src/router.tsx src/components/site/LoadingModal.tsx`
- `rtk npx prettier --check src/routes/index.tsx src/routes/brand.tsx src/routes/gippy-ai.tsx src/router.tsx src/components/site/LoadingModal.tsx`

### [quality] Verify skeleton contract across public routes

The completed implementation passes build and targeted lint, and public dynamic sections follow the skeleton-while-loading then empty-state-after-loading contract.

**Metadata:**

```yaml
depends_on:
  - Convert product and catalog dynamic loading to shared skeletons
  - Convert events, B2B, and contact dynamic loading to shared skeletons
  - Preserve static shells on remaining public pages
parallel: false
conflicts_with: []
files:
  - src/components/site/SectionSkeletons.tsx
  - src/routes/products.tsx
  - src/routes/products.$productId.tsx
  - src/routes/catalog.index.tsx
  - src/routes/catalog.$catalogId.tsx
  - src/routes/events.tsx
  - src/routes/b2b.tsx
  - src/routes/contact.tsx
  - src/routes/index.tsx
  - src/routes/brand.tsx
  - src/routes/gippy-ai.tsx
```

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/components/site src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx src/routes/index.tsx src/routes/brand.tsx src/routes/gippy-ai.tsx`
- Manual route check: `/products`, `/catalog`, `/events`, `/b2b`, and `/contact` show static shell immediately and skeletons only for dynamic sections while loading.
