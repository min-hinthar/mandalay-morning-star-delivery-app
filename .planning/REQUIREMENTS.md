# Requirements: v1.4 Mobile Excellence & Homepage Completion

**Milestone:** v1.4
**Created:** 2026-01-30
**Status:** Approved

---

## v1.4 Requirements

### Mobile Crash Prevention (CRASH)

- [ ] **CRASH-01**: All useEffect hooks with timers have cleanup functions (clearTimeout, clearInterval)
- [ ] **CRASH-02**: All async operations use isMounted ref pattern to prevent setState on unmounted components
- [ ] **CRASH-03**: All GSAP timelines call context.revert() or timeline.kill() on component unmount
- [ ] **CRASH-04**: All ScrollTrigger instances are killed on component unmount
- [ ] **CRASH-05**: All event listeners defined inside useEffect have matching removeEventListener in cleanup
- [ ] **CRASH-06**: All AudioContext instances are closed on component unmount
- [ ] **CRASH-07**: All requestAnimationFrame calls have cancelAnimationFrame in cleanup
- [ ] **CRASH-08**: All IntersectionObserver instances are disconnected on unmount
- [ ] **CRASH-09**: All modals use useBodyScrollLock with deferRestore: true pattern
- [ ] **CRASH-10**: App tested on low-power devices (iPhone SE, Android mid-range) with zero crashes

### Image Optimization & LCP (IMAGE)

- [ ] **IMAGE-01**: Hero images have priority={true} prop for above-fold loading
- [ ] **IMAGE-02**: First 6 menu cards have priority loading enabled
- [ ] **IMAGE-03**: All CardImage components have responsive sizes attribute (50vw mobile, 33vw tablet, 25vw desktop)
- [ ] **IMAGE-04**: All AnimatedImage components have responsive sizes attribute
- [ ] **IMAGE-05**: Non-hero images use quality=70 (reduced from 85) in image-optimization.ts
- [ ] **IMAGE-06**: All images have explicit width and height to prevent CLS
- [ ] **IMAGE-07**: Font loading uses font-display: swap strategy
- [ ] **IMAGE-08**: HowItWorks section confirms deferred Google Maps loading (369KB saved)
- [ ] **IMAGE-09**: Mobile LCP measured under 2.5s via Lighthouse audit
- [ ] **IMAGE-10**: CLS measured under 0.1 via Lighthouse audit

### Customer Offline Support (OFFLINE)

- [ ] **OFFLINE-01**: @serwist/next and serwist packages installed and configured
- [ ] **OFFLINE-02**: Service worker registered with Next.js App Router compatibility
- [ ] **OFFLINE-03**: Images cached with CacheFirst strategy (30-day expiration)
- [ ] **OFFLINE-04**: Menu API cached with NetworkFirst strategy (5-minute stale)
- [ ] **OFFLINE-05**: Static assets cached with StaleWhileRevalidate strategy
- [ ] **OFFLINE-06**: HTML/RSC payloads explicitly NOT cached (prevents App Router conflicts)
- [ ] **OFFLINE-07**: customer-offline-store.ts created with menu-cache IndexedDB store
- [ ] **OFFLINE-08**: useCustomerOfflineSync hook detects navigator.onLine status
- [ ] **OFFLINE-09**: OfflineIndicator banner component shows when offline
- [ ] **OFFLINE-10**: Menu page shows cached data with stale indicator when offline
- [ ] **OFFLINE-11**: Service worker update prompt appears when new version available
- [ ] **OFFLINE-12**: Cache versioned with timestamps for invalidation control

### Animation Optimization (ANIM)

- [ ] **ANIM-01**: useDeviceCapability hook detects device memory, cores, and connection type
- [ ] **ANIM-02**: Low-capability devices disable non-essential animations (parallax, stagger)
- [ ] **ANIM-03**: Medium-capability devices use reduced animation durations (0.3s -> 0.15s)
- [ ] **ANIM-04**: High-capability devices get full animation experience
- [ ] **ANIM-05**: Animation ownership clarified: GSAP for scroll, Framer Motion for interactions
- [ ] **ANIM-06**: No GSAP and Framer Motion animations on same DOM element
- [ ] **ANIM-07**: Cart add button has optimistic UI (immediate feedback, rollback on error)
- [ ] **ANIM-08**: AnimatePresence children are direct keyed elements (no Fragments)
- [ ] **ANIM-09**: willChange property only applied during interaction, removed after

### Codebase Refactoring (REFACTOR)

- [ ] **REFACTOR-01**: 8 Storybook files in src/components/ui/ deleted (production artifacts)
- [ ] **REFACTOR-02**: Deprecated navigation/ folder deleted (6 files superseded by layout/)
- [ ] **REFACTOR-03**: Unused auth components deleted (AuthModal, MagicLinkSent, OnboardingTour, WelcomeAnimation)
- [ ] **REFACTOR-04**: auth/index.ts barrel updated to remove deleted exports
- [ ] **REFACTOR-05**: src/ folder structure follows industry best practices (feature-based organization)
- [ ] **REFACTOR-06**: All component files under 400 lines (split if larger)
- [ ] **REFACTOR-07**: No circular dependencies in import graph
- [ ] **REFACTOR-08**: ESLint rules prevent recreation of deleted directories

---

## Future Requirements (Deferred)

### v1.5+ Candidates

- Pull-to-refresh gesture (not standard for web apps)
- Haptic feedback on interactions (limited browser support)
- Offline order submission (payment requires network)
- Full PWA install experience
- Background sync for all data

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Homepage component integration | Already wired in HomePageClient.tsx (research corrected dead-code-cleanup.md) |
| Backend/API changes | Supabase + Stripe contracts stay stable |
| Virtualization libraries | Menu ~50 items, doesn't justify 10KB+ bundle addition |
| Client-side image optimization | Next.js Image handles server-side |
| Additional skeleton states | Cart, checkout, order history deferred to v1.5 |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| CRASH-01 | Phase 35 | Pending |
| CRASH-02 | Phase 35 | Pending |
| CRASH-03 | Phase 35 | Pending |
| CRASH-04 | Phase 35 | Pending |
| CRASH-05 | Phase 35 | Pending |
| CRASH-06 | Phase 35 | Pending |
| CRASH-07 | Phase 35 | Pending |
| CRASH-08 | Phase 35 | Pending |
| CRASH-09 | Phase 35 | Pending |
| CRASH-10 | Phase 35 | Pending |
| IMAGE-01 | Phase 36 | Pending |
| IMAGE-02 | Phase 36 | Pending |
| IMAGE-03 | Phase 36 | Pending |
| IMAGE-04 | Phase 36 | Pending |
| IMAGE-05 | Phase 36 | Pending |
| IMAGE-06 | Phase 36 | Pending |
| IMAGE-07 | Phase 36 | Pending |
| IMAGE-08 | Phase 36 | Pending |
| IMAGE-09 | Phase 36 | Pending |
| IMAGE-10 | Phase 36 | Pending |
| REFACTOR-01 | Phase 37 | Pending |
| REFACTOR-02 | Phase 37 | Pending |
| REFACTOR-03 | Phase 37 | Pending |
| REFACTOR-04 | Phase 37 | Pending |
| REFACTOR-05 | Phase 37 | Pending |
| REFACTOR-06 | Phase 37 | Pending |
| REFACTOR-07 | Phase 37 | Pending |
| REFACTOR-08 | Phase 37 | Pending |
| OFFLINE-01 | Phase 38 | Pending |
| OFFLINE-02 | Phase 38 | Pending |
| OFFLINE-03 | Phase 38 | Pending |
| OFFLINE-04 | Phase 38 | Pending |
| OFFLINE-05 | Phase 38 | Pending |
| OFFLINE-06 | Phase 38 | Pending |
| OFFLINE-07 | Phase 38 | Pending |
| OFFLINE-08 | Phase 38 | Pending |
| OFFLINE-09 | Phase 38 | Pending |
| OFFLINE-10 | Phase 38 | Pending |
| OFFLINE-11 | Phase 38 | Pending |
| OFFLINE-12 | Phase 38 | Pending |
| ANIM-01 | Phase 39 | Pending |
| ANIM-02 | Phase 39 | Pending |
| ANIM-03 | Phase 39 | Pending |
| ANIM-04 | Phase 39 | Pending |
| ANIM-05 | Phase 39 | Pending |
| ANIM-06 | Phase 39 | Pending |
| ANIM-07 | Phase 39 | Pending |
| ANIM-08 | Phase 39 | Pending |
| ANIM-09 | Phase 39 | Pending |

---

## Summary

| Category | Count | Priority | Phase |
|----------|-------|----------|-------|
| Mobile Crash Prevention | 10 | P0 | 35 |
| Image Optimization & LCP | 10 | P0 | 36 |
| Codebase Refactoring | 8 | P1 | 37 |
| Customer Offline Support | 12 | P1 | 38 |
| Animation Optimization | 9 | P2 | 39 |
| **Total** | **49** | - | - |

---

*Created: 2026-01-30*
*Updated: 2026-01-30 - Traceability section added with phase mappings*
