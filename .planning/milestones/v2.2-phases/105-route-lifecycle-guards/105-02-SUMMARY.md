---
phase: 105-route-lifecycle-guards
plan: 02
subsystem: api
tags: [route-lifecycle, admin-api, sentry, frontend, migration, status-guard]

requires:
  - phase: 105-route-lifecycle-guards
    provides: "VALID_ROUTE_TRANSITIONS constant, isValidRouteTransition(), getValidRouteTransitions()"
provides:
  - "Admin PATCH lifecycle guard rejecting invalid route status transitions with 400"
  - "Sentry audit trail on admin route status overrides"
  - "Frontend dropdown filtering showing only valid transitions"
  - "CHECK constraint preventing planned routes with driver_id"
affects: [admin-route-management, driver-route-ui, database-constraints]

tech-stack:
  added: []
  patterns: ["Sentry captureMessage for admin audit trail", "Shared validation import in API + UI"]

key-files:
  created:
    - src/app/api/admin/routes/[id]/get-handler.ts
    - supabase/migrations/20260320_route_lifecycle_guards.sql
  modified:
    - src/app/api/admin/routes/[id]/route.ts
    - src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx

key-decisions:
  - "Extracted GET handler to get-handler.ts to keep route.ts under 400-line ESLint limit"
  - "Sentry audit fires after successful DB update to prevent phantom events"
  - "Frontend dropdown renders all 5 statuses but disables invalid ones (not hidden)"

patterns-established:
  - "Admin audit via Sentry captureMessage with tags + extra context"
  - "API route file splitting: extract read-only handlers to co-located sibling files"

requirements-completed: [ROUTE-03]

duration: 8min
completed: 2026-03-20
---

# Phase 105 Plan 02: Admin Lifecycle Guards Summary

**Admin PATCH lifecycle guard with Sentry audit logging, filtered frontend dropdown, and CHECK constraint migration**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T05:15:58Z
- **Completed:** 2026-03-20T05:24:20Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Admin PATCH validates route status transitions against VALID_ROUTE_TRANSITIONS, returns 400 with valid alternatives on rejection
- Sentry captureMessage logs every admin override with routeId, adminUserId, fromStatus, toStatus, timestamp
- Frontend dropdown disables invalid status transitions while keeping all 5 visible in lifecycle order
- CHECK constraint `chk_planned_unassigned` prevents planned routes with driver_id at database level
- accepted_at cleared when admin downgrades to assigned

## Task Commits

Each task was committed atomically:

1. **Task 1: Add lifecycle guard + Sentry audit + timestamp clearing to admin PATCH** - `2f3e6f99` (feat)
2. **Task 2: Filter frontend status dropdown to valid transitions** - `d7cd66f0` (feat)
3. **Task 3: Create re-backfill migration with CHECK constraint** - `b2b36943` (chore)

## Files Created/Modified
- `src/app/api/admin/routes/[id]/route.ts` - Added lifecycle guard, Sentry audit, timestamp clearing in PATCH handler
- `src/app/api/admin/routes/[id]/get-handler.ts` - Extracted GET handler (file split for 400-line limit)
- `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` - Dynamic dropdown with disabled invalid transitions
- `supabase/migrations/20260320_route_lifecycle_guards.sql` - Re-backfill + CHECK constraint

## Decisions Made
- Extracted GET handler to `get-handler.ts` and re-exported from `route.ts` -- adding lifecycle guard pushed file over 400-line ESLint limit
- Sentry captureMessage fires only after successful DB update to prevent phantom audit events on rollback
- Dropdown renders all 5 statuses with invalid ones disabled (not hidden) for visibility into the full lifecycle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extracted GET handler to stay under 400-line ESLint max-lines limit**
- **Found during:** Task 1 (admin PATCH lifecycle guard)
- **Issue:** Adding lifecycle guard + Sentry audit pushed route.ts to 499 lines, exceeding 400-line max-lines ESLint rule
- **Fix:** Extracted GET handler (~190 lines) to `get-handler.ts`, re-exported via `export { GET } from "./get-handler"`
- **Files modified:** `src/app/api/admin/routes/[id]/route.ts`, `src/app/api/admin/routes/[id]/get-handler.ts`
- **Verification:** `pnpm typecheck` and `pnpm lint` pass, route.ts at 305 lines
- **Committed in:** `2f3e6f99` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** File split necessary for lint compliance. No scope creep.

## Issues Encountered
- Pre-existing Prettier formatting issue in CLAUDE.md (out of scope, not caused by changes)

## User Setup Required
- Apply migration `20260320_route_lifecycle_guards.sql` to production Supabase

## Next Phase Readiness
- Phase 105 complete -- all route lifecycle guards in place
- VALID_ROUTE_TRANSITIONS enforced at driver start endpoint (Plan 01), admin PATCH (Plan 02), and frontend dropdown (Plan 02)
- CHECK constraint ready to apply after code deploys

## Self-Check: PASSED

- All 4 files exist on disk
- Commit 2f3e6f99 found in git log
- Commit d7cd66f0 found in git log
- Commit b2b36943 found in git log

---
*Phase: 105-route-lifecycle-guards*
*Completed: 2026-03-20*
