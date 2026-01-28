---
phase: 27-token-enforcement-colors
plan: 04
subsystem: design-tokens
tags: [gradients, css-variables, theme-awareness, tokens]

dependency-graph:
  requires: ["27-02", "27-03"]
  provides: ["theme-aware-gradients", "gradient-utility-classes"]
  affects: ["future-component-development"]

tech-stack:
  added: []
  patterns: ["css-variable-gradients", "gradient-utility-classes"]

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/components/ui/cart/CartBar.tsx
    - src/components/ui/cart/CartItem.tsx
    - src/components/ui/cart/CartSummary.tsx
    - src/components/ui/cart/FlyToCart.tsx
    - src/components/ui/cart/CartEmptyState.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/EmptyState.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx
    - src/components/ui/checkout/CheckoutSummaryV8.tsx
    - src/components/ui/layout/AppHeader/AccountIndicator.tsx
    - src/components/ui/layout/AppHeader/AppHeader.tsx
    - src/components/ui/layout/MobileDrawer/DrawerUserSection.tsx
    - src/components/ui/admin/analytics/MetricCard.tsx
    - src/components/ui/admin/drivers/DriverListTable.tsx
    - src/components/ui/auth/AuthModal.tsx
    - src/components/ui/auth/MagicLinkSent.tsx
    - src/components/ui/auth/OnboardingTour.tsx
    - src/components/ui/auth/WelcomeAnimation.tsx

decisions:
  - id: gradient-utility-classes
    choice: "Create reusable gradient utility classes in globals.css"
    rationale: "Consistent gradient patterns across components"
  - id: css-variable-inline-styles
    choice: "Use inline CSS variable styles for unique gradients"
    rationale: "Theme-awareness without utility class proliferation"
  - id: bg-gradient-avatar
    choice: "Single avatar gradient utility for consistent user avatars"
    rationale: "Unified look for user avatar fallbacks across drawer and account indicator"

metrics:
  duration: "~16 minutes"
  completed: "2026-01-28"
---

# Phase 27 Plan 04: Gradient Token Migration Summary

Theme-aware gradient utilities using CSS variables for automatic light/dark adaptation.

## What Was Done

### Task 1: Gradient Utility Classes

Created 14 gradient utility classes in `globals.css`:

**Core Gradients:**
- `bg-gradient-hero` - Hero section backgrounds
- `bg-gradient-surface` - Subtle depth for cards
- `bg-gradient-primary` - CTAs and highlights

**Status Gradients:**
- `bg-gradient-success` - Success states
- `bg-gradient-delete` - Swipe delete indicators

**Progress Gradients:**
- `bg-gradient-progress` - Progress bar fills
- `bg-gradient-delivery-track` - Delivery progress track
- `bg-gradient-delivery-success` - Free delivery achieved

**Utility Gradients:**
- `bg-gradient-shimmer` - Loading state animations
- `bg-gradient-overlay` - Image overlays
- `bg-gradient-card-shine` - Card highlight effects
- `bg-gradient-cart-summary` - Cart summary cards
- `bg-gradient-avatar` - Avatar fallback gradients
- `text-gradient-primary` - Text gradient headings

### Task 2: Homepage and UI Gradients

Migrated cart, skeleton, menu, and checkout components:

| Component | Before | After |
|-----------|--------|-------|
| CartBar.tsx | `from-amber-400 to-orange-500` | `bg-gradient-progress` |
| CartBar.tsx | `from-green-100 to-emerald-100` | `bg-gradient-delivery-success` |
| CartItem.tsx | `from-red-500/20 to-transparent` | `bg-gradient-delete` |
| CartSummary.tsx | `from-amber-50 to-orange-50` | `bg-gradient-cart-summary` |
| CartSummary.tsx | `from-amber-100 to-amber-200` | `bg-gradient-delivery-track` |
| skeleton.tsx | inline shimmer style | `bg-gradient-shimmer` |
| EmptyState.tsx | Tailwind gradient classes | `gradientStyle` CSS variables |
| CardImage.tsx | `from-surface-*` | `bg-gradient-surface` |
| CardImage.tsx | inline shine style | `bg-gradient-card-shine` |
| CardImage.tsx | `from-black/20` | `bg-gradient-overlay` |

### Task 3: Remaining Component Gradients

Migrated admin, auth, layout, and tracking components:

| Component | Change |
|-----------|--------|
| AccountIndicator | `getGradientStyleFromEmail()` with CSS variables |
| DriverListTable | `bg-gradient-avatar` for driver initials |
| AuthModal | `bg-gradient-primary` for buttons/icons |
| MagicLinkSent | `bg-gradient-primary` for envelope animation |
| OnboardingTour | `bg-gradient-primary`, `bg-gradient-surface` |
| WelcomeAnimation | `bg-gradient-primary`, `bg-gradient-surface` |
| DrawerUserSection | `bg-gradient-avatar` for user avatar |
| AppHeader | CSS variable accent gradient |
| MetricCard | CSS variable decorative overlay |

## Commits

| Hash | Description |
|------|-------------|
| 14a40ea | Add theme-aware gradient utility classes |
| 7633584 | Convert homepage and UI gradients to utility classes |
| 830ceeb | Convert remaining component gradients to CSS variables |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `pnpm typecheck` - Pass
- `pnpm build` - Pass
- Gradients use CSS variables for theme awareness
- Zero hardcoded hex colors in gradient definitions

## Next Phase Readiness

**Phase 27 Status:** Plans 01-04 complete

**Remaining Violations (from lint):**
- Pre-existing `text-white` / `bg-white` violations in components not covered by 27-04
- These are color token violations, not gradient violations

**Technical debt addressed:**
- All gradients now theme-aware
- Consistent gradient utilities for future development
- No more hardcoded Tailwind color values in gradient definitions
