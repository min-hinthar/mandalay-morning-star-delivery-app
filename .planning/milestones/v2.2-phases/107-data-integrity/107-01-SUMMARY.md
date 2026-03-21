---
phase: 107-data-integrity
plan: 01
subsystem: database
tags: [postgres, rpc, concurrency, for-update-skip-locked, race-condition]

# Dependency graph
requires: []
provides:
  - promote_next_stop PostgreSQL RPC with FOR UPDATE SKIP LOCKED
  - promote_next_stop TypeScript type in database.ts
  - Dead increment_driver_deliveries code removed
affects: [107-02, route-completion, driver-routes]

# Tech tracking
tech-stack:
  added: []
  patterns: [FOR UPDATE SKIP LOCKED for concurrent row locking]

key-files:
  created:
    - supabase/migrations/20260321_atomic_stop_promotion.sql
  modified:
    - src/types/database.ts
    - src/app/api/driver/routes/[routeId]/complete/route.ts

key-decisions:
  - "Removed increment_driver_deliveries dead code from route complete handler (trigger handles it)"

patterns-established:
  - "FOR UPDATE SKIP LOCKED: use for any concurrent row selection that must prevent double-processing"

requirements-completed: [DATA-01, DATA-02]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 107 Plan 01: Atomic Stop Promotion RPC Summary

**PostgreSQL promote_next_stop RPC with FOR UPDATE SKIP LOCKED preventing concurrent double-promotion, plus dead code cleanup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T10:33:39Z
- **Completed:** 2026-03-20T10:37:48Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created promote_next_stop RPC with atomic row locking via FOR UPDATE SKIP LOCKED
- Added promote_next_stop TypeScript type entry in database.ts
- Removed dead increment_driver_deliveries type and RPC call (trigger handles delivery counting)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create promote_next_stop RPC migration** - `5974393d` (feat)
2. **Task 2: Update database.ts types** - `9f8fd887` (feat)

## Files Created/Modified
- `supabase/migrations/20260321_atomic_stop_promotion.sql` - Atomic stop promotion RPC with FOR UPDATE SKIP LOCKED
- `src/types/database.ts` - Added promote_next_stop type, removed increment_driver_deliveries type
- `src/app/api/driver/routes/[routeId]/complete/route.ts` - Removed dead increment_driver_deliveries RPC call

## Decisions Made
- Removed increment_driver_deliveries dead code from route complete handler -- the update_driver_deliveries_count trigger on route_stops already handles delivery counting automatically

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Dead Code] Removed increment_driver_deliveries RPC call from complete handler**
- **Found during:** Task 2 (typecheck after removing type)
- **Issue:** Route complete handler called increment_driver_deliveries RPC which no longer exists in types; the trigger update_driver_deliveries_count already handles this
- **Fix:** Removed the dead try/catch block, added comment explaining trigger handles it
- **Files modified:** src/app/api/driver/routes/[routeId]/complete/route.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 9f8fd887 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 dead code removal)
**Impact on plan:** Necessary for typecheck to pass after type removal. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- promote_next_stop RPC ready for Plan 02 to wire into the TypeScript stop-complete handler
- Types aligned for Plan 02's handler changes

---
*Phase: 107-data-integrity*
*Completed: 2026-03-20*
