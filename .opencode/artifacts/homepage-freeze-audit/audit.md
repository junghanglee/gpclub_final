# Page Loading / Progressive Rendering Audit

**Pattern searched:** route/page loading gates, `LoadingModal`, TanStack Router pending UI, `loading`/`isLoading` gates, shared fallback-backed content hooks, route loaders.

**Occurrences found:** 11 verified blocking/progressive-render candidates.

**Files affected:** 11 primary files.

- `src/router.tsx`
- `src/routes/index.tsx`
- `src/routes/brand.tsx`
- `src/routes/products.tsx`
- `src/routes/gippy-ai.tsx`
- `src/routes/events.tsx`
- `src/routes/b2b.tsx`
- `src/routes/catalog.index.tsx`
- `src/routes/catalog.$catalogId.tsx`
- `src/routes/products.$productId.tsx`
- `src/routes/brand.$brandKey.tsx`

## Issues By Severity

### Critical

None verified.

### Important

#### I1. Router pending UI is immediate, but it is still a fullscreen blocking overlay

Evidence:

- `src/router.tsx:6-13` renders `LoadingModal` from `RoutePending`.
- `src/router.tsx:23-25` configures `defaultPendingMs: 0`, `defaultPendingMinMs: 0`, and `defaultPendingComponent: RoutePending`.
- `src/components/site/LoadingModal.tsx:17-20` renders a fixed fullscreen overlay.

Impact:

Route transitions now commit immediately, but the default pending presentation still covers the full viewport. That is better than waiting for route activation, but it still prevents partial content from showing during slower transitions.

Recommended fix:

- Keep the centralized pending component, but change it from a fullscreen modal to a lighter route pending shell or top progress indicator.
- Reserve fullscreen overlays for true blocking flows only.

#### I2. Homepage still blocks behind a modal even though default content and placeholder product cards already exist

Evidence:

- `src/routes/index.tsx:176-180` reads home content and catalog data hooks.
- `src/routes/index.tsx:219-223` opens `LoadingModal` while `homeContentLoading || catalogProductsLoading`.
- `src/lib/home-content.tsx:235-241` initializes default home content and merges remote data later.
- `src/routes/index.tsx:504-534` already has renderable homepage sections and fallback product placeholder behavior.

Impact:

The home route waits for both data sources before showing the page chrome, even though the code already has enough local content to render immediately. This overblocks the highest-traffic page and defeats progressive enhancement.

Recommended fix:

- Render the homepage shell immediately.
- Use section-level skeletons/placeholders for product and CMS areas.
- Remove `LoadingModal` from the home route; keep only local placeholders where data is still pending.

#### I3. Several content pages still gate the whole screen on fallback-backed CMS loading state

Evidence:

- `src/routes/brand.tsx:183-188`
- `src/routes/products.tsx:163-164`
- `src/routes/gippy-ai.tsx:77-83`
- `src/routes/events.tsx:126-140`
- `src/routes/b2b.tsx:518-519`
- `src/lib/page-content.tsx:151-171` initializes default page content before remote enhancement.

Impact:

These routes already have default content available synchronously, but they still mount a fullscreen modal until the CMS request settles. That makes transient latency feel like a page hang instead of a partial render.

Recommended fix:

- Keep the default content visible.
- Replace page-level modals with in-flow skeletons or section placeholders.
- Only block when the route truly cannot render without data.

#### I4. Catalog routes overblock by tying shell visibility to product-list readiness

Evidence:

- `src/routes/catalog.index.tsx:25-46` fetches catalog metadata locally.
- `src/routes/catalog.index.tsx:126` shows `LoadingModal` for `loading || productsLoading`.
- `src/routes/catalog.$catalogId.tsx:53` returns loading before the printable shell can render.
- `src/routes/products.$productId.tsx:79` returns a loading shell while detail fetch resolves.

Impact:

The catalog shell and detail routes can show their structure before all rows finish loading. Blocking the whole page hides the fact that the catalog exists and prevents early progressive rendering.

Recommended fix:

- Render catalog chrome immediately.
- Show row-level or section-level placeholders for catalog items.
- Keep not-found states behind actual loaded/failed states, not initial nulls.

#### I5. Brand route loader still blocks route activation on Supabase-backed data

Evidence:

- `src/routes/brand.$brandKey.tsx:15-19` awaits `fetchBrandDetails()` in the route loader.
- `src/lib/brand-details.ts:215-221` queries `home_content` for brand details.

Impact:

This is the one remaining true route-level block in the public surface. It is better than a client-side modal for 404/metadata correctness, but it still delays route activation and should be kept only if the route truly needs preloaded data.

Recommended fix:

- Keep loader usage only if the brand route really requires metadata before render.
- Otherwise, move to fallback-first rendering and hydrate details after mount.

### Minor

#### M1. Contact page is the best progressive pattern in the public area

Evidence:

- `src/routes/contact.tsx:197-199` reads loading flags.
- The page already keeps fallback data visible instead of hard-blocking the whole screen.

Impact:

Contact is closer to the desired model: partial render first, enhancement later. It is not the main hang source.

Recommended fix:

- Keep this pattern and extend it to other public content pages.

## Correct Patterns Found

- `src/lib/home-content.tsx:235-241` initializes default homepage content before remote enhancement.
- `src/lib/page-content.tsx:151-171` initializes default page content and merges remote content later.
- `src/lib/catalog-products.ts:138` already exposes empty rows instead of conflating empty data with loading.
- `src/routes/events.tsx:247-253` contains in-flow section loading / empty-state structure that can support progressive rendering.
- `src/routes/__root.tsx:205-220` lazy-loads engagement widgets behind `Suspense`; the issue is presentation style, not root-level blocking.

## Recommended Remediation Order

1. Change the router pending UI to a lightweight non-blocking shell or top progress indicator.
2. Remove the home route fullscreen modal and let its existing fallback content render immediately.
3. Replace page-level modals on content-backed pages with section skeletons/placeholders.
4. Split catalog routes into immediate shell + progressive rows.
5. Keep the brand loader only if route correctness truly requires preloaded metadata.
6. Preserve the contact page pattern as the model for partial loading.

## Verification Evidence

- Read `src/router.tsx`, `src/routes/index.tsx`, `src/routes/brand.tsx`, `src/routes/products.tsx`, `src/routes/gippy-ai.tsx`, `src/routes/events.tsx`, `src/routes/b2b.tsx`, `src/routes/catalog.index.tsx`, `src/routes/catalog.$catalogId.tsx`, `src/routes/products.$productId.tsx`, `src/routes/brand.$brandKey.tsx`, `src/lib/home-content.tsx`, `src/lib/page-content.tsx`, `src/lib/brand-details.ts`, and `src/components/site/LoadingModal.tsx`.
- Reviewed subagent output for explore/review/general.
- Confirmed the app already has default/fallback content hooks, so the main issue is presentation and blocking gates, not lack of data.

## Residual Risk

This audit is static/code-based. The best remaining validation is a runtime browser trace on `https://gpclub.vn/` after the generalized progressive-render changes: check whether the first paint shows shell content immediately, whether route transitions stay interactive, and whether remaining delays are image decode, hydration, or specific network calls.
