---
phase: 95-observability-performance-testing-launch-prep
plan: 02
subsystem: api
tags: [error-handling, api-errors, nextjs, admin-api]

# Dependency graph
requires: []
provides:
  - "Shared apiError() utility with typed ApiErrorCode union"
  - "extractErrorMessage() backward-compatible client helper"
  - "Structured {error: {code, message, details?}} format on 9 admin/orders routes"
affects: [api-error-handling, admin-dashboard, client-error-parsing]

# Tech tracking
tech-stack:
  added: []
  patterns: [apiError structured error response, typed error codes, backward-compatible error parsing]

key-files:
  created:
    - src/lib/utils/api-error.ts
  modified:
    - src/app/api/admin/orders/route.ts
    - src/app/api/admin/orders/[id]/status/route.ts
    - src/app/api/admin/orders/[id]/cancel/route.ts
    - src/app/api/admin/orders/[id]/driver/route.ts
    - src/app/api/admin/orders/[id]/contact/route.ts
    - src/app/api/admin/orders/[id]/details/route.ts
    - src/app/api/admin/orders/[id]/refund/route.ts
    - src/app/api/admin/orders/[id]/items/route.ts
    - src/app/api/admin/orders/[id]/priority/route.ts

key-decisions:
  - "ApiErrorCode as string literal union (not enum) for tree-shaking and simpler imports"
  - "extractErrorMessage handles both old flat and new structured format for backward compat"
  - "Auth errors mapped by status code: 403->FORBIDDEN, else->UNAUTHORIZED"
  - "Validation details passed via details param to preserve Zod flatten output"

patterns-established:
  - "apiError(code, message, status, details?) for all API error responses"
  - "Structured error format: {error: {code: ApiErrorCode, message: string, details?: unknown}}"
  - "extractErrorMessage(data, fallback) for client-side error parsing"

requirements-completed: [OBS-01]

# Metrics
duration: 8min
completed: 2026-03-04
---

# Phase 95 Plan 02: API Error Standardization Summary

**Shared apiError() utility with typed error codes replacing flat error strings across 9 admin/orders API routes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-04T06:55:32Z
- **Completed:** 2026-03-04T07:03:07Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Created `apiError()` utility with 9-member `ApiErrorCode` union type
- Created `extractErrorMessage()` helper for backward-compatible client-side error parsing
- Migrated all 9 admin/orders route files from flat `{error: "string"}` to structured `{error: {code, message, details?}}`
- Zero flat error responses remain in admin/orders routes (verified via grep)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create apiError utility** - `ec04ed87` (feat)
2. **Task 2: Migrate admin/orders routes to apiError (9 files)** - `a2c97178` (feat)

## Files Created/Modified
- `src/lib/utils/api-error.ts` - Shared apiError() helper, ApiErrorCode type, extractErrorMessage()
- `src/app/api/admin/orders/route.ts` - Order list errors standardized
- `src/app/api/admin/orders/[id]/status/route.ts` - Status transition errors standardized
- `src/app/api/admin/orders/[id]/cancel/route.ts` - Cancel errors standardized
- `src/app/api/admin/orders/[id]/driver/route.ts` - Driver assignment errors standardized
- `src/app/api/admin/orders/[id]/contact/route.ts` - Contact flag errors standardized
- `src/app/api/admin/orders/[id]/details/route.ts` - Order details errors standardized
- `src/app/api/admin/orders/[id]/refund/route.ts` - Refund errors standardized
- `src/app/api/admin/orders/[id]/items/route.ts` - Item edit errors standardized
- `src/app/api/admin/orders/[id]/priority/route.ts` - Priority toggle errors standardized

## Decisions Made
- ApiErrorCode as string literal union (not enum) for tree-shaking and simpler imports
- extractErrorMessage handles both old flat and new structured format for backward compat
- Auth errors mapped by status code: 403->FORBIDDEN, else->UNAUTHORIZED
- Validation details passed via details param to preserve Zod flatten output

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- apiError utility ready for adoption by remaining API routes (non-admin routes)
- extractErrorMessage ready for client-side migration
- Pattern established for consistent error handling across the codebase

## Self-Check: PASSED

- [x] src/lib/utils/api-error.ts exists
- [x] 95-02-SUMMARY.md exists
- [x] Commit ec04ed87 found
- [x] Commit a2c97178 found

---
*Phase: 95-observability-performance-testing-launch-prep*
*Completed: 2026-03-04*
