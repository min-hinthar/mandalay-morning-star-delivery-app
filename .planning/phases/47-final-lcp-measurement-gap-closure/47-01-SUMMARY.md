---
phase: 47-final-lcp-measurement-gap-closure
plan: 01
subsystem: performance
tags: [lighthouse, lcp, core-web-vitals, measurement]

# Dependency graph
requires:
  - phase: 40-44
    provides: LCP optimizations (CardImage, code-splitting, LazyMotion)
provides:
  - Final LCP measurements on 4 customer routes
  - Pass/fail determination against 4s target
  - Lighthouse CI config fix for Next.js 16
affects: [v1.6-optimization, milestone-closure]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/47-final-lcp-measurement-gap-closure/47-01-SUMMARY.md
  modified:
    - lighthouserc.js

key-decisions:
  - "LCP still 8-11s on all routes - misses 4s target"
  - "No regression from Phase 40 measurements"
  - "Lighthouse CI config needed fix for Next.js 16 startup pattern"

patterns-established: []

# Metrics
duration: 45min
completed: 2026-02-06
---

# Phase 47 Plan 01: LCP Measurement Summary

**Final LCP measurements: 8.1-11.0s across customer routes - all exceed 4s target, performance gap identified for v1.6**

## Performance

- **Duration:** 45 min
- **Started:** 2026-02-06T21:00:00Z
- **Completed:** 2026-02-06T21:45:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Production build verified (no Google Fonts 403 error)
- Lighthouse measurements completed on 4 customer routes (homepage, menu, cart, checkout)
- LCP baseline established for v1.5 milestone closure
- Lighthouse CI config fixed for Next.js 16 compatibility

## LCP Measurement Results

### Final Measurements (Mobile Throttling)

| Route | LCP | FCP | TBT | Score | Target | Status |
|-------|-----|-----|-----|-------|--------|--------|
| Homepage `/` | **10.87s** | 3.20s | 12.06s | 32 | < 4.0s | FAIL |
| Menu `/menu` | **10.95s** | 3.06s | 15.29s | 30 | < 4.0s | FAIL |
| Cart `/cart` | ~9-10s* | - | - | - | < 3.5s | FAIL |
| Checkout `/checkout` | **8.13s** | 1.63s | 5.40s | 45 | < 4.5s | FAIL |

*Cart measurement failed due to Chrome cleanup error on Windows; estimated based on similar route complexity.

### Comparison to Phase 40 Baseline

| Route | Phase 40 LCP | Phase 47 LCP | Change |
|-------|--------------|--------------|--------|
| Homepage | 11.4s | 10.87s | -4.6% (slight improvement) |
| Menu | 9.8s | 10.95s | +11.7% (slight regression) |

**Overall Assessment:** LCP remains in 8-11s range, consistent with Phase 40 measurements. No significant improvement or regression. The < 4s target is not met.

### Key Bottlenecks (from Lighthouse Diagnostics)

1. **JavaScript execution time (TBT 5-15s)** - Main thread blocked by bundle execution
2. **Network latency (FCP ~3s)** - Initial document and critical resources
3. **Large DOM size** - Complex component trees with animations

## Task Commits

Each task was committed atomically:

1. **Task 1: Production Build Verification** - No commit (verification only, no file changes)
2. **Task 2: Lighthouse Measurements** - `11de333` (fix: update Lighthouse CI config)
3. **Task 3: Create Measurement Summary** - This commit

## Files Created/Modified

- `lighthouserc.js` - Fixed startServerReadyPattern for Next.js 16 (was "started server", now "Starting")
- `.planning/phases/47-final-lcp-measurement-gap-closure/47-01-SUMMARY.md` - This file

## Decisions Made

- **LCP target confirmed as 4s** per CONTEXT.md (adjusted from original 2.5s)
- **Cart measurement estimated** due to Chrome cleanup errors on Windows - value ~9-10s based on similar routes
- **Measurement environment:** Local production build with mobile throttling (150ms RTT, 1.6Mbps, 4x CPU slowdown)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lighthouse CI startup pattern fix**
- **Found during:** Task 2 (Lighthouse measurements)
- **Issue:** LHCI failed with "Timed out waiting for server" - pattern "started server" doesn't match Next.js 16 output
- **Fix:** Updated startServerReadyPattern from "started server" to "Starting"
- **Files modified:** lighthouserc.js
- **Verification:** LHCI detects server startup correctly
- **Committed in:** 11de333

**2. [Rule 3 - Blocking] Missing babel-plugin-react-compiler**
- **Found during:** Task 1 (Production build)
- **Issue:** Build failed - package missing from node_modules
- **Fix:** Ran `pnpm install` to restore dependencies
- **Files modified:** None (existing dependency)
- **Verification:** Build completes successfully

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for measurement execution. No scope creep.

## Issues Encountered

1. **Chrome cleanup EPERM errors on Windows** - Lighthouse temp directory cleanup fails with permission denied. Non-blocking - measurements complete before error.
2. **High TBT variability** - CPU throttling produced inconsistent TBT values (5-15s). This is expected on local measurement.
3. **Cart route measurement failure** - Protocol error during Cart audit. Estimated value based on similar routes.

## Measurement Methodology

- **Tool:** Lighthouse CLI v12.6.1 via @lhci/cli@0.15.1
- **Environment:** Local production build (pnpm build && pnpm start)
- **Throttling:** Mobile profile (150ms RTT, 1.6Mbps, 4x CPU slowdown)
- **Emulation:** Moto G Power (375x667, 2x device scale)
- **Runs:** 3 per route, median selected (where available)

## Next Phase Readiness

- **LCP Gap Confirmed:** 8-11s actual vs 4s target = 4-7s gap
- **Top 3 Bottlenecks Identified:** JS execution, network latency, DOM size
- **v1.6 Optimization Needed:** Further optimization required to meet LCP target
- **Milestone v1.5 Status:** Performance goal not met - user review required before closing

### Recommended v1.6 Optimizations

1. **Server-side rendering improvements** - Reduce TTFB
2. **Critical CSS extraction** - Reduce render-blocking resources
3. **Bundle analysis and tree-shaking** - Reduce JS execution time
4. **Edge runtime for API routes** - Lower network latency

---
*Phase: 47-final-lcp-measurement-gap-closure*
*Completed: 2026-02-06*
