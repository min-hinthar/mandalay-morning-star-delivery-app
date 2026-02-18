---
phase: 66-backlog-cleanup
plan: 02
subsystem: api
tags: [tracking, realtime, supabase, driver-ratings, typescript]

# Dependency graph
requires:
  - phase: 66-backlog-cleanup plan 01
    provides: backlog cleanup foundation
provides:
  - routeId extraction from routeStopData enabling location subscription
  - restaurantLocation in tracking API for pre-delivery map state
  - shared tracking link support via ?shared=true query param
  - driver_ratings TypeScript types (DriverRatingsRow, DriverRatingsInsert, DriverRatingsUpdate)
  - cancellation fields (cancelledAt, cancellationReason) on TrackingOrderInfo
  - rating field on TrackingData for post-delivery view
affects: [66-03, 66-04, tracking-enhancements, driver-rating-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared access pattern: ?shared=true query param relaxes ownership check while requiring auth"
    - "Restaurant location as constant (RESTAURANT_LOCATION) for single-restaurant app"

key-files:
  created: []
  modified:
    - src/types/tracking.ts
    - src/types/database.ts
    - src/app/api/tracking/[orderId]/route.ts
    - src/app/api/tracking/[orderId]/types.ts
    - src/components/ui/orders/tracking/TrackingPageClient.tsx
    - src/app/(customer)/orders/[id]/tracking/page.tsx

key-decisions:
  - "DriverRatingsRow schema aligned with existing rating route (includes route_stop_id, feedback_text, submitted_at)"
  - "user_id optional in DriverRatingsInsert (existing code omits it, likely DB default from RLS)"
  - "Restaurant location hardcoded as LA coordinates constant (single-restaurant app)"
  - "deliveryNotes aliased from specialInstructions (same data, more semantic name)"
  - "Shared access still requires authentication (just skips ownership check)"

patterns-established:
  - "Shared tracking: ?shared=true param bypasses user_id ownership check while maintaining auth requirement"

# Metrics
duration: 31min
completed: 2026-02-15
---

# Phase 66 Plan 02: Tracking Foundation Summary

**Fixed route_id extraction bug enabling realtime location subscription, extended TrackingData with routeId/restaurantLocation/rating, added driver_ratings DB types and shared tracking link support**

## Performance

- **Duration:** 31 min
- **Started:** 2026-02-15T12:24:48Z
- **Completed:** 2026-02-15T12:55:55Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Fixed the route_id extraction bug: TrackingPageClient now passes routeId to useTrackingSubscription, enabling the location channel subscription for realtime driver location updates
- Extended TrackingData type with routeId, restaurantLocation, and rating fields
- Added DriverRatingsRow/Insert/Update types to database.ts aligned with actual DB schema
- Implemented shared tracking links (?shared=true skips ownership check, still requires auth)
- Added cancellation overlay fields (cancelledAt, cancellationReason) and deliveryNotes to TrackingOrderInfo
- Added driver rating lookup to tracking API response

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend tracking types and database types** - `83b53e7` (feat)
2. **Task 2: Fix route_id extraction in API and wire to TrackingPageClient** - `d59b920` (fix)

## Files Created/Modified

- `src/types/tracking.ts` - Added routeId, restaurantLocation, rating to TrackingData; cancellation fields and deliveryNotes to TrackingOrderInfo
- `src/types/database.ts` - Added DriverRatingsRow, DriverRatingsInsert, DriverRatingsUpdate types and driver_ratings table definition
- `src/app/api/tracking/[orderId]/route.ts` - Extract routeId, add restaurantLocation, shared access, cancellation fields, rating lookup
- `src/app/api/tracking/[orderId]/types.ts` - Added cancelled_at and cancellation_reason to OrderQueryResult
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` - Wire routeId from initialData to useTrackingSubscription
- `src/app/(customer)/orders/[id]/tracking/page.tsx` - Updated fallback TrackingData with new fields

## Decisions Made

- Aligned DriverRatingsRow with existing rating API route schema (route_stop_id, feedback_text, submitted_at columns) instead of the simplified schema in the plan
- Made user_id optional in DriverRatingsInsert since existing code inserts without it (DB likely auto-fills via RLS or default)
- Used hardcoded LA coordinates for restaurant location (single-restaurant app, no restaurant_settings table exists)
- deliveryNotes aliases specialInstructions (same data, semantic naming for UI)
- Shared tracking requires authentication but skips user_id ownership check

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Aligned DriverRatingsRow schema with actual DB columns**

- **Found during:** Task 1 (type definitions)
- **Issue:** Plan specified simplified DriverRatingsRow (id, order_id, driver_id, user_id, rating, created_at) but existing rating route uses route_stop_id, feedback_text, submitted_at columns
- **Fix:** Added route_stop_id, feedback_text, submitted_at to DriverRatingsRow; made user_id optional in Insert
- **Files modified:** src/types/database.ts
- **Verification:** Typecheck passes, existing rating route compatible
- **Committed in:** 83b53e7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Schema alignment essential for compatibility with existing rating API. No scope creep.

## Issues Encountered

- Build fails with ENOENT on build-manifest.json: pre-existing Turbopack/OneDrive sync issue documented in STATE.md. Compilation succeeds; failure is in post-compilation page data collection. Not caused by these changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- routeId extraction working, enabling realtime location subscription for tracking
- TrackingData types ready for Plan 03 (tracking enhancement features)
- driver_ratings types ready for rating UI components
- Shared tracking link support ready for sharing feature implementation

---

_Phase: 66-backlog-cleanup_
_Completed: 2026-02-15_
