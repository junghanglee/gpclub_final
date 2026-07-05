# Public Page Runtime Loading Audit

**Scope:** `/`, `/products`, `/brand`, `/contact`, `/events` on `http://localhost:8080`, plus static inspection of adjacent public route loading paths.

**Question answered:** `npm run dev` is part of the localhost slowness because Vite dev serves many ESM modules and React StrictMode re-runs mount effects. It was not the only cause. Runtime evidence also showed production-relevant latency from blocking external font CSS, duplicated public fetches, automatic chat/popup loading, Google Maps iframe startup work, and product image fan-out.

## Findings

### Critical

None remaining after the scoped fixes below.

### Important

#### I1. External font CSS could block first load for seconds

Evidence:

- Playwright cold run on `/` measured `fonts.googleapis.com` and Pretendard CDN CSS around 7.4s-7.5s before page load completed.
- Blocking those font CSS URLs in comparison dropped `/` load to roughly 237ms.

Fix applied:

- Removed top-level external font `@import` statements from `src/styles.css`.
- Switched display/body font tokens to local/system stacks.

Result:

- After-fix Playwright: `fontCssRequests: 0` on all measured public routes.

#### I2. React StrictMode/dev remounts duplicated public data fetches

Evidence:

- Before fix, Playwright captured duplicate fetches for `site_settings`, `home_content`, `product_catalogs`, `popups`, `faqs`, and `events` in dev.
- This made localhost feel worse, but direct `useEffect` fetch duplication could also hurt route transitions and repeat visits.

Fix applied:

- Added `fetchCachedPublicData` and `readPublicDataCache` in `src/lib/public-data-timeout.ts`.
- Applied the shared in-flight/value cache to site settings, homepage content, page content, product catalogs, popups, contact FAQs, and events.

Result:

- After-fix Playwright shows each Supabase public data key requested once per measured route instead of duplicate dev fetches.

#### I3. Chat/popup code loaded automatically after idle on every public page

Evidence:

- Before fix, `PublicEngagementLayer` scheduled `GippyChat` and `PopupHost` after idle/timeout.
- Playwright saw `GippyChat.tsx`, `PopupHost.tsx`, and `popups` requests without user intent.

Fix applied:

- `FloatingChat` renders immediately.
- Heavy `GippyChat` and `PopupHost` now mount only after the user clicks the new `Gippy AI` action.
- `PopupHost` popup fetch is cached as `popups:active`.

Result:

- After-fix Playwright: `chatOrPopupRequests: 0` on initial public route loads.

#### I4. `/contact` Google Maps auto-load is intentionally restored

Evidence:

- Runtime audit showed the Maps iframe adds startup network work on `/contact`.
- Product direction requires the map to appear automatically instead of requiring a click.

Fix applied:

- Restored the Google Maps iframe to render automatically in the contact card.
- Kept browser-native `loading="lazy"` on the iframe so it remains less aggressive than an eager map load.

Result:

- `/contact` will again create Google Maps requests during page viewing by design.
- Other loading fixes remain in place: no external font CSS, public data fetch de-dupe, and chat/popup no longer auto-loads on initial route render.

#### I5. `/products` started too many remote product images at once

Evidence:

- Playwright showed many `www.jmella.com` product images among the slowest `/products` resources.

Fix applied:

- Reduced initial visible products from 16 to 8.
- Marked product grid images with low fetch priority.

Result:

- After-fix `/products` load event was 204ms in the measured dev run; slowest product images were around 217ms-236ms.

### Residual Risk

Production build still warns about chunks over 500k after minification. The main client chunk remains about 722.9 kB minified / 214.6 kB gzip, and the SSR router chunk is about 1.56 MB. This is not a build failure, but the next meaningful optimization is route/manual chunk splitting for the heaviest public route modules.

## Verification Evidence

### Static/Build

- `rtk npx prettier --write ...`: touched files formatted.
- `rtk npx eslint ...touched files...`: 0 errors, 10 existing warnings in provider files from `react-refresh/only-export-components`.
- `rtk git diff --check -- ...touched files...`: no whitespace errors.
- `rtk npm run build`: passed. Existing chunk-size warning remains.

### Playwright After-Fix Runtime

Measured on `http://localhost:8080` with headless Chromium, waiting 3.5s after load.

| Route       |   DCL |  Load | Requests | Failed | Font CSS |               Maps | Chat/Popup |
| ----------- | ----: | ----: | -------: | -----: | -------: | -----------------: | ---------: |
| `/`         | 415ms | 454ms |      209 |      0 |        0 |                  0 |          0 |
| `/products` | 185ms | 204ms |      217 |      0 |        0 |                  0 |          0 |
| `/brand`    |  83ms |  95ms |      198 |      0 |        0 |                  0 |          0 |
| `/contact`  | 192ms | 222ms |      197 |      0 |        0 | restored auto-load |          0 |
| `/events`   | 109ms | 122ms |      194 |      0 |        0 |                  0 |          0 |

Supabase/public data request counts were de-duped to one request per key on the measured routes.

## Changed Files of Interest

- `src/styles.css`
- `src/lib/public-data-timeout.ts`
- `src/lib/site-settings.tsx`
- `src/lib/home-content.tsx`
- `src/lib/page-content.tsx`
- `src/lib/product-catalogs.ts`
- `src/components/site/FloatingChat.tsx`
- `src/components/site/PopupHost.tsx`
- `src/routes/__root.tsx`
- `src/routes/contact.tsx`
- `src/routes/events.tsx`
- `src/routes/products.tsx`
