# Phase 39: Animation Optimization - Research

**Researched:** 2026-02-05
**Domain:** Device-adaptive animations, GSAP/Framer Motion conflict resolution, optimistic UI
**Confidence:** HIGH

## Summary

This phase implements device-adaptive animations that scale based on hardware capability, resolves GSAP/Framer Motion conflicts, and enhances the fly-to-cart animation with sound and haptic feedback.

The project already has a solid animation foundation:

- GSAP 3.14.2 with ScrollTrigger, SplitText, Flip, Observer plugins registered at `@/lib/gsap`
- Framer Motion 12.26.1 with comprehensive motion tokens at `@/lib/motion-tokens.ts`
- `@gsap/react` 2.1.2 with `useGSAP` hook for automatic context cleanup
- Existing `useAnimationPreference` hook with three tiers: full/reduced/none

The key additions are: a new `useDeviceCapability` hook for hardware detection, an `AnimationProvider` context for unified animation state, enhanced fly-to-cart with sound/haptics, and dev-mode warnings for GSAP/Framer Motion conflicts.

**Primary recommendation:** Build on existing infrastructure - add hardware detection layer that feeds into `AnimationProvider`, which exposes tier + reducedMotion + gsapContext to all animation consumers.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)

| Library       | Version | Purpose                                     | Why Standard                                          |
| ------------- | ------- | ------------------------------------------- | ----------------------------------------------------- |
| gsap          | 3.14.2  | Scroll-linked animations, complex timelines | Industry standard, now free after Webflow acquisition |
| @gsap/react   | 2.1.2   | React integration with automatic cleanup    | Official GSAP React hooks, auto-handles context       |
| framer-motion | 12.26.1 | State-driven animations, gestures           | React-first, excellent AnimatePresence                |

### Supporting (Already Installed)

| Library            | Version   | Purpose                  | When to Use                  |
| ------------------ | --------- | ------------------------ | ---------------------------- |
| gsap/ScrollTrigger | (bundled) | Scroll-linked animations | Parallax, reveal-on-scroll   |
| gsap/Flip          | (bundled) | FLIP layout animations   | Cart transitions (if needed) |

### No Additional Dependencies Needed

The existing stack covers all requirements. Sound effects use Web Audio API (browser native), haptics use Vibration API (browser native).

**Installation:** None required - all dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── hooks/
│   │   ├── useDeviceCapability.ts      # NEW: Hardware detection
│   │   ├── useAnimationPreference.ts   # EXISTS: User preference
│   │   └── useReducedMotion.ts         # EXISTS: Combined logic
│   ├── providers/
│   │   └── animation-provider.tsx      # NEW: Context provider
│   ├── gsap/
│   │   ├── index.ts                    # EXISTS: Plugin registration
│   │   └── presets.ts                  # EXISTS: Duration/easing tokens
│   ├── motion-tokens.ts                # EXISTS: Framer Motion tokens
│   └── sounds/
│       └── cart-sounds.ts              # NEW: Sound effect utilities
├── components/
│   └── ui/
│       └── cart/
│           └── FlyToCart.tsx           # EXISTS: Enhance with sound/haptics
```

### Pattern 1: Device Capability Hook

**What:** Detect device memory, cores, connection type to determine animation tier
**When to use:** Once at app initialization, cached result

```typescript
// Source: MDN deviceMemory, hardwareConcurrency APIs
// Confidence: HIGH - verified with official MDN docs

export type DeviceTier = "low" | "medium" | "high";

export function useDeviceCapability() {
  const [tier, setTier] = useState<DeviceTier>("high");

  useEffect(() => {
    // Detection runs once on mount
    const memory = (navigator as NavigatorWithDeviceMemory).deviceMemory ?? null;
    const cores = navigator.hardwareConcurrency ?? null;

    // Safari fallback: no deviceMemory API
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isMobileSafari = isSafari && /Mobile/.test(navigator.userAgent);

    if (isMobileSafari) {
      setTier("low");
      return;
    }

    if (isSafari) {
      // Desktop Safari - treat as high-power
      setTier("high");
      return;
    }

    // Chromium browsers have deviceMemory
    // Low-power: <=4 GB memory OR <=4 CPU cores
    const isLowPower = (memory !== null && memory <= 4) || (cores !== null && cores <= 4);

    setTier(isLowPower ? "low" : "high");
  }, []);

  return { tier };
}
```

### Pattern 2: AnimationProvider Context

**What:** Centralized context exposing animation tier, reducedMotion, and GSAP context factory
**When to use:** Wrap app root, consumed by all animated components

```typescript
// Pattern combines device capability with user preference

interface AnimationContextValue {
  tier: DeviceTier;
  reducedMotion: boolean;
  shouldAnimate: boolean;
  // Factory for creating scoped GSAP contexts
  createGsapContext: (scope: React.RefObject<Element>) => gsap.Context;
  // Check if specific animation type is enabled
  isEnabled: (type: "parallax" | "stagger" | "float" | "all") => boolean;
}

// Usage in components:
const { tier, isEnabled } = useAnimationContext();

// Only parallax is disabled on low-power
if (isEnabled("parallax")) {
  // run parallax animation
}
```

### Pattern 3: GSAP Context Cleanup with useGSAP

**What:** Automatic cleanup of GSAP animations on unmount
**When to use:** All GSAP animations in React components

```typescript
// Source: @gsap/react official docs
// Confidence: HIGH - verified with Context7 and official GSAP docs

import { useGSAP } from "@gsap/react";

function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(() => {
    // Animations created here are auto-cleaned up
    gsap.to(".box", {
      scrollTrigger: { trigger: ".box", scrub: true },
      x: 500
    });
  }, { scope: containerRef }); // Scopes to container

  // Event handlers need contextSafe wrapper
  const handleClick = contextSafe(() => {
    gsap.to(".box", { rotation: 180 });
  });

  return <div ref={containerRef}>...</div>;
}
```

### Pattern 4: AnimatePresence Direct Keyed Children

**What:** Ensure AnimatePresence children are direct motion elements with keys, no Fragments
**When to use:** All AnimatePresence usage

```typescript
// WRONG - Fragment breaks exit animations
<AnimatePresence>
  <>
    <motion.div key="a">...</motion.div>
    <motion.div key="b">...</motion.div>
  </>
</AnimatePresence>

// CORRECT - Array or parent wrapper
<AnimatePresence>
  {items.map(item => (
    <motion.div key={item.id}>...</motion.div>
  ))}
</AnimatePresence>

// CORRECT - Single wrapped child
<AnimatePresence>
  {isOpen && (
    <motion.div key="modal">...</motion.div>
  )}
</AnimatePresence>
```

### Pattern 5: willChange Lifecycle Management

**What:** Apply willChange during animation, remove after completion
**When to use:** Complex animations that need GPU acceleration

```typescript
// Source: MDN will-change documentation
// Confidence: HIGH - verified with official MDN docs

// In GSAP
gsap.to(element, {
  x: 100,
  onStart: () => { element.style.willChange = "transform"; },
  onComplete: () => { element.style.willChange = "auto"; }
});

// In Framer Motion - use style prop
<motion.div
  style={{ willChange: isAnimating ? "transform" : "auto" }}
  animate={{ x: 100 }}
  onAnimationStart={() => setIsAnimating(true)}
  onAnimationComplete={() => setIsAnimating(false)}
/>
```

### Anti-Patterns to Avoid

- **Fragment inside AnimatePresence:** Fragment unmounts immediately, exit animations fail
- **GSAP + Framer Motion on same element:** Competing for transform control
- **Permanent willChange:** Causes high memory usage, remove after animation
- **Missing contextSafe for event handlers:** Event-triggered GSAP animations won't be cleaned up
- **Device detection in render:** Run once on mount, not every render

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                  | Don't Build                           | Use Instead                                   | Why                                                  |
| ------------------------ | ------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| GSAP context cleanup     | Manual cleanup in useEffect           | `useGSAP` hook from @gsap/react               | Handles scope, cleanup, revertOnUpdate automatically |
| Reduced motion detection | Custom media query listener           | `useReducedMotion()` from framer-motion       | Handles SSR, hydration, all edge cases               |
| Bezier path animation    | Manual coordinate math                | GSAP keyframes with arc calculation           | Already implemented in FlyToCart.tsx                 |
| Stagger timing           | Manual delay calculations             | GSAP `stagger` option or FM `staggerChildren` | Built-in, handles edge cases                         |
| Scroll-linked animations | IntersectionObserver + manual updates | GSAP ScrollTrigger                            | Performance optimized, handles resize                |

**Key insight:** The project already has well-structured animation utilities. This phase adds a capability layer on top, not a replacement.

## Common Pitfalls

### Pitfall 1: Safari deviceMemory Fallback

**What goes wrong:** Safari doesn't support `navigator.deviceMemory`, returns undefined
**Why it happens:** WebKit doesn't implement Device Memory API
**How to avoid:** User-agent detection for Safari, mobile vs desktop heuristic
**Warning signs:** Undefined memory value, tier always defaulting to high on Safari

```typescript
// Detection pattern
const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
const isMobileSafari = isSafari && /Mobile/.test(navigator.userAgent);
// Mobile Safari -> low tier, Desktop Safari -> high tier
```

### Pitfall 2: iOS Vibration API Not Supported

**What goes wrong:** `navigator.vibrate()` silently fails on iOS
**Why it happens:** WebKit doesn't support Vibration API
**How to avoid:** Feature detection, graceful degradation
**Warning signs:** No haptic feedback on iOS devices

```typescript
// Safe haptic call
if (typeof navigator !== "undefined" && "vibrate" in navigator) {
  navigator.vibrate(10); // Light tap
}
// On iOS, condition fails - no error, just no vibration
```

### Pitfall 3: Web Audio in iOS Silent Mode

**What goes wrong:** Web Audio API sounds don't play when iOS is in silent mode
**Why it happens:** iOS treats Web Audio differently than HTML5 audio
**How to avoid:** Use HTML5 `<audio>` element for iOS, or document the limitation
**Warning signs:** Sound works in Chrome/Firefox but not Safari in silent mode

```typescript
// Consider: HTML5 Audio as fallback for guaranteed sound
// Or: Accept that silent mode = no sound (respects user preference)
```

### Pitfall 4: AnimatePresence with Fragments

**What goes wrong:** Exit animations don't run, components unmount immediately
**Why it happens:** React Fragments can't receive motion props
**How to avoid:** Direct keyed children only, wrap in div if needed
**Warning signs:** Components disappear instantly instead of animating out

### Pitfall 5: GSAP/Framer Motion Conflict

**What goes wrong:** Janky animations, elements jumping positions
**Why it happens:** Both libraries trying to control same CSS property
**How to avoid:** Clear ownership rules, dev-mode warnings
**Warning signs:** Elements flickering, transforms resetting mid-animation

## Code Examples

Verified patterns from official sources and existing codebase:

### Sound Effect Utility

```typescript
// Source: Web Audio API MDN docs
// Note: Plays on user interaction only, respects iOS silent mode

class CartSoundManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  async init() {
    // Lazy init on first user interaction
    if (this.audioContext) return;
    this.audioContext = new AudioContext();

    // Load a small pop/click sound (~1-2KB)
    const response = await fetch("/sounds/pop.mp3");
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play() {
    if (!this.audioContext || !this.audioBuffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }
}

export const cartSound = new CartSoundManager();
```

### Dev-Mode Conflict Warning

```typescript
// Detect GSAP + Framer Motion conflict at dev time

if (process.env.NODE_ENV === "development") {
  const gsapTargets = new Set<Element>();
  const fmTargets = new Set<Element>();

  // Hook into GSAP
  gsap.registerPlugin({
    name: "conflictDetector",
    init(target) {
      gsapTargets.add(target);
      if (fmTargets.has(target)) {
        console.warn(
          "[Animation Conflict] Element animated by both GSAP and Framer Motion:",
          target
        );
      }
    },
  });

  // For Framer Motion, use onAnimationStart callback in components
}
```

### Enhanced Fly-to-Cart with Sound + Haptics

```typescript
// Extend existing FlyToCart.tsx pattern

const fly = useCallback(({ sourceElement, imageUrl }: FlyToCartOptions) => {
  // ... existing fly logic ...

  // Trigger haptic immediately (user interaction context)
  if ("vibrate" in navigator) {
    navigator.vibrate(10);
  }

  // Init sound on first use (requires user interaction)
  cartSound.init().then(() => {
    // Play when animation starts
    cartSound.play();
  });

  // ... GSAP animation ...
}, []);
```

## State of the Art

| Old Approach                    | Current Approach                          | When Changed              | Impact                                 |
| ------------------------------- | ----------------------------------------- | ------------------------- | -------------------------------------- |
| Manual GSAP cleanup             | `useGSAP` hook                            | @gsap/react 2.0           | Auto cleanup, React 18 StrictMode safe |
| `framer-motion`                 | `motion`                                  | Feb 2025 rebrand          | Same API, new name                     |
| GSAP paid commercial            | GSAP free for all                         | 2024 Webflow acquisition  | No licensing concerns                  |
| Device detection via UA parsing | Device Memory + Hardware Concurrency APIs | Available since Chrome 63 | More reliable than UA                  |

**Deprecated/outdated:**

- GSAP `TweenMax` / `TweenLite`: Use `gsap.to()` / `gsap.from()` instead
- Direct `gsap.context()` manual management: Use `useGSAP` hook instead

## Open Questions

Things that couldn't be fully resolved:

1. **Sound file format and hosting**
   - What we know: Need small (1-2KB) pop/click sound
   - What's unclear: Source for royalty-free sound, optimal format (mp3 vs webm)
   - Recommendation: Use mp3 for broad compatibility, host in public folder

2. **iOS silent mode behavior**
   - What we know: Web Audio respects silent mode, HTML5 audio doesn't
   - What's unclear: Is respecting silent mode the desired UX?
   - Recommendation: Use Web Audio - respecting silent mode is correct behavior

3. **Medium tier definition**
   - What we know: CONTEXT.md mentions low/high tiers primarily
   - What's unclear: Is there a medium tier with reduced durations?
   - Recommendation: Start with two tiers (low/high), add medium if needed

## Sources

### Primary (HIGH confidence)

- [MDN navigator.deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory) - Device Memory API documentation
- [MDN navigator.hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency) - Hardware Concurrency API
- [@gsap/react GitHub](https://github.com/greensock/react) - Official useGSAP hook documentation
- [GSAP React Integration](https://gsap.com/resources/React/) - Official GSAP React guide
- [MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) - will-change best practices
- [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) - Haptic feedback API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Sound effect implementation

### Secondary (MEDIUM confidence)

- [Understanding AnimatePresence](https://medium.com/javascript-decoded-in-plain-english/understanding-animatepresence-in-framer-motion-attributes-usage-and-a-common-bug-914538b9f1d3) - Fragment issue documentation
- [Codrops Product to Cart](https://tympanus.net/codrops/2024/11/21/from-product-to-cart-adding-guiding-animations-to-the-shopping-experience/) - Fly-to-cart patterns
- [GSAP MotionPath](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/) - Bezier path animations

### Tertiary (LOW confidence)

- [Web Audio iOS Weirdness](https://adactio.com/journal/17709) - iOS silent mode behavior (dated but relevant)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - existing codebase verified, official docs checked
- Architecture: HIGH - patterns derived from official GSAP React docs and existing code
- Device detection: HIGH - MDN docs verified for all APIs
- Pitfalls: HIGH - known browser limitations documented

**Research date:** 2026-02-05
**Valid until:** 30 days (stable domain, browser APIs don't change frequently)
