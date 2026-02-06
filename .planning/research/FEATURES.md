# Feature Landscape: LCP Optimization in Next.js 16 App Router

**Domain:** Performance optimization for food delivery PWA
**Focus:** Reducing LCP from 8.1s to <2.5s
**Context:** Next.js 16 App Router, GSAP + Framer Motion, 508 TypeScript files, ~62K LOC
**Researched:** 2026-02-05

## Table Stakes

Features users/Google expect. Missing = failure to meet Core Web Vitals threshold.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Image optimization with `next/image` | LCP element is often an image; Next.js Image auto-optimizes to AVIF/WebP | Low | Set `priority={true}` on hero/LCP images to preload |
| Font optimization with `next/font` | Eliminates render-blocking font requests, improves FCP/LCP by 200-500ms | Low | Automatic preloading, inlined CSS, self-hosting |
| Remove lazy loading from LCP element | Lazy loading above-the-fold delays LCP by 2-3s; Google explicitly warns against this | Low | **CRITICAL:** Use `loading="eager"` or remove attribute on LCP image |
| `fetchpriority="high"` on LCP element | Tells browser to prioritize LCP resource over other downloads | Low | Can reduce LCP from ~5s to ~3.7s alone |
| TTFB optimization (<600ms) | TTFB delay carries over to FCP/LCP; 1s TTFB = minimum 1s LCP | Medium | Enable caching, use CDN, optimize server response |
| Eliminate render-blocking JavaScript | JavaScript execution blocking is your stated root cause of 8.1s LCP | High | Defer non-critical scripts, minimize client JS bundle |
| React Server Components for data fetching | Shifts logic to server, reduces client JS payload by ~50KB+ per component | Medium | Default in App Router; keep heavy logic server-side |
| Code splitting with `next/dynamic` | Reduces initial bundle size, prevents non-critical code from blocking LCP | Medium | Use `ssr: false` for client-only components like modals |
| Remove unused dependencies | Each unused library adds to bundle size and parse time | Low | Audit with bundle analyzer; GSAP core is 23KB, Framer Motion is 32KB |
| Preload critical resources | LCP resource must start loading ASAP; resource load delay is major bottleneck | Low | Use `<link rel="preload">` for LCP image/font |

## Differentiators

Features that push beyond "good" (2.5s) toward "excellent" (<1s LCP). Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Streaming SSR with Suspense | Delivers instant page shell while streaming slow components; improves LCP by 1.2s+ | Medium | Wrap slow components in `<Suspense>`, serve shell first |
| Selective hydration | Only hydrate interactive components; reduces main thread blocking | Medium | Use Suspense boundaries, prioritize critical interactions |
| Partial Prerendering (PPR) | Static shell for instant load + dynamic content streamed; mobile LCP: 26.4s → 0.9s | High | Next.js 16 feature; requires route-level configuration |
| React Compiler (automatic memoization) | Eliminates unnecessary re-renders with zero manual code; 95%+ coverage | Low | Stable in Next.js 16; trades slightly slower builds for runtime perf |
| AVIF format for images | 20% better compression than WebP without quality loss | Low | Configure in `next.config.js`; ensure browser fallbacks |
| Modular animation library usage | Import only needed GSAP plugins vs full bundle; reduces JS parse time | Low | GSAP is modular (23KB core), Framer Motion is not (119KB fixed) |
| `font-display: swap` | Ensures text visible during font loading; prevents invisible text delaying LCP | Low | Automatically handled by `next/font` |
| Layout deduplication in routing | Next.js 16 optimizes prefetching and navigation; reduces redundant layouts | Low | Built-in; ensure proper layout hierarchy |
| CDN for static assets | Serve images/fonts from edge locations; reduces TTFB by 200-400ms | Medium | Requires infrastructure setup; Vercel does this automatically |
| Bundle analysis automation | Continuous monitoring of bundle size to prevent regressions | Low | Use `@next/bundle-analyzer`; set size budgets |

## Anti-Features

Features to explicitly NOT build. Common mistakes that seem helpful but hurt LCP.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Lazy load LCP/hero images | Delays LCP by 2-3s; browser defers image for other resources; Google warns explicitly | Use `loading="eager"` or omit attribute; add `priority={true}` and `fetchpriority="high"` |
| JavaScript-based image lazy loading | Even worse than native lazy loading; must wait for JS download + execution | Use native `loading="lazy"` for below-the-fold only; never for LCP element |
| Over-optimize images at expense of other factors | Image download time is rarely the bottleneck; TTFB and resource load delay are bigger | Focus on TTFB, eliminate render-blocking JS, then optimize images |
| Load all animation libraries upfront | 119KB Framer Motion + 23KB GSAP core = 142KB just for animations blocking LCP | Dynamic import animations with `next/dynamic` and `ssr: false`; defer until after LCP |
| Premature optimization without measurement | Optimizing wrong areas wastes effort; "quick fixes" rarely improve LCP meaningfully | Measure with Lighthouse/PageSpeed Insights first; identify actual bottlenecks |
| Use Client Components for everything | Sends all React code to client; increases JS bundle and hydration cost | Default to Server Components; only mark interactive components as "use client" |
| Aggressive code splitting of critical path | Splitting hero component creates extra network request, delaying LCP | Only split non-critical/below-fold components; keep LCP path in main bundle |
| Apply same optimization to all routes | Not all pages have same LCP element; hero image vs text vs map | Measure per-route; optimize each route's actual LCP element |
| Enable all Next.js features simultaneously | React Compiler increases build time; PPR requires careful boundaries | Enable features incrementally; measure impact; PPR is experimental |
| Ignore AVIF decode time on mobile | Smaller AVIF downloads faster but decodes slower on low-end devices; can negate benefit | Test on real devices; consider WebP for mobile, AVIF for desktop |
| Third-party scripts in `<head>` | External scripts block rendering; unpredictable downtime/lag outside your control | Load async/defer; use Next.js Script component with `strategy="afterInteractive"` |
| Forget srcset/responsive images | Sending 2000px image to mobile device wastes bandwidth and decode time | Use `next/image` (handles automatically) or manual srcset with proper sizes |

## Feature Dependencies

### Critical Path (Must implement in order)

```
1. Identify LCP element (Lighthouse/field data)
   ↓
2. Remove lazy loading from LCP element
   ↓
3. Add priority={true} + fetchpriority="high" to LCP element
   ↓
4. Optimize LCP resource (image → next/image, font → next/font)
   ↓
5. Eliminate render-blocking JavaScript on critical path
   ↓
6. Optimize TTFB (<600ms target)
```

### Parallel Optimizations (Independent, can do simultaneously)

```
- Code split non-critical components (modals, animations)
- Convert to React Server Components where possible
- Preload critical resources
- Enable React Compiler
- Setup bundle analysis
```

### Advanced Optimizations (After table stakes achieved)

```
Table Stakes Achieved (LCP < 2.5s)
   ↓
Streaming SSR + Suspense (target: <1.5s)
   ↓
Selective Hydration (target: <1s)
   ↓
Partial Prerendering (target: <0.9s)
```

### Animation Library Strategy

```
Current state: GSAP + Framer Motion both loaded upfront
   ↓
Audit: Which animations are critical to LCP?
   ↓
If none are critical:
   → Dynamic import both with ssr: false
   → Load after LCP painted
   ↓
If some are critical:
   → Use GSAP for critical (smaller, modular)
   → Dynamic import Framer Motion for non-critical
```

## MVP Recommendation

For achieving LCP < 2.5s, prioritize in this order:

### Phase 1: Quick Wins (Est. impact: 8.1s → 4-5s)
1. Remove lazy loading from LCP element
2. Add `priority={true}` and `fetchpriority="high"` to LCP image
3. Ensure using `next/image` and `next/font`
4. Identify and defer non-critical JavaScript blocking render

### Phase 2: JavaScript Reduction (Est. impact: 4-5s → 2.5-3s)
1. Dynamic import animation libraries with `ssr: false`
2. Convert data-fetching components to Server Components
3. Code split modals, tooltips, non-visible components
4. Audit and remove unused dependencies

### Phase 3: Infrastructure (Est. impact: 2.5-3s → 1.5-2s)
1. Optimize TTFB (caching, CDN)
2. Preload critical resources
3. Enable React Compiler
4. Implement Suspense boundaries for slow components

### Phase 4: Advanced (Est. impact: 1.5-2s → <1s)
- Streaming SSR with Suspense
- Selective hydration
- Partial Prerendering (experimental)

## Defer to Post-MVP

These are valuable but not blockers for LCP < 2.5s:

- **AVIF image format**: WebP is sufficient; AVIF decode time can hurt mobile
- **Partial Prerendering**: Experimental in Next.js 16; requires significant testing
- **Layout deduplication tuning**: Built-in optimization; minimal manual work needed
- **Font subsetting**: next/font handles automatically; manual subsetting is diminishing returns
- **Advanced bundle analysis**: Useful for monitoring, but basic analysis sufficient initially

## Context: Food Delivery PWA Specifics

### Likely LCP Elements by Route

| Route | Likely LCP Element | Optimization Priority |
|-------|-------------------|----------------------|
| Homepage | Hero image or restaurant card images | **CRITICAL** - highest traffic |
| Restaurant page | Restaurant header image or menu item image | **HIGH** - conversion path |
| Menu/Item page | Food item image | **HIGH** - conversion path |
| Checkout | Form elements or map (Google Maps) | **MEDIUM** - text/map not image |
| Order tracking | Map or status card | **MEDIUM** - map loaded dynamically |

### Animation Library Audit Needed

With both GSAP and Framer Motion:
- **Question 1:** Which animations run on initial page load before LCP?
  - If none → Dynamic import both with `ssr: false`
  - If some → Keep minimal critical animations, defer rest
- **Question 2:** Can you consolidate to one library?
  - GSAP: 23KB core, modular, better for complex sequences
  - Framer Motion: 119KB fixed, React-friendly, better for declarative animations
  - **Recommendation:** Audit usage; consider moving all to GSAP (smaller, tree-shakeable)

### Google Maps Consideration

Google Maps JavaScript API is ~600KB+ uncompressed:
- If map is LCP element on any route → Major problem
- **Solution:** Lazy load map component, show static map image as placeholder
- Use `next/dynamic` with `ssr: false` for map component
- Consider static map API for initial view, load interactive map after

### Service Worker Already Implemented

Existing service worker with caching is excellent foundation:
- Ensure critical LCP resources (images, fonts) are cached
- Use stale-while-revalidate for images
- Network-first for HTML to get latest content
- Don't cache service worker itself

## Complexity Assessment

| Feature Category | Effort | Risk | Impact on 8.1s → 2.5s Goal |
|------------------|--------|------|---------------------------|
| Remove lazy loading from LCP | 1 hour | Low | **HIGH** (likely -2-3s) |
| Add priority/fetchpriority | 1 hour | Low | **HIGH** (likely -1-2s) |
| Dynamic import animations | 4-8 hours | Medium | **HIGH** (likely -1-2s) |
| Convert to Server Components | 16-40 hours | Medium | **MEDIUM** (-0.5-1s) |
| TTFB optimization | 8-16 hours | Medium | **MEDIUM** (-0.5-1s) |
| Streaming SSR + Suspense | 16-32 hours | High | **MEDIUM** (-0.5-1.2s) |
| Partial Prerendering | 40+ hours | High | **HIGH** (-1-2s) but experimental |

## Sources

### Table Stakes Evidence
- [Optimize Largest Contentful Paint | web.dev](https://web.dev/articles/optimize-lcp)
- [Don't lazy load Largest Contentful Paint image | GTmetrix](https://gtmetrix.com/dont-lazy-load-lcp-image.html)
- [Google Warns: Lazy Loading Above-the-Fold Images Can Hurt LCP - Stan Ventures](https://www.stanventures.com/news/google-warns-lazy-loading-above-the-fold-images-can-hurt-lcp-4118/)
- [How to Optimize Core Web Vitals in NextJS App Router for 2025 - Makers' Den](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)
- [Next.js performance tuning: practical fixes for better Lighthouse scores](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores)

### Differentiators Evidence
- [Next.js 16 | Next.js Blog](https://nextjs.org/blog/next-16)
- [I Migrated a React App to Next.js 16 and Got a 218% Performance Boost on Mobile | Medium](https://medium.com/@desertwebdesigns/i-migrated-a-react-app-to-next-js-16-and-got-a-218-performance-boost-on-mobile-8ae35ee2a739)
- [How Suspense + Streaming + Selective Hydration Drive Next-Level Page Speed - Makers' Den](https://makersden.io/blog/suspense-streaming-selective-hydation-driving-next-level-speed-in-react-and-nextjs)
- [React Compiler in Next.js 16: Goodbye Manual Memoization | Mikul Gohil](https://www.mikul.me/blog/react-compiler-nextjs-16-goodbye-manual-memoization)
- [The Next.js 15 Streaming Handbook — SSR, React Suspense, and Loading Skeleton](https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/)

### Anti-Features Evidence
- [Common misconceptions about how to optimize LCP | web.dev](https://web.dev/blog/common-misconceptions-lcp)
- [How To Fix Largest Contentful Paint Image Was Lazily Loaded | DebugBear](https://www.debugbear.com/docs/lcp-lazily-loaded)
- [7 Common Performance Mistakes in Next.js and How to Fix Them | Medium](https://medium.com/full-stack-forge/7-common-performance-mistakes-in-next-js-and-how-to-fix-them-edd355e2f9a9)
- [10 Performance Mistakes in Next.js 16 That Are Killing Your App | Medium](https://medium.com/@sureshdotariya/10-performance-mistakes-in-next-js-16-that-are-killing-your-app-and-how-to-fix-them-2facfab26bea)

### Animation Libraries Evidence
- [Framer Motion vs GSAP](https://www.gabrielveres.com/blog/framer-motion-vs-gsap)
- [Web Animation for Your React App: Framer Motion vs GSAP - Semaphore](https://semaphore.io/blog/react-framer-motion-gsap)
- [GSAP vs. Framer Motion: A Comprehensive Comparison | Medium](https://tharakasachin98.medium.com/gsap-vs-framer-motion-a-comprehensive-comparison-0e4888113825)

### Code Splitting & Optimization Evidence
- [Dynamic imports and code splitting with Next.js - LogRocket](https://blog.logrocket.com/dynamic-imports-code-splitting-next-js/)
- [Optimize Next.js Performance with Smart Code Splitting | Medium](https://medium.com/@aalbertini95_90842/optimize-next-js-performance-with-smart-code-splitting-what-to-load-when-and-why-485dac08cd24)
- [Stop the Wait: A Developer's Guide to Smashing LCP in Next.js | Medium](https://medium.com/@iamsandeshjain/stop-the-wait-a-developers-guide-to-smashing-lcp-in-next-js-634e2963f4c7)

### Font & Image Optimization Evidence
- [Optimizing: Fonts | Next.js](https://nextjs.org/docs/14/app/building-your-application/optimizing/fonts)
- [Core Web Vitals for React + Next.js Sites: Real Fixes That Cut LCP by 50% — Rise Marketing](https://rise.co/blog/core-web-vitals-for-react-next.js-sites-real-fixes-that-cut-lcp-by-50percent)
- [Optimizing Next.js Performance: LCP, Render Delay & Hydration](https://www.iamtk.co/optimizing-nextjs-performance-lcp-render-delay-hydration)
