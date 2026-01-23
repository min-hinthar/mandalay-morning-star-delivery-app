# Phase 11: V8 Component Migration - Research

**Researched:** 2026-01-23
**Domain:** Component architecture, V7-to-V8 migration patterns
**Confidence:** HIGH

## Summary

V8 component migration involves updating admin, driver, hero, and tracking areas from V7 barrel imports to direct/V8-style imports. The codebase already has established V8 patterns from checkout components (PaymentStepV8, TimeStepV8, AddressStepV8). The V7 vs V8 distinction is primarily about:
1. Import paths (v7-index.ts barrels vs direct imports)
2. Design-system token usage (z-index tokens, motion tokens from design-system)
3. Consistent animation preference patterns

**Primary recommendation:** Migrate import paths first, then audit each component for design-system token compliance.

## V7 Component Inventory

### Files Importing from v7-index Barrels

| File | v7-index Import | Components Used |
|------|-----------------|-----------------|
| `src/app/(admin)/admin/page.tsx` | `@/components/admin/v7-index` | AdminDashboard, KPIData |
| `src/app/(driver)/driver/page.tsx` | `@/components/driver/v7-index` | DriverDashboard |
| `src/components/tracking/TrackingPageClient.tsx` | `./v7-index` | StatusTimeline, ETACountdown |
| `src/components/homepage/Hero.tsx` | `@/components/layouts/v7-index` | ParallaxContainer, ParallaxLayer, ParallaxGradient |
| `src/components/homepage/HomePageClient.tsx` | `./v7-index` | Hero, CoverageSection, Timeline |

### V7 Barrel Files to Deprecate

| Barrel File | Exports |
|-------------|---------|
| `src/components/admin/v7-index.ts` | AdminDashboard, Charts, Sparkline, OrderManagement, RouteOptimization, StatusCelebration, InlineCelebrationV7 |
| `src/components/driver/v7-index.ts` | DriverDashboard, Leaderboard, DeliverySuccess |
| `src/components/tracking/v7-index.ts` | TrackingMap, StatusTimeline, ETACountdown, ToastProvider, PushToast, useToast |
| `src/components/homepage/v7-index.ts` | Hero, FloatingFood, Timeline, CoverageSection |
| `src/components/layouts/v7-index.ts` | PageTransition variants, ParallaxContainer/Layer/Gradient |

## V8 Equivalents Mapping

### Direct Migration (Change Import Path Only)

| V7 Import | V8 Import | Notes |
|-----------|-----------|-------|
| `AdminDashboard` from `admin/v7-index` | `AdminDashboard` from `admin/AdminDashboard` | Direct import |
| `DriverDashboard` from `driver/v7-index` | `DriverDashboard` from `driver/DriverDashboard` | Direct import |
| `StatusTimeline` from `tracking/v7-index` | `StatusTimeline` from `tracking/StatusTimeline` | Direct import |
| `ETACountdown` from `tracking/v7-index` | `ETACountdown` from `tracking/ETACountdown` | Direct import |

### Components Already V8-Compliant

These components already use V8 patterns internally:
- `AdminDashboard.tsx` - Uses `useAnimationPreference`, motion-tokens
- `DriverDashboard.tsx` - Uses `useAnimationPreference`, spring configs
- `StatusTimeline.tsx` - Uses `useAnimationPreference`, spring configs
- `ETACountdown.tsx` - Uses `useAnimationPreference`, spring configs

### Components Needing Token Audit

| Component | Current Tokens | Needed Updates |
|-----------|---------------|----------------|
| `Hero.tsx` | Uses `@/lib/motion-tokens` | Already compliant |
| `ParallaxContainer.tsx` | Uses scroll transforms | Already compliant |
| `TrackingPageClient.tsx` | Uses hardcoded z-sticky | Already uses semantic tokens |

## TimeStep Migration

### Current State
- **Legacy:** `src/components/checkout/TimeStep.tsx` (68 lines)
- **V8:** `src/components/checkout/TimeStepV8.tsx` (109 lines)

### Import Mapping in checkout/index.ts
```typescript
// Already mapped - TimeStep points to TimeStepV8
export { TimeStepV8 as TimeStep } from "./TimeStepV8";
export { TimeStep as TimeStepLegacy } from "./TimeStep";
```

### Checkout Page Import Issue
```typescript
// src/app/(customer)/checkout/page.tsx lines 12-18
import {
  CheckoutStepperV8,
  AddressStep,
  TimeStep,        // This imports TimeStepV8 via re-export
  PaymentStep,
  CheckoutSummary,
} from "@/components/checkout";
```

**Finding:** Checkout page already imports from `@/components/checkout` which maps TimeStep to TimeStepV8. However, explicit TimeStepV8 should be used for clarity.

### TimeStep Usage Locations
| File | Usage | Status |
|------|-------|--------|
| `src/app/(customer)/checkout/page.tsx` | `<TimeStep />` | Uses V8 via re-export |
| `src/components/checkout/index.ts` | Export mapping | Already V8 |

## V8 Patterns Reference

### Design-System Token Usage
```typescript
// Z-Index tokens (from design-system/tokens/z-index.ts)
import { zIndex, zClass } from "@/design-system/tokens/z-index";
// Use: zIndex.modal, zClass.sticky, z-sticky (Tailwind)

// Motion tokens (from design-system/tokens/motion.ts)
import { overlayMotion } from "@/design-system/tokens/motion";
// Use: transition={overlayMotion.modalOpen}
```

### Animation Preference Pattern
```typescript
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { variants } from "@/lib/motion-tokens";

function Component() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      variants={shouldAnimate ? variants.slideUp : undefined}
      initial={shouldAnimate ? "initial" : undefined}
      animate={shouldAnimate ? "animate" : undefined}
    >
      {/* content */}
    </motion.div>
  );
}
```

### V8 Color Token Pattern
```typescript
// Use semantic Tailwind classes
<h2 className="text-foreground">Title</h2>
<p className="text-muted-foreground">Description</p>
<div className="border-border">Content</div>
```

### V8 Component File Structure
```
ComponentV8.tsx
├── "use client";
├── JSDoc with Phase reference
├── Imports (motion, icons, cn, tokens, hooks)
├── // ============================================
├── // TYPES
├── // ============================================
├── export interface ComponentV8Props { }
├── // ============================================
├── // MAIN COMPONENT
├── // ============================================
├── export function ComponentV8() { }
└── export default ComponentV8;
```

## Migration Complexity Assessment

### 11-01: Admin Dashboard V8 Migration
**Complexity:** LOW
- Single page file to update (`admin/page.tsx`)
- AdminDashboard component already uses V8 patterns internally
- Just need to change import path from `v7-index` to direct

**Files:**
- `src/app/(admin)/admin/page.tsx` - Update import

### 11-02: Driver Dashboard V8 Migration
**Complexity:** LOW
- Single page file to update (`driver/page.tsx`)
- DriverDashboard already uses V8 patterns
- Just need to change import path

**Files:**
- `src/app/(driver)/driver/page.tsx` - Update import

### 11-03: Hero and Tracking V8 Migration
**Complexity:** MEDIUM
- Hero uses ParallaxContainer from `layouts/v7-index`
- ParallaxContainer is a shared utility, not V7-specific
- TrackingPageClient uses StatusTimeline, ETACountdown

**Files:**
- `src/components/homepage/Hero.tsx` - Update layouts import
- `src/components/homepage/HomePageClient.tsx` - Update v7-index imports
- `src/components/tracking/TrackingPageClient.tsx` - Update v7-index imports

### 11-04: TimeStep Replacement Sweep
**Complexity:** LOW
- TimeStep already maps to TimeStepV8 in barrel
- May want explicit TimeStepV8 usage for clarity
- Verify no legacy TimeStep imports remain

**Files:**
- `src/app/(customer)/checkout/page.tsx` - Verify/update
- Search for any `TimeStepLegacy` usage

## Dependencies and Ordering

### Import Dependency Graph
```
admin/page.tsx
└── admin/v7-index.ts
    └── admin/AdminDashboard.tsx (V8 compliant)

driver/page.tsx
└── driver/v7-index.ts
    └── driver/DriverDashboard.tsx (V8 compliant)

TrackingPageClient.tsx
└── tracking/v7-index.ts
    ├── StatusTimeline.tsx (V8 compliant)
    └── ETACountdown.tsx (V8 compliant)

Hero.tsx
└── layouts/v7-index.ts
    └── ParallaxContainer.tsx (utility, not V7-specific)
```

### Recommended Order
1. **11-01:** Admin dashboard - standalone, no dependencies
2. **11-02:** Driver dashboard - standalone, no dependencies
3. **11-03:** Hero/tracking - slightly more files, but independent
4. **11-04:** TimeStep sweep - final verification pass

## Common Pitfalls

### Pitfall 1: Breaking Named vs Default Exports
**What goes wrong:** Components may have both named and default exports
**Prevention:** Check original file for export patterns before updating imports

### Pitfall 2: Type Imports
**What goes wrong:** Missing type imports when switching from barrel
**Prevention:** Import types alongside components: `import { Component, type ComponentProps } from "./Component"`

### Pitfall 3: V7 Alias Confusion
**What goes wrong:** Some barrels export both `Component` and `ComponentV7` as aliases
**Prevention:** Import the primary name (without V7 suffix)

### Pitfall 4: Parallel Barrel Files
**What goes wrong:** Components have both `index.ts` and `v7-index.ts`
**Prevention:** Use `index.ts` after migration, mark v7-index.ts for deprecation

## Success Criteria Verification

| Criteria | Verification Method |
|----------|---------------------|
| Admin dashboard renders using V8 components (no V7 imports) | Grep for `admin/v7-index` returns empty |
| Driver dashboard renders using V8 components (no V7 imports) | Grep for `driver/v7-index` returns empty |
| Homepage Hero uses V8 layout components | Grep for `layouts/v7-index` in Hero.tsx returns empty |
| Tracking page uses V8 components | Grep for `tracking/v7-index` returns empty |
| All TimeStep usages replaced with TimeStepV8 | Grep for `TimeStepLegacy` returns empty |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation preference | Custom reduced-motion detection | `useAnimationPreference` hook | Handles all preference levels |
| Motion variants | Inline animation objects | `variants` from motion-tokens | Consistent spring physics |
| Z-index values | Hardcoded numbers | `zIndex` tokens, `z-*` classes | Prevents layer conflicts |
| Color tokens | Hardcoded colors | `text-foreground`, `text-muted-foreground` | Theme-aware |

## Sources

### Primary (HIGH confidence)
- Codebase analysis of:
  - `src/components/admin/v7-index.ts`
  - `src/components/driver/v7-index.ts`
  - `src/components/tracking/v7-index.ts`
  - `src/components/homepage/v7-index.ts`
  - `src/components/checkout/TimeStepV8.tsx`
  - `src/components/ui-v8/Modal.tsx`
  - `src/design-system/tokens/z-index.ts`
  - `src/design-system/tokens/motion.ts`

### Secondary (HIGH confidence)
- Phase 9 Plan 01 TimeStepV8 creation
- Phase 10 z-index and color token migration

## Metadata

**Confidence breakdown:**
- V7 inventory: HIGH - Direct grep and file reading
- V8 equivalents: HIGH - Traced actual file structure
- Migration complexity: HIGH - Analyzed file sizes and dependencies
- TimeStep status: HIGH - Verified index.ts mappings

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (stable patterns, unlikely to change)

---

## RESEARCH COMPLETE

**Phase:** 11 - V8 Component Migration
**Confidence:** HIGH

### Key Findings

- 5 v7-index barrel files need deprecation (admin, driver, tracking, homepage, layouts)
- All target components already use V8 patterns internally (animation preference, motion tokens)
- Migration is primarily import path changes, not component rewrites
- TimeStep is already mapped to TimeStepV8 in checkout/index.ts
- Semantic z-index tokens already applied in Phase 10

### File Created

`.planning/phases/11-v8-component-migration/11-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Direct codebase analysis |
| Architecture | HIGH | Existing V8 patterns documented |
| Pitfalls | HIGH | Based on actual export patterns |

### Open Questions

None - all patterns are established and migration paths are clear.

### Ready for Planning

Research complete. Planner can now create PLAN.md files for:
- 11-01: Admin dashboard V8 migration
- 11-02: Driver dashboard V8 migration
- 11-03: Hero and tracking V8 migration
- 11-04: TimeStep replacement sweep
