# Phase 60: LCP Optimization - Research

**Researched:** 2026-02-14
**Domain:** Web performance / Framer Motion bundle optimization / Core Web Vitals
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Hero text simplification is acceptable -- simpler animations are fine
- Keep some subtle motion on the hero (light fade, slight slide) -- not fully static
- Optimize full page load, not just hero -- below-fold content should lazy load too
- Homepage is the worst offender and primary focus; other public pages also benefit
- Claude should audit hero for images vs text-only and optimize accordingly
- Claude should evaluate data fetching strategy (server-side vs client-side) based on LCP impact
- US-only users, mostly mobile (4G/LTE) -- decent connections but mobile optimization matters
- **All animations must keep working** after switching from domMax to domAnimation -- fix all breakage
- Balance playful feel with performance -- keep signature animations, optimize or remove minor ones
- **Signature animations to preserve:** cart bounce/spring, page transitions, all playful animation identity
- Claude audits codebase for domMax-only features (layout animations, drag gestures) and determines approach
- Claude decides whether to split domAnimation/domMax per-route or find CSS alternatives
- Claude decides on CSS vs Framer Motion replacement for individual animations
- Claude determines acceptable animation delay after async load
- Claude determines progressive loading strategy (fast content first vs complete appearance)
- Claude determines pre-hydration UX for buttons/interactive elements
- Claude decides motion loading strategy (render without animation vs placeholder)
- Claude uses existing codebase loading patterns or picks best approach for data loading states
- Claude keeps existing error handling unless it interferes with LCP optimization
- Claude determines font loading optimization needs (font-display:swap, preloading)
- Claude audits image lazy loading and adds where missing
- Claude handles FOUC prevention as part of optimization
- Claude checks error boundary placement relative to LCP-critical content
- Claude determines if loading.tsx helps or hurts LCP for homepage route
- **Firm targets:** LCP < 4000ms, Lighthouse mobile > 70 (from roadmap)
- **Aspirational:** sub-3s LCP and 80+ Lighthouse if achievable without over-engineering
- Third-party scripts on homepage: Sentry + Vercel Speed Insights (Phase 59) -- Claude ensures these are deferred/non-blocking
- Claude determines if JS bundle size budget is needed based on analysis
- Claude optimizes all Core Web Vitals as needed to hit Lighthouse > 70 (LCP + CLS + INP)
- Claude evaluates SSR vs SSG rendering strategy change if it meaningfully improves LCP
- Claude determines code splitting scope beyond LazyMotion based on impact analysis
- Verification: Claude decides between manual Lighthouse and lightweight CI check

### Claude's Discretion

- Hero entrance animation approach (visible-with-delayed-animation vs instant)
- Which hero elements are server-visible (all vs just heading)
- Visual transition smoothness between static and animated states
- Hero background optimization scope
- Data fetching strategy changes
- domMax per-route vs full domAnimation with CSS alternatives
- Bundle size limits
- CLS/INP optimization scope
- Code splitting aggressiveness
- Render mode (SSR vs SSG) evaluation
- Verification approach (manual vs CI)
- Font loading optimization
- Image lazy loading audit
- Error boundary / loading.tsx decisions

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

## Summary

The homepage LCP of 8-11s is caused by two compounding problems: (1) synchronous `domMax` import (~25kb) blocks all rendering since it's loaded in the root `providers.tsx`, and (2) every hero text element starts at `opacity: 0` via Framer Motion `initial` props, meaning content is invisible until JS hydrates and runs the animation. The fix is a two-pronged approach: switch to async `domAnimation` (~15kb) and make hero content server-visible by removing the `initial: { opacity: 0 }` pattern.

The domMax-to-domAnimation migration is the highest-risk item. The codebase uses `layoutId` in 20+ components and `drag` in 3 components (CartItem, Toast, swipe gestures). These are domMax-only features. The recommended strategy is: async `domAnimation` as the default feature set, with `layoutId` replaced by CSS transitions where trivial (tab indicators) or kept with a per-route domMax async loader for routes that genuinely need it (cart, account). Drag gestures in Toast and CartItem can use touch event handlers or keep domMax on those routes.

The homepage itself has NO images in the hero (pure CSS gradients + emoji text overlays), so the LCP element is the `<h1>` heading text. Server-rendering it visible (no opacity:0) will make LCP essentially equal to FCP, which is already reasonable since fonts use `display: swap` and are preloaded.

**Primary recommendation:** Make hero heading server-visible (remove opacity:0 initial), switch LazyMotion to async domAnimation, provide domMax as async overlay only for routes requiring layout/drag features.

## Standard Stack

### Core (already in project)

| Library                | Version  | Purpose           | Why Standard                                                      |
| ---------------------- | -------- | ----------------- | ----------------------------------------------------------------- |
| framer-motion          | ^12.26.1 | Animation library | Already used across 293 files; LazyMotion + `m` component pattern |
| next                   | 16.1.2   | Framework         | App Router SSR, React 19, font/image optimization                 |
| @vercel/speed-insights | ^1.3.1   | RUM monitoring    | Already integrated, tracks LCP in production                      |
| web-vitals             | ^5.1.0   | CWV measurement   | Already integrated in WebVitalsReporter                           |
| @lhci/cli              | ^0.15.1  | Lighthouse CI     | Already configured in lighthouserc.js                             |

### Supporting (no new dependencies)

No new libraries needed. This phase is entirely about reorganizing existing code.

### Alternatives Considered

| Instead of                   | Could Use                     | Tradeoff                                               |
| ---------------------------- | ----------------------------- | ------------------------------------------------------ |
| Per-route domMax splitting   | Global domMax (status quo)    | Keeps all features but 10kb extra on every page load   |
| CSS transitions for layoutId | Keep all layoutId with domMax | CSS is lighter but less smooth for complex tab pills   |
| Touch handlers for drag      | Keep drag with domMax         | Touch handlers work but lose velocity/momentum physics |

**Installation:**

```bash
# No new packages needed
```

## Architecture Patterns

### Critical Finding: domMax vs domAnimation Feature Matrix

Source: [Motion docs - Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size)

| Feature                                | domAnimation (15kb) | domMax (25kb) | Used in Codebase           |
| -------------------------------------- | :-----------------: | :-----------: | -------------------------- |
| `m.div` animate/transition             |         Yes         |      Yes      | 293 files                  |
| `initial`/`animate`/`exit`             |         Yes         |      Yes      | Everywhere                 |
| `AnimatePresence`                      |         Yes         |      Yes      | ~20 components             |
| `whileHover`/`whileTap`/`whileFocus`   |         Yes         |      Yes      | Buttons, cards             |
| `variants` / `stagger`                 |         Yes         |      Yes      | Hero, lists, menus         |
| `useScroll`/`useTransform`/`useSpring` |         Yes         |      Yes      | Hero parallax              |
| **`layoutId`**                         |       **NO**        |      Yes      | **20+ components**         |
| **`layout` prop**                      |       **NO**        |      Yes      | **CartItemGroup**          |
| **`drag`/pan gestures**                |       **NO**        |      Yes      | **Toast, CartItem, swipe** |
| **`useAnimate`**                       |       **NO**        |      Yes      | **MagicLinkConfirmation**  |

### Pattern 1: Async domAnimation Loading (Root Provider)

**What:** Replace synchronous `domMax` with async `domAnimation` in root providers.
**When to use:** Default for all pages.

```typescript
// src/app/providers.tsx - AFTER
"use client";
import { LazyMotion } from "framer-motion";

// Async dynamic import - does NOT block initial render
const loadFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <LazyMotion features={loadFeatures} strict>
            <AnimationProvider>
              {children}
            </AnimationProvider>
          </LazyMotion>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
```

**Impact:** Removes ~25kb synchronous import from critical rendering path. Animations appear after features load (sub-200ms on 4G), but content is visible immediately.

### Pattern 2: Hero Server-Visible Content

**What:** Remove `initial: { opacity: 0 }` from hero heading and primary text so content renders at server time.
**When to use:** Any LCP-critical content.

```typescript
// BEFORE - blocks LCP until JS hydrates
<m.h1
  initial="hidden"    // opacity: 0
  animate="visible"   // opacity: 1
>

// AFTER - server-visible, animation layered on
<h1 className="font-display text-4xl ...">
  {text}
</h1>
// Animation can be added via CSS @keyframes or delayed FM
```

**Recommendation:** Use CSS `@keyframes` for the hero heading entrance animation. The AnimatedHeadline word-stagger is the biggest offender -- each word starts at opacity:0 with rotateX:-90. Replace with:

1. Server-render the `<h1>` as plain visible text (immediate LCP)
2. Add a subtle CSS fade-in animation (no JS dependency)
3. Keep the stagger word animation as an enhancement that plays after hydration if desired, but content must be readable without it

### Pattern 3: domMax Per-Route Overlay (for layout/drag routes)

**What:** Load domMax features asynchronously on routes that need layoutId or drag.
**When to use:** Cart page, Account page, Admin pages -- NOT homepage.

```typescript
// src/components/providers/MotionMaxProvider.tsx
"use client";
import { LazyMotion } from "framer-motion";

const loadMax = () =>
  import("framer-motion").then((mod) => mod.domMax);

export function MotionMaxProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadMax} strict>
      {children}
    </LazyMotion>
  );
}
```

Nest inside route layouts that need it. LazyMotion supports nesting -- inner provider overrides outer.

### Pattern 4: CSS Alternatives for Simple layoutId

**What:** Replace Framer Motion `layoutId` with CSS transitions for simple indicator animations.
**When to use:** Tab pill indicators, nav active states, dot indicators.

```css
/* Tab indicator with CSS transition */
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--color-primary);
  transition:
    left 0.2s var(--ease-out),
    width 0.2s var(--ease-out);
}
```

Components using layoutId that can migrate to CSS:

- `BottomNav.tsx` -- `layoutId="bottomNavIndicator"`
- `CategoryTabs.tsx` -- `layoutId="activeTabPill"`
- `AdminNav.tsx` -- `layoutId="admin-nav-indicator"`
- `DriverNav.tsx` -- `layoutId="driver-nav-indicator"`
- `NavDots.tsx` -- various layoutIds
- `SearchCategoryTabs.tsx` -- `layoutId="search-tab-indicator"`
- `TestimonialsCarousel.tsx` -- `layoutId="testimonialDot"`
- `FeaturedCarousel/CarouselControls.tsx` -- `layoutId="featuredCarouselDot"`

Components requiring domMax (keep with async loader):

- `AccountClient.tsx` -- `layoutId="accountTab"` (account route)
- `SettingsTab.tsx` -- `layoutId="settingsSubTab"` (account route)
- `AuthCard.tsx` / `LoginSuccessCeremony.tsx` -- `layoutId="app-logo"` (auth route)
- `CartItemGroup.tsx` -- `layout={true}` (cart route)
- `CartItem.tsx` -- `drag="x"` (cart route)
- `Toast.tsx` -- `drag="x"` (global, but toast is non-LCP)
- `Tabs.tsx` -- generic, used everywhere

### Recommended Strategy: Hybrid Approach

| Scope                   | Strategy                                            | Why                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------- |
| Root providers          | Async `domAnimation`                                | Unblocks initial render for all pages |
| Homepage hero           | Server-visible text + CSS entrance animation        | Fixes LCP directly                    |
| Homepage below-fold     | Already lazy-loaded (HowItWorks)                    | Good pattern, extend if needed        |
| Tab indicators (simple) | CSS transition replacement                          | No domMax needed                      |
| Cart/Account routes     | Async `domMax` nested provider                      | Preserves drag + layoutId             |
| Admin/Driver routes     | Async `domMax` nested provider                      | Preserves layoutId nav indicators     |
| Toast (global)          | Keep drag, load with async domMax in root           | Non-LCP, loads after render           |
| `Tabs.tsx` (generic)    | Refactor to CSS or accept domMax on routes using it | Depends on route                      |

### Anti-Patterns to Avoid

- **Removing all layoutId animations:** User explicitly wants "all animations keep working" -- migrate to CSS where trivial, keep with domMax where needed.
- **Synchronous domMax import anywhere:** Even a single synchronous domMax import in the bundle entry point defeats the purpose. Verify all imports are async.
- **Initial opacity:0 on LCP elements:** Never put `initial: { opacity: 0 }` on content that determines LCP. Server-render it visible.
- **Loading.tsx for homepage:** A loading.tsx at the `(public)` route group level already exists. It shows a `RouteLoading` spinner. For the homepage specifically, this is harmful -- it replaces the actual page content with a spinner during SSR streaming, delaying LCP. Consider removing or making homepage-exempt.

## Don't Hand-Roll

| Problem                 | Don't Build                   | Use Instead                                     | Why                                                |
| ----------------------- | ----------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Motion feature loading  | Custom dynamic import wrapper | `LazyMotion features={loadFeatures}`            | Built-in async loading with Suspense-like behavior |
| Tab indicator animation | Complex JS position tracking  | CSS `transition: left, width`                   | Pure CSS is 0kb JS, works without hydration        |
| Performance measurement | Custom timing code            | Lighthouse CI (`pnpm lighthouse`) + web-vitals  | Already configured, standardized metrics           |
| Image lazy loading      | Custom IntersectionObserver   | Next.js `<Image>` with default `loading="lazy"` | Built-in, handles srcset/sizes/formats             |

**Key insight:** The biggest LCP win comes from NOT doing things -- removing the synchronous domMax import and removing opacity:0 initial states. No new libraries or complex patterns needed.

## Common Pitfalls

### Pitfall 1: LazyMotion Nesting Confusion

**What goes wrong:** Inner LazyMotion overrides outer one entirely. If a route has domAnimation and a component expects domMax features (layoutId), the component silently fails to animate.
**Why it happens:** LazyMotion uses React context; inner provider replaces outer.
**How to avoid:** When nesting, the inner LazyMotion must provide ALL features needed by its children (use domMax, not domAnimation, for the inner one). Document which routes load domMax.
**Warning signs:** layoutId animations suddenly stop working, drag gestures unresponsive.

### Pitfall 2: CLS from Removing Initial Animation States

**What goes wrong:** Removing `initial: { opacity: 0, y: 20 }` makes elements visible but at their final position. If the element's size depends on JS (e.g., dynamic text), it can cause layout shift.
**Why it happens:** The element now participates in server-rendered layout, and if its dimensions change after hydration, CLS increases.
**How to avoid:** Ensure hero elements have stable dimensions (fixed font sizes, no dynamic content). Test with `?animation=none` or similar to see server render without motion.
**Warning signs:** CLS score increases after removing initial states.

### Pitfall 3: Flash of Unstyled Animation (FOUA)

**What goes wrong:** Content renders visible, then briefly jumps/flickers when Framer Motion hydrates and applies its initial state.
**Why it happens:** Server renders without Framer Motion. Client hydrates and Framer Motion sets `initial` styles inline, causing a flash.
**How to avoid:** For hero content, remove `initial`/`animate` from `m.` components entirely, or use `initial={false}` to skip initial animation on mount. Use plain HTML elements for server-visible content.
**Warning signs:** Visible flicker on page load, elements briefly jumping position.

### Pitfall 4: Async Feature Loading Timing

**What goes wrong:** Animations don't play on initial page load because features haven't loaded yet.
**Why it happens:** `LazyMotion features={loadFeatures}` resolves asynchronously. `m.div` renders immediately but animations wait for features to resolve.
**How to avoid:** This is actually the desired behavior for LCP -- content renders immediately, animations start after features load. For hero, use CSS animations for the entrance so no JS dependency. For below-fold content, features will be loaded by the time user scrolls.
**Warning signs:** Hero animation doesn't play at all (only if implementation is wrong).

### Pitfall 5: domMax Features Used in Unexpected Places

**What goes wrong:** After migrating to domAnimation, some component breaks because it uses `layoutId` or `drag` in a non-obvious way (e.g., Tabs.tsx is generic and used on many routes).
**Why it happens:** The `Tabs` component has `layoutId` built in and is used across admin, customer, and public routes.
**How to avoid:** Audit every usage of `Tabs.tsx` component. Either: (a) refactor Tabs to use CSS transitions instead of layoutId, or (b) ensure all routes using Tabs have a domMax provider.
**Warning signs:** Tab switching animation disappears or breaks.

### Pitfall 6: useAnimate Requires domMax

**What goes wrong:** `MagicLinkConfirmation.tsx` uses `useAnimate` which is a domMax-only hook.
**Why it happens:** `useAnimate` is part of the extended feature set.
**How to avoid:** The auth route should have a domMax provider, or replace `useAnimate` with `animate` prop + state changes.
**Warning signs:** Runtime error or silent animation failure on login flow.

## Code Examples

### Current Root Cause: Synchronous domMax (BEFORE)

```typescript
// src/app/providers.tsx (CURRENT)
import { LazyMotion, domMax } from "framer-motion";
//                    ^^^^^^ Synchronous import: ~25kb in critical bundle

<LazyMotion features={domMax} strict>
  {children}
</LazyMotion>
```

### Fix: Async domAnimation (AFTER)

```typescript
// src/app/providers.tsx (FIXED)
import { LazyMotion } from "framer-motion";

const loadFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation);

<LazyMotion features={loadFeatures} strict>
  {children}
</LazyMotion>
```

### Current Hero Heading (BEFORE) - Blocks LCP

```typescript
// src/components/ui/homepage/Hero/HeroSubComponents.tsx
// AnimatedHeadline: each word starts invisible
<m.h1
  variants={staggerContainer()}   // hidden: { opacity: 0 }
  initial="hidden"                // ALL words invisible at server render
  animate="visible"               // Only visible after JS hydrates + animation plays
>
  {words.map((word) => (
    <m.span
      variants={{
        hidden: { opacity: 0, y: 40, rotateX: -90, filter: "blur(10px)" },
        visible: { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" },
      }}
    />
  ))}
</m.h1>
```

### Fixed Hero Heading (AFTER) - Server Visible

```typescript
// Option A: Plain h1 with CSS animation enhancement
export function AnimatedHeadline({ text, className }: AnimatedHeadlineProps) {
  return (
    <h1 className={cn(className, "animate-fade-in-up")}>
      {text}
    </h1>
  );
}

// globals.css
@keyframes fade-in-up {
  from { opacity: 0.8; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out both;
}
```

### CSS Tab Indicator Replacement

```typescript
// BEFORE: Framer Motion layoutId
{isActive && (
  <m.div
    layoutId="activeTabPill"
    className="absolute inset-0 bg-primary rounded-full"
  />
)}

// AFTER: CSS transition with ref-based positioning
<div
  className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-200 ease-out"
  style={{
    left: `${activeTabLeft}px`,
    width: `${activeTabWidth}px`,
  }}
/>
```

## Codebase Audit Results

### Hero Analysis (Homepage LCP)

- **LCP element:** `<h1>` heading text ("Authentic Burmese Cuisine Delivered to Your Door")
- **No images in hero:** Pure CSS gradients (`GradientFallback`) + emoji text overlays (`FloatingEmoji`)
- **Blocking animations:** 7 elements with `initial: { opacity: 0 }` in HeroContent + HeroSubComponents
- **Parallax:** Uses `useScroll`/`useTransform`/`useSpring` -- all available in domAnimation
- **Data fetching:** `getFeaturedSections()` server-side in page.tsx -- good, no client fetch blocking LCP

### domMax-Only Features Audit

**`layoutId` usage (20+ instances):**
| Component | layoutId | Route | Migration Path |
|-----------|----------|-------|---------------|
| BottomNav | `bottomNavIndicator` | Global customer | CSS transition |
| CategoryTabs | `activeTabPill` | /menu | CSS transition |
| AdminNav | `admin-nav-indicator` | /admin/_ | Async domMax (admin layout) |
| DriverNav | `driver-nav-indicator` | /driver/_ | Async domMax (driver layout) |
| Tabs (generic) | configurable | Multiple | CSS transition OR async domMax per route |
| AccountClient | `accountTab` | /account | Async domMax (customer layout) |
| SettingsTab | `settingsSubTab` | /account | Async domMax (customer layout) |
| NavDots | configurable | Homepage, carousels | CSS transition |
| SearchCategoryTabs | `search-tab-indicator` | Global (modal) | CSS transition |
| FeaturedCarousel | `featuredCarouselDot` | /menu | CSS transition |
| TestimonialsCarousel | `testimonialDot` | Homepage | CSS transition |
| AuthCard/LoginSuccess | `app-logo` | /login | Async domMax (auth layout) |
| MobileHeader/DesktopHeader | `app-logo` | Global | Complex -- shared layout morph between login and app |
| AdminLayout | `admin-nav-indicator` | /admin | Async domMax (admin layout) |
| SettingsClient | `settingsTab` | /admin/settings | Async domMax (admin layout) |
| CardRow | configurable | /admin | Async domMax (admin layout) |

**`layout` prop usage:**
| Component | Route | Migration Path |
|-----------|-------|---------------|
| CartItemGroup | /cart | Async domMax (customer layout) |

**`drag` usage:**
| Component | Drag Type | Route | Migration Path |
|-----------|-----------|-------|---------------|
| Toast | `drag="x"` | Global | Keep with domMax (non-LCP) |
| CartItem | `drag="x"` | /cart | Async domMax (customer layout) |

**`useAnimate` usage:**
| Component | Route | Migration Path |
|-----------|-------|---------------|
| MagicLinkConfirmation | /login | Async domMax (auth layout) or refactor to animate prop |

### Route-Level domMax Needs Summary

| Route Group            | Needs domMax? | Why                                                                |
| ---------------------- | :-----------: | ------------------------------------------------------------------ |
| `(public)` homepage    |    **NO**     | No layoutId/drag/layout on homepage                                |
| `(public)` /menu       |    **NO**     | CategoryTabs layoutId can be CSS; FeaturedCarousel dots can be CSS |
| `(public)` other       |    **NO**     | Privacy, terms, driver onboard -- simple pages                     |
| `(customer)` /cart     |    **YES**    | CartItem drag, CartItemGroup layout, Tabs layoutId                 |
| `(customer)` /checkout |     Maybe     | Uses Tabs, AddressInput -- check if layoutId needed                |
| `(customer)` /account  |    **YES**    | AccountClient layoutId, SettingsTab layoutId                       |
| `(customer)` /orders   |     Maybe     | OrderListAnimated, tracking -- audit needed                        |
| `(auth)` /login        |    **YES**    | AuthCard/LoginSuccess layoutId="app-logo", useAnimate              |
| `(admin)` all          |    **YES**    | AdminNav layoutId, CardRow layoutId, multiple                      |
| `(driver)` all         |    **YES**    | DriverNav layoutId                                                 |
| Global (Toast)         |    **YES**    | drag="x" swipe dismiss                                             |

### Third-Party Script Audit

- **Sentry (`@sentry/nextjs` ^10.38.0):** Loaded via Next.js plugin, non-blocking (tunnel route `/monitoring`)
- **Vercel Speed Insights:** `<SpeedInsights sampleRate={50} />` in root layout -- rendered as client component, loads async
- **Vercel Analytics:** `<Analytics />` in root layout -- loads async
- **WebVitalsReporter:** Client component, uses dynamic `import("web-vitals")` -- async, non-blocking
- **Service Worker:** `<ServiceWorkerRegistration />` -- client component, registers async

All third-party scripts are already deferred/non-blocking. No changes needed.

### Font Loading Audit

- `Inter` and `Playfair_Display` both use `display: "swap"` and `preload: true` -- correct
- Preconnect hints present for `fonts.googleapis.com` and `fonts.gstatic.com` -- correct
- Only critical weights loaded for Playfair (400, 600, 700) -- good

### Image Loading Audit (Homepage)

- **No images in hero section** -- LCP is text-based
- HowItWorks section: uses `next/image` but is already lazy-loaded via `React.lazy()`
- Below-fold sections (menu, testimonials): no direct image imports in homepage components
- Menu item images use `BlurImage` component (needs separate audit for /menu page)

### loading.tsx Analysis

- `src/app/(public)/loading.tsx` exists -- shows `<RouteLoading message="Loading..." />`
- This is a **Suspense boundary** that wraps the page during streaming SSR
- For homepage: the `getFeaturedSections()` server fetch triggers this loading state
- **Impact on LCP:** If the data fetch is slow, the loading.tsx spinner replaces real content, delaying LCP
- **Recommendation:** The homepage page.tsx is an async server component. The loading.tsx acts as Suspense fallback. This is acceptable if the data fetch is fast. If it's slow, consider static generation or ISR for homepage.

## State of the Art

| Old Approach                           | Current Approach                          | When Changed             | Impact                                           |
| -------------------------------------- | ----------------------------------------- | ------------------------ | ------------------------------------------------ |
| Sync `domMax` import                   | Async `domAnimation` + per-route `domMax` | Motion v4+ (2021)        | 10-25kb less in critical path                    |
| `initial: { opacity: 0 }` for entrance | Server-visible + CSS entrance animation   | Next.js App Router era   | LCP = FCP instead of LCP = FCP + animation delay |
| Client-side data fetching              | Server Components with async/await        | Next.js 13+ (2023)       | Already done correctly in this codebase          |
| `font-display: block`                  | `font-display: swap` + preload            | Best practice since 2020 | Already done correctly in this codebase          |

**Deprecated/outdated:**

- `MotionConfig features` -- replaced by `LazyMotion` in Framer Motion 4.0
- `motion.div` (full import) -- replaced by `m.div` (slim import) with LazyMotion. Already migrated.

## Open Questions

1. **Tabs.tsx generic component migration**
   - What we know: Used across 5+ route groups with built-in `layoutId`
   - What's unclear: Whether CSS transition replacement maintains the same smoothness for all tab layouts
   - Recommendation: Refactor Tabs.tsx to use CSS transitions. The indicator animation (slide between tabs) is straightforward with `transition: left, width`. Test in Storybook before deploying.

2. **Toast drag on global level**
   - What we know: Toast uses `drag="x"` for swipe-to-dismiss, rendered globally from root layout
   - What's unclear: Whether Toast drag can work with async domMax that loads later
   - Recommendation: Since LazyMotion supports async loading, Toast's drag should work once domMax features resolve. If needed, fallback: render Toast dismissible via click only until features load, then enable drag.

3. **`app-logo` layoutId across routes**
   - What we know: Both `MobileHeader`/`DesktopHeader` (global) and `AuthCard`/`LoginSuccessCeremony` (auth) share `layoutId="app-logo"` for logo morph animation
   - What's unclear: Whether this cross-route shared layout animation works at all with App Router (different layouts = different React trees)
   - Recommendation: Audit if this animation actually fires. If not, remove the layoutId. If yes, it requires domMax globally, which conflicts with the optimization. Consider removing this morph animation as it's a minor polish.

4. **Homepage rendering mode: SSR vs SSG**
   - What we know: Currently SSR (async server component with `getFeaturedSections()` DB call)
   - What's unclear: How much latency `getFeaturedSections()` adds to TTFB
   - Recommendation: Measure TTFB with and without the fetch. If >500ms, consider ISR with `revalidate: 3600` (1hr) since featured sections change infrequently.

## Sources

### Primary (HIGH confidence)

- [Motion docs - Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size) -- domAnimation vs domMax feature matrix, LazyMotion async loading pattern
- [Next.js docs - Image Component](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/02-components/image.mdx) -- preload prop, priority for LCP
- [Next.js docs - loading.tsx](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/01-getting-started/04-linking-and-navigating.mdx) -- Suspense fallback behavior
- [Motion docs - Layout Animations](https://motion.dev/docs/react-layout-animations) -- layoutId requires domMax
- Codebase audit: `src/app/providers.tsx`, `src/components/ui/homepage/Hero/`, all layoutId/drag/layout usages

### Secondary (MEDIUM confidence)

- [Framer Motion Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size) -- Feature package sizes: domAnimation ~15kb, domMax ~25kb (verified via Context7)
- Codebase `lighthouserc.js` -- Current thresholds and config

### Tertiary (LOW confidence)

- LCP 8-11s figure from project STATE.md -- needs fresh measurement after Phase 59 changes

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new libraries, only reorganization of existing framer-motion usage
- Architecture: HIGH -- LazyMotion async pattern is well-documented, domAnimation/domMax split is official API
- Pitfalls: HIGH -- based on direct codebase audit identifying exact files and features
- domMax migration risk: MEDIUM -- 20+ layoutId usages across routes need careful handling; Tabs.tsx is the wildcard
- Performance impact estimate: MEDIUM -- 25kb savings and opacity:0 removal should hit <4s LCP, but real measurement needed

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days -- stable domain, no breaking changes expected)
