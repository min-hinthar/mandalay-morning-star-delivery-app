---
phase: 81-customer-pre-checkout-gate
plan: 02
subsystem: ui
tags: [react, nextjs, delivery-gate, hero, menu, countdown, banner]

# Dependency graph
requires:
  - phase: 81-customer-pre-checkout-gate
    plan: 01
    provides: useDeliveryGate hook, DeliveryBanner, DeliveryCountdown, CutoffModal components
provides:
  - Dynamic hero CTA switching between "Order Now" and "Pre-Order for [date]"
  - Live countdown near hero CTA with urgency colors
  - Hero stat bar "Orders closed -- next [date]" when past cutoff
  - Persistent DeliveryBanner on menu page (sticky below header)
  - Menu page async server component fetching business rules server-side
affects: [homepage, menu-page, customer-entry-points]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Async server component pattern for menu page (getBusinessRules at page level, props thread to client component)
    - Gate-driven conditional rendering (gate.isOpen ternary for CTA text, countdown, stat bar)
    - Props passthrough pattern for cutoffDay/cutoffHour from server to client component

key-files:
  created: []
  modified:
    - src/components/ui/homepage/Hero/HeroContent.tsx
    - src/components/ui/menu/MenuContent.tsx
    - src/app/(public)/menu/page.tsx

key-decisions:
  - "Gate-driven CTA: ctaText prop used as 'Order Now' value when open, dynamically replaced with 'Pre-Order for [date]' when closed"
  - "Countdown near CTA uses 'Order within Xh Ym' prefix text for customer readability"
  - "Closed state below CTA shows 'Orders open [DayName]' in text-hero-text-muted"
  - "Menu page fetches business rules server-side, passes cutoffDay/cutoffHour as props to MenuContent"
  - "MenuContentProps extended with optional cutoffDay/cutoffHour (defaults 5/15) for backward compatibility"

patterns-established:
  - "Server-to-client prop threading: server page fetches rules, passes scalars to client component"
  - "Gate ternary pattern: gate.isOpen ? openUI : closedUI for CTA, countdown, stat bar"

requirements-completed: [GATE-01, GATE-02]

# Metrics
duration: 11min
completed: 2026-03-02
---

# Phase 81 Plan 02: Customer Pre-Checkout Gate -- Entry Points Summary

**Dynamic hero CTA and menu DeliveryBanner wired to useDeliveryGate: "Order Now"/"Pre-Order" switching, live countdown, stat bar and banner urgency colors**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-02T06:37:50Z
- **Completed:** 2026-03-02T06:49:05Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Hero CTA switches dynamically: "Order Now" when open, "Pre-Order for Saturday, [date]" when closed
- Live countdown renders near CTA ("Order within Xh Ym") with amber/red urgency at <2h/<30m
- Hero stat bar delivery text flips to "Orders closed -- next Saturday, [date]" past cutoff
- Menu page converted to async server component calling `getBusinessRules()` at page level
- `DeliveryBanner` renders sticky below `MenuHeader` in `MenuContent` with full gate logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dynamic CTA, countdown, and stat bar to Hero** - `a1eac124` (feat)
2. **Task 2: Add DeliveryBanner to menu page** - `846c701b` (feat)
3. **Prettier formatting fix** - `d12f9eb4` (chore)

## Files Created/Modified

- `src/components/ui/homepage/Hero/HeroContent.tsx` - Added useDeliveryGate, dynamic CTA text, DeliveryCountdown near CTA, dynamic stat bar delivery text
- `src/components/ui/menu/MenuContent.tsx` - Added cutoffDay/cutoffHour props, DeliveryBanner at top of main render
- `src/app/(public)/menu/page.tsx` - Converted to async server component with getBusinessRules() call

## Decisions Made

- `ctaText` prop retained as the "Order Now" fallback/value (no new prop added); when closed it renders `Pre-Order for ${gate.deliveryDate.displayDate}`
- Countdown placed below CTA button in a flex column group so it doesn't disturb the button's horizontal layout
- `MenuContentProps` extended with optional `cutoffDay?`/`cutoffHour?` with defaults (5/15) -- zero breaking changes to existing usages

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared stale .next build cache causing false TypeScript error**
- **Found during:** Task 1 verification (pnpm build)
- **Issue:** Next.js build reported "CutoffModal is declared but its value is never read" for CheckoutClient.tsx -- a pre-existing false positive from stale cache. The component IS used in JSX; `tsc --noEmit` confirmed no actual error.
- **Fix:** `rm -rf .next` to clear cache; subsequent build passed cleanly.
- **Files modified:** None (cache clear only)
- **Verification:** Build passed after cache clear
- **Committed in:** a1eac124 (included in Task 1 verification run)

**2. [Rule 2 - Missing Critical] Applied prettier formatting to changed files**
- **Found during:** Task 2 (overall verification)
- **Issue:** Three modified files had formatting differences from prettier baseline
- **Fix:** `pnpm exec prettier --write` on the three files
- **Files modified:** HeroContent.tsx, MenuContent.tsx, menu/page.tsx
- **Verification:** `pnpm exec prettier --check` passed on all three files
- **Committed in:** d12f9eb4

---

**Total deviations:** 2 auto-fixed (1 blocking cache issue, 1 formatting)
**Impact on plan:** Both auto-fixes necessary for build correctness and lint compliance. No scope creep.

## Issues Encountered

None beyond the stale .next cache which was immediately identified and resolved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GATE-01 (hero dynamic CTA) and GATE-02 (menu delivery banner) both complete
- All customer entry points now show live gate state
- Ready for Phase 81 Plan 03 (checkout gate enforcement / CutoffModal wiring) if planned

## Self-Check: PASSED

- FOUND: src/components/ui/homepage/Hero/HeroContent.tsx
- FOUND: src/components/ui/menu/MenuContent.tsx
- FOUND: src/app/(public)/menu/page.tsx
- FOUND: .planning/phases/81-customer-pre-checkout-gate/81-02-SUMMARY.md
- FOUND commit: a1eac124 (Task 1)
- FOUND commit: 846c701b (Task 2)
- FOUND commit: d12f9eb4 (Prettier fix)

---
*Phase: 81-customer-pre-checkout-gate*
*Completed: 2026-03-02*
