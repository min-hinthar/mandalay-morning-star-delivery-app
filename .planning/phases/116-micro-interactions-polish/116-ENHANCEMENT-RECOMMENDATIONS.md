# Phase 116: Enhancement Recommendations

**Generated:** 2026-04-10
**Protocol:** 12-Agent Deep Phase Assumptions

---

## Priority Matrix

| # | Enhancement | Priority | Effort | Design Compliance |
|---|-------------|----------|--------|-------------------|
| 1 | Toast countdown progress bar | MUST-HAVE | S | Animation-first, forgiving UX |
| 2 | Haptic feedback on undo restore | MUST-HAVE | XS | Tactile feedback standard |
| 3 | Undo debounce guard | MUST-HAVE | S | Data integrity |
| 4 | Toast auto-dismiss cancellation on action | MUST-HAVE | S | Forgiving UX |
| 5 | AnimatePresence for cart item restoration | SHOULD-HAVE | S | "Delightfully alive with motion" |
| 6 | Scroll fade with ResizeObserver | SHOULD-HAVE | M | Responsive, no false indicators |
| 7 | Sticky reorder safe-area handling | SHOULD-HAVE | S | Mobile-first (70% users) |
| 8 | OG fallback image with brand overlay | SHOULD-HAVE | M | Professional shared links |
| 9 | Swipe hint with haptic | NICE-TO-HAVE | S | Discoverable gestures |
| 10 | Toast action keyboard accessibility | NICE-TO-HAVE | S | WCAG compliance |
| 11 | Cart clear undo partial restore | NICE-TO-HAVE | M | Edge case resilience |
| 12 | Scroll snap on dietary chips | NICE-TO-HAVE | XS | Smooth mobile experience |

---

## Detailed Recommendations

### 1. Toast Countdown Progress Bar (MUST-HAVE)

**What:** Add a visual progress indicator to undo toasts showing time remaining before action commits.

**Why:** Users need visual feedback that the undo window is closing. A text timer ("4s remaining") is less intuitive than a shrinking bar. DoorDash and Uber Eats both use this pattern.

**Design compliance:** Aligns with "delightfully alive with motion" core value. Progress bar uses `transition.normal` (0.18s) for smooth updates. Color: `bg-primary` shrinking to 0% over 5s.

**Implementation hint:** CSS `animation: countdown 5s linear forwards` on a `width: 100%` bar inside the toast. No JS timer needed — pure CSS animation keyframes from `width: 100%` to `width: 0%`.

---

### 2. Haptic Feedback on Undo Restore (MUST-HAVE)

**What:** Trigger `triggerHaptic("success")` pattern ([10, 50, 10]ms) when user clicks Undo and item is restored.

**Why:** Cart interactions already use haptic feedback (delete: "heavy", decrement-to-zero: "medium"). Undo restore must complete the feedback loop with a positive haptic.

**Design compliance:** Consistent with swipe-gestures/constants.ts haptic pattern. Success pattern distinguishable from deletion pattern.

**Implementation hint:** Call `triggerHaptic("success")` inside the undo onClick handler, before restoring cart state. Also consider a brief `popIn` animation on the restored cart item.

---

### 3. Undo Debounce Guard (MUST-HAVE)

**What:** Prevent double-click on Undo button from restoring the item twice (creating duplicate).

**Why:** Store-level debounce is a documented gotcha (state-management.md). Rapid undo clicks without guard will add item twice.

**Design compliance:** Data integrity requirement. Mutation owner principle: toast action fires parent callback once.

**Implementation hint:** Dismiss the toast immediately on first undo click (clears from UI). The dismiss also clears the auto-remove timeout. Since toast is gone, second click is impossible. Alternative: track `undoFired` boolean in closure.

---

### 4. Toast Auto-Dismiss Cancellation on Action (MUST-HAVE)

**What:** When user clicks Undo, immediately cancel the auto-dismiss timeout and remove the toast.

**Why:** If user clicks Undo at 4.5s and the 5s timeout fires 500ms later, the toast would try to dismiss after already being handled. Could cause stale state or error.

**Design compliance:** Clean state management; no orphaned timers.

**Implementation hint:** In `useToastV8.ts`, when action.onClick fires, call `dismiss(id)` which already clears the timeout via `removeFromQueue()`. The dismiss + action should be atomic in the onClick handler.

---

### 5. AnimatePresence for Cart Item Restoration (SHOULD-HAVE)

**What:** When undo restores a cart item, animate it sliding back in with `slideUp` + `spring.default` variant.

**Why:** Item disappeared with swipe animation. Restoration should have equally polished entrance. Without animation, item "pops" into existence — breaks the "alive with motion" principle.

**Design compliance:** Uses existing `variants.slideUp` (opacity: 0, y: 24 → opacity: 1, y: 0) with `spring.default`. CartItem already wrapped in `m.div` for swipe — entrance animation is compatible.

**Implementation hint:** CartItem list already uses Framer Motion layout. Restoring an item to the Zustand store triggers a re-render. AnimatePresence on the cart list + `initial` prop on CartItem handles entrance. May need `layoutId` for smooth insertion.

---

### 6. Scroll Fade with ResizeObserver (SHOULD-HAVE)

**What:** Use ResizeObserver (not just scroll events) to detect dietary chip overflow and show/hide gradient fades.

**Why:** Scroll events only fire after user scrolls. ResizeObserver detects overflow on initial render and window resize — shows fade indicators immediately when chips overflow, even before user interaction.

**Design compliance:** CategoryTabs uses scroll event only, but that component always overflows. Dietary chips may or may not overflow depending on viewport width.

**Implementation hint:** `useEffect` with ResizeObserver on the scroll container. Check `scrollWidth > clientWidth` on resize. Combine with scroll event listener for position-based fade toggling. Debounce resize observer callback.

---

### 7. Sticky Reorder Safe-Area Handling (SHOULD-HAVE)

**What:** Apply `env(safe-area-inset-bottom)` to sticky reorder button bottom position to avoid iPhone home indicator overlap.

**Why:** iPhone X+ devices have a home indicator bar that overlaps fixed/sticky bottom elements. 70%+ users on mobile (PROJECT.md).

**Design compliance:** Mobile-first design principle. Documented gotcha: "Safe area inset — position not padding" (mobile-ux.md).

**Implementation hint:** Add `pb-[env(safe-area-inset-bottom,0px)]` to the sticky container wrapper. Test on iOS Safari with home indicator visible. Alternative: `style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}`.

---

### 8. OG Fallback Image with Brand Overlay (SHOULD-HAVE)

**What:** Create a static 1200x630 OG image with brand colors, restaurant name, and tagline for share fallback.

**Why:** When order has no item images (or image URLs are broken), the OG preview needs a professional fallback. A plain logo on white is weak; a branded card with gradient background looks intentional.

**Design compliance:** Brand warmth (golden saffron gradient), premium quality principle. Anti-pattern: no generic placeholder.

**Implementation hint:** Create manually in Figma/Canva: brand gradient background (#fb923c → #ec4899 → #7c3aed), white restaurant name (Playfair Display), tagline "Authentic Burmese Cuisine". Export as `public/og-image.png`. Reference in root layout metadata.

---

### 9. Swipe Hint with Haptic (NICE-TO-HAVE)

**What:** Pair the swipe hint animation with a light haptic pulse to draw attention on first cart view.

**Why:** Visual-only hints can be missed on scrolled-past content. Haptic pulse ensures user notices the gesture cue even if not looking at the item.

**Design compliance:** Haptic feedback standard (light: 10ms). Used sparingly — only on first-ever cart view.

**Implementation hint:** `triggerHaptic("light")` at the start of the swipe hint x-bounce animation. Gated behind `!localStorage.getItem("swipeHintSeen")`.

---

### 10. Toast Action Keyboard Accessibility (NICE-TO-HAVE)

**What:** Ensure the Undo button in toast is keyboard-focusable with `focus-visible` ring and activatable via Enter/Space.

**Why:** WCAG compliance. Toast is announced via `aria-live="polite"`, but action button needs explicit keyboard support for users navigating with Tab.

**Design compliance:** Phase 113 established `focus-visible:ring-2 ring-primary ring-offset-2` pattern on all interactive elements.

**Implementation hint:** Use `<button>` element (not `<div onClick>`). Inherits keyboard behavior. Add `focus-visible:ring-2 ring-primary ring-offset-2` classes. Consider `aria-label="Undo remove {itemName}"` for screen readers.

---

### 11. Cart Clear Undo Partial Restore (NICE-TO-HAVE)

**What:** If some items became unavailable during the 5s undo window, restore only available items and show warning toast for unavailable ones.

**Why:** Edge case: user clears cart, menu item sells out in the 5s window, user clicks undo. Restoring unavailable items creates broken cart state.

**Design compliance:** Forgiving UX principle — restore what's possible, explain what's not.

**Implementation hint:** On undo click, validate each snapshot item against current menu data (check `useCartValidation` or call `syncPendingCartItems`). Separate into restorable and unavailable. Show warning toast: "2 of 5 items no longer available" similar to reorder pattern (useReorder.ts).

---

### 12. Scroll Snap on Dietary Chips (NICE-TO-HAVE)

**What:** Add `snap-x snap-mandatory` to dietary chip scroll container so chips snap to clean positions when scrolling stops.

**Why:** Without snap, chips stop at arbitrary positions mid-word. Snap creates a polished feel consistent with native app scroll behavior.

**Design compliance:** Mobile-first polish; snap is standard in DoorDash/Uber Eats category tabs.

**Implementation hint:** Add `scroll-snap-type: x mandatory` to container, `scroll-snap-align: start` to each chip. Test that it doesn't interfere with scroll event listener for fade indicators.

---

## Summary

| Priority | Count | Effort Total |
|----------|-------|-------------|
| MUST-HAVE | 4 | 3 S + 1 XS |
| SHOULD-HAVE | 4 | 2 S + 2 M |
| NICE-TO-HAVE | 4 | 2 S + 1 M + 1 XS |

All MUST-HAVE enhancements are small additions layered onto the core implementation. SHOULD-HAVE items improve robustness and mobile polish. NICE-TO-HAVE items are edge case handling and extra polish that can be deferred if time is tight.

---

_Recommendations derived from 12-agent research across codebase, learnings, git history, and cross-phase contracts._
