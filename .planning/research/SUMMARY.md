# Project Research Summary

**Project:** Mandalay Morning Star Delivery App - Mobile Optimization & Offline Support
**Domain:** Food delivery web app (Next.js 16, React 19, GSAP + Framer Motion, Zustand)
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

This mobile optimization milestone addresses systematic crash patterns on iOS Safari while enhancing performance and adding customer-facing offline support. The codebase already has comprehensive homepage components (Hero, HowItWorks, TestimonialsCarousel, CTABanner, FooterCTA) fully wired in HomePageClient.tsx - these are **not dead code**, they just need mobile optimization and crash prevention fixes.

The recommended approach prioritizes stability first: audit and fix all mobile crash patterns (setTimeout cleanup, event listener accumulation, scroll lock issues) before adding new features. Only two new packages are needed (Serwist for service worker), avoiding the complexity of virtualization libraries (menu size doesn't justify them) or client-side image optimization (Next.js Image handles this server-side).

Critical risks center on memory management: missing cleanup in useEffect hooks causes unmounted state updates that crash iOS Safari, GSAP timelines leak if not killed on unmount, and AnimatePresence with Fragments breaks key tracking. The codebase has already addressed many of these patterns (commits 1486c38, deabb17, a08d2ff, 9ced763) - the milestone must prevent regression while extending fixes to uncovered areas.

## Key Findings

### Recommended Stack

**Minimal additions strategy** - existing infrastructure handles most needs.

**Core technologies (already installed):**
- Next.js 16 Image - Already configured for AVIF/WebP, just needs `sizes` tuning and priority loading audit
- Framer Motion 12.26.1 - Parallax presets exist in motion-tokens.ts, covers all animation needs
- Zustand with persist - Cart persistence works offline, pattern extends to customer offline store
- TanStack Query - 5min staleTime provides basic caching foundation

**New additions (only 2 packages):**
- @serwist/next (^9.5.0) - Service worker integration with Workbox-based caching strategies
- serwist (^9.5.0) - Core utilities (dev dependency), official Next.js recommendation over abandoned next-pwa

**DO NOT add:**
- Virtualization libraries (@tanstack/react-virtual, react-window) - Menu ~50 items, not justified
- Client-side image optimization (sharp manual, blurhash) - Next.js Image handles server-side, existing placeholders sufficient
- Manual SW configuration - Serwist abstracts Workbox, handles cache versioning automatically

### Expected Features

**Must have (mobile stability - P0):**
- Zero crashes on mobile devices - setTimeout cleanup, isMounted pattern for async operations
- Sub-2.5s LCP on mobile - Priority loading for above-fold images, HowItWorks lazy loading
- Smooth 60fps scrolling - Animation scaling based on device capability, reduce/disable on low-power
- Memory management - GSAP timeline cleanup, AudioContext closure, RAF cancellation

**Must have (loading states - P1):**
- Menu skeleton - Complete (MenuSkeleton.tsx exists)
- Homepage skeletons - Complete (HowItWorksSkeleton inline)
- Customer offline support - Cache menu data in IndexedDB, connection status banner, graceful degradation

**Should have (performance - P2):**
- Device-based animation scaling - Reduce animations on low-memory/slow-connection devices
- Optimistic cart UI - Instant feedback on add-to-cart
- Native app-like transitions - View Transitions API (already used for theme toggle)

**Defer (v2+ - P3):**
- Pull-to-refresh - Not standard for web apps
- Haptic feedback - Limited browser support
- Offline order submission - Payment requires network, inventory sync complexity

### Architecture Approach

Mobile optimization integrates with existing Next.js 16 + React 19 architecture without fundamental changes. Homepage components orchestrate via HomePageClient.tsx (server component passes data, client handles hydration and animations). Image optimization uses established hierarchy: next/image → BlurImage (blur placeholders) → AnimatedImage (entrance animations) → CardImage (parallax overlays).

**Major components:**

1. **Service Worker Layer (NEW)** - Serwist-managed SW with runtime caching strategies: CacheFirst for images (30-day expiration), NetworkFirst for menu API (5min stale), no HTML caching (prevents App Router conflicts)

2. **Memory Management Patterns (EXTEND)** - Systematic cleanup across all components: setTimeout refs with clearTimeout in cleanup, event listeners defined inside useEffect (not useCallback), useBodyScrollLock with deferRestore for all modals, GSAP context.revert() on unmount

3. **Image Optimization (TUNE)** - Existing infrastructure solid, needs configuration tuning: `sizes` attributes for responsive loading, priority prop for first 4-6 visible items, quality reduction for non-hero images (85 → 70)

4. **Offline Support (EXTEND)** - Driver app pattern (offline-store.ts, useOfflineSync.ts) extends to customer app: customer-offline-store.ts for menu caching, OfflineIndicator component reuses driver pattern, graceful fallback when data unavailable

5. **Animation Ownership (CLARIFY)** - GSAP for scroll-triggered animations (ScrollTrigger), Framer Motion for enter/exit transitions (AnimatePresence), hover/tap gestures, layout animations. Never animate same element with both libraries.

### Critical Pitfalls

1. **setTimeout/setInterval not cleaned up on unmount** - Mobile crashes (especially iOS Safari) from setState on unmounted components. Pattern: store timeout ref, clearTimeout in cleanup, use isMountedRef for async operations. Already fixed in 8+ components (useBodyScrollLock.ts, SearchInput.tsx, AddToCartButton.tsx) - prevent regression.

2. **Event listener accumulation from useCallback dependencies** - First modal close works, second crashes. useCallback with isOpen in deps creates new function reference, addEventListener uses ref v1, removeEventListener tries ref v2 (fails). Fix: define handler INSIDE useEffect with isOpen guard.

3. **Body scroll lock crashes iOS Safari** - window.scrollTo() during AnimatePresence exit animation causes layout thrashing. Requires useBodyScrollLock with deferRestore: true, call restoreScrollPosition in onExitComplete after animation completes.

4. **GSAP + Framer Motion conflicts** - Both libraries animating same element causes stutter. Establish ownership: GSAP for ScrollTrigger scroll animations, Framer Motion for state-driven transitions. Always use gsap.context().revert() in cleanup.

5. **AnimatePresence Fragment memory leaks** - Fragment as direct child breaks key tracking, exit animations don't fire, memory grows. Fix: use direct keyed children (not Fragments), stable keys (not index), Motion 12.23.28+ required.

6. **Service Worker + Next.js App Router conflicts** - Caching HTML pages serves stale content, navigation breaks. Use Serwist (not abandoned next-pwa), never cache HTML/RSC payloads, implement update prompt, build with --webpack flag (Turbopack incompatible).

## Implications for Roadmap

Based on research, suggested 4-phase structure prioritizing stability over features:

### Phase 1: Mobile Crash Prevention (P0)

**Rationale:** Zero crashes is prerequisite for all features. Existing codebase shows systematic crash patterns already partially addressed - must complete fixes and prevent regression.

**Delivers:** Stable mobile experience, no unmounted state updates, no iOS Safari crashes

**Addresses (from FEATURES.md):**
- No crashes on mobile (P0)
- Memory management (P0)
- Smooth scrolling (P0)

**Avoids (from PITFALLS.md):**
- Pitfall 1: setTimeout/setInterval cleanup (audit ALL remaining components)
- Pitfall 2: Event listener accumulation (review useCallback + addEventListener patterns)
- Pitfall 3: iOS scroll lock (verify deferRestore in all modals)
- Pitfall 4: GSAP cleanup (kill timelines on unmount)
- Pitfall 15: AudioContext closure (browser limits 6 per page)
- Pitfall 16: IntersectionObserver disconnect

**Tasks:**
- Audit all useEffect hooks for missing cleanup (timers, listeners, subscriptions)
- Add isMounted pattern to async operations (data fetching, delayed state updates)
- GSAP timeline cleanup audit (kill timelines, clear ScrollTrigger instances)
- Test on low-power devices (iPhone SE, Android mid-range)

**Research flag:** Standard cleanup patterns - skip research, use ERROR_HISTORY.md as reference

---

### Phase 2: Image Optimization & LCP (P0)

**Rationale:** Core Web Vitals directly impact SEO and user perception. Existing infrastructure solid (Next.js Image, size presets, blur placeholders) - needs configuration tuning, not architectural changes.

**Delivers:** Sub-2.5s LCP on mobile, CLS < 0.1, optimized image loading

**Uses (from STACK.md):**
- Next.js Image with AVIF/WebP formats (already configured)
- IMAGE_SIZES presets from image-optimization.ts
- BlurImage component with shimmer animation
- Priority loading utility shouldPriorityLoad()

**Implements (from ARCHITECTURE.md):**
- Image component hierarchy: BlurImage → AnimatedImage → CardImage
- Priority loading for first 4-6 visible items
- Responsive sizes attributes based on viewport breakpoints
- Quality reduction for non-hero images (85 → 70)

**Avoids (from PITFALLS.md):**
- Pitfall 7: Image CLS - explicit width/height, placeholder for lazy images
- Pitfall 11: willChange GPU pressure - only apply during interaction, remove after animation

**Tasks:**
- Tune `sizes` attributes in CardImage, AnimatedImage (menuCard: 50vw mobile, 33vw tablet, 25vw desktop)
- Audit priority loading (Hero images priority: true, first 6 menu cards)
- Reduce quality for non-hero images in image-optimization.ts
- Verify font-display: swap, minimize main thread work

**Research flag:** Standard Next.js Image patterns - skip research

---

### Phase 3: Customer Offline Support (P1)

**Rationale:** Driver app has established offline patterns (offline-store.ts, useOfflineSync.ts). Extend proven architecture to customer-facing features for parity and resilience.

**Delivers:** Menu browsable offline, connection status visible, cart persists across sessions

**Uses (from STACK.md):**
- @serwist/next for service worker integration
- Existing Zustand persist pattern (cart already works offline)
- TanStack Query with staleTime for API caching

**Implements (from ARCHITECTURE.md):**
- Service Worker Layer: CacheFirst for images, NetworkFirst for menu API, StaleWhileRevalidate for static assets
- customer-offline-store.ts based on driver pattern: menu-cache, pending-orders stores
- useCustomerOfflineSync hook: navigator.onLine detection, auto-sync on reconnect
- OfflineIndicator banner component (reuse driver pattern)

**Avoids (from PITFALLS.md):**
- Pitfall 6: SW + App Router conflicts - use Serwist, never cache HTML/RSC, implement update prompt
- Pitfall 10: Stale cache - version + timestamp cached data, revalidate on 'online' event, show stale indicator

**Tasks:**
- Install @serwist/next, configure next.config.ts with withSerwistInit
- Create customer-offline-store.ts (menu-cache store, expiration logic)
- Add OfflineIndicator component (banner when navigator.onLine false)
- Graceful fallback in components when data unavailable
- Update prompt for new SW versions

**Research flag:** Needs light research - Serwist configuration for Next.js App Router specifics

---

### Phase 4: Animation Optimization & Polish (P2)

**Rationale:** Stability and performance established, safe to enhance visual experience. Existing animation tokens (motion-tokens.ts) provide foundation - implement device-based scaling and optimize heavy animations.

**Delivers:** Adaptive animations based on device capability, no animation conflicts, optimistic UI feedback

**Uses (from STACK.md):**
- Framer Motion parallax presets (already in motion-tokens.ts)
- GSAP ScrollTrigger for scroll animations (already installed)
- useAnimationPreference hook (respects reduced motion)

**Implements (from ARCHITECTURE.md):**
- Device capability detection: navigator.deviceMemory, hardwareConcurrency, connection.effectiveType
- Animation scaling: high capability (full animations), medium (reduced duration), low (disable non-essential)
- Animation ownership: GSAP for scroll, Framer Motion for interactions
- Optimistic cart UI: immediate feedback, rollback on error

**Avoids (from PITFALLS.md):**
- Pitfall 4: GSAP + Framer Motion conflicts - clear ownership per element, separate concerns
- Pitfall 5: AnimatePresence memory leaks - no Fragments as direct children, stable keys
- Pitfall 11: willChange GPU pressure - only 2-3 animated elements at a time on mobile
- Pitfall 9: CSS 3D + stacking context - disable Framer scale when using preserve-3d

**Tasks:**
- Create useDeviceCapability hook (memory, cores, connection type detection)
- Reduce animation complexity on low-power devices (disable parallax, reduce stagger)
- Optimistic cart button states (loading → success → idle with rollback)
- Verify no GSAP/Framer conflicts in homepage sections

**Research flag:** Standard animation patterns - skip research, use motion-tokens.ts as reference

---

### Phase Ordering Rationale

- **Crashes before features** - Phase 1 addresses P0 stability. No point adding features if app crashes on modal close.
- **LCP before offline** - Phase 2 fixes Core Web Vitals (SEO impact, user perception). Offline is nice-to-have, performance is must-have.
- **Offline before animations** - Phase 3 adds functional resilience (browse menu offline). Phase 4 is polish (device-adaptive animations).
- **Dependencies respected** - Phases 1-2 have no new dependencies (tune existing). Phase 3 adds Serwist (independent). Phase 4 builds on stable foundation.
- **Risk mitigation** - Early phases address documented crash patterns (ERROR_HISTORY.md). Later phases enhance after stability proven.

### Research Flags

**Needs research during planning:**
- Phase 3: Serwist configuration for Next.js App Router - official docs exist but need App Router-specific integration patterns

**Standard patterns (skip research):**
- Phase 1: Cleanup patterns documented in ERROR_HISTORY.md, LEARNINGS.md
- Phase 2: Next.js Image optimization well-documented, existing presets provide template
- Phase 4: Animation tokens already defined in motion-tokens.ts, ownership rules clear

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Minimal additions (only Serwist), existing infrastructure verified via codebase analysis. DO NOT add virtualization libraries confirmed via menu size analysis (~50 items). |
| Features | HIGH | Homepage components already built and wired in HomePageClient.tsx (not dead code). Mobile crash patterns documented in ERROR_HISTORY.md with fixes in recent commits. |
| Architecture | HIGH | Service Worker integration patterns verified via Next.js docs + Serwist guides. Image optimization hierarchy exists (BlurImage → AnimatedImage → CardImage). Memory management patterns documented in LEARNINGS.md. |
| Pitfalls | HIGH | All critical pitfalls sourced from codebase ERROR_HISTORY.md (real crashes already debugged) + official docs (iOS Safari scroll lock, AnimatePresence memory leaks, SW + App Router conflicts). |

**Overall confidence:** HIGH

### Gaps to Address

- **Device capability detection accuracy** - navigator.deviceMemory Chrome-only, hardwareConcurrency unreliable on some devices. Mitigation: conservative defaults (treat unknown as low-capability), test on real devices, use prefers-reduced-motion as primary signal.

- **Service worker cache invalidation strategy** - Need to define when to bump cache version (code deploys vs content updates). Mitigation: version cached data with timestamps, revalidate on 'online' event, show stale indicator when serving cached content.

- **Animation ownership conflicts** - GSAP and Framer Motion both used, potential for same-element conflicts in homepage sections. Mitigation: establish clear ownership rules in Phase 1 (GSAP for scroll, Framer for state transitions), audit during Phase 4 before adding new animations.

- **iOS Safari scroll lock edge cases** - useBodyScrollLock with deferRestore covers most cases, but iOS 18 window.innerHeight bug may affect scroll restoration. Mitigation: test on iOS 18 devices, use requestAnimationFrame for scroll restoration timing, consider touch-action: none for full lock.

## Sources

### Primary (HIGH confidence)

**Codebase analysis:**
- src/components/ui/homepage/*.tsx - All homepage components reviewed, wired in HomePageClient.tsx
- src/lib/services/offline-store.ts - Driver offline architecture analyzed
- src/lib/utils/image-optimization.ts - Image presets, size configuration
- src/components/ui/menu/MenuSkeleton.tsx - Skeleton pattern reference
- src/lib/motion-tokens.ts - Animation presets, parallax configuration
- .claude/ERROR_HISTORY.md - Mobile crash patterns (2026-01-25 to 2026-01-30)
- .claude/LEARNINGS.md - Fix patterns, animation ownership rules
- Git commits: 1486c38 (setTimeout cleanup), deabb17 (race conditions), a08d2ff (dead code), 9ced763 (cleanup patterns)

**Official documentation:**
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image) - Priority loading, sizes attribute
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - App Router SW integration
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Workbox wrapper, cache strategies
- [Framer Motion AnimatePresence](https://www.framer.com/motion/animate-presence/) - Exit animations, Fragment pitfalls
- [GSAP React Best Practices](https://gsap.com/resources/React/) - Context cleanup, ScrollTrigger patterns

### Secondary (MEDIUM confidence)

**Community resources:**
- [iOS Safari scroll lock fix](https://stripearmy.medium.com/i-fixed-a-decade-long-ios-safari-problem-0d85f76caec0) - touch-action: none, position: fixed patterns
- [Serwist migration guide](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7) - next-pwa successor, Webpack requirement
- [Next.js 16 PWA with offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support) - Runtime caching strategies
- [Fix LCP by Optimizing Image Loading](https://developer.mozilla.org/en-US/blog/fix-image-lcp/) - Priority loading, preload patterns
- [GSAP vs Motion comparison](https://motion.dev/docs/gsap-vs-motion) - When to use each library

**GitHub issues (verified fixes):**
- [AnimatePresence memory leak](https://github.com/framer/motion/issues/625) - Fixed in 12.23.28+
- [AnimatePresence stuck bug](https://github.com/framer/motion/issues/2554) - Fragment as child issue
- [Zustand memory discussion](https://github.com/pmndrs/zustand/discussions/2540) - Small stores over monolithic

### Tertiary (LOW confidence)

- Device capability detection heuristics - navigator.deviceMemory not universal, hardwareConcurrency unreliable
- iOS 18 window.innerHeight bug - reported but not officially documented
- Samsung browser hover quirk - documented in community but rare occurrence

---

*Research completed: 2026-01-30*
*Ready for roadmap: yes*
*Commit strategy: All research files committed together by synthesizer*
