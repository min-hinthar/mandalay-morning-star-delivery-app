---
phase: 22
plan: 03
subsystem: customer-ui
tags: [animation, orders, cart, empty-state, glassmorphism, scroll-reveal]
dependencies:
  requires: ["22-01"]
  provides: ["animated-orders-page", "premium-cart-drawer", "page-specific-empty-states"]
  affects: ["future-customer-pages"]
tech-stack:
  added: []
  patterns: ["staggered-scroll-reveal", "page-personality-animations", "gradient-blob-backgrounds"]
key-files:
  created:
    - src/components/orders/OrderListAnimated.tsx
    - src/components/orders/OrdersHeader.tsx
  modified:
    - src/app/(customer)/orders/page.tsx
    - src/components/orders/OrderCard.tsx
    - src/components/ui-v8/cart/CartDrawerV8.tsx
    - src/components/ui-v8/cart/CartItemV8.tsx
    - src/components/ui/EmptyState.tsx
decisions:
  - key: order-card-stagger
    choice: "80ms stagger with 500ms cap using staggerDelay function"
    rationale: "Consistent with Phase 22 animation standards"
  - key: empty-state-animations
    choice: "Variant-specific icon animations (cart floats, heart beats, etc.)"
    rationale: "Page personality per CONTEXT.md"
  - key: cart-checkout-glow
    choice: "Pulsing glow behind checkout button"
    rationale: "Premium CTA emphasis without being distracting"
metrics:
  duration: "7min"
  completed: "2026-01-26"
---

# Phase 22 Plan 03: Orders, Cart & Empty State Polish Summary

**One-liner:** Order History with staggered glassmorphism cards, premium Cart drawer with rubbery springs and pulsing CTA, and page-specific animated empty states with gradient blobs.

## What Was Built

### Task 1: Order History Page Enhancement
- Created `OrderListAnimated` client component for scroll-reveal animation
- Created `OrdersHeader` client component for animated header
- Enhanced `OrderCard` with:
  - Glassmorphism (`glass-menu-card`)
  - Hover glow (`glow-gradient`)
  - Premium shadow (`shadow-colorful`)
  - 80ms stagger with 500ms cap
  - Hover lift effect (scale: 1.02, y: -4)
- Added `viewTransitionName` for future View Transitions API support

### Task 2: Cart Drawer Premium Animations
- Enhanced item count badge with rubbery spring bounce on change
- Added pulsing glow behind checkout button for CTA emphasis
- Added rotation to item exit animation for natural feel
- Added `shadow-colorful` to cart items
- Improved hover state with subtle lift (y: -2)

### Task 3: Page-Specific Empty States
- Added animated icons with variant-specific motion patterns:
  - Cart: floating bag with rotation
  - Search: side-to-side searching motion
  - Orders: receipt with sparkle decorations
  - Favorites: heart beating animation
- Added gradient blob backgrounds per variant
- Implemented staggered content reveal (icon -> title -> desc -> button)
- Updated copy for warmer, more engaging messaging
- All animations respect reduced motion preferences

## Implementation Patterns

### Stagger Pattern for Lists
```tsx
const delay = staggerDelay(index); // 80ms * index, capped at 500ms
transition={{ ...springConfig, delay }}
```

### Animated Empty State Icon
```tsx
<AnimatedIcon
  variant={variant}
  Icon={Icon}
  shouldAnimate={shouldAnimate}
  gradientFrom={config.gradientFrom}
  gradientTo={config.gradientTo}
/>
```

### Pulsing Glow CTA
```tsx
<motion.div
  className="absolute inset-0 rounded-xl bg-primary/30 blur-lg"
  animate={{
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.02, 1],
  }}
  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
/>
```

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Order card stagger | 80ms with 500ms cap | Phase 22 standard |
| Empty state animations | Variant-specific patterns | Page personality per CONTEXT |
| Checkout button glow | Pulsing opacity + scale | Premium CTA without distraction |
| Cart item hover | scale 1.02 + y: -2 | Subtle lift matches menu cards |

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change |
|------|--------|
| src/app/(customer)/orders/page.tsx | Use client components for animation |
| src/components/orders/OrderCard.tsx | Add glassmorphism, glow, stagger |
| src/components/orders/OrderListAnimated.tsx | NEW: scroll-reveal wrapper |
| src/components/orders/OrdersHeader.tsx | NEW: animated header |
| src/components/ui-v8/cart/CartDrawerV8.tsx | Rubbery badge, pulsing checkout glow |
| src/components/ui-v8/cart/CartItemV8.tsx | shadow-colorful, exit rotation |
| src/components/ui/EmptyState.tsx | Animated icons, gradient blobs, stagger |

## Verification Results

- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] Order cards stagger at 80ms with 500ms cap
- [x] Order cards have glassmorphism and hover glow
- [x] Cart drawer has rubbery spring on badge
- [x] Cart items have premium shadow and lift
- [x] Empty states have page-specific animations
- [x] All animations respect reduced motion

## Commits

1. `e980e4b` - feat(22-03): enhance Order History with stagger and scroll reveal
2. `a68033d` - feat(22-03): polish Cart drawer with premium animations
3. `873fa52` - feat(22-03): enhance empty states with page-specific personality

## Next Phase Readiness

Phase 22 Plan 03 complete. Ready for:
- 22-04 (if exists) or Phase 23

No blockers. All customer page polish tasks for orders, cart, and empty states complete.
