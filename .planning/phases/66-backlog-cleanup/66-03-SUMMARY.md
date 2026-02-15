---
phase: 66-backlog-cleanup
plan: 03
subsystem: ui
tags: [google-maps, markers, polyline, animation, stepper, framer-motion, tracking]

requires:
  - phase: 66-02
    provides: "Tracking page foundation with DeliveryMap, StatusTimeline, real-time subscription"
provides:
  - "Custom branded markers (restaurant, vehicle, destination) for AdvancedMarkerElement"
  - "Route progress line with completed/remaining color split"
  - "Smooth driver marker animation (1s ease-out cubic interpolation)"
  - "Re-center button after user pan/zoom"
  - "Stale location detection with faded marker + timestamp badge"
  - "Horizontal StatusStepper component with pulse animation"
  - "Split-view layout: map 50% / info 50%"
  - "Browser tab title updates with live order status"
affects: [66-04, 66-05]

tech-stack:
  added: []
  patterns:
    - "AdvancedMarkerElement content via raw DOM helper functions (not React)"
    - "requestAnimationFrame marker interpolation with ease-out cubic"
    - "MapContent/MapLegend extraction pattern for file size compliance"
    - "Split-view layout: h-[50vh] mobile, lg:grid-cols-2 desktop"

key-files:
  created:
    - "src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx"
    - "src/components/ui/orders/tracking/DeliveryMap/RoutePolyline.tsx"
    - "src/components/ui/orders/tracking/DeliveryMap/MapContent.tsx"
    - "src/components/ui/orders/tracking/DeliveryMap/MapLegend.tsx"
    - "src/components/ui/orders/tracking/StatusStepper.tsx"
  modified:
    - "src/components/ui/orders/tracking/DeliveryMap/DeliveryMap.tsx"
    - "src/components/ui/orders/tracking/DeliveryMap/constants.ts"
    - "src/components/ui/orders/tracking/DeliveryMap/index.tsx"
    - "src/components/ui/orders/tracking/TrackingPageClient.tsx"
    - "src/components/ui/orders/tracking/index.ts"

key-decisions:
  - "Raw DOM helpers for marker content (AdvancedMarkerElement requires non-React DOM elements)"
  - "Ease-out cubic interpolation for smooth marker animation (not linear)"
  - "Split DeliveryMap into MapContent/MapLegend sub-components for 400-line file limit"
  - "StatusStepper skips pending status (pre-confirmation is implicit)"
  - "Map visible in all order states (not just out_for_delivery)"
  - "zIndex.max token from design system instead of hardcoded 999"

patterns-established:
  - "AdvancedMarkerElement content: create DOM helpers in CustomMarkers.tsx, not inline"
  - "Large map component split: hooks/state in main file, rendering in MapContent"

duration: 20min
completed: 2026-02-15
---

# Phase 66 Plan 03: Enhanced Tracking Map & StatusStepper Summary

**Custom branded map markers with smooth animation, route progress line, re-center button, stale detection, horizontal StatusStepper, and split-view tracking layout**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-15T13:25:21Z
- **Completed:** 2026-02-15T13:45:15Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Custom branded markers for restaurant (red), vehicle (saffron), destination (jade) using AdvancedMarkerElement
- Route progress line with jade solid (completed) and charcoal dashed (remaining) segments
- Smooth driver marker animation via requestAnimationFrame with ease-out cubic interpolation (1s duration)
- Re-center button appears when user pans/zooms, restores auto-fit view
- Stale location detection (>2 min) shows faded 50% opacity driver pin with "Xm ago" badge
- Horizontal StatusStepper: Confirmed -> Preparing -> Out for Delivery -> Delivered with pulse animation
- Split-view layout: map top 50vh / info bottom 50vh (mobile), side-by-side on desktop
- Browser tab title reflects live order status
- Map visible in all states including pre-delivery (restaurant pin)

## Task Commits

1. **Task 1: Enhanced DeliveryMap** - `503ae7c` (feat)
2. **Task 2: StatusStepper + split-view layout** - `e458a0c` (feat)

## Files Created/Modified
- `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` - Branded marker DOM element factories
- `src/components/ui/orders/tracking/DeliveryMap/RoutePolyline.tsx` - Route line with completed/remaining split
- `src/components/ui/orders/tracking/DeliveryMap/MapContent.tsx` - Extracted map overlay rendering
- `src/components/ui/orders/tracking/DeliveryMap/MapLegend.tsx` - Extracted map legend component
- `src/components/ui/orders/tracking/DeliveryMap/DeliveryMap.tsx` - Enhanced with animation, re-center, stale detection
- `src/components/ui/orders/tracking/DeliveryMap/constants.ts` - New constants for animation, stale threshold
- `src/components/ui/orders/tracking/DeliveryMap/index.tsx` - Updated barrel exports
- `src/components/ui/orders/tracking/StatusStepper.tsx` - Horizontal stepper with pulse animation
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` - Split-view layout, tab title, new props
- `src/components/ui/orders/tracking/index.ts` - Added StatusStepper export

## Decisions Made
- Used raw DOM element helpers (not React components) for AdvancedMarkerElement content -- Google Maps API requires plain DOM
- Ease-out cubic interpolation for marker animation provides natural deceleration feel
- Split DeliveryMap.tsx into MapContent.tsx and MapLegend.tsx to stay under 400-line limit
- StatusStepper skips "pending" status from display (it's implicit pre-confirmation state)
- Map rendered in ALL order states (pre-delivery shows restaurant+destination, delivered shows final positions)
- Used zIndex.max design token instead of hardcoded number per lint rules
- text-2xs Tailwind class instead of text-[10px] per lint rules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split DeliveryMap into sub-components for file size compliance**
- **Found during:** Task 1
- **Issue:** DeliveryMap.tsx grew to 677 lines, exceeding 400-line max-lines ESLint rule
- **Fix:** Extracted MapContent.tsx (map overlays/markers rendering) and MapLegend.tsx (legend bar)
- **Files modified:** DeliveryMap.tsx, MapContent.tsx, MapLegend.tsx
- **Verification:** Lint passes, all under 400 lines
- **Committed in:** 503ae7c

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Component split was mechanical extraction with no behavior change. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Enhanced tracking map and StatusStepper ready for visual review
- All new DeliveryMap props (restaurantLocation, orderStatus, lastLocationUpdate) wired through TrackingPageClient
- Split-view layout responsive across mobile/tablet/desktop
- Next plans can build on the tracking UI foundation

---
*Phase: 66-backlog-cleanup*
*Completed: 2026-02-15*
