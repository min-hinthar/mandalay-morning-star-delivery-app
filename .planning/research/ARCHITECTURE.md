# Architecture Patterns

**Domain:** UI component library with strict layering and motion-first design
**Researched:** 2026-01-21 (Updated 2026-01-23 with 3D integration, 2026-01-27 with theme audit, 2026-01-30 with mobile optimization)
**Confidence:** HIGH (verified against existing codebase + authoritative sources)

---

## v1.4: Mobile Optimization & Homepage Architecture (2026-01-30)

### Overview

This section documents the existing architecture for homepage components, image optimization, and offline support integration patterns. It addresses the milestone question: "How do homepage components, image optimization, and offline support integrate with existing Next.js 16 + React 19 architecture?"

---

### Homepage Component Architecture (EXISTING)

#### Current Structure

```
src/app/(public)/page.tsx (Server Component)
    |
    +-- getMenuWithCategories() --> Supabase query
    |
    +-- <HomePageClient menuSection={...}>
            |
            +-- <Hero ctaHref="/menu" />
            +-- <Suspense> <HowItWorksSection /> </Suspense>  // Lazy loaded
            +-- {menuSection}  --> <HomepageMenuSection />
            +-- <TestimonialsCarousel />
            +-- <CTABanner />
            +-- <FooterCTA />
```

**IMPORTANT CLARIFICATION:** The 5 homepage components (Hero, CTABanner, FooterCTA, HowItWorksSection, TestimonialsCarousel) are **NOT dead code**. They are actively imported and rendered in `HomePageClient.tsx`.

#### Data Flow

| Component | Data Source | Fetch Location | Integration |
|-----------|-------------|----------------|-------------|
| Hero | Static props | N/A | Props passed directly |
| HowItWorksSection | Google Maps API, Supabase | Client hooks | useCoverageCheck, usePlacesAutocomplete |
| HomepageMenuSection | Supabase menu_categories + menu_items | Server Component | Passed via menuSection prop |
| TestimonialsCarousel | Hardcoded array | N/A | Static data in component |
| CTABanner | Static content | N/A | No data dependencies |
| FooterCTA | KITCHEN_LOCATION constant | N/A | Static import |

#### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/(public)/page.tsx` | Server Component entry | 50 |
| `src/components/ui/homepage/HomePageClient.tsx` | Client orchestrator | 108 |
| `src/components/ui/homepage/Hero.tsx` | Hero with parallax | 522 |
| `src/components/ui/homepage/HowItWorksSection.tsx` | Coverage + steps | 874 |
| `src/components/ui/homepage/HomepageMenuSection.tsx` | Menu grid | 445 |
| `src/components/ui/homepage/TestimonialsCarousel.tsx` | Reviews carousel | 289 |
| `src/components/ui/homepage/CTABanner.tsx` | Promo banner | 119 |
| `src/components/ui/homepage/FooterCTA.tsx` | Footer with contact | 246 |

---

### Image Optimization Architecture (EXISTING)

#### Next.js Image Configuration

```typescript
// next.config.ts
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  minimumCacheTTL: 60 * 60 * 24 * 30,  // 30 days
}
```

#### Image Component Hierarchy

```
next/image (base)
    |
    +-- BlurImage (blur placeholder + shimmer)
    |       |
    |       +-- BlurImageMenuCard (16:9 preset)
    |       +-- BlurImageCartItem (1:1 preset)
    |
    +-- AnimatedImage (entrance animation)
            |
            +-- CardImage (parallax + shine overlay)
```

#### Size Presets (image-optimization.ts)

| Preset | Sizes | Width | Height | Use Case |
|--------|-------|-------|--------|----------|
| menuCard | 50vw mobile, 33vw tablet, 25vw desktop | 400 | 225 | Menu grid items |
| hero | 100vw | 1920 | 1080 | Hero background |
| thumbnail | 25vw mobile, 10vw desktop | 96 | 96 | Search results |
| cartItem | 80px | 80 | 80 | Cart drawer items |
| avatar | 40px | 40 | 40 | User avatars |

#### Integration Points for Optimization

1. **Priority Loading**
   - `shouldPriorityLoad(index, 4)` utility exists
   - Used in UnifiedMenuItemCard via `priority={index < 6}`
   - Hero images use `priority` prop

2. **Blur Placeholder**
   - `getPlaceholderBlur(color)` generates tiny SVG
   - BlurImage applies automatically

3. **Responsive Sizes**
   - `getImageProps(preset)` returns optimized props
   - Presets in IMAGE_SIZES constant

#### Optimization Opportunities

| Area | Current | Improvement |
|------|---------|-------------|
| Above-fold priority | Manual index check | Intersection Observer for viewport |
| Image preloading | None | Link preload for hero images |
| srcset generation | Next.js automatic | Custom for Supabase transforms |
| Lazy loading root margin | Default | Increase for earlier prefetch |

---

### Offline/Caching Architecture

#### Current State

| Feature | Status | Implementation |
|---------|--------|----------------|
| PWA Manifest | Exists | public/manifest.json |
| Service Worker | **Missing** | No SW registered |
| API Caching | Basic | TanStack Query 5min staleTime |
| Image Caching | Browser only | Next.js 30-day headers |
| Cart Persistence | Works offline | Zustand localStorage persist |
| Favorites | Works offline | localStorage via useFavorites |

#### PWA Manifest (Existing)

```json
{
  "name": "Mandalay Morning Star",
  "short_name": "Morning Star",
  "display": "standalone",
  "background_color": "#FDF8F0",
  "theme_color": "#8B1A1A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512.png", "sizes": "512x512" }
  ]
}
```

#### TanStack Query Configuration

```typescript
// src/lib/providers/query-provider.tsx
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
```

#### Missing for Full Offline Support

| Component | Purpose | Integration Point |
|-----------|---------|-------------------|
| Service Worker | Runtime caching | layout.tsx script or next-pwa |
| Offline fallback page | No network handling | public/offline.html |
| Menu data caching | SW cache for Supabase | Workbox runtimeCaching |
| Image precaching | Hero/featured images | Workbox precacheAndRoute |
| Offline indicator | Banner when offline | Navigator.onLine + provider |

#### Recommended Offline Architecture

```
Next.js Build
    |
    +-- next-pwa or serwist/next (Workbox wrapper)
    |       |
    |       +-- Precache: manifest, app shell
    |       +-- Runtime: API responses, images
    |
    +-- Service Worker (generated)
            |
            +-- Cache Strategies:
            |     - NetworkFirst: /api/* (menu data)
            |     - CacheFirst: /_next/image/* (images)
            |     - StaleWhileRevalidate: /fonts/*
            |
            +-- Offline Fallback:
                  - /offline.html for navigation failures
```

---

### Memory Management Patterns (Mobile)

#### Known Mobile Crash Patterns (from debug history)

| Issue | Root Cause | Fix Pattern |
|-------|------------|-------------|
| iOS Safari modal crashes | Missing useBodyScrollLock | Required for all modals |
| Background scroll during modal | No scroll prevention | deferRestore + onExitComplete |
| GSAP timeline leaks | timelines not killed | tl.kill() in cleanup |
| AudioContext leaks | Not closed on unmount | audioContext.close() |
| RAF accumulation | Missing cancelAnimationFrame | Store ref, cancel in cleanup |
| setTimeout on unmounted | setState after unmount | Cleanup + isUnmounted ref |

#### Safe Modal Pattern (REQUIRED)

```typescript
// All modal-like components MUST use this pattern
const { lockScroll, restoreScrollPosition } = useBodyScrollLock({
  enabled: isOpen,
  deferRestore: true,
});

return (
  <AnimatePresence onExitComplete={restoreScrollPosition}>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {content}
      </motion.div>
    )}
  </AnimatePresence>
);
```

#### Timer Cleanup Pattern (REQUIRED)

```typescript
const isUnmounted = useRef(false);

useEffect(() => {
  isUnmounted.current = false;

  const timeoutId = setTimeout(() => {
    if (!isUnmounted.current) {
      setState(newValue);
    }
  }, delay);

  return () => {
    isUnmounted.current = true;
    clearTimeout(timeoutId);
  };
}, [deps]);
```

---

### Animation System Integration

#### Central Configuration (motion-tokens.ts)

```typescript
// Spring presets (preferred over duration-based)
spring.default    // Balanced (stiffness: 300, damping: 22)
spring.snappy     // Quick response (stiffness: 600, damping: 35)
spring.gentle     // No overshoot (stiffness: 200, damping: 25)
spring.ultraBouncy // Celebrations (stiffness: 500, damping: 12)

// Duration tokens (for tween animations)
duration.micro = 0.08  // Toggles, taps
duration.fast = 0.12   // Buttons
duration.normal = 0.18 // Standard
duration.slow = 0.28   // Reveals
```

#### Animation Preference Hook

```typescript
const {
  preference,      // "full" | "reduced" | "none"
  shouldAnimate,   // boolean - use for conditional animations
  isReduced,       // boolean - use for simplified animations
  getSpring,       // (config) => config | { duration: 0 }
} = useAnimationPreference();
```

#### Scroll Animation Pattern (AnimatedSection)

```typescript
// 80ms stagger, 25% viewport trigger, always replay
<AnimatedSection>
  <motion.div variants={itemVariants}>Child 1</motion.div>
  <motion.div variants={itemVariants}>Child 2</motion.div>
</AnimatedSection>
```

#### Mobile-Specific Animation Patterns

| Pattern | Hook | Purpose |
|---------|------|---------|
| Touch vs pointer | useCanHover() | Disable hover effects on touch |
| Reduced motion | useAnimationPreference() | Respect user preference |
| GPU-accelerated | will-change: transform | Use sparingly, remove after |
| Scroll lock | useBodyScrollLock() | Required for iOS Safari modals |

---

### Suggested Build Order (Mobile Optimization Milestone)

#### Phase 1: Foundation (No Visible Changes)

| Task | Files | Dependencies |
|------|-------|--------------|
| Service Worker setup | next.config.ts, public/sw.js | next-pwa or serwist |
| Offline fallback page | public/offline.html | None |
| Cache strategy config | sw config | Service Worker |

#### Phase 2: Data Caching

| Task | Files | Dependencies |
|------|-------|--------------|
| Menu API caching | SW runtime cache | Phase 1 |
| Image precaching | SW precache config | Phase 1 |
| Offline indicator | OfflineIndicator.tsx | Navigator.onLine |

#### Phase 3: Image Optimization

| Task | Files | Dependencies |
|------|-------|--------------|
| Hero image preload | layout.tsx Link | None |
| Priority loading audit | Menu components | None |
| Lazy loading root margin | BlurImage.tsx | None |

#### Phase 4: Mobile Performance

| Task | Files | Dependencies |
|------|-------|--------------|
| Memory leak audit | Modal components | None |
| Animation performance | Heavy components | Lighthouse audit |
| Touch gesture refinement | Carousel, Drawer | None |

#### Rationale for Order

1. **Foundation first** - SW setup enables all offline features
2. **Caching before UI** - Data needs to be available for offline indicator
3. **Images after caching** - Precaching depends on SW
4. **Performance last** - Audit after functional changes

---

### Component Boundaries (New Components)

| Component | Responsibility | Integrates With |
|-----------|----------------|-----------------|
| OfflineIndicator | Show offline status banner | layout.tsx Providers |
| ImagePrefetcher | Preload critical images | HomepageMenuSection |
| ServiceWorkerRegistration | Register/update SW | layout.tsx script |

---

### Anti-Patterns to Avoid

#### Image Loading

| Anti-Pattern | Why Bad | Correct |
|--------------|---------|---------|
| No sizes prop | Downloads largest | Use IMAGE_SIZES presets |
| priority on all | Blocks initial render | Only above-fold (index < 4-6) |
| No blur placeholder | CLS | Use getPlaceholderBlur() |
| fill without container size | CLS | Set explicit aspect-ratio |

#### Animation

| Anti-Pattern | Why Bad | Correct |
|--------------|---------|---------|
| animate on every render | Reruns animation | Use whileInView with viewport.once |
| Spring without damping | Oscillates forever | Use spring presets |
| AnimatePresence without key | Exit won't trigger | Always provide unique key |
| Missing shouldAnimate check | Crashes on reduced motion | Check useAnimationPreference |

#### Memory

| Anti-Pattern | Why Bad | Correct |
|--------------|---------|---------|
| setInterval without clear | Memory leak | clearInterval in cleanup |
| addEventListener without remove | Listener accumulation | Remove in useEffect return |
| setState on unmounted | Warning/crash | isUnmounted ref pattern |
| Modal without useBodyScrollLock | iOS Safari crash | Required for all modals |

---

### Scalability Considerations

| Concern | Current | At Scale | Recommendation |
|---------|---------|----------|----------------|
| Menu items | ~30 items | 100+ | Add pagination or virtual scroll |
| Homepage load | ~500KB JS | Growing | Audit bundle, lazy load more |
| Image count | ~50 | 200+ | Implement virtual scroll for grid |
| Offline data | None cached | Full menu | SW with ~5MB cache limit |
| Animation count | Per item | 100+ items | Reduce to batch stagger, cap delays |

---

## Executive Summary (Previous Sections)

This architecture document addresses the core problems identified in the PRD:
- 50+ hardcoded z-index values creating layering conflicts
- Overlay state persisting across route changes
- Stacking context traps from `backdrop-filter`/`transform`
- No centralized portal strategy
- Mobile menu blocking clicks after navigation

The recommended architecture uses a **portal-first overlay system**, **strict z-index token enforcement**, and **component isolation boundaries** to prevent these issues.

**v1.2 Update:** Added Three.js/React Three Fiber integration patterns for 3D hero section, ensuring 3D canvas coexists with existing GSAP/Framer Motion animation infrastructure.

**v1.3 Update (2026-01-27):** Added theme token audit architecture and hero redesign integration patterns for consistency fixes.

**v1.4 Update (2026-01-30):** Added mobile optimization architecture including homepage component integration, image optimization patterns, offline/caching support, and memory management patterns for React 19.

---

## v1.3: Theme Audit & Hero Redesign Architecture

### Problem Statement

Despite a well-structured token system, the codebase has **inconsistent token adoption**:
- **62 files** using `text-white` instead of semantic tokens
- **145 hardcoded hex colors** in component TSX files
- **111 uses** of static Tailwind grays (`bg-black`, `bg-white`, `bg-gray-*`)

The hero section works but uses 2D gradient + basic parallax. Enhancement to 3D layers is possible with existing motion-tokens.

### Current Token Architecture (WELL-STRUCTURED)

```
src/styles/tokens.css          # Single source of truth for CSS variables
    |                            - :root (light mode values)
    |                            - .dark (dark mode values)
    v
src/app/globals.css            # Imports tokens, defines @theme inline bridge
    |
    v
tailwind.config.ts             # Maps CSS vars to Tailwind utilities
    |
    v
Components                     # Should use Tailwind classes (e.g., text-text-primary)
```

**Token Categories Already Defined:**
| Category | Example Token | Tailwind Class |
|----------|---------------|----------------|
| Surface | `--color-surface-primary` | `bg-surface-primary` |
| Text | `--color-text-primary` | `text-text-primary` |
| Border | `--color-border-default` | `border-border-color` |
| Hero | `--hero-gradient-start` | `bg-hero-gradient-start` |
| Footer | `--color-footer-bg` | `bg-footer-bg` |
| Status | `--color-status-success` | `text-status-success` |

### Theme Provider Stack (EXISTING)

```typescript
// Provider hierarchy
<ThemeProvider>           // next-themes (class-based dark mode)
  <DynamicThemeProvider>  // Time-of-day + weather-aware colors
    <App />
  </DynamicThemeProvider>
</ThemeProvider>
```

**Two theme systems coexist:**
1. **next-themes ThemeProvider** - Toggles `.dark` class on `<html>`
2. **DynamicThemeProvider** - Adds `--theme-*` variables for time-of-day effects

Both systems work correctly. The issue is **component adoption**, not infrastructure.

---

### Theme Audit Architecture

#### Approach: Systematic Pattern-Based Fixes

**Do NOT use file-by-file manual review.** Use grep patterns to systematically identify and batch-fix violations.

#### Violation Categories & Fix Patterns

| Category | Pattern to Find | Correct Token | Priority |
|----------|-----------------|---------------|----------|
| **Hardcoded white text** | `text-white` | `text-text-inverse` or `text-hero-text` | HIGH |
| **Hardcoded black/gray bg** | `bg-black`, `bg-white`, `bg-gray-*` | `bg-surface-*` | HIGH |
| **Hex colors in components** | `#[0-9a-fA-F]{6}` in .tsx | CSS variable or token class | MEDIUM |
| **Static Tailwind colors** | `text-gray-*`, `border-gray-*` | `text-text-*`, `border-border-*` | MEDIUM |
| **rgba() without variable** | `rgba(0,0,0,*)` | `color-mix()` with token | LOW |

#### Audit Workflow

```
Phase 1: Discovery (automated)
    |
    +-- grep patterns identify all violations
    +-- Generate violation report with file:line locations
    |
    v
Phase 2: Categorization
    |
    +-- Sort by context (hero, critical paths, admin)
    +-- Group by fix pattern (text-white -> text-inverse, etc.)
    |
    v
Phase 3: Batch Fixes
    |
    +-- Fix by pattern, not by file
    +-- Test in both light and dark modes
    +-- Visual regression testing
```

#### Specific Fix Patterns

```typescript
// Pattern 1: text-white in dark backgrounds
// Context: Hero, overlays, badges on images
// Before
className="text-white"
// After (in hero context)
className="text-hero-text"
// After (in contrast background)
className="text-text-inverse"

// Pattern 2: Hardcoded backgrounds
// Before
className="bg-black/50"
// After
className="bg-surface-primary/50"  // Or glass-* utility

// Pattern 3: Hex colors in style props (charts are exceptions)
// Before
style={{ backgroundColor: "#A41034" }}
// After
className="bg-primary"

// Pattern 4: Static rgba for overlays
// Before (in CSS)
background: rgba(0, 0, 0, 0.6)
// After
background: color-mix(in srgb, var(--color-text-primary) 60%, transparent)
```

#### Files Requiring Attention (from grep analysis)

**High Priority (user-facing):**
- `src/components/homepage/*.tsx` - Hero, CTABanner, TestimonialsCarousel
- `src/components/checkout/*.tsx` - PaymentSuccess, AddressInput
- `src/components/ui-v8/cart/*.tsx` - CartBarV8, CartDrawerV8

**Lower Priority (admin/driver):**
- `src/components/admin/*.tsx` - Can use more static colors
- `src/components/driver/*.tsx` - High-contrast mode handles a11y

---

### Hero Redesign Architecture

#### Current Hero Structure (FUNCTIONAL)

```
src/components/homepage/Hero.tsx
    |
    +-- GradientFallback (background layer)
    |       +-- Linear gradient via CSS vars (--hero-gradient-*)
    |       +-- Decorative SVG pattern overlay
    |       +-- Radial glow effect
    |
    +-- HeroContent (content layer)
            +-- BrandMascot (optional)
            +-- Time-based greeting badge
            +-- AnimatedHeadline (staggered word reveal)
            +-- Subheadline + CTA buttons
            +-- Stats bar + Scroll indicator
```

**Current animation techniques:**
- Scroll parallax (`useScroll`, `useTransform`, `useSpring`)
- Spring-smoothed opacity and Y position
- Word-by-word headline animation
- CTA button glow sweep

#### Enhancement Strategy: Add Parallax Layers

**Recommended: Enhance Existing Component**

```typescript
// Modified structure
Hero.tsx (enhance)
    |
    +-- HeroBackground.tsx (extract/new)
    |       +-- Multiple parallax layers
    |       +-- Different scroll speeds per layer
    |       +-- Decorative floating elements
    |
    +-- HeroContent (keep mostly unchanged)
            +-- Enhanced entrance animations
            +-- Refined spring configurations
```

#### Parallax Layer Architecture

Based on existing `parallaxPresets` in motion-tokens.ts:

```typescript
// Layer configuration matching existing token pattern
const LAYER_CONFIG = {
  background: {
    scrollSpeed: parallaxPresets.background.speedFactor, // 0.1
    scale: 1.2,
    elements: ['gradient', 'pattern']
  },
  midground: {
    scrollSpeed: parallaxPresets.mid.speedFactor,  // 0.4
    scale: 1.1,
    elements: ['decorativeShapes']
  },
  content: {
    scrollSpeed: parallaxPresets.content.speedFactor,  // 1.0
    scale: 1.0,
    elements: ['headline', 'cta', 'stats']
  },
  foreground: {
    scrollSpeed: parallaxPresets.foreground.speedFactor,  // 0.8
    scale: 1.0,
    elements: ['floatingDecorations']
  },
};
```

#### Implementation Pattern (Using Existing Tokens)

```typescript
import { useScroll, useTransform, motion } from "framer-motion";
import { parallaxPresets, spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

function HeroBackground() {
  const { shouldAnimate } = useAnimationPreference();
  const { scrollYProgress } = useScroll();

  // Transform scroll position to layer movement
  const bgY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxPresets.background.speedFactor * 100}%`]
  );
  const midY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxPresets.mid.speedFactor * 50}%`]
  );

  if (!shouldAnimate) {
    // Static fallback for reduced motion
    return <StaticHeroBackground />;
  }

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0"
      >
        {/* Background layer - gradient + pattern */}
      </motion.div>
      <motion.div
        style={{ y: midY }}
        className="absolute inset-0"
      >
        {/* Midground decorative elements */}
      </motion.div>
    </div>
  );
}
```

#### Animation Token Usage (Hero)

| Animation | Existing Token | Usage |
|-----------|----------------|-------|
| Headline entrance | `spring.rubbery` | Word-by-word reveal (already used) |
| Content fade | `spring.default` | Staggered sections |
| Button hover | `hover.buttonPress` | CTA buttons |
| Scroll parallax | `parallaxPresets.*` | Layer speeds |
| Float decoration | `float()` / `floatGentle()` | Floating elements |
| Scroll reveal | `scrollReveal.fadeUp` | On-viewport animations |

#### Hero Token Dependencies (Already Defined)

```css
/* From tokens.css - no changes needed */
--hero-gradient-start: #A41034;  /* Light: deep red */
--hero-gradient-mid: #5C0A1E;
--hero-gradient-end: #1a0a0f;
--hero-text: #FFFFFF;
--hero-text-muted: rgba(255, 255, 255, 0.7);
--hero-overlay: rgba(0, 0, 0, 0.6);
--hero-stat-bg: rgba(255, 255, 255, 0.1);

/* Dark mode variants also exist */
.dark {
  --hero-gradient-start: #C41844;
  --hero-gradient-mid: #6B0C24;
  /* ... */
}
```

---

### Integration Considerations

#### Patterns to Preserve

1. **useAnimationPreference hook** - All animations must respect reduced motion
2. **motion-tokens.ts presets** - Use existing springs, not custom values
3. **zClass helper** - Use for z-index layering
4. **CSS cascade layers** - Respect `@layer reset, base, tokens, components, utilities`

#### Potential Conflicts

| Area | Risk | Mitigation |
|------|------|------------|
| DynamicThemeProvider gradients | Hero uses `gradientPalette` | Ensure tokens.css fallback works |
| View Transition API | Hero scroll may conflict | Test with theme toggle |
| Reduced motion | Parallax must degrade | Check `shouldAnimate` everywhere |

#### Performance Considerations

```typescript
// Good: Use willChange sparingly, remove after animation
style={{ willChange: "transform" }}

// Good: GPU-accelerated properties only
transform: translateY(${y}px)  // Accelerated
top: ${y}px                    // NOT accelerated - avoid

// Good: Limit parallax layers (3-4 max)
// Each layer = additional paint/composite

// Good: Test on 60fps and 120fps displays
```

---

### Build Order for v1.3 Milestone

#### Phase 1: Audit Infrastructure (1-2 tasks)
1. Create grep patterns for violation detection
2. Generate baseline violation report with counts

#### Phase 2: High-Impact Token Fixes (3-5 tasks)
3. Fix `text-white` in hero/homepage components
4. Fix `text-white` in cart/checkout components
5. Fix hardcoded backgrounds in overlays
6. Fix hex colors in user-facing components

#### Phase 3: Hero Enhancement (3-4 tasks)
7. Extract HeroBackground as subcomponent
8. Implement parallax layer system
9. Enhance entrance animations
10. Performance testing and polish

#### Phase 4: Remaining Fixes (2-3 tasks)
11. Fix admin/driver components (lower priority)
12. Document token usage patterns for team
13. Consider ESLint rule to prevent regression

#### Rationale for Order

1. **Audit first** - Know full scope before fixing
2. **User-facing fixes first** - Homepage, cart, checkout visible to all
3. **Hero after tokens** - Hero needs consistent tokens to work correctly
4. **Admin last** - Lower visibility, high-contrast mode handles a11y

---

### Success Criteria (v1.3)

#### Theme Audit Complete When:
- [ ] Zero `text-white` outside intentional inverse contexts
- [ ] Zero hardcoded hex colors in component TSX (except charts)
- [ ] All user-facing components pass light/dark visual review
- [ ] Documentation updated with token usage guidelines

#### Hero Redesign Complete When:
- [ ] Parallax layers implemented (3 layers minimum)
- [ ] Scroll performance < 16ms per frame
- [ ] Reduced motion fallback works correctly
- [ ] Visual design approved
- [ ] Mobile performance acceptable

---

## Recommended Architecture

### High-Level System Structure

```
src/
├── design-system/                    # NEW: Fresh component library
│   ├── tokens/                       # Design token definitions
│   │   ├── z-index.ts               # Layer scale (single source of truth)
│   │   ├── motion.ts                # Animation tokens
│   │   ├── colors.ts                # Color tokens
│   │   └── spacing.ts               # Spacing scale
│   │
│   ├── primitives/                   # Headless behavior components
│   │   ├── Portal/                   # Centralized portal root
│   │   ├── FocusTrap/               # Focus management
│   │   ├── ScrollLock/              # Body scroll control
│   │   └── DismissableLayer/        # Escape + outside click
│   │
│   ├── atoms/                        # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   └── Icon/
│   │
│   ├── molecules/                    # Composed components
│   │   ├── FormField/
│   │   ├── MenuItem/
│   │   └── CartItemRow/
│   │
│   ├── organisms/                    # Complex components
│   │   ├── Dialog/                  # Uses Portal + strict z-index
│   │   ├── Drawer/                  # Uses Portal + strict z-index
│   │   ├── BottomSheet/             # Uses Portal + strict z-index
│   │   ├── Dropdown/                # Uses Portal + strict z-index
│   │   ├── Tooltip/                 # Uses Portal + strict z-index
│   │   ├── Toast/                   # Uses Portal + strict z-index
│   │   └── Header/
│   │
│   ├── layouts/                      # Page structure components
│   │   ├── AppShell/
│   │   ├── PageContainer/
│   │   └── SafeArea/
│   │
│   └── providers/                    # Context providers
│       ├── OverlayProvider/         # Manages all overlay state
│       ├── MotionProvider/          # Animation preferences
│       └── ThemeProvider/           # Theme context
│
├── components/                       # EXISTING: Keep during migration
│   └── three/                        # NEW: 3D component namespace (v1.2)
│       ├── Scene.tsx                 # Root R3F Canvas wrapper
│       ├── Hero3DCanvas.tsx          # Hero-specific 3D scene
│       ├── Mascot3D.tsx              # 3D mascot model
│       ├── FloatingFood3D.tsx        # 3D food items
│       ├── Environment3D.tsx         # Lighting, environment
│       ├── hooks/
│       │   ├── useScrollAnimation.ts # GSAP ScrollTrigger → 3D sync
│       │   ├── useMouseParallax.ts   # Mouse → camera/object movement
│       │   └── useLoadingProgress.ts # Asset loading state
│       └── models/                   # GLTF model components
│           ├── MascotModel.tsx
│           └── FoodModels.tsx
│
└── lib/                             # EXISTING: Utilities and hooks
```

### Component Boundaries

| Component Type | Imports From | Never Imports |
|----------------|--------------|---------------|
| Tokens | Nothing | Anything |
| Primitives | Tokens | Atoms, Molecules, Organisms |
| Atoms | Tokens, Primitives | Molecules, Organisms |
| Molecules | Tokens, Primitives, Atoms | Organisms |
| Organisms | Tokens, Primitives, Atoms, Molecules | Other Organisms (except composition) |
| Layouts | Tokens, Organisms | Business logic |
| Providers | Tokens, Primitives | Components |
| **Three (NEW)** | Tokens, Primitives (hooks only) | Organisms (use shared state instead) |

---

## Sources

**Z-Index & Stacking Context:**
- [Josh Comeau - Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/)
- [MDN - Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)
- [web.dev - Z-index and stacking contexts](https://web.dev/learn/css/z-index)

**React Component Architecture:**
- [React Architecture - Atomic Design](https://reactarchitecture.org/architecture/atomic-design/)
- [Radix UI - Portal Primitives](https://www.radix-ui.com/primitives/docs/utilities/portal)

**Animation Systems:**
- [Motion.dev (Framer Motion)](https://motion.dev/)
- [GSAP Forums - Framer Motion comparison](https://gsap.com/community/forums/topic/38826-why-gsap-but-not-framer-motion/)

**Three.js/React Three Fiber (v1.2):**
- [React Three Fiber Installation](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Drei Documentation](https://drei.docs.pmnd.rs/)
- [Motion for React Three Fiber](https://motion.dev/docs/react-three-fiber)
- [pmndrs/react-three-next Starter](https://github.com/pmndrs/react-three-next)
- [Codrops: Cinematic 3D Scroll Experiences with GSAP](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/)
- [Drei Performance Components](https://github.com/pmndrs/drei)

**Framer Motion Parallax (v1.3):**
- [Framer Motion Parallax Implementation](https://medium.com/@rob.bettison94/framer-motion-parallax-implementation-in-react-b4c0c652c407)
- [Create 3D Animations with Framer Motion](https://tillitsdone.com/blogs/3d-animations-with-framer-motion/)
- [Framer Parallax Examples](https://www.framer.com/blog/parallax-scrolling-examples/)

**Mobile Optimization (v1.4):**
- Codebase examination (HIGH confidence)
- next.config.ts configuration
- motion-tokens.ts animation system
- Debug history (.planning/debug/resolved/)
- Component implementations (HomePageClient, BlurImage, AnimatedSection)

**Existing Codebase:**
- `src/styles/tokens.css` - Current z-index tokens (verified)
- `src/lib/motion-tokens.ts` - Current motion system (verified)
- `src/components/ui/overlay-base.tsx` - Current overlay pattern (verified)
- `src/components/homepage/Hero.tsx` - Current hero with parallax (verified)
- `src/lib/gsap/index.ts` - GSAP plugin registration (verified)
