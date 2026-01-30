# Domain Pitfalls: Mobile Optimization, Homepage Components, Offline Support

**Project:** Morning Star Delivery App - Mobile Performance & Homepage Integration
**Domain:** Next.js 16 | React 19 | GSAP + Framer Motion | iOS Safari | Service Workers | Zustand
**Researched:** 2026-01-30
**Confidence:** HIGH (verified against codebase ERROR_HISTORY.md, LEARNINGS.md, web research, and official sources)

---

## Critical Pitfalls

Mistakes that cause mobile crashes, memory leaks, or app-breaking issues.

---

### Pitfall 1: setTimeout/setInterval Not Cleaned Up on Unmount (ACTIVE IN CODEBASE)

**What goes wrong:** Mobile app crashes, page refreshes, or shows "Can't open page" error when closing modals/drawers.

**Why it happens:**
- setTimeout fires after component unmounts
- setState called on unmounted component
- iOS Safari particularly sensitive to this (crashes instead of just console warning)
- Common in animation delays, blur handlers, debounced actions

**Evidence from codebase (ERROR_HISTORY.md 2026-01-29, 2026-01-30):**
```tsx
// BROKEN - setTimeout fires after unmount
const handleBlur = useCallback(() => {
  setTimeout(() => {
    setIsFocused(false);  // Fires on unmounted component!
  }, 150);
}, []);

// BROKEN - async function continues after unmount
const handleClick = async () => {
  setState("loading");
  onAdd?.();  // Parent closes drawer here!
  setState("success");
  await new Promise((r) => setTimeout(r, 600));  // Still waiting...
  setState("idle");  // CRASH - component unmounted!
};
```

**Files already fixed (do not regress):**
- `useBodyScrollLock.ts`, `SearchInput.tsx`, `AddToCartButton.tsx`
- `AuthModal.tsx`, `OnboardingTour.tsx`, `FavoriteButton.tsx`
- `MenuContent.tsx`, `error-shake.tsx`, `AddButton.tsx`

**Prevention:**
```tsx
// Pattern 1: Track timeout in ref
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

const handleAction = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => {
    setState(newValue);
  }, delay);
}, []);

// Pattern 2: isMountedRef for async functions
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

const handleAsync = async () => {
  await someOperation();
  if (isMountedRef.current) {
    setState(newValue);  // Only update if still mounted
  }
};
```

**Detection:**
- Mobile crash/refresh on modal/drawer close
- "Can't open page" Safari error
- Chrome DevTools shows "Can't perform a React state update on an unmounted component"
- Pattern: open -> close -> crash (or open -> close -> open -> close -> crash)

**Phase mapping:** Phase 1 - Audit ALL setTimeout/setInterval usage before adding features

---

### Pitfall 2: Event Listener Accumulation from useCallback Dependencies (ACTIVE IN CODEBASE)

**What goes wrong:** First modal close works, second crashes. Event listeners accumulate because cleanup removes wrong function reference.

**Why it happens:**
- `useCallback` with `isOpen` in dependency array creates new function reference on every toggle
- `addEventListener` called with reference v1
- `removeEventListener` called with reference v2 (different!)
- Old listener (v1) remains attached, fires on wrong state

**Evidence from codebase (ERROR_HISTORY.md 2026-01-30):**
```tsx
// BROKEN - function reference changes when isOpen changes
const handleEscape = useCallback(
  (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      onClose();
    }
  },
  [isOpen, onClose]  // isOpen causes new function on every toggle
);

useEffect(() => {
  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
  // Cleanup tries to remove CURRENT reference, but listener was added with PREVIOUS reference
}, [handleEscape]);
```

**Prevention:**
```tsx
// CORRECT - handler defined INSIDE useEffect
useEffect(() => {
  if (!isOpen) return;  // Guard: no listener when closed

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen, onClose]);
```

**Detection:**
- First close works, second crashes
- Multiple event handlers firing (logged to console)
- Memory usage grows with each open/close cycle

**Phase mapping:** Phase 1 - Audit all event listener patterns in overlay components

---

### Pitfall 3: Body Scroll Lock Crashes on iOS Safari (ACTIVE IN CODEBASE)

**What goes wrong:** `window.scrollTo()` during AnimatePresence exit animation crashes iOS Safari.

**Why it happens:**
- `useBodyScrollLock` restores scroll synchronously on unmount
- AnimatePresence exit animation is still running (~200-300ms)
- iOS Safari tries to scroll while DOM is in inconsistent state
- Layout thrashing + memory pressure = crash

**Evidence from codebase (ERROR_HISTORY.md 2026-01-29):**
```tsx
// BROKEN - scrollTo races with exit animation
useEffect(() => {
  return () => {
    window.scrollTo(0, savedScrollY);  // Fires immediately on unmount
  };
}, []);

// FIXED - defer until animation complete
const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });

<AnimatePresence onExitComplete={restoreScrollPosition}>
  {isOpen && <DrawerContent />}
</AnimatePresence>
```

**Additional iOS Safari issues (from research):**
- `body { overflow: hidden }` alone doesn't prevent scroll
- Need `touch-action: none` for full iOS lock
- iOS 18 doesn't update `window.innerHeight` correctly

**Prevention:**
```tsx
// iOS-compatible scroll lock
useEffect(() => {
  if (!isLocked) return;

  const scrollY = window.scrollY;
  document.body.style.cssText = `
    position: fixed;
    top: -${scrollY}px;
    left: 0;
    right: 0;
    overflow: hidden;
    touch-action: none;
    -webkit-overflow-scrolling: none;
    overscroll-behavior: none;
  `;

  return () => {
    // Restore AFTER animation
    requestAnimationFrame(() => {
      document.body.style.cssText = '';
      window.scrollTo(0, scrollY);
    });
  };
}, [isLocked]);
```

**Detection:**
- Mobile crashes specifically when closing overlays
- Works in Chrome DevTools mobile emulator, crashes on real iPhone
- App refreshes or shows white screen

**Phase mapping:** Phase 1 - Verify scroll lock patterns before adding new overlays

**Sources:** [iOS Safari scroll lock fix](https://stripearmy.medium.com/i-fixed-a-decade-long-ios-safari-problem-0d85f76caec0), [body-scroll-lock npm](https://www.npmjs.com/package/body-scroll-lock)

---

### Pitfall 4: GSAP + Framer Motion Animation Conflicts

**What goes wrong:** Animations stutter, fight each other, or cause layout thrashing when GSAP and Framer Motion both try to animate the same element.

**Why it happens:**
- GSAP directly manipulates DOM, bypasses React
- Framer Motion works within React's render cycle
- Both can target same CSS properties (transform, opacity)
- GSAP ScrollTrigger and Framer's useScroll can conflict

**Current codebase state:**
- GSAP used for: ScrollTrigger animations, complex timelines
- Framer Motion used for: Page transitions, AnimatePresence, hover/tap
- Risk areas: Homepage sections using both libraries

**Prevention:**

1. **Clear ownership per element:**
   ```tsx
   // WRONG - both animate same element
   <motion.div whileHover={{ scale: 1.05 }}>
     <div ref={gsapRef}>Content</div>  // GSAP also animating this
   </motion.div>

   // CORRECT - separate concerns
   <motion.div whileHover={{ scale: 1.05 }}>
     <div>Framer handles hover</div>
   </motion.div>
   <div ref={gsapRef}>GSAP handles scroll</div>
   ```

2. **Use one library per animation type:**
   | Animation Type | Use |
   |---------------|-----|
   | Enter/exit transitions | Framer Motion (AnimatePresence) |
   | Scroll-triggered | GSAP ScrollTrigger |
   | Hover/tap gestures | Framer Motion |
   | Complex timelines | GSAP |
   | Layout animations | Framer Motion (layout prop) |

3. **Clean up GSAP in useEffect:**
   ```tsx
   useEffect(() => {
     const ctx = gsap.context(() => {
       gsap.from(element, { opacity: 0 });
     }, containerRef);

     return () => ctx.revert();  // CRITICAL for cleanup
   }, []);
   ```

4. **Don't use GSAP for React state-driven UI:**
   ```tsx
   // WRONG - fighting React
   gsap.to(element, { display: isOpen ? 'block' : 'none' });

   // CORRECT - let React handle visibility
   {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
   ```

**Detection:**
- Animations "jump" or reset mid-way
- Double animations visible
- Memory leaks from uncleaned GSAP timelines
- Performance degrades over time

**Phase mapping:** Phase 2 - Establish animation ownership before building homepage sections

**Sources:** [GSAP vs Motion comparison](https://motion.dev/docs/gsap-vs-motion), [GSAP React best practices](https://gsap.com/community/forums/topic/38826-why-gsap-but-not-framer-motion/)

---

### Pitfall 5: AnimatePresence Exit Animation Memory Leaks

**What goes wrong:** Components don't unmount properly, memory grows with each modal open/close, eventually crashes.

**Why it happens:**
- Child removed from DOM mid-animation
- React Fragment as direct child breaks key tracking
- State changes during exit animation
- Motion version bugs (fixed in 12.23.28+)

**Evidence from research (Motion changelog):**
- "Fix duplicate exit animations in AnimatePresence" (v12.23.28, Jan 2026)
- "Remove memory leak from retained matchMedia callbacks"
- "Fix MotionStyle type with React 19"

**Prevention:**

1. **Never use Fragment as direct child:**
   ```tsx
   // BROKEN - Fragment doesn't register as keyed child
   <AnimatePresence>
     <>
       <motion.div key="a">A</motion.div>
       <motion.div key="b">B</motion.div>
     </>
   </AnimatePresence>

   // CORRECT - direct keyed children
   <AnimatePresence>
     <motion.div key="a">A</motion.div>
     <motion.div key="b">B</motion.div>
   </AnimatePresence>
   ```

2. **Stable keys (not index-based):**
   ```tsx
   // BROKEN - index changes when items reorder
   {items.map((item, i) => <motion.div key={i} />)}

   // CORRECT - stable unique ID
   {items.map((item) => <motion.div key={item.id} />)}
   ```

3. **Don't change state rapidly during animations:**
   ```tsx
   // Risk: AnimatePresence gets stuck
   const handleClose = () => {
     setIsOpen(false);
     setIsOpen(true);   // Immediately! Bad.
     setIsOpen(false);
   };
   ```

4. **Use mode="wait" for sequential transitions:**
   ```tsx
   <AnimatePresence mode="wait">
     {step === 1 && <Step1 key="step1" />}
     {step === 2 && <Step2 key="step2" />}
   </AnimatePresence>
   ```

**Detection:**
- Memory usage grows in DevTools Performance monitor
- Exit animations don't play (immediate removal)
- Double animations playing simultaneously
- "AnimatePresence gets stuck" behavior

**Phase mapping:** Phase 2 - Audit AnimatePresence usage before adding homepage transitions

**Sources:** [AnimatePresence memory leak issue](https://github.com/framer/motion/issues/625), [AnimatePresence stuck bug](https://github.com/framer/motion/issues/2554)

---

### Pitfall 6: Service Worker + Next.js App Router Conflicts

**What goes wrong:** Stale content served, navigation breaks, or app stuck in old version after deploy.

**Why it happens:**
- Service worker caches HTML pages by default
- Next.js App Router uses client-side navigation
- SW serves stale cached HTML, ignoring server updates
- next-pwa library not maintained for App Router

**Current state:** No service worker in codebase yet.

**Prevention:**

1. **Use Serwist instead of next-pwa:**
   ```tsx
   // next-pwa is abandoned, use Serwist
   // npm install @serwist/next
   ```

2. **Never cache HTML/RSC payloads:**
   ```ts
   // sw-config.ts
   runtimeCaching: [
     {
       urlPattern: /^https:\/\/.*\.(js|css|woff2)$/,
       handler: 'CacheFirst',
     },
     {
       urlPattern: /^https:\/\/.*\.json$/,  // API responses
       handler: 'NetworkFirst',
     },
     // DON'T cache HTML or RSC
   ]
   ```

3. **Handle update prompt:**
   ```tsx
   useEffect(() => {
     if ('serviceWorker' in navigator) {
       navigator.serviceWorker.addEventListener('controllerchange', () => {
         // New SW activated - prompt reload
         if (confirm('New version available. Reload?')) {
           window.location.reload();
         }
       });
     }
   }, []);
   ```

4. **Turbopack compatibility:**
   ```json
   // package.json - Serwist needs Webpack
   "scripts": {
     "build": "next build --webpack"
   }
   ```

5. **Don't redirect SW requests:**
   ```
   // vercel.json or server config
   // SW must be served from same origin, no redirects
   ```

**Detection:**
- Users see old content after deploy
- Navigation works first time, then breaks
- "Service worker registration failed" in console
- Build errors with Turbopack

**Phase mapping:** Phase 3 - Add service worker AFTER core features stable

**Sources:** [Next.js PWA official guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [Serwist migration guide](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7), [Next.js 16 PWA with offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support)

---

### Pitfall 7: Image Loading Causes Layout Shift (CLS)

**What goes wrong:** Page content jumps as images load, hurting Core Web Vitals and user experience.

**Why it happens:**
- Image dimensions not specified
- Lazy loading without placeholder
- Using fill without sized parent
- Safari < 15 aspect-ratio bugs

**Current codebase has BlurImage component, but new components may regress.**

**Prevention:**

1. **Always specify width/height:**
   ```tsx
   // WRONG - no dimensions
   <Image src="/food.jpg" alt="Food" />

   // CORRECT - dimensions specified
   <Image src="/food.jpg" alt="Food" width={400} height={300} />
   ```

2. **Use placeholder for lazy images:**
   ```tsx
   <Image
     src="/food.jpg"
     alt="Food"
     width={400}
     height={300}
     placeholder="blur"
     blurDataURL={base64Placeholder}
   />
   ```

3. **Fill requires sized parent:**
   ```tsx
   // WRONG - parent has no size
   <div>
     <Image src="/hero.jpg" fill alt="" />
   </div>

   // CORRECT - parent has explicit dimensions
   <div className="relative h-[400px] w-full">
     <Image src="/hero.jpg" fill alt="" sizes="100vw" />
   </div>
   ```

4. **Use priority for above-fold:**
   ```tsx
   // Hero images should preload
   <Image
     src="/hero.jpg"
     priority  // Disables lazy loading, preloads
     alt=""
     width={1200}
     height={600}
   />
   ```

5. **Use deviceSizes for responsive:**
   ```ts
   // next.config.ts
   images: {
     deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
   }
   ```

**Detection:**
- Lighthouse CLS score > 0.1
- Content visibly jumps on load
- Images appear to "pop in"

**Phase mapping:** Phase 2 - All homepage images need proper sizing

**Sources:** [Next.js Image optimization](https://nextjs.org/docs/app/getting-started/images), [CLS fix with Next.js Image](https://dev.to/oba1dkhan/how-nextjs-image-component-solves-layout-shift-issues-2117)

---

### Pitfall 8: Zustand Store Memory Leaks from Subscriptions

**What goes wrong:** Memory usage grows over time, eventually causing mobile crash or slowdown.

**Why it happens:**
- Subscriptions not cleaned up on unmount
- Large monolithic stores never garbage collected
- Storing non-serializable data (functions, class instances)

**Current codebase:** Uses Zustand for cart, checkout, driver stores.

**Prevention:**

1. **Small independent stores over monolithic:**
   ```tsx
   // BETTER - can be garbage collected when unused
   const useCartStore = create(() => ({ items: [] }));
   const useCheckoutStore = create(() => ({ step: 1 }));

   // WORSE - entire store stays in memory forever
   const useAppStore = create(() => ({
     cart: { items: [] },
     checkout: { step: 1 },
     user: { ... },
     // etc.
   }));
   ```

2. **Clean up manual subscriptions:**
   ```tsx
   useEffect(() => {
     const unsubscribe = useCartStore.subscribe(
       (state) => state.items,
       (items) => console.log(items)
     );
     return unsubscribe;  // CRITICAL
   }, []);
   ```

3. **Don't store functions or class instances:**
   ```tsx
   // WRONG - function stored in state
   const useStore = create((set) => ({
     callback: () => {},  // Never garbage collected
   }));

   // CORRECT - store data, compute functions
   const useStore = create((set) => ({
     count: 0,
   }));
   const getCallback = () => () => useStore.getState().count;
   ```

4. **Use selectors to prevent unnecessary re-renders:**
   ```tsx
   // WRONG - re-renders on ANY store change
   const store = useCartStore();

   // CORRECT - only re-renders when items change
   const items = useCartStore((state) => state.items);
   ```

**Detection:**
- Memory tab shows growing heap
- App slows down over time
- Mobile eventually crashes after extended use

**Phase mapping:** Phase 1 - Review store structure before adding offline sync

**Sources:** [Zustand memory discussion](https://github.com/pmndrs/zustand/discussions/2540), [React state management 2025](https://www.zignuts.com/blog/react-state-management-2025)

---

## Moderate Pitfalls

Mistakes that cause performance issues, visual bugs, or maintenance burden.

---

### Pitfall 9: CSS 3D Transforms + Stacking Context = Content Disappearing

**What goes wrong:** Adding `preserve-3d`, `perspective`, or CSS 3D rotation causes content to flicker, disappear during hover, or render behind other elements.

**Already documented in codebase LEARNINGS.md.** Key points:
- `transform-style: preserve-3d` creates new stacking context
- `overflow: hidden/auto/scroll` forces `preserve-3d` to `flat`
- `opacity < 1` forces `preserve-3d` to `flat`
- Scale transforms combined with 3D rotation create conflicts

**Prevention:** See existing LEARNINGS.md entry. Key rule:
```tsx
// When using 3D tilt, disable Framer Motion scale
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={!shouldEnableTilt ? { scale: 1.03 } : undefined}
>
```

**Phase mapping:** Phase 2 - Hero implementation

---

### Pitfall 10: Offline Caching Stale Data

**What goes wrong:** User sees old prices, unavailable items, or out-of-sync cart after going offline/online.

**Why it happens:**
- IndexedDB/localStorage not invalidated on reconnect
- Cache-first strategy serves stale data indefinitely
- No timestamp validation on cached data

**Prevention:**

1. **Version cached data:**
   ```tsx
   const CACHE_VERSION = 1;

   function getCachedMenu() {
     const cached = localStorage.getItem('menu');
     if (cached) {
       const { version, data, timestamp } = JSON.parse(cached);
       if (version !== CACHE_VERSION) return null;  // Invalidate
       if (Date.now() - timestamp > 1000 * 60 * 60) return null;  // 1hr max
       return data;
     }
     return null;
   }
   ```

2. **Revalidate on reconnect:**
   ```tsx
   useEffect(() => {
     const handleOnline = () => {
       queryClient.invalidateQueries(['menu']);  // Force refetch
     };
     window.addEventListener('online', handleOnline);
     return () => window.removeEventListener('online', handleOnline);
   }, []);
   ```

3. **Show stale indicator:**
   ```tsx
   {isOffline && <Banner>Showing cached data. Some items may be unavailable.</Banner>}
   ```

4. **Don't cache prices in service worker:**
   ```ts
   // Prices should always be network-first
   runtimeCaching: [
     {
       urlPattern: /\/api\/menu/,
       handler: 'NetworkFirst',
       options: { networkTimeoutSeconds: 3 }
     }
   ]
   ```

**Detection:**
- User complaints about wrong prices
- "Item unavailable" after ordering
- Cart total doesn't match checkout

**Phase mapping:** Phase 3 - Offline support

---

### Pitfall 11: willChange Causing GPU Memory Pressure

**What goes wrong:** Page becomes janky, animations stutter, mobile device overheats.

**Why it happens:**
- `will-change: transform` creates GPU layer
- Too many layers = memory pressure
- Permanent will-change wastes resources

**Evidence from codebase (LEARNINGS.md 2026-01-29):**
```tsx
// WRONG - always creates GPU layer
<div style={{ willChange: "transform" }} />

// CORRECT - layer only when needed
<div
  style={{ willChange: isHovered ? "transform" : "auto" }}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
/>
```

**Prevention:**
- Only add willChange during interaction
- Remove after animation completes
- Limit to 2-3 animated elements at a time on mobile

**Phase mapping:** Phase 2 - Homepage animations

---

### Pitfall 12: Portal Dropdown Behind Transformed Parent

**What goes wrong:** Autocomplete/dropdown renders behind parent card that has Framer Motion transforms.

**Why it happens:**
- CSS transforms create new stacking context
- z-index cannot escape parent's stacking context
- Dropdown z-index:9999 still behind parent transform

**Evidence from codebase (LEARNINGS.md 2026-01-29):**
```tsx
// CORRECT - use React Portal to escape stacking context
{isMounted && createPortal(
  <div
    style={{
      position: "absolute",
      top: position?.top,
      left: position?.left,
      width: position?.width,
      zIndex: 9999,
    }}
  >
    {dropdownContent}
  </div>,
  document.body
)}
```

**Prevention:**
- Use portals for all dropdowns/tooltips
- Calculate position from getBoundingClientRect
- Account for scroll position

**Phase mapping:** Phase 2 - Any autocomplete in homepage components

---

### Pitfall 13: Double-Add Mutations from Callback + Direct Call

**What goes wrong:** Items added to cart twice, quantities doubled.

**Evidence from codebase (ERROR_HISTORY.md 2026-01-26):**
```tsx
// BROKEN - component mutates AND triggers callback that also mutates
const handleClick = async () => {
  addItem({ ...item });  // First add
  onAdd?.();             // Parent's onAdd also calls addItem() -> Second add
};

// CORRECT - component only triggers callback
const handleClick = async () => {
  playAnimation();   // UI only
  onAdd?.();         // Parent is SOLE owner of mutation
};
```

**Prevention:**
- One mutation owner principle
- Buttons only trigger callbacks, never direct mutations
- Store-level debounce as safety net

**Phase mapping:** Phase 2 - Any new add-to-cart buttons

---

## Minor Pitfalls

Annoyances that waste time but are easily fixed.

---

### Pitfall 14: requestAnimationFrame Not Cleaned Up

**What goes wrong:** Animations continue after unmount, console errors, memory leaks.

**Prevention:**
```tsx
useEffect(() => {
  let rafId: number;

  const animate = () => {
    // animation logic
    rafId = requestAnimationFrame(animate);
  };
  rafId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(rafId);
}, []);
```

---

### Pitfall 15: AudioContext Not Closed

**What goes wrong:** Browser limits audio contexts (6 per page), haptic/sound effects stop working.

**Prevention:**
```tsx
useEffect(() => {
  const audioContext = new AudioContext();

  return () => {
    audioContext.close();
  };
}, []);
```

---

### Pitfall 16: IntersectionObserver Not Disconnected

**What goes wrong:** Multiple observers accumulate, performance degrades.

**Prevention:**
```tsx
useEffect(() => {
  const observer = new IntersectionObserver(callback, options);
  if (elementRef.current) observer.observe(elementRef.current);

  return () => observer.disconnect();
}, []);
```

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Audit | Uncleaned setTimeout | grep for `setTimeout` without `clearTimeout` |
| Phase 1 | Audit | Event listener accumulation | Review all useCallback + addEventListener |
| Phase 1 | Audit | Scroll lock patterns | Verify deferRestore used with AnimatePresence |
| Phase 2 | Homepage | GSAP/Framer conflict | Assign clear ownership per element |
| Phase 2 | Homepage | AnimatePresence memory | No Fragments as direct children |
| Phase 2 | Homepage | Image CLS | All images need width/height |
| Phase 2 | Homepage | willChange abuse | Only apply during interaction |
| Phase 3 | Offline | Stale cache | Version + timestamp all cached data |
| Phase 3 | Offline | SW + App Router | Use Serwist, never cache HTML |
| Phase 3 | Offline | Reconnect sync | Invalidate queries on 'online' event |

---

## Prevention Checklist

### Before adding any setTimeout/setInterval:
- [ ] Timeout ref created
- [ ] Cleanup effect added
- [ ] Cleared before setting new timeout

### Before adding event listeners:
- [ ] Handler defined INSIDE useEffect (not useCallback)
- [ ] Guard clause for closed state
- [ ] Same reference for add/remove

### Before adding overlays/modals:
- [ ] Body scroll lock uses deferRestore
- [ ] restoreScrollPosition called in onExitComplete
- [ ] Tested on real iOS device

### Before adding GSAP animations:
- [ ] No Framer Motion on same element
- [ ] gsap.context() used with ref
- [ ] ctx.revert() in cleanup
- [ ] ScrollTrigger.kill() if using scroll

### Before adding AnimatePresence:
- [ ] No Fragment as direct child
- [ ] Stable keys (not index)
- [ ] Motion version 12.23.28+

### Before adding service worker:
- [ ] Using Serwist (not next-pwa)
- [ ] HTML not cached
- [ ] Update prompt implemented
- [ ] Build uses --webpack flag

### Before adding offline caching:
- [ ] Cache versioned
- [ ] Timestamp checked
- [ ] Revalidate on reconnect
- [ ] Stale indicator shown

---

## Sources

**Codebase Documentation:**
- `.claude/ERROR_HISTORY.md` (2026-01-25 to 2026-01-30) - Mobile crash patterns
- `.claude/LEARNINGS.md` (2026-01-25 to 2026-01-30) - Fix patterns

**Official Documentation:**
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Framer Motion AnimatePresence](https://www.framer.com/motion/animate-presence/)
- [GSAP React](https://gsap.com/resources/React/)
- [Zustand](https://github.com/pmndrs/zustand)

**Community Resources:**
- [iOS Safari scroll lock fix](https://stripearmy.medium.com/i-fixed-a-decade-long-ios-safari-problem-0d85f76caec0)
- [body-scroll-lock npm](https://www.npmjs.com/package/body-scroll-lock)
- [GSAP vs Motion comparison](https://motion.dev/docs/gsap-vs-motion)
- [Serwist migration guide](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7)
- [Next.js 16 PWA](https://blog.logrocket.com/nextjs-16-pwa-offline-support)

**GitHub Issues:**
- [AnimatePresence memory leak](https://github.com/framer/motion/issues/625)
- [AnimatePresence stuck bug](https://github.com/framer/motion/issues/2554)
- [AnimatePresence portal bug](https://github.com/framer/motion/issues/2692)
- [Zustand memory discussion](https://github.com/pmndrs/zustand/discussions/2540)
- [react-modal iOS scroll](https://github.com/reactjs/react-modal/issues/829)
