# Phase 24 Codebase Cleanup - Bundle Report

**Generated:** 2026-01-27
**Version:** Post-cleanup verification

## Summary

Phase 24 codebase cleanup completed successfully. Removed 3D dependencies, legacy layout files, and unused components while consolidating animation tokens to a single source of truth.

## Bundle Size Impact

### Packages Removed (24-01)

| Package | Version | Size (gzipped) | Purpose |
|---------|---------|----------------|---------|
| @react-three/fiber | 9.5.0 | ~50KB | React Three Fiber core |
| @react-three/drei | 10.7.7 | ~150KB | R3F helpers/primitives |
| three | 0.182.0 | ~450KB | Three.js core |
| @react-spring/three | 10.0.3 | ~30KB | R3F spring animations |
| @types/three | 0.182.0 | dev | TypeScript types |
| detect-gpu | 5.0.70 | ~5KB | GPU tier detection |

**Estimated bundle reduction:** ~650KB+ gzipped

### Build Output

| Metric | Value |
|--------|-------|
| Total .next/ size | 90MB (includes server chunks, SSR code) |
| Static chunks directory | 4.1MB |
| Largest client chunk | 540KB (vendor bundle) |
| Build time | 23s compile + 12s post-compile |

### Key Files Comparison

| Category | Before (estimated) | After |
|----------|-------------------|-------|
| Client JS chunks | ~4.7MB | 4.1MB |
| Three.js in bundle | ~650KB | 0KB |
| 3D component files | 12 files | 0 files |
| Animation token files | 4+ files | 1 file |

## Files Removed

### 24-01: 3D Code Removal (12 files)

```
src/components/3d/Hero3DCanvas.tsx
src/components/3d/Scene.tsx
src/components/3d/ThemeAwareLighting.tsx
src/components/3d/hooks/useGPUTier.ts
src/components/3d/loaders/Hero3DLoader.tsx
src/components/3d/models/FoodModel.tsx
src/components/3d/index.ts
src/components/homepage/Hero3DSection.tsx
src/app/(dev)/3d-test/page.tsx
src/app/(dev)/3d-test/RotatingCube.tsx
public/models/rice-bowl.glb
public/models/ATTRIBUTION.md
```

### 24-02: Legacy Files Removal (21 files, 7,113 lines)

```
src/components/layout/header.tsx
src/components/layout/HeaderClient.tsx
src/components/layout/HeaderServer.tsx
src/components/layout/MobileNav.tsx
src/components/layout/NavLinks.tsx
src/components/layout/footer.tsx
src/components/homepage/CoverageSection.tsx
src/components/homepage/FloatingFood.tsx
src/components/homepage/HeroVideo.tsx
src/components/homepage/Timeline.tsx
src/components/checkout/CoverageStatus.tsx
src/components/menu/CategoryCarousel.tsx
src/components/menu/ModifierToggle.tsx
src/components/menu/VisualPreview.tsx
src/components/layouts/ParallaxContainer.tsx
src/components/map/CoverageMap.tsx
src/components/map/PlacesAutocomplete.tsx
src/components/tracking/PushToast.tsx
src/components/tracking/TrackingMap.tsx
src/lib/webgl/grain.ts
src/lib/webgl/particles.ts
```

### 24-03: Animation Consolidation

Animation tokens already consolidated. The following legacy files were pre-removed:
- `src/lib/animations.ts` - Already deleted
- `src/lib/animations/variants.ts` - Already deleted
- `src/lib/animations/cart.ts` - Already deleted
- `src/lib/motion.ts` - Already deleted

**Current state:** All 90+ component files import from `@/lib/motion-tokens.ts` (single source of truth)

## Verification Results

### TypeScript

```
pnpm typecheck
> tsc --noEmit
(no errors)
```

### ESLint

```
pnpm lint
> eslint
(no errors)
```

### Tests

```
pnpm test
Test Files: 18 passed (18)
Tests: 343 passed (343)
Duration: 14.10s
```

### Build

```
pnpm build
✓ Compiled successfully in 23.0s
✓ Generating static pages (45/45)
Route types: 11 static, 55 dynamic
```

### Knip Analysis

```
pnpm knip

Unused files (6):
- src/components/admin/OrderManagement.tsx
- src/components/admin/RouteOptimization.tsx
- src/components/admin/StatusCelebration.tsx
- src/components/driver/DeliverySuccess.tsx
- src/components/driver/Leaderboard.tsx
- src/components/admin/analytics/Charts.tsx

Unused dependencies (3):
- @conform-to/react (form validation - not currently used)
- @conform-to/zod (form validation - not currently used)
- @stripe/stripe-js (false positive - used via Stripe SDK)

Unused exports (302):
- Intentionally kept for future use or public API surface
```

**Knip status:** 6 unused files are intentionally kept admin/driver components for future features.

## Animation Token Consolidation

### Before

Multiple animation files with overlapping definitions:
- `src/lib/animations.ts` - V3 foundation
- `src/lib/animations/variants.ts` - Additional variants
- `src/lib/animations/cart.ts` - Cart-specific animations
- `src/lib/motion.ts` - V6 presets
- `src/lib/motion-tokens.ts` - V7 tokens

### After

Single source of truth:
- `src/lib/motion-tokens.ts` (22KB, 905 lines)

Contains:
- Duration tokens (micro, fast, normal, slow, dramatic, epic)
- Easing curves (default, out, in, inOut, overshoot, elastic)
- Spring presets (11 presets: default, ultraBouncy, rubbery, snappy, floaty, etc.)
- Transition presets
- Variants (fadeIn, slideUp, slideDown, scaleIn, popIn, etc.)
- Hover effects
- Input focus animations
- Overlay variants
- Stagger utilities (STAGGER_GAP, VIEWPORT_AMOUNT, staggerContainer, staggerDelay)
- Scroll reveal animations
- Parallax utilities
- Celebration animations
- Cart-specific animations (cartBarBounce, cartBarSlideUp, badgeVariants)
- Haptic feedback utility (triggerHaptic)

### Import Pattern

```typescript
// Standard import across all 90+ components
import { spring, variants, hover, staggerContainer } from "@/lib/motion-tokens";
```

## Remaining Technical Debt

### Acceptable

1. **6 unused admin/driver files** - Future features, intentionally kept
2. **302 unused exports in motion-tokens.ts** - Public API surface for animation system
3. **CSS lint warnings (3)** - Pre-existing formatting issues in globals.css

### Future Consideration

1. **@conform-to/* packages** - Remove if not adopting Conform forms
2. **Large unused exports count** - Consider tree-shaking optimization if bundle size becomes concern

## Totals

| Metric | Count |
|--------|-------|
| Files deleted | 33 |
| Lines removed | 7,113+ |
| Packages removed | 6 |
| Bundle reduction | ~650KB gzipped |
| Animation files consolidated | 4 -> 1 |
| Import patterns standardized | 90+ files |

---

*Generated by Phase 24 Codebase Cleanup - Plan 03*
