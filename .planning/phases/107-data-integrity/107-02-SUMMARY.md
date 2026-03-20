---
phase: 107-data-integrity
plan: 02
subsystem: api
tags: [supabase-rpc, race-condition, dead-code, driver-badges, atomic-operations]

# Dependency graph
requires:
  - phase: 107-01
    provides: "promote_next_stop RPC function and database.ts type definition"
provides:
  - "Atomic stop promotion via RPC in stop handler (no race condition)"
  - "Accurate badge totalDeliveries (no double-count)"
  - "Clean route completion handler (no dead RPC calls)"
affects: [driver-routes, badges, route-completion]

# Tech tracking
tech-stack:
  added: []
  patterns: ["RPC-first for multi-table mutations", "type-cast Json RPC results via interface"]

key-files:
  created: []
  modified:
    - "src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts"
    - "src/app/api/driver/routes/[routeId]/complete/route.ts"

key-decisions:
  - "Cast RPC Json return to PromotionResult interface for type safety"
  - "Badge totalDeliveries uses deliveries_count directly -- trigger is sole source of truth"

patterns-established:
  - "RPC Json results cast via local interface + `as unknown as T`"

requirements-completed: [DATA-01, DATA-02]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 107 Plan 02: TypeScript Handler Updates Summary

**Atomic stop promotion via promote_next_stop RPC and badge double-count fix in route completion handler**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T10:40:46Z
- **Completed:** 2026-03-20T10:48:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced race-prone inline SELECT+UPDATE stop promotion with atomic `promote_next_stop` RPC call
- Removed dead `updateRouteStats` function and unused imports (`createClient`, `RouteStats`)
- Fixed badge `totalDeliveries` double-count by removing `+ stats.delivered_stops` (trigger already counted)
- Added structured logging for promotion success/failure/empty paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace inline stop promotion with promote_next_stop RPC call** - `4f9aaf49` (feat)
2. **Task 2: Fix badge totalDeliveries double-count** - `6d6f1aeb` (fix)

**Formatting fix:** `2273b2a0` (chore: prettier formatting)

## Files Created/Modified
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` - Atomic stop promotion via RPC, removed updateRouteStats and unused imports
- `src/app/api/driver/routes/[routeId]/complete/route.ts` - Fixed badge double-count (deliveries_count is sole truth)

## Decisions Made
- Cast RPC `Json` return type to local `PromotionResult` interface for type safety (avoids property access on union type)
- Badge `totalDeliveries` uses `deliveries_count` directly since the `update_driver_deliveries_count` trigger fires per-stop during delivery

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error on RPC Json return**
- **Found during:** Task 1
- **Issue:** `promote_next_stop` RPC returns `Json` type (union), property access fails TypeScript strict checks
- **Fix:** Added `PromotionResult` interface and cast `rpcData as unknown as PromotionResult | null`
- **Files modified:** `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts`
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `4f9aaf49` (part of Task 1 commit)

**2. [Rule 1 - Bug] Task 2 dead code removal already done by 107-01**
- **Found during:** Task 2
- **Issue:** `increment_driver_deliveries` call was already removed by 107-01 executor as a deviation
- **Fix:** No action needed -- only the badge double-count fix remained
- **Files modified:** None (already clean)
- **Verification:** grep confirms 0 matches for `increment_driver_deliveries`

---

**Total deviations:** 2 (1 type error auto-fix, 1 no-op from prior plan overlap)
**Impact on plan:** Type cast was necessary for correctness. Prior plan overlap had zero impact.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 107 complete: all data integrity fixes (RPC, types, handlers) are in place
- `promote_next_stop` RPC wired end-to-end (migration from 107-01, handler from 107-02)
- `update_driver_deliveries_count` trigger confirmed as sole source of truth for delivery counts
- Full verification suite passes (818 tests, build clean)

---
## Self-Check: PASSED

All files exist, all commits verified (4f9aaf49, 6d6f1aeb, 2273b2a0).

---
*Phase: 107-data-integrity*
*Completed: 2026-03-20*
