# Feature Landscape: Theme Consistency & Hero Redesign

**Domain:** Food delivery app - theme system hardening + hero enhancement
**Researched:** 2026-01-27
**Mode:** Feature research for existing codebase fixes
**Confidence:** HIGH (codebase analysis + verified web research)

---

## Context: What This Milestone Addresses

This research supersedes v1.2 Playful UI Overhaul research, focusing specifically on:
1. **Fixing theme inconsistencies** across home, menu, checkout pages
2. **Fixing mobile 3D tilt bug** where content disappears on UnifiedMenuItemCard
3. **Enhancing existing hero** with floating food emojis and parallax (NOT 3D React Three Fiber)

**Key Clarification:** The hero redesign is 2D enhancement, not 3D. The existing hero uses CSS/Framer Motion patterns. We enhance with floating emojis and parallax, not React Three Fiber.

---

## Existing Features (Already Built - Reference Only)

| Feature | Implementation | Location | Status |
|---------|---------------|----------|--------|
| OLED-friendly dark mode | CSS tokens, `.dark` class | `tokens.css` | Working |
| Circular reveal transition | View Transitions API | `globals.css` | Working |
| Animated theme toggle | Sun/moon morph | `theme-toggle.tsx` | Working |
| Color token system | CSS custom properties | `tokens.css`, `tailwind.config.ts` | Defined but bypassed |
| 2D hero with gradient | Linear gradient + animations | `Hero.tsx` | Working, needs polish |
| UnifiedMenuItemCard 3D tilt | Framer Motion + perspective | `UnifiedMenuItemCard.tsx` | Has mobile bug |
| Float animation keyframes | CSS `@keyframes float` | `globals.css` | Available for reuse |

---

## Table Stakes: Theme Consistency (Must Fix)

Features users expect. Missing = broken user experience.

| Feature | Why Expected | Complexity | Current State | Priority |
|---------|--------------|------------|---------------|----------|
| **No hardcoded `text-white`** | Dark mode users see invisible text on dark backgrounds | Medium | 200+ violations | P0 |
| **No hardcoded `bg-white`** | Light-only backgrounds break dark mode | Medium | 80+ violations | P0 |
| **No hardcoded `text-black`** | Light mode users see invisible text on light backgrounds | Low | 15+ violations | P1 |
| **Semantic color tokens throughout** | `text-text-inverse` not `text-white` | Medium | Token system exists, not enforced | P0 |
| **Consistent overlay colors** | Modals, backdrops need theme-aware opacity | Low | `bg-black/50` hardcoded in 15+ places | P1 |
| **Status colors via tokens** | Success/error/warning must theme correctly | Low | Tokens defined, usage inconsistent | P1 |
| **Focus ring consistency** | Accessibility + visual polish | Low | Needs audit | P2 |

### Critical Finding: Hardcoded Color Hotspots

From grep analysis of codebase:

| Area | Violations | Examples | Severity |
|------|------------|----------|----------|
| **Driver components** | 40+ | `StopCard`, `PhotoCapture`, `DeliveryActions`, `OfflineBanner` | High - accessibility critical |
| **Admin components** | 30+ | `OrderManagement`, `RouteOptimization`, analytics dashboards | Medium |
| **Auth components** | 20+ | `AuthModal`, `MagicLinkSent`, `WelcomeAnimation` | Medium |
| **Checkout** | 15+ | `TimeSlotPicker`, `AddressInput`, `PaymentSuccess` | Medium |
| **UI-v8 components** | 25+ | `Toast`, `Tooltip`, `Modal`, `Drawer`, `BottomSheet` | High - shared |
| **Layout components** | 10+ | `MobileDrawer`, `CommandPalette`, `AppShell` | Medium |
| **Homepage** | 8+ | `CTABanner`, `FooterCTA`, `TestimonialsCarousel` | Medium |

### Recommended Semantic Token Mapping

| Hardcoded | Replace With | Use Case |
|-----------|--------------|----------|
| `text-white` | `text-text-inverse` | Text on colored backgrounds |
| `bg-white` | `bg-surface-primary` | Card/container backgrounds |
| `text-black` | `text-text-primary` | Primary body text |
| `bg-black/50` | `bg-surface-primary/50` or custom `--overlay-bg` token | Modal overlays |
| `bg-white/20` | `bg-surface-primary/20` | Glassmorphism effects |
| `dark:bg-zinc-900` | `bg-surface-secondary` or `bg-surface-elevated` | Dark mode surfaces |

---

## Table Stakes: Mobile 3D Tilt Fix (Must Fix)

| Feature | Why Expected | Complexity | Current State | Priority |
|---------|--------------|------------|---------------|----------|
| **Content visible during tilt** | Core functionality broken | Medium | Content clips/disappears on iOS | P0 |
| **Smooth tilt animation** | No flickering or jank | Low | Works on desktop, issues on mobile | P0 |
| **Touch interaction stable** | No accidental triggers | Low | Long-press implemented | P1 |

### Root Cause Analysis

Based on code review of `UnifiedMenuItemCard.tsx`:

| Issue | Code Location | Root Cause |
|-------|---------------|------------|
| Content clipping | `overflow-visible` set but child has `overflow: hidden` | Safari compositing layer conflict |
| Flickering on iOS | Missing `-webkit-backface-visibility` | Hardware acceleration not consistent |
| Z-index stacking | `preserve-3d` without proper z-index handling | WebKit preserve-3d z-index bug |

### Verified Fix Pattern (From MDN + Apple Forums)

```css
/* Container with perspective */
.card-3d-container {
  perspective: 1000px;
  -webkit-perspective: 1000px;
}

/* Card element with 3D transforms */
.card-3d {
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;

  /* Critical for iOS Safari */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  /* Force GPU compositing layer */
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}

/* Child elements need explicit z-translation */
.card-3d-content {
  transform: translateZ(1px);
  -webkit-transform: translateZ(1px);
}
```

---

## Table Stakes: Hero Section

| Feature | Why Expected | Complexity | Current State | Priority |
|---------|--------------|------------|---------------|----------|
| **No layout shift** | Core Web Vital | Low | Good - min-h-[100svh] | N/A |
| **Theme-aware gradient** | Consistent dark mode | Low | Good - uses `--hero-*` tokens | N/A |
| **Accessible CTAs** | Primary conversion | Low | Good | N/A |
| **Mobile responsive** | Majority of traffic | Low | Good | N/A |

---

## Differentiators: Hero Enhancement

Features that elevate experience. Not expected, but valued.

| Feature | Value Proposition | Complexity | Dependencies | Priority |
|---------|-------------------|------------|--------------|----------|
| **Floating food emojis** | Playful brand identity, memorable | Medium | CSS `@keyframes float` (exists) | P1 |
| **Enhanced parallax scroll** | Depth, premium feel, +22% CTA engagement | Low | `useScroll` (exists) | P2 |
| **Gradient animation** | Dynamic, living design | Low | `@keyframes gradient-x` (exists) | P3 |
| **Staggered emoji entrance** | Polished reveal animation | Low | `stagger` variants (exist) | P2 |

### Floating Food Emojis Implementation

**Pattern:** Multiple absolutely-positioned emoji elements with varied animation delays and positions.

```tsx
// Conceptual structure
const floatingEmojis = [
  { emoji: "🍜", position: "top-[10%] left-[5%]", delay: 0, duration: 6 },
  { emoji: "🥢", position: "top-[20%] right-[10%]", delay: 1.2, duration: 8 },
  { emoji: "🍲", position: "bottom-[30%] left-[15%]", delay: 0.5, duration: 7 },
  // ... more emojis with varied positions
];
```

**Performance considerations:**
- Use `will-change: transform` sparingly
- Limit to 6-8 floating elements
- Reduce/disable on `prefers-reduced-motion`
- Use CSS animations over JS for float (already implemented)

### Parallax Optimization

Current implementation uses Framer Motion `useScroll`. Recommended enhancements:

| Current | Enhancement | Rationale |
|---------|-------------|-----------|
| Single parallax layer | Multiple layers at different speeds | Depth |
| Speed: varies | Standardize: 0.2 (slow) to 0.5 (fast) | Avoid motion sickness |
| No mobile differentiation | Reduce speeds on mobile | Performance, battery |
| `useTransform` raw | Add `useSpring` smoothing | Buttery feel |

---

## Mobile-Specific Considerations

| Feature | Complexity | Current State | Recommendation |
|---------|------------|---------------|----------------|
| **Disable 3D tilt on touch** | Low | Long-press activates | Consider full disable |
| **Reduce parallax speed** | Low | Same as desktop | Add `matchMedia` check |
| **Touch-safe floating emojis** | Low | N/A | Keep emojis out of touch target zones |
| **iOS safe areas** | Low | Implemented | `.pb-safe` utilities working |

---

## Anti-Features (Do NOT Build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Heavy parallax (speed > 0.7)** | Motion sickness, poor LCP | Keep speeds 0.2-0.5 |
| **Parallax on all sections** | Overwhelming, performance | Hero only |
| **React Three Fiber for this milestone** | Scope creep, out of scope | Stick to 2D CSS/Framer |
| **Particle.js or similar libraries** | 100KB+ bundle, overkill | CSS `@keyframes` animations |
| **Glassmorphism without fallback** | Invisible content on older browsers | Test `backdrop-filter` support |
| **3D tilt on ALL cards** | Performance on list views | Featured cards only or disable |
| **Different color mappings per component** | Maintenance nightmare | Single token system |
| **`!important` for theme fixes** | Specificity wars | Fix at source |
| **Animations without reduced-motion** | Accessibility violation | Always respect preference |
| **Floating elements that block CTAs** | Conversion killer | Position emojis in margins |

---

## Feature Dependencies

```
Theme Consistency Fix:
  tokens.css (source of truth)
    -> tailwind.config.ts (maps tokens to utilities)
      -> Component audit
        -> Systematic replacement of hardcoded colors
          -> Verification pass (dark mode QA)

Mobile 3D Tilt Fix:
  UnifiedMenuItemCard.tsx
    -> Add backface-visibility: hidden
    -> Add translate3d(0,0,0) to content
    -> Test on iOS Safari 17+
      -> Consider disabling tilt on touch devices if issues persist

Hero Enhancement:
  Existing float keyframes (globals.css)
    -> FloatingEmoji component (new)
      -> Integration with Hero.tsx
        -> Parallax enhancement (useScroll optimization)
```

---

## MVP Recommendation (Phased)

### Phase 1: Theme Consistency (P0)

**Goal:** No visible theme bugs in dark mode.

1. Create find-replace script for common patterns:
   - `text-white` -> `text-text-inverse` (where appropriate)
   - `bg-white` -> `bg-surface-primary`
   - `bg-black/50` -> custom overlay token

2. Manual review for context-dependent replacements

3. Dark mode QA pass on all pages

**Complexity:** Medium (200+ files to touch)
**Risk:** Low (non-breaking changes)

### Phase 2: Mobile 3D Tilt Fix (P0)

**Goal:** Menu cards work on iOS Safari.

1. Add CSS fixes to UnifiedMenuItemCard:
   ```css
   -webkit-backface-visibility: hidden;
   transform: translate3d(0, 0, 0);
   ```

2. Add `translateZ(1px)` to child content elements

3. Test on iOS Safari 17 (iPhone 15)

4. If issues persist: disable tilt on touch devices

**Complexity:** Low-Medium
**Risk:** Low (isolated to one component)

### Phase 3: Hero Enhancement (P1-P2)

**Goal:** Floating emojis + improved parallax.

1. Create `FloatingEmoji` component using existing float keyframes

2. Add 6-8 positioned emojis to hero

3. Enhance parallax with multi-layer speeds

4. Enable gradient animation (already defined)

5. Respect `prefers-reduced-motion`

**Complexity:** Medium
**Risk:** Low (additive feature)

---

## Sources

### Theme Consistency
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Design Tokens Explained - Contentful](https://www.contentful.com/blog/design-token-system/)
- [Design Tokens and CSS Variables - Penpot](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [Tailwind Dark Mode Semantic Colors - GitHub Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/10274)
- [Advanced Theming with Design Tokens - David Supik](https://david-supik.medium.com/advanced-theming-techniques-with-design-tokens-bd147fe7236e)

### Hero & Parallax
- [Hero Section Design Best Practices 2026 - Perfect Afternoon](https://www.perfectafternoon.com/2025/hero-section-design/)
- [Best Parallax Scrolling Effect 2026 - Builder.io](https://www.builder.io/blog/parallax-scrolling-effect)
- [Parallax Scrolling with CSS - LogRocket](https://blog.logrocket.com/create-parallax-scrolling-css/)
- [Web Design Trends 2026 - Really Good Designs](https://reallygooddesigns.com/web-design-trends-2026/)
- [Top Hero Sections 2026 - PaperStreet](https://www.paperstreet.com/blog/top-10-hero-sections/)

### 3D Transform Mobile Fixes
- [CSS Perspective - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/perspective)
- [3D Tilt Effect Tutorial - Francesco Saviano](https://medium.com/@francesco.saviano87/how-to-create-a-3d-tilt-effect-on-a-card-with-html-css-and-javascript-1d0b0ab5a9d7)
- [CSS 3D Perspective Animations - Frontend.fyi](https://www.frontend.fyi/tutorials/css-3d-perspective-animations)
- [Force Hardware Acceleration - David Walsh](https://davidwalsh.name/translate3d)
- [iOS Safari Elements Disappearing - Apple Developer Forums](https://developer.apple.com/forums/thread/129318)

### Codebase Analysis (HIGH Confidence)
- `src/styles/tokens.css` - Token definitions verified
- `src/tailwind.config.ts` - Token mapping verified
- `src/components/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` - 3D tilt implementation reviewed
- `src/components/homepage/Hero.tsx` - Current hero implementation reviewed
- `src/app/globals.css` - Animation keyframes available
