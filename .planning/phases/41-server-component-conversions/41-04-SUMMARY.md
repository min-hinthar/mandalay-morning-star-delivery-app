---
phase: 41-server-component-conversions
plan: 04
subsystem: ui
tags: [react, server-components, menu, offline, react-query]

# Dependency graph
requires:
  - phase: 41-01
    provides: RouteLoading/RouteError infrastructure
  - phase: 41-02
    provides: USE_CLIENT_AUDIT.md categorization
provides:
  - Menu route loading/error boundaries
  - MenuContentClient wrapper for interactivity
  - useMenuInteractivity context hook
affects: [41-05, 41-06, performance-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client wrapper pattern: context for server-rendered children interactivity"
    - "Pragmatic server component boundary: deep React Query integration stays client"

key-files:
  created:
    - src/app/(public)/menu/loading.tsx
    - src/app/(public)/menu/error.tsx
    - src/components/ui/menu/MenuContentClient.tsx
  modified:
    - src/components/ui/menu/index.ts

key-decisions:
  - "Keep MenuContent as client component due to React Query + offline integration"
  - "Create MenuContentClient as future enhancement path"
  - "Provide useMenuInteractivity hook for granular context access"

patterns-established:
  - "Client wrapper pattern: MenuContentClient wraps children with interactivity context"
  - "Pragmatic conversion: don't force server components when offline support is critical"

# Metrics
duration: 8min
completed: 2026-02-06
---

# Phase 41 Plan 04: Menu Route Conversion Summary

**Menu loading/error boundaries with MenuContentClient wrapper preserving React Query offline support**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T05:30:00Z
- **Completed:** 2026-02-06T05:38:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Menu route has branded loading state and error boundary
- MenuContentClient extracts all interactive logic into reusable wrapper
- useMenuInteractivity hook enables granular context consumption
- Offline support preserved (React Query + IndexedDB caching intact)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create menu loading/error** - `e7bc9c6` (feat) [from previous session]
2. **Task 2: Create MenuContentClient** - `3d14ab7` (feat)
3. **Task 3: Export MenuContentClient** - `7d7a1e8` (feat)

## Files Created/Modified

- `src/app/(public)/menu/loading.tsx` - Route loading with RouteLoading component
- `src/app/(public)/menu/error.tsx` - Error boundary with RouteError component
- `src/components/ui/menu/MenuContentClient.tsx` - Client wrapper with all interactivity
- `src/components/ui/menu/index.ts` - Added MenuContentClient exports

## Decisions Made

### Keep MenuContent as Client Component

**Rationale:** MenuContent is deeply integrated with:
1. **React Query (useMenu):** Provides client-side caching, background refetching, stale-while-revalidate
2. **Offline support:** IndexedDB caching via menuCache with automatic fallback
3. **Multiple client hooks:** useFavorites, useCart, useCustomerOfflineSync
4. **URL param handling:** useSearchParams for command palette integration

Converting to server component would require:
- Replacing React Query with server-side fetch (breaking caching/SWR)
- Moving offline logic to service worker only (major architecture change)
- Coordinating client state across multiple boundaries

**Decision:** Follow CONTEXT.md principle - "don't fight it." Create the infrastructure (loading/error/MenuContentClient) but preserve the working offline-capable client architecture.

### MenuContentClient as Future Enhancement Path

Created MenuContentClient with:
- Context provider for favorites, cart, offline state
- useMenuInteractivity hook for granular access
- ItemDetailSheet management
- URL param item modal handling

This enables future progressive enhancement when/if:
- Server-side menu rendering becomes practical
- Offline strategy moves to service worker
- React Query is replaced with server actions

## Deviations from Plan

None - plan executed with pragmatic adaptation per CONTEXT.md guidance.

## Issues Encountered

- **Git commit lock race:** lint-staged created HEAD mismatch error but commit succeeded
- **Build lock:** Previous build left .next/lock; cleared and rebuilt

## Next Phase Readiness

- Menu route has complete loading/error infrastructure
- MenuContentClient available for future server component integration
- Ready for 41-05 (homepage route conversion)

---
*Phase: 41-server-component-conversions*
*Completed: 2026-02-06*
