---
phase: 116-micro-interactions-polish
plan: 02
subsystem: customer-ux
tags: [micro-interactions, swipe-hint, scroll-indicators, discoverability]
dependency_graph:
  requires: [116-01]
  provides: [swipe-hint-bounce, dietary-scroll-indicators]
  affects: [cart-drawer, cart-page, menu-header]
tech_stack:
  added: []
  patterns: [localStorage-flag, scroll-fade-indicators, spring-bounce-keyframes]
key_files:
  created: []
  modified:
    - src/components/ui/cart/CartItem/CartItem.tsx
    - src/components/ui/cart/CartDrawerParts.tsx
    - src/components/ui/cart/CartPage/CartItemGroup.tsx
    - src/components/ui/menu/MenuHeader.tsx
decisions:
  - "isFirstItem prop on CartItem (not index) -- cleaner API, parent decides which item gets hint"
  - "isCollapsed added to useEffect deps -- re-runs observer when chips row mounts/unmounts"
  - "Gradient uses var(--color-cream) not surface-primary -- matches actual MenuHeader bg"
metrics:
  duration: 8min
  completed: 2026-04-11
  tasks: 2
  files: 4
---

# Phase 116 Plan 02: Swipe Hint & Scroll Indicators Summary

One-time swipe-to-delete bounce hint on first cart item + gradient fade scroll indicators on dietary chip row.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4c6487ea | Swipe hint bounce animation on first cart item |
| 2 | a0283c79 | Gradient fade scroll indicators on MenuHeader dietary chips |

## Task Results

### Task 1: Swipe hint bounce animation

- Added `isFirstItem?: boolean` prop to `CartItemProps`
- One-time bounce animation `x: [0, -30, 0]` with `spring.ultraBouncy` after 800ms delay
- `localStorage.getItem("swipeHintSeen")` / `setItem("swipeHintSeen", "1")` for one-time flag
- PanInfo guard `if (!info?.offset || !info?.velocity) return` prevents crash on interrupted gestures
- Gated on `isFirstItem && shouldAnimate` -- reduced motion users see no hint
- Passed `isFirstItem={index === 0}` from CartDrawerParts and CartItemGroup

### Task 2: Gradient fade scroll indicators on dietary chips

- Added `showLeftFade` / `showRightFade` state with `updateFadeIndicators` callback
- Scroll position thresholds: `scrollLeft > 10` and `scrollLeft < scrollWidth - clientWidth - 10`
- Gradient colors: `from-[var(--color-cream)]` light / `from-[var(--color-background)]` dark -- matches header bg
- Both indicators are `pointer-events-none` and `aria-hidden="true"`
- `ResizeObserver` + passive scroll listener for responsive updates
- `isCollapsed` in useEffect deps handles re-mount when chips row expands

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- pnpm typecheck: PASS
- pnpm lint: PASS (1 pre-existing warning in unrelated file)
