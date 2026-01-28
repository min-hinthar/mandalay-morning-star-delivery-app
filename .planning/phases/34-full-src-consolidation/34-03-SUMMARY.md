---
phase: 34-full-src-consolidation
plan: 03
subsystem: ui
tags: [design-system, eslint, tokens, consolidation]

# Dependency graph
requires:
  - phase: 34-02
    provides: Migrated all imports from @/design-system/tokens to @/lib/design-system/tokens
provides:
  - design-system/ directory removed from src/
  - ESLint guard blocking @/design-system/* imports
affects: [lib-consolidation, future-token-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ESLint no-restricted-imports for deprecated paths

key-files:
  created: []
  modified:
    - eslint.config.mjs

key-decisions:
  - "ESLint guard uses @/design-system/* pattern only (not **/design-system/* to avoid blocking lib/design-system/)"
  - "Updated zIndex error message to reference @/lib/design-system/tokens/z-index"

patterns-established:
  - "Phase 34 guards in eslint.config.mjs for src/ consolidation"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 34 Plan 03: Delete design-system and Add ESLint Guard Summary

**Deleted src/design-system/ directory and added ESLint guard to block imports from deprecated @/design-system/ path**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28T00:40:00Z
- **Completed:** 2026-01-28T00:45:00Z
- **Tasks:** 3
- **Files modified:** 3 deleted, 1 modified

## Accomplishments

- Deleted src/design-system/tokens/z-index.ts and motion.ts
- Deleted src/design-system/tokens/ and src/design-system/ directories
- Added ESLint guard blocking @/design-system/* imports
- Updated zIndex message to reference new @/lib/design-system/ path
- Verified build, typecheck, and lint all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete old design-system/ directory** - `5394b97` (chore)
2. **Task 2: Add ESLint guard for design-system imports** - `ba5bfcb` (feat)
3. **Task 3: Final verification** - No commit (verification only)

## Files Created/Modified

- `src/design-system/tokens/z-index.ts` - Deleted (144 lines)
- `src/design-system/tokens/motion.ts` - Deleted (migrated to lib/design-system)
- `eslint.config.mjs` - Added design-system import guard, updated zIndex message

## Decisions Made

- ESLint guard pattern uses `["@/design-system/*", "@/design-system"]` only - the broader `**/design-system/*` pattern was avoided because it would incorrectly block the new `@/lib/design-system/` path
- Updated the zIndex error message to reference the new canonical path `@/lib/design-system/tokens/z-index`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed overly broad ESLint pattern**
- **Found during:** Task 2 (Add ESLint guard)
- **Issue:** Initial pattern `**/design-system/*` was blocking imports from @/lib/design-system/
- **Fix:** Removed glob pattern, kept only @/design-system/* and @/design-system
- **Files modified:** eslint.config.mjs
- **Verification:** pnpm lint passes, @/lib/design-system imports work correctly
- **Committed in:** ba5bfcb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix to prevent guard from blocking correct imports. No scope creep.

## Issues Encountered

- Build lock file from concurrent Next.js process required clearing - resolved by waiting and retrying

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- design-system migration complete
- Ready for 34-04 (contexts migration) or other src/ consolidation work
- All imports now use @/lib/design-system/tokens/

---
*Phase: 34-full-src-consolidation*
*Completed: 2026-01-28*
