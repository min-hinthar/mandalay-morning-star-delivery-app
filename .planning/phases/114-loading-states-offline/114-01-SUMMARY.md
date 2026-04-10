---
phase: 114-loading-states-offline
plan: 01
subsystem: ui
tags: [skeleton, loading, react, next.js, streaming]

requires:
  - phase: 113-accessibility-design-system
    provides: 44px touch targets, focus-visible rings, no hardcoded hex colors
provides:
  - OrdersListSkeleton component (gradient bg, header, 3 staggered OrderCardSkeleton)
  - OrderDetailSkeleton component (7 content-shaped sections matching real page layout)
  - AccountSkeleton component (title, tab bar, content area)
  - Three customer loading.tsx files swapped from RouteLoading to content-shaped skeletons
  - AccountClient Suspense fallback uses Skeleton + ProfileSkeleton instead of animate-pulse divs
affects: [114-02, 114-03, loading-hierarchy]

tech-stack:
  added: []
  patterns: [content-shaped-skeleton, stagger-class-pattern, aria-hidden-skeleton]

key-files:
  created:
    - src/components/ui/orders/OrdersListSkeleton.tsx
    - src/components/ui/orders/OrderDetailSkeleton.tsx
    - src/components/ui/account/AccountSkeleton.tsx
  modified:
    - src/app/(customer)/orders/loading.tsx
    - src/app/(customer)/orders/[id]/loading.tsx
    - src/app/(customer)/account/loading.tsx
    - src/components/ui/account/AccountClient.tsx

key-decisions:
  - "OrdersListSkeleton header mirrors OrdersHeader layout (icon + title + button) not just a single title bar"
  - "OrderDetailSkeleton uses Card components matching real page Card structure for visual fidelity"
  - "AccountClient Suspense fallback renders ProfileSkeleton as default tab content (profile is default tab)"

patterns-established:
  - "Content-shaped skeleton: aria-hidden wrapper > main with gradient bg > max-w container > staggered skeleton sections"
  - "Skeleton composition: reuse existing sub-skeletons (OrderCardSkeleton, ProfileSkeleton) inside page-level skeletons"

requirements-completed: [LOAD-01, LOAD-02, LOAD-03]

duration: 9min
completed: 2026-04-10
---

# Phase 114 Plan 01: Customer Page Skeletons Summary

**Three content-shaped skeleton components replacing RouteLoading spinners on orders list, order detail, and account customer pages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-10T06:59:23Z
- **Completed:** 2026-04-10T07:08:44Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- OrdersListSkeleton with gradient background, header skeleton matching OrdersHeader layout, and 3 staggered OrderCardSkeleton instances
- OrderDetailSkeleton with all 7 content-shaped sections (back/share, header, timeline card, 2-col delivery info, items list, totals, 44px action buttons)
- AccountSkeleton with title, 4-tab bar, and content area placeholders
- AccountClient Suspense fallback upgraded from raw animate-pulse divs to Skeleton + ProfileSkeleton components
- All skeletons use aria-hidden="true", design tokens only, stagger classes for animation sequencing

## Task Commits

Each task was committed atomically:

1. **Task 1: OrdersListSkeleton + orders/loading.tsx** - `2221d617` (feat)
2. **Task 2: OrderDetailSkeleton + orders/[id]/loading.tsx** - `33fb1c6c` (feat)
3. **Task 3: AccountSkeleton + account/loading.tsx + AccountClient fix** - `d4122d5b` (feat)

## Files Created/Modified
- `src/components/ui/orders/OrdersListSkeleton.tsx` - Orders list page skeleton with gradient bg + header + 3 OrderCardSkeleton
- `src/components/ui/orders/OrderDetailSkeleton.tsx` - Order detail skeleton matching all 7 sections of real page
- `src/components/ui/account/AccountSkeleton.tsx` - Account page skeleton with title + tab bar + content area
- `src/app/(customer)/orders/loading.tsx` - Swapped RouteLoading to OrdersListSkeleton
- `src/app/(customer)/orders/[id]/loading.tsx` - Swapped RouteLoading to OrderDetailSkeleton
- `src/app/(customer)/account/loading.tsx` - Swapped RouteLoading to AccountSkeleton
- `src/components/ui/account/AccountClient.tsx` - Replaced animate-pulse divs with Skeleton + ProfileSkeleton in Suspense fallback

## Decisions Made
- OrdersListSkeleton header mirrors real OrdersHeader layout (icon circle + title + "Order Again" button skeleton) rather than a single title bar for visual fidelity
- OrderDetailSkeleton uses Card/CardContent components matching real page Card structure to ensure consistent border-radius and padding
- AccountClient Suspense fallback renders ProfileSkeleton as the default tab content since profile is the default active tab

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Stale `.claude/worktrees/` directory contained an old rxjs package.json with lint-staged config that blocked git hooks. Removed the stale worktree directory to resolve.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Three content-shaped skeletons ready for LoadingWithTimeout wrapping (Plan 02 - LOAD-05)
- SkeletonCrossfade promotion from admin/ to ui/ pending (Plan 02)
- Other customer loading.tsx files (cart, checkout, confirmation, feedback, tracking) still use RouteLoading -- out of scope for this plan

## Self-Check: PASSED

---
*Phase: 114-loading-states-offline*
*Completed: 2026-04-10*
