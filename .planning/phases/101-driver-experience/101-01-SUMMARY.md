---
phase: 101-driver-experience
plan: 01
subsystem: database
tags: [postgres, enum, migration, typescript, zod, email]

requires:
  - phase: 100-admin-route-editing
    provides: split_route and merge_routes RPCs, route pipeline hardening
provides:
  - "route_status enum with 5 values: planned, assigned, accepted, in_progress, completed"
  - "4 new route columns: accepted_at, declined_at, declined_reason, declined_by"
  - "Updated split_route/merge_routes RPCs for assigned/accepted lifecycle"
  - "TypeScript types, Zod schemas, email type registration for admin_route_decline"
affects: [101-02, 101-03, 101-03b, 101-04, 101-05]

tech-stack:
  added: []
  patterns:
    - "Separate migration files for ALTER TYPE ADD VALUE (non-transactional) vs backfill"
    - "Status-aware RPC updates: split assigns based on driver, merge resets to assigned"

key-files:
  created:
    - supabase/migrations/20260316_route_status_enum_extend.sql
    - supabase/migrations/20260316_route_status_backfill.sql
    - supabase/migrations/20260316_route_rpc_status_update.sql
  modified:
    - src/types/database.ts
    - src/types/driver.ts
    - src/lib/validations/route.ts
    - src/lib/email/types.ts

key-decisions:
  - "Enum extension in separate file from backfill for PostgreSQL transaction safety"
  - "Split route sets new route to assigned if driver provided, planned otherwise"
  - "Merge route resets target to assigned (with accepted_at=NULL) when target has driver"
  - "admin_route_decline mapped to order_updates preference key"

patterns-established:
  - "Non-transactional enum extension: always separate migration file"
  - "Route lifecycle: planned -> assigned -> accepted -> in_progress -> completed"

requirements-completed: [DRV-01, DRV-02]

duration: 3min
completed: 2026-03-16
---

# Phase 101 Plan 01: Route Status Enum & Type Foundation Summary

**Extended route_status enum with assigned/accepted, added 4 decline-tracking columns, updated split/merge RPCs, and aligned TypeScript types + Zod schemas + email type registration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T08:10:23Z
- **Completed:** 2026-03-16T08:13:41Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- 3 migration files: enum extension, column backfill, RPC updates (properly separated for transaction safety)
- database.ts, driver.ts, route.ts all updated with 5-value route_status
- 4 new route columns (accepted_at, declined_at, declined_reason, declined_by) in Row/Insert/Update types
- admin_route_decline email type registered in 4 locations (union, MANDATORY, ADMIN, mapTypeToPrefKey)
- Updated split_route to set status=assigned when driver provided, and reset accepted routes on split
- Updated merge_routes to accept assigned/accepted sources and set target to assigned after merge

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations** - `6e87b497` (feat)
2. **Task 2: TypeScript types, Zod schemas, email type** - `5202967f` (feat)

## Files Created/Modified
- `supabase/migrations/20260316_route_status_enum_extend.sql` - ALTER TYPE ADD VALUE for assigned and accepted
- `supabase/migrations/20260316_route_status_backfill.sql` - 4 new columns + planned->assigned backfill
- `supabase/migrations/20260316_route_rpc_status_update.sql` - Updated split_route and merge_routes
- `src/types/database.ts` - Enum, array, Row/Insert/Update types extended
- `src/types/driver.ts` - RouteStatus union extended
- `src/lib/validations/route.ts` - Zod routeStatusSchema extended
- `src/lib/email/types.ts` - admin_route_decline in 4 locations

## Decisions Made
- Enum extension in separate migration file from backfill (PostgreSQL ALTER TYPE ADD VALUE is non-transactional)
- Split route: new route status = 'assigned' when driver provided, 'planned' otherwise
- Merge routes: target reset to 'assigned' with accepted_at=NULL (driver must re-accept modified route)
- admin_route_decline mapped to order_updates preference key (admin notification category)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 4 expected downstream type errors in Record<RouteStatus,...> maps (RecentRoutesSection, RouteHeader, RouteListTable/types) -- these are documented in the plan as expected, to be resolved in Plans 03a and 03b.

## User Setup Required

None - no external service configuration required. Migrations must be applied to production Supabase (existing pending todo).

## Next Phase Readiness
- Route status enum foundation complete with all 5 values
- Type contracts in place for all downstream plans (02-05)
- Split/merge RPCs updated for the accept/decline lifecycle
- Email type registered for admin decline notification (template to be built in Plan 02)

---
*Phase: 101-driver-experience*
*Completed: 2026-03-16*
