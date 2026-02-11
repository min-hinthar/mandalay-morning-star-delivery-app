---
phase: 57-admin-driver-polish
plan: 06
subsystem: ui
tags: [driver, history, on-time, skeleton, shimmer, animated-value, framer-motion]

requires:
  - phase: 57-01
    provides: Skeleton shimmer base, SkeletonCrossfade, AnimatedValue, EmptyState variants, teal accent tokens
provides:
  - Real on-time percentage computation from route_stops + orders delivery_window_end
  - HistorySummaryCard collapsible component for driver history
  - HistorySkeleton shimmer loading state for history page
  - DriverHistoryContent client component with animated stats
  - Driver dashboard shimmer skeleton + animated stat cards (prior commit)
affects: [driver-performance, analytics]

tech-stack:
  added: []
  patterns:
    - "Server-side on-time computation: route_stops.delivered_at vs orders.delivery_window_end"
    - "Collapsible card with AnimatePresence height animation"
    - "Color-coded on-time badges: green >= 90%, amber >= 75%, red < 75%"

key-files:
  created:
    - src/components/ui/driver/DriverDashboard/HistorySummaryCard.tsx
    - src/components/ui/driver/DriverDashboard/HistorySkeleton.tsx
    - src/app/(driver)/driver/history/DriverHistoryContent.tsx
  modified:
    - src/app/(driver)/driver/history/page.tsx

key-decisions:
  - "HIST-06-ONTIME: On-time computed server-side from delivered_at <= delivery_window_end; falls back to on-time when no window data"
  - "HIST-06-SPLIT: DriverHistoryContent extracted as client component for AnimatedValue + framer-motion animations"
  - "HIST-06-COLORCODE: On-time percentage color-coded: green >= 90%, amber/secondary >= 75%, red < 75%"

patterns-established:
  - "On-time pattern: query route_stops + orders, compare timestamps, aggregate per-route and overall"
  - "Collapsible card: collapsed row with chevron + AnimatePresence expand for detail section"

duration: 7min
completed: 2026-02-11
---

# Phase 57 Plan 06: Driver History Real On-Time + Summary Cards Summary

**Real on-time percentage from route_stops/orders data, collapsible history summary cards with color-coded on-time badges, shimmer skeletons, animated stat counters**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-11T18:30:48Z
- **Completed:** 2026-02-11T18:38:17Z
- **Tasks:** 2
- **Files modified:** 8 (Task 1: 5 files from prior commit, Task 2: 4 files)

## Accomplishments

- Replaced hardcoded 98% on-time with real computation from route_stops.delivered_at vs orders.delivery_window_end
- Created collapsible HistorySummaryCard with per-route on-time %, stop count, duration, and expandable stop details
- Created HistorySkeleton shimmer loading for history page (3 stat shapes + 5 card shapes)
- Added AnimatedValue counting animation to all history stat cards
- Applied teal accent throughout driver history with gradient stat mini-cards
- Empty history uses food-themed emoji EmptyState (driver-history variant)

## Task Commits

Each task was committed atomically:

1. **Task 1: Driver dashboard shimmer skeleton + animated stat cards** - `dee57a8` (feat) -- committed in prior session
2. **Task 2: Driver history real on-time % + summary cards + skeleton** - `cbc66bb` (feat)

## Files Created/Modified

- `src/app/(driver)/driver/history/page.tsx` - Server component with real on-time computation from route_stops + orders
- `src/app/(driver)/driver/history/DriverHistoryContent.tsx` - Client component with animated stats, summary cards, empty state
- `src/components/ui/driver/DriverDashboard/HistorySummaryCard.tsx` - Collapsible route summary card with on-time color coding
- `src/components/ui/driver/DriverDashboard/HistorySkeleton.tsx` - Shimmer skeleton matching history page layout
- `src/app/(driver)/driver/page.tsx` - Shimmer skeleton for dashboard loading (Task 1)
- `src/components/ui/driver/DriverDashboard/StatCard.tsx` - AnimatedValue + teal gradient (Task 1)
- `src/components/ui/driver/DriverDashboard/RouteCard.tsx` - whileHover/whileTap interactions (Task 1)
- `src/components/ui/driver/DriverDashboard/DriverDashboard.tsx` - staggerContainer on stats grid (Task 1)

## Decisions Made

- **HIST-06-ONTIME:** On-time computed by comparing route_stops.delivered_at <= orders.delivery_window_end. When delivery window data is missing, stop is assumed on-time (best effort; noted as limitation).
- **HIST-06-SPLIT:** Created DriverHistoryContent as a client component separate from the server page, to support AnimatedValue and framer-motion animations while keeping data fetching server-side.
- **HIST-06-COLORCODE:** On-time percentage badges are color-coded: green for >= 90%, amber/secondary for >= 75%, red/status-error for < 75%.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 1 was already committed from a prior session (dee57a8). Verified the work matched plan requirements and proceeded to Task 2.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Driver history now displays real on-time data computed from actual delivery timestamps
- All driver pages (dashboard, history, route) now use shimmer skeleton loading with no animate-pulse
- Ready for remaining phase 57 plans (driver detail performance section, etc.)

---
*Phase: 57-admin-driver-polish*
*Completed: 2026-02-11*
