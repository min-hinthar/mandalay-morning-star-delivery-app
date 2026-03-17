---
phase: 101-driver-experience
plan: 02
subsystem: api
tags: [next-api, react-hooks, react-email, resend, supabase-rls, tdd, zod]

# Dependency graph
requires:
  - phase: 101-01
    provides: assigned/accepted enum values, route status types, email type registration
provides:
  - POST /api/driver/routes/[routeId]/accept endpoint
  - POST /api/driver/routes/[routeId]/decline endpoint with service client RLS bypass
  - POST /api/driver/routes/[routeId]/reorder endpoint with Zod validation
  - useAcceptRoute hook with loading state and toast
  - useDeclineRoute hook with reason support and toast
  - useDriverReorderStops hook with silent save pattern
  - RouteDeclineAlert email template for admin notification
affects: [101-04-driver-ui, 101-05-admin-ops]

# Tech tracking
tech-stack:
  added: []
  patterns: [service-client-rls-bypass, after-email-fire-and-forget, driver-action-rate-limit]

key-files:
  created:
    - src/app/api/driver/routes/[routeId]/accept/route.ts
    - src/app/api/driver/routes/[routeId]/decline/route.tsx
    - src/app/api/driver/routes/[routeId]/reorder/route.ts
    - src/emails/RouteDeclineAlert.tsx
    - src/lib/hooks/useAcceptRoute.ts
    - src/lib/hooks/useDeclineRoute.ts
    - src/lib/hooks/useDriverReorderStops.ts
    - src/lib/hooks/__tests__/useAcceptRoute.test.ts
    - src/lib/hooks/__tests__/useDeclineRoute.test.ts
    - src/lib/hooks/__tests__/useDriverReorderStops.test.ts
  modified: []

key-decisions:
  - "Decline route uses createServiceClient() to bypass RLS since driver_id is nulled during mutation"
  - "Decline email sent via after() for fire-and-forget with try/catch for non-blocking errors"
  - "Driver reorder uses same batch_update_stop_indices RPC as admin reorder"
  - "Decline route file is .tsx (not .ts) to support JSX email template in after() callback"

patterns-established:
  - "Driver action hooks: useState for loading, useCallback for async action, toast for feedback"
  - "Silent save pattern: reorder hook shows no toast on success, only error toast on failure"

requirements-completed: [DRV-01, DRV-03]

# Metrics
duration: 12min
completed: 2026-03-16
---

# Phase 101 Plan 02: Accept/Decline/Reorder API + Hooks Summary

**3 driver API endpoints (accept/decline/reorder) with auth+rate-limit+ownership pattern, 3 TDD client hooks with 14 passing tests, and RouteDeclineAlert email template**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-16T08:16:54Z
- **Completed:** 2026-03-16T08:28:54Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Accept endpoint with assigned-only status guard and accepted_at timestamp
- Decline endpoint using service client to bypass RLS (driver_id nulled) with after() email notification
- Reorder endpoint with Zod validation and batch_update_stop_indices RPC
- RouteDeclineAlert email template with driver name, date, stop count, reason, and reassign CTA
- 3 client hooks with loading states and toast feedback (TDD: 14 tests all passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Accept, decline, reorder API endpoints + React Email template** - `b78b16ea` (feat)
2. **Task 2 RED: Failing tests for hooks** - `bffd7623` (test)
3. **Task 2 GREEN: Hook implementations** - `3aeb4dbf` (feat)

## Files Created/Modified
- `src/app/api/driver/routes/[routeId]/accept/route.ts` - Accept route endpoint with assigned status guard
- `src/app/api/driver/routes/[routeId]/decline/route.tsx` - Decline endpoint with service client RLS bypass + after() email
- `src/app/api/driver/routes/[routeId]/reorder/route.ts` - Driver stop reorder with Zod validation + RPC
- `src/emails/RouteDeclineAlert.tsx` - Decline notification email following AdminNewOrderAlert pattern
- `src/lib/hooks/useAcceptRoute.ts` - Accept route mutation hook
- `src/lib/hooks/useDeclineRoute.ts` - Decline route mutation hook with reason support
- `src/lib/hooks/useDriverReorderStops.ts` - Driver reorder stops mutation hook
- `src/lib/hooks/__tests__/useAcceptRoute.test.ts` - 5 tests for accept hook
- `src/lib/hooks/__tests__/useDeclineRoute.test.ts` - 5 tests for decline hook
- `src/lib/hooks/__tests__/useDriverReorderStops.test.ts` - 4 tests for reorder hook

## Decisions Made
- Decline route uses `createServiceClient()` to bypass RLS since the mutation nulls `driver_id`, which would cause RLS to block the update (Pitfall 9 from RESEARCH.md)
- Decline email sent via `after()` for fire-and-forget pattern per gotcha about `void asyncFn()` being killed on Vercel
- Decline route file is `.tsx` extension to support JSX email template rendering in the `after()` callback
- Driver reorder reuses same `batch_update_stop_indices` RPC as admin (SECURITY DEFINER handles permissions)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 API endpoints ready for driver UI (Plan 04) to consume
- All 3 hooks exported and ready for import in driver components
- Email template will be sent automatically when drivers decline routes
- Plan 03 (status filter audit) and Plan 04 (driver UI) can proceed

## Self-Check: PASSED

All 10 created files verified on disk. All 3 task commits verified in git log.

---
*Phase: 101-driver-experience*
*Completed: 2026-03-16*
