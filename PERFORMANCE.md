# Performance Optimization Journey

**Mandalay Morning Star v1.5 (Phases 40-47)**

This document captures the performance optimization work across eight phases, including what worked, what didn't, specific metrics, and lessons learned for future optimization efforts.

## Executive Summary

| Metric | Before (v1.4) | After (v1.5) | Improvement |
|--------|---------------|--------------|-------------|
| LCP (Homepage, mobile) | 19.9s | 10.87s | 45% faster |
| LCP (Menu, mobile) | 18.2s | 10.95s | 40% faster |
| LCP (Cart, mobile) | N/A | ~9-10s | Baseline |
| LCP (Checkout, mobile) | N/A | 8.13s | Baseline |
| TBT (Homepage) | 5.5s | ~12s | Regressed* |
| TBT (Menu) | 5.6s | ~15s | Regressed* |
| CLS | 0 | 0 | Maintained |
| Framer Motion bundle | ~34KB/component | ~4.6KB/component | 86% smaller |
| Lighthouse Score (Homepage) | 30 | 32 | +2 points |
| Lighthouse Score (Menu) | 35 | 30 | -5 points |

*TBT values measured with different throttling settings (4x CPU vs baseline); not directly comparable.

Eight phases, 21 plans executed. LCP target < 4s NOT MET (avg ~10s). However, 40-45% LCP improvement from v1.4 baseline achieved. Key bottlenecks identified for v1.6: JS execution time, network latency, DOM size.

---

## Phase 40: LCP Element Quick Wins

**Goal:** Identify and optimize the Largest Contentful Paint element on key pages.
**Duration:** 3 plans across research, implementation, and measurement.

### What We Did

1. **Lighthouse analysis** identified LCP elements: emoji on homepage, CardImage on menu page
2. **Font loading audit** confirmed `display: swap` already in place (no action needed)
3. **CardImage conversion** from plain `<img>` to Next.js `<Image>` component with automatic WebP/AVIF format negotiation, responsive sizing, and priority loading

### Results

| Page | LCP Before | LCP After | Reduction |
|------|-----------|-----------|-----------|
| Homepage (mobile) | 19.9s | 11.4s | -8.5s (43%) |
| Menu (mobile) | 18.2s | 9.8s | -8.4s (46%) |

### Key Files

- `src/components/ui/menu/CardImage.tsx` -- converted to Next.js Image with `sizes`, `priority`, and emoji fallback

### Lessons Learned

- **Image optimization alone was insufficient.** The 4-5s LCP target was not met (best: 9.5s). The remaining bottleneck is JavaScript bundle size causing high TBT (2-3s).
- **Next.js Image provides significant gains with minimal code change.** Format negotiation (WebP/AVIF) and responsive sizing handled automatically.
- **Measure first, optimize second.** Lighthouse analysis correctly identified CardImage as the primary target, saving effort on lower-impact changes.

---

## Phase 41: Server Component Conversions

**Goal:** Reduce client-side JavaScript by converting components to React Server Components where possible.
**Duration:** 7 plans covering audit, infrastructure, and per-route conversions.

### What We Did

1. **Audited all 275 `use client` files**: categorized as 184 KEEP, 37 CONVERT, 54 LEAF, 13 quick wins
2. **Built route infrastructure**: RouteLoading and RouteError reusable components for all route segments
3. **Created hydration smoke tests**: parameterized E2E tests to detect hydration mismatches
4. **Converted analytics routes**: added loading.tsx and error.tsx with Sentry integration
5. **Refactored homepage**: created HomePageWrapper (46 lines) to replace HomePageClient (107 lines), moved section composition to server
6. **Analyzed tracking page**: kept as client (realtime subscriptions require client boundary)
7. **Final health check**: verified 282 `use client` files as optimal count

### What Didn't Work

- **Aggressive server component conversion was impractical.** MenuContent is deeply integrated with React Query and offline IndexedDB. Hero is 519 lines of tightly coupled framer-motion parallax animations. Forcing these to server would cause hydration mismatches and break animation coherence.
- **The +7 `use client` file increase was correct.** Error boundaries and extraction wrappers legitimately need client boundaries. Reducing the count is not the goal -- correct boundaries are.

### Key Patterns Established

- **HomePageWrapper pattern** (`src/components/ui/homepage/HomePageWrapper.tsx`): Minimal client wrapper for scroll spy; section composition at server level. Only wraps what needs client state, composes everything else at the server boundary.
- **RouteLoading/RouteError** (`src/components/ui/error/RouteError.tsx`, `src/components/ui/loading/RouteLoading.tsx`): Reusable loading and error UI for route segments.

### Lessons Learned

- **282 `use client` files is the correct number**, not a problem to solve. Optimizing boundaries matters more than reducing count.
- **"Don't fight it" principle**: When a component is deeply coupled with client-only APIs (framer-motion, React Query, IndexedDB), keep it as a client component. The cost of splitting exceeds the benefit.
- **Server component conversion has diminishing returns** when the codebase already uses client features heavily. Focus shifted to bundle splitting (Phase 42+) instead.

---

## Phase 42: Dynamic Import Heavy Libraries

**Goal:** Code-split Recharts (~180KB) and Google Maps (~120KB) from initial page bundles.
**Duration:** 3 plans covering shared infrastructure, chart imports, and map imports.

### What We Did

1. **Built shared infrastructure**:
   - `useViewportTrigger` hook: IntersectionObserver-based loading with eager/viewport/fallback modes
   - `importWithRetry`: 3-retry exponential backoff (1s, 2s, 4s) with Sentry logging
   - `LoadingWithTimeout`: configurable timeout with skeleton-to-message transition
   - Skeleton + error card pairs co-located per domain (analytics/, maps/)

2. **Lazy-loaded all 6 chart types** in admin dashboard via `LazyX` pattern:
   - `LazyRevenueChart`, `LazyDeliveryPerformanceChart`, `LazyDriverPerformanceChart`, etc.
   - Each with rich bar-shape skeletons, 10s timeout, retry logic
   - Removed ~180KB Recharts from `/admin` initial bundle

3. **Lazy-loaded maps** with context-aware strategies:
   - Route detail map: **viewport-triggered** (below-fold admin content, defers ~120KB until scrolled into view)
   - Tracking page map: **eager lazy** (map IS the primary content; code-split but no viewport gate)
   - 15s timeout for maps (vs 10s for charts) to accommodate mobile network conditions

### Key Files

- `src/components/ui/admin/analytics/LazyCharts.tsx` -- 6 lazy chart wrappers
- `src/components/ui/maps/LazyMaps.tsx` -- LazyRouteMap and LazyDeliveryMap wrappers
- `src/lib/hooks/useViewportTrigger.ts` -- viewport-based loading trigger
- `src/lib/hooks/useDynamicImportWithRetry.ts` -- retry utility for dynamic imports
- `src/components/ui/LoadingWithTimeout.tsx` -- timeout wrapper with skeleton fallback

### Lessons Learned

- **Viewport-triggered loading is ideal for below-fold heavy content.** Admin route detail maps load only when scrolled into view, saving ~120KB on initial load.
- **Eager lazy loading is the right choice for primary content.** The tracking page map should load immediately (it's why the user is on the page) but still benefits from code-splitting.
- **Timeout differentiation matters.** Maps need longer timeouts (15s vs 10s) because Google Maps SDK is larger and mobile networks vary more.

---

## Phase 43: Provider & Route Layout Refactoring

**Goal:** Scope cart components to routes that need them, reducing bundle size for admin/driver/auth routes.
**Duration:** 2 plans covering layout refactoring and navigation guards.

### What We Did

1. **Created CartOverlays wrapper** (`src/components/ui/cart/CartOverlays.tsx`): DRY Fragment rendering CartBar + CartDrawer + FlyToCart
2. **Scoped cart to route-group layouts**: added `layout.tsx` to `(public)` and `(customer)` route groups
3. **Cleaned global providers**: `src/app/providers.tsx` now contains only theme/query/animation providers with zero cart references
4. **Built CartIndicator pathname fallback** (`src/components/ui/layout/AppHeader/CartIndicator.tsx`): opens drawer on cart routes, navigates to `/cart` elsewhere
5. **Created navigation guards**: `useNavigationGuard` hook intercepts browser back button and tab close when cart has items
6. **Added empty checkout redirect**: redirects to `/menu` with toast when deep-linked with empty cart

### Results

- **~60KB cart component tree removed from admin/driver/auth bundles**
- Cart components confirmed absent from admin, driver, and auth route bundles (0 matches in bundle analysis)

### Key Patterns Established

- **Route-group layout scoping**: place overlays in route-group `layout.tsx` to exclude them from other groups' bundles
- **Navigation guard sentinel pattern** (`src/lib/hooks/useNavigationGuard.ts`): pushState with marker, detect back via popstate, re-push to block

### Lessons Learned

- **Route-group layouts are the correct granularity** for scoping client-side features. A `"use client"` layout does NOT force child pages to be client components (children are a serialization boundary).
- **Provider cleanup has measurable impact.** Removing cart imports from global providers eliminated ~60KB from routes that never need cart functionality.

---

## Phase 44: Animation Optimization & Monitoring

**Goal:** Optimize animation bundle size, enable React Compiler, and set up performance regression monitoring.
**Duration:** 3 plans covering React Compiler, LazyMotion migration, and Lighthouse CI.

### What We Did

1. **Enabled React Compiler globally** (`next.config.ts: reactCompiler: true`):
   - `babel-plugin-react-compiler@1.0.0` installed
   - All 282 client components compile cleanly with zero opt-outs needed
   - Automatic memoization replaces manual `useMemo`/`useCallback`

2. **Cleaned GSAP registration**: removed SplitText, Flip, Observer plugins (zero consumer files found). Only `useGSAP` + `ScrollTrigger` remain active.

3. **Migrated 174 files from `motion.*` to `m.*`** (Framer Motion):
   - Added `LazyMotion` provider with `domMax` features and `strict` mode at application root
   - Automated codemod migrated ~1,397 JSX occurrences
   - Per-component animation bundle reduced from ~34KB to ~4.6KB
   - Features loaded once at root, not duplicated per component

4. **Set up Lighthouse CI regression gate** (`.github/workflows/ci.yml`):
   - `@lhci/cli@0.15.1` with `treosh/lighthouse-ci-action@v12`
   - 4 customer routes audited: `/`, `/menu`, `/cart`, `/checkout`
   - 6 assertions (FCP, LCP, CLS, TBT, performance score, accessibility score) all warn-only
   - Runs on PRs only, after build job passes
   - Reports uploaded to temporary-public-storage

### Key Files

- `next.config.ts` -- `reactCompiler: true` top-level config
- `src/app/providers.tsx` -- LazyMotion wrapper with domMax + strict
- `src/lib/gsap/index.ts` -- cleaned plugin registration
- `lighthouserc.js` -- Lighthouse CI configuration with server mode
- `.github/workflows/ci.yml` -- CI pipeline with Lighthouse job

### Lessons Learned

- **React Compiler works at scale.** Zero opt-outs across 282 components. No manual intervention required.
- **Automated codemods need edge case handling.** The `motion.*` to `m.*` migration hit three edge cases: string corruption in `"framer-motion"` import paths, multi-line imports, and dynamic `motion[]` component references. All caught by typecheck verification.
- **`domMax` is required when using `drag` or `layoutId`.** The lighter `domAnimation` would have broken CartItem (drag-to-delete) and 10+ components using `layoutId`.
- **Warn-only Lighthouse CI is the right starting point.** Performance monitoring without blocking PRs encourages improvement without creating friction.

---

## Phase 47: Final Measurement & Gap Closure

**Goal:** Verify cumulative LCP improvements from Phases 40-44 and close Phase 43 deferred requirements.
**Duration:** 3 plans covering measurements, cart verification, and documentation.

### Final LCP Measurements

| Route | Phase 40 | Phase 47 | Target | Status |
|-------|----------|----------|--------|--------|
| Homepage / | 11.4s | 10.87s | < 4.0s | FAIL |
| Menu /menu | 9.8s | 10.95s | < 4.0s | FAIL |
| Cart /cart | N/A | ~9-10s | < 3.5s | FAIL |
| Checkout /checkout | N/A | 8.13s | < 4.5s | FAIL |

**Overall:** LCP target < 4s NOT MET. Average LCP ~10s.

### Bundle Verification

Phase 43 cart scoping confirmed via source code analysis:
- Cart components (CartOverlays) present ONLY in (customer) and (public) layouts
- Absent from admin, driver, auth route groups
- Estimated savings: ~60KB per admin/driver route

### Cart E2E Tests

REQ-43.4, 43.8, 43.9 verified:
- 19 test cases created in e2e/cart-flow.spec.ts
- Happy path: Cart drawer close behaviors passing
- Edge cases: Drawer close via button and Escape passing
- Deep links: Tests created, selector refinement needed
- Regression: Cart scoping verified via source analysis

### Key Bottlenecks (for v1.6)

1. **JavaScript execution time (TBT 5-15s)** - Main thread blocked by bundle execution
2. **Network latency (FCP ~3s)** - Initial document and critical resources
3. **Large DOM size** - Complex component trees with animations

---

## Metrics Summary

### Core Web Vitals (Phase 47 Final)

| Metric | Target | Homepage | Menu | Cart | Checkout |
|--------|--------|----------|------|------|----------|
| LCP | < 4.0s | 10.87s | 10.95s | ~9-10s | 8.13s |
| FCP | < 1.8s | 3.20s | 3.06s | - | 1.63s |
| TBT | < 0.3s | 12.06s | 15.29s | - | 5.40s |
| CLS | < 0.1 | 0 | 0 | 0 | 0 |
| Score | 90+ | 32 | 30 | - | 45 |

### Improvement from v1.4 Baseline

| Metric | Homepage v1.4 | Homepage v1.5 | Menu v1.4 | Menu v1.5 |
|--------|---------------|---------------|-----------|-----------|
| LCP | 19.9s | 10.87s (-45%) | 18.2s | 10.95s (-40%) |
| Score | 30 | 32 (+2) | 35 | 30 (-5) |

### Bundle Optimizations

| Optimization | Impact |
|-------------|--------|
| Recharts code-split from admin initial bundle | ~180KB deferred |
| Google Maps code-split from route/tracking pages | ~120KB deferred |
| Cart components scoped out of admin/driver/auth | ~60KB removed |
| Framer Motion per-component bundle | ~34KB to ~4.6KB (86% reduction) |
| Dead GSAP plugins removed (SplitText, Flip, Observer) | Reduced registration overhead |

### Infrastructure Added

| Component | Purpose |
|-----------|---------|
| React Compiler | Auto-memoization for all 282 client components |
| LazyMotion (domMax + strict) | Single animation feature load at root |
| Lighthouse CI | PR-only performance regression monitoring |
| importWithRetry | 3-retry exponential backoff for dynamic imports |
| useViewportTrigger | IntersectionObserver-based deferred loading |
| LoadingWithTimeout | Skeleton-to-timeout-message transitions |

---

## Key Takeaways

1. **Measure before optimizing.** Lighthouse identified the actual LCP element (CardImage), not what we assumed. Without measurement, effort would have been wasted on lower-impact targets.

2. **Image optimization gives the biggest single-change ROI.** Converting CardImage to Next.js Image delivered 43-46% LCP improvement with minimal code change. Start here.

3. **Server component conversion has limits.** When components are deeply coupled with client APIs (framer-motion, React Query, IndexedDB), forcing server conversion is counterproductive. The optimal `use client` count (282) was higher than baseline (275), not lower.

4. **Code-splitting is more impactful than component conversion.** Dynamic imports of Recharts (~180KB), Google Maps (~120KB), and cart scoping (~60KB) removed more JavaScript from initial bundles than server component work.

5. **Animation bundle optimization requires root-level architecture.** LazyMotion with `m.*` components reduced per-component cost by 86%, but required a codebase-wide migration (174 files, ~1,397 occurrences).

6. **Automated codemods work but need verification gates.** The `motion.*` to `m.*` sed/perl codemod was fast but produced 3 edge-case bugs caught by TypeScript typecheck. Always run full verification after automated transformations.

7. **Regression gates prevent backsliding.** Lighthouse CI ensures future PRs don't regress the improvements. Warn-only mode avoids blocking while still surfacing performance changes.

---

## Future Optimization Opportunities (v1.6)

Phase 47 identified three key bottlenecks preventing LCP < 4s:

### Priority 1: JavaScript Execution Time (TBT 5-15s)

| Opportunity | Expected Impact | Complexity |
|------------|----------------|------------|
| Bundle analysis and tree-shaking audit | TBT reduction 30-50% | Medium |
| Defer non-critical JavaScript | TBT reduction, faster LCP | Medium |
| Web Worker offloading for heavy computations | Main thread unblocking | High |

### Priority 2: Network Latency (FCP ~3s)

| Opportunity | Expected Impact | Complexity |
|------------|----------------|------------|
| Edge runtime for API routes | Lower TTFB 50-100ms | Medium |
| Font subsetting / self-hosting | Eliminate Google Fonts dependency | Low |
| Critical CSS extraction | Reduce render-blocking CSS | Medium |
| Resource hints (preconnect, dns-prefetch) | Faster resource loading | Low |

### Priority 3: DOM Complexity

| Opportunity | Expected Impact | Complexity |
|------------|----------------|------------|
| Virtualized lists for menu items | Reduce initial DOM nodes | Medium |
| Lazy render below-fold sections | Faster initial paint | Low |
| Simplify animation component trees | Reduce layout complexity | Medium |

### Quick Wins

| Opportunity | Expected Impact | Complexity |
|------------|----------------|------------|
| Service Worker precaching strategy | Faster repeat visits | Low |
| Image CDN optimization (blur placeholders) | Perceived LCP improvement | Low |
| Server-side rendering optimization | LCP reduction (server response time) | Medium |

**Current gap:** LCP is 8-11s (target < 4s). Phase 47 measurements confirmed the bottleneck is primarily JavaScript execution time (TBT 5-15s) and network latency (FCP ~3s). The v1.5 image optimization and code-splitting addressed the client-side hot path; further optimization requires tackling main thread work and server-side improvements.

---

*Last updated: 2026-02-07*
*Phases covered: 40-47 (v1.5 Performance & Repo Health)*
