# Cleanup Patterns Guide

Comprehensive guide for proper cleanup in React components to prevent memory leaks and crashes, especially on iOS Safari with its aggressive memory management.

## Why Cleanup Matters

1. **iOS Safari Memory Limits** - Safari on iOS has strict memory limits (~200-400MB for web apps). Leaked timers, observers, and DOM references can quickly exhaust this budget, causing hard crashes with no error message.

2. **React Strict Mode** - In development, React mounts components twice to detect cleanup issues. Without proper cleanup, you'll see double effects and state warnings.

3. **Hot Module Replacement** - During development, HMR unmounts and remounts components. Leaked resources accumulate with each HMR cycle.

4. **Route Changes** - When navigating between pages, components unmount. Async operations completing after unmount cause "setState on unmounted component" warnings.

---

## Timer Cleanup

### Problem: Timers Running After Unmount

```tsx
// BAD: setTimeout without cleanup
function BadComponent() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // This timer keeps running after unmount!
    setTimeout(() => {
      setMessage("Hello"); // Warning: setState on unmounted component
    }, 3000);
  }, []);
}
```

### Solution 1: useSafeTimeout Hook (Recommended)

```tsx
import { useSafeTimeout } from "@/lib/hooks";

function GoodComponent() {
  const [message, setMessage] = useState("");
  const timeout = useSafeTimeout();

  useEffect(() => {
    // Automatically cleared on unmount
    timeout.set(() => {
      setMessage("Hello");
    }, 3000);
  }, [timeout]);
}
```

### Solution 2: Manual Cleanup with Ref

```tsx
// GOOD: Manual cleanup pattern
function GoodComponent() {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setMessage("Hello");
    }, 3000);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
```

### Solution 3: useSafeInterval for Recurring Timers

```tsx
import { useSafeInterval } from "@/lib/hooks";

function Clock() {
  const [time, setTime] = useState(new Date());
  const interval = useSafeInterval();

  useEffect(() => {
    interval.set(() => {
      setTime(new Date());
    }, 1000);
  }, [interval]);

  return <span>{time.toLocaleTimeString()}</span>;
}
```

---

## Event Listener Cleanup

### Problem: Event Listeners Not Removed

```tsx
// BAD: addEventListener without cleanup
function BadComponent() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    // Listener keeps running forever!
    window.addEventListener("keydown", handleKeyDown);
  }, []);
}
```

### Solution: Matching removeEventListener

```tsx
// GOOD: Proper event listener cleanup
function GoodComponent() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
```

### Important: Use Stable References

```tsx
// BAD: Inline function creates new reference each render
useEffect(() => {
  // This won't be removed because removeEventListener
  // receives a different function reference
  window.addEventListener("scroll", () => setScrollY(window.scrollY));
}, []);

// GOOD: Stable function reference
function GoodComponent() {
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);
}
```

### One-Time Listeners

```tsx
// GOOD: Self-removing listener with { once: true }
useEffect(() => {
  const handleFirstClick = () => {
    initializeAudio();
  };

  // Automatically removed after first trigger
  window.addEventListener("click", handleFirstClick, { once: true });

  return () => {
    window.removeEventListener("click", handleFirstClick);
  };
}, []);
```

---

## GSAP Animation Cleanup

### Problem: GSAP Animations Not Killed

```tsx
// BAD: gsap.to() in useEffect without cleanup
function BadComponent() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation keeps running after unmount!
    gsap.to(ref.current, { x: 100, duration: 1 });
  }, []);
}
```

### Solution 1: useGSAP Hook (Recommended)

```tsx
import { gsap, useGSAP } from "@/lib/gsap";

function GoodComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animations auto-cleaned by scope
    gsap.to(".item", { x: 100, duration: 1 });
  }, { scope: containerRef });

  return <div ref={containerRef}>...</div>;
}
```

### Solution 2: Manual Timeline Cleanup

```tsx
function GoodComponent() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.to(ref.current, { x: 100, duration: 1 });

    return () => {
      tl.kill(); // Kill timeline on unmount
    };
  }, []);
}
```

### contextSafe for Event Handlers

```tsx
import { useGSAP } from "@/lib/gsap";

function GoodComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Wrap event handler animations with contextSafe
  const handleClick = contextSafe(() => {
    gsap.to(".button", { scale: 1.1, duration: 0.2 });
  });

  return (
    <div ref={containerRef}>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

---

## Observer Cleanup

### Problem: IntersectionObserver Not Disconnected

```tsx
// BAD: Observer never disconnected
function BadComponent() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Handle intersection...
    });

    observer.observe(elementRef.current!);
    // Missing disconnect!
  }, []);
}
```

### Solution: disconnect() in Cleanup

```tsx
// GOOD: Proper observer cleanup
function GoodComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={elementRef}>...</div>;
}
```

### ResizeObserver

```tsx
useEffect(() => {
  const element = elementRef.current;
  if (!element) return;

  const resizeObserver = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    setDimensions({ width, height });
  });

  resizeObserver.observe(element);

  return () => {
    resizeObserver.disconnect();
  };
}, []);
```

---

## Async Operation Cleanup

### Problem: setState After Unmount

```tsx
// BAD: No mount check for async operations
function BadComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Warning if component unmounted during fetch!
        setUser(data);
      });
  }, [userId]);
}
```

### Solution 1: useSafeAsync Hook (Recommended)

```tsx
import { useSafeAsync } from "@/lib/hooks";

function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);
  const { execute, isMounted } = useSafeAsync();

  useEffect(() => {
    execute(async (signal) => {
      const res = await fetch(`/api/users/${userId}`, { signal });
      return res.json();
    }).then((result) => {
      if (result !== null) {
        setUser(result);
      }
    });
  }, [userId, execute]);
}
```

### Solution 2: useMountedRef

```tsx
import { useMountedRef } from "@/lib/hooks";

function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);
  const isMountedRef = useMountedRef();

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMountedRef.current) {
          setUser(data);
        }
      });
  }, [userId]);
}
```

### Solution 3: AbortController

```tsx
function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch(`/api/users/${userId}`, { signal: abortController.signal })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [userId]);
}
```

---

## Audio Cleanup

### Problem: AudioContext Not Closed

```tsx
// BAD: New AudioContext created per action
function BadComponent() {
  const playSound = () => {
    // Creates new context each time - memory leak!
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  };
}
```

### Solution: Reuse Context, Close on Unmount

```tsx
// GOOD: Single context, proper cleanup
function GoodComponent() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Lazy initialization
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playSound = () => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  };
}
```

See `@/lib/hooks/useSoundEffect` for a complete implementation.

---

## Modal Scroll Lock

### Problem: Scroll Position Lost on Close

```tsx
// BAD: Basic scroll lock without deferred restore
function BadModal({ isOpen, onClose }) {
  useBodyScrollLock(isOpen);
  // Scroll position may be lost if restored before exit animation completes
}
```

### Solution: deferRestore with onExitComplete

```tsx
// GOOD: Deferred scroll restore
function GoodModal({ isOpen, onClose }) {
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, {
    deferRestore: true, // Don't restore immediately on unmount
  });

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

See `@/components/ui/Modal` and `@/components/ui/Drawer` for examples.

---

## Quick Reference

| Pattern | Hook/Solution |
|---------|---------------|
| setTimeout | `useSafeTimeout()` |
| setInterval | `useSafeInterval()` |
| async/await | `useSafeAsync()` |
| Mount check | `useMountedRef()` |
| GSAP animations | `useGSAP()` from `@/lib/gsap` |
| Event listeners | Manual cleanup with stable refs |
| Observers | `disconnect()` in cleanup |
| AudioContext | Single context, `close()` on unmount |
| Scroll lock | `useBodyScrollLock()` with `deferRestore: true` |

---

## ESLint Enforcement

Consider adding `eslint-plugin-react-hooks` exhaustive-deps rule and custom rules for:
- Detecting `setTimeout` without `clearTimeout` in same effect
- Detecting `addEventListener` without matching `removeEventListener`
- Detecting `gsap.to/from` outside of `useGSAP`

---

*Created: 2026-01-30*
*Part of Phase 35: Mobile Crash Prevention*
