---
phase: 65-cicd-hardening
plan: 01
subsystem: infra
tags: [lighthouse, ci, github-actions, stylelint, prettier, eslint, node22]

# Dependency graph
requires:
  - phase: 60-performance-optimization
    provides: LCP optimization baseline and performance targets
provides:
  - Error-level Lighthouse CI assertions for LCP/CLS/performance/accessibility
  - Expanded lint gates (ESLint strict, Stylelint, Prettier) in CI
  - Path filtering to skip Lighthouse on non-code PRs
  - Node 22 across all CI jobs
affects: [66-final-qa]

# Tech tracking
tech-stack:
  added: [dorny/paths-filter@v3]
  patterns: [error-level Lighthouse assertions, path-filtered CI jobs, multi-tool lint job]

key-files:
  modified:
    - lighthouserc.js
    - .github/workflows/ci.yml

key-decisions:
  - "Error-level assertions for LCP <4000ms, CLS <0.15, perf >=0.6, a11y >=0.9"
  - "Mobile-only Lighthouse testing (desktop profile removed from CI)"
  - "Path filtering via dorny/paths-filter skips Lighthouse for docs-only PRs"
  - "Node 22 LTS across all CI jobs (Node 20 EOL April 2026)"
  - "Single lint job with 3 sequential steps (ESLint, Stylelint, Prettier)"

patterns-established:
  - "Path filtering pattern: changes job with dorny/paths-filter consumed by downstream job if conditions"
  - "Lint job pattern: sequential ESLint -> CSS lint -> format check in single job"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 65 Plan 01: CI/CD Hardening Summary

**Error-level Lighthouse CI assertions on LCP/CLS/scores for 5 public routes, expanded lint gates with Stylelint + Prettier + strict ESLint, path filtering via dorny/paths-filter, Node 22 upgrade**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T09:31:48Z
- **Completed:** 2026-02-15T09:34:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Lighthouse CI assertions upgraded from warn to error for LCP (<4000ms), CLS (<0.15), performance (>=0.6), accessibility (>=0.9)
- 5 public routes tested: /, /menu, /login, /privacy, /terms (replaced /cart and /checkout)
- CI lint job expanded with ESLint --max-warnings 0, Stylelint CSS lint, and Prettier format check
- Path filtering skips Lighthouse for docs-only or config-only PRs
- All CI jobs upgraded from Node 20 to Node 22 LTS

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden Lighthouse CI config and add path filtering** - `b49876d` (feat)
2. **Task 2: Expand lint job with CSS lint, Prettier, and strict ESLint** - `db66d61` (feat)

## Files Created/Modified

- `lighthouserc.js` - Error-level assertions, 5 public routes, mobile-only settings
- `.github/workflows/ci.yml` - Path filtering, expanded lint, Node 22

## Decisions Made

- Error-level assertions for LCP <4000ms, CLS <0.15 (matching project targets from Phase 60)
- Performance score floor 0.6, accessibility score floor 0.9 (pragmatic baselines)
- FCP and TBT kept as warn-only (informational, not blocking)
- Desktop profile removed from CI (mobile-first delivery app; desktop script kept for local use)
- Single lint job with sequential steps (avoids ~30s setup overhead per additional job)
- Node 22 chosen as current LTS (Node 20 EOL April 2026, matches Vercel runtime)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CI pipeline fully hardened with error-level performance gates and expanded lint checks
- Advisory-only (checks visible on PRs but merge not blocked -- branch protection deferred)
- Ready for Phase 66 (Final QA) or any future branch protection enablement

---

_Phase: 65-cicd-hardening_
_Completed: 2026-02-15_
