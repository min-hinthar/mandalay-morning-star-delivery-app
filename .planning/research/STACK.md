# Technology Stack - LCP Optimization

**Project:** Mandalay Morning Star Delivery App
**Milestone:** Performance Optimization (LCP 8.1s → <2.5s)
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

Next.js 16 provides native performance optimizations (React Compiler, Turbopack) that eliminate need for third-party virtual DOM replacements. Focus on JavaScript reduction through code splitting, deferred animations, and third-party script management. No major stack additions needed—optimize existing packages.

---

## Native Next.js 16 Capabilities (Use These First)

### React Compiler (Stable in v16)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Compiler | Built-in | Auto-memoization | Eliminates manual useMemo/useCallback, reduces re-renders. Stable as of Next.js 16, production-ready at Meta. Enable via `reactCompiler: true` in config. |

**Installation:**
```bash
npm install babel-plugin-react-compiler@latest
```

**Configuration:**
```ts
// next.config.ts
const nextConfig = {
  reactCompiler: true,
}
```

**Impact:** Zero-code automatic memoization. Reduces JavaScript execution by eliminating unnecessary component re-renders.

**Confidence:** HIGH (official Next.js 16 feature, stable)

**Sources:**
- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [React Compiler in Next.js 16](https://medium.com/better-dev-nextjs-react/react-compiler-in-next-js-16-what-it-fixes-what-it-breaks-and-how-to-ship-it-safely-62881c4c0b74)

---

### Turbopack Bundle Analyzer (v16.1+)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js Bundle Analyzer | Built-in (experimental) | Bundle inspection for Turbopack | Replaces @next/bundle-analyzer for Turbopack builds. Precise import tracing, module graph visualization. |

**Note:** Already have @next/bundle-analyzer installed. Keep it for webpack builds, use experimental Turbopack analyzer for faster iteration.

**Access:** `next build --experimental-bundle-analyzer`

**Confidence:** MEDIUM (experimental feature in v16.1)

**Sources:**
- [Next.js 16.1 Bundle Analyzer](https://nextjs.org/blog/next-16-1)

---

## Code Splitting & Dynamic Imports

### next/dynamic (Native)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/dynamic | Built-in | Component lazy-loading | Already available. Use to defer heavy components (Google Maps, animations, modals). |

**Critical pattern for LCP:**
```tsx
// Defer non-critical components
const GoogleMap = dynamic(() => import('@/components/GoogleMap'), {
  ssr: false,
  loading: () => <MapSkeleton />
})

const AnimatedHero = dynamic(() => import('@/components/AnimatedHero'), {
  loading: () => <StaticHero />
})
```

**What to dynamically import:**
- Google Maps (loads 3.86 MB → defer until in viewport)
- Framer Motion/GSAP animations (defer to client, ssr: false)
- Stripe checkout UI (load on-demand)
- Modals, tooltips, conditional UI

**Anti-pattern:** Over-splitting small components creates network overhead.

**Confidence:** HIGH (official Next.js feature)

**Sources:**
- [Code Splitting Best Practices](https://blazity.com/blog/code-splitting-next-js)
- [Dynamic Imports in Next.js](https://daily.dev/blog/code-splitting-with-dynamic-imports-in-nextjs)

---

### react-intersection-observer (For Viewport-Based Loading)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-intersection-observer | ^9.15.0 | Load components when in viewport | Defer Google Maps, heavy animations until user scrolls to them. Reduces initial JS execution. |

**Installation:**
```bash
npm install react-intersection-observer
```

**Pattern:**
```tsx
import { useInView } from 'react-intersection-observer'

function MapSection() {
  const { ref, inView } = useInView({ triggerOnce: true })

  return (
    <div ref={ref}>
      {inView ? <GoogleMap /> : <MapPlaceholder />}
    </div>
  )
}
```

**Impact:** Delays loading Google Maps API (3.86 MB saved from initial load) until user scrolls to map section.

**Confidence:** HIGH (established pattern, 9M+ weekly downloads)

**Sources:**
- [Lazy Loading Maps with Intersection Observer](https://damely-tineo.medium.com/lazy-loading-maps-with-intersection-observer-api-52c75c04bd04)
- [Google Maps Optimization Guide](https://developers.google.com/maps/optimization-guide)

---

## Third-Party Script Management

### Next.js Script Component (Native)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/script | Built-in | Script loading strategies | Control when Google Maps, Stripe, analytics load. Use lazyOnload for non-critical scripts. |

**Critical for LCP:**
```tsx
// Google Maps API - defer until needed
<Script
  src="https://maps.googleapis.com/maps/api/js?key=..."
  strategy="lazyOnload" // Loads during browser idle time
/>

// Stripe - load after interactive
<Script
  src="https://js.stripe.com/v3/"
  strategy="afterInteractive"
/>

// Analytics - lowest priority
<Script
  src="https://www.googletagmanager.com/gtag/js"
  strategy="lazyOnload"
/>
```

**Strategies:**
- `lazyOnload`: Browser idle time (Google Maps, analytics)
- `afterInteractive`: After hydration (Stripe, important scripts)
- Never `beforeInteractive` for third-party scripts

**Confidence:** HIGH (official Next.js feature)

**Sources:**
- [Optimizing Third-Party Scripts](https://developer.chrome.com/blog/script-component)
- [Next.js Script Strategies](https://www.seocopilot.com/next-js/next-js-script-component-with-afterinteractive-powerful-strategies-to-improve-loading)

---

### Partytown (DO NOT ADD)
| Technology | Recommendation | Reason |
|------------|---------------|--------|
| @builder.io/partytown | AVOID | Unsupported with Next.js App Router. Worker strategy experimental, Pages Router only. Manual integration fragile. Use next/script lazyOnload instead. |

**Why avoid:**
- "Worker strategy is currently unsupported with the Next.js 13+ app directory"
- Adds complexity without benefit over native lazyOnload
- Beta stability, active compatibility issues

**Confidence:** HIGH (official Next.js docs confirm limitation)

**Sources:**
- [Next.js Scripts Guide](https://nextjs.org/docs/pages/guides/scripts)
- [Partytown Next.js Integration](https://partytown.builder.io/nextjs)

---

## Animation Optimization

### Existing Stack Optimization (No New Packages)
| Library | Current Version | Optimization Strategy |
|---------|----------------|----------------------|
| Framer Motion | 12.26.1 | Use LazyMotion for 40% size reduction. Tree-shake unused features. |
| GSAP | 3.14.2 | Import specific modules only (gsap/core, ScrollTrigger). Avoid importing all of GSAP (23KB → 8-10KB). |

**Framer Motion LazyMotion pattern:**
```tsx
import { LazyMotion, domAnimation, m } from 'framer-motion'

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div animate={{ opacity: 1 }} />
    </LazyMotion>
  )
}
```

**Impact:** Reduces Framer Motion from 32KB to ~19KB gzipped.

**GSAP modular imports:**
```tsx
import { gsap } from 'gsap/core'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// Don't import entire 'gsap' package
```

**Critical decision:** Keep both libraries (already installed). Framer Motion for React components, GSAP for complex timelines. Optimize usage, don't replace.

**DO NOT ADD:**
- Million.js (compatibility issues with Next.js, limited activity since May 2024)
- Preact (React 19 features unsupported, requires full aliasing, risky migration)

**Confidence:** HIGH (official optimization patterns)

**Sources:**
- [Framer Motion LazyMotion](https://motion.dev/docs/react-reduce-bundle-size)
- [Framer Motion vs GSAP](https://semaphore.io/blog/react-framer-motion-gsap)

---

## Font Optimization

### next/font (Native)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/font | Built-in | Variable font optimization | Self-hosts fonts, eliminates external requests, zero layout shift. Use variable fonts for best performance. |

**Critical for LCP:**
```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Shows fallback immediately
  preload: true,   // Preloads for LCP element
})
```

**Impact:**
- Removes Google Fonts network requests
- Build-time optimization (fonts bundled as static assets)
- Font files served from same domain (faster)

**Variable fonts recommended:** Single file, multiple weights. No weight specification needed.

**Confidence:** HIGH (official Next.js feature, updated Jan 2026)

**Sources:**
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Variable Fonts Best Practices](https://www.contentful.com/blog/next-js-fonts/)

---

## Performance Monitoring (Use Existing Tools)

### Already Installed
| Tool | Current Status | Usage |
|------|---------------|-------|
| @next/bundle-analyzer | Installed | Use for webpack builds. Generates visual reports. Run with `ANALYZE=true npm run build`. |
| Serwist | 9.5.4 | Service worker already configured. Verify caching strategy for static assets. |

### Recommended Addition: Lighthouse CI
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @lhci/cli | ^0.15.0 | Automated performance regression testing | Catches LCP regressions in CI. Sets budgets for bundle size, LCP, TBT. |

**Installation:**
```bash
npm install -D @lhci/cli
```

**Configuration (.lighthouserc.json):**
```json
{
  "ci": {
    "collect": {
      "staticDistDir": ".next",
      "url": ["http://localhost:3000/"]
    },
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }],
        "cumulative-layout-shift": ["warn", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

**Impact:** Prevents LCP regressions from being deployed. Enforces performance budgets.

**Confidence:** HIGH (official Google Lighthouse tooling)

**Sources:**
- [Performance Tracking & Bundle Analysis](https://foundations.significa.co/guides/performance-tracking)
- [Lighthouse CI Integration](https://github.com/GoogleChrome/lighthouse/issues/3862)

---

## Tree-Shaking Optimization

### Configuration (No New Packages)
| Technique | Implementation | Purpose |
|-----------|---------------|---------|
| sideEffects in package.json | Set `"sideEffects": false` | Enables aggressive tree-shaking. Mark CSS imports as side effects: `["*.css"]`. |
| ESM imports | Import from ESM packages | Avoid CJS dependencies (cannot be tree-shaken). Check package.json `"type": "module"`. |

**Critical for bundle size:**
```json
// package.json
{
  "sideEffects": ["*.css", "*.scss"]
}
```

**Impact:** Removes unused exports from libraries. Particularly effective for TanStack Query, Zustand.

**Warning:** Incorrectly marking files without side effects can break CSS imports and global initializers.

**Confidence:** MEDIUM (requires careful configuration)

**Sources:**
- [Tree Shaking in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Tree Shaking Reference Guide](https://www.smashingmagazine.com/2021/05/tree-shaking-reference-guide/)

---

## Image Optimization (Native)

### next/image (Built-in, Improved in v16)
| Technology | Version | Changes in v16 | Why |
|------------|---------|---------------|-----|
| next/image | Built-in | minimumCacheTTL: 60s → 4 hours | Reduces revalidation requests. Serves optimized AVIF/WebP. |

**Next.js 16 defaults (already optimized):**
- Cache TTL increased to 4 hours (reduces CDN load)
- Quality default: 75 (faster processing)
- Removed 16px size from defaults (smaller srcset)

**Critical for LCP:**
```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  priority // Preloads for LCP element
  sizes="100vw"
/>
```

**No changes needed** - Next.js 16 already optimized.

**Confidence:** HIGH (native feature)

**Sources:**
- [Next.js 16 Image Defaults](https://nextjs.org/blog/next-16)

---

## Alternatives Considered (DO NOT ADD)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Virtual DOM Optimization | React Compiler (native) | Million.js | Compatibility issues with Next.js, last update May 2024, 116 open issues. React Compiler is stable and native. |
| React Replacement | Keep React 19 | Preact/compat | React 19 features unsupported (use() hook). 48% size reduction not worth migration risk. Security patch required (Jan 2026). |
| Script Loading | next/script lazyOnload | Partytown | Unsupported with App Router. Worker strategy experimental, Pages Router only. Native lazyOnload sufficient. |
| Animation Library | Optimize existing (Framer + GSAP) | Replace with Motion One | Already have both libraries. Optimization via LazyMotion/modular imports more effective than migration. |
| Bundle Analysis | @next/bundle-analyzer + Turbopack analyzer | webpack-bundle-analyzer directly | Next.js wrappers provide framework-specific insights (route-based chunks). |

---

## Installation Summary

**Add these:**
```bash
# Performance monitoring
npm install -D @lhci/cli

# Viewport-based loading
npm install react-intersection-observer

# React Compiler (if not already installed)
npm install babel-plugin-react-compiler@latest
```

**Enable these (next.config.ts):**
```ts
const nextConfig = {
  reactCompiler: true, // Auto-memoization

  // Keep existing @next/bundle-analyzer config
}
```

**Optimize these (no installation needed):**
- Framer Motion: Implement LazyMotion
- GSAP: Switch to modular imports
- next/dynamic: Apply to Google Maps, animations, modals
- next/script: Move scripts to lazyOnload strategy
- next/font: Verify variable fonts, display: swap

---

## Integration Checklist

**Before implementation:**
- [ ] Enable React Compiler, test for rendering issues
- [ ] Configure Lighthouse CI with LCP budget (2500ms)
- [ ] Audit package.json sideEffects declarations
- [ ] Map third-party scripts to loading strategies (lazyOnload vs afterInteractive)

**During implementation:**
- [ ] Wrap Google Maps in dynamic() with intersection observer
- [ ] Convert Framer Motion to LazyMotion pattern
- [ ] Switch GSAP to modular imports (gsap/core, ScrollTrigger only)
- [ ] Move Google Maps API script to lazyOnload
- [ ] Verify next/font uses variable fonts with display: swap

**After implementation:**
- [ ] Run Lighthouse CI to confirm LCP < 2.5s
- [ ] Check bundle analyzer for unexpected growth
- [ ] Verify React Compiler didn't break animations
- [ ] Test service worker (Serwist) caching strategy

---

## Confidence Assessment

| Technology | Confidence | Source Quality |
|-----------|-----------|----------------|
| React Compiler | HIGH | Official Next.js 16 docs, production at Meta |
| next/dynamic | HIGH | Official Next.js feature, established pattern |
| next/script | HIGH | Official Next.js docs, Chrome DevRel guidance |
| next/font | HIGH | Official Next.js docs, updated Jan 2026 |
| LazyMotion | HIGH | Official Framer Motion docs |
| Lighthouse CI | HIGH | Official Google tooling |
| Intersection Observer | HIGH | Web standard, 9M+ weekly downloads |
| Million.js rejection | MEDIUM | Last activity May 2024, limited 2026 data |
| Preact rejection | HIGH | React 19 incompatibility confirmed in recent articles |
| Partytown rejection | HIGH | Official Next.js docs confirm App Router limitation |

---

## Key Decisions Rationale

**Why no virtual DOM replacement (Million.js)?**
React Compiler (stable in Next.js 16) provides automatic memoization without third-party dependencies. Million.js has compatibility issues and limited recent activity (last release May 2024).

**Why keep both Framer Motion and GSAP?**
Different use cases: Framer for React component animations (declarative), GSAP for complex timelines (imperative). Optimization via LazyMotion/modular imports reduces bundle impact without migration risk.

**Why avoid Partytown?**
Unsupported with App Router. Native next/script lazyOnload strategy achieves same goal (defer third-party scripts) with better framework integration.

**Why add Lighthouse CI?**
Prevents LCP regressions from being deployed. Enforces performance budgets in CI pipeline. Catches bundle size growth before production.

**Why next/font over external Google Fonts?**
Self-hosting eliminates external network requests (major LCP contributor). Build-time optimization, zero layout shift, better privacy.

---

## Sources

Performance Optimization:
- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [React Compiler in Next.js 16](https://medium.com/better-dev-nextjs-react/react-compiler-in-next-js-16-what-it-fixes-what-it-breaks-and-how-to-ship-it-safely-62881c4c0b74)
- [Next.js Performance Guide 2026](https://www.sujalbuild.in/blog/nextjs-seo-performance-guide)

Code Splitting:
- [Code Splitting Best Practices](https://blazity.com/blog/code-splitting-next-js)
- [Dynamic Imports Guide](https://daily.dev/blog/code-splitting-with-dynamic-imports-in-nextjs)

Script Management:
- [Optimizing Third-Party Scripts](https://developer.chrome.com/blog/script-component)
- [Next.js Script Component](https://nextjs.org/docs/pages/guides/scripts)
- [Partytown Next.js Limitations](https://partytown.builder.io/nextjs)

Animation Optimization:
- [Framer Motion LazyMotion](https://motion.dev/docs/react-reduce-bundle-size)
- [Framer Motion vs GSAP](https://semaphore.io/blog/react-framer-motion-gsap)

Font Optimization:
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Variable Fonts Guide](https://www.contentful.com/blog/next-js-fonts/)

Bundle Analysis:
- [Next.js Bundle Analyzer](https://nextjs.org/docs/app/guides/package-bundling)
- [Lighthouse CI Integration](https://foundations.significa.co/guides/performance-tracking)

Google Maps:
- [Google Maps Optimization Guide](https://developers.google.com/maps/optimization-guide)
- [Lazy Loading Maps](https://damely-tineo.medium.com/lazy-loading-maps-with-intersection-observer-api-52c75c04bd04)

Tree Shaking:
- [Optimized Package Imports](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Tree Shaking Reference](https://www.smashingmagazine.com/2021/05/tree-shaking-reference-guide/)
