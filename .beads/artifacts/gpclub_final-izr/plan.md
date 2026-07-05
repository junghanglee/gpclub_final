# Shared Skeleton Components Implementation Plan

> Required before shipping: implement Option B. Shared skeleton components become the canonical loading pattern for public dynamic sections. Do not use fallback dynamic data to make loading sections look populated.

## Goal

Public pages keep fixed UI visible immediately, and every remote-data section renders a matching skeleton while loading. Once loading finishes, the section shows real data or an explicit empty state.

## Contract

1. Static UI renders immediately: heroes, fixed headings, CTAs, forms, fixed section containers, and local design assets.
2. Dynamic data does not render fallback records while loading: product rows/details, catalog metadata, event rows, company/contact settings, FAQs, and product-derived B2B image slots use skeletons.
3. Skeletons are shared components from `src/components/site/SectionSkeletons.tsx` and contain no fake product/event/catalog/contact/FAQ copy.
4. Empty states appear only after the relevant loading flag is false.
5. Fullscreen loading remains reserved for true blocking flows, not ordinary public route data.

## Required Components

Create `src/components/site/SectionSkeletons.tsx` with presentational skeletons that can be composed per route:

- `SectionHeaderSkeleton`
- `ProductCardSkeleton`
- `EventCardSkeleton`
- `ContactRowSkeleton`
- `ImageSlotSkeleton`
- Detail/row helpers as needed, kept generic and data-free

## Task Dependencies

Wave 1:

- Task 1: Add shared skeleton components.

Wave 2:

- Task 2: Product and catalog routes consume shared skeletons.
- Task 3: Events, B2B, and contact routes consume shared skeletons.
- Task 4: Homepage, brand, Gippy AI, and router pending behavior follow the same static-vs-dynamic rule.

Wave 3:

- Task 5: Verify build, targeted lint, formatting, and route behavior.

## Task 1: [component] Add shared public skeleton components

**End state:** Public routes have a reusable skeleton component set for section headers, product cards, event cards, contact rows, image slots, and detail panels.

**Files:**

- Create: `src/components/site/SectionSkeletons.tsx`

**Verification:**

- `rtk npx eslint src/components/site/SectionSkeletons.tsx`
- `rtk npx prettier --check src/components/site/SectionSkeletons.tsx`

## Task 2: [functional] Convert product and catalog dynamic loading to shared skeletons

**End state:** Product and catalog routes use shared skeletons while dynamic product/catalog data loads and do not create fake product or catalog records.

**Files:**

- Modify: `src/routes/products.tsx`
- Modify: `src/routes/products.$productId.tsx`
- Modify: `src/routes/catalog.index.tsx`
- Modify: `src/routes/catalog.$catalogId.tsx`
- Inspect: `src/lib/catalog-products.ts`
- Inspect: `src/lib/product-catalogs.ts`

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx`
- `rtk npx prettier --check src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx`
- `Select-String -Path src/routes/catalog.$catalogId.tsx -Pattern 'createCatalogPreview'` returns no matches.

## Task 3: [functional] Convert events, B2B, and contact dynamic loading to shared skeletons

**End state:** Events, B2B, and contact routes preserve their static section framing while dynamic rows/images/settings/FAQs load through shared skeletons.

**Files:**

- Modify: `src/routes/events.tsx`
- Modify: `src/routes/b2b.tsx`
- Modify: `src/routes/contact.tsx`
- Inspect: `src/lib/site-settings.tsx`

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx`
- `rtk npx prettier --check src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx`
- Confirm skeleton components contain no fake event, product, company, or FAQ copy.

## Task 4: [functional] Preserve static shells on remaining public pages

**End state:** Homepage, brand, Gippy AI, and router pending behavior keep static UI visible and do not block or fake remote dynamic sections.

**Files:**

- Modify: `src/routes/index.tsx`
- Modify: `src/routes/brand.tsx`
- Modify: `src/routes/gippy-ai.tsx`
- Modify: `src/router.tsx`
- Modify: `src/components/site/LoadingModal.tsx`
- Inspect: `src/lib/home-content.tsx`
- Inspect: `src/lib/page-content.tsx`

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/routes/index.tsx src/routes/brand.tsx src/routes/gippy-ai.tsx src/router.tsx src/components/site/LoadingModal.tsx`
- `rtk npx prettier --check src/routes/index.tsx src/routes/brand.tsx src/routes/gippy-ai.tsx src/router.tsx src/components/site/LoadingModal.tsx`

## Task 5: [quality] Verify skeleton contract across public routes

**End state:** The implementation passes build and targeted lint, and public dynamic sections follow skeleton-while-loading then empty-state-after-loading behavior.

**Files:**

- Verify: `src/components/site/SectionSkeletons.tsx`
- Verify: `src/routes/products.tsx`
- Verify: `src/routes/products.$productId.tsx`
- Verify: `src/routes/catalog.index.tsx`
- Verify: `src/routes/catalog.$catalogId.tsx`
- Verify: `src/routes/events.tsx`
- Verify: `src/routes/b2b.tsx`
- Verify: `src/routes/contact.tsx`
- Verify: `src/routes/index.tsx`
- Verify: `src/routes/brand.tsx`
- Verify: `src/routes/gippy-ai.tsx`

**Verification:**

- `rtk npm run build`
- `rtk npx eslint src/components/site src/routes/products.tsx src/routes/products.$productId.tsx src/routes/catalog.index.tsx src/routes/catalog.$catalogId.tsx src/routes/events.tsx src/routes/b2b.tsx src/routes/contact.tsx src/routes/index.tsx src/routes/brand.tsx src/routes/gippy-ai.tsx`
- Manual route check: `/products`, `/catalog`, `/events`, `/b2b`, and `/contact` show static shell immediately and skeletons only for dynamic sections while loading.
