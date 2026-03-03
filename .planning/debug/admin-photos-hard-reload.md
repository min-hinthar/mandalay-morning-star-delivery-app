---
status: awaiting_human_verify
trigger: "Admin photos page requires hard reload to render photos. Normal navigation (client-side or direct URL) shows the page layout but photos are missing until a hard reload (Ctrl+F5) is performed."
created: 2026-03-02T01:00:00Z
updated: 2026-03-02T01:30:00Z
---

## Current Focus

hypothesis: CONFIRMED -- `loading="lazy"` on `<img>` tags inside framer-motion animated containers prevents browser IntersectionObserver from triggering lazy load during client-side SPA navigation. Hard reload uses eager loading heuristics for initial page paint.
test: Removed loading="lazy" from PhotoGrid.tsx; fixed invalidateMenuCache version mismatch in useServiceWorker.ts
expecting: Photos render immediately on client-side navigation and direct URL without hard reload
next_action: Human verify the fix resolves the missing photos in browser

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

## Evidence

- timestamp: 2026-03-02T01:00:00Z
  checked: Prior debug sessions for related image issues
  found: Two prior sessions -- (1) images-not-rendering fixed referrerPolicy + remotePatterns (2) profile-image-hard-reload found SW CacheFirst caching stale opaque responses, bumped CACHE_VERSION v1->v2
  implication: SW CacheFirst stale cache pattern is a known issue in this codebase. CACHE_VERSION was bumped to v2 but may not have been activated (skipWaiting: false)

- timestamp: 2026-03-02T01:02:00Z
  checked: PhotoGrid.tsx img tag attributes
  found: `<img>` has `loading="lazy"` (line 94) inside `<m.div>` with `initial={{ opacity: 0, scale: 0.9 }}` (lines 70-71). Parent wrapper `<m.div>` has `initial={{ opacity: 0, y: 10 }}` with `transition={{ delay: 0.25 }}` (page.tsx lines 316-320).
  implication: loading="lazy" uses IntersectionObserver. Framer-motion starts elements invisible/off-position. On client-side SPA navigation, browser may not trigger lazy loading for dynamically-inserted invisible elements. On hard reload, browsers load lazy images more eagerly during initial page paint.

- timestamp: 2026-03-02T01:04:00Z
  checked: SW registration behavior
  found: ServiceWorkerRegistration.tsx only registers in production (process.env.NODE_ENV !== "development"). SW denylist excludes /api/ routes from NavigationRoute, but runtimeCaching CacheFirst still intercepts image requests matching google/supabase hostnames.
  implication: If issue occurs in dev mode, SW is not the cause. If production-only, SW CacheFirst is the prime suspect.

- timestamp: 2026-03-02T01:06:00Z
  checked: invalidateMenuCache version mismatch
  found: useServiceWorker.ts line 109 opens "menu-api-cache-v1" but SW uses "menu-api-cache-v2" after the version bump. This function can never clear v2 cache entries.
  implication: Separate bug (stale menu API cache invalidation broken) -- fixed as secondary fix.

- timestamp: 2026-03-02T01:08:00Z
  checked: API route /api/admin/photos
  found: Returns JSON with photo objects containing imageUrl field. Image URLs are either drive.google.com/thumbnail or supabase.co/storage public URLs. API response itself is NOT cached by SW (no matcher matches /api/admin/).
  implication: The data-fetching works correctly. The issue is with the subsequent <img> requests for those URLs.

- timestamp: 2026-03-02T01:10:00Z
  checked: Comparison with MenuItemsTable.tsx (admin menu page)
  found: MenuItemsTable renders <img src={item.image_url} referrerPolicy="no-referrer" /> WITHOUT loading="lazy". This page does NOT have the hard-reload-required issue.
  implication: Strongly supports loading="lazy" as the differentiating factor between working and broken image loading.

- timestamp: 2026-03-02T01:12:00Z
  checked: loading="lazy" usage across codebase
  found: Only 2 places use loading="lazy" on plain img tags: PhotoGrid.tsx (the broken page) and CustomerInfoCard.tsx (order detail). PhotoMetadata.tsx does NOT use loading="lazy" (its preview image probably works fine).
  implication: loading="lazy" is the distinguishing factor.

- timestamp: 2026-03-02T01:25:00Z
  checked: Full verification suite after fix
  found: ESLint clean, Stylelint clean, Prettier clean, TypeScript clean, 433/433 tests pass, production build succeeds
  implication: Fix is mechanically correct, no regressions.

## Resolution

root_cause: |
  The `loading="lazy"` attribute on `<img>` tags in PhotoGrid.tsx (line 94) prevents the browser from loading photos during client-side SPA navigation. The images are inside framer-motion animated containers (`<m.div initial={{ opacity: 0, scale: 0.9 }}>`) which start invisible. The browser's IntersectionObserver for lazy loading does not reliably trigger for dynamically-inserted elements inside animated containers that start with opacity: 0.

  On hard reload (Ctrl+F5), the browser applies eager loading heuristics for images in the initial viewport during first page paint, so the images load correctly. On client-side navigation and direct URL (without cache bypass), React dynamically inserts the <img loading="lazy"> elements, and the browser's lazy loading observer fails to trigger because the animation containers haven't reached their visible state yet.

  This is the same category of issue as the prior two image sessions -- images fail on normal load but work on hard reload -- but with a different root cause (browser lazy loading vs SW stale cache).

  Secondary bug found: invalidateMenuCache() in useServiceWorker.ts hardcoded "menu-api-cache-v1" but the SW CACHE_VERSION was bumped to v2, causing the invalidation function to target a non-existent cache.

fix: |
  1. Removed `loading="lazy"` from the `<img>` tag in PhotoGrid.tsx. These images are the primary content of the photos page and should load eagerly (the default behavior when `loading` attribute is omitted). This ensures the browser loads images immediately when the DOM elements are inserted, regardless of framer-motion animation state.

  2. Fixed invalidateMenuCache() in useServiceWorker.ts to dynamically find the menu-api-cache by prefix using `caches.keys()` instead of hardcoding the version string. This ensures the function works regardless of CACHE_VERSION changes.

verification: |
  - ESLint: clean
  - Stylelint: clean
  - Prettier: clean
  - TypeScript: clean (tsc --noEmit)
  - Unit tests: 433/433 pass
  - Production build: succeeds
  - Awaiting human verification in browser

files_changed:
  - src/components/ui/admin/photos/PhotoGrid.tsx
  - src/lib/hooks/useServiceWorker.ts
