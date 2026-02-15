---
phase: 64-service-worker-hardening
plan: 05
subsystem: infra
tags: [service-worker, registration, cache-bust, cache-metrics, sentry-breadcrumbs, consolidation]

# Dependency graph
requires:
  - phase: 64-01
    provides: "Root-scope SW registration via ServiceWorkerRegistration.tsx, content-hash precache, NavigationRoute"
  - phase: 64-02
    provides: "useUpdateBanner hook with interaction-aware countdown"
  - phase: 64-03
    provides: "Offline UX with OfflineIndicator and banner priority coordination"
  - phase: 64-04
    provides: "IndexedDB cart persistence with idb-keyval adapter"
provides:
  - "Single root-scope SW registration (no duplicate /driver scope)"
  - "invalidateMenuCache() utility for admin menu cache-bust"
  - "reportCacheMetrics() with Sentry breadcrumbs for cache observability"
  - "Full Phase 64 verification: lint, typecheck, tests, build all passing"
affects: [65-lighthouse-ci]

# Tech tracking
tech-stack:
  added: []
  patterns: ["getRegistration() reuse instead of duplicate register()", "Sentry breadcrumbs for cache metrics", "Cache API invalidation for admin-triggered cache-bust"]

key-files:
  created: []
  modified:
    - "src/lib/hooks/useServiceWorker.ts"
    - "src/lib/hooks/index.ts"

key-decisions:
  - "getRegistration('/') replaces register('/sw.js', {scope: '/driver'}) to reuse root registration"
  - "Sentry breadcrumbs (not custom metrics) for cache observability -- lightweight, no pipeline overhead"
  - "invalidateMenuCache opens 'menu-api-cache-v1' directly via Cache API (matches sw.ts cache name)"

patterns-established:
  - "SW registration consolidation: driver routes use getRegistration() to attach to root SW"
  - "Cache invalidation: targeted Cache API delete for admin-triggered freshness"
  - "Cache metrics: Sentry.addBreadcrumb per cache name for passive observability"

# Metrics
duration: 8min
completed: 2026-02-15
---

# Phase 64 Plan 05: SW Registration Consolidation, Cache-Bust, and Metrics Summary

**Consolidated dual SW registration to single root scope via getRegistration(), added admin menu cache-bust utility, cache metrics via Sentry breadcrumbs, and full Phase 64 verification passing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-15T07:13:44Z
- **Completed:** 2026-02-15T07:21:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced `register("/sw.js", { scope: "/driver" })` with `getRegistration("/")` to reuse root-scope SW
- Preserved updatefound and SYNC_REQUESTED message listeners for driver offline sync
- Added `invalidateMenuCache()` utility opening `menu-api-cache-v1` and deleting /api/menu entries
- Added `reportCacheMetrics()` reporting entry counts per cache name as Sentry breadcrumbs
- Exported new utilities from hooks barrel (`invalidateMenuCache`, `reportCacheMetrics`)
- Full verification suite passes: lint (0 errors), typecheck (clean), 335 tests green, build succeeds with 8 SW entries

## Task Commits

Each task was committed atomically:

1. **Task 1: Consolidate SW registration and add cache-bust + metrics** - `6af40f4` (feat)
2. **Task 2: Full verification suite** - verification-only, no file changes

## Files Created/Modified
- `src/lib/hooks/useServiceWorker.ts` - Replaced register() with getRegistration(), added invalidateMenuCache() and reportCacheMetrics()
- `src/lib/hooks/index.ts` - Added invalidateMenuCache and reportCacheMetrics barrel exports

## Decisions Made
- Used `getRegistration("/")` instead of `register()` to attach to existing root registration (avoids duplicate /driver scope)
- Sentry breadcrumbs chosen over full metrics pipeline (lightweight, no infrastructure needed)
- Cache name `menu-api-cache-v1` matches the name used in sw.ts runtime caching config
- Kept `UseServiceWorkerReturn` interface unchanged for backward compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 64 is fully integration-complete:
  - Content-hash precaching with @serwist/build
  - Update banner with interaction-aware countdown
  - Offline UX with cached content messaging and reconnection refresh
  - IndexedDB cart persistence with offline sync
  - Single root-scope SW registration
  - Cache metrics for TTL tuning observability
- Ready for Phase 65 (Lighthouse CI) verification
- Service worker scope blocker resolved (was listed in STATE.md concerns)

---
*Phase: 64-service-worker-hardening*
*Completed: 2026-02-15*
