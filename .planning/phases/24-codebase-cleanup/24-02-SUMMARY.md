---
phase: 24-codebase-cleanup
plan: 02
subsystem: cleanup
tags: [knip, unused-files, legacy-code, dead-code-removal]

# Dependency graph
requires:
  - phase: 23-header-nav-rebuild
    provides: AppHeader and MobileDrawer replacing legacy header/nav
provides:
  - Removal of 21 unused component files
  - Cleaner codebase with only active code
  - Reduced knip warnings from 21+ to 6 unused files
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AppHeader/ replaces header.tsx, HeaderClient.tsx, HeaderServer.tsx"
    - "MobileDrawer/ replaces MobileNav.tsx"
    - "UnifiedMenuItemCard replaces CategoryCarousel, ModifierToggle, VisualPreview"

key-files:
  created: []
  modified: []
  deleted:
    - src/components/layout/header.tsx
    - src/components/layout/HeaderClient.tsx
    - src/components/layout/HeaderServer.tsx
    - src/components/layout/MobileNav.tsx
    - src/components/layout/NavLinks.tsx
    - src/components/layout/footer.tsx
    - src/components/homepage/CoverageSection.tsx
    - src/components/homepage/FloatingFood.tsx
    - src/components/homepage/HeroVideo.tsx
    - src/components/homepage/Timeline.tsx
    - src/components/checkout/CoverageStatus.tsx
    - src/components/menu/CategoryCarousel.tsx
    - src/components/menu/ModifierToggle.tsx
    - src/components/menu/VisualPreview.tsx
    - src/components/layouts/ParallaxContainer.tsx
    - src/components/map/CoverageMap.tsx
    - src/components/map/PlacesAutocomplete.tsx
    - src/components/tracking/PushToast.tsx
    - src/components/tracking/TrackingMap.tsx
    - src/lib/webgl/grain.ts
    - src/lib/webgl/particles.ts

key-decisions:
  - "Keep gradients.ts in webgl/ - still used by DynamicThemeProvider"
  - "Keep remaining 6 admin/driver files - may be needed for future features"

patterns-established: []

# Metrics
duration: 12min
completed: 2026-01-27
---

# Phase 24 Plan 02: Remove Legacy Files Summary

**Removed 21 unused component files flagged by knip - 7,113 lines of dead code eliminated**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-27T07:02:47Z
- **Completed:** 2026-01-27T07:14:00Z
- **Tasks:** 2
- **Files deleted:** 21

## Accomplishments

- Removed 6 legacy layout files (header, nav, footer) superseded by Phase 23 AppHeader/MobileDrawer
- Removed 15 unused component files across homepage, checkout, menu, map, tracking, webgl
- Reduced knip unused files warnings from 21+ to 6
- Build and typecheck pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove legacy layout files** - `c229ab0` (chore)
2. **Task 2: Remove unused component files** - `376b4f9` (chore)

## Files Deleted

### Layout (6 files, 1,570 lines)
- `src/components/layout/header.tsx` - Old header (replaced by AppHeader/)
- `src/components/layout/HeaderClient.tsx` - Old client header (replaced by AppHeader/)
- `src/components/layout/HeaderServer.tsx` - Old server header (replaced by AppHeader/)
- `src/components/layout/MobileNav.tsx` - Old mobile nav (replaced by MobileDrawer/)
- `src/components/layout/NavLinks.tsx` - Old nav links (replaced by HeaderNavLink)
- `src/components/layout/footer.tsx` - Unused footer component

### Homepage (4 files)
- `src/components/homepage/CoverageSection.tsx` - Unused coverage area section
- `src/components/homepage/FloatingFood.tsx` - Unused floating animation
- `src/components/homepage/HeroVideo.tsx` - Unused video hero
- `src/components/homepage/Timeline.tsx` - Unused timeline component

### Checkout (1 file)
- `src/components/checkout/CoverageStatus.tsx` - Unused coverage status display

### Menu (3 files)
- `src/components/menu/CategoryCarousel.tsx` - Unused category carousel
- `src/components/menu/ModifierToggle.tsx` - Unused modifier toggle
- `src/components/menu/VisualPreview.tsx` - Unused visual preview

### Layouts (1 file)
- `src/components/layouts/ParallaxContainer.tsx` - Unused parallax wrapper

### Map (2 files)
- `src/components/map/CoverageMap.tsx` - Unused coverage map
- `src/components/map/PlacesAutocomplete.tsx` - Unused places autocomplete

### Tracking (2 files)
- `src/components/tracking/PushToast.tsx` - Unused push notification toast
- `src/components/tracking/TrackingMap.tsx` - Unused tracking map

### WebGL (2 files)
- `src/lib/webgl/grain.ts` - Unused grain shader
- `src/lib/webgl/particles.ts` - Unused particle system

## Decisions Made

1. **Keep gradients.ts** - `src/lib/webgl/gradients.ts` is imported by DynamicThemeProvider, not unused
2. **Keep remaining 6 knip warnings** - Admin/driver components (OrderManagement, RouteOptimization, StatusCelebration, DeliverySuccess, Leaderboard, Charts) may be needed for future features

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **OneDrive sync interference** - Files were being restored after `rm` command. Resolved by using `git rm --cached` followed by `rm` to properly stage deletions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Codebase is now leaner with only active code
- Ready for Phase 24-03 (consolidate barrel exports) or future phases
- No blockers or concerns

---
*Phase: 24-codebase-cleanup*
*Completed: 2026-01-27*
