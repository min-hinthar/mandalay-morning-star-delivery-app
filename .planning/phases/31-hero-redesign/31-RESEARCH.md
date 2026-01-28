# Phase 31: Hero Redesign - Research

**Researched:** 2026-01-28
**Domain:** Hero section animation, parallax, floating elements, theme-aware gradients
**Confidence:** HIGH

## Summary

The codebase has a mature animation infrastructure with both Framer Motion and GSAP available. The existing Hero.tsx in `src/components/ui/homepage/Hero.tsx` provides a solid foundation but needs significant redesign to meet CONTEXT.md requirements: floating emoji system, multi-layer parallax, theme-aware gradients with scroll animation, and removal of the BrandMascot.

Key infrastructure already exists:
- `parallaxPresets` in motion-tokens.ts with speed factors (0.1 background to 1.0 content)
- `float()` and `floatGentle()` functions for floating animations
- `useCanHover()` hook for touch/desktop detection
- Theme tokens with `--hero-gradient-*` CSS variables
- GSAP ScrollTrigger and Framer Motion `useScroll`/`useTransform` both available

**Primary recommendation:** Use Framer Motion for the core floating emoji system and parallax (consistent with existing Hero.tsx), with CSS-based theme transitions for gradient smoothness.

## Existing Implementation

### Current Hero.tsx Architecture

Location: `src/components/ui/homepage/Hero.tsx`

| Component | Purpose | Keep/Modify |
|-----------|---------|-------------|
| `Hero` | Main export, scroll tracking | MODIFY |
| `HeroContent` | Text, CTA, mascot, stats | MODIFY (remove mascot) |
| `GradientFallback` | Theme-aware gradient bg | REPLACE (new gradient system) |
| `AnimatedHeadline` | Staggered word reveal | KEEP |
| `StatItem` | Stats with motion | KEEP |

**Current patterns to preserve:**
```typescript
// Scroll-based parallax (already in place)
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end start"],
});
const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
```

**Code to remove:**
- `BrandMascot` import and usage
- `showMascot` prop and related rendering

### Current Gradient System

Uses CSS variables from `tokens.css`:
```css
/* Light mode */
--hero-gradient-start: #A41034;
--hero-gradient-mid: #5C0A1E;
--hero-gradient-end: #1a0a0f;

/* Dark mode */
--hero-gradient-start: #C41844;
--hero-gradient-mid: #6B0C24;
--hero-gradient-end: #1a0a0f;
```

**Note:** CONTEXT.md specifies different gradients:
- Light: Warm saffron-to-cream (not current red)
- Dark: Rich black-to-subtle saffron glow

Will need NEW tokens or override existing hero gradient tokens.

## Animation Infrastructure

### Framer Motion (Primary)

Already used throughout codebase. Key imports:
```typescript
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
```

**Spring presets available** (`src/lib/motion-tokens.ts`):
| Preset | Stiffness | Damping | Use Case |
|--------|-----------|---------|----------|
| `spring.floaty` | 100 | 10 | Dreamy, slow motion - PERFECT for emojis |
| `spring.gentle` | 200 | 25 | No overshoot |
| `spring.rubbery` | 350 | 8 | Stretchy feel |
| `spring.wobbly` | 250 | 6 | Pronounced wobble |

**Floating animation utilities** (already exist):
```typescript
// src/lib/motion-tokens.ts
export function float(index: number) {
  return {
    animate: { y: [0, -15, 0], rotate: [0, 3, 0], scale: [1, 1.02, 1] },
    transition: {
      duration: 5 + index * 0.7,
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.4,
    },
  };
}

export function floatGentle(index: number) {
  return {
    animate: { y: [0, -8, 0], rotate: [0, 1.5, 0] },
    transition: {
      duration: 6 + index * 0.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.3,
    },
  };
}
```

### Parallax Presets

`src/lib/motion-tokens.ts` provides speed factors for multi-layer parallax:
```typescript
export const parallaxPresets = {
  background: { speedFactor: 0.1 },  // Slowest
  far: { speedFactor: 0.25 },
  mid: { speedFactor: 0.4 },
  near: { speedFactor: 0.6 },
  foreground: { speedFactor: 0.8 },
  content: { speedFactor: 1.0 },     // 1:1 with scroll
} as const;
```

**CONTEXT.md requirement:** "1:1 smooth" parallax means direct proportion to scroll. Use these presets to create depth layers.

### GSAP (Secondary)

Available via `@/lib/gsap`:
```typescript
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { gsapDuration, gsapEase } from "@/lib/gsap/presets";
```

**ParallaxLayer component exists** (`src/components/ui/scroll/ParallaxLayer.tsx`) using GSAP ScrollTrigger. Could be used for gradient orbs if needed.

### Animation Preference Hook

**Critical:** Always check `shouldAnimate` before applying animations:
```typescript
const { shouldAnimate, getSpring } = useAnimationPreference();

// Use conditionally
animate={shouldAnimate ? { y: [0, -15, 0] } : undefined}
```

## Touch Detection

### useCanHover Hook

Location: `src/lib/hooks/useResponsive.ts`

```typescript
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
```

**CONTEXT.md requirements:**
- Desktop: Emojis shift away from cursor on hover
- Touch: Autonomous floating only (no gyro/tilt)

**Pattern to use:**
```typescript
const canHover = useCanHover();

// Apply mouse interaction only on hover-capable devices
onMouseMove={canHover ? handleMouseMove : undefined}
```

## Theme System

### Color Tokens Available

From `src/styles/tokens.css`:

**Light mode brand colors:**
| Token | Value | Use |
|-------|-------|-----|
| `--color-secondary` | #EBCD00 | Saffron yellow |
| `--color-secondary-hover` | #D4B800 | Darker saffron |
| `--color-accent-green` | #52A52E | Jade green |
| `--color-primary` | #A41034 | Ruby red |

**Dark mode brand colors:**
| Token | Value | Use |
|-------|-------|-----|
| `--color-secondary` | #FFE066 | Brighter saffron |
| `--color-primary` | #FF4D6D | Vibrant red |
| `--color-accent-green` | #6BD84B | Brighter jade |

### New Gradient Tokens Needed

Per CONTEXT.md, need new hero-specific gradients:

```css
/* Light mode - warm saffron to cream */
--hero-bg-start: var(--color-secondary);      /* Saffron */
--hero-bg-end: #FFFBF5;                        /* Warm cream */

/* Dark mode - black to saffron glow */
--hero-bg-start: #0a0a0a;                      /* Rich black */
--hero-bg-end: rgba(235, 205, 0, 0.15);        /* Subtle saffron glow */
```

### Theme Transition

Tokens.css includes theme transition:
```css
--theme-transition:
  background-color var(--duration-normal) var(--ease-in-out),
  border-color var(--duration-normal) var(--ease-in-out),
  color var(--duration-fast) var(--ease-in-out);
```

For smooth 300ms crossfade (per CONTEXT.md), use CSS transitions rather than JS animation:
```css
.hero-gradient {
  transition: background 300ms var(--ease-in-out);
}
```

## Parallax Approach

### Recommended Layer Structure

Per CONTEXT.md: 4+ layers with gradient base, orbs, emojis, text

| Layer | Content | Speed | Z-Index |
|-------|---------|-------|---------|
| 1 | Gradient background | 0 (static) | 0 |
| 2 | Background orbs (far) | 0.1 | 1 |
| 3 | Mid-distance orbs | 0.25-0.4 | 2 |
| 4 | Floating emojis (near) | 0.4-0.6 | 3 |
| 5 | Text + CTA | 0.8-1.0 | 4 |

### Implementation Pattern

```typescript
// Create parallax transforms for each layer
const { scrollYProgress } = useScroll({ target: containerRef });

const layer1Y = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);   // Orbs far
const layer2Y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);  // Orbs mid
const layer3Y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);  // Emojis
const layer4Y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);  // Text

// Apply with spring for smoothness
const smoothLayer1Y = useSpring(layer1Y, { stiffness: 100, damping: 30 });
```

## Floating Emoji System

### Architecture

```typescript
interface FloatingEmoji {
  id: string;
  emoji: string;
  size: 'sm' | 'md' | 'lg';  // For depth perception
  initialPosition: { x: number; y: number };
  animationType: 'drift' | 'spiral' | 'bob';
  depth: 'far' | 'mid' | 'near';  // Affects blur + opacity
}
```

### Emoji Set

Per CONTEXT.md: `['🍜', '🥟', '🍲', '🌶️']` - Burmese-themed

### Animation Variants

**Drift:**
```typescript
animate: {
  x: [startX, startX + 30, startX - 20, startX],
  y: [startY, startY - 40, startY - 20, startY],
}
```

**Spiral:**
```typescript
animate: {
  x: [0, 20, 0, -20, 0],
  y: [0, -15, -30, -15, 0],
  rotate: [0, 90, 180, 270, 360],
}
```

**Bob:**
```typescript
animate: {
  y: [0, -20, 0],
  scale: [1, 1.05, 1],
}
```

### Depth Effects

| Depth | Size | Blur | Opacity | Parallax Speed |
|-------|------|------|---------|----------------|
| far | 24-32px | 2px | 0.6 | 0.25 |
| mid | 36-48px | 0.5px | 0.8 | 0.4 |
| near | 52-64px | 0 | 1.0 | 0.6 |

### Edge Fading

Use CSS mask for gradient fade at boundaries:
```css
.emoji-container {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  -webkit-mask-image: /* same */;
}
```

### Mouse Interaction (Desktop Only)

```typescript
const handleMouseMove = (e: MouseEvent) => {
  if (!canHover) return;

  const rect = containerRef.current.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) / rect.width;
  const mouseY = (e.clientY - rect.top) / rect.height;

  // Emojis shift AWAY from cursor (repel effect)
  emojis.forEach(emoji => {
    const dx = emoji.x - mouseX;
    const dy = emoji.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const force = Math.max(0, 0.15 - distance) * 50;

    // Apply force in direction away from cursor
    emoji.offsetX = dx * force;
    emoji.offsetY = dy * force;
  });
};
```

## Gradient Orbs

### Implementation

Per CONTEXT.md: Radial gradients with soft glow/bloom effect

```typescript
const orbColors = {
  saffron: 'radial-gradient(circle, rgba(235, 205, 0, 0.4) 0%, transparent 70%)',
  jade: 'radial-gradient(circle, rgba(82, 165, 46, 0.3) 0%, transparent 70%)',
  ruby: 'radial-gradient(circle, rgba(164, 16, 52, 0.3) 0%, transparent 70%)',
};
```

### Dark Mode Enhancement

Per CONTEXT.md: Orbs brighter in dark mode
```css
.dark .orb {
  opacity: 0.5; /* vs 0.3 in light mode */
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parallax transforms | Custom scroll listener | Framer Motion `useScroll` + `useTransform` | Handles edge cases, RAF, cleanup |
| Touch detection | `ontouchstart` checks | `useCanHover()` hook | Media query-based, no false positives |
| Spring physics | Manual easing | `useSpring()` or spring presets | Physics-based, natural feel |
| Theme detection | CSS class checking | tokens.css variables + data-theme | Consistent with existing system |
| Animation preference | localStorage checks | `useAnimationPreference()` | Already handles hydration, persistence |

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with Random Values

**What goes wrong:** SSR renders different random emoji positions than client
**Why it happens:** `Math.random()` produces different values server vs client
**How to avoid:** Use seeded/deterministic positions, or only generate positions in useEffect
**Warning signs:** Console hydration errors, visual "jumps" on load

### Pitfall 2: Performance with Many Animating Elements

**What goes wrong:** 12-15 continuously animating emojis cause frame drops
**Why it happens:** Too many simultaneous animations, layout thrashing
**How to avoid:**
- Use `will-change: transform` on emoji elements
- Use CSS transforms only (not top/left)
- Consider CSS animations for simple float, Framer for scroll-linked
- Use `transform: translate3d()` to force GPU layer

### Pitfall 3: Theme Transition Flicker

**What goes wrong:** Visible flash when switching themes
**Why it happens:** Background gradient recalculates/re-renders
**How to avoid:** Use CSS transitions on background property, not JS animation
**Warning signs:** Jarring theme switches, elements momentarily disappearing

### Pitfall 4: Scroll-Linked Animation on Mobile

**What goes wrong:** Jank or delayed parallax on mobile Safari
**Why it happens:** Scroll events throttled differently on iOS
**How to avoid:** Use passive scroll listeners, reasonable scrub values (1-2)
**Warning signs:** Parallax "catching up" after scroll stops

### Pitfall 5: Emoji Not Respecting Reduced Motion

**What goes wrong:** Emojis animate even with reduced motion preference
**Why it happens:** Forgot to check `shouldAnimate`
**How to avoid:** Always wrap animation props with preference check
**Warning signs:** Accessibility complaints, failed a11y audit

## Code Examples

### Floating Emoji Component Pattern

```typescript
// Source: Based on existing HowItWorksSection.tsx patterns + CONTEXT.md requirements
interface FloatingEmojiProps {
  emoji: string;
  size: 'sm' | 'md' | 'lg';
  depth: 'far' | 'mid' | 'near';
  style: React.CSSProperties;
  parallaxY: MotionValue<string>;
}

function FloatingEmoji({ emoji, size, depth, style, parallaxY }: FloatingEmojiProps) {
  const { shouldAnimate } = useAnimationPreference();

  const sizeMap = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-5xl' };
  const blurMap = { far: 'blur-[2px]', mid: 'blur-[0.5px]', near: '' };
  const opacityMap = { far: 'opacity-60', mid: 'opacity-80', near: 'opacity-100' };

  return (
    <motion.span
      className={cn(
        sizeMap[size],
        blurMap[depth],
        opacityMap[depth],
        'absolute select-none pointer-events-none'
      )}
      style={{ ...style, y: parallaxY }}
      animate={shouldAnimate ? {
        y: [0, -20, 0],
        rotate: [0, 5, 0, -5, 0],
      } : undefined}
      transition={{
        duration: 5 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {emoji}
    </motion.span>
  );
}
```

### Gradient Orb Pattern

```typescript
// Source: Based on webgl/gradients.ts patterns
function GradientOrb({
  color,
  size,
  position,
  parallaxY
}: {
  color: 'saffron' | 'jade' | 'ruby';
  size: number;
  position: { x: string; y: string };
  parallaxY: MotionValue<string>;
}) {
  const colorMap = {
    saffron: 'from-secondary/40 to-transparent',
    jade: 'from-accent-green/30 to-transparent',
    ruby: 'from-primary/30 to-transparent',
  };

  return (
    <motion.div
      className={cn(
        'absolute rounded-full bg-radial',
        colorMap[color],
        'dark:opacity-50' // Brighter in dark mode
      )}
      style={{
        width: size,
        height: size,
        left: position.x,
        top: position.y,
        y: parallaxY,
        filter: 'blur(40px)', // Soft glow
      }}
    />
  );
}
```

### Mouse Repel Pattern

```typescript
// Source: CONTEXT.md requirement for mouse interaction
function useMouseRepel(containerRef: RefObject<HTMLElement>, emojis: Emoji[]) {
  const canHover = useCanHover();
  const [offsets, setOffsets] = useState<Map<string, {x: number, y: number}>>(new Map());

  useEffect(() => {
    if (!canHover || !containerRef.current) return;

    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;

      const newOffsets = new Map<string, {x: number, y: number}>();

      emojis.forEach(emoji => {
        const dx = emoji.normalizedX - mouseX;
        const dy = emoji.normalizedY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = Math.max(0, 0.2 - distance) * 30;

        newOffsets.set(emoji.id, { x: dx * force, y: dy * force });
      });

      setOffsets(newOffsets);
    };

    containerRef.current.addEventListener('mousemove', handleMove, { passive: true });
    return () => containerRef.current?.removeEventListener('mousemove', handleMove);
  }, [canHover, emojis]);

  return offsets;
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| GSAP for all scroll | Framer Motion `useScroll` | Better React integration, simpler code |
| Custom touch detection | `useCanHover()` media query | More reliable, no JS sniffing |
| JS theme transitions | CSS `transition` property | Smoother, no layout thrash |

**Deprecated/outdated:**
- `prefersReducedMotion` OS check - codebase ignores OS setting, uses own preference
- Direct `gsap.to()` for parallax - use GSAP ScrollTrigger or FM useScroll instead

## Open Questions

1. **Exact hero gradient colors**
   - What we know: Light = saffron-to-cream, Dark = black-to-saffron-glow
   - What's unclear: Exact hex values for "cream" and "subtle glow"
   - Recommendation: Define new tokens, test visually

2. **Shimmer/traveling light effect**
   - What we know: Per CONTEXT.md, "background shimmer" adds liveliness
   - What's unclear: Exact implementation (CSS animation? Canvas? SVG?)
   - Recommendation: Use CSS `animate-shimmer` as starting point, iterate

## Sources

### Primary (HIGH confidence)
- `src/components/ui/homepage/Hero.tsx` - Current implementation reviewed
- `src/lib/motion-tokens.ts` - All spring/parallax presets documented
- `src/lib/hooks/useResponsive.ts` - useCanHover implementation
- `src/styles/tokens.css` - All color tokens verified
- `src/lib/hooks/useAnimationPreference.ts` - Animation preference system

### Secondary (MEDIUM confidence)
- `src/lib/webgl/gradients.ts` - Gradient utilities and palettes
- `src/lib/gsap/` - GSAP setup and presets
- `src/styles/animations.css` - CSS animation utilities

### Tertiary (LOW confidence)
- None - all research from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase
- Architecture: HIGH - Patterns established in existing Hero.tsx
- Pitfalls: HIGH - Based on codebase patterns and common React animation issues

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (stable infrastructure, low churn expected)
