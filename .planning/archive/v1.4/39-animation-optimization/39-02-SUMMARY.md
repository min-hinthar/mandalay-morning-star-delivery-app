---
phase: 39-animation-optimization
plan: 02
subsystem: animation
tags: [gsap, framer-motion, parallax, performance, willChange]

depends:
  requires:
    - 39-01 (Device capability detection with AnimationProvider)
  provides:
    - Device-aware parallax animations
    - GSAP/Framer Motion conflict detection
    - willChange optimization for Drawer/Modal
  affects:
    - Any component using ParallaxLayer
    - Hero section parallax behavior
    - Drawer and Modal performance

tech-stack:
  added: []
  patterns:
    - useAnimationContextSafe for device-aware animation control
    - onAnimationStart/onAnimationComplete for willChange lifecycle
    - Dev-mode conflict detection via GSAP plugin

files:
  key-files:
    created:
      - src/lib/gsap/conflict-detector.ts
    modified:
      - src/components/ui/scroll/ParallaxLayer.tsx
      - src/components/ui/homepage/Hero.tsx
      - src/lib/gsap/index.ts
      - src/components/ui/Drawer.tsx
      - src/components/ui/Modal.tsx

decisions:
  - id: parallax-context-hook
    summary: Use useAnimationContextSafe for ParallaxLayer and Hero
    rationale: Safe hook returns defaults outside provider, isParallaxEnabled combines device + preference
  - id: hero-conditional-parallax
    summary: Conditional useTransform ranges for Hero parallax
    rationale: Returns ["0%", "0%"] when disabled - no movement but keeps spring wrappers
  - id: conflict-detector-plugin
    summary: GSAP plugin init hook for automatic target tracking
    rationale: Tracks all GSAP targets automatically without manual instrumentation
  - id: willchange-lifecycle
    summary: willChange via onAnimationStart/onAnimationComplete callbacks
    rationale: Apply during animation only, set to "auto" when static to free compositor layer
  - id: flytocart-element-removal
    summary: FlyToCart already correct - element removal frees layer
    rationale: Element is removed from DOM on animation complete, no willChange cleanup needed

metrics:
  duration: 21 minutes
  completed: 2026-02-05
---

# Phase 39 Plan 02: Animation Tier Application Summary

Device-aware parallax with conflict detection and willChange optimization for performance.

## Tasks Completed

| #   | Task                                              | Commit           | Key Files                           |
| --- | ------------------------------------------------- | ---------------- | ----------------------------------- |
| 1   | Update ParallaxLayer to use AnimationContext      | a640b2c          | ParallaxLayer.tsx                   |
| 2   | Update Hero parallax to respect device capability | 2f2e979          | Hero.tsx                            |
| 3   | Create GSAP/Framer Motion conflict detector       | 151e6f8          | conflict-detector.ts, gsap/index.ts |
| 4   | Apply willChange optimization to Drawer/Modal     | 6db024a, 0295fcf | Drawer.tsx, Modal.tsx               |

## Implementation Details

### Task 1: ParallaxLayer Device Awareness

**Before:**

```tsx
const { shouldAnimate } = useAnimationPreference();
if (!shouldAnimate || !containerRef.current || !elementRef.current) return;
```

**After:**

```tsx
const { isParallaxEnabled } = useAnimationContextSafe();
if (!isParallaxEnabled || !containerRef.current || !elementRef.current) return;
```

`isParallaxEnabled` combines:

- Device tier (low = disabled)
- User reduced motion preference
- System prefers-reduced-motion
- User animation preference

### Task 2: Hero Conditional Parallax

Updated useTransform calls to return static values when parallax disabled:

```tsx
const orbsFarY = useTransform(
  scrollYProgress,
  [0, 1],
  isParallaxEnabled ? ["0%", `${parallaxPresets.far.speedFactor * 100}%`] : ["0%", "0%"]
);
```

**Key insight:** Spring wrappers stay (useSpring) - they just smooth static "0%" values. No code path divergence needed.

### Task 3: Conflict Detector

Created `src/lib/gsap/conflict-detector.ts`:

```typescript
// Tracks GSAP targets via plugin init hook
export function initConflictDetector(gsapInstance) {
  if (!isDev) return;
  gsapInstance.registerPlugin({
    name: "conflictDetector",
    init(target) {
      trackGsapTarget(target);
      return true;
    },
  });
}

// Manual tracking for Framer Motion elements
export function trackFramerMotionElement(element) {
  if (gsapTargets.has(element)) {
    warnConflict(element, "framer-motion");
  }
}
```

**Dev-only:** `process.env.NODE_ENV === "development"` check prevents production bundle impact.

### Task 4: willChange Optimization (ANIM-09)

Applied to Drawer and Modal via Framer Motion callbacks:

```tsx
const handleAnimationStart = useCallback(() => {
  if (ref.current) {
    ref.current.style.willChange = "transform";
  }
}, []);

const handleAnimationComplete = useCallback(() => {
  if (ref.current) {
    ref.current.style.willChange = "auto";
  }
}, []);

// On motion.div:
onAnimationStart = { handleAnimationStart };
onAnimationComplete = { handleAnimationComplete };
```

**FlyToCart:** Already optimized - element is removed from DOM on animation complete, which automatically frees the compositor layer. No changes needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed unused 'get' parameter in cart-animation-store.ts**

- **Found during:** Task 1
- **Issue:** TypeScript error TS6133: 'get' is declared but its value is never read
- **Fix:** Changed `create<CartAnimationStore>((set, get) => ({` to `create<CartAnimationStore>((set) => ({`
- **Files modified:** src/lib/stores/cart-animation-store.ts
- **Commit:** a640b2c

**2. [Rule 3 - Blocking] Added eslint-disable for max-lines in Hero.tsx and Modal.tsx**

- **Found during:** Tasks 2, 4
- **Issue:** Pre-commit hook failed due to max-warnings=0 and max-lines warnings
- **Fix:** Added `/* eslint-disable max-lines -- [explanation] */` per project decision 37-02
- **Commits:** 2f2e979, 6db024a

## Verification Results

| Check                         | Result                                                  |
| ----------------------------- | ------------------------------------------------------- |
| `pnpm typecheck`              | Pass                                                    |
| `pnpm lint`                   | Pass (warnings only - pre-existing max-lines)           |
| `pnpm build`                  | Pass                                                    |
| ParallaxLayer uses context    | `grep -q "useAnimationContextSafe"` - Yes               |
| Hero uses isParallaxEnabled   | `grep -q "isParallaxEnabled"` - 4 matches               |
| Conflict detector initialized | `grep -q "initConflictDetector"` in gsap/index.ts - Yes |
| willChange in Drawer          | `grep -q "willChange"` - 3 matches                      |
| willChange in Modal           | `grep -q "willChange"` - 3 matches                      |

## Success Criteria Verification

| Criterion                                           | Status                                  |
| --------------------------------------------------- | --------------------------------------- |
| ParallaxLayer uses AnimationContext                 | Done                                    |
| Hero parallax disabled on low-power devices         | Done                                    |
| Hero floating emojis, stagger, opacity still work   | Done (not affected by parallax changes) |
| Conflict detector warns in dev mode                 | Done                                    |
| No production bundle size impact                    | Done (dev-only code)                    |
| willChange:transform applied only during animations | Done                                    |
| willChange set to "auto" on animation complete      | Done                                    |

## Next Phase Readiness

**Phase 39 Plan 03:** Needs to be created if more animation optimization tasks remain.

**Integration points:**

- AnimationProvider context available app-wide
- Conflict detector active in development
- willChange optimization pattern established for other components

## Technical Notes

1. **useAnimationContextSafe vs useAnimationContext:** Safe version returns defaults when used outside provider - important for shared components.

2. **Framer Motion onAnimationStart/onAnimationComplete:** These fire for all variant transitions, including initial render. The willChange optimization handles this correctly - setting transform on any animation start, auto on complete.

3. **Conflict detector WeakSet:** Uses WeakSet to avoid memory leaks - elements are automatically removed when garbage collected.

4. **Hero parallax opacity unchanged:** The opacity transform is NOT disabled on low-power devices - it's not considered parallax, just scroll-linked fade. This matches user expectation for scroll feedback.
