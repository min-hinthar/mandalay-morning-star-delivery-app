---
phase: 18-menu-unification
plan: 01
subsystem: ui-components
tags: [menu, glassmorphism, 3d-tilt, framer-motion, animation]
dependency-graph:
  requires: [15-01, 16-01]
  provides: [UnifiedMenuItemCard, glass-menu-card]
  affects: [18-02, 18-03]
tech-stack:
  added: []
  patterns: [state-machine-button, 3d-tilt-mouse-tracking, glassmorphism-css]
key-files:
  created:
    - src/components/menu/UnifiedMenuItemCard/index.ts
    - src/components/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
    - src/components/menu/UnifiedMenuItemCard/GlassOverlay.tsx
    - src/components/menu/UnifiedMenuItemCard/CardImage.tsx
    - src/components/menu/UnifiedMenuItemCard/CardContent.tsx
    - src/components/menu/UnifiedMenuItemCard/AddButton.tsx
    - src/components/menu/UnifiedMenuItemCard/DietaryBadges.tsx
    - src/components/menu/UnifiedMenuItemCard/use-card-sound.ts
  modified:
    - src/app/globals.css
decisions:
  - id: MENU-01
    decision: 3D tilt max angle 18 degrees
    rationale: Balance between visual impact and usability per CONTEXT.md (15-20 range)
  - id: MENU-02
    decision: Web Audio API for sound effects
    rationale: Native API, no dependencies, lazy-load pattern for autoplay safety
  - id: MENU-03
    decision: CartItem integration via menuItemId lookup
    rationale: Match existing cart-store.ts structure without refactoring
metrics:
  duration: 12min
  completed: 2026-01-24
---

# Phase 18 Plan 01: UnifiedMenuItemCard Component Summary

Glassmorphism menu card with 3D tilt effect, state-machine add button, and Web Audio click sounds.

## What Was Built

### Core Component
- **UnifiedMenuItemCard**: Main component with 3 variants (menu, homepage, cart)
- **3D tilt effect**: 18-degree max rotation using useMotionValue/useSpring/useTransform
- **Shine overlay**: Moving light effect that follows mouse during hover
- **Scale on hover**: 1.03x with spring animation

### Sub-components
- **GlassOverlay**: Glassmorphism surface with 20px blur and hover border glow
- **CardImage**: Image with parallax effect (+-10px) and shine overlay
- **CardContent**: Typography hierarchy (name, Burmese name, description, price)
- **AddButton**: 3-state machine (idle -> adding -> quantity) with fly animation
- **DietaryBadges**: Icons with text labels for veg/vegan/spicy/popular/featured

### Utilities
- **glass-menu-card CSS class**: 75% opacity, 20px blur, hover enhancement to 24px
- **useCardSound hook**: Web Audio API with lazy-load and autoplay safety

## Key Patterns

### 3D Tilt Implementation
```typescript
const mouseX = useMotionValue(0.5);
const mouseY = useMotionValue(0.5);
const rotateX = useSpring(
  useTransform(mouseY, [0, 1], [18, -18]),
  { stiffness: 150, damping: 15 }
);
```

### State Machine Button
```typescript
type ButtonState = "idle" | "adding" | "quantity";
// idle: Add button -> adding: Checkmark animation -> quantity: +/- controls
```

### Mobile Tilt
- Long-press (300ms) enables tilt play mode
- Touch move updates mouse position values
- Haptic feedback on mode activation

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes (0 errors, 1 pre-existing warning)
- [x] UnifiedMenuItemCard exports from index.ts
- [x] glass-menu-card CSS utility in globals.css
- [x] 3D tilt with rotateX/rotateY transforms
- [x] AddButton state machine (idle/adding/quantity)
- [x] DietaryBadges with icons AND text

## Next Phase Readiness

Ready for 18-02:
- UnifiedMenuItemCard component complete and functional
- All sub-components exported for potential reuse
- Cart integration working with existing cart-store
- Sound effects and haptics implemented
- Reduced motion preference respected via useAnimationPreference

## Commits

| Hash | Message |
|------|---------|
| abf212a | feat(18-01): add glassmorphism CSS utility and component structure |
| 55ebf32 | feat(18-01): add 3D tilt sub-components and dietary badges |
| dd5ce0e | feat(18-01): add AddButton state machine and main UnifiedMenuItemCard |

---

*Completed: 2026-01-24*
