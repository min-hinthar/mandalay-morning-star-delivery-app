---
phase: 60-lcp-optimization
plan: 02
subsystem: ui
tags: [framer-motion, layoutId, css-transitions, performance, lcp]

# Dependency graph
requires:
  - phase: 60-lcp-optimization (plan 01)
    provides: async domAnimation loader replacing synchronous domMax
provides:
  - 7 components migrated from layoutId (domMax) to CSS transitions (domAnimation-compatible)
  - Zero domMax dependencies in public routes, menu page, and shared UI components
affects: [60-lcp-optimization remaining plans, any future component using Tabs/NavDots]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS indicator pattern: single absolutely-positioned div with transition-all, positioned via tabRefs + offsetLeft/offsetWidth"
    - "ResizeObserver for recalculating indicator position on container resize"

key-files:
  modified:
    - src/components/ui/Tabs.tsx
    - src/components/ui/NavDots.tsx
    - src/components/ui/navigation/BottomNav.tsx
    - src/components/ui/menu/CategoryTabs.tsx
    - src/components/ui/search/CommandPalette/SearchCategoryTabs.tsx
    - src/components/ui/homepage/TestimonialsCarousel.tsx
    - src/components/ui/menu/FeaturedCarousel/CarouselControls.tsx

key-decisions:
  - "Tabs/CategoryTabs/SearchCategoryTabs: single CSS-positioned indicator div instead of per-tab conditional m.div with layoutId"
  - "NavDots: CSS transition-all on dot size/color/boxShadow instead of layoutId overlay div"
  - "BottomNav: calc-based CSS positioning for evenly-spaced nav items instead of per-item conditional m.span"
  - "Removed layoutId prop from Tabs and NavDots interfaces entirely (TypeScript errors guide consumers to update)"

patterns-established:
  - "CSS indicator pattern: useRef<Map> for tab positions, useCallback for updateIndicatorPosition, useEffect to sync, ResizeObserver for responsiveness"
  - "forwardRef for subcomponents that need ref callbacks from parent (SearchCategoryTabs TabPill)"

# Metrics
duration: 37min
completed: 2026-02-14
---

# Phase 60 Plan 02: LayoutId-to-CSS Migration Summary

**7 components migrated from Framer Motion layoutId (domMax) to CSS transition-all indicators, eliminating domMax dependency from public/menu routes**

## Performance

- **Duration:** 37 min
- **Started:** 2026-02-14T09:19:18Z
- **Completed:** 2026-02-14T09:56:04Z
- **Tasks:** 2
- **Files modified:** 10 (7 target + 3 consumers)

## Accomplishments
- Replaced all layoutId-based tab pill animations with CSS-positioned divs using transition-all duration-200
- Replaced NavDots layoutId overlay with CSS transition on size, color, and boxShadow
- Replaced BottomNav per-item conditional indicator with single calc-positioned span
- Removed layoutId prop from Tabs and NavDots interfaces; fixed 3 downstream consumers
- All public routes and menu page now have zero domMax dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Tabs.tsx and BottomNav.tsx to CSS transitions** - `99b0685` (feat) -- committed by plan 60-01 as pre-existing work
2. **Task 2: Migrate CategoryTabs, NavDots, SearchCategoryTabs, carousel dots to CSS** - `3549b03` (feat)

## Files Created/Modified
- `src/components/ui/Tabs.tsx` - CSS-positioned indicator with tabRefs map, removed layoutId prop
- `src/components/ui/navigation/BottomNav.tsx` - calc-based CSS indicator for evenly-spaced items
- `src/components/ui/menu/CategoryTabs.tsx` - CSS-positioned pill indicator with tabRefs map
- `src/components/ui/NavDots.tsx` - CSS transition-all on dot size/color, removed layoutId prop
- `src/components/ui/search/CommandPalette/SearchCategoryTabs.tsx` - CSS indicator with forwardRef TabPill
- `src/components/ui/homepage/TestimonialsCarousel.tsx` - Removed layoutId prop from NavDots usage
- `src/components/ui/menu/FeaturedCarousel/CarouselControls.tsx` - Removed layoutId prop from NavDots usage
- `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx` - Removed layoutId prop from Tabs usage
- `src/components/ui/account/AccountClient.tsx` - Removed layoutId prop from Tabs usage
- `src/components/ui/account/SettingsTab/SettingsTab.tsx` - Removed layoutId prop from Tabs usage

## Decisions Made
- Removed `layoutId` prop entirely from Tabs and NavDots interfaces rather than deprecating -- TypeScript errors naturally guide consumers
- Kept `m.button` in CategoryTabs for whileHover/whileTap (domAnimation features) while removing the layoutId pill
- Kept `m.button` in NavDots for whileHover/whileTap and AnimatePresence for tooltip
- Kept `m.span` in BottomNav for icon scale animation (domAnimation feature)
- Used `__all__` as synthetic key for null-slug "All" tab in CategoryTabs/SearchCategoryTabs ref maps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 already completed by plan 60-01**
- **Found during:** Task 1
- **Issue:** Tabs.tsx and BottomNav.tsx migrations were already committed in `99b0685` by the previous plan (60-01)
- **Fix:** Verified the changes match requirements and skipped redundant work
- **Files modified:** None (already done)
- **Verification:** Confirmed no layoutId in either file, CSS transition-all present

**2. [Rule 1 - Bug] Fixed forwardRef import placement in SearchCategoryTabs**
- **Found during:** Task 2
- **Issue:** forwardRef was imported mid-file instead of at the top with other React imports
- **Fix:** Moved to top-level import statement
- **Files modified:** src/components/ui/search/CommandPalette/SearchCategoryTabs.tsx
- **Verification:** Lint passes, typecheck passes

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Task 1 was pre-completed; no functional impact. Import fix was cosmetic.

## Issues Encountered
- OneDrive sync interference caused build failures (ENOENT on build-manifest.json, file locking). Resolved by retrying builds after cleanup.
- Linter auto-reverted initial Tabs.tsx edit (restored stale code); resolved by using Write tool for full file replacement.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 target components now use CSS transitions instead of layoutId
- Public routes (/menu, homepage, search) are free of domMax dependencies
- Ready for next plan in phase 60 (likely further LCP optimizations)
- Remaining layoutId usages in admin/driver/auth routes are out of scope for this plan

---
*Phase: 60-lcp-optimization*
*Completed: 2026-02-14*
