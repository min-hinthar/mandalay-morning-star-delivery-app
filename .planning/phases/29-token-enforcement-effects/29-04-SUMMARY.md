---
phase: 29-token-enforcement-effects
plan: 04
subsystem: ui
tags: [shadow, tokens, css-variables, tailwind, framer-motion]

# Dependency graph
requires:
  - phase: 29-01
    provides: shadow token infrastructure
  - phase: 29-02
    provides: shadow token migration patterns
  - phase: 29-03
    provides: blur token migration patterns
provides:
  - zero shadow-[...] arbitrary values in components
  - all static shadows use Tailwind utilities or CSS variables
  - all animated shadows documented with token equivalents
affects: [future-shadow-usage, design-system-maintenance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Framer Motion animated shadows with token equivalent documentation
    - CSS variable shadows for discrete state changes
    - Tailwind shadow utilities for static shadows

key-files:
  created: []
  modified:
    - src/components/ui/checkout/CheckoutStepperV8.tsx
    - src/components/ui/checkout/CheckoutWizard.tsx
    - src/components/ui/checkout/AddressInput.tsx
    - src/app/(customer)/checkout/page.tsx
    - src/components/ui/homepage/CTABanner.tsx
    - src/components/ui/admin/analytics/PerformanceChart.tsx
    - src/components/ui/admin/RevenueChart.tsx
    - src/components/ui/layout/CheckoutLayout.tsx
    - src/components/ui/layout/DriverLayout.tsx
    - src/components/ui/layout/AdminLayout.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/GlassOverlay.tsx
    - src/components/ui/menu/MenuAccordion.tsx
    - src/components/ui/NavDots.tsx
    - src/components/ui/orders/tracking/DeliveryMap.tsx
    - src/components/ui/Modal.tsx
    - src/lib/hooks/useLuminance.ts

key-decisions:
  - id: framer-motion-numeric
    choice: "Keep numeric boxShadow for animated variants"
    rationale: "Framer Motion requires numeric values for smooth interpolation"
  - id: css-vars-discrete-state
    choice: "Use CSS variables for discrete state changes"
    rationale: "AddressInput focus state doesn't interpolate, can use var()"
  - id: useLuminance-documented-exception
    choice: "Document dynamic luminance shadows as intentional exception"
    rationale: "Shadow color adapts to image content (white vs black base)"
  - id: glow-jade-to-success
    choice: "Use --shadow-glow-success for jade buttons"
    rationale: "Jade is the success color, no separate jade token needed"

# Metrics
duration: 10min
completed: 2026-01-28
---

# Phase 29 Plan 04: Shadow Migration Completion Summary

**Achieved zero shadow-[...] arbitrary values and documented all Framer Motion animated shadows with token equivalents**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-28
- **Completed:** 2026-01-28
- **Tasks:** 3 + cleanup
- **Files modified:** 16

## Accomplishments

### Task 1: Checkout Component Shadows
| Component | Before | After |
|-----------|--------|-------|
| CheckoutStepperV8 | Inline connector glow | Documented ~--shadow-glow-success equivalent |
| CheckoutStepperV8 | Inline pulsing halo | Documented ~--shadow-glow-primary equivalent |
| CheckoutWizard | Inline pulse shadow | Documented ~--shadow-focus equivalent |
| AddressInput | Inline focus shadow | `var(--shadow-focus)` CSS variable |
| checkout/page.tsx | Inline step glow | Documented ~--shadow-glow-primary equivalent |

### Task 2: Admin, Layout, and Homepage Shadows
| Component | Before | After |
|-----------|--------|-------|
| CTABanner | Inline float/glow | Documented ~--shadow-xl and ~--shadow-glow-warning |
| PerformanceChart | Inline tooltip shadow | `var(--shadow-md)` |
| RevenueChart | Inline tooltip shadow | `var(--shadow-card)` |
| DriverLayout | `--shadow-glow-jade` | `shadow-glow-success` utility |

### Task 3: Menu, Navigation, and Utility Shadows
| Component | Before | After |
|-----------|--------|-------|
| GlassOverlay | Inline hover glow | Documented ~--shadow-glow-primary equivalent |
| MenuAccordion | `shadow-[var(--elevation-2)]` | `shadow-sm` utility |
| NavDots | Inline active glow | `var(--shadow-glow-primary)` |
| DeliveryMap | `shadow-[var(--shadow-md)]` | `shadow-md` utility |
| useLuminance | Undocumented dynamic | Documented with ESLint disable |

### Cleanup: Layout CSS Variable Patterns
| Component | Before | After |
|-----------|--------|-------|
| CheckoutLayout | `shadow-[var(--shadow-glow-primary)]` | `shadow-glow-primary` |
| DriverLayout | `shadow-[var(--shadow-glow-*)]` | `shadow-glow-*` utilities |
| AdminLayout | `shadow-[var(--shadow-lg)]` | `shadow-lg` |
| Modal | `shadow-[var(--shadow-xl,...)]` | `shadow-xl` |

## Verification Results

- Zero `shadow-[...]` arbitrary values in component files
- All static boxShadow styles use CSS variables or Tailwind utilities
- All Framer Motion animated shadows have comments documenting token equivalents
- useLuminance.ts documents dynamic shadow generation
- `pnpm typecheck` passes
- `pnpm build` passes

## Decisions Made

1. **Framer Motion numeric values** - Animated shadows kept numeric for smooth interpolation
2. **CSS vars for discrete states** - AddressInput focus uses `var(--shadow-focus)` since it doesn't interpolate
3. **useLuminance documented exception** - Dynamic shadows adapt to image luminance, require different base colors
4. **glow-jade replaced with glow-success** - Jade is the success color token, reusing existing semantic token

## Deviations from Plan

**[Rule 1 - Bug] Fixed missing --shadow-glow-jade token**
- **Found during:** Task 2
- **Issue:** DriverLayout referenced non-existent `--shadow-glow-jade` token
- **Fix:** Changed to `shadow-glow-success` since jade is the success color
- **Files modified:** DriverLayout.tsx
- **Commit:** a4c3468

**[Rule 2 - Missing Critical] Cleanup of CSS variable arbitrary patterns**
- **Found during:** Verification
- **Issue:** Several files used `shadow-[var(--shadow-*)]` instead of proper Tailwind utilities
- **Fix:** Converted to proper utilities (shadow-xl, shadow-lg, shadow-glow-*)
- **Files modified:** CheckoutLayout.tsx, DriverLayout.tsx, AdminLayout.tsx, Modal.tsx
- **Commit:** 95ef339

## Commits

| Commit | Description |
|--------|-------------|
| a49769d | Task 1 - Checkout component shadows |
| a4c3468 | Task 2 - Admin, layout, homepage shadows |
| 57b6a4d | Task 3 - Menu, navigation, utility shadows |
| 95ef339 | Cleanup - Convert shadow-[var(...)] to utilities |

## Next Phase Readiness

Phase 29 shadow/blur token enforcement complete:
- All shadow tokens are theme-aware via CSS variables
- All blur tokens are tokenized
- All animated values document token equivalents
- Zero arbitrary shadow/blur violations remaining
- Ready for Phase 30 or other token enforcement work
