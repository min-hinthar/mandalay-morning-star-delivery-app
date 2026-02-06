# Phase 30: Mobile Stability - Research

**Researched:** 2026-01-28
**Domain:** CSS 3D transforms, touch device detection, Safari rendering bugs
**Confidence:** HIGH

## Summary

This phase focuses on making 3D tilt effects work reliably across touch devices and Safari. The core approach uses CSS media queries `(hover: hover) and (pointer: fine)` for touch detection (no JavaScript needed), with complete tilt disable on touch devices per user decision. Safari-specific fixes address known WebKit bugs with `backdrop-filter`, `backface-visibility`, and 3D transforms using established workarounds.

The existing `UnifiedMenuItemCard` already has 3D tilt implemented with Framer Motion (`useMotionValue`, `useSpring`, `useTransform`). The component needs modification to respect touch detection media queries and provide fallback visual feedback (shadow elevation, animated shine sweep) for touch users.

**Primary recommendation:** Use CSS media query detection at CSS level for styling, conditional JS behavior in components for Framer Motion values, and apply Safari GPU compositing fixes (`will-change: transform`, `-webkit-backface-visibility: hidden`, `translate3d(0,0,0)`) to all tilt-enabled elements.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.26.1 | 3D tilt animation, useMotionValue/useSpring | Already used for tilt effects |
| TailwindCSS | 4.x | CSS utilities, media queries | Project standard |
| React | 19.2.3 | Component architecture | Project standard |

### Supporting (No New Dependencies)
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| CSS Media Queries | Touch/pointer detection | All tilt components |
| CSS Keyframes | Animated shine sweep | Touch device fallback |
| CSS Variables | Theme-aware animations | Shine colors, shadow tokens |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS media queries | JS touch detection | CSS is simpler, more reliable, no hydration issues |
| Complete tilt disable | Reduced tilt | User decided complete disable - cleaner, better performance |
| `will-change: transform` | No GPU hint | Safari needs explicit GPU layer promotion |

**No new dependencies required.** All patterns use existing CSS and Framer Motion capabilities.

## Architecture Patterns

### Recommended Touch Detection Pattern

```css
/* Base styles - applied to touch devices (mobile-first) */
.tilt-card {
  /* Fallback: no tilt, static or animated shine */
}

/* Enhanced styles - only for hover-capable devices with fine pointer */
@media (hover: hover) and (pointer: fine) {
  .tilt-card {
    /* 3D tilt enabled */
  }
}
```

### Component Detection Pattern (React)

```tsx
// src/lib/hooks/useCanHover.ts
"use client";
import { useState, useEffect } from "react";

/**
 * Detect if device supports hover interactions with fine pointer.
 * Returns false on SSR, then updates on client mount.
 *
 * Uses same media query as CSS for consistency:
 * (hover: hover) and (pointer: fine)
 */
export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(query.matches);

    // No change listener needed - static detection per CONTEXT.md
  }, []);

  return canHover;
}
```

### Safari Fix Application Order

Apply fixes in this order on tilt-enabled elements:

1. **Stacking context isolation:** `isolation: isolate` on parent container
2. **GPU layer promotion:** `will-change: transform` on tilt element
3. **Backface fix:** `-webkit-backface-visibility: hidden; backface-visibility: hidden;`
4. **Compositing trigger:** `transform: translate3d(0, 0, 0)` on tilt element
5. **Overflow containment:** `overflow: hidden` on backdrop-filter elements only

### Anti-Patterns to Avoid

- **Using `ontouchstart` detection:** Unreliable, many touch devices report false negatives
- **Samsung device assumptions:** Samsung touchscreens report as touchpads; media query handles this correctly
- **`will-change` on too many elements:** Each creates a GPU layer consuming ~50MB; use sparingly
- **Applying `will-change` permanently in CSS:** Add via JS before animation, remove after
- **`backface-visibility: hidden` on all elements:** iOS crashes reported; target only tilt elements

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch detection | Custom touchstart listeners | CSS `@media (hover: hover) and (pointer: fine)` | Browser handles edge cases, no JS hydration issues |
| Animated shine | Canvas/WebGL shine effect | CSS keyframe animation with gradient | GPU-accelerated, works everywhere, simpler |
| Long press detection | Raw touchstart/end timers | Existing pattern with cleanup | Timer cleanup on unmount is tricky |
| Safari GPU bugs | Trial-and-error fixes | Established `-webkit-` prefix pattern | Known working solutions exist |

**Key insight:** Safari's rendering quirks with 3D transforms are well-documented with established workarounds. The fix combination (`will-change` + `-webkit-backface-visibility` + `translate3d`) is standard practice.

## Common Pitfalls

### Pitfall 1: Stacking Context Breaks preserve-3d
**What goes wrong:** Adding `zIndex` or `scale` in `whileHover`/`whileTap` creates new stacking contexts that break `preserve-3d` inheritance, causing content to flicker.
**Why it happens:** Browser recalculates layer compositing when stacking context changes during 3D rotation.
**How to avoid:** Disable Framer Motion hover/tap scale when 3D tilt is enabled. The 3D tilt IS the hover feedback.
**Warning signs:** Content flickers, disappears, or z-order changes during tilt animation.

### Pitfall 2: Hydration Mismatch with Touch Detection
**What goes wrong:** Hook returns different value server vs client, causing hydration mismatch.
**Why it happens:** `window.matchMedia` unavailable on server; initial state differs from client.
**How to avoid:** Default to `false` (touch behavior) on SSR, update on mount. CSS handles the visual difference.
**Warning signs:** React hydration warnings in console, brief flash of wrong behavior.

### Pitfall 3: Safari backdrop-filter + transform Conflict
**What goes wrong:** Glassmorphism blur disappears or shows artifacts when combined with 3D transforms.
**Why it happens:** WebKit bug with compositing layers when `backdrop-filter` and 3D `transform` interact.
**How to avoid:** Apply `isolation: isolate` and `overflow: hidden` to backdrop-filter element. Keep backdrop-filter element separate from transform element in DOM hierarchy.
**Warning signs:** White blocks appearing, blur flickering, elements disappearing during rotation.

### Pitfall 4: Long Press Conflicts with Scroll
**What goes wrong:** Long press starts, user scrolls slightly, card activates unexpectedly.
**Why it happens:** Touch move threshold not set, timer fires despite movement.
**How to avoid:** Cancel long press timer if touchmove exceeds ~10px threshold.
**Warning signs:** Accidental activations during scroll, user frustration.

### Pitfall 5: will-change Memory Bloat
**What goes wrong:** Page becomes sluggish, memory usage spikes.
**Why it happens:** `will-change: transform` on many elements creates GPU layers (~50MB each).
**How to avoid:** Apply only to actively animating elements. Remove after animation completes.
**Warning signs:** Safari dev tools showing many compositing layers, memory warnings.

## Code Examples

### Touch Detection CSS (globals.css addition)

```css
/* src/app/globals.css - add to @layer utilities */

/**
 * Touch device fallback utilities
 * Applied by default (mobile-first), removed on hover-capable devices
 */
.tilt-disabled {
  /* Explicitly disable any 3D transforms for touch */
  transform: none !important;
  transform-style: flat !important;
}

/* Animated shine sweep for touch devices (4-5 second cycle per CONTEXT.md) */
@keyframes shine-sweep {
  0% {
    transform: translateX(-100%) rotate(45deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.3;
  }
  90% {
    opacity: 0;
  }
  100% {
    transform: translateX(200%) rotate(45deg);
    opacity: 0;
  }
}

.animate-shine-sweep {
  animation: shine-sweep 4.5s ease-in-out infinite;
}

/* Pause animation during interaction */
.animate-shine-sweep:active,
.animate-shine-sweep:focus-within {
  animation-play-state: paused;
}

/* Enable tilt only on hover-capable devices */
@media (hover: hover) and (pointer: fine) {
  .tilt-disabled {
    transform: unset !important;
    transform-style: unset !important;
  }

  /* Hide animated shine on hover devices (cursor-tracked shine used instead) */
  .touch-shine-only {
    display: none;
  }
}
```

### Safari Compositing Fixes (CSS)

```css
/* Safari GPU compositing fixes for 3D tilt elements */
.tilt-safari-fix {
  /* Force GPU layer creation */
  will-change: transform;

  /* Prevent backface flicker */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  /* Ensure proper compositing */
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}

/* Parent container for tilt cards - isolate stacking context */
.tilt-container {
  isolation: isolate;
}

/* Backdrop-filter element fix - keep separate from transform element */
.glass-with-transform {
  isolation: isolate;
  overflow: hidden;
}
```

### useCanHover Hook

```tsx
// src/lib/hooks/useCanHover.ts
"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect hover-capable devices with fine pointer.
 *
 * Returns:
 * - false on SSR (safe default for touch)
 * - true on devices with mouse/trackpad
 * - false on pure touch devices
 *
 * Static detection at mount - no runtime switching per CONTEXT.md decision.
 */
export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    // Match CSS media query exactly for consistency
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mediaQuery.matches);
  }, []);

  return canHover;
}
```

### Touch Fallback Shadow/Lift Effect

```tsx
// Pattern for touch device tap feedback
// Shadow elevation: shadow-sm -> shadow-xl
// Lift: -4px translateY

const touchFeedbackVariants = {
  idle: {
    y: 0,
    boxShadow: "var(--shadow-sm)",
  },
  pressed: {
    y: -4,
    boxShadow: "var(--shadow-xl)",
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

// In component:
<motion.div
  variants={touchFeedbackVariants}
  initial="idle"
  whileTap={!canHover ? "pressed" : undefined}
  // ... existing tilt logic for canHover devices
>
```

### Long Press Handler Pattern

```tsx
// Pattern for 500ms long press to open detail sheet
const LONG_PRESS_DURATION = 500; // iOS standard per CONTEXT.md

const longPressTimer = useRef<NodeJS.Timeout | null>(null);
const touchStartPos = useRef<{ x: number; y: number } | null>(null);

const handleTouchStart = useCallback((e: React.TouchEvent) => {
  const touch = e.touches[0];
  touchStartPos.current = { x: touch.clientX, y: touch.clientY };

  longPressTimer.current = setTimeout(() => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onLongPress?.();
  }, LONG_PRESS_DURATION);
}, [onLongPress]);

const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (!touchStartPos.current || !longPressTimer.current) return;

  const touch = e.touches[0];
  const dx = Math.abs(touch.clientX - touchStartPos.current.x);
  const dy = Math.abs(touch.clientY - touchStartPos.current.y);

  // Cancel if moved more than 10px (scroll threshold)
  if (dx > 10 || dy > 10) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }
}, []);

const handleTouchEnd = useCallback(() => {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }
  touchStartPos.current = null;
}, []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ontouchstart in window` JS detection | CSS `(hover: hover) and (pointer: fine)` | ~2020 (CSS Level 5 Media Queries) | More reliable, no JS needed |
| Separate mobile/desktop code paths | CSS feature queries + conditional behavior | Standard practice | Cleaner, progressive enhancement |
| Manual `-webkit-` prefix everywhere | Autoprefixer + explicit prefixes for Safari bugs | Ongoing | Need both for Safari edge cases |
| `backface-visibility` only | Combined with `will-change` + `translate3d` | Safari 15+ | Fixes compositing bugs |

**Deprecated/outdated:**
- **`navigator.maxTouchPoints` detection:** Unreliable for hybrid devices
- **`touch-action: none` for all tilt:** Breaks scrolling; use only during active interaction
- **CSS `touch-action: manipulation`:** Only reduces tap delay, doesn't detect touch

## Open Questions

1. **Samsung Device Edge Case**
   - What we know: Samsung touchscreens report as both touchscreen AND touchpad, potentially matching `pointer: fine`
   - What's unclear: Whether this causes tilt to enable on Samsung touch-only devices
   - Recommendation: Test on Samsung device during verification; if issue exists, add `any-pointer: coarse` check

2. **iOS Safari Technology Preview vs Production**
   - What we know: CONTEXT.md approves Safari Technology Preview for verification
   - What's unclear: Whether STP fixes mask production Safari bugs
   - Recommendation: Note any STP-specific behavior; document for production testing later

## Sources

### Primary (HIGH confidence)
- [MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change) - GPU acceleration, best practices
- [CSS-Tricks backface-visibility](https://css-tricks.com/almanac/properties/b/backface-visibility/) - Browser prefixes, Safari fixes
- [Apple Safari Handling Events](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html) - iOS touch events, long press timing
- Project LEARNINGS.md entry on "3D Transforms + Scale/Z-Index = Flickering" - Verified in this codebase

### Secondary (MEDIUM confidence)
- [Smashing Magazine Hover/Pointer Media Queries](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) - Touch detection patterns
- [CSS IRL Detecting Hover-Capable Devices](https://css-irl.info/detecting-hover-capable-devices/) - Media query patterns
- [Framer Motion MotionValue docs](https://motion.dev/motion/motionvalue/) - useMotionValue API

### Tertiary (LOW confidence)
- [Ctrl Blog Samsung CSS hover bug](https://www.ctrl.blog/entry/css-media-hover-samsung.html) - Samsung touchscreen edge case
- Multiple GitHub issues on Safari backdrop-filter bugs - Workarounds may need validation

## Metadata

**Confidence breakdown:**
- Touch detection patterns: HIGH - CSS media queries are well-documented standard
- Safari fixes: HIGH - Established workarounds, verified in LEARNINGS.md
- Animated shine: MEDIUM - Standard CSS keyframe pattern, exact timing needs tuning
- Long press handling: MEDIUM - Pattern is standard, exact threshold may need adjustment

**Research date:** 2026-01-28
**Valid until:** 60 days (stable CSS/browser APIs, Safari bugs unlikely to change quickly)
