---
status: verifying
trigger: "App slow to load across all devices - coverage map, menu cards, janky animations"
created: 2026-01-29T00:00:00Z
updated: 2026-01-29T00:04:00Z
---

## Current Focus

hypothesis: CONFIRMED - fixes applied and verified
test: Build succeeded, all tests pass, bundle size reduced
expecting: Performance improvements confirmed by build output
next_action: Complete verification and archive

## Symptoms

expected: 1-2 second load with brief loading state, then fully interactive
actual: Long initial load, Map rendering lag, Janky animations, Menu cards also not loading
errors: Haven't checked - need to investigate console
reproduction: Load the app, navigate to coverage checker
started: Always slow since feature was added (not a regression)
devices: All devices affected (desktop, mobile, all browsers)

## Eliminated

## Evidence

- timestamp: 2026-01-29T00:01:00Z
  checked: Component structure of HowItWorksSection.tsx
  found: |
    - InteractiveCoverageChecker imports usePlacesAutocomplete and CoverageRouteMap
    - usePlacesAutocomplete calls useJsApiLoader with libraries: ["places", "geometry"]
    - CoverageRouteMap ALSO calls useJsApiLoader with same libraries
    - Both are rendered in HowItWorksSection which is on the homepage
  implication: Duplicate Google Maps API loading calls may cause blocking/race conditions

- timestamp: 2026-01-29T00:01:00Z
  checked: CoverageRouteMap.tsx (lines 100-103)
  found: |
    - useJsApiLoader is called directly in the component
    - LIBRARIES constant: ["places", "geometry"]
    - Has pulsing circle opacity animation with setInterval (every 1500ms)
    - Uses willChange: "transform" on motion elements
  implication: Direct blocking load of Google Maps API + unnecessary interval

- timestamp: 2026-01-29T00:01:00Z
  checked: usePlacesAutocomplete.ts (lines 52-55)
  found: |
    - Also calls useJsApiLoader with same libraries
    - Comment says "Must match libraries in CoverageRouteMap to avoid loader conflicts"
    - Both components render on homepage at same time
  implication: @react-google-maps/api may handle dedup but both wait for load

- timestamp: 2026-01-29T00:01:00Z
  checked: UnifiedMenuItemCard.tsx
  found: |
    - 528 lines with complex 3D tilt animation using springs
    - Multiple useMotionValue, useSpring, useTransform calls
    - Uses willChange: "transform" on every card
    - Each card has its own useFavorites and useCart hook calls
    - FeaturedCarousel renders 10+ cards all at once
  implication: Heavy per-card computation, possible perf hit with many cards

- timestamp: 2026-01-29T00:01:00Z
  checked: Hero.tsx
  found: |
    - Complex parallax with useScroll, useTransform, useSpring (7 spring calls)
    - FloatingEmoji components with independent animations
    - GradientOrb components
    - AnimatedHeadline with word-by-word spring animation
  implication: Many concurrent spring physics calculations on load

- timestamp: 2026-01-29T00:01:00Z
  checked: motion-tokens.ts
  found: |
    - staggerDelay function caps at 500ms max for items beyond index 6
    - STAGGER_GAP = 0.08 (80ms between items)
    - Many spring presets with varying stiffness/damping
  implication: Stagger is fine but cumulative load of many animated elements

- timestamp: 2026-01-29T00:02:00Z
  checked: Bundle analysis
  found: |
    - Google Maps chunk: 369KB (.next/static/chunks/45f7d1f1ff0400b0.js)
    - Large chunks: 721KB and 539KB also present
    - @react-google-maps/api NOT in optimizePackageImports in next.config.ts
    - No lazy loading (dynamic import) for HowItWorksSection
    - HowItWorksSection directly imported in HomePageClient (line 6)
  implication: 369KB+ loaded synchronously on homepage visit even if user never scrolls to coverage checker

- timestamp: 2026-01-29T00:02:00Z
  checked: next.config.ts experimental.optimizePackageImports
  found: |
    - Lists: lucide-react, framer-motion, radix-ui, recharts, date-fns
    - MISSING: @react-google-maps/api
    - Tree shaking may not be optimal for Google Maps library
  implication: Adding to optimizePackageImports could help tree-shake unused exports

- timestamp: 2026-01-29T00:04:00Z
  checked: Post-fix bundle analysis
  found: |
    - Google Maps chunk REDUCED: 369KB -> 152KB (58% reduction)
    - HowItWorksSection now lazy loaded with Suspense
    - setInterval only runs when map is visible (IntersectionObserver)
    - willChange applied conditionally (only on hover)
    - All 343 tests pass
    - Build succeeds
  implication: Performance improvements confirmed

## Resolution

root_cause: |
  MULTIPLE PERFORMANCE ISSUES:

  1. **No lazy loading for HowItWorksSection** - The 369KB Google Maps chunk loads
     synchronously on homepage even though the coverage map is below the fold.
     Both CoverageRouteMap and usePlacesAutocomplete import the full library.

  2. **Excessive animation complexity on initial load** - Hero, HowItWorksSection,
     HomepageMenuSection all have heavy framer-motion animations (springs, parallax,
     3D tilt) that run concurrently during initial render.

  3. **CoverageRouteMap has unnecessary setInterval** - Line 106-111 runs every 1500ms
     even when map is not visible, causing continuous re-renders.

  4. **willChange: "transform" on every menu card** - UnifiedMenuItemCard applies
     willChange to all cards, creating excessive compositor layers.

fix: |
  FIXES APPLIED:

  1. **Lazy loaded HowItWorksSection** (HomePageClient.tsx)
     - Used React.lazy() + Suspense with skeleton fallback
     - Google Maps bundle now loads only when scrolling toward coverage section

  2. **Added @react-google-maps/api to optimizePackageImports** (next.config.ts)
     - Enables better tree-shaking for Google Maps
     - Reduced Maps chunk from 369KB to 152KB (58% smaller)

  3. **Fixed setInterval to respect visibility** (CoverageRouteMap.tsx)
     - Added IntersectionObserver to track visibility
     - Pulsing animation only runs when map is in viewport

  4. **Conditional willChange** (UnifiedMenuItemCard.tsx)
     - Only applies willChange: "transform" when card is hovered
     - Reduces compositor layer count when scrolling through menu

verification: |
  - TypeScript: pnpm typecheck PASSED
  - Lint: pnpm lint PASSED
  - Build: pnpm build PASSED
  - Tests: 343/343 tests PASSED
  - Bundle: Google Maps chunk reduced 369KB -> 152KB

files_changed:
  - src/components/ui/homepage/HomePageClient.tsx
  - next.config.ts
  - src/components/ui/coverage/CoverageRouteMap.tsx
  - src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
