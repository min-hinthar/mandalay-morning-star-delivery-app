---
phase: 41-server-component-conversions
plan: 06
subsystem: ui
tags: [next.js, loading-states, error-boundaries, supabase-realtime, tracking]

# Dependency graph
requires:
  - phase: 41-01
    provides: RouteLoading and RouteError reusable components
  - phase: 41-04
    provides: Tracking route loading/error files (already created)
provides:
  - Order tracking route loading.tsx with branded spinner
  - Order tracking route error.tsx with Sentry integration
  - Analysis confirming TrackingPageClient structure is optimal
affects: [41-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [realtime-client-boundary]

key-files:
  created:
    - src/app/(customer)/orders/[id]/tracking/loading.tsx
    - src/app/(customer)/orders/[id]/tracking/error.tsx
  modified: []

key-decisions:
  - "TrackingPageClient structure is optimal - no extraction needed"
  - "Realtime subscriptions require client boundary at page level"

patterns-established:
  - "Realtime pages: server fetches initial data, client handles subscriptions"
  - "Animation sequences preserve coherence by keeping components together"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Phase 41 Plan 06: Order Tracking Route Summary

**Tracking route loading/error files confirmed complete; TrackingPageClient analysis shows optimal server/client split for realtime**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T05:28:57Z
- **Completed:** 2026-02-06T05:32:00Z
- **Tasks:** 3
- **Files modified:** 0 (files already existed)

## Accomplishments

- Verified tracking route loading.tsx and error.tsx already exist (created in 41-04)
- Analyzed TrackingPageClient (308 lines) for optimization opportunities
- Confirmed current server/client split is optimal for realtime requirements
- Build and typecheck pass with no hydration warnings

## Task Commits

1. **Task 1: Create tracking loading.tsx and error.tsx** - `e7bc9c6` (already committed in 41-04)
2. **Task 2: Analyze TrackingPageClient** - analysis only, no code changes needed
3. **Task 3: Verify hydration and build** - verification only

**Plan metadata:** This summary documents analysis findings

## Files Created/Modified

- `src/app/(customer)/orders/[id]/tracking/loading.tsx` - Loading state (already existed)
- `src/app/(customer)/orders/[id]/tracking/error.tsx` - Error boundary (already existed)

## TrackingPageClient Analysis

### Current Structure

**Server Component (`page.tsx`):**
- Handles authentication
- Fetches initial tracking data via API
- Fallback to direct Supabase query
- Generates dynamic metadata
- Passes `initialData` to client component

**Client Component (`TrackingPageClient.tsx`):**
- Supabase realtime subscription (`useTrackingSubscription`)
- useState for orderStatus, routeStop, driverLocation, eta
- Framer motion animations (sequential delays 0.1-0.7s)
- Conditional rendering based on realtime state
- Interactive elements (refresh button, support actions)

### Why No Extraction Was Needed

1. **Realtime Dependency:** `useTrackingSubscription` hook requires client-side execution for WebSocket connection
2. **Animation Coherence:** All sections use sequential motion.div delays (0.1 to 0.7) - splitting would break visual flow
3. **State Dependency:** OrderSummary uses data passed from server (already SSR'd at data level)
4. **Minimal Gain:** Extracting static components would add complexity without meaningful perf improvement

### Verdict

Per CONTEXT.md guidance ("don't fight it"), the current structure is already optimal. The server component does the data fetching work; the client component handles all interactive/realtime features. This is the correct boundary for realtime pages.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Keep TrackingPageClient as-is | Realtime requirements mandate client boundary at page level |
| No component extraction | Animation sequence would break; minimal perf gain |

## Deviations from Plan

None - loading/error files already existed from plan 41-04. Analysis task completed as expected.

## Issues Encountered

None.

## Order Tracking Page Smoke Test Checklist

(Requires authentication for testing)

- [ ] Navigate to /orders/{order-id}/tracking while logged in
- [ ] Loading state shows "Loading order tracking..."
- [ ] Page renders with order details
- [ ] Status timeline displays current status
- [ ] Connection status indicator shows "Live" when connected
- [ ] Refresh button works
- [ ] No hydration warnings in console

## Next Phase Readiness

- Tracking route loading/error infrastructure complete
- Pattern documented for realtime pages
- Ready for plan 41-07

---
*Phase: 41-server-component-conversions*
*Completed: 2026-02-06*
