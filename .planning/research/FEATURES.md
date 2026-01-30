# Feature Landscape: Homepage Completion, Mobile Optimization & Offline Support

**Domain:** Food delivery app - homepage integration + mobile performance + customer offline support
**Researched:** 2026-01-30
**Mode:** Feature research for subsequent milestone
**Confidence:** HIGH (codebase analysis verified + industry best practices)

---

## Context: What This Milestone Addresses

This research covers three interconnected areas for the Morning Star Delivery App:

1. **Homepage Component Integration** - 5 existing components (Hero, CTABanner, HowItWorksSection, TestimonialsCarousel, FooterCTA) are already built and wired in. Focus shifts to polish, performance, and mobile optimization.

2. **Mobile Performance Optimization** - App experiencing crashes on mobile devices. Need systematic optimization for mobile-first experience.

3. **Customer Offline Support** - Driver app has IndexedDB offline support (`offline-store.ts`, `useOfflineSync.ts`). Customer-facing features need similar resilience patterns.

---

## Existing Features (Already Built - Reference Only)

### Homepage Components (All Wired In)

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `Hero` | `src/components/ui/homepage/Hero.tsx` | Complete | Parallax, floating emojis, time-of-day greeting |
| `HowItWorksSection` | `src/components/ui/homepage/HowItWorksSection.tsx` | Complete | Lazy-loaded to defer Google Maps (369KB) |
| `CTABanner` | `src/components/ui/homepage/CTABanner.tsx` | Complete | Pulsing glow, floating entrance |
| `TestimonialsCarousel` | `src/components/ui/homepage/TestimonialsCarousel.tsx` | Complete | Auto-rotation, NavDots, pause on hover |
| `FooterCTA` | `src/components/ui/homepage/FooterCTA.tsx` | Complete | CTA + contact info + social |
| `HomepageMenuSection` | `src/components/ui/homepage/HomepageMenuSection.tsx` | Complete | Featured carousel, category tabs, search |
| `HomePageClient` | `src/components/ui/homepage/HomePageClient.tsx` | Complete | Orchestrates all sections |

### Mobile Infrastructure (Already Built)

| Feature | Location | Status |
|---------|----------|--------|
| `useAnimationPreference` | `src/lib/hooks/useAnimationPreference.ts` | Complete - respects reduced motion |
| `useCanHover` | `src/lib/hooks/useResponsive.ts` | Complete - detects touch devices |
| Image optimization utilities | `src/lib/utils/image-optimization.ts` | Complete - size presets, blur placeholders |
| MenuSkeleton | `src/components/ui/menu/MenuSkeleton.tsx` | Complete - shimmer animations |
| Driver offline store | `src/lib/services/offline-store.ts` | Complete - IndexedDB for driver app |
| useOfflineSync hook | `src/lib/hooks/useOfflineSync.ts` | Complete - driver app only |

---

## Table Stakes: Mobile Performance (Must Have)

Features users expect. Missing = app feels broken on mobile.

| Feature | Why Expected | Complexity | Current State | Priority |
|---------|--------------|------------|---------------|----------|
| **Sub-2.5s LCP on mobile** | Google Core Web Vital threshold, user perception | Medium | Needs audit - HowItWorks lazy loading helps | P0 |
| **No layout shifts (CLS < 0.1)** | Content jumping is jarring | Low | Good - explicit dimensions used | P1 |
| **No crashes on mobile** | Basic stability | High | **Active issue** - crashes reported | P0 |
| **Responsive images** | Mobile bandwidth constraints | Low | `next/image` with sizes configured | P1 |
| **Touch-friendly targets** | Minimum 44x44px touch targets | Low | Needs audit | P1 |
| **Smooth scrolling** | 60fps even during animations | Medium | Animation tokens exist, may over-animate | P0 |
| **Memory management** | Prevent OOM crashes | Medium | Need cleanup audit (timers, listeners, GSAP) | P0 |

### Mobile Crash Root Cause Analysis

Based on recent git commits and debug files:

| Commit | Issue Fixed | Pattern |
|--------|-------------|---------|
| `1486c38` | setTimeout cleanup for unmounted state updates | Missing cleanup in useEffect |
| `deabb17` | Race conditions causing random crashes | Async operations without mount checks |
| `a08d2ff` | Performance optimization, dead code removal | Bundle bloat |
| `9ced763` | rAF, AudioContext, GSAP timelines, async timeouts | Improper resource cleanup |

**Common patterns causing crashes:**
1. **Missing cleanup in useEffect** - Timers, subscriptions, async operations
2. **State updates on unmounted components** - Need `isMounted` ref pattern
3. **Heavy animations on low-power devices** - GSAP timelines not properly killed
4. **Memory leaks** - Event listeners not removed, large objects retained

### Recommended Mobile Performance Fixes

```typescript
// Pattern: Safe async with mount check
useEffect(() => {
  let isMounted = true;
  const controller = new AbortController();

  async function fetchData() {
    try {
      const result = await api.get(url, { signal: controller.signal });
      if (isMounted) {
        setState(result);
      }
    } catch (e) {
      if (e.name !== 'AbortError' && isMounted) {
        setError(e);
      }
    }
  }

  fetchData();

  return () => {
    isMounted = false;
    controller.abort();
  };
}, []);
```

---

## Table Stakes: Skeleton Loading States (Must Have)

| Feature | Why Expected | Complexity | Current State | Priority |
|---------|--------------|------------|---------------|----------|
| **Menu skeleton** | Prevent empty flash | Low | **Complete** - MenuSkeleton.tsx | Done |
| **Homepage skeleton** | Prevent loading blank | Low | **Complete** - HowItWorksSkeleton inline | Done |
| **Cart skeleton** | Quick drawer open | Low | Not implemented | P2 |
| **Checkout skeleton** | Multi-step loading | Low | Not implemented | P2 |
| **Order history skeleton** | List loading state | Low | Not implemented | P2 |

### Skeleton Best Practices (Verified)

| Best Practice | Implementation | Notes |
|---------------|----------------|-------|
| Match content structure | Skeleton matches real content layout | Prevents CLS on load |
| Shimmer animation | CSS `animate-shimmer` keyframes | Already defined in globals.css |
| Respect reduced motion | Disable shimmer for `prefers-reduced-motion` | Use `shouldAnimate` from hook |
| Staggered reveal | CSS `stagger-1` through `stagger-8` classes | Already in MenuSkeleton |

---

## Table Stakes: Customer Offline Support (Must Have)

| Feature | Why Expected | Complexity | Current State | Priority |
|---------|--------------|------------|---------------|----------|
| **Offline menu browsing** | View menu without network | Medium | Not implemented for customers | P1 |
| **Cart persistence** | Don't lose cart on refresh | Low | **Complete** - Zustand persist | Done |
| **Connection status indicator** | Know when offline | Low | Driver app only | P1 |
| **Graceful degradation** | Show cached content vs error | Medium | Not implemented | P1 |

### Existing Offline Architecture (Driver App)

```
src/lib/services/offline-store.ts
  - IndexedDB wrapper for driver-specific data
  - route-cache, pending-status, pending-photos, pending-locations stores

src/lib/hooks/useOfflineSync.ts
  - Online/offline detection via navigator.onLine
  - Auto-sync when coming back online
  - Queue methods for offline operations
```

**Gap Analysis:** Customer app needs similar patterns:
- Cache menu data for offline browsing
- Show connection status banner
- Queue orders for submission when online (stretch goal)

---

## Differentiators: Homepage Experience (Competitive Advantage)

Features that set the app apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Dependencies | Priority |
|---------|-------------------|------------|--------------|----------|
| **Time-of-day greeting** | Personalized, delightful | Low | **Complete** - in Hero.tsx | Done |
| **Interactive coverage checker** | Converts visitors, reduces support | Medium | **Complete** - in HowItWorksSection | Done |
| **Featured carousel** | Highlights best sellers | Medium | **Complete** - in HomepageMenuSection | Done |
| **Floating food emojis** | Playful brand identity | Low | **Complete** - in Hero.tsx | Done |
| **Scroll-linked section nav** | Easy navigation | Low | **Complete** - SectionNavDots | Done |
| **Parallax hero** | Premium feel | Low | **Complete** - multi-layer parallax | Done |
| **View-in-dark-mode preview** | Decision helper for new users | Medium | Not implemented | P3 |

---

## Differentiators: Mobile-First Optimizations

| Feature | Value Proposition | Complexity | Notes | Priority |
|---------|-------------------|------------|-------|----------|
| **Device-based animation scaling** | Better UX on low-power devices | Medium | Reduce/disable animations based on device | P1 |
| **Optimistic UI for cart** | Instant feedback | Low | Add to cart shows immediately | P2 |
| **Native app-like transitions** | Premium feel | Medium | View Transitions API (already used for theme) | P2 |
| **Pull-to-refresh** | Mobile UX pattern | Low | Not standard for web, consider for PWA | P3 |
| **Haptic feedback** | Tactile confirmation | Low | Limited browser support | P3 |

### Device-Based Animation Scaling

```typescript
// Recommended pattern
function useDeviceCapability() {
  const [capability, setCapability] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    // Check device memory (Chrome only)
    const memory = (navigator as any).deviceMemory;
    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency;
    // Check connection type
    const connection = (navigator as any).connection?.effectiveType;

    if (memory && memory < 2) setCapability('low');
    else if (cores && cores < 4) setCapability('medium');
    else if (connection === '2g' || connection === 'slow-2g') setCapability('low');
    else if (connection === '3g') setCapability('medium');
  }, []);

  return capability;
}

// Usage in animation components
const capability = useDeviceCapability();
const shouldAnimate = capability !== 'low' && !prefersReducedMotion;
const animationDuration = capability === 'high' ? 0.3 : 0.15;
```

---

## Anti-Features (Do NOT Build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full PWA with service worker caching** | Complexity, cache invalidation bugs | Simple menu caching only for MVP |
| **Offline order submission** | Payment requires network, inventory sync issues | Show "order requires connection" message |
| **Aggressive prefetching** | Wastes mobile data, slows current page | Prefetch only on hover/focus (Next.js default) |
| **Client-side image optimization** | CPU intensive on mobile | Use next/image server-side optimization |
| **Complex loading orchestration** | Hard to maintain, race conditions | Simple Suspense boundaries |
| **Custom skeleton library** | Maintenance burden | Use simple CSS + existing utilities |
| **Intersection Observer for every element** | Performance overhead | Use CSS scroll-snap or virtual lists |
| **Background sync for all data** | Over-engineering | Only for critical user data |

---

## Feature Dependencies

```
Mobile Performance Optimization:
  Audit existing useEffect hooks
    -> Add cleanup patterns
      -> Add isMounted checks for async
        -> Add GSAP timeline cleanup
          -> Test on low-power devices
            -> Device capability detection

Skeleton States:
  Existing MenuSkeleton pattern
    -> CartDrawer skeleton
    -> Checkout step skeletons
    -> Order history skeleton

Customer Offline Support:
  Existing driver offline-store.ts
    -> Create customer-offline-store.ts
      -> Cache menu data
      -> Add useCustomerOfflineSync hook
        -> Online/offline banner component
          -> Graceful degradation in components
```

---

## MVP Recommendation (Phased)

### Phase 1: Mobile Crash Fixes (P0)

**Goal:** Zero crashes on mobile devices.

1. **Audit all useEffect hooks** for missing cleanup
   - Timers (setTimeout, setInterval)
   - Animation frames (requestAnimationFrame)
   - Event listeners
   - Subscriptions

2. **Add isMounted pattern** to async operations
   - Data fetching
   - Delayed state updates
   - Animation callbacks

3. **GSAP cleanup audit**
   - Kill timelines on unmount
   - Clear ScrollTrigger instances

4. **Test on low-power device** (iPhone SE, Android mid-range)

**Complexity:** Medium
**Risk:** Low (fixes, not new features)

### Phase 2: LCP Optimization (P0)

**Goal:** Mobile LCP < 2.5s.

1. **Audit hero images** - ensure priority loading
2. **Verify lazy loading** - confirm HowItWorks defers Google Maps
3. **Check font loading** - ensure font-display: swap
4. **Minimize main thread work** - defer non-critical JS

**Complexity:** Low-Medium
**Risk:** Low (configuration changes)

### Phase 3: Customer Offline Support (P1)

**Goal:** Menu browsable offline, connection status visible.

1. **Create customer-offline-store.ts** based on driver pattern
2. **Cache menu data** in IndexedDB
3. **Add OfflineIndicator component** (reuse driver pattern)
4. **Graceful fallback** when data unavailable

**Complexity:** Medium
**Risk:** Low (additive feature)

### Phase 4: Additional Skeletons (P2)

**Goal:** No blank loading states anywhere.

1. **CartDrawer skeleton** - show immediately on open
2. **Checkout skeleton** - per-step loading
3. **Order history skeleton** - list placeholder

**Complexity:** Low
**Risk:** Very low (visual polish)

---

## Image Optimization Checklist

Based on existing `image-optimization.ts`:

| Category | Preset | Width | Height | sizes Attribute |
|----------|--------|-------|--------|-----------------|
| Menu cards | `menuCard` | 400 | 225 | `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw` |
| Hero | `hero` | 1920 | 1080 | `100vw` |
| Thumbnails | `thumbnail` | 96 | 96 | `(max-width: 640px) 25vw, 10vw` |
| Cart items | `cartItem` | 80 | 80 | `80px` |

**LCP Image Checklist:**
- [ ] Hero image has `priority={true}` (or `preload` in Next.js 16)
- [ ] Hero image has explicit width/height
- [ ] Hero uses sizes="100vw" for responsive serving
- [ ] No lazy-load on above-fold images

---

## Sources

### Mobile Performance
- [Mastering Mobile Performance: Next.js Lighthouse Scores](https://www.wisp.blog/blog/mastering-mobile-performance-a-complete-guide-to-improving-nextjs-lighthouse-scores)
- [React & Next.js Best Practices 2026: Performance, Scale](https://fabwebstudio.com/blog/react-nextjs-best-practices-2026-performance-scale)
- [Next.js Performance Optimization 2025](https://pagepro.co/blog/nextjs-performance-optimization-in-9-steps/)
- [How to Optimize Next.js Performance - DebugBear](https://www.debugbear.com/blog/nextjs-performance)

### Image Optimization & LCP
- [Fix LCP by Optimizing Image Loading - MDN Blog](https://developer.mozilla.org/en-US/blog/fix-image-lcp/)
- [How to Optimize Website Images 2026 - Request Metrics](https://requestmetrics.com/web-performance/high-performance-images/)
- [Next.js Image Optimization - DebugBear](https://www.debugbear.com/blog/nextjs-image-optimization)
- [LCP Image Optimization for Enhanced SEO - Quattr](https://www.quattr.com/core-web-vitals/lcp-image-optimization)

### Skeleton Loading
- [Handling React Loading States with Skeleton - LogRocket](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/)
- [Implementing Skeleton Screens in React - Smashing Magazine](https://www.smashingmagazine.com/2020/04/skeleton-screens-react/)
- [Understanding Skeleton Loaders in React - DEV](https://dev.to/ankitakanchan/understanding-skeleton-loaders-a-guide-to-content-loading-in-react-bc8)

### Offline/PWA Support
- [Build Next.js 16 PWA with True Offline Support - LogRocket](https://blog.logrocket.com/nextjs-16-pwa-offline-support)
- [PWA Development Trends 2026 - Vocal Media](https://vocal.media/journal/progressive-web-app-development-trends-and-use-cases-for-2026)
- [Offline and Background Operation - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)

### Food Delivery Design
- [Food Delivery App UI/UX Design 2025 - Medium](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee)
- [Food Delivery App Design for Engagement - Seven Square Tech](https://www.sevensquaretech.com/food-delivery-app-design-for-higher-engagement/)
- [25 Food Delivery Website Design Examples - Subframe](https://www.subframe.com/tips/food-delivery-website-design-examples)

### Codebase Analysis (HIGH Confidence)
- `src/components/ui/homepage/*.tsx` - All homepage components reviewed
- `src/lib/services/offline-store.ts` - Driver offline architecture analyzed
- `src/lib/hooks/useOfflineSync.ts` - Existing sync hook patterns
- `src/lib/utils/image-optimization.ts` - Image preset configuration
- `src/components/ui/menu/MenuSkeleton.tsx` - Skeleton pattern reference
- Git history (commits 1486c38, deabb17, a08d2ff, 9ced763) - Crash fix patterns
