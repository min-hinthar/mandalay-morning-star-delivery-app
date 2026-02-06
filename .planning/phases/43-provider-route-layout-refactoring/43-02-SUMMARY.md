---
phase: 43-provider-route-layout-refactoring
plan: 02
subsystem: ui
tags: [navigation-guard, popstate, beforeunload, framer-motion, cart, checkout]

# Dependency graph
requires:
  - phase: 43-provider-route-layout-refactoring (plan 01)
    provides: CartOverlays route-group scoping, CartIndicator pathname fallback
provides:
  - useNavigationGuard hook (beforeunload + popstate interception)
  - CartNavigationGuard modal with checkout/cart variants
  - Empty checkout redirect to /menu with toast
  - Cart page checkout nudge behavior
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Navigation guard pattern: pushState sentinel + popstate interception for custom modal"
    - "Variant-driven modal copy: single component with variant prop for context-specific messaging"

key-files:
  created:
    - src/lib/hooks/useNavigationGuard.ts
    - src/components/ui/cart/CartNavigationGuard.tsx
  modified:
    - src/app/(customer)/checkout/page.tsx
    - src/app/(customer)/cart/page.tsx
    - src/lib/hooks/index.ts
    - src/components/ui/cart/index.ts

key-decisions:
  - "useNavigationGuard focuses on browser-level events (popstate + beforeunload); Link interception left to page-level onNavigate props"
  - "allowedPaths kept in interface for documentation but filtering done by caller via enabled flag"
  - "Cart page onStay navigates to /checkout (nudge) rather than simply closing modal"
  - "Empty checkout uses router.replace (not push) to avoid polluting history"

patterns-established:
  - "Navigation guard sentinel pattern: pushState with marker, detect back via popstate, re-push to block"
  - "Variant modal pattern: COPY constant object with variant keys for title/body/button text"

# Metrics
duration: 9min
completed: 2026-02-06
---

# Phase 43 Plan 02: Navigation Guards Summary

**useNavigationGuard hook with popstate/beforeunload interception, CartNavigationGuard modal with checkout and cart variant copy, empty checkout redirect with toast**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-06T08:58:40Z
- **Completed:** 2026-02-06T09:07:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- useNavigationGuard hook intercepts browser back button (popstate) and tab close (beforeunload) when cart has items
- CartNavigationGuard modal with playful warm tone: "Almost there!" for checkout, "Don't forget your goodies!" for cart
- Checkout page redirects to /menu with toast when deep-linked with empty cart
- Cart page guard nudges user toward /checkout when they try to leave
- Bundle verification confirmed: cart components absent from admin/driver/auth route bundles (0 matches)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useNavigationGuard hook and CartNavigationGuard modal** - `1d0c244` (feat)
2. **Task 2: Wire navigation guards into checkout and cart pages** - `d681ef0` (feat)

## Files Created/Modified

- `src/lib/hooks/useNavigationGuard.ts` - Navigation guard hook: beforeunload + popstate sentinel pattern
- `src/components/ui/cart/CartNavigationGuard.tsx` - Animated modal with variant-specific copy (checkout/cart)
- `src/app/(customer)/checkout/page.tsx` - Added guard hook, toast on empty redirect, CartNavigationGuard render
- `src/app/(customer)/cart/page.tsx` - Added "use client", guard hook, CartNavigationGuard with checkout nudge
- `src/lib/hooks/index.ts` - Exported useNavigationGuard and types
- `src/components/ui/cart/index.ts` - Exported CartNavigationGuard and types

## Decisions Made

- **useNavigationGuard scope:** Hook handles browser-level events only (popstate, beforeunload). In-app Link interception is left to page-level `onNavigate` props since the hook cannot intercept programmatic Next.js navigation.
- **allowedPaths as documentation:** The `allowedPaths` parameter exists on the interface for caller documentation but the actual filtering is done by the caller when computing `enabled`. This avoids the hook needing to detect navigation targets from popstate (which doesn't provide them).
- **Cart page nudge:** The cart variant's "stay" action navigates to /checkout rather than simply closing the modal, fulfilling the CONTEXT.md requirement for positive checkout nudge.
- **Empty checkout redirect:** Uses `router.replace` instead of `router.push` to avoid cluttering browser history with the redirect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lint errors for semantic color tokens**
- **Found during:** Task 1 (CartNavigationGuard modal)
- **Issue:** Used `bg-black/50` and `bg-white` which violate project ESLint rule requiring semantic tokens
- **Fix:** Changed to `bg-surface-inverse/50` and `bg-surface-primary`
- **Files modified:** src/components/ui/cart/CartNavigationGuard.tsx
- **Verification:** ESLint passes with zero errors
- **Committed in:** 1d0c244 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Lint compliance fix. No scope creep.

## Issues Encountered

- **Google Fonts 403 in build environment:** `pnpm build` fails due to network restriction (Google Fonts API returns 403). This is a pre-existing environment issue unrelated to plan changes. Verified by testing build with changes stashed -- same failure. Typecheck, lint, lint:css, and all 343 tests pass, confirming code correctness.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 43 complete: cart components scoped to route-group layouts, navigation guards protect checkout/cart flow
- Ready for Phase 44+ performance work
- Build environment Google Fonts issue should be resolved separately (network/TLS configuration)

---
*Phase: 43-provider-route-layout-refactoring*
*Completed: 2026-02-06*
