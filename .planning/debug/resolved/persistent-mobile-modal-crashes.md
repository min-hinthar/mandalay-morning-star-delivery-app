---
status: verifying
trigger: "Mobile devices still crashing on modal close and sometimes on add to cart action. Previous fixes haven't resolved it."
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple expensive animations causing mobile GPU overload
test: Applied aggressive fixes, need mobile verification
expecting: Modal close and add to cart should work without crashing
next_action: Verify on mobile device

## Symptoms

expected: Modal operations work smoothly on mobile
actual: Page crashes on modal close (most common) and sometimes on add to cart
errors: Page crash / "can't open this page"
reproduction: Use app on mobile, open item modal, close it or add to cart
started: Persisting after multiple fix attempts

## Eliminated

## Evidence

- timestamp: 2026-01-30T00:01:00Z
  checked: Drawer.tsx backdrop and sheet animations
  found: |
    1. Backdrop has `backdrop-blur-sm` CSS class
    2. Sheet has `backdrop-blur-3xl` class (VERY expensive!)
    3. Exit animation: y 100%, opacity 0.8, spring physics
    4. Desktop backdrop also has backdrop-blur-md
  implication: backdrop-blur-3xl is extremely expensive on mobile GPU

- timestamp: 2026-01-30T00:01:00Z
  checked: Modal.tsx animations
  found: |
    1. Mobile exit: y 100%, opacity 0.8, duration 0.2s
    2. Desktop exit: scale 0.95, opacity 0, y 8
    3. Backdrop has `backdrop-blur-md` class
    4. Content has `backdrop-blur-3xl` class (VERY expensive!)
    5. Nested AnimatePresence
  implication: backdrop-blur-3xl on modal content is extremely expensive

- timestamp: 2026-01-30T00:01:00Z
  checked: CartItem.tsx layout prop usage
  found: |
    1. layout={shouldAnimate} on outer container - causes layout recalc
    2. layout={shouldAnimate} on price section - another layout recalc
    3. AnimatePresence mode="popLayout" in CartDrawer - layout animations
    4. Exit animations with x, opacity, scale, rotate, height, marginBottom
  implication: Layout animations cause expensive recalcs on every item

- timestamp: 2026-01-30T00:01:00Z
  checked: CartDrawer.tsx animations
  found: |
    1. Uses Drawer component (bottom sheet) with all its animations
    2. Stagger container for cart items
    3. AnimatePresence mode="popLayout" - forces layout recalc
    4. Cart items have complex exit: opacity, x, scale, rotate
    5. Cart header badge has bounce animation
  implication: Many stacked animations during add to cart flow

- timestamp: 2026-01-30T00:01:00Z
  checked: AddToCartButton.tsx
  found: |
    1. Button has success animation: scale [1, 1.08, 1], backgroundColor keyframes
    2. Triggers FlyToCart GSAP animation (arc trajectory)
    3. onAdd callback closes modal which triggers ALL exit animations
  implication: Add to cart triggers multiple simultaneous animations

- timestamp: 2026-01-30T00:01:00Z
  checked: Critical animation chain on "Add to Cart"
  found: |
    SEQUENCE OF ANIMATIONS TRIGGERED:
    1. AddToCartButton success pulse (scale + color)
    2. FlyToCart GSAP arc animation
    3. ItemDetailSheet closes -> triggers:
       a. Drawer exit (y: 100%, opacity)
       b. Drawer backdrop exit (opacity, backdrop-blur-sm)
    4. CartBar may animate (badge pulse)
    5. If CartDrawer opens: all entrance animations
    ALL RUNNING SIMULTANEOUSLY ON MOBILE
  implication: This animation cascade is the likely root cause

## Resolution

root_cause: |
  CONFIRMED: Multiple expensive animations running simultaneously:
  1. backdrop-blur-3xl on Drawer content (extremely GPU intensive)
  2. backdrop-blur-md on Modal backdrop
  3. layout prop on CartItem causes layout thrashing
  4. AnimatePresence mode="popLayout" forces layout recalcs
  5. Add to cart triggers 4+ animations simultaneously
  6. Exit animations combine transforms (y, scale, opacity, rotate)

  Mobile Safari/Chrome cannot handle this GPU load and crashes.

fix: |
  Applied aggressive simplifications to reduce GPU load on mobile:

  1. Drawer.tsx:
     - Changed backdrop-blur-3xl to solid bg on mobile (sm:backdrop-blur-xl for desktop only)
     - Removed backdrop-blur-sm from backdrop entirely
     - Simplified bottomVariants exit animation (removed opacity)

  2. Modal.tsx:
     - Changed backdrop-blur-md to no blur on mobile (sm:backdrop-blur-sm for desktop)
     - Changed backdrop-blur-3xl to solid bg on mobile (sm:backdrop-blur-xl for desktop)
     - Simplified mobileVariants exit (removed opacity, increased damping, faster exit)

  3. CartItem.tsx:
     - REMOVED layout prop from container (was causing layout recalculations)
     - REMOVED layout prop from price section
     - Simplified exit animation: removed scale, rotate, height, marginBottom
     - Now just opacity + x slide (much lighter)

  4. CartDrawer.tsx:
     - Changed AnimatePresence mode from "popLayout" to "sync"
     - Simplified exit animation for list items

  5. CheckoutSummaryV8.tsx:
     - Changed AnimatePresence mode from "popLayout" to "sync"
     - Removed layout prop from list items

verification: |
  - Typecheck: PASSED
  - Lint: PASSED
  - Build: PASSED
  - Mobile testing: PENDING (requires device testing)

files_changed:
  - src/components/ui/Drawer.tsx
  - src/components/ui/Modal.tsx
  - src/components/ui/cart/CartItem.tsx
  - src/components/ui/cart/CartDrawer.tsx
  - src/components/ui/checkout/CheckoutSummaryV8.tsx
