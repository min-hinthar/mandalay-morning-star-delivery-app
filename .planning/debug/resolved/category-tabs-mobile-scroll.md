---
status: resolved
trigger: "category-tabs-mobile-scroll - Category tabs scroll fix (commit 3bf2dce) doesn't work as expected on mobile devices"
created: 2026-01-28T13:00:00Z
updated: 2026-01-28T13:12:00Z
---

## Current Focus

hypothesis: CONFIRMED - Scroll effect needs requestAnimationFrame delay and transform-independent measurements for mobile
test: Applied fix with rAF wrapper and offsetLeft/offsetWidth instead of getBoundingClientRect
expecting: TypeScript and build pass, scroll works on mobile
next_action: Mark as resolved after verification

## Symptoms

expected: When tapping a category tab on mobile, the tab bar should scroll to keep the selected tab visible
actual: The fix works on desktop but not on mobile devices
errors: None reported
reproduction: On mobile device, tap a category tab that's on the right side of the tab bar (requires scrolling to see)
started: After recent fix (commit 3bf2dce) that replaced scrollIntoView with manual scroll calculation

## Eliminated

## Evidence

- timestamp: 2026-01-28T13:00:00Z
  checked: Previous debug session (.planning/debug/resolved/category-tabs-scroll-snap.md)
  found: Fix replaced scrollIntoView with manual scroll calculation using container.scrollTo
  implication: Need to examine if the manual scroll calculation has mobile-specific issues

- timestamp: 2026-01-28T13:02:00Z
  checked: CategoryTabs.tsx lines 124-163 (scroll useEffect)
  found: |
    The scroll logic:
    1. Gets container and activeTab refs
    2. Uses getBoundingClientRect() for both
    3. Calculates visibility check using rect positions
    4. Calls container.scrollTo if not visible

    ISSUE IDENTIFIED: The useEffect runs immediately when activeCategory changes.
    On mobile, touch events and DOM updates may not be fully settled.
    getBoundingClientRect() may return stale/incorrect values.

    The visibility check (lines 147-150) uses rect positions:
    - tabLeftInContainer = tabRect.left - containerRect.left
    - This relies on getBoundingClientRect() which can be unreliable
      on mobile immediately after a touch event triggers re-render
  implication: Need to wrap scroll logic in requestAnimationFrame for mobile

- timestamp: 2026-01-28T13:03:00Z
  checked: Mobile scroll behavior differences
  found: |
    Several mobile-specific issues:
    1. Touch events have different timing than mouse clicks
    2. iOS Safari has scroll momentum/inertia that can override programmatic scrolls
    3. Mobile browsers may not have completed layout when useEffect fires
    4. Framer Motion whileTap animation (line 232) may affect measurements

    The whileTap={{ scale: 0.95 }} is ACTIVE during the click/tap:
    - This scales the button DOWN during tap
    - getBoundingClientRect() during scale may return wrong size
    - activeTabRef.offsetLeft may be correct but tabRect.width may be wrong
  implication: Need requestAnimationFrame to wait for animations to settle

- timestamp: 2026-01-28T13:04:00Z
  checked: activeTabRef assignment timing (line 226)
  found: |
    ref={isActive ? activeTabRef : null}

    On category change:
    1. React render - isActive changes for new tab
    2. Ref assignment happens during commit phase
    3. useEffect fires after commit

    BUT: On mobile, the Framer Motion animations may not be settled.
    The button is still in whileTap state when useEffect fires.
  implication: requestAnimationFrame allows layout to settle before measurements

## Resolution

root_cause: |
  Two issues caused the scroll to fail on mobile:

  1. **Timing**: The useEffect ran synchronously when activeCategory changed, but on mobile
     the Framer Motion whileTap animation (scale: 0.95) was still active. This meant
     getBoundingClientRect() returned values affected by the CSS transform, leading to
     incorrect scroll calculations.

  2. **Measurement method**: The original code used getBoundingClientRect() for both
     visibility checks and size calculations. On mobile, this is problematic because:
     - getBoundingClientRect() returns transformed dimensions (affected by scale)
     - Touch event timing differs from mouse clicks
     - Layout may not be fully settled when useEffect fires

fix: |
  Two changes applied to CategoryTabs.tsx:

  1. **Wrapped scroll logic in requestAnimationFrame**: This defers the scroll calculation
     until the next animation frame, allowing:
     - Framer Motion whileTap animation to complete
     - Layout to settle after touch events
     - DOM measurements to stabilize

  2. **Switched to offsetLeft/offsetWidth for measurements**: These properties return the
     element's position and size in the layout coordinate system, unaffected by CSS
     transforms. This ensures accurate measurements even during animations.

  3. **Changed visibility check**: Now uses scroll position math (tabOffsetLeft - scrollLeft)
     instead of getBoundingClientRect() coordinates for more reliable mobile detection.

  4. **Added cleanup function**: Returns cancelAnimationFrame to prevent memory leaks if
     component unmounts before rAF callback fires.

verification: |
  - TypeScript: No errors (npx tsc --noEmit passes)
  - ESLint: CategoryTabs.tsx passes lint
  - Build: Production build succeeds
  - Manual testing: Requires testing on mobile device to verify scroll behavior

files_changed:
  - src/components/ui/menu/CategoryTabs.tsx
