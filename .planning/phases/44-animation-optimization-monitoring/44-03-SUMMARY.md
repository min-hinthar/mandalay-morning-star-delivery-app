---
phase: 44-animation-optimization-monitoring
plan: 03
subsystem: infra
tags: [lighthouse, ci, github-actions, performance, core-web-vitals]

# Dependency graph
requires:
  - phase: 44-01
    provides: React Compiler and bundle optimization baseline
  - phase: 44-02
    provides: LazyMotion migration reducing animation bundle
provides:
  - Lighthouse CI performance regression gate on PRs
  - Warn-only Core Web Vitals monitoring (FCP, LCP, CLS, TBT)
  - Customer route auditing (/, /menu, /cart, /checkout)
affects: [all future phases - performance regressions detected on PRs]

# Tech tracking
tech-stack:
  added: ["@lhci/cli@0.15.1", "treosh/lighthouse-ci-action@v12"]
  patterns: ["PR-only CI jobs with warn-only assertions", "Lighthouse server mode with startServerCommand"]

key-files:
  modified:
    - lighthouserc.js
    - .github/workflows/ci.yml
    - package.json

key-decisions:
  - "All assertions warn-only (no PR blocking) per phase decision"
  - "Server mode (startServerCommand) instead of staticDistDir for App Router compatibility"
  - "4 customer routes only (no admin, driver, or tracking routes)"
  - "temporary-public-storage for report links (no self-hosted LHCI server)"

patterns-established:
  - "PR-only CI job pattern: if: github.event_name == 'pull_request'"
  - "Lighthouse warn-only assertions for performance monitoring without blocking"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 44 Plan 03: Lighthouse CI Setup Summary

**Lighthouse CI regression gate with warn-only Core Web Vitals assertions on 4 customer routes via treosh/lighthouse-ci-action@v12**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T10:45:44Z
- **Completed:** 2026-02-06T10:49:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- @lhci/cli installed and lighthouserc.js rewritten for server mode with 4 customer routes
- All 6 assertions set to warn-only (FCP, LCP, CLS, TBT, performance score, accessibility score)
- Lighthouse CI job added to GitHub Actions, runs only on PRs after build job passes
- Reports upload to temporary-public-storage for easy viewing

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @lhci/cli and update lighthouserc.js** - `6ca08a1` (chore)
2. **Task 2: Add Lighthouse CI job to GitHub Actions** - `398a786` (feat)

## Files Created/Modified
- `lighthouserc.js` - Rewritten: staticDistDir replaced with startServerCommand, customer routes only, all assertions warn-only
- `.github/workflows/ci.yml` - Added lighthouse job: PR-only, needs build, treosh/lighthouse-ci-action@v12
- `package.json` - Added @lhci/cli@0.15.1 devDependency

## Decisions Made
- All assertions warn-only (no "error" level) -- performance monitoring without blocking PRs
- Server mode via startServerCommand instead of staticDistDir -- required for App Router dynamic routes
- 4 customer routes only (/, /menu, /cart, /checkout) -- tracking requires auth, admin/driver out of scope
- temporary-public-storage for reports -- no self-hosted LHCI server needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 44 (Animation Optimization & Monitoring) is now complete with all 3 plans executed
- Lighthouse CI will automatically audit PRs for performance regressions
- All phases 40-44 optimization work (Server Components, dynamic imports, React Compiler, LazyMotion, Lighthouse CI) now locked in with regression detection

---
*Phase: 44-animation-optimization-monitoring*
*Completed: 2026-02-06*
