# Phase 22: Customer Page Polish - Research

**Researched:** 2026-01-26
**Domain:** Customer-facing page animations, glassmorphism, View Transitions API
**Confidence:** HIGH

## Summary

Phase 22 polishes all customer-facing pages (Menu, Checkout, Order History, Account, Cart) with engaging, cohesive playful animations. The codebase already has a mature animation system built on Framer Motion 12.26.1 with comprehensive motion tokens, stagger utilities, spring presets, and accessibility support via `useAnimationPreference`. The primary work involves applying existing patterns consistently across pages and implementing the specific enhancements requested in CONTEXT.md.

Key infrastructure already exists:
- **Motion tokens:** `src/lib/motion-tokens.ts` with V7 springs (snappyButton, bouncyToggle, rubbery)
- **AnimatedSection:** Scroll-triggered reveal with `viewport.once: false` for replay
- **Glassmorphism:** `.glass-menu-card` class (75% opacity, 20px blur, 24px on hover)
- **BrandedSpinner:** Morning Star themed spinner in sm/md/lg/xl sizes
- **Confetti/SuccessCheckmark:** Celebration components for order confirmation
- **Sound effects:** Web Audio API integration via `use-card-sound.ts` and `theme-sounds.ts`

**Primary recommendation:** Extend existing components rather than creating new animation infrastructure. Focus on consistent application of the 80ms stagger, 25% viewport trigger, replay-on-scroll, and colorful gradient enhancements.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.26.1 | Animation engine | Already in use, supports springs, layout animations, AnimatePresence |
| next | 16.1.2 | Framework with View Transitions | Experimental `viewTransition` flag for page navigation |
| tailwindcss | ^4 | CSS utilities | Glassmorphism, gradients, responsive design |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.562.0 | Icons | Page-specific icons for empty states |
| clsx + tailwind-merge | ^2.1.1 / ^3.4.0 | Class composition | Conditional glassmorphism, gradient classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion | GSAP (already installed) | GSAP better for complex sequences, but Framer Motion already deeply integrated |
| CSS `view-transition` | next-view-transitions lib | Native Next.js 16 has experimental support, prefer that |

**Installation:**
No new packages needed. All required libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    motion-tokens.ts         # V7 springs, variants, stagger utils (exists)
    animations/variants.ts   # Shared animation variants (exists)
    hooks/
      useAnimationPreference.ts  # Reduced motion support (exists)
      useThemeTransition.ts      # View Transitions for theme (exists)
      usePageTransition.ts       # NEW: Page navigation transitions
  components/
    scroll/
      AnimatedSection.tsx    # Scroll reveal wrapper (exists, update viewport)
    ui/
      branded-spinner.tsx    # Loading spinner (exists)
      Confetti.tsx           # Celebration particles (exists)
      success-checkmark.tsx  # Animated checkmark (exists)
      EmptyState.tsx         # Empty states (exists, add page variants)
      ErrorShake.tsx         # NEW: Validation error animation
    page-animations/         # NEW: Page-specific animation wrappers
      MenuPageAnimations.tsx
      CheckoutAnimations.tsx
      OrderHistoryAnimations.tsx
      AccountAnimations.tsx
```

### Pattern 1: Section Stagger with 80ms Gaps
**What:** Individual items within sections stagger at 80ms intervals
**When to use:** Menu items, order cards, account sections, checkout fields
**Example:**
```typescript
// Source: CONTEXT.md decisions
const staggerContainer = (gap = 0.08, delay = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: gap,  // 80ms per CONTEXT
      delayChildren: delay,
    },
  },
});

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.default,
  },
};
```

### Pattern 2: Early Viewport Trigger with Replay
**What:** Animations trigger at 25% visibility and replay on re-enter
**When to use:** All scroll-triggered section reveals
**Example:**
```typescript
// Source: CONTEXT.md decisions
<motion.section
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{
    once: false,  // Replay on re-enter
    amount: 0.25, // Trigger at 25% visible
    margin: "-50px",
  }}
>
```

### Pattern 3: Mixed Direction by Element Type
**What:** Cards fade up, buttons scale in, text fades in place
**When to use:** Entry choreography per CONTEXT decisions
**Example:**
```typescript
// Source: CONTEXT.md decisions
const cardEntry: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const buttonEntry: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

const textEntry: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};
```

### Pattern 4: Checkout Step Transitions
**What:** Slide + fade + scale morph + glow effect with reverse direction
**When to use:** CheckoutWizard step navigation
**Example:**
```typescript
// Source: CONTEXT.md decisions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,  // Right for forward, left for back
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    boxShadow: "0 0 30px rgba(164, 16, 52, 0.1)",  // Glow
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,  // Reverse direction
    opacity: 0,
    scale: 0.95,
  }),
};
```

### Anti-Patterns to Avoid
- **Animating everything at once:** Use stagger, not simultaneous entry
- **Fixed durations everywhere:** Use springs for physics-based motion
- **Ignoring reduced motion:** Always check `useAnimationPreference().shouldAnimate`
- **Hard-coding values:** Use motion tokens from `src/lib/motion-tokens.ts`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-triggered reveal | Custom IntersectionObserver | `AnimatedSection` + `whileInView` | Already handles viewport, replay, stagger |
| Celebration burst | Custom particle system | `Confetti` + `SuccessCheckmark` | Tested, respects reduced motion |
| Loading states | Custom spinner | `BrandedSpinner` | Brand-aligned, accessible |
| Empty states | Ad-hoc components | `EmptyState` variants | Consistent styling, animated |
| Form validation shake | CSS keyframes | Create `ErrorShake` component | Reusable, composable with glow |
| Spring physics | Manual easing | `spring.*` from motion-tokens | Tuned presets (snappyButton, rubbery) |
| Stagger delays | Manual delay calculation | `staggerContainer()` function | Handles edge cases |

**Key insight:** The codebase has extensive animation infrastructure. The work is applying it consistently, not building new systems.

## Common Pitfalls

### Pitfall 1: Layout Animation Performance
**What goes wrong:** Animating layout properties (width, height, position) causes jank
**Why it happens:** Layout triggers browser reflow on every frame
**How to avoid:** Use transform-based animations; if layout needed, use Framer Motion's `layout` prop which optimizes via FLIP
**Warning signs:** Choppy animations, high CPU during transitions

### Pitfall 2: AnimatePresence Without Keys
**What goes wrong:** Exit animations don't play, items disappear instantly
**Why it happens:** AnimatePresence requires unique keys to track items
**How to avoid:** Always provide stable, unique `key` prop to direct children of AnimatePresence
**Warning signs:** Missing exit animations, console warnings

### Pitfall 3: View Transitions API Browser Support
**What goes wrong:** Page transitions break in Safari/Firefox
**Why it happens:** View Transitions API has limited support (Chrome 111+, Safari 18+, no Firefox)
**How to avoid:** Feature detection with `document.startViewTransition` fallback; already implemented in `useThemeTransition.ts`
**Warning signs:** Blank screens during navigation in unsupported browsers

### Pitfall 4: Stagger Overflow on Large Lists
**What goes wrong:** Long lists take too long to fully animate
**Why it happens:** 50 items x 80ms = 4 seconds total animation time
**How to avoid:** Cap maximum delay with `Math.min(index * 0.08, 0.5)` (500ms max)
**Warning signs:** Users scroll past content before it finishes animating

### Pitfall 5: Glassmorphism Performance
**What goes wrong:** Blurry cards cause lag on low-end devices
**Why it happens:** `backdrop-filter: blur()` is GPU-intensive
**How to avoid:** Use will-change sparingly; reduce blur on mobile; respect `useAnimationPreference`
**Warning signs:** Battery drain, hot devices, choppy scroll

## Code Examples

Verified patterns from existing codebase:

### Spring Presets (Existing)
```typescript
// Source: src/lib/motion-tokens.ts
export const spring = {
  snappyButton: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.8,
  },
  bouncyToggle: {
    type: "spring" as const,
    stiffness: 400,
    damping: 12,
    mass: 0.9,
  },
  rubbery: {
    type: "spring" as const,
    stiffness: 350,
    damping: 8,
    mass: 1,
  },
};
```

### Animated Section (Existing)
```typescript
// Source: src/components/scroll/AnimatedSection.tsx
<MotionComponent
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{
    once: false,  // Always replay per CONTEXT decision
    amount: 0.5,  // Update to 0.25 per CONTEXT
  }}
>
  {children}
</MotionComponent>
```

### Glassmorphism CSS (Existing)
```css
/* Source: src/app/globals.css */
.glass-menu-card {
  background: color-mix(in srgb, var(--color-surface-primary) 75%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-subtle);
}

.glass-menu-card:hover {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}
```

### View Transitions (Existing Pattern)
```typescript
// Source: src/lib/hooks/useThemeTransition.ts
// Adapt this pattern for page navigation
if (!document.startViewTransition || prefersReducedMotion) {
  toggleFn();  // Fallback: instant transition
  return;
}

const transition = document.startViewTransition(() => {
  toggleFn();
});
```

### Celebration Animation (Existing)
```typescript
// Source: src/components/orders/OrderConfirmationV8.tsx
const { trigger, Confetti: ConfettiComponent } = useConfetti();

useEffect(() => {
  if (shouldAnimate) {
    trigger();
  }
}, []);

// Render confetti overlay
<ConfettiComponent particleCount={30} duration={2.5} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion | Motion (rebranded) | Feb 2025 | Import paths may change; current version still framer-motion |
| CSS transitions | View Transitions API | 2024-2026 | Native browser support for page transitions |
| Fixed easings | Physics-based springs | Ongoing | More natural, responsive animations |
| FLIP manually | `layout` prop | Framer Motion 4+ | Automatic layout animation optimization |

**Deprecated/outdated:**
- **staggerDirection: -1**: Still valid but consider `from: "last"` in stagger() function
- **viewport.once: true**: CONTEXT explicitly requires `once: false` for engaging replay

## Implementation Specifics per CONTEXT.md

### Animation Intensity (Bold Playful)
- Max 300ms duration for entry effects (use springs, they settle quickly)
- Reuse Phase 20 sound effects via `use-card-sound.ts`
- Bold BrandedSpinner (use `size="lg"` or `size="xl"`)
- Full ErrorShake: shake + red pulse overlay (needs creation)

### Entry Choreography
- 80ms stagger gaps (update from current 50ms in AnimatedSection)
- 25% viewport trigger (update from current 50% in AnimatedSection)
- `viewport.once: false` (already configured)
- Menu items stagger individually (not by row)

### Page Personalities (from CONTEXT.md)
| Page | Personality | Unique Touches |
|------|-------------|----------------|
| Menu | Playful discovery | Category delight animations, hover reveals |
| Checkout | Celebratory journey | Step progress glow, completion burst |
| Account | Match menu playfulness | Section reveals, profile animations |
| Order History | Proud collection | Order cards as achievements |

### Glassmorphism Enhancement
- Increase blur to 30px+ (currently 20px base)
- Dynamic opacity on hover/focus
- Colored glass tints based on theme
- Apply to: menu cards, order cards, account sections, checkout panels

### Colorful Gradients
- Gradient glow on hover states
- Theme-adaptive colors (Claude's discretion per CONTEXT)
- Apply to shadows and highlights

## Open Questions

Things that couldn't be fully resolved:

1. **Next.js 16 View Transitions experimental flag**
   - What we know: `viewTransition` flag exists, needs enabling in next.config.js
   - What's unclear: Exact integration with App Router navigation, Suspense boundaries
   - Recommendation: Enable experimentally, implement with fallback, test thoroughly

2. **Account page location**
   - What we know: No `/account` page found in codebase
   - What's unclear: Whether it exists under different path or needs creation
   - Recommendation: Check with user; may need to create from scratch

3. **Gradient color palette**
   - What we know: CONTEXT marks as "Claude's discretion"
   - What's unclear: Exact brand colors, theme-adaptive strategy
   - Recommendation: Use existing brand colors (primary red #A41034), warm amber tones, adapt for dark mode

## Sources

### Primary (HIGH confidence)
- Codebase files: `src/lib/motion-tokens.ts`, `src/lib/motion.ts`, `src/lib/animations/variants.ts`
- Codebase files: `src/components/scroll/AnimatedSection.tsx`, `src/components/ui/Confetti.tsx`
- Codebase files: `src/app/globals.css` (glassmorphism classes)
- [Framer Motion Official Docs - Stagger](https://www.framer.com/motion/stagger/)
- [Framer Motion Official Docs - Layout Animations](https://www.framer.com/motion/layout-animations/)
- [Next.js Config - viewTransition](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition)

### Secondary (MEDIUM confidence)
- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Everything about Framer Motion layout animations - Maxime Heckel](https://blog.maximeheckel.com/posts/framer-motion-layout-animations/)
- [Effortless React List Animations with AnimatePresence](https://medium.com/@triplem656/effortless-react-list-animations-a-guide-to-framer-motions-animatepresence-27a9cea4d058)

### Tertiary (LOW confidence)
- [Dark Glassmorphism 2026 Trends](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Glassmorphism Best Practices](https://uxpilot.ai/blogs/glassmorphism-ui)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and extensively used
- Architecture: HIGH - Patterns derived from existing codebase implementation
- Pitfalls: HIGH - Based on actual Framer Motion documentation and common issues
- Page personalities: MEDIUM - Based on CONTEXT.md decisions, implementation details TBD

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable stack, well-documented)
