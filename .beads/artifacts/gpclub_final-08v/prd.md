# Fix gpclub.vn homepage freeze

## Bead Metadata

```yaml
depends_on: []
parallel: false
conflicts_with:
  - gpclub_final-xmr
blocks: []
estimated_hours: 4
```

## Problem Statement

`https://gpclub.vn/` returns server HTML quickly from Vercel, but the browser can freeze after hydration. Prior audit evidence points to stacked client-side work on the public homepage: global engagement widgets mount shortly after load, chat eagerly imports large image assets and fetches data before user intent, product catalog data is fetched by both the homepage and chat, and popup queries fetch more data than the UI needs.

WHEN a user opens the homepage, THEN above-the-fold content should become interactive without the chat, popup, or duplicate catalog work blocking the main thread.

WHEN the user opens chat, THEN chat data and recommendation data should load without duplicating already cached catalog fetches.

WHEN popup eligibility is checked, THEN only the fields and bounded row count needed to render the first eligible popup should be fetched.

## Scope

### In Scope

- Lazy-load public engagement widgets currently imported by the root route.
- Deduplicate public product catalog fetching using the existing TanStack Query setup.
- Defer Gippy chat tree/catalog-dependent work until chat opens or the user initiates chat behavior.
- Limit `PopupHost` queries to the rendered fields and a small bounded result set.
- Keep existing homepage, chat, floating chat, popup, and product display behavior functionally equivalent.
- Run build/lint verification and a targeted runtime smoke check where feasible.

### Out of Scope

- Replacing Supabase tables or changing database schema.
- Redesigning the homepage UI or chat UX.
- Converting image assets to WebP/AVIF in this bead.
- Full bundle analyzer setup or Vercel production deployment.
- Broad animation redesign beyond avoiding new first-load blocking work.

## Proposed Solution

Use the repo's existing patterns instead of adding new dependencies. `src/routes/admin.tsx` already lazy-loads route UI with `React.lazy` and `Suspense`, and `src/router.tsx` plus `src/routes/__root.tsx` already provide `QueryClientProvider`. Apply those patterns to public homepage performance work:

- Convert static root imports of `GippyChat` and `PopupHost` into lazy-loaded components wrapped with `Suspense fallback={null}`.
- Convert `useCatalogProducts` in `src/lib/catalog-products.ts` from a per-component `useEffect` fetch to a React Query-backed hook with a stable query key and useful `staleTime`, preserving the hook's return shape for existing callers.
- Change `GippyChat` so `chatbot_tree_nodes` and catalog-dependent recommendation work do not start while the widget is closed.
- Change `PopupHost` to select only columns it renders or needs for dismissal checks, and cap returned active popup rows.

## Success Criteria

- Verify: `npm run lint`
- Verify: `npm run build`
- Verify: production-like smoke check confirms homepage still renders and no console-level runtime crash appears during initial load.
- Verify: `dist/client/assets/index-*.js` no longer bundles the heavy Gippy chat implementation through a static root import.
- Verify: homepage and chat can both access catalog products through one shared React Query cache key instead of independent uncached effects.
- Verify: chat tree request is not issued before `GippyChat` opens.
- Verify: popup query contains a bounded `.limit(...)` and no longer uses `.select("*")`.

## Technical Context

- `src/routes/__root.tsx:13` statically imports `GippyChat`, and `src/routes/__root.tsx:15` statically imports `PopupHost`.
- `src/routes/__root.tsx:196` defines `PublicEngagementLayer`; `src/routes/__root.tsx:200` delays mounting by 750ms; `src/routes/__root.tsx:208` renders `GippyChat`; `src/routes/__root.tsx:210` renders `PopupHost`.
- `src/routes/admin.tsx:2` and `src/routes/admin.tsx:4` show the existing lazy/Suspense pattern for code splitting.
- `src/router.tsx:6` creates `QueryClient`, and `src/routes/__root.tsx:175` provides it with `QueryClientProvider`.
- `src/routes/index.tsx:165` calls `useCatalogProducts()` for homepage products.
- `src/components/site/GippyChat.tsx:73` also calls `useCatalogProducts()`, duplicating catalog fetch and parse work.
- `src/lib/catalog-products.ts:70` fetches up to 120 products; `src/lib/catalog-products.ts:104` defines the current hook; `src/lib/catalog-products.ts:111` performs the fetch inside a component-local effect.
- `src/components/site/GippyChat.tsx:126` starts the `chatbot_tree_nodes` fetch as soon as chat mounts.
- `src/components/site/PopupHost.tsx:29` queries `popups`; `src/components/site/PopupHost.tsx:31` uses `.select("*")`; `src/components/site/PopupHost.tsx:35` orders active rows without a `.limit(...)`.

## Affected Files

- `src/routes/__root.tsx`
- `src/lib/catalog-products.ts`
- `src/components/site/GippyChat.tsx`
- `src/components/site/PopupHost.tsx`
- `src/routes/index.tsx`
- `package.json`

## Tasks

### Lazy-load public engagement widgets [performance]

The public root route no longer statically includes heavy chat and popup widget modules in the initial homepage bundle, while existing public engagement behavior remains available after the delayed engagement layer mounts.

**Metadata:**

```yaml
depends_on: []
parallel: true
conflicts_with:
  - Defer chat data until open
files:
  - src/routes/__root.tsx
```

**Verification:**

- `npm run lint`
- `npm run build`
- Inspect generated client chunks and confirm `GippyChat` is emitted outside the primary `index-*.js` chunk or is dynamically imported from the root.

### Deduplicate catalog products with React Query [data]

Homepage and chat catalog consumers share one cached React Query request while `useCatalogProducts` preserves its current public return shape for existing UI code.

**Metadata:**

```yaml
depends_on: []
parallel: true
conflicts_with: []
files:
  - src/lib/catalog-products.ts
  - src/routes/index.tsx
  - src/components/site/GippyChat.tsx
```

**Verification:**

- `npm run lint`
- `npm run build`
- Runtime or code inspection confirms `useCatalogProducts()` uses a stable React Query `queryKey` and no longer performs an uncached fetch in a local mount effect.

### Defer chat data until open [performance]

`GippyChat` does not fetch chatbot tree data or trigger catalog-dependent recommendation work while the widget is closed, and it still loads the same chat options after the user opens the widget.

**Metadata:**

```yaml
depends_on:
  - Deduplicate catalog products with React Query
parallel: false
conflicts_with:
  - Lazy-load public engagement widgets
files:
  - src/components/site/GippyChat.tsx
```

**Verification:**

- `npm run lint`
- `npm run build`
- Browser/network smoke check confirms `chatbot_tree_nodes` is not requested before opening chat and is requested after chat opens.

### Limit popup host query [data]

`PopupHost` fetches only the fields it renders or needs for dismissal checks and uses a bounded active-popup result set before client-side dismissal filtering.

**Metadata:**

```yaml
depends_on: []
parallel: true
conflicts_with: []
files:
  - src/components/site/PopupHost.tsx
```

**Verification:**

- `npm run lint`
- `npm run build`
- Code inspection confirms the query does not use `.select("*")` and includes `.limit(...)`.

### Verify homepage freeze remediation [verification]

The completed change has fresh static and runtime evidence that homepage initial load is lighter and the public widgets still work when invoked.

**Metadata:**

```yaml
depends_on:
  - Lazy-load public engagement widgets
  - Deduplicate catalog products with React Query
  - Defer chat data until open
  - Limit popup host query
parallel: false
conflicts_with: []
files:
  - package.json
```

**Verification:**

- `npm run lint`
- `npm run build`
- Start a local preview build and smoke-test `/` plus chat-open behavior with browser automation when available.
- Compare build output against the audit baseline: original primary client chunk was approximately `920.79 kB` with heavy Gippy assets emitted from the initial import path.

## Risks

- Lazy-loading public widgets can hide runtime import errors until after hydration; build and browser smoke checks must cover the delayed mount path.
- Deferring chat data can alter perceived chat readiness; the UI should preserve a reasonable loading state after opening.
- React Query conversion must preserve the existing hook return shape to avoid broad homepage/chat rewrites.
- Popup result limiting could skip an eligible popup if too few dismissed rows are fetched first; use a small bounded window rather than `limit(1)` unless server-side eligibility is added.

## Open Questions

- Production row counts for `admin_products`, `chatbot_tree_nodes`, and `popups` are unknown. This PRD assumes bounded client-side work is still required even without exact row counts.
- Exact production freeze reproduction requires a browser performance trace on `https://gpclub.vn/`; local smoke checks can prove no obvious regression, but not full production device coverage.
