---
phase: 38-customer-offline-support
plan: 01
subsystem: infra
tags: [service-worker, pwa, offline, serwist, caching]

# Dependency graph
requires:
  - phase: None (first offline support plan)
    provides: N/A
provides:
  - Service worker with CacheFirst/NetworkFirst/StaleWhileRevalidate strategies
  - Images cached with 30-day expiration (250 max entries)
  - Menu API cached with NetworkFirst (5s timeout)
  - Static assets cached with StaleWhileRevalidate
  - SKIP_WAITING message handler for update prompts
affects: [38-02 (offline store), 38-03 (UI indicators)]

# Tech tracking
tech-stack:
  added: [@serwist/next, serwist, esbuild, glob]
  patterns: [Custom SW build script for Turbopack compatibility]

key-files:
  created:
    - src/app/sw.ts
    - scripts/build-sw.mjs
  modified:
    - next.config.ts
    - tsconfig.json
    - package.json
    - .gitignore

key-decisions:
  - "Custom build script for Turbopack compatibility - @serwist/next doesn't support Turbopack in Next.js 16"
  - "CacheFirst for images (30 days, 250 entries) - ~50MB budget at ~200KB average"
  - "NetworkFirst for menu API (5s timeout) - fresh data preferred, fallback to cache"
  - "StaleWhileRevalidate for static assets (7 days) - fast loads with background refresh"
  - "Filter out document caching from defaultCache - prevents App Router RSC conflicts"
  - "skipWaiting: false - manual update control for update prompt UI"
  - "sw.js added to gitignore - build artifact regenerated on each build"

patterns-established:
  - "Custom SW build via scripts/build-sw.mjs - workaround for Serwist/Turbopack incompatibility"
  - "Service worker source at src/app/sw.ts - standard location for SW code"

# Metrics
duration: 45min
completed: 2026-02-04
---

# Phase 38 Plan 01: Serwist Service Worker Configuration Summary

**Service worker with CacheFirst images, NetworkFirst menu API, and StaleWhileRevalidate static assets using custom esbuild script for Turbopack compatibility**

## Performance

- **Duration:** 45 min
- **Started:** 2026-02-04T17:25:00Z
- **Completed:** 2026-02-04T18:10:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Installed @serwist/next and serwist packages
- Created service worker source with all caching strategies per plan
- Configured custom build script to workaround Turbopack incompatibility
- Updated tsconfig with webworker lib and Serwist types
- Production build generates working sw.js (127KB bundled)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Serwist packages** - `c377dd8` (chore)
2. **Task 2: Create service worker source** - `cd8930f` (feat)
3. **Task 3: Update next.config.ts with Serwist** - `ec2d6da` (chore)
4. **Cleanup: Add sw.js to gitignore** - `58f327a` (chore)

## Files Created/Modified
- `src/app/sw.ts` - Service worker source with caching strategies
- `scripts/build-sw.mjs` - Custom build script using esbuild
- `next.config.ts` - Removed Serwist wrapper (using custom build)
- `tsconfig.json` - Added webworker lib, @serwist/next/typings, exclude public/sw.js
- `package.json` - Added build:sw script, esbuild, glob dependencies
- `.gitignore` - Added /public/sw.js

## Decisions Made
- **Custom build script:** @serwist/next uses webpack plugins which don't work with Turbopack (Next.js 16 default). Created scripts/build-sw.mjs using esbuild to compile the SW separately.
- **Cache strategies per research:** CacheFirst for images (long-lived), NetworkFirst for API (fresh preferred), StaleWhileRevalidate for static (fast + fresh)
- **Document exclusion:** Filter defaultCache to exclude document requests, preventing App Router RSC conflicts
- **Build artifact:** sw.js generated at build time, not committed to repo

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Turbopack incompatibility with @serwist/next**
- **Found during:** Task 3 (next.config.ts configuration)
- **Issue:** @serwist/next relies on webpack plugins; Turbopack (Next.js 16 default) doesn't support these
- **Fix:** Created custom scripts/build-sw.mjs using esbuild to compile SW after next build
- **Files modified:** scripts/build-sw.mjs, package.json, next.config.ts
- **Verification:** `pnpm build` completes and generates public/sw.js
- **Committed in:** ec2d6da (Task 3 commit)

**2. [Rule 3 - Blocking] Missing glob dependency**
- **Found during:** Task 3 (running build script)
- **Issue:** build-sw.mjs imports glob package not in dependencies
- **Fix:** `pnpm add -D glob`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** Build script runs successfully
- **Committed in:** ec2d6da (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for build to work with Next.js 16 Turbopack. No scope creep - same outcome achieved via different means.

## Issues Encountered
- @serwist/next Turbopack warning appeared during build but was informational only
- Needed to verify Serwist actually compiled SW (runAfterProductionCompile ran but no output) - discovered webpack dependency
- Solved by implementing custom build script approach

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Service worker infrastructure complete
- SW registers on production build
- Ready for 38-02: Customer offline store (IndexedDB)
- No blockers

---
*Phase: 38-customer-offline-support*
*Plan: 01*
*Completed: 2026-02-04*
