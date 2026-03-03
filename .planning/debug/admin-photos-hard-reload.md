---
status: awaiting_human_verify
trigger: "Admin photos page requires hard reload to render photos. Normal navigation (client-side or direct URL) shows the page layout but photos are missing until a hard reload (Ctrl+F5) is performed."
created: 2026-03-02T01:00:00Z
updated: 2026-03-03T02:45:00Z
---

## Current Focus

hypothesis: CONFIRMED -- Google Drive `/thumbnail` endpoint returns opaque cross-origin responses that the SW caches indiscriminately (status 0 includes both success and error). NetworkFirst still caches bad opaque responses. The old SW (v2 with CacheFirst) may still be active due to `skipWaiting: false`. Hard reload bypasses SW entirely, making direct browser requests that succeed. The fundamental fix is to route Drive images through Next.js image optimization proxy (`/_next/image`) like the customer-facing menu already does, making requests same-origin and properly cacheable.
test: Switch PhotoGrid, CartItem, and SuggestionRow from plain `<img>` to `next/image` for Drive URLs. Also fix SW opaque response caching.
expecting: Images load reliably on both normal navigation and hard reload. No more dependency on hard reload.
next_action: Awaiting human verification in browser

## Symptoms

expected: Product/menu photos should display immediately on first load without any special interaction
actual: Page loads but photo slots are empty -- layout renders correctly but images don't appear
errors: No specific error messages reported
reproduction: Navigate to admin photos page via sidebar link OR direct URL -- photos don't render. Hard reload fixes it. Both navigation methods fail without hard reload.
started: Not sure when it started

## Eliminated

- hypothesis: CSP blocking image requests
  evidence: img-src directive already includes https://*.supabase.co and https://*.googleusercontent.com wildcards
  timestamp: 2026-03-02T01:04:00Z

- hypothesis: Missing referrerPolicy on img tags
  evidence: referrerPolicy="no-referrer" was already added in commit e3ae7892 to PhotoGrid.tsx and PhotoMetadata.tsx
  timestamp: 2026-03-02T01:04:00Z

- hypothesis: next/image remotePatterns misconfiguration
  evidence: **.supabase.co and **.googleusercontent.com are configured; drive.google.com is configured. PhotoGrid uses plain img tags, not next/image.
  timestamp: 2026-03-02T01:04:00Z

- hypothesis: API route not returning photo data
  evidence: /api/admin/photos correctly queries menu_items with non-null image_url and returns JSON with photo objects. The page layout renders correctly (stats cards, filters, grid structure) -- only the images inside <img> tags fail to load.
  timestamp: 2026-03-02T01:08:00Z

- hypothesis: loading="lazy" + framer-motion animated containers prevent IntersectionObserver
  evidence: Fix was applied (removed loading="lazy") but symptoms persist. Root cause is elsewhere.
  timestamp: 2026-03-03T01:30:00Z

- hypothesis: SW CacheFirst for external images caches stale opaque responses
  evidence: Fix was applied (switched to NetworkFirst, bumped CACHE_VERSION v2->v3) but symptoms persist. NetworkFirst still caches opaque responses (status 0) which are indistinguishable between success and error for cross-origin requests.
  timestamp: 2026-03-03T01:30:00Z

## Evidence

- timestamp: 2026-03-02T01:00:00Z
  checked: Prior debug sessions for related image issues
  found: Two prior sessions -- (1) images-not-rendering fixed referrerPolicy + remotePatterns (2) profile-image-hard-reload found SW CacheFirst caching stale opaque responses, bumped CACHE_VERSION v1->v2
  implication: SW CacheFirst stale cache pattern is a known issue in this codebase. CACHE_VERSION was bumped to v2 but may not have been activated (skipWaiting: false)

- timestamp: 2026-03-03T01:30:00Z
  checked: All three previous fixes applied in commit 8f964aca
  found: (1) loading="lazy" removed from PhotoGrid (2) SW switched to NetworkFirst for external images (3) CACHE_VERSION bumped v2->v3 (4) onError fallback added to CartItem/SuggestionRow (5) invalidateMenuCache fixed
  implication: All previous fixes applied correctly but symptom persists. Root cause is NOT lazy loading or CacheFirst strategy alone.

- timestamp: 2026-03-03T01:35:00Z
  checked: skipWaiting behavior in sw.ts
  found: skipWaiting: false -- new SW installs but does NOT activate until all tabs closed. Old SW (v2, CacheFirst) may still be the active controller.
  implication: Even after deploying v3 (NetworkFirst), the old v2 SW with CacheFirst could still be serving stale opaque responses until user closes all tabs.

- timestamp: 2026-03-03T01:40:00Z
  checked: Customer-facing menu vs admin photos -- why menu works
  found: Customer menu uses `next/image` (CardImage.tsx) which proxies through `/_next/image?url=...`. This is a SAME-ORIGIN request to the Next.js server. Server fetches from Drive, optimizes, returns with proper headers. Admin photos and cart items use plain `<img>` with direct cross-origin Drive URLs.
  implication: next/image proxy is the key difference. It avoids all cross-origin issues, SW opaque response caching, and Google Drive rate limiting.

- timestamp: 2026-03-03T01:45:00Z
  checked: CacheableResponsePlugin statuses: [0, 200] behavior with opaque responses
  found: Status 0 = opaque cross-origin response. Opaque responses hide the actual HTTP status -- a 403, 429 (rate limit), or error page from Google ALL appear as status 0 to the SW. CacheableResponsePlugin cannot distinguish good from bad opaque responses.
  implication: Even NetworkFirst caches bad opaque responses. Once cached, they persist until cache expires (30 days). This is a fundamental limitation of SW + cross-origin images.

- timestamp: 2026-03-03T01:50:00Z
  checked: Google Drive /thumbnail endpoint reliability
  found: Web search confirms widespread issues: rate limiting with 10+ images, CORS/redirect chain problems, intermittent failures across GitHub Pages, Power BI, Adobe Express, etc.
  implication: Google Drive /thumbnail is NOT a reliable endpoint for direct cross-origin <img> loading in production apps. Must proxy through server.

- timestamp: 2026-03-03T01:55:00Z
  checked: SW runtimeCaching order and potential matcher conflicts
  found: External images matcher (NetworkFirst) is first, generic images (CacheFirst) is second. URL-based matcher fires before destination-based matcher. Order is correct.
  implication: Route matching order is not the issue. The issue is with opaque response caching regardless of strategy.

## Resolution

root_cause: |
  Multiple compounding causes, with the PRIMARY root cause being:

  **Google Drive `/thumbnail` endpoint + cross-origin opaque responses + SW caching = unreliable image loading.**

  The `drive.google.com/thumbnail` endpoint returns cross-origin responses that are "opaque" (status 0) to the Service Worker. The SW's `CacheableResponsePlugin` with `statuses: [0, 200]` cannot distinguish between a successful opaque image response and an opaque error/rate-limit response from Google. Once a bad opaque response is cached, it persists for up to 30 days.

  Additionally, `skipWaiting: false` means the old SW (v2, with CacheFirst for external images) may still be active even after deploying v3 (NetworkFirst), continuing to serve permanently cached bad opaque responses.

  Hard reload (Ctrl+F5) bypasses the SW entirely, sending requests directly from the browser with `Cache-Control: no-cache`. Google Drive responds to these direct requests successfully, which is why images appear after hard reload.

  The customer-facing menu does NOT have this issue because it uses `next/image`, which proxies requests through the Next.js server (`/_next/image?url=...`). This makes the image request same-origin, with proper HTTP status codes and cache headers.

  **Secondary causes that were already fixed but insufficient alone:**
  1. `loading="lazy"` inside framer-motion opacity:0 containers (fixed: removed)
  2. CacheFirst permanently caching bad opaque responses (fixed: switched to NetworkFirst, but NetworkFirst ALSO caches opaque responses)
  3. invalidateMenuCache version mismatch (fixed: dynamic lookup)

fix: |
  1. Switch PhotoGrid from plain `<img>` to `next/image` with `fill` prop, routing Drive images through Next.js image optimization proxy. This eliminates cross-origin issues entirely.

  2. Switch CartItem from plain `<img>` to `next/image` with explicit width/height, for the same reason.

  3. Switch SuggestionRow from plain `<img>` to `next/image` with explicit width/height.

  4. Remove opaque response caching (status 0) from SW external images handler. Only cache status 200. Opaque error responses will no longer be cached. Bump CACHE_VERSION v3->v4 to bust any cached bad opaque responses.

  5. Add `onError` fallback to PhotoGrid (was missing).

verification: |
  - ESLint: clean
  - Stylelint: clean
  - Prettier: clean
  - TypeScript: clean (tsc --noEmit)
  - Unit tests: 433/433 pass
  - Production build: succeeds
  - Built SW confirmed: CACHE_VERSION=v4, statuses=[200] only
  - Awaiting human verification in browser

files_changed:
  - src/components/ui/admin/photos/PhotoGrid.tsx
  - src/components/ui/admin/photos/PhotoMetadata.tsx
  - src/components/ui/cart/CartItem/CartItem.tsx
  - src/components/ui/cart/CartPage/SuggestionRow.tsx
  - src/app/sw.ts
