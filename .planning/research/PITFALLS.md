# Domain Pitfalls: LCP Optimization in Animation-Heavy Next.js Apps

**Domain:** Performance optimization with GSAP + Framer Motion in Next.js 16 App Router
**Researched:** 2026-02-05
**Confidence:** HIGH (official Next.js docs + recent 2026 sources + project context)

---

## Critical Pitfalls

Mistakes that cause rewrites, regression, or catastrophic performance issues.

### Pitfall 1: Over-Marking with "use client"

**What goes wrong:** Marking entire page components or high-level layouts with `"use client"` forces the browser to hydrate everything, adding hundreds of KB of JavaScript that blocks LCP. Simple pages can take more than 2 seconds to become interactive.

**Why it happens:** Developers assume animation libraries require client-side rendering for the entire component tree rather than just interactive leaf components.

**Consequences:**
- LCP increases by 1-3 seconds due to massive JavaScript bundles
- Server Components optimization completely disabled
- Hydration blocks interactivity on low-end devices
- TBT (Total Blocking Time) increases dramatically

**Prevention:**
- Use `"use client"` only at the leaf component level (buttons, interactive cards)
- Keep page layouts and static content as Server Components
- Push client boundaries as deep into the component tree as possible
- Audit bundle size: each `"use client"` boundary adds an entry point

**Detection:**
- Bundle analysis shows unexpectedly large client chunks
- Lighthouse shows high TBT during hydration
- Field data shows slow Time to Interactive (TTI)

**Warning signs:**
- Entire page files marked with `"use client"`
- Context providers at root level forcing client rendering
- Animation imports in Server Component files

**Phase implications:** Address in Phase 1-2 (foundation) before code splitting work begins.

---

### Pitfall 2: Barrel Import Performance Cliff

**What goes wrong:** Importing from barrel files (e.g., `import { IconName } from 'lucide-react'`) forces Next.js to process thousands of unused modules, adding 200-800ms overhead just to import a single icon. In extreme cases, it can take a few seconds.

**Why it happens:** Barrel files re-export everything. Even when importing one module, the bundler must parse the entire file graph to determine tree-shaking eligibility.

**Consequences:**
- Dev server startup slowdown (15-70% slower)
- Production cold starts delayed in serverless
- LCP increased by 200-800ms from bloated initial bundle
- Animation libraries like GSAP plugins suffer same issue

**Prevention:**
- Use direct imports: `import IconName from 'lucide-react/dist/esm/icons/icon-name'`
- Configure Next.js `optimizePackageImports` for common libraries
- Next.js 16 pre-configures `lucide-react`, `@headlessui/react` automatically
- Audit animation library imports (GSAP plugins, Framer Motion utilities)

**Detection:**
```bash
# Check bundle analyzer for unexpectedly large chunks
# Look for packages importing 100+ modules
npm run build -- --analyze
```

**Warning signs:**
- Import statements like `import { * } from 'library'`
- Single component importing entire icon library
- GSAP plugins imported via barrel file

**Phase implications:** Fix in Phase 1 (infrastructure) — affects all subsequent code splitting work.

---

### Pitfall 3: Hydration Blocking Animations

**What goes wrong:** GSAP/Framer Motion initialization runs during hydration, blocking the main thread for hundreds of milliseconds. Users see content but can't interact. React error 423 (hydration mismatch) re-renders the entire root, causing LCP image to be reported late.

**Why it happens:** Animation setup runs in `useEffect` or component mount, which happens during hydration. Complex timelines, ScrollTrigger registration, and DOM measurements block the main thread.

**Consequences:**
- 300-1000ms delay before page becomes interactive
- Poor INP (Interaction to Next Paint) scores
- LCP reported late if hydration error occurs
- Users clicking buttons get no feedback

**Prevention:**
- Defer non-critical animations with `requestIdleCallback` or `setTimeout`
- Use progressive hydration via Suspense boundaries
- Phase animations: critical first → next repaint → decorative delayed
- Move ScrollTrigger initialization to after first paint:
  ```typescript
  useEffect(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, []);
  ```

**Detection:**
- Chrome DevTools Performance: long tasks during hydration (red blocks)
- Lighthouse: high TBT score
- Field data: slow INP in Chrome User Experience Report

**Warning signs:**
- `useEffect` running heavy GSAP timelines immediately
- ScrollTrigger calculations in component mount
- Framer Motion `initial` animations on all elements above-the-fold

**Phase implications:** Must address in Phase 2-3 (animation optimization) before shipping.

---

### Pitfall 4: GSAP ScrollTrigger Memory Leaks on Route Change

**What goes wrong:** ScrollTrigger instances aren't cleaned up when navigating between pages in App Router, causing memory consumption to grow, CPU spikes to 100%, and eventual application crashes.

**Why it happens:** Next.js App Router uses client-side navigation. Components unmount but ScrollTrigger instances persist unless explicitly killed. Race conditions in ScrollTrigger package exacerbate the issue.

**Consequences:**
- Application becomes unresponsive after 3-5 page navigations
- Memory leaks causing browser crashes on mobile
- Scroll jank and missed frames
- ScrollTrigger triggers not lining up after navigation

**Prevention:**
- Use `useGSAP` hook with proper cleanup:
  ```typescript
  import { useGSAP } from '@gsap/react';

  useGSAP(() => {
    const trigger = ScrollTrigger.create({ /* config */ });

    return () => {
      trigger.kill();
    };
  }, { scope: containerRef });
  ```
- Call `ScrollTrigger.refresh()` once after all animations initialize
- Centralize GSAP configuration to avoid multiple plugin registrations
- Never register plugins in component files

**Detection:**
- Memory profiler shows growing heap after navigation
- Console warnings about detached DOM nodes
- ScrollTrigger animations glitching after route change

**Warning signs:**
- ScrollTrigger created without cleanup function
- GSAP imported and plugins registered in multiple files
- No `ScrollTrigger.kill()` or `ScrollTrigger.getAll().forEach(t => t.kill())`

**Phase implications:** Critical for Phase 3 (GSAP optimization) — must fix before route-level code splitting.

---

### Pitfall 5: Framer Motion Bundle Size Explosion

**What goes wrong:** Framer Motion's 32KB gzipped bundle isn't modular. Using it for basic animations forces the entire library into the client bundle, even if only using simple fade/slide effects.

**Why it happens:** Framer Motion is tightly coupled — tree-shaking has limited effect. Layout animations and gestures are tied to React's rendering cycle, causing unnecessary JavaScript in components that only need simple opacity transitions.

**Consequences:**
- +32KB minimum to client bundle even for trivial animations
- Complex animations lag on low-end devices
- Layout calculations tied to React render cycle cause dropped frames
- Heavy state updates in nested `motion` components cause jank

**Prevention:**
- Use CSS animations for simple opacity/transform effects
- Reserve Framer Motion for gestures, layout animations, complex sequences
- Dynamic import Framer Motion components that aren't above-the-fold:
  ```typescript
  const MotionDiv = dynamic(() => import('framer-motion').then(m => m.motion.div), {
    ssr: false,
    loading: () => <div>Loading...</div>
  });
  ```
- For critical path: use GSAP (better performance) or CSS (zero JS)

**Detection:**
- Bundle analyzer shows `framer-motion` in main chunk
- Components using `<motion.div>` for simple fade-in effects
- Performance profiler shows React re-renders during animations

**Warning signs:**
- `motion` components used throughout the app for basic effects
- Framer Motion imported in Server Components (forces "use client")
- No dynamic imports for below-the-fold animations

**Phase implications:** Address in Phase 2 (code splitting) — determine which animations need Framer Motion vs CSS/GSAP.

---

## Moderate Pitfalls

Mistakes that cause delays, performance regression, or technical debt.

### Pitfall 6: will-change Overuse

**What goes wrong:** Adding `will-change` to multiple elements or leaving it applied permanently causes excessive memory use, GPU hogging, and slower page load. The browser creates layers for everything, degrading performance instead of improving it.

**Why it happens:** Developers apply `will-change` as premature optimization or misunderstand it as a "make animations faster" property.

**Consequences:**
- Increased memory usage and GPU overhead
- Slower page rendering due to excessive layer creation
- Battery drain on mobile devices
- Worse performance than not using it

**Prevention:**
- Use `will-change` only as a last resort for proven performance issues
- Apply it just before animation starts, remove after animation ends:
  ```typescript
  element.style.willChange = 'transform';
  // ... animation ...
  element.style.willChange = 'auto';
  ```
- Do NOT apply on `:hover` — browser can't prepare mid-animation
- Prefer `transform` and `opacity` (compositor properties) which are fast by default

**Detection:**
- DevTools Rendering panel: excessive green layer borders
- Performance profiler: high GPU memory usage
- Animations stuttering despite `will-change`

**Warning signs:**
- `will-change` in global CSS or applied to many elements
- `will-change` on non-animated elements
- `will-change: transform, opacity, width, height` (only composite-able properties benefit)

---

### Pitfall 7: Animating Layout Properties

**What goes wrong:** Animating `width`, `height`, `margin`, `padding` forces browser reflow/repaint on every frame (expensive), causing dropped frames and jank. LCP can be delayed if layout animations run during initial paint.

**Why it happens:** Layout properties require recalculating entire page layout. Developers use them because they're intuitive (animate the thing you want to change).

**Consequences:**
- 60fps drops to 20-30fps
- Main thread blocked, delaying LCP/INP
- Jank on low-end devices
- Battery drain

**Prevention:**
- Use `transform: scale()` instead of `width`/`height`
- Use `transform: translate()` instead of `margin`/`padding`
- Animate `opacity` for fade effects (GPU-accelerated)
- Reserve layout animations for user-triggered interactions (not page load)

**Detection:**
- Performance profiler: purple "Recalculate Style" and "Layout" blocks
- Lighthouse warns about layout shifts (CLS)
- Animations feel choppy

**Warning signs:**
- GSAP/Framer animating `width`, `height`, `top`, `left`, `margin`
- Glassmorphism blur effects animating `filter` (also expensive)

---

### Pitfall 8: requestAnimationFrame Without Throttling

**What goes wrong:** Using `requestAnimationFrame` inside React state update loops causes excessive re-renders on high refresh rate displays (120Hz). React doesn't throttle automatically.

**Why it happens:** `rAF` fires on every display refresh. On 120Hz screens, that's 120 times per second. Triggering state updates at that rate overwhelms React.

**Consequences:**
- Excessive React renders (120/sec instead of 60/sec)
- Main thread saturation
- Battery drain
- Animation performance degrades despite using `rAF`

**Prevention:**
- Use `useRef` instead of state for animation values when possible
- Throttle updates manually:
  ```typescript
  let lastUpdate = 0;
  const throttle = 16; // ~60fps

  requestAnimationFrame((timestamp) => {
    if (timestamp - lastUpdate < throttle) return;
    lastUpdate = timestamp;
    // ... update logic
  });
  ```
- Avoid triggering state updates inside `rAF` loops
- For scroll-driven animations, use GSAP ScrollTrigger (optimized) instead of manual `rAF`

**Detection:**
- React DevTools Profiler: component rendering 100+ times/sec
- High CPU usage during scroll
- 120Hz devices show worse performance than 60Hz

---

### Pitfall 9: Glassmorphism Blur Performance Issues

**What goes wrong:** Heavy backdrop blur (30px+) in glassmorphism cards causes GPU saturation on low-end devices, leading to dropped frames, lag, and crashes. Multiple translucent layers compound the problem.

**Why it happens:** Blur requires GPU compositing on every frame. Older smartphones (2020-era mid-range) can't handle multiple blurred layers.

**Consequences:**
- Scroll jank and dropped frames
- Crashes on low-memory devices
- LCP delayed as GPU struggles with initial paint
- Battery drain

**Prevention:**
- Limit blur radius: 20px max, 10-12px for mobile
- Reduce layer count: avoid nested glassmorphism cards
- Use device detection to disable blur on low-power devices:
  ```typescript
  // Project already has device detection in v1.4
  const isLowPower = deviceMemory <= 4 || hardwareConcurrency <= 4;
  const blurAmount = isLowPower ? 'backdrop-blur-sm' : 'backdrop-blur-3xl';
  ```
- Provide fallback: solid background with opacity
- Use CSS `will-change: backdrop-filter` only during scroll (not permanent)

**Detection:**
- GPU profiler shows excessive compositing
- Scroll performance degrades with glassmorphism enabled
- Mobile Safari shows black boxes instead of blur

**Warning signs:**
- Multiple overlapping blur layers
- `backdrop-blur-3xl` (40px) or higher used on project cards
- No low-power device fallback

**Project context:** Current implementation uses 30px blur on UnifiedMenuItemCard. Consider reducing to 20px or implementing device-adaptive blur levels.

---

### Pitfall 10: Lazy Loading LCP Images

**What goes wrong:** Adding `loading="lazy"` to hero images or largest contentful paint elements delays their load, making LCP worse instead of better.

**Why it happens:** Misunderstanding that lazy loading is for performance. It helps overall page weight but hurts LCP if applied to above-the-fold content.

**Consequences:**
- LCP increases by 500-2000ms
- Hero image loads late, causing poor perceived performance
- Google penalizes page in search rankings (LCP > 2.5s)

**Prevention:**
- Use `priority` prop on Next.js `<Image>` for LCP images
- Set `fetchpriority="high"` on hero images
- Preload LCP image in `<head>`:
  ```tsx
  <link rel="preload" as="image" href="/hero.jpg" fetchpriority="high" />
  ```
- Reserve lazy loading for below-fold images

**Detection:**
- Lighthouse identifies LCP element and flags if lazy loaded
- Network waterfall shows hero image loading late
- LCP metric > 2.5s in field data

**Project context:** Hero section with 13 floating emojis and 4-layer parallax uses CSS animations (not images). Ensure menu card images on homepage use `priority` prop for above-fold items.

---

### Pitfall 11: Parallax on Low-Power Devices

**What goes wrong:** Multi-layer parallax scroll effects drain battery and cause jank on low-power devices (<=4GB RAM, <=4 cores). Scroll performance degrades to <30fps.

**Why it happens:** Parallax requires updating `transform` on multiple elements during scroll. Low-power GPUs can't keep up with 60fps transform updates.

**Consequences:**
- Scroll jank and dropped frames
- Battery drain (important for mobile food delivery app)
- Motion sickness for users with vestibular disorders
- Poor Core Web Vitals (INP degradation)

**Prevention:**
- Disable parallax on low-power devices
- Use `prefers-reduced-motion` media query:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .parallax { transform: none !important; }
  }
  ```
- Limit parallax to 2-3 layers maximum
- Use `will-change: transform` only during active scroll (add/remove dynamically)

**Detection:**
- Performance profiler shows dropped frames during scroll
- `prefers-reduced-motion` not respected
- No device capability detection

**Warning signs:**
- 4+ parallax layers
- Parallax enabled on all devices without detection
- No accessibility consideration for motion sensitivity

**Project context:** V1.4 already implements device-adaptive animations with parallax disabled on low-power devices (<=4GB RAM, <=4 cores). Ensure this pattern continues in LCP optimization phase.

---

### Pitfall 12: Dynamic Import Without SSR Disabled for Client-Only Libraries

**What goes wrong:** Dynamically importing animation libraries without `ssr: false` causes hydration mismatches and errors. Server tries to execute browser-only code (window, document).

**Why it happens:** GSAP and Framer Motion rely on browser APIs. Without SSR disabled, Next.js attempts to render them on the server.

**Consequences:**
- Hydration errors: "Text content did not match"
- Server crashes: `window is not defined`
- Flash of unstyled content (FOUC)
- Animation components fail to render

**Prevention:**
- Always use `ssr: false` for client-only animation libraries:
  ```typescript
  const AnimatedComponent = dynamic(() => import('./AnimatedComponent'), {
    ssr: false,
    loading: () => <Skeleton />
  });
  ```
- Check imports with `typeof window !== 'undefined'` guards
- Use `"use client"` for components using browser APIs

**Detection:**
- Console errors: "window is not defined"
- Hydration mismatch warnings
- Visual flash on page load

---

### Pitfall 13: Service Worker Caching Animation Assets Incorrectly

**What goes wrong:** Over-caching animation-related JavaScript (GSAP, Framer Motion) prevents updates from deploying. Users stuck on old version with broken animations. Installation fails if any asset 404s.

**Why it happens:** Aggressive precaching strategy caches too much. Developers cache entire libraries without versioning.

**Consequences:**
- New animations don't appear after deployment
- Broken animations persist in cache
- Service worker installation fails on missing assets
- Stale JavaScript causes runtime errors

**Prevention:**
- Use runtime caching (not precaching) for animation libraries
- Cache-bust with version query params or hashes
- Use `NetworkFirst` strategy for JS bundles:
  ```javascript
  // In service worker
  registerRoute(
    /\.(js)$/,
    new NetworkFirst({
      cacheName: 'js-cache',
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 }) // 1 day
      ]
    })
  );
  ```
- Test cache invalidation in staging before production deploy

**Detection:**
- Users report not seeing new animations
- Service worker update events not firing
- Console errors about missing animation methods

**Warning signs:**
- Precaching lists include versioned JS files
- No cache versioning or expiration strategy
- Service worker never updates

**Project context:** V1.4 uses Serwist with CacheFirst for images (30-day) and NetworkFirst for menu API (5-min). Ensure JS bundles use NetworkFirst, not CacheFirst.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 14: Font Loading Blocking LCP

**What goes wrong:** Custom web fonts block text rendering until loaded, delaying LCP by 500-1500ms. FOIT (flash of invisible text) causes poor perceived performance.

**Why it happens:** Default `font-display: auto` hides text until font loads.

**Consequences:**
- LCP delayed
- Text invisible during load
- Layout shift when font swaps in

**Prevention:**
- Use `font-display: swap` in font declarations
- Preload critical fonts in `<head>`:
  ```tsx
  <link rel="preload" as="font" href="/fonts/brand.woff2" crossOrigin="anonymous" />
  ```
- Use system fonts for initial render, swap to custom after load
- Next.js 16: use `next/font` with `display: 'swap'`

---

### Pitfall 15: CSS Loading Priority Issues

**What goes wrong:** All CSS loads at high priority, blocking page render even when not needed. LCP image finishes loading but page still blocked by unused CSS.

**Why it happens:** Default browser behavior treats all `<link rel="stylesheet">` as render-blocking.

**Consequences:**
- LCP delayed by 200-800ms
- Unused CSS blocks critical rendering path
- Poor Time to First Byte (TTFB)

**Prevention:**
- Split critical CSS (above-the-fold) from non-critical
- Inline critical CSS in `<head>`
- Defer non-critical CSS:
  ```tsx
  <link rel="preload" as="style" href="/non-critical.css" onLoad="this.rel='stylesheet'" />
  ```
- Use Next.js automatic CSS code splitting

---

### Pitfall 16: Animation Token Duplication

**What goes wrong:** Animation values scattered across files (durations, easings, springs) cause inconsistency. Some animations use motion tokens, others use hardcoded values.

**Why it happens:** No centralized animation token source. Copy-pasted animation code from different sources.

**Consequences:**
- Inconsistent animation feel across app
- Harder to maintain and update animation timings
- ESLint can't enforce token usage

**Prevention:**
- Single source of truth for animation tokens
- ESLint rule to prevent hardcoded animation values
- Document animation patterns in Storybook
- Code review checklist for token usage

**Project context:** V1.2 consolidated animation tokens to single source at `@/lib/motion-tokens`. Ensure all LCP optimization work uses these tokens exclusively.

---

### Pitfall 17: Missing prefers-reduced-motion Support

**What goes wrong:** Ignoring `prefers-reduced-motion` causes motion sickness for users with vestibular disorders, violating WCAG 2.1 (success criterion 2.3.3). ADA Title II enforcement (April 2026) increases lawsuit risk.

**Why it happens:** Developers unaware of accessibility requirement or think it means "disable all animations."

**Consequences:**
- Accessibility violations (70M+ affected users)
- Legal risk (ADA lawsuits up 37% in 2025)
- Poor UX for sensitive users
- WCAG AA/AAA compliance failure

**Prevention:**
- Respect `prefers-reduced-motion` media query
- Keep opacity/color transitions, disable transform/layout animations
- Use CSS:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Framer Motion: use `useReducedMotion()` hook
- Provide manual toggle in settings (in addition to system preference)

**Detection:**
- Accessibility audit tools flag missing support
- Manual testing with macOS "Reduce Motion" enabled
- Lighthouse accessibility score penalized

---

### Pitfall 18: No Animation Conflict Detection

**What goes wrong:** GSAP and Framer Motion both animating same property on same element causes visual glitches, jank, and unpredictable behavior.

**Why it happens:** Component using GSAP wrapped in Framer Motion parent that animates same properties.

**Consequences:**
- Animations fight each other
- Janky, unpredictable motion
- Performance degradation from double work

**Prevention:**
- Pick one library per component/animation
- Use GSAP for timelines, scroll choreography, complex sequences
- Use Framer Motion for layout animations, gestures, simple component transitions
- Never animate same property with both libraries

**Project context:** V1.4 has conflict detector in dev mode. Ensure it remains active during LCP optimization work.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Code splitting (Phase 1-2) | Barrel imports slowing bundle | Configure `optimizePackageImports`, use direct imports |
| "use client" boundaries (Phase 1-2) | Over-marking Server Components | Audit and push boundaries to leaf components |
| Dynamic imports (Phase 2-3) | Not disabling SSR for animation libraries | Always use `ssr: false` for GSAP/Framer Motion |
| GSAP optimization (Phase 3) | ScrollTrigger memory leaks | Use `useGSAP` hook with cleanup, centralize config |
| Framer Motion optimization (Phase 3-4) | Bundle size explosion | Dynamic import below-fold animations, prefer CSS for simple effects |
| Animation deferral (Phase 4) | Hydration blocking | Phase animations: critical → repaint → decorative |
| Font optimization (Phase 5) | Font loading blocking LCP | Use `font-display: swap`, preload critical fonts |
| Image optimization (Phase 5) | Lazy loading LCP images | Use `priority` prop, `fetchpriority="high"` for hero |
| Glassmorphism (Phase 6) | GPU saturation on low-end devices | Reduce blur radius, device detection for fallbacks |
| Parallax (Phase 6) | Low-power device jank | Disable on <=4GB RAM devices (already implemented) |
| Accessibility (Phase 7) | Missing `prefers-reduced-motion` | Implement media query support, keep opacity/color transitions |
| Service worker (Phase 8) | Over-caching JS bundles | Use `NetworkFirst` for JS, version-based cache busting |

---

## Integration Warnings: GSAP + Framer Motion

**Conflict zones:**
- Both libraries animating `transform` on same element
- Framer Motion `layout` prop + GSAP timeline on same component
- ScrollTrigger + Framer Motion `whileInView` on same element

**Safe patterns:**
- GSAP for page-level scroll choreography (hero parallax, section reveals)
- Framer Motion for component-level interactions (buttons, cards, modals)
- GSAP for SVG/path animations, Framer Motion for layout animations
- Never nest: if parent uses GSAP, children use Framer Motion (or vice versa)

**Project-specific context:**
- Hero: 4-layer parallax uses CSS animations (not GSAP/Framer) — safe
- Menu cards: Framer Motion 3D tilt — don't add GSAP to same cards
- ScrollTrigger: Use for section reveals, not individual card animations
- Cart drawer: Framer Motion spring animations — don't add GSAP overlays

---

## Sources

### Next.js App Router & LCP Optimization (HIGH confidence)
- [10 Performance Mistakes in Next.js 16 (Medium, Dec 2025)](https://medium.com/@sureshdotariya/10-performance-mistakes-in-next-js-16-that-are-killing-your-app-and-how-to-fix-them-2facfab26bea)
- [Stop the Wait: A Developer's Guide to Smashing LCP in Next.js (Medium)](https://medium.com/@iamsandeshjain/stop-the-wait-a-developers-guide-to-smashing-lcp-in-next-js-634e2963f4c7)
- [How to Optimize Core Web Vitals in NextJS App Router for 2025 (Makers' Den)](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)
- [Optimizing Next.js Performance: LCP, Render Delay & Hydration](https://www.iamtk.co/optimizing-nextjs-performance-lcp-render-delay-hydration)
- [Next.js App Router: common mistakes and how to fix them](https://upsun.com/blog/avoid-common-mistakes-with-next-js-app-router/)

### Animation Libraries Performance (HIGH confidence)
- [GSAP vs. Framer Motion: A Comprehensive Comparison (Medium)](https://tharakasachin98.medium.com/gsap-vs-framer-motion-a-comprehensive-comparison-0e4888113825)
- [Framer Motion vs GSAP (Semaphore)](https://semaphore.io/blog/react-framer-motion-gsap)
- [How to Keep Rich Animations Snappy in Next.js 15 (Medium, Jan 2026)](https://medium.com/@thomasaugot/how-to-keep-rich-animations-snappy-in-next-js-15-46d90f503b15)
- [Beyond Eye Candy: Top 7 React Animation Libraries for Real-World Apps in 2026 (Syncfusion)](https://www.syncfusion.com/blogs/post/top-react-animation-libraries)

### GSAP ScrollTrigger & Next.js (HIGH confidence)
- [Optimizing GSAP Animations in Next.js 15 (Medium)](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [ScrollTrigger and pinned section performance problem (GSAP Forums)](https://gsap.com/community/forums/topic/44313-scrolltrigger-and-pinned-section-performancejumping-problem-nextjs-app/)
- [Application crashes with ScrollTrigger in NextJS (GitHub Issue)](https://github.com/greensock/GSAP/issues/440)

### Hydration & Client Components (HIGH confidence)
- [Next.js Hydration Errors in 2026 (Medium, Jan 2026)](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702)
- [How Suspense + Streaming + Selective Hydration Drive Page Speed (Makers' Den)](https://makersden.io/blog/suspense-streaming-selective-hydation-driving-next-level-speed-in-react-and-nextjs)
- [Understanding Client Components and Client Boundaries (Zayne Lovecraft)](https://www.zaynelovecraft.com/articles/understanding-client-components-and-client-boundaries)
- [Next.js Official Docs: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

### Code Splitting & Barrel Imports (HIGH confidence)
- [How we optimized package imports in Next.js (Vercel)](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [React & Next.js Best Practices in 2026 (FAB Web Studio)](https://fabwebstudio.com/blog/react-nextjs-best-practices-2026-performance-scale)
- [When UI Libraries Explode Your Bundle (Medium)](https://medium.com/@sureshdotariya/when-ui-libraries-explode-your-bundle-smart-imports-tree-shaking-in-next-js-ee691a65cd2c)
- [Dynamic imports and code splitting with Next.js (LogRocket)](https://blog.logrocket.com/dynamic-imports-code-splitting-next-js/)

### Glassmorphism & Parallax Performance (MEDIUM confidence)
- [Glassmorphism: What It Is and How to Use It in 2026 (Inverness Design Studio)](https://invernessdesignstudio.com/glassmorphism-what-it-is-and-how-to-use-it-in-2026)
- [Dark Glassmorphism UI in 2026 (Medium, Dec 2025)](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [2026 Web Design Trends: Glassmorphism, Micro-Animations (Digital Upward)](https://www.digitalupward.com/blog/2026-web-design-trends-glassmorphism-micro-animations-ai-magic/)

### CSS Animation & will-change (HIGH confidence)
- [CSS will-change Property: When and When Not to Use It (DigitalOcean)](https://www.digitalocean.com/community/tutorials/css-will-change)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)
- [Optimizing Performance in CSS Animations (DEV)](https://dev.to/nasehbadalov/optimizing-performance-in-css-animations-what-to-avoid-and-how-to-improve-it-bfa)
- [How to create high-performance CSS animations (web.dev)](https://web.dev/articles/animations-guide)

### requestAnimationFrame (MEDIUM confidence)
- [Fix Your LCP Score By Improving Render Delay (DebugBear)](https://www.debugbear.com/blog/lcp-render-delay)
- [Mastering requestAnimationFrame in React (Medium)](https://medium.com/@mohantaankit2002/mastering-requestanimationframe-and-cancelanimationframe-in-react-31bbee576137)
- [Common misconceptions about how to optimize LCP (web.dev)](https://web.dev/blog/common-misconceptions-lcp)

### Accessibility (HIGH confidence)
- [Next.js Official Docs: Accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Accessible Animations in React with prefers-reduced-motion (Josh W. Comeau)](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- [Building for Everyone: Accessible Web Technologies in 2025 (Medium, Dec 2025)](https://medium.com/@thewcag/building-for-everyone-the-developers-guide-to-accessible-web-technologies-in-2025-f5b05c92b82b)
- [Design accessible animation and movement (Pope Tech, Dec 2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)

### Service Worker Caching (MEDIUM confidence)
- [PWA Resource Pre-fetching & Caching with Service Workers (ZeePalm)](https://www.zeepalm.com/blog/pwa-resource-pre-fetching-and-caching-with-service-workers)
- [Caching Done Right: Why Every Web Project Deserves a Service Worker (Medium)](https://medium.com/@mevbg/caching-done-right-why-every-web-project-deserves-a-service-worker-288d254a34c4)
- [Service Worker Caching Strategies (CodeSamplez)](https://codesamplez.com/front-end/service-worker-caching-strategies)
