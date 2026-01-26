# Phase 20: Micro-interactions - Research

**Researched:** 2026-01-25
**Domain:** Framer Motion micro-interactions, spring physics, SVG animations
**Confidence:** HIGH

## Summary

This phase enhances interactive elements with delightful, consistent micro-animations. The codebase already has:
- **Comprehensive motion token system** (`motion-tokens.ts`) with spring presets, variants, hover effects
- **Micro-interactions library** (`micro-interactions.ts`) with button, card, toggle, shake variants
- **Working implementations** of FavoriteButton (particle burst), PriceTicker (digit flip), QuantitySelector (flip), Skeleton (shimmer), SuccessCheckmark (path draw), FlyToCart (GSAP arc), CartItemV8 (swipe-to-delete)

The main work involves: (1) extending existing tokens per CONTEXT.md decisions, (2) creating new specialized animations (branded spinner, flip counter variant), (3) applying consistent animations to all buttons/inputs/toggles, and (4) adding sound effects for key interactions.

**Primary recommendation:** Extend `motion-tokens.ts` with new spring configs ("snappy" and "bouncy") and create reusable animation components that wrap existing UI primitives.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.26.1 | Animation library | Already used, spring physics, variants API |
| gsap | Installed | Complex path animations | Used by FlyToCart for bezier curves |
| lucide-react | Installed | Icons (Heart, Check, etc.) | Already used throughout |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-sound | ^4.0.3 | Sound effects | Add-to-cart, success, error sounds |
| @radix-ui/react-toggle | ^1.1.0 | Toggle primitive | Base for animated toggle switches |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion | React Spring | Framer already established, no need to switch |
| use-sound | Howler.js | use-sound simpler, Howler for complex audio |
| Custom particles | canvas-confetti | Already have Confetti component, extend it |

**Installation:**
```bash
pnpm add use-sound
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── motion-tokens.ts          # EXTEND: Add snappy/bouncy springs
│   ├── micro-interactions.ts     # EXTEND: Add new variants
│   └── sounds/                   # NEW: Sound effects manager
│       ├── audio-manager.ts      # Sound playback with preferences
│       └── sounds/               # MP3/WAV files
├── components/
│   ├── ui/
│   │   ├── button.tsx            # MODIFY: Add motion wrapper
│   │   ├── input.tsx             # MODIFY: Add focus glow animation
│   │   ├── checkbox.tsx          # MODIFY: Add check draw animation
│   │   └── BrandedSpinner.tsx    # NEW: Morning Star logo spinner
│   └── micro/                    # NEW: Specialized micro-interaction components
│       ├── AnimatedButton.tsx    # Button with depth effect
│       ├── AnimatedInput.tsx     # Input with contextual glow
│       ├── AnimatedToggle.tsx    # Toggle with spring overshoot
│       ├── FlipCounter.tsx       # Airport board flip counter
│       └── ShakeContainer.tsx    # Error shake wrapper
```

### Pattern 1: Composition over Modification
**What:** Create animated wrapper components instead of modifying base components
**When to use:** Adding complex animations to existing primitives
**Example:**
```typescript
// Instead of modifying button.tsx, create AnimatedButton.tsx
import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";

export function AnimatedButton({ children, ...props }: ButtonProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97, y: 0, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
      transition={spring.snappy}
    >
      <Button {...props}>{children}</Button>
    </motion.div>
  );
}
```

### Pattern 2: Animation Preference Integration
**What:** All animations must respect useAnimationPreference hook
**When to use:** Every animated component
**Example:**
```typescript
export function AnimatedToggle({ checked, onChange }: Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const springConfig = getSpring(spring.bouncy);

  return (
    <motion.div
      animate={checked ? "on" : "off"}
      variants={shouldAnimate ? toggleKnobVariants : undefined}
      transition={springConfig}
    >
      {/* ... */}
    </motion.div>
  );
}
```

### Pattern 3: Sound Effect Integration
**What:** Use a centralized audio manager that respects preferences
**When to use:** Add-to-cart, success, error feedback
**Example:**
```typescript
// lib/sounds/audio-manager.ts
import { getAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const sounds = {
  addToCart: "/sounds/pop.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
};

export function playSound(key: keyof typeof sounds) {
  if (getAnimationPreference() === "none") return;
  if (typeof Audio === "undefined") return;

  const audio = new Audio(sounds[key]);
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignore autoplay errors
}
```

### Anti-Patterns to Avoid
- **Over-animating:** Don't animate every state change; reserve for intentional interactions
- **Blocking animations:** Never block user input waiting for animation to complete
- **Ignoring preferences:** All animations MUST check useAnimationPreference
- **Inline spring configs:** Use motion-tokens.ts springs, never inline { type: "spring", ... }

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shake animation | Custom keyframes | `shakeVariants` in micro-interactions.ts | Already tested, accessible |
| Confetti particles | Canvas from scratch | Existing `Confetti` component | GPU-optimized, configurable |
| Success checkmark | Simple icon swap | `SuccessCheckmark` component | Path draw animation, reduced motion |
| Price animation | Number interpolation | `PriceTicker` component | Digit-by-digit, direction-aware |
| Swipe to delete | Touch handlers | `useSwipeToDelete` hook | Velocity-aware, haptic feedback |
| Fly to cart | Position tweening | `useFlyToCart` hook | GSAP bezier, portal-rendered |
| Skeleton shimmer | CSS animation | `Skeleton` component | Multiple variants, grain overlay |

**Key insight:** The codebase has mature animation infrastructure. The work is extending/applying patterns, not inventing new ones.

## Common Pitfalls

### Pitfall 1: Spring Config Chaos
**What goes wrong:** Different springs scattered across components create inconsistent feel
**Why it happens:** Developers tune springs per-component instead of using tokens
**How to avoid:** ONLY use springs from motion-tokens.ts. Add new presets there.
**Warning signs:** Inline `{ type: "spring", stiffness: X }` objects in components

### Pitfall 2: Reduced Motion Breaks
**What goes wrong:** Animations play regardless of user preference
**Why it happens:** Forgetting to wrap animations in shouldAnimate check
**How to avoid:** Pattern: `variants={shouldAnimate ? myVariants : undefined}`
**Warning signs:** Motion without useAnimationPreference import

### Pitfall 3: Sound Autoplay Failures
**What goes wrong:** Sounds don't play on mobile, errors in console
**Why it happens:** Browsers require user gesture before audio playback
**How to avoid:** Always wrap audio.play() in .catch(), only play after click
**Warning signs:** Uncaught DOMException in console about autoplay

### Pitfall 4: Layout Thrashing from Scale
**What goes wrong:** Adjacent elements jump when animated element scales
**Why it happens:** Scale affects layout box
**How to avoid:** Use `transform: scale()` inside fixed-size container
**Warning signs:** Neighboring elements "jitter" during hover

### Pitfall 5: Z-Index Battles
**What goes wrong:** Animated elements appear behind other UI
**Why it happens:** Creating stacking contexts without proper z-index
**How to avoid:** Use z-index tokens from design-system/tokens/z-index.ts
**Warning signs:** Animations clipped or hidden during play

## Code Examples

Verified patterns from existing codebase:

### Button Depth Effect (CONTEXT.md: shadow reduction + scale)
```typescript
// Source: motion-tokens.ts hover patterns + CONTEXT.md decisions
const buttonDepthVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.03,
    y: -2,
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
    transition: spring.snappy,
  },
  tap: {
    scale: 0.97,
    y: 0,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.1 },
  },
};
```

### Input Focus Glow with Contextual Colors
```typescript
// Source: CONTEXT.md decision - amber default, red error, green success
const focusGlowVariants = {
  idle: { boxShadow: "0 0 0 0px transparent" },
  focus: (color: string) => ({
    boxShadow: `0 0 0 4px ${color}33`, // 20% opacity
    transition: spring.gentle,
  }),
};

// Usage: color derived from validation state
const glowColor = state === "error" ? "#ef4444" : state === "success" ? "#22c55e" : "#f59e0b";
```

### Toggle Switch with Spring Overshoot
```typescript
// Source: CONTEXT.md decision + existing toggleKnobVariants
const toggleKnobVariants = {
  off: { x: 2, transition: spring.bouncy },
  on: { x: 22, transition: spring.bouncy }, // Overshoots then settles
};

// spring.bouncy config (to add to motion-tokens.ts):
const bouncy = {
  type: "spring",
  stiffness: 400,
  damping: 15, // Lower damping = more overshoot
  mass: 0.8,
};
```

### Flip Counter Animation (CONTEXT.md: airport departure board style)
```typescript
// Source: PriceTicker pattern adapted for flip effect
const flipDigitVariants = {
  enter: (direction: number) => ({
    rotateX: direction > 0 ? -90 : 90,
    opacity: 0,
    transition: { duration: 0 },
  }),
  center: {
    rotateX: 0,
    opacity: 1,
    transition: spring.snappy,
  },
  exit: (direction: number) => ({
    rotateX: direction > 0 ? 90 : -90,
    opacity: 0,
    transition: spring.snappy,
  }),
};

// Container needs perspective
<div style={{ perspective: 300 }}>
  <AnimatePresence mode="popLayout" custom={direction}>
    <motion.span key={value} variants={flipDigitVariants} custom={direction}>
      {value}
    </motion.span>
  </AnimatePresence>
</div>
```

### Branded Spinner (Morning Star logo rotating/pulsing)
```typescript
// Source: CONTEXT.md decision
export function BrandedSpinner({ size = 40 }: { size?: number }) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={shouldAnimate ? { rotate: 360 } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      {/* Morning Star logo SVG */}
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <motion.circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          animate={shouldAnimate ? { pathLength: [0.3, 0.8, 0.3] } : undefined}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Star in center */}
        <motion.path
          d="M24 8l4 12h12l-10 7 4 12-10-7-10 7 4-12-10-7h12z"
          fill="currentColor"
          animate={shouldAnimate ? { scale: [0.9, 1.1, 0.9] } : undefined}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
```

### Error Shake + Pulse Combination
```typescript
// Source: shakeVariants in micro-interactions.ts + CONTEXT.md
const shakeAndPulseVariants = {
  shake: {
    x: [-8, 8, -8, 8, -4, 4, 0],
    backgroundColor: [
      "transparent",
      "rgba(239, 68, 68, 0.1)", // red-500/10
      "transparent",
    ],
    transition: {
      x: { duration: 0.4, ease: "easeOut" },
      backgroundColor: { duration: 0.6, ease: "easeOut" },
    },
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS keyframes | Framer Motion variants | Phase 15 | Consistent spring physics |
| Inline spring configs | motion-tokens.ts presets | Phase 15 | Centralized tuning |
| No sound effects | Sound on key actions | Phase 20 | Enhanced feedback |
| Basic loading spinners | Branded spinner | Phase 20 | Brand consistency |

**Deprecated/outdated:**
- V3/V5 animation patterns: Use V7 motion-tokens.ts exclusively
- `useReducedMotion` from Framer: Use `useAnimationPreference` hook instead
- Inline Transition objects: Always reference token presets

## Open Questions

Things that couldn't be fully resolved:

1. **Morning Star Logo SVG**
   - What we know: Logo exists at /public/logo.png
   - What's unclear: Need SVG version for path animation
   - Recommendation: Convert PNG to SVG or create simplified star icon

2. **Sound Effect Files**
   - What we know: CONTEXT.md specifies sounds for add-to-cart, success, error
   - What's unclear: No .mp3/.wav files exist in codebase
   - Recommendation: Source royalty-free sound effects or use Web Audio API synthesis

3. **Tab Switching Animation**
   - What we know: CONTEXT.md says "sliding indicator + content crossfade"
   - What's unclear: Which tab components need this treatment
   - Recommendation: Audit menu/admin pages for tab usage during planning

## Sources

### Primary (HIGH confidence)
- Existing codebase: `motion-tokens.ts`, `micro-interactions.ts`, `swipe-gestures.ts`
- Existing components: FavoriteButton, PriceTicker, QuantitySelector, Skeleton, CartItemV8
- Framer Motion docs (training data, verified against v12 patterns)

### Secondary (MEDIUM confidence)
- CONTEXT.md user decisions (locked constraints for this phase)
- Design system tokens (z-index, duration, spring configs)

### Tertiary (LOW confidence)
- use-sound library patterns (verify during implementation)
- Web Audio API for sound synthesis (fallback option)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used
- Architecture: HIGH - Extending established patterns
- Pitfalls: HIGH - Observed from existing code patterns
- Sound effects: MEDIUM - Library not yet integrated, patterns hypothetical

**Research date:** 2026-01-25
**Valid until:** 30 days (stable domain, mature libraries)
