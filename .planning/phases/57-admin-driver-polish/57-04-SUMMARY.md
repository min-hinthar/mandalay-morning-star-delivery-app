---
phase: 57-admin-driver-polish
plan: 04
subsystem: ui
tags: [framer-motion, admin, routes, card-row, drawer, skeleton, empty-state, teal]

# Dependency graph
requires:
  - phase: 57-01
    provides: CardRow, StatusBadge, AdminPageHeader, SkeletonCrossfade, InlineErrorCard, EmptyState variants, teal tokens
provides:
  - RouteCardRow with progress bar, status tint, driver avatar, always-visible actions
  - RoutesPageSkeleton shimmer skeleton for routes page
  - RouteDetailDrawer slide-in drawer for route quick view
  - RouteDateHeader sticky date section headers
  - Card-based routes page with stagger, drawer, skeleton crossfade, empty states
affects: [57-05, 57-06, 57-07, 57-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RouteCardRow card row with animated progress bar and status tint"
    - "RouteDetailDrawer slide-in drawer pattern with framer-motion + backdrop"
    - "Date grouping with sticky section headers (Today/Yesterday/date)"
    - "Load more pagination with initial 20 display count"

key-files:
  created:
    - src/components/ui/admin/routes/RouteListTable/RouteCardRow.tsx
    - src/components/ui/admin/routes/RouteListTable/RoutesPageSkeleton.tsx
    - src/components/ui/admin/routes/RouteDetailDrawer.tsx
  modified:
    - src/app/(admin)/admin/routes/page.tsx
    - src/components/ui/admin/routes/RouteListTable/RouteListTable.tsx
    - src/components/ui/admin/routes/RouteListTable/RouteMobileCard.tsx

key-decisions:
  - "ROUTES-04-DRAWER: RouteDetailDrawer uses framer-motion slide-in (no sheet/dialog library) with escape + backdrop close"
  - "ROUTES-04-VOID: onViewRoute/onStatusChange props retained in interface but voided (drawer handles navigation)"
  - "ROUTES-04-DATEGROUP: Routes grouped by date with sticky headers using isToday/isYesterday from date-fns"

patterns-established:
  - "RouteDetailDrawer: Slide-in drawer pattern reusable for any admin detail view"
  - "Date section grouping: groupByDate helper + RouteDateHeader for time-based card lists"
  - "Load more pagination: INITIAL_DISPLAY constant + displayCount state + Load More button"

# Metrics
duration: 8min
completed: 2026-02-11
---

# Phase 57 Plan 04: Admin Routes Card Layout Summary

**Card-based routes page with animated progress bars, date grouping, slide-in drawer, shimmer skeleton crossfade, and teal accent migration**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-11T14:19:57Z
- **Completed:** 2026-02-11T14:27:33Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- RouteCardRow renders premium card with teal progress bar, driver avatar, status tint, always-visible View/Optimize buttons
- RoutesPageSkeleton provides shimmer skeleton matching routes page layout (stat cards + date header + card rows)
- RouteDetailDrawer slides in from right with route summary, stop list, progress bar, action buttons, and "View Full Details" link
- Routes page uses AdminPageHeader with animated teal count badge and breadcrumbs
- SkeletonCrossfade replaces animate-pulse loading with smooth crossfade transition
- All saffron/curry colors migrated to accent-teal throughout routes page
- Date section grouping with sticky "Today" / "Yesterday" / date string headers
- Load more pagination with initial 20 routes displayed
- InlineErrorCard for fetch error state with retry button
- RouteMobileCard updated to use CardRow base for consistent mobile card behavior

## Task Commits

1. **Task 1: RouteCardRow + RoutesPageSkeleton + RouteDetailDrawer** - `c17bb61` (feat)
2. **Task 2: Wire routes page with card rows, skeleton crossfade, empty state, drawer** - `e9038e8` (feat)

## Files Created/Modified

- `src/components/ui/admin/routes/RouteListTable/RouteCardRow.tsx` - Card-based route row with animated progress bar, status tint, driver avatar, always-visible actions, date header
- `src/components/ui/admin/routes/RouteListTable/RoutesPageSkeleton.tsx` - Shimmer skeleton matching routes page layout
- `src/components/ui/admin/routes/RouteDetailDrawer.tsx` - Slide-in drawer with route summary, stop list, progress, action buttons
- `src/app/(admin)/admin/routes/page.tsx` - Rewired with AdminPageHeader, SkeletonCrossfade, InlineErrorCard, teal accent
- `src/components/ui/admin/routes/RouteListTable/RouteListTable.tsx` - Replaced Table with card rows, stagger, date grouping, drawer, empty state, load more
- `src/components/ui/admin/routes/RouteListTable/RouteMobileCard.tsx` - Updated to use CardRow base component with teal accent

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| ROUTES-04-DRAWER | RouteDetailDrawer uses framer-motion slide-in with escape+backdrop close | No sheet/dialog library in project; FM provides consistent animation with rest of admin UI |
| ROUTES-04-VOID | onViewRoute/onStatusChange props retained but voided in RouteListTable | Drawer handles navigation via Link; props kept for interface compat and future per-row actions |
| ROUTES-04-DATEGROUP | Routes grouped by date with sticky headers | Matches CONTEXT.md spec for sticky date section headers ("Today", "Yesterday", date string) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `cn` import from RouteCardRow**
- **Found during:** Task 1 (RouteCardRow typecheck)
- **Issue:** `cn` was imported but not used, causing TS6133 error
- **Fix:** Removed unused import
- **Files modified:** src/components/ui/admin/routes/RouteListTable/RouteCardRow.tsx
- **Verification:** TypeScript passes
- **Committed in:** c17bb61

**2. [Rule 1 - Bug] Fixed unused imports in RouteListTable and RouteMobileCard**
- **Found during:** Task 2 (typecheck)
- **Issue:** `RouteStatus` type, `onViewRoute`/`onStatusChange` destructured but unused; `cardItem` import unused
- **Fix:** Removed RouteStatus import, voided unused props, removed cardItem import
- **Files modified:** RouteListTable.tsx, RouteMobileCard.tsx
- **Verification:** TypeScript passes, lint clean
- **Committed in:** e9038e8

---

**Total deviations:** 2 auto-fixed (2 bugs - unused imports/variables)
**Impact on plan:** Minor cleanup, no scope change.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Routes page complete with premium card layout, drawer, skeleton, empty state
- RouteDetailDrawer pattern can be reused for driver detail or order detail drawers
- Date grouping pattern (groupByDate + RouteDateHeader) reusable for any time-based list
- All 3 admin table pages (orders, drivers, routes) now have consistent card-based treatment

---
*Phase: 57-admin-driver-polish*
*Completed: 2026-02-11*
