# Project Research Summary: v1.5 Performance & Repo Health

**Project:** Mandalay Morning Star Delivery App
**Domain:** LCP Optimization (8.1s to <2.5s) for Animation-Heavy Next.js 16 PWA
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

Reducing LCP from 8.1s to <2.5s requires zero new dependencies and zero stack changes. The current stack (Next.js 16.1.2, React 19.2.3, GSAP 3.14.2, Framer Motion 12.26.1) has native capabilities that are underutilized: React Compiler for automatic memoization, `next/dynamic` for code splitting, and `optimizePackageImports` for tree-shaking. The root cause is JavaScript execution blocking render — 275 out of 275 components are marked "use client" when only ~60 need it. Enable React Compiler, convert non-interactive components to Server Components, and dynamically import Recharts (180KB) and Google Maps (120KB) on applicable routes.

The recommended approach prioritizes high-impact, low-risk changes first: (1) LCP element optimization (remove lazy loading, add `priority`), (2) Server Component conversions for data-fetching pages, (3) dynamic imports for admin-only and route-specific heavy libraries, (4) provider refactoring to remove cart from non-customer routes. Animation libraries (GSAP, Framer Motion) should NOT be dynamically imported — GSAP's centralized pattern prevents ScrollTrigger memory leaks, and Framer Motion is already tree-shaken via `optimizePackageImports`.

Key risks are ScrollTrigger memory leaks on route changes (mitigate with `useGSAP` hook cleanup), hydration blocking from animation initialization (defer non-critical animations with `requestIdleCallback`), and barrel import performance cliffs (already mitigated in next.config.ts). Adding Lighthouse CI for performance regression testing in CI prevents LCP from regressing after optimization.

---

## Key Findings

### Recommended Stack

No major additions needed. Enable underutilized native features and add monitoring.

**Enable (native, zero-install):**
- **React Compiler:** `reactCompiler: true` in next.config.ts — automatic memoization, reduces re-renders
- **next/dynamic:** Already available — defer Recharts, Google Maps, modals
- **next/script lazyOnload:** Already available — defer third-party scripts (Google Maps API, analytics)
- **next/font with display: swap:** Already available — eliminate font-blocking LCP delay

**Add (minimal dependencies):**
- **react-intersection-observer (^9.15.0):** Viewport-based loading for Google Maps — delays 3.86 MB until visible
- **@lhci/cli (dev dependency):** Lighthouse CI for performance regression testing — enforces LCP <2.5s budget

**DO NOT ADD:**
- Million.js — compatibility issues with Next.js 16, last release May 2024
- Partytown — unsupported with App Router, Pages Router only
- Preact — React 19 features unsupported, risky migration

### Expected Features (LCP-Specific)

**Must have (table stakes for <2.5s):**
- Remove lazy loading from LCP element (hero/menu images)
- Add `priority={true}` and `fetchpriority="high"` to LCP images
- Eliminate render-blocking JavaScript on critical path
- Use React Server Components for data fetching (default, not overridden)
- Code split non-critical components (modals, animations, charts)

**Should have (push toward <1.5s):**
- Streaming SSR with Suspense for slow components
- Selective hydration via Suspense boundaries
- React Compiler automatic memoization
- Framer Motion LazyMotion (32KB to ~19KB)

**Defer (v2+):**
- Partial Prerendering (PPR) — experimental, requires significant testing
- AVIF image format — WebP sufficient, AVIF decode slower on mobile
- Advanced font subsetting — next/font handles automatically

### Architecture Approach

The architecture centers on reducing initial JavaScript by 600KB+ through Server Component conversions (275 to ~60 "use client" files) and route-based dynamic imports. Heavy libraries are isolated to their route groups: Recharts (180KB) to admin analytics, Google Maps (120KB) to tracking page. Cart components move from global providers to customer/public route layouts, removing ~60KB from admin/driver/auth routes.

**Code splitting strategy:**
1. **GSAP (30KB):** Keep eager-loaded, centralized in `lib/gsap/index.ts` — prevents ScrollTrigger memory leaks
2. **Framer Motion (150KB to 40KB):** Keep `optimizePackageImports` — already tree-shaken, used globally
3. **Recharts (180KB):** Dynamic import via existing LazyCharts wrapper — admin-only, <5% traffic
4. **Google Maps (120KB):** Partial dynamic import — map deferred, autocomplete stays eager (checkout critical)

**Provider refactoring:**
- Move CartBar, CartDrawer, FlyToCart from global providers.tsx to (customer) and (public) route layouts
- Removes ~60KB from /admin, /driver, /auth routes where cart is unnecessary

### Critical Pitfalls

1. **Over-marking with "use client"** — 275/275 files currently marked. Push boundaries to leaf components. Each "use client" adds an entry point to client bundle. Impact: 1-3s LCP reduction possible.

2. **GSAP ScrollTrigger memory leaks** — ScrollTrigger instances not cleaned up on App Router navigation. Use `useGSAP` hook with cleanup function. Never dynamically import GSAP.

3. **Hydration blocking animations** — GSAP/Framer Motion initialization during hydration blocks main thread 300-1000ms. Defer non-critical animations with `requestIdleCallback`. Phase animations: critical first, decorative delayed.

4. **Barrel import performance cliff** — Importing from barrel files (e.g., lucide-react) forces parsing thousands of modules. Already mitigated via `optimizePackageImports` in next.config.ts. Verify GSAP plugins use direct imports.

5. **Lazy loading LCP images** — Adding `loading="lazy"` to hero images delays LCP by 500-2000ms. Use `priority={true}` on hero/menu images. Reserve lazy loading for below-fold only.

6. **Framer Motion bundle size explosion** — 32KB minimum regardless of usage. Already mitigated via `optimizePackageImports` (150KB to 40KB). For further reduction, use LazyMotion pattern.

7. **Dynamic import without SSR disabled** — GSAP/Framer Motion require browser APIs. Always use `ssr: false` for animation components. Otherwise: "window is not defined" errors.

---

## Implications for Roadmap

Based on research, suggested 5-phase structure for LCP optimization:

### Phase 1: LCP Element Quick Wins (Est. 8.1s to 4-5s)

**Rationale:** Highest impact, lowest risk. Addresses table stakes that directly affect LCP measurement.

**Delivers:**
- Properly prioritized LCP images
- Removed lazy loading from above-fold content
- Verified next/image and next/font configuration

**Actions:**
- Audit homepage and menu pages for LCP element
- Add `priority={true}` and `fetchpriority="high"` to LCP images
- Remove `loading="lazy"` from hero/above-fold images
- Verify `display: 'swap'` on next/font configuration

**Avoids:** Pitfall 10 (Lazy Loading LCP Images), Pitfall 14 (Font Loading Blocking LCP)

**Estimated effort:** 4-8 hours

### Phase 2: Server Component Conversions (Est. 4-5s to 3-3.5s)

**Rationale:** Reduces client bundle by ~150KB. Server Components send zero JavaScript for data fetching.

**Delivers:**
- Analytics page wrappers as Server Components
- Menu page wrapper as Server Component
- Order tracking wrapper as Server Component
- loading.tsx files for route segments

**Actions:**
- Convert `app/(admin)/admin/analytics/page.tsx` to Server Component wrapper
- Convert `app/(public)/menu/page.tsx` to Server Component wrapper
- Keep interactive content as "use client" leaf components
- Add loading.tsx for graceful transitions

**Avoids:** Pitfall 1 (Over-Marking with "use client"), Pitfall 3 (Client Component Cascade)

**Estimated effort:** 1 week

### Phase 3: Dynamic Import Heavy Libraries (Est. 3-3.5s to 2.5s)

**Rationale:** Removes 180KB (Recharts) from non-admin routes and 120KB (Google Maps) from initial checkout load. Admin traffic is <5% of total.

**Delivers:**
- Recharts dynamically imported for admin analytics
- Google Maps map component dynamically imported (autocomplete stays eager)
- ChartSkeleton and MapSkeleton loading states

**Actions:**
- Verify LazyCharts wrapper exists and is used in analytics pages
- Create dynamic import for DeliveryMap in TrackingPageClient
- Keep usePlacesAutocomplete eager (checkout critical path)
- Add skeleton components to prevent layout shift

**Avoids:** Pitfall 12 (Dynamic Import Without SSR Disabled)

**Estimated effort:** 1 week

### Phase 4: Provider & Route Layout Refactoring (Est. refinement to <2.5s)

**Rationale:** Cart components load on all routes including admin/driver where unnecessary. Moving to route-specific layouts removes ~60KB from 3 route groups.

**Delivers:**
- Cart components in (customer) and (public) layouts only
- Cleaner global providers.tsx
- Reduced bundle on /admin, /driver, /auth routes

**Actions:**
- Create `app/(customer)/layout.tsx` with CartBar, CartDrawer, FlyToCart
- Create `app/(public)/layout.tsx` with same cart components
- Remove cart components from global providers.tsx
- Test all route groups for regressions

**Avoids:** Pitfall 1 (Over-Marking with "use client" at root level)

**Estimated effort:** 1.5 weeks

### Phase 5: Animation Optimization & Monitoring (Est. lock in <2.5s, push toward <2s)

**Rationale:** Fine-tune animation libraries for additional bundle reduction. Set up CI guardrails to prevent regression.

**Delivers:**
- React Compiler enabled for automatic memoization
- Framer Motion using LazyMotion pattern (32KB to ~19KB)
- GSAP using modular imports (verify current state)
- Lighthouse CI enforcing LCP <2.5s budget

**Actions:**
- Enable `reactCompiler: true` in next.config.ts
- Install `babel-plugin-react-compiler`
- Audit Framer Motion usage, implement LazyMotion where applicable
- Verify GSAP imports are modular (gsap/core, ScrollTrigger only)
- Install @lhci/cli, configure .lighthouserc.json with LCP budget
- Set up CI pipeline to run Lighthouse on PRs

**Avoids:** Pitfall 3 (Hydration Blocking Animations), Pitfall 5 (Framer Motion Bundle Size)

**Estimated effort:** 1 week

---

### Phase Ordering Rationale

1. **Phase 1 first:** Quick wins require no code restructuring. Immediate measurable impact (2-3s reduction). Validates measurement approach.

2. **Phase 2 before Phase 3:** Server Components reduce overall bundle size, making dynamic import impact more visible. Establishes pattern for future work.

3. **Phase 3 before Phase 4:** Library-level optimization is lower risk than provider refactoring. Dynamic imports are well-documented, isolated changes.

4. **Phase 4 after core optimization:** Provider refactoring touches shared code. Earlier phases prove the value of bundle reduction, justifying the medium-risk refactor.

5. **Phase 5 last:** React Compiler and Lighthouse CI are infrastructure improvements. Set up after core optimization validates the approach.

---

### Research Flags

**Phases likely needing validation during execution:**
- **Phase 4 (Provider Refactoring):** Test cart flow across all route groups after moving components. Potential for edge cases with deep linking.
- **Phase 5 (React Compiler):** Test for rendering issues with existing animations. Compiler may conflict with GSAP/Framer Motion patterns.

**Phases with standard patterns (no additional research needed):**
- **Phase 1:** Well-documented LCP optimization (web.dev, Next.js docs)
- **Phase 2:** Server Component pattern is core Next.js 16 feature
- **Phase 3:** Dynamic imports are established pattern with clear documentation

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Next.js 16 docs, React Compiler stable at Meta |
| Features | HIGH | web.dev LCP guidance, GTmetrix, multiple 2025-2026 sources |
| Architecture | HIGH | Verified against existing codebase, Next.js official patterns |
| Pitfalls | HIGH | GSAP forums, Next.js official warnings, recent Medium articles |

**Overall confidence:** HIGH

### Gaps to Address

1. **Current LCP element identification:** Research assumes hero/menu images. Verify with Lighthouse which element is actual LCP on each route before Phase 1.

2. **React Compiler + GSAP/Framer compatibility:** Limited 2026 data on React Compiler with animation libraries. Test on isolated branch before full rollout.

3. **Actual bundle size measurements:** Architecture research estimates sizes. Run `pnpm analyze:browser` to get baseline before optimization.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Release](https://nextjs.org/blog/next-16) — React Compiler, image defaults
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — boundary patterns
- [web.dev Optimize LCP](https://web.dev/articles/optimize-lcp) — table stakes features
- [Vercel Package Optimization](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) — optimizePackageImports
- [GSAP Forums](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/) — ScrollTrigger cleanup

### Secondary (MEDIUM confidence)
- [10 Performance Mistakes in Next.js 16 (Medium, Dec 2025)](https://medium.com/@sureshdotariya/10-performance-mistakes-in-next-js-16-that-are-killing-your-app-and-how-to-fix-them-2facfab26bea) — pitfall patterns
- [React Compiler in Next.js 16 (Medium)](https://medium.com/better-dev-nextjs-react/react-compiler-in-next-js-16-what-it-fixes-what-it-breaks-and-how-to-ship-it-safely-62881c4c0b74) — compiler adoption
- [Framer Motion LazyMotion](https://motion.dev/docs/react-reduce-bundle-size) — bundle reduction
- [Recharts in Next.js](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html) — dynamic import pattern

### Codebase (HIGH confidence)
- Existing `optimizePackageImports` in next.config.ts
- LazyCharts wrapper in `src/components/ui/admin/analytics/`
- Centralized GSAP in `lib/gsap/index.ts`
- Device detection in v1.4 (already respects reduced motion, low-power devices)

---
*Research completed: 2026-02-05*
*Ready for roadmap: yes*
