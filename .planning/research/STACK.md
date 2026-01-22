# Technology Stack: UI Rewrite

**Project:** Morning Star Delivery App - Full UI Rewrite
**Researched:** 2026-01-21
**Overall Confidence:** HIGH

---

## Executive Summary

This stack builds on the existing Next.js 16 + React 19 foundation, adding GSAP for timeline-based scroll choreography while keeping Framer Motion (now "Motion") for component-level interactions. The key additions are a strict z-index token system using CSS custom properties + `isolation: isolate`, and GSAP's now-free premium plugins for "over-the-top" animation.

**Critical insight:** GSAP is now 100% free (including all plugins) thanks to Webflow's acquisition. No license fees or Club GreenSock membership required.

---

## Recommended Stack

### Animation System (Dual-Library Approach)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `gsap` | ^3.14 | Timeline choreography, scroll animations, text splitting | Best-in-class timeline control, ScrollTrigger, SplitText now free. Bypasses React rendering for 60fps. | HIGH |
| `@gsap/react` | ^2.1 | React integration | Official `useGSAP` hook with automatic cleanup, scoped selectors, `contextSafe()` for event handlers | HIGH |
| `motion` | ^12.27 | Component-level interactions | Declarative API, layout animations, AnimatePresence, gesture support. Already in codebase as `framer-motion`. | HIGH |

**Responsibilities split:**

| Animation Type | Use GSAP | Use Motion |
|----------------|----------|------------|
| Page-level scroll sequences | Yes | No |
| Hero entrance choreography | Yes | No |
| Text reveals (SplitText) | Yes | No |
| Complex multi-element timelines | Yes | No |
| Card hover/tap | No | Yes |
| Modal/drawer enter/exit | No | Yes |
| Layout shifts | No | Yes |
| Micro-interactions (buttons, badges) | No | Yes |
| Stagger animations (simple) | Either | Either |

### Z-Index / Layering System

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| CSS Custom Properties | Native | Token storage | Already in `tokens.css`, TailwindCSS 4 consumes via `z-(--z-modal)` | HIGH |
| `isolation: isolate` | Native CSS | Stacking context creation | Cleanest way to create stacking contexts without side effects. No arbitrary z-index needed. | HIGH |
| Tailwind arbitrary values | v4 | Token consumption | `z-[var(--z-modal)]` or `z-(--z-modal)` syntax | HIGH |

**Existing token hierarchy (keep as-is):**
```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-modal-backdrop: 40;
--z-modal: 50;
--z-popover: 60;
--z-tooltip: 70;
--z-toast: 80;
--z-max: 100;
```

**New patterns to enforce:**
- All overlay containers: `isolation: isolate` at boundary
- Decorative layers (confetti, particles): `pointer-events-none` + `z-[var(--z-max)]`
- Portaled content: Single portal root at document body level
- Never use arbitrary z-index numbers in components

### Styling System (Existing + Enhancements)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TailwindCSS | ^4 | Utility-first styling | Already in place, v4 has native CSS variable support via `@theme` | HIGH |
| `class-variance-authority` | ^0.7.1 | Component variants | Already in codebase, type-safe variants, works with any CSS approach | HIGH |
| `tailwind-merge` | ^3.4.0 | Class conflict resolution | Already in codebase, required for CVA patterns | HIGH |
| `clsx` | ^2.1.1 | Conditional classes | Already in codebase, lightweight | HIGH |

**TailwindCSS 4 `@theme` for tokens (recommended):**
```css
@import "tailwindcss";
@theme {
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
  --z-max: 100;
}
```

This generates `z-dropdown`, `z-modal`, etc. as first-class utilities.

### Component Primitives (Existing)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Radix UI Primitives | Various | Accessible primitives | Already in codebase, handles a11y, focus management | HIGH |
| `vaul` | ^1.1.2 | Bottom sheet/drawer | Already in codebase, mobile-first drawer patterns | HIGH |
| `lucide-react` | ^0.562.0 | Icons | Already in codebase, consistent icon set | HIGH |

**Radix z-index integration:**
Radix no longer manages z-index automatically. Use tokenized values on portal content:
```tsx
<Dialog.Portal>
  <Dialog.Overlay className="z-[var(--z-modal-backdrop)]" />
  <Dialog.Content className="z-[var(--z-modal)]" />
</Dialog.Portal>
```

---

## GSAP Plugin Selection

All plugins now free. Recommended for this project:

| Plugin | Purpose | Notes |
|--------|---------|-------|
| `ScrollTrigger` | Scroll-linked animations | Essential for menu browsing, hero sections |
| `SplitText` | Text animation | Hero headlines, category titles. New v3.13 has accessibility features. |
| `Flip` | Layout transitions | Smooth cart item reordering, category filtering |
| `Observer` | Touch/scroll gestures | Swipe interactions on cart items |

**Not recommended for this project:**
- `ScrollSmoother` - Heavy, conflicts with native scroll, SEO concerns
- `MorphSVG` - No SVG morphing requirements identified
- `MotionPathPlugin` - Overkill for food delivery UI

---

## Installation

```bash
# GSAP ecosystem (now free)
pnpm add gsap @gsap/react

# Motion (if migrating from framer-motion package name)
pnpm add motion
pnpm remove framer-motion

# Existing packages (no changes needed)
# - tailwindcss, tailwind-merge, clsx, class-variance-authority
# - @radix-ui/*, vaul
```

**Note:** `framer-motion` and `motion` are the same library. The package was renamed. You can either:
1. Keep `framer-motion` (still maintained, receives updates)
2. Migrate to `motion` (new package name, identical API)

No breaking changes between them in v12.

---

## GSAP Setup Pattern

Create centralized plugin registration:

```typescript
// src/lib/gsap/index.ts
"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";

// Register all plugins
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);

// Default configuration
gsap.defaults({
  duration: 0.6,
  ease: "power2.out",
});

// Performance defaults for Core Web Vitals
gsap.config({
  autoSleep: 60,
  force3D: true,
  nullTargetWarn: false,
});

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip, Observer };
```

**Usage in components:**
```typescript
"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

export function HeroSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".hero-title", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: container.current,
          start: "top 80%",
        },
      });
    },
    { scope: container }
  );

  return <div ref={container}>...</div>;
}
```

---

## Motion Token System

Extend existing `variants.ts` with GSAP-compatible presets:

```typescript
// src/lib/animations/gsap-presets.ts
export const gsapEases = {
  // Match existing Motion spring presets
  snappy: "power2.out",
  gentle: "power1.out",
  bouncy: "back.out(1.7)",
  smooth: "power3.inOut",

  // Scroll-specific
  scrub: "none", // Linear for scrub
  reveal: "power4.out",
} as const;

export const gsapDurations = {
  instant: 0,
  fast: 0.15,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
} as const;
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Animation | GSAP + Motion | GSAP only | Motion has superior React integration for component-level work |
| Animation | GSAP + Motion | Motion only | Motion lacks timeline control and text splitting capabilities |
| Animation | GSAP + Motion | Anime.js | Smaller ecosystem, less React integration |
| Z-index | CSS tokens | Tailwind config | TailwindCSS 4 `@theme` tokens are CSS-native, more portable |
| Z-index | `isolation` | Transform hack | `isolation` is semantic, transform creates rendering side effects |
| Variants | CVA | Tailwind Variants | CVA is framework-agnostic, already in codebase, lighter |
| Variants | CVA | Stitches | Deprecated, moving to CSS-in-JS alternatives |

---

## Anti-Patterns to Avoid

### Animation Anti-Patterns

| Anti-Pattern | Problem | Instead |
|--------------|---------|---------|
| GSAP inside `useEffect` | No automatic cleanup, memory leaks | Use `useGSAP` hook |
| Animating width/height | Triggers layout thrash | Animate `scale`, `clipPath` |
| Inline GSAP registration | Plugin loaded multiple times | Centralize in `lib/gsap/index.ts` |
| ScrollTrigger without scope | Selectors leak between components | Pass `scope: containerRef` |
| Mixing Motion layout + GSAP | Conflicting DOM manipulation | Pick one for each element |

### Z-Index Anti-Patterns

| Anti-Pattern | Problem | Instead |
|--------------|---------|---------|
| Hardcoded z-index numbers | Unmaintainable, conflicts | Use token variables |
| `z-index: 9999` | Arms race, eventually fails | Use semantic layer tokens |
| `backdrop-blur` on positioned elements | Creates stacking context trap | Apply blur to pseudo-element |
| `transform` on overlay containers | Breaks fixed positioning in children | Use `isolation: isolate` |

### Radix Anti-Patterns

| Anti-Pattern | Problem | Instead |
|--------------|---------|---------|
| Form submission in DropdownMenu.Item | Blocks Next.js navigation | Use `onSelect` + router |
| Nested portals | Z-index chaos | Single portal root |
| Missing z-index on portal content | Appears behind other elements | Apply tokenized z-index |

---

## Performance Considerations

### Bundle Size Impact

| Addition | Gzipped Size | Notes |
|----------|--------------|-------|
| `gsap` core | ~23 KB | Modular, tree-shakeable |
| `ScrollTrigger` | ~12 KB | Only import if used |
| `SplitText` | ~5 KB | Only import if used |
| `Flip` | ~4 KB | Only import if used |
| `@gsap/react` | ~2 KB | Essential for React |
| Total GSAP | ~46 KB | If all recommended plugins used |
| Motion | ~32 KB | Already in bundle |

**Mitigation:** Dynamic imports for GSAP plugins on routes that need them.

### Core Web Vitals

| Metric | Risk | Mitigation |
|--------|------|------------|
| LCP | Hero animation delays paint | Use `autoAlpha` instead of `opacity`, avoid blocking main content |
| CLS | Animated elements shift layout | Reserve space, use `transform` only |
| INP | Scroll handlers block interaction | Use `scrub: true` sparingly, offload to compositor |

---

## Sources

### GSAP
- [GSAP 3.13 Release Blog](https://gsap.com/blog/3-13/) - Plugin availability, SplitText rewrite
- [GSAP React Documentation](https://gsap.com/resources/React/) - `useGSAP` hook patterns
- [GSAP Community Forums](https://gsap.com/community/forums/topic/43831-what-are-the-best-practices-for-using-gsap-with-next-15-clientserver-components/) - Next.js App Router patterns
- [Setting Up GSAP with Next.js 2025](https://javascript.plainenglish.io/setting-up-gsap-with-next-js-2025-edition-bcb86e48eab6) - Integration guide

### Motion (Framer Motion)
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide) - Package rename details
- [Motion Changelog](https://motion.dev/changelog) - Version 12 changes
- [GSAP vs Motion Comparison](https://motion.dev/docs/gsap-vs-motion) - Official comparison from Motion

### Z-Index / Stacking
- [Josh Comeau's Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/) - Stacking context fundamentals
- [CSS Isolation Property MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation) - Official documentation
- [Microsoft Atlas Z-Index Tokens](https://design.learn.microsoft.com/tokens/z-index.html) - Enterprise token pattern
- [Radix Portal Documentation](https://www.radix-ui.com/primitives/docs/utilities/portal) - Portal z-index handling

### TailwindCSS 4
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) - `@theme` directive, CSS-first config
- [Tailwind Theme Variables](https://tailwindcss.com/docs/theme) - Token customization
- [Tailwind Z-Index Utilities](https://tailwindcss.com/docs/z-index) - Current syntax

### Performance
- [Animation Performance in React](https://stevekinney.com/courses/react-performance/animation-performance) - React-specific optimization
- [Web Animations Best Practices](https://www.zigpoll.com/content/can-you-explain-the-best-practices-for-optimizing-web-performance-when-implementing-complex-animations-in-react) - Core Web Vitals guidance

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| GSAP version/pricing | HIGH | Verified via official blog, npm |
| Motion/Framer rename | HIGH | Verified via official changelog |
| GSAP + React patterns | HIGH | Official `@gsap/react` documentation |
| Z-index token approach | HIGH | Industry standard (Microsoft, USWDS, Salt) |
| `isolation` property | HIGH | MDN documentation, wide browser support |
| TailwindCSS 4 `@theme` | HIGH | Official Tailwind documentation |
| CVA vs Tailwind Variants | MEDIUM | Both valid; CVA recommended due to existing usage |
| Bundle size estimates | MEDIUM | Based on npm/bundlephobia, may vary with tree-shaking |

---

## Migration Notes

Since `framer-motion` v12 is already installed:

1. **Option A (Recommended):** Keep `framer-motion` package name. It's identical to `motion` and still receives updates.

2. **Option B:** Rename imports if you want to align with the new branding:
   ```bash
   pnpm remove framer-motion
   pnpm add motion
   ```
   Then update imports from `framer-motion` to `motion/react`:
   ```typescript
   // Before
   import { motion, AnimatePresence } from "framer-motion";

   // After
   import { motion, AnimatePresence } from "motion/react";
   ```

Both approaches are valid. No functional difference.
