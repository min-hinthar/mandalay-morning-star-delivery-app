# Phase 35: Mobile Crash Prevention - Research

**Researched:** 2026-01-30
**Domain:** React lifecycle cleanup, memory leak prevention, iOS Safari stability
**Confidence:** HIGH

## Summary

This phase addresses systematic cleanup of memory leaks and race conditions to achieve zero crashes on mobile devices. Research focused on three key areas: (1) GSAP/ScrollTrigger cleanup patterns using the official @gsap/react hook, (2) React useEffect cleanup best practices for timers, async operations, and observers, and (3) iOS Safari-specific memory constraints that cause crashes around 100MB on iPhone SE.

The codebase already has good infrastructure in place - notably `useGSAP` from @gsap/react is properly registered in `src/lib/gsap/index.ts`, `useBodyScrollLock` has proper cleanup with deferred restore pattern, and several components already use the isMounted ref pattern. The audit should focus on finding components that DON'T follow these established patterns.

**Primary recommendation:** Create `src/lib/hooks/useSafeEffects.ts` with `useSafeTimeout`, `useSafeInterval`, `useSafeAsync`, and `useMountedRef` hooks, then systematically audit all 93 files using useEffect to apply consistent cleanup patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @gsap/react | 2.1.2 | GSAP React integration | Official hook with automatic cleanup via gsap.context() |
| React | 19.2.3 | Component lifecycle | Standard, useEffect cleanup functions |
| Framer Motion | 12.26.1 | Declarative animations | AnimatePresence handles lifecycle automatically |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.1 | Testing hooks | Testing useSafeEffects utility hooks |
| Vitest | 4.0.17 | Test runner | Unit tests for cleanup behavior |

### Existing Infrastructure
| File | Purpose | Status |
|------|---------|--------|
| `src/lib/gsap/index.ts` | GSAP plugin registration, exports useGSAP | Already uses @gsap/react properly |
| `src/lib/hooks/useBodyScrollLock.ts` | Scroll lock with cleanup | Already has deferRestore pattern |
| `src/lib/hooks/useSoundEffect.ts` | AudioContext management | Already has proper cleanup |
| `src/lib/hooks/useDebounce.ts` | Timer cleanup | Already has proper cleanup |

## Architecture Patterns

### Recommended Project Structure
```
src/lib/hooks/
  useSafeEffects.ts          # NEW: Safe cleanup utilities
  useBodyScrollLock.ts       # EXISTS: Already has proper cleanup
  useSoundEffect.ts          # EXISTS: Already has proper cleanup
```

### Pattern 1: useGSAP with Scope (GSAP Animations)
**What:** Official GSAP React hook that auto-cleans all animations
**When to use:** Any GSAP animation in React component
**Example:**
```typescript
// Source: https://gsap.com/resources/React/
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

function Component() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // All GSAP animations and ScrollTriggers created here
    // are automatically reverted when component unmounts
    gsap.to(".box", { x: 100 });

    ScrollTrigger.create({
      trigger: ".section",
      onEnter: () => gsap.to(".box", { opacity: 1 })
    });
  }, { scope: containerRef }); // Scopes selector text to container

  return <div ref={containerRef}>...</div>;
}
```

### Pattern 2: Context-Safe Event Handlers (GSAP in Callbacks)
**What:** Wrap event handler animations in contextSafe
**When to use:** Animations triggered by clicks, timeouts, or other callbacks
**Example:**
```typescript
// Source: https://gsap.com/resources/React/
import { useGSAP } from "@/lib/gsap";

function Component() {
  const containerRef = useRef(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Animations in this handler are tracked by the context
  const handleClick = contextSafe(() => {
    gsap.to(".box", { rotation: 180 });
  });

  return (
    <div ref={containerRef}>
      <button onClick={handleClick}>Animate</button>
    </div>
  );
}
```

### Pattern 3: isMounted Ref Pattern (Async Operations)
**What:** Track component mount state to prevent setState after unmount
**When to use:** Any async operation (fetch, setTimeout callback, Promise)
**Example:**
```typescript
// Existing pattern in codebase (usePlacesAutocomplete.ts, Modal.tsx)
function useAsyncExample() {
  const [data, setData] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    fetchData().then((result) => {
      if (isMountedRef.current) {
        setData(result);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return data;
}
```

### Pattern 4: Timer Cleanup with Refs (Timers Outside useEffect)
**What:** Store timer IDs in refs, clear in cleanup AND before re-scheduling
**When to use:** Timers triggered by callbacks or outside useEffect
**Example:**
```typescript
// Existing pattern in codebase (Confetti.tsx, OnboardingTour.tsx)
function Component() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAction = useCallback(() => {
    // Clear existing timer before scheduling new one
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      doSomething();
      timeoutRef.current = null;
    }, 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
}
```

### Pattern 5: useBodyScrollLock with Deferred Restore (Modals)
**What:** Lock scroll during modal, restore position after exit animation
**When to use:** All modals with AnimatePresence exit animations
**Example:**
```typescript
// Existing pattern in codebase (Modal.tsx)
function Modal({ isOpen, onClose }) {
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, {
    deferRestore: true
  });

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {isOpen && <motion.div exit={{ opacity: 0 }}>...</motion.div>}
    </AnimatePresence>
  );
}
```

### Anti-Patterns to Avoid

- **setTimeout without cleanup:** Every setTimeout must have corresponding clearTimeout in cleanup
- **addEventListener without removeEventListener:** Must pass same handler reference to both
- **GSAP animations in useEffect:** Use useGSAP instead - it handles context automatically
- **AudioContext without close():** Each AudioContext consumes system resources
- **IntersectionObserver without disconnect():** Observers keep references to DOM nodes
- **setState in async callback without mount check:** Causes "setState on unmounted" warning (removed in React 18 but still a memory leak)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GSAP cleanup in React | Manual gsap.context() management | `useGSAP` from @gsap/react | Handles context, scope, revertOnUpdate automatically |
| Debounced values | Custom timer logic | Existing `useDebounce` hook | Already has proper cleanup |
| Body scroll lock | Manual position:fixed | Existing `useBodyScrollLock` | Handles iOS Safari edge cases |
| Sound effects | Direct AudioContext calls | Existing `useSoundEffect` | Proper cleanup, autoplay policy handling |
| Safe async operations | Ad-hoc isMounted flags | New `useSafeAsync` hook | Standardized pattern, AbortController support |
| Safe timers | Ad-hoc refs per component | New `useSafeTimeout`/`useSafeInterval` | Consistent API, auto-cleanup |

**Key insight:** The codebase has good existing patterns but they're scattered. Creating `useSafeEffects.ts` consolidates these into reusable hooks that prevent inconsistent implementations.

## Common Pitfalls

### Pitfall 1: iOS Safari Memory Limits
**What goes wrong:** App crashes/reloads around 100MB memory on iPhone SE, 200MB on iPad
**Why it happens:** iOS enforces strict memory pressure limits - sends SIGKILL without warning
**How to avoid:**
  - Clean up all GSAP animations (context.revert())
  - Close AudioContexts when not needed
  - Disconnect IntersectionObservers
  - Clear large data structures on unmount
**Warning signs:** Random crashes during heavy animation sequences, especially after rapid navigation

### Pitfall 2: React Strict Mode Double-Mounts
**What goes wrong:** Effects run twice in development, causing duplicate animations or listeners
**Why it happens:** React 18 Strict Mode intentionally double-invokes effects
**How to avoid:** Always return cleanup functions that properly reset state
**Warning signs:** Animations doubling up, listeners firing twice

### Pitfall 3: Stale Closures in Event Handlers
**What goes wrong:** Callbacks capture old state values, cause incorrect behavior
**Why it happens:** JavaScript closures capture values at definition time
**How to avoid:** Include dependencies in useCallback deps, or use refs for latest values
**Warning signs:** onClick handlers using outdated state

### Pitfall 4: Event Listener Handler Reference Mismatch
**What goes wrong:** removeEventListener fails silently because handler reference changed
**Why it happens:** Inline functions or useCallback without stable deps create new references
**How to avoid:** Store handler in ref or ensure stable callback
**Warning signs:** Listeners accumulate on each render, memory grows

### Pitfall 5: AnimatePresence Exit + Scroll Lock Conflict
**What goes wrong:** iOS Safari crashes during exit animation when scroll is restored early
**Why it happens:** Restoring scroll position during DOM transition causes layout thrash
**How to avoid:** Use `deferRestore: true` and `onExitComplete={restoreScrollPosition}`
**Warning signs:** Crashes specifically when closing modals on iOS Safari

### Pitfall 6: AudioContext Exhaustion
**What goes wrong:** Browser limits exceeded, sounds stop working
**Why it happens:** Each new AudioContext consumes system resources; browsers limit to ~6
**How to avoid:** Reuse single AudioContext, close on component unmount
**Warning signs:** Sounds work initially then stop, no errors thrown

## Code Examples

Verified patterns from official sources and existing codebase:

### useSafeEffects.ts (NEW - To Be Created)
```typescript
// New utility hook file: src/lib/hooks/useSafeEffects.ts
import { useRef, useEffect, useCallback } from "react";

/**
 * Returns a ref that tracks whether the component is mounted.
 * Use in async callbacks to prevent setState on unmounted components.
 */
export function useMountedRef() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

/**
 * Safe setTimeout that auto-cleans on unmount.
 * Returns functions to schedule and cancel the timeout.
 */
export function useSafeTimeout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const set = useCallback((callback: () => void, delay: number) => {
    // Clear any existing timeout before setting new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback();
      timeoutRef.current = null;
    }, delay);
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { set, clear };
}

/**
 * Safe setInterval that auto-cleans on unmount.
 */
export function useSafeInterval() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const set = useCallback((callback: () => void, delay: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(callback, delay);
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { set, clear };
}

/**
 * Safe async operation that won't setState after unmount.
 * Optionally supports AbortController for fetch cancellation.
 */
export function useSafeAsync<T>() {
  const isMountedRef = useMountedRef();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (asyncFn: (signal?: AbortSignal) => Promise<T>): Promise<T | null> => {
      // Abort any previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        const result = await asyncFn(abortControllerRef.current.signal);
        if (isMountedRef.current) {
          return result;
        }
        return null;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null; // Request was cancelled, not an error
        }
        throw error;
      }
    },
    [isMountedRef]
  );

  return { execute, isMounted: isMountedRef };
}
```

### GSAP ScrollTrigger Cleanup
```typescript
// Source: https://gsap.com/resources/React/
// Correct pattern using useGSAP from @/lib/gsap
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

function ScrollAnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const items = gsap.utils.toArray<HTMLElement>(".item", containerRef.current);

    items.forEach((item) => {
      gsap.from(item, {
        y: 50,
        opacity: 0,
        scrollTrigger: {
          trigger: item,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // No manual cleanup needed - useGSAP handles everything
  }, { scope: containerRef });

  return <div ref={containerRef}>...</div>;
}
```

### IntersectionObserver Cleanup
```typescript
// Existing pattern in useActiveCategory.ts - proper cleanup
useEffect(() => {
  if (!isSupported || sectionIds.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => { /* ... */ },
    { rootMargin, threshold }
  );

  // Observe elements
  sectionIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) observer.observe(element);
  });

  // CRITICAL: Cleanup
  return () => {
    observer.disconnect();
  };
}, [sectionIds, rootMargin, threshold]);
```

### requestAnimationFrame Cleanup
```typescript
// Pattern from gradients.ts AnimatedGradient class
// When using rAF, store ID and cancel in cleanup
const animationIdRef = useRef<number | null>(null);

useEffect(() => {
  const animate = () => {
    // Animation logic
    animationIdRef.current = requestAnimationFrame(animate);
  };

  animationIdRef.current = requestAnimationFrame(animate);

  return () => {
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  };
}, []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual gsap.context() | useGSAP hook | @gsap/react 2.0 | Auto cleanup, scope support |
| isMounted state | isMounted ref | React 18 | Refs don't trigger re-renders |
| Catch setState warnings | Ignore warnings (removed) | React 18 | Warnings gone but leaks still exist |
| Single effect for multiple cleanups | Separate effects per concern | React best practices | Cleaner, easier to reason about |

**Deprecated/outdated:**
- `componentWillUnmount`: Use useEffect cleanup function instead
- Checking for setState warning: React 18 removed this warning but the underlying issue remains
- Manual GSAP context management: useGSAP handles this automatically

## Open Questions

Things that couldn't be fully resolved:

1. **Real Device Testing Infrastructure**
   - What we know: Testing needed on iPhone SE and Android mid-range
   - What's unclear: Which specific Android device model to target
   - Recommendation: Use Chrome DevTools device emulation for initial testing, then manual testing on physical devices

2. **Memory Budget for iOS Safari**
   - What we know: ~100MB on iPhone SE, ~200MB on iPad
   - What's unclear: Exact thresholds vary by iOS version and device state
   - Recommendation: Target 50% of known limits as safety margin

3. **ESLint Plugin for Cleanup Patterns**
   - What we know: exhaustive-deps exists for dependency arrays
   - What's unclear: No standard ESLint rule specifically for cleanup function presence
   - Recommendation: Manual audit + code review checklist; consider custom ESLint rule later

## Sources

### Primary (HIGH confidence)
- [GSAP React Documentation](https://gsap.com/resources/React/) - useGSAP hook, context.revert(), cleanup patterns
- [@gsap/react GitHub](https://github.com/greensock/react) - Official repository
- [React useEffect documentation](https://react.dev/reference/react/useEffect) - Cleanup function patterns
- [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) - exhaustive-deps rule

### Secondary (MEDIUM confidence)
- [iOS Safari Memory Limits Article](https://lapcatsoftware.com/articles/2026/1/7.html) - Documented crash thresholds
- [React Memory Leaks Prevention](https://www.c-sharpcorner.com/article/preventing-memory-leaks-in-react-with-useeffect-hooks/) - Best practices compilation
- [LogRocket useEffect Cleanup](https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/) - Cleanup patterns

### Codebase Analysis (HIGH confidence)
- `src/lib/gsap/index.ts` - Confirmed useGSAP is properly registered
- `src/lib/hooks/useBodyScrollLock.ts` - deferRestore pattern verified
- `src/lib/hooks/useSoundEffect.ts` - AudioContext cleanup pattern verified
- `src/components/ui/Modal.tsx` - isMounted pattern, useBodyScrollLock usage verified
- `src/components/ui/Confetti.tsx` - Timer ref cleanup pattern verified
- `src/components/ui/auth/OnboardingTour.tsx` - Multiple timer ref cleanup verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with official GSAP docs and existing codebase patterns
- Architecture patterns: HIGH - Patterns verified in official docs and working in codebase
- Pitfalls: HIGH - iOS memory limits documented, GSAP cleanup well-documented
- Code examples: HIGH - Based on official docs and existing working code in codebase

**Key statistics from codebase audit:**
- 93 files use useEffect (need audit)
- 40 files use setTimeout/setInterval (priority audit)
- 8 files use GSAP/ScrollTrigger (should use useGSAP)
- 5 files use IntersectionObserver (need disconnect cleanup)
- 4 files use requestAnimationFrame (need cancelAnimationFrame)
- 3 files use AudioContext (need close cleanup)
- 23 files use addEventListener (need removeEventListener)
- 8 files already use isMounted pattern (good examples to follow)

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days - stable domain, patterns unlikely to change)
