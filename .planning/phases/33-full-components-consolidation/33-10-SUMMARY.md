---
phase: 33-full-components-consolidation
plan: 10
subsystem: tooling
tags: [eslint, linting, imports, consolidation, code-quality]

# Dependency graph
requires:
  - phase: 33-02
    provides: scroll/ merged to ui/scroll/
  - phase: 33-03
    provides: menu/ merged to ui/menu/
  - phase: 33-05
    provides: layout/, layouts/ deleted
  - phase: 33-07
    provides: admin/, checkout/, driver/, homepage/, orders/ moved
  - phase: 33-08
    provides: tracking/, auth/, onboarding/, mascot/ moved
  - phase: 33-09
    provides: theme/ consolidation verified
provides:
  - ESLint guards for all 14 removed directories
  - Import errors on attempts to import from old paths
  - Migration messages pointing to correct paths
affects: [future-development, code-quality, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns: [no-restricted-imports for directory consolidation guards]

key-files:
  created: []
  modified: [eslint.config.mjs]

key-decisions:
  - "All 14 consolidated directories guarded with no-restricted-imports"
  - "Each guard includes migration message with correct import path"

patterns-established:
  - "ESLint guards prevent recreation of consolidated directories"
  - "Guard messages document the migration path"

# Metrics
duration: 2min
completed: 2026-01-27
---

# Phase 33 Plan 10: ESLint Guards Summary

**ESLint no-restricted-imports rules for all 14 consolidated directories with migration messages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-27T23:33:48Z
- **Completed:** 2026-01-27T23:35:47Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added ESLint guards for all 14 removed directories
- Each guard shows migration path to correct @/components/ui subdirectory
- Verified guards work correctly (test import triggers error)
- Future imports to old paths blocked at lint time

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ESLint guards for all removed directories** - `9c91d49` (chore)

**Note:** Task 2 was verification-only (no file changes to commit)

## Files Created/Modified
- `eslint.config.mjs` - Added 14 no-restricted-imports patterns for consolidated directories

## Guarded Directories

| Directory | New Path | Message |
|-----------|----------|---------|
| menu/ | ui/menu/ | Import from @/components/ui/menu |
| scroll/ | ui/scroll/ | Import from @/components/ui/scroll |
| layout/ | ui/layout/ | Import from @/components/ui/layout |
| layouts/ | ui/layout/ or ui/ | Import from @/components/ui/layout or ui for primitives |
| tracking/ | ui/orders/tracking/ | Import from @/components/ui/orders |
| onboarding/ | ui/auth/ | Import from @/components/ui/auth |
| mascot/ | ui/brand/ | Import from @/components/ui/brand |
| admin/ | ui/admin/ | Import from @/components/ui/admin |
| checkout/ | ui/checkout/ | Import from @/components/ui/checkout |
| driver/ | ui/driver/ | Import from @/components/ui/driver |
| homepage/ | ui/homepage/ | Import from @/components/ui/homepage |
| orders/ | ui/orders/ | Import from @/components/ui/orders |
| auth/ | ui/auth/ | Import from @/components/ui/auth |
| theme/ | ui/theme/ | Import from @/components/ui/theme |

## Decisions Made
- All 14 consolidated directories guarded with no-restricted-imports patterns
- Each pattern includes three variants: `@/components/{dir}/*`, `@/components/{dir}`, `**/components/{dir}/*`
- Migration messages guide developers to correct import paths

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing color token violations (199 errors) appear during lint, but these are unrelated to the import guards added in this plan. The import guards work correctly and no new violations were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All ESLint guards in place
- Ready for phase completion verification (33-11)
- Future development protected from importing old paths

---
*Phase: 33-full-components-consolidation*
*Completed: 2026-01-27*
