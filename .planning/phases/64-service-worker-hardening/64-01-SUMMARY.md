---
phase: 64-service-worker-hardening
plan: 01
subsystem: infra
tags: [service-worker, serwist, precache, content-hash, offline, navigation-route]

# Dependency graph
requires:
  - phase: 45-offline-pwa
    provides: "Base service worker with esbuild build script and runtime caching"
provides:
  - "Content-hashed precache manifest via @serwist/build getManifest()"
  - "NavigationRoute with denylist excluding auth/sentry/api routes"
  - "Offline fallback page at /offline (force-static)"
  - "15-minute menu API cache TTL"
  - "NEXT_PUBLIC_APP_VERSION env var from package.json"
affects: [64-02, 64-03, 64-04, 65-lighthouse-ci]

# Tech tracking
tech-stack:
  added: ["@serwist/build"]
  patterns:
    [
      "content-hash precache manifest",
      "NavigationRoute denylist",
      "offline fallback via SW fallbacks config",
    ]

key-files:
  created:
    - "src/app/offline/page.tsx"
    - "src/app/offline/OfflineTryAgainButton.tsx"
  modified:
    - "scripts/build-sw.mjs"
    - "src/app/sw.ts"
    - "next.config.ts"
    - "package.json"

key-decisions:
  - "Used @serwist/build getManifest() for content-hashed precache entries instead of Date.now()"
  - "Git revision (short SHA) for dynamic page entries (/, /menu, /cart, /offline)"
  - "NavigationRoute registered after Serwist construction via registerRoute()"
  - "Offline page reuses existing ErrorPageShell/ErrorMascot design system"
  - "OfflineTryAgainButton as separate client component for progressive enhancement"

patterns-established:
  - "Content-hash manifest: @serwist/build getManifest() in build script, injected via esbuild define"
  - "Navigation denylist: auth/monitoring/api excluded from SW interception"
  - "Offline fallback: force-static page served when network + cache fail for documents"

# Metrics
duration: 16min
completed: 2026-02-15
---

# Phase 64 Plan 01: Service Worker Hardening Foundation Summary

**Content-hashed precache via @serwist/build, NavigationRoute with auth/api denylist, offline fallback page, 15-min menu TTL, and NEXT_PUBLIC_APP_VERSION**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-15T06:37:18Z
- **Completed:** 2026-02-15T06:53:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced Date.now() precache revisions with content-hashed entries via @serwist/build getManifest()
- Added NavigationRoute with NetworkFirst strategy (3s timeout) and denylist for auth, Sentry tunnel, and API routes
- Created branded /offline fallback page using existing error-page design system
- Bumped menu API cache TTL from 5 to 15 minutes
- Exposed app version as NEXT_PUBLIC_APP_VERSION for future update banner

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite build-sw.mjs with content-hash generation** - `d51b790` (feat)
2. **Task 2: NavigationRoute, denylist, offline fallback, menu TTL** - `e44e1fa` (feat)

## Files Created/Modified

- `scripts/build-sw.mjs` - Rewritten to use @serwist/build getManifest() for content-hashed precache entries
- `src/app/sw.ts` - Added NavigationRoute with denylist, fallbacks config, 15-min menu TTL
- `src/app/offline/page.tsx` - Static offline fallback page with cached page links
- `src/app/offline/OfflineTryAgainButton.tsx` - Client component for page reload button
- `next.config.ts` - Added NEXT_PUBLIC_APP_VERSION env var from package.json
- `package.json` - Added @serwist/build dev dependency

## Decisions Made

- Used `@serwist/build` as explicit dev dependency (not available as transitive dep of @serwist/next)
- Git short SHA as revision for dynamic pages; crypto.randomUUID() fallback if git unavailable
- Removed post-build manifest injection (writeFileSync prepend) since esbuild `define` handles it
- Offline page uses existing ErrorPageShell/ErrorMascot components for brand consistency
- Separate OfflineTryAgainButton client component keeps page.tsx as server component (force-static)
- Used semantic token `bg-surface-primary` instead of `bg-white` per project lint rules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @serwist/build as dev dependency**

- **Found during:** Task 1 (build-sw.mjs rewrite)
- **Issue:** Plan stated @serwist/build is "already installed as transitive dep of @serwist/next" but it was not available
- **Fix:** Ran `pnpm add -D @serwist/build` to install explicitly
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** `node -e "require('@serwist/build')"` succeeds, build:sw runs
- **Committed in:** d51b790 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed lint violations for bg-white semantic token**

- **Found during:** Task 2 (offline page creation)
- **Issue:** ESLint `no-restricted-syntax` rule requires `bg-surface-primary` instead of `bg-white`
- **Fix:** Replaced `bg-white` with `bg-surface-primary` in both offline page files
- **Files modified:** src/app/offline/page.tsx, src/app/offline/OfflineTryAgainButton.tsx
- **Verification:** `pnpm lint` passes with 0 errors
- **Committed in:** e44e1fa (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Content-hash precache foundation ready for cache-busting improvements in subsequent plans
- NavigationRoute with denylist enables safe navigation caching
- Offline page precached and served as fallback for document failures
- NEXT_PUBLIC_APP_VERSION available for update banner implementation (Plan 02+)
- Menu API 15-min TTL aligned with expected freshness requirements

---

_Phase: 64-service-worker-hardening_
_Completed: 2026-02-15_
