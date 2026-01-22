---
phase: 01-foundation-token-system
plan: 05
subsystem: infra
tags: [eslint, linting, z-index, migration, build]

# Dependency graph
requires:
  - phase: 01-03
    provides: Z-index ESLint rules (originally at error severity)
provides:
  - Build pipeline passes (lint, typecheck, build all exit 0)
  - Z-index rules at warn severity for legacy code awareness
  - Migration tracking document for phased z-index remediation
affects: [02-homepage, 03-menu, 04-cart, 05-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Phased migration pattern for legacy code enforcement
    - Warn-then-error rule escalation strategy

key-files:
  created:
    - .planning/phases/01-foundation-token-system/Z-INDEX-MIGRATION.md
  modified:
    - eslint.config.mjs

key-decisions:
  - "Downgrade z-index rules to warn (not disable) to maintain awareness"
  - "Track violations by migration phase for natural cleanup during component rebuilds"

patterns-established:
  - "Legacy code tolerance: warn in Phase 1, fix during rebuild phases, error post-Phase 4"

# Metrics
duration: 7min
completed: 2026-01-22
---

# Phase 01 Plan 05: Z-Index Rule Severity Gap Closure Summary

**Build pipeline unblocked by downgrading z-index ESLint rules to warn with 64 violations tracked for phased migration**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-22T10:02:04Z
- **Completed:** 2026-01-22T10:09:01Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Build passes: `pnpm lint && pnpm lint:css && pnpm typecheck && pnpm build` all exit 0
- Z-index rules remain active at warn level (64 warnings surfaced, not hidden)
- Migration tracker documents all 28 affected files mapped to rebuild phases

## Task Commits

Each task was committed atomically:

1. **Task 1: Downgrade z-index ESLint rules to warn** - `3b47608` (fix)
2. **Task 2: Create migration tracking document** - `f44585e` (docs)
3. **Task 3: Verify full build pipeline passes** - (verification only, no commit)

## Files Created/Modified

- `eslint.config.mjs` - Changed no-restricted-syntax from "error" to "warn" for z-index rules
- `.planning/phases/01-foundation-token-system/Z-INDEX-MIGRATION.md` - Tracks 64 violations across 28 files with phase assignments

## Decisions Made

- **Warn not disable:** Rules stay active at warn to maintain visibility; developers see violations but build doesn't fail
- **Phase-based migration:** Violations mapped to rebuild phases (2-5) for natural cleanup during component rewrites

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 foundation fully complete and verified
- Build pipeline passing enables Phase 2 development
- Z-index violations documented for cleanup during component rebuilds in Phases 2-5
- Post-Phase 4: Consider upgrading rules back to error once legacy components migrated

---
*Phase: 01-foundation-token-system*
*Completed: 2026-01-22*
