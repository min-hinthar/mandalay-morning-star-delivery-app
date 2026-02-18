---
phase: 43-provider-route-layout-refactoring
plan: 01
subsystem: ui
tags: [next.js, route-groups, code-splitting, cart, bundle-size]

# Dependency graph
requires:
  - phase: 42-dynamic-import-heavy-libraries
    provides: dynamic import patterns for heavy libraries
provides:
  - CartOverlays wrapper component for DRY cart overlay rendering
  - Route-group layouts scoping cart to public/customer routes
  - Cart-free providers.tsx for admin/driver/auth bundles
  - CartIndicator pathname-aware fallback behavior
affects: [43-02, admin-routes, driver-routes, auth-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CartOverlays wrapper: DRY Fragment rendering CartBar + CartDrawer + FlyToCart"
    - "Route-group layout scoping: client layout per route group for bundle isolation"
    - "Pathname-aware click handler: conditional drawer open vs router.push"

key-files:
  created:
    - src/components/ui/cart/CartOverlays.tsx
    - src/app/(public)/layout.tsx
    - src/app/(customer)/layout.tsx
  modified:
    - src/app/providers.tsx
    - src/components/ui/layout/AppHeader/CartIndicator.tsx
    - src/components/ui/cart/index.ts

key-decisions:
  - "CartOverlays imports from sibling files (not barrel) to avoid circular deps"
  - "Route-group layouts use 'use client' -- does not force children to client"
  - "CartIndicator navigates to /cart on non-cart routes instead of no-op"

patterns-established:
  - "Route-group layout scoping: place overlays in route-group layout.tsx to exclude from other groups' bundles"
  - "Pathname-aware component behavior: check usePathname to adapt behavior per route context"

# Metrics
duration: 7min
completed: 2026-02-06
---

# Phase 43 Plan 01: Provider & Route Layout Refactoring Summary

**CartOverlays wrapper scoped to (public)/(customer) route-group layouts, removing ~60KB cart component tree from admin/driver/auth bundles**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-06T08:48:31Z
- **Completed:** 2026-02-06T08:55:14Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created CartOverlays wrapper rendering CartBar + CartDrawer + FlyToCart as Fragment siblings
- Added route-group layouts for (public) and (customer) that render CartOverlays alongside children
- Cleaned providers.tsx to contain only theme/query/animation providers -- zero cart references
- Updated CartIndicator with pathname-aware click: opens drawer on cart routes, navigates to /cart elsewhere

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CartOverlays wrapper and route-group layouts** - `b620c1f` (feat)
2. **Task 2: Remove cart from global providers and update CartIndicator fallback** - `77a1189` (refactor)

## Files Created/Modified

- `src/components/ui/cart/CartOverlays.tsx` - DRY wrapper rendering CartBar + CartDrawer + FlyToCart
- `src/app/(public)/layout.tsx` - Public route group layout with CartOverlays
- `src/app/(customer)/layout.tsx` - Customer route group layout with CartOverlays
- `src/components/ui/cart/index.ts` - Added CartOverlays export
- `src/app/providers.tsx` - Removed CartBar, CartDrawer, FlyToCart imports and renders
- `src/components/ui/layout/AppHeader/CartIndicator.tsx` - Added pathname-aware click handler with router.push fallback

## Decisions Made

- CartOverlays imports from sibling files (`./CartBar`, `./CartDrawer`, `./FlyToCart`) rather than barrel index to avoid circular dependency
- Route-group layouts marked `"use client"` -- this does NOT force child pages to be client components (children are a serialization boundary)
- CartIndicator navigates to `/cart` on non-cart routes rather than being a no-op, giving admin/driver users a way to access their cart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm build` fails due to Google Fonts network fetch in sandboxed environment (not code-related). Lint, CSS lint, typecheck (0 errors), and all 343 tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Route-group layouts in place, ready for 43-02 (additional refactoring if planned)
- Admin/driver/auth bundles no longer include cart component tree
- CartIndicator provides graceful fallback on all routes

---

_Phase: 43-provider-route-layout-refactoring_
_Completed: 2026-02-06_
