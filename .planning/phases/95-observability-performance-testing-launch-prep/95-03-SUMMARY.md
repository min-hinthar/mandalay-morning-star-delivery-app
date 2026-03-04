---
phase: 95-observability-performance-testing-launch-prep
plan: 03
subsystem: api
tags: [error-handling, api-error, standardization, observability]

# Dependency graph
requires:
  - phase: 95-02
    provides: apiError utility (src/lib/utils/api-error.ts)
provides:
  - Standardized error responses in admin/sections routes (6 files)
  - Standardized error responses in webhook routes (2 files)
  - Standardized error responses in cron/email/driver routes (3 files)
affects: [api-clients, error-handling, observability]

# Tech tracking
tech-stack:
  added: []
  patterns: [apiError structured error responses across all route groups]

key-files:
  created: []
  modified:
    - src/app/api/admin/sections/route.ts
    - src/app/api/admin/sections/[id]/route.ts
    - src/app/api/admin/sections/[id]/items/route.ts
    - src/app/api/admin/sections/publish/route.ts
    - src/app/api/admin/sections/reorder/route.ts
    - src/app/api/admin/sections/most-popular/suggest/route.ts
    - src/app/api/webhooks/stripe/route.ts
    - src/app/api/webhooks/resend/route.ts
    - src/app/api/cron/delivery-reminders/route.ts
    - src/app/api/emails/test/route.ts
    - src/app/api/driver/location/route.ts

key-decisions:
  - "auth.status mapped to UNAUTHORIZED/FORBIDDEN based on status code (401/403)"
  - "Webhook signature errors mapped to BAD_REQUEST (400), not UNAUTHORIZED"
  - "Zod validation errors include details via apiError 4th parameter"

patterns-established:
  - "apiError() for all error responses: apiError(CODE, message, status, details?)"
  - "Auth check pattern: auth.status === 403 ? FORBIDDEN : UNAUTHORIZED"

requirements-completed: [OBS-01]

# Metrics
duration: 9min
completed: 2026-03-04
---

# Phase 95 Plan 03: API Error Standardization (Sections/Webhooks/Remaining) Summary

**Migrated 11 API routes from flat `{error: "string"}` to structured `{error: {code, message, details?}}` format using apiError utility**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-04T06:55:25Z
- **Completed:** 2026-03-04T07:04:16Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- All 6 admin/sections routes migrated to structured apiError format
- Both webhook routes (stripe, resend) migrated to structured apiError format
- 3 previously-excluded routes (cron/delivery-reminders, emails/test, driver/location) migrated for OBS-01 coverage

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate admin/sections routes to apiError (6 files)** - `becdbfba` (feat)
2. **Task 2: Migrate webhooks + remaining routes to apiError (5 files)** - `0cf76f34` (feat)

## Files Created/Modified
- `src/app/api/admin/sections/route.ts` - Sections CRUD with structured errors
- `src/app/api/admin/sections/[id]/route.ts` - Section detail/update/delete/actions with structured errors
- `src/app/api/admin/sections/[id]/items/route.ts` - Section items CRUD with structured errors
- `src/app/api/admin/sections/publish/route.ts` - Publish endpoint with structured errors
- `src/app/api/admin/sections/reorder/route.ts` - Reorder endpoint with structured errors
- `src/app/api/admin/sections/most-popular/suggest/route.ts` - Suggest endpoint with structured errors
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook with structured errors
- `src/app/api/webhooks/resend/route.ts` - Resend webhook with structured errors
- `src/app/api/cron/delivery-reminders/route.ts` - Cron endpoint with structured errors
- `src/app/api/emails/test/route.ts` - Test email endpoint with structured errors
- `src/app/api/driver/location/route.ts` - Driver location with structured errors

## Decisions Made
- Auth check uses ternary `auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED"` for correct code mapping
- Webhook signature verification failures use BAD_REQUEST (not UNAUTHORIZED) since they indicate malformed requests
- Zod validation errors pass `parsed.error.flatten()` as `details` parameter to apiError for client debugging

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing typecheck error in `src/app/api/webhooks/stripe/__tests__/route.test.ts` (Stripe type mismatch) - out of scope, not related to error standardization changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 11 routes in plan scope now use structured error format
- OBS-01 requirement coverage extended across sections, webhooks, cron, email, and driver routes
- Ready for Plan 04 (next wave of observability work)

## Self-Check: PASSED

- All 11 modified files exist on disk
- Both task commits verified: becdbfba, 0cf76f34
- SUMMARY.md created at expected path

---
*Phase: 95-observability-performance-testing-launch-prep*
*Completed: 2026-03-04*
