---
phase: 52-cart-validation
plan: 02
subsystem: ui
tags: [framer-motion, cart, validation, overlay, badge, suggestion, animation]

# Dependency graph
requires:
  - phase: 52-cart-validation-01
    provides: CartItemValidationStatus type and validation types in cart.ts
provides:
  - ValidationOverlay component for sold-out/unavailable cart items
  - PriceChangeBadge component for price-changed cart items
  - SuggestionRow component for inline replacement suggestions
  - AttentionSection container for grouping problem items
  - CartPage barrel file
affects: [52-cart-validation-03, 52-cart-validation-04, cart-drawer-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Validation overlay: absolute-positioned gray overlay with status badge on cart items"
    - "Price change badge: dismissable inline badge with direction-based color (amber up, green down)"
    - "Suggestion row: horizontal scrollable card row with thumbnail + name + price"
    - "Attention section: dashed-border container with animated collapse via AnimatePresence"

key-files:
  created:
    - src/components/ui/cart/CartItem/ValidationOverlay.tsx
    - src/components/ui/cart/CartItem/PriceChangeBadge.tsx
    - src/components/ui/cart/CartPage/SuggestionRow.tsx
    - src/components/ui/cart/CartPage/AttentionSection.tsx
    - src/components/ui/cart/CartPage/index.tsx
  modified:
    - src/components/ui/cart/CartItem/index.tsx

key-decisions:
  - "Used bg-surface-inverse/40 instead of bg-black/40 for overlay to comply with semantic token lint rules"
  - "Defined CartItemValidation type locally in AttentionSection (will be promoted to cart.ts in plan 03)"
  - "PriceChangeBadge is a full button element (whole badge tappable to dismiss, not just X icon)"
  - "SuggestionCard reuses getFallbackEmoji from CartItem helpers for missing thumbnails"

patterns-established:
  - "Validation overlay pattern: absolute overlay + forwardRef for scroll-to"
  - "Status badge config object pattern: maps status to icon, colors, label"

# Metrics
duration: 8min
completed: 2026-02-09
---

# Phase 52 Plan 02: Validation UI Components Summary

**Cart validation overlay components: gray overlay with amber/red badges, dismissable price-change badges, suggestion replacement row, and attention section container with animated collapse**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-09T05:29:15Z
- **Completed:** 2026-02-09T05:37:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ValidationOverlay renders gray overlay with amber "Sold Out" or red "Unavailable" badge + remove button
- PriceChangeBadge shows dismissable inline badge with amber (price up) or green (price down) treatment
- SuggestionRow displays up to 3 replacement cards with thumbnail, name, and formatted price
- AttentionSection groups problem items with "{N} items need attention" header and animated collapse

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ValidationOverlay and PriceChangeBadge** - `c39e7f7` (feat)
2. **Task 2: Create SuggestionRow, AttentionSection, and CartPage barrel** - `5775354` (feat)

## Files Created/Modified
- `src/components/ui/cart/CartItem/ValidationOverlay.tsx` - Gray overlay + status badge for sold-out/unavailable items
- `src/components/ui/cart/CartItem/PriceChangeBadge.tsx` - Dismissable price-updated inline badge
- `src/components/ui/cart/CartPage/SuggestionRow.tsx` - Horizontal row of 3 replacement suggestion cards
- `src/components/ui/cart/CartPage/AttentionSection.tsx` - Container for problem items with count header
- `src/components/ui/cart/CartPage/index.tsx` - Barrel re-exports AttentionSection and SuggestionRow
- `src/components/ui/cart/CartItem/index.tsx` - Added ValidationOverlay and PriceChangeBadge exports

## Decisions Made
- Used `bg-surface-inverse/40` semantic token instead of raw `bg-black/40` for overlay background (lint rule compliance)
- Defined `CartItemValidation` type locally in AttentionSection rather than adding to `cart.ts` prematurely -- will be promoted when the validation hook is built in plan 03
- Made entire PriceChangeBadge a `<button>` element so the whole badge is tappable to dismiss (not just the X icon)
- Reused `getFallbackEmoji` from CartItem helpers in SuggestionCard for consistent fallback thumbnails

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lint errors for semantic token usage**
- **Found during:** Task 1 (ValidationOverlay)
- **Issue:** ESLint `no-restricted-syntax` rule forbids raw `text-white` and `bg-black` -- must use semantic tokens
- **Fix:** Replaced `text-white` with `text-text-inverse`, `bg-black/40` with `bg-surface-inverse/40`
- **Files modified:** src/components/ui/cart/CartItem/ValidationOverlay.tsx
- **Verification:** `pnpm lint` passes clean
- **Committed in:** c39e7f7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Semantic token substitution maintains visual consistency with design system. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 validation UI components ready for composition in cart page (plan 03)
- CartPage barrel file established for plan 03 to add CartPageContent, CartPageHeader, etc.
- AttentionSection accepts CartItem[] + validations Map -- ready for useCartValidation hook (plan 03)
- SuggestionRow accepts MenuItem[] -- ready for suggestion lookup in validation hook

---
*Phase: 52-cart-validation*
*Completed: 2026-02-09*
