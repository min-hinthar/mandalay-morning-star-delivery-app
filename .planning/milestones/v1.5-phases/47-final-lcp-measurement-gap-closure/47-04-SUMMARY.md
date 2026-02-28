---
phase: 47-final-lcp-measurement-gap-closure
plan: 04
subsystem: infra
tags: [ci, playwright, lighthouse, e2e, github-actions, performance]

# Dependency graph
requires:
  - phase: 47-final-lcp-measurement-gap-closure (plans 01-03)
    provides: "Lighthouse CI config, E2E test file, CI workflow foundation"
provides:
  - "E2E test job in CI pipeline (Playwright chromium)"
  - "Desktop Lighthouse profile via LIGHTHOUSE_PROFILE env var"
  - "Verified Lighthouse report persistence (uploadArtifacts + temporaryPublicStorage)"
affects: [47-05, 47-06, v1.6-performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Environment-variable-driven Lighthouse profile switching"
    - "Build artifact reuse between CI jobs (upload/download-artifact)"

key-files:
  created: []
  modified:
    - ".github/workflows/ci.yml"
    - "lighthouserc.js"
    - "package.json"

key-decisions:
  - "Desktop profile via LIGHTHOUSE_PROFILE env var (not separate config file)"
  - "E2E job uses build artifacts from build job (avoids rebuilding)"
  - "Chromium-only in CI (mobile Chrome tested locally)"
  - "Lighthouse report persistence already solved by existing config"

patterns-established:
  - "CI job artifact sharing: build uploads .next, downstream jobs download"
  - "Profile switching via env vars for Lighthouse configurations"

# Metrics
duration: 7min
completed: 2026-02-07
---

# Phase 47 Plan 04: CI E2E & Desktop Lighthouse Summary

**E2E Playwright job added to CI pipeline; Lighthouse desktop profile via LIGHTHOUSE_PROFILE env var toggle**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-07T08:13:50Z
- **Completed:** 2026-02-07T08:20:36Z
- **Tasks:** 3 (2 implementation, 1 verification)
- **Files modified:** 3

## Accomplishments

- E2E test job added to GitHub Actions CI workflow with Playwright chromium
- Desktop Lighthouse profile implemented via environment variable toggle
- Verified existing Lighthouse CI report persistence (uploadArtifacts + temporaryPublicStorage)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add E2E job to CI workflow** - `77a1f9a` (feat)
2. **Task 2: Add desktop profile to Lighthouse config** - `f0c8e3c` (feat)
3. **Task 3: Verify Lighthouse CI integration** - No commit (verification only, no code changes)

## Files Created/Modified

- `.github/workflows/ci.yml` - Added E2E job: checkout, pnpm, Playwright install, download build artifact, run tests, upload report
- `lighthouserc.js` - Refactored to support mobile/desktop profiles via LIGHTHOUSE_PROFILE env var
- `package.json` - Added `lighthouse:desktop` script

## Decisions Made

- **Desktop profile via env var:** Used `LIGHTHOUSE_PROFILE=desktop` rather than separate config file. Keeps single source of truth for URLs, assertions, upload config. Desktop settings match Lighthouse's built-in desktop preset (1350x940, no throttling).
- **Build artifact reuse:** E2E job downloads `.next` build artifact from build job instead of rebuilding. Saves ~2-3 min CI time.
- **Chromium-only in CI:** Mobile Chrome project not needed in CI -- already tested locally via `pnpm test:e2e`.
- **Report persistence already solved:** `uploadArtifacts: true` + `temporaryPublicStorage: true` in ci.yml Lighthouse job + `upload.target: "temporary-public-storage"` in lighthouserc.js already persist reports. No additional work needed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **E2E job already in working tree:** The E2E job had been added to ci.yml in a previous session but never committed. Verified content matched plan spec and committed as Task 1.
- **cross-env not available:** Initially used `cross-env` for the desktop script, but it was not in dependencies. Switched to `VAR=value` prefix pattern consistent with existing `analyze` scripts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- E2E tests now wired into CI (Gap 1 closed)
- Desktop Lighthouse measurements available (Gap 2 closed)
- Report persistence verified (Gap 3 closed)
- Remaining gaps: 47-05 (E2E selector refinement), 47-06 (build verification)

---

_Phase: 47-final-lcp-measurement-gap-closure_
_Completed: 2026-02-07_
