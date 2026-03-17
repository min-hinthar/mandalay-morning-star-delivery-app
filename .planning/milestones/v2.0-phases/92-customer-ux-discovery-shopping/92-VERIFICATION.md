---
phase: 92-customer-ux-discovery-shopping
verified: 2026-03-03T21:00:00Z
status: passed
score: 15/15 must-haves verified
re_verification: true
gaps: []
gap_resolution: "Sold-out click guard removed from useCardInteractions.ts and tabIndex restored in commit 4504d9aa"
human_verification:
  - test: "Dietary chip collapse on scroll"
    expected: "Dietary chip row collapses when scrolling down on the menu page, re-expands when scrolling up; search bar stays visible throughout"
    why_human: "Scroll behavior requires physical interaction in a browser to verify"
  - test: "Cart sync status indicator timing"
    expected: "After adding/removing a cart item, CartHeader shows 'Saving...' for ~500ms then 'Saved' with checkmark for ~2s, then disappears"
    why_human: "Requires interaction and timing observation in browser"
  - test: "Offline banner on network drop"
    expected: "Disconnecting network shows amber banner at top with WifiOff icon and message; X dismisses it; reconnecting shows 'Back online!' toast"
    why_human: "Requires DevTools network throttling to simulate offline state"
  - test: "Gate polling speed near cutoff"
    expected: "Within 30 minutes of Friday 3 PM cutoff, gate polls every 10s (verify via network tab); outside window polls at 60s"
    why_human: "Requires timing observation around the cutoff window"
  - test: "Modifier overflow gradient in item detail sheet"
    expected: "Opening an item with many modifier groups shows bottom fade gradient; scrolling to bottom hides it; items with few modifiers show no gradient"
    why_human: "Requires opening items with enough modifier groups to trigger overflow"
---

# Phase 92: Customer UX Discovery and Shopping Verification Report

**Phase Goal:** Customers can efficiently find, filter, and purchase items with a polished mobile shopping experience
**Verified:** 2026-03-03T21:00:00Z
**Status:** gaps_found — 1 truth FAILED out of 15
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Search bar always visible on mobile (mobileCollapsible={false}) | VERIFIED | MenuHeader.tsx line 64: `mobileCollapsible={false}` passed to SearchInput |
| 2 | Dietary filter chips (all 6 options) appear in horizontally scrollable row | VERIFIED | MenuHeader.tsx lines 82-85: DietaryChipPicker in overflow-x-auto container; DIETARY_OPTIONS has 6 values |
| 3 | Text + dietary chips combine using AND logic | VERIFIED | useMenuFilters.ts line 44: `filters.every((f) => item.tags.includes(f))`; both filters applied in sequence |
| 4 | Sold-out items appear at bottom of each category | VERIFIED | useMenuFilters.ts lines 48-50: `sortSoldOutLast` via `Number(a.isSoldOut) - Number(b.isSoldOut)` |
| 5 | Sold-out items are still tappable and open item detail sheet in view-only mode | FAILED | useCardInteractions.ts line 100: `if (item.isSoldOut) return;` blocks click; tabIndex=-1 blocks keyboard access |
| 6 | Empty categories after filtering are hidden from view | VERIFIED | useMenuFilters.ts line 90: `.filter((category) => category.items.length > 0)` |
| 7 | Hero banner displays "Next delivery: Saturday, [date]" with order cutoff info | VERIFIED | HeroContent.tsx lines 135-141: "Next delivery: {gate.deliveryDate.displayDate}" + deliveryScheduleText |
| 8 | First available delivery date auto-selected in checkout when delivery is null | VERIFIED | TimeStepV8.tsx lines 74-84: useEffect fires when delivery is falsy, sets first non-cutoffPassed date + first timeWindow |
| 9 | Gate polling switches 60s to 10s during final 30 minutes before cutoff | VERIFIED | useDeliveryGate.ts lines 90-101: setTimeout chain with `10_000 : 60_000` interval based on totalMinutes <= 30 |
| 10 | CartBar shows minimum order warning when subtotal < $25, checkout disabled | VERIFIED | CartBar.tsx lines 185-187, 247-259, 335: shortfall computed, AnimatePresence warning, disabled={belowMinimum} |
| 11 | Cart drawer header shows "Saving..." then "Saved" after changes, auto-hides after 2s | VERIFIED | CartDrawerParts.tsx lines 59-93, 134-152: timer-based syncStatus, AnimatePresence for enter/exit |
| 12 | Amber offline banner appears fixed at top when offline, dismissible, auto-hides on reconnect with toast | VERIFIED | OfflineBanner.tsx: full implementation with isOnline check, dismiss, toast("Back online!") |
| 13 | OfflineBanner wired into customer-facing layouts | VERIFIED | CustomerShell.tsx line 26, PublicShell.tsx line 26: `<OfflineBanner />` in both shells |
| 14 | CartBar sticky footer works correctly on mobile (fixed bottom, iOS safe area) | VERIFIED | CartBar.tsx lines 222, 229: `fixed bottom-0 left-0 right-0` + `pb-[env(safe-area-inset-bottom)]` |
| 15 | ItemDetailSheet modifier groups show bottom fade gradient on overflow, hiding at scroll bottom | VERIFIED | ItemDetailSheet.tsx lines 95-97, 142-158, 354-359: hasOverflow state, scroll listener with 4px threshold, pointer-events-none gradient |

**Score: 14/15 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/hooks/useMenuFilters.ts` | Client-side filter state hook | VERIFIED | 107 lines; exports useMenuFilters, UseMenuFiltersReturn; full implementation with filterItems, sortSoldOutLast, clearFilters |
| `src/components/ui/menu/MenuHeader.tsx` | Always-visible search bar + dietary chips | VERIFIED | 92 lines; SearchInput mobileCollapsible=false; DietaryChipPicker in AnimatePresence height-collapse; useScrollDirection |
| `src/components/ui/menu/MenuContent.tsx` | Menu with filtering, sorting, empty state | VERIFIED | 415 lines; useMenuFilters integrated; filteredCategories used for render; "No items match" empty state with clearFilters button |
| `src/lib/hooks/useDeliveryGate.ts` | Dynamic polling (10s/60s) | VERIFIED | setTimeout chain with tick function; interval computed from state; clearTimeout on cleanup |
| `src/components/ui/homepage/Hero/HeroContent.tsx` | Hero with next delivery date | VERIFIED | Contains "Next delivery" text (line 138); deliveryScheduleText with cutoff info; conditional on gate.isOpen |
| `src/components/ui/checkout/TimeStepV8.tsx` | Auto-select first delivery date | VERIFIED | useEffect with `if (delivery) return;` guard; finds first !cutoffPassed date; sets first timeWindow |
| `src/components/ui/cart/CartBar.tsx` | Min-order warning + disabled checkout | VERIFIED | DEFAULT_MINIMUM_ORDER_CENTS=2500; shortfall computed; AnimatePresence warning text; disabled={belowMinimum} |
| `src/components/ui/cart/CartDrawerParts.tsx` | Sync status indicator in CartHeader | VERIFIED | SyncStatus type; timer-based saving(500ms)/saved(2s) cycle; AnimatePresence in/out; "Saving..."/"Saved"+Check icon |
| `src/components/ui/customer/OfflineBanner.tsx` | Amber offline banner | VERIFIED | Fixed top z-[70]; bg-amber-500; WifiOff icon; dismiss with state reset; wasOffline toast trigger |
| `src/components/ui/customer/index.ts` | Barrel export for customer components | VERIFIED | Exports `{ OfflineBanner }` from ./OfflineBanner |
| `src/components/ui/menu/ItemDetailSheet.tsx` | Modifier overflow fade gradient | VERIFIED | hasOverflow/isAtBottom state; modifierContainerRef on max-h-[50vh] container; from-surface-primary gradient with pointer-events-none |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| MenuHeader.tsx | useMenuFilters.ts | filter state callbacks | VERIFIED | MenuContent passes setQuery as onQueryChange, setDietaryFilters as onDietaryChange; both are from useMenuFilters |
| MenuContent.tsx | useMenuFilters.ts | filter state and filtered items | VERIFIED | useMenuFilters destructured at line 141; filterItems applied line 145-148; filteredCategories used in render |
| useDeliveryGate.ts | computeDeliveryGate | setTimeout chain | VERIFIED | tick() calls computeDeliveryGate(cutoffDay, cutoffHour) each cycle; interval derived from resulting state |
| TimeStepV8.tsx | useCheckoutStore | setDelivery called when delivery is null | VERIFIED | useEffect line 74: `if (delivery) return;`; setDelivery called with firstAvailable.dateString + timeWindows[0] |
| CartBar.tsx | BUSINESS_RULES_DEFAULTS.minimumOrderCents | local constant (server-module avoidance) | VERIFIED | DEFAULT_MINIMUM_ORDER_CENTS = 2500 constant at line 46; prop defaults to this value |
| CartDrawerParts.tsx | cart-store | items change triggers sync indicator | VERIFIED | useCart() items in useEffect dependency; changes fire timer sequence |
| OfflineBanner.tsx | useCustomerOfflineSync | isOnline/wasOffline state | VERIFIED | Line 23: `const { isOnline, wasOffline } = useCustomerOfflineSync()` |
| CustomerShell.tsx + PublicShell.tsx | OfflineBanner | rendered in layout JSX | VERIFIED | Both files import from @/components/ui/customer and render `<OfflineBanner />` |
| ItemDetailSheet.tsx | ModifierGroup | scrollable container with overflow detection and fade | VERIFIED | modifierContainerRef at line 339; scrollHeight > clientHeight check; gradient at lines 354-359 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CUX-01 | 92-01 | Search bar always visible on mobile | SATISFIED | SearchInput mobileCollapsible={false} in MenuHeader |
| CUX-02 | 92-01 | Dietary filter chips above menu grid | SATISFIED | DietaryChipPicker in MenuHeader, 6 DIETARY_OPTIONS |
| CUX-03 | 92-01 | Sold-out items sorted to bottom | SATISFIED | sortSoldOutLast in useMenuFilters.filterItems |
| CUX-04 | 92-04 | Item detail sheet scroll indicator on modifier overflow | SATISFIED | hasOverflow + fade gradient in ItemDetailSheet |
| CUX-05 | 92-02 | Dynamic Saturday schedule hero banner | SATISFIED | "Next delivery: {gate.deliveryDate.displayDate}" in HeroContent |
| CUX-06 | 92-03 | Minimum order warning shown inline in cart | SATISFIED | shortfall warning with AnimatePresence in CartBar |
| CUX-07 | 92-03 | Sticky checkout footer on mobile | SATISFIED | fixed bottom-0 + iOS safe area in CartBar |
| CUX-08 | 92-02 | First available delivery date auto-selected | SATISFIED | useEffect in TimeStepV8 with cutoffPassed guard |
| CUX-09 | 92-03 | Cart sync status indicator | SATISFIED | Saving.../Saved cycle in CartHeader |
| CUX-10 | 92-03 | Offline Mode banner | SATISFIED | OfflineBanner with amber styling in CustomerShell + PublicShell |
| CUX-20 | 92-02 | Gate poll interval reduces to 10s near cutoff | SATISFIED | setTimeout chain in useDeliveryGate with 10_000/60_000 |

All 11 requirement IDs from plans are accounted for and satisfied in REQUIREMENTS.md (all marked [x] for Phase 92).

**No orphaned requirements found** — REQUIREMENTS.md maps CUX-01 through CUX-10 and CUX-20 to Phase 92, all of which appear in the plans.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ui/menu/UnifiedMenuItemCard/useCardInteractions.ts` | 100 | `if (item.isSoldOut) return;` blocks sold-out item clicks | Blocker | Contradicts CUX-03 truth that sold-out items are tappable; view-only mode in ItemDetailSheet is unreachable for sold-out items |
| `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` | 222 | `tabIndex={item.isSoldOut ? -1 : 0}` removes keyboard access for sold-out items | Blocker | Sold-out items not accessible by keyboard users |

---

## Human Verification Required

### 1. Dietary Chip Collapse on Scroll

**Test:** Load the menu page on mobile. Scroll down slowly. Observe whether dietary chip row collapses. Scroll back up. Observe whether it re-expands. Confirm search bar stays visible throughout both scroll directions.
**Expected:** Chip row height-animates closed on scroll-down, re-opens on scroll-up; search bar never hidden.
**Why human:** Scroll behavior requires physical browser interaction; the AnimatePresence/useScrollDirection wiring is code-verified but scroll threshold behavior needs runtime confirmation.

### 2. Cart Sync Status Timing

**Test:** Open cart drawer. Add an item or change quantity. Watch the CartHeader area near "Your Cart" title.
**Expected:** "Saving..." appears briefly (~500ms), then transitions to a checkmark + "Saved" for ~2 seconds, then both disappear.
**Why human:** Timer-based animations require observation in a live browser to confirm timing is correct.

### 3. Offline Banner Behavior

**Test:** Open Chrome DevTools > Network > throttle to "Offline". Navigate to menu page.
**Expected:** Amber banner slides down from top with WifiOff icon and "You're offline -- browsing cached menu. Some items may be unavailable." X button dismisses it. Restoring network shows "Back online!" toast and banner disappears.
**Why human:** Requires network simulation and real-time state transitions.

### 4. Gate Polling Speed Near Cutoff

**Test:** If the system clock can be set near Friday 3 PM, or if there is a test hook, observe network requests to confirm polling cadence changes.
**Expected:** 60s poll intervals outside the 30-minute window; 10s intervals within the window.
**Why human:** Requires timing observation over a period or clock manipulation.

### 5. Modifier Overflow Gradient in Item Detail Sheet

**Test:** Open an item with 3+ modifier groups in the detail sheet on a small-screen device or narrow viewport.
**Expected:** Bottom of modifier area shows fade gradient. Scrolling to the bottom of modifiers hides the gradient. An item with 1 modifier group shows no gradient.
**Why human:** Requires actual menu items with sufficient modifier groups to trigger overflow, which depends on live menu data.

---

## Gaps Summary

**1 truth FAILED** out of 15 verified.

**Gap: Sold-out items not tappable (CUX-03 partial)**

The plan specified that sold-out items "are still tappable and open item detail sheet in view-only mode." This was never implemented. The pre-existing guard in `useCardInteractions.ts` (`if (item.isSoldOut) return;`) prevents `handleCardClick` from calling `onSelect(item)`, making sold-out item cards completely non-interactive. The ItemDetailSheet does correctly handle sold-out mode (disabling Add to Cart button, showing "Sold Out" badge), but the path to open it is blocked.

This is not a regression from phase 92 — the file was last modified in commit `f53389aa` (phase 66-06 refactor), long before phase 92. However, the plan's truth was stated as a goal and not implemented. Since the plan for 92-01 explicitly stated this truth and the executor did not modify `useCardInteractions.ts`, the goal was stated but not achieved.

**Fix required:** In `useCardInteractions.ts`, change `handleCardClick` to call `onSelect(item)` when `item.isSoldOut` is true (just skip the haptic feedback and proceed to open the sheet). Also update `tabIndex` to keep sold-out items keyboard-accessible.

---

_Verified: 2026-03-03T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
