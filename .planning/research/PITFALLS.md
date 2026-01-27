# Domain Pitfalls: Theme Consistency & Hero Redesign

**Project:** Morning Star Delivery App - v1.3 Theme Fixes & Hero Overhaul
**Domain:** TailwindCSS 4 | Next.js 16 | CSS 3D Transforms | Parallax | Mobile Touch
**Researched:** 2026-01-27
**Confidence:** HIGH (verified against codebase ERROR_HISTORY.md, LEARNINGS.md, and official sources)

---

## Critical Pitfalls

Mistakes that cause visual regressions, broken themes, or content disappearing.

---

### Pitfall 1: Incomplete Theme Token Audit (Partial Fix Syndrome)

**What goes wrong:** Fixing hardcoded colors in visible areas while missing them in fallback code, error states, inline styles, or dynamically generated content. Users in specific themes see broken UI.

**Why it happens:**
- ESLint/grep catches className violations but misses inline `style={{}}` objects
- Fallback/polyfill code paths rarely tested in both themes
- Dynamic style generation (gradients, shadows) often uses hardcoded values
- SVG fills/strokes frequently hardcoded

**Consequences:**
- Light mode footer text invisible (white on white) - documented in LEARNINGS.md
- Error states unreadable in dark mode
- Animations/confetti use hardcoded colors that clash with theme
- PDF/email templates don't respect theme

**Evidence from codebase (LEARNINGS.md 2026-01-26):**
```tsx
// BROKEN - bg-text-primary inverts, text-white doesn't
<section className="bg-text-primary">
  <h3 className="text-white">...</h3>  // Dark mode: light bg + white text = invisible
</section>
```

**Current scope (from grep analysis):**
- 221 occurrences of `text-white/text-black/bg-white/bg-black` across 89 files
- 133 occurrences of hardcoded hex colors in component files
- Key files: Modal.tsx (23 hex colors), AddToCartButton.tsx (4), DeliveryMap.tsx (8)

**Prevention:**

1. **Comprehensive audit approach:**
   ```bash
   # Find ALL hardcoded colors (not just obvious ones)
   grep -rn "text-white\|text-black\|bg-white\|bg-black" src/components --include="*.tsx"
   grep -rn "#[0-9A-Fa-f]\{3,6\}" src/components --include="*.tsx"
   grep -rn "style={{" src/components --include="*.tsx" | grep -i "color\|background"
   grep -rn "fill=\|stroke=" src/components --include="*.tsx"
   ```

2. **Create audit checklist by code path:**
   - [ ] Primary UI (visible on load)
   - [ ] Error states (`catch`, error boundaries)
   - [ ] Loading states (skeletons, spinners)
   - [ ] Empty states (no data messages)
   - [ ] Success states (confetti, checkmarks)
   - [ ] Modal/overlay backdrops
   - [ ] SVG icons and illustrations
   - [ ] Inline style objects

3. **Fix in waves, verify each:**
   ```tsx
   // Wave 1: High-traffic pages (home, menu, checkout)
   // Wave 2: Auth flows (login, signup, error)
   // Wave 3: Admin/driver dashboards
   // Wave 4: Edge cases (empty states, errors)
   ```

4. **ESLint rule for enforcement (after migration):**
   ```js
   // .eslintrc - Add after migration complete
   "no-restricted-syntax": ["error", {
     "selector": "JSXAttribute[name.name='style'] ObjectExpression Property[key.name=/color|background/i]",
     "message": "Use CSS variables or Tailwind classes for theme-aware colors"
   }]
   ```

**Detection (warning signs):**
- Works in light mode, broken in dark mode (or vice versa)
- Specific pages/components look wrong while others are fine
- Colors "pop" harshly against themed backgrounds
- User reports of "can't see X in dark mode"

**Phase mapping:** Phase 1 - Complete audit before any fixes to establish baseline

---

### Pitfall 2: CSS 3D Transforms + Stacking Context = Content Disappearing

**What goes wrong:** Adding `preserve-3d`, `perspective`, or CSS 3D rotation causes content to flicker, disappear during hover, or render behind other elements.

**Why it happens:**
- `transform-style: preserve-3d` creates new stacking context separate from z-index
- `overflow: hidden/auto/scroll` forces `preserve-3d` to `flat`
- `opacity < 1` forces `preserve-3d` to `flat`
- Scale transforms combined with 3D rotation create conflicting contexts
- zIndex changes in Framer Motion `whileHover` break 3D context

**Consequences:**
- Menu cards disappear during 3D tilt interaction
- Content flickers when hovering 3D elements
- Modal/dropdown appears behind 3D transformed elements
- Mobile long-press tilt causes content to vanish

**Evidence from codebase (LEARNINGS.md 2026-01-26):**
```tsx
// BROKEN - zIndex and scale create stacking context conflicts
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={{ scale: 1.03, zIndex: 50 }}  // Breaks 3D context
  whileTap={{ scale: 0.98 }}                 // Also conflicts
>

// WORKING - disable scale when using 3D tilt
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={!shouldEnableTilt ? { scale: 1.03 } : undefined}
  whileTap={!shouldEnableTilt ? { scale: 0.98 } : undefined}
>
```

**Prevention:**

1. **Never combine these with preserve-3d:**
   ```css
   /* These force flat, breaking 3D */
   overflow: hidden;
   overflow: auto;
   opacity: 0.99;  /* Any value < 1 */
   filter: blur(1px);
   contain: paint;
   ```

2. **Use translateZ instead of z-index in 3D contexts:**
   ```css
   /* Inside 3D context, use 3D stacking */
   .front-element {
     transform: translateZ(50px);
   }
   .back-element {
     transform: translateZ(0);
   }
   ```

3. **Disable competing animations on 3D elements:**
   ```tsx
   // 3D tilt IS the hover feedback - don't add scale
   const shouldEnableTilt = variant === 'menu' && !disableTilt;

   <motion.div
     style={shouldEnableTilt ? { transformStyle: "preserve-3d", rotateX, rotateY } : undefined}
     whileHover={shouldEnableTilt ? undefined : { scale: 1.03 }}
   >
   ```

4. **Isolate 3D contexts:**
   ```css
   /* Prevent 3D leaking to siblings */
   .page-content {
     isolation: isolate;
     transform-style: flat;
   }
   ```

**Detection:**
- Content disappears on hover but returns on mouse leave
- Works without animation, breaks with animation enabled
- Computed style shows `transform-style: flat` when `preserve-3d` expected
- DevTools 3D view shows unexpected flattening

**Phase mapping:** Phase 2 (Hero Implementation) - establish 3D architecture before adding effects

---

### Pitfall 3: Semantic Token Misuse (Inverse Tokens)

**What goes wrong:** Using `bg-text-*` tokens for backgrounds or `text-surface-*` for text creates inverted contrast that breaks in one theme.

**Why it happens:**
- Token names don't clearly indicate intended usage
- Developers assume "primary" means "main" not "role"
- Copy-paste from components designed for opposite context
- Dark sections on light pages (and vice versa) need special handling

**Consequences:**
- Footer/hero text invisible in one theme
- Contrast ratio fails WCAG in specific combinations
- "Inverted" sections (dark on light page) break completely

**Evidence from codebase:**
```tsx
// tokens.css defines paired tokens that switch together:
--color-text-primary: #111111;  // Light: dark text
--color-text-inverse: #FFFFFF;  // Light: light text (for dark bgs)

// In dark mode, these flip:
--color-text-primary: #F8F7F6;  // Dark: light text
--color-text-inverse: #000000;  // Dark: dark text (for light bgs)
```

**Prevention:**

1. **Use section-specific token pairs:**
   ```tsx
   // CORRECT - footer tokens switch together
   <footer className="bg-footer-bg text-footer-text">

   // CORRECT - hero tokens switch together
   <section className="bg-hero-gradient text-hero-text">
   ```

2. **Never mix "opposite" tokens:**
   ```tsx
   // WRONG - bg uses text token, text is hardcoded
   <div className="bg-text-primary text-white">

   // CORRECT - use inverse token for contrast
   <div className="bg-surface-primary text-text-primary">
   ```

3. **Create explicit paired tokens for special sections:**
   ```css
   /* tokens.css - always define pairs */
   :root {
     --cta-section-bg: var(--color-primary);
     --cta-section-text: var(--color-text-inverse);
   }
   .dark {
     --cta-section-bg: var(--color-primary);
     --cta-section-text: var(--color-text-inverse);
   }
   ```

**Detection:**
- Text readable in light mode, invisible in dark mode (or vice versa)
- Section "inverts" incorrectly on theme switch
- WCAG contrast checker fails for specific theme

**Phase mapping:** Phase 1 (Audit) - identify all misused tokens before fixing

---

### Pitfall 4: Touch Device Detection for 3D Effects

**What goes wrong:** 3D tilt effects enabled on touch devices cause content to disappear, become unclickable, or trigger unintended scrolling.

**Why it happens:**
- `pointer: coarse` media query doesn't catch all touch devices
- Hybrid devices (Surface, iPad with keyboard) detected incorrectly
- Touch and mouse events fire differently (touchstart/mouseenter race)
- Long-press for tilt conflicts with native context menu

**Consequences:**
- Menu card content disappears on mobile long-press
- Tilt effect blocks scroll/swipe gestures
- Users can't tap cards because touchmove triggers tilt
- iOS context menu appears during tilt interaction

**Current implementation (UnifiedMenuItemCard.tsx):**
```tsx
// Long-press to enable tilt
const handleTouchStart = useCallback(() => {
  if (!shouldEnableTilt) return;
  longPressTimer.current = setTimeout(() => {
    setIsMobileTiltActive(true);
    navigator.vibrate?.(20);
  }, 300);
}, [shouldEnableTilt]);

// Prevent scroll during tilt
touchAction: isMobileTiltActive ? "none" : "auto"
```

**Prevention:**

1. **Proper device detection hierarchy:**
   ```tsx
   // Check capabilities, not device type
   const supportsHover = window.matchMedia('(hover: hover)').matches;
   const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
   const prefersTilt = supportsHover && !hasCoarsePointer;

   // Or disable for all touch-capable devices
   const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
   ```

2. **SSR-safe detection with mounted state:**
   ```tsx
   const [deviceCapabilities, setDeviceCapabilities] = useState({
     hasTouch: false,
     supportsHover: true, // Safe default for SSR
     mounted: false
   });

   useEffect(() => {
     setDeviceCapabilities({
       hasTouch: 'ontouchstart' in window,
       supportsHover: window.matchMedia('(hover: hover)').matches,
       mounted: true
     });
   }, []);
   ```

3. **Graceful degradation for touch:**
   ```tsx
   // Mobile: tap to select, no tilt
   // Desktop: hover for tilt, click to select
   const enableTilt = deviceCapabilities.mounted && !deviceCapabilities.hasTouch;
   ```

4. **Prevent scroll conflicts:**
   ```tsx
   // Only prevent scroll when actively tilting
   <motion.div
     style={{ touchAction: isTilting ? 'none' : 'manipulation' }}
     onTouchStart={handleTouchStart}
     onTouchEnd={handleTouchEnd}
   >
   ```

**Detection:**
- Works on desktop, broken on mobile
- Content disappears when long-pressing on mobile
- Scroll doesn't work near 3D elements on touch devices
- Hydration mismatch warnings related to touch detection

**Phase mapping:** Phase 2 (Hero) - implement detection before adding parallax/3D effects

---

### Pitfall 5: Parallax Performance on Mobile Safari

**What goes wrong:** Parallax scroll effects cause janky animation, battery drain, or complete failure on iOS Safari.

**Why it happens:**
- `background-attachment: fixed` NOT supported on iOS Safari
- Scroll-linked animations trigger expensive repaints
- Safari compositor behaves differently than Chrome
- High DPI screens require more GPU memory

**Consequences:**
- Parallax background doesn't move on iPhone/iPad
- Page scrolls at 15fps instead of 60fps
- Device overheats during scroll
- Visible "snap" as parallax catches up

**Current hero implementation uses Framer Motion scroll:**
```tsx
// Hero.tsx - uses useScroll + useTransform
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end start"],
});
const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
```

**Prevention:**

1. **Use CSS scroll-driven animations (modern approach):**
   ```css
   /* GPU-accelerated, no JavaScript */
   @supports (animation-timeline: scroll()) {
     .parallax-layer {
       animation: parallax linear;
       animation-timeline: scroll();
     }
     @keyframes parallax {
       from { transform: translateY(0); }
       to { transform: translateY(-20%); }
     }
   }
   ```

2. **Fallback for Safari < 17.6:**
   ```tsx
   // Detect support
   const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');

   // Use simpler effect on unsupported browsers
   if (!supportsScrollTimeline) {
     // Static or reduced-motion version
   }
   ```

3. **Limit parallax layers:**
   ```tsx
   // Maximum 3 parallax layers for mobile
   // Each layer = GPU memory + compositing cost
   <ParallaxLayer speed={0.1}>Background</ParallaxLayer>
   <ParallaxLayer speed={0.3}>Midground</ParallaxLayer>
   <div>Content (no parallax)</div>
   ```

4. **Disable on reduced motion:**
   ```tsx
   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
   const enableParallax = !prefersReducedMotion && !isMobile;
   ```

5. **Use will-change sparingly:**
   ```css
   /* Only on elements that actually animate */
   .parallax-layer {
     will-change: transform;
   }
   /* Remove after animation completes */
   ```

**Detection:**
- Lighthouse Performance score drops on mobile
- Safari-specific visual bugs (test in Safari, not just Chrome)
- Battery usage high during scroll
- `prefers-reduced-motion` users report motion anyway

**Phase mapping:** Phase 2 (Hero) - test on real iOS device, not just simulator

---

### Pitfall 6: Hydration Mismatch from Theme/Device Detection

**What goes wrong:** Server renders with default theme/device assumptions, client renders with actual values, React throws hydration errors.

**Why it happens:**
- `localStorage` (theme preference) not available on server
- `navigator.userAgent` / `window.matchMedia` not available on server
- `useMediaQuery` returns `false` on server, real value on client
- Theme detection runs during render, not in useEffect

**Consequences:**
- Console: "Hydration failed because the initial UI does not match"
- Flash of wrong theme on load (FOUC)
- Layout shift as device detection kicks in
- Errors in strict mode

**Evidence from codebase (useMediaQuery.ts):**
```tsx
// Returns false during SSR to avoid hydration mismatch
const [matches, setMatches] = useState(false);

useEffect(() => {
  const mediaQuery = window.matchMedia(query);
  setMatches(mediaQuery.matches);  // Real value set client-side
}, [query]);
```

**Prevention:**

1. **Use mounted state for device-dependent UI:**
   ```tsx
   const [mounted, setMounted] = useState(false);
   const isMobile = useMediaQuery("(max-width: 639px)");

   useEffect(() => setMounted(true), []);

   // Render neutral content until mounted
   if (!mounted) return <Skeleton />;
   return isMobile ? <MobileUI /> : <DesktopUI />;
   ```

2. **CSS-first for theme switching:**
   ```css
   /* CSS handles theme, no hydration issue */
   :root { --bg: white; }
   .dark { --bg: black; }

   .container { background: var(--bg); }
   ```

3. **Suppress warning only for unavoidable cases:**
   ```tsx
   // Only for elements that MUST differ (like platform-specific shortcuts)
   <span suppressHydrationWarning>{mounted ? (isMac ? "Cmd" : "Ctrl") : ""}</span>
   ```

4. **Theme script in head (flash prevention):**
   ```tsx
   // layout.tsx - set theme before hydration
   <script dangerouslySetInnerHTML={{ __html: `
     const theme = localStorage.getItem('theme') || 'system';
     if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
       document.documentElement.classList.add('dark');
     }
   `}} />
   ```

**Detection:**
- Console errors mentioning "hydration"
- Content flickers on page load
- Theme switches after page appears
- React Strict Mode shows double renders with different values

**Phase mapping:** Phase 1 (Foundation) - establish SSR-safe patterns before adding device-specific features

---

## Moderate Pitfalls

Mistakes that cause visual bugs, performance issues, or maintenance burden.

---

### Pitfall 7: TailwindCSS 4 Auto-Content Scanning Documentation

**What goes wrong:** Deprecated Tailwind classes in markdown documentation get compiled into CSS, causing build warnings or unexpected styles.

**Why it happens:** TailwindCSS 4 with `@tailwindcss/postcss` scans ALL files in repository including `.planning/`, `.claude/`, `docs/` - even without explicit config.

**Evidence from codebase (LEARNINGS.md):**
```markdown
TailwindCSS 4 with `@tailwindcss/postcss` scans ALL files in repository -
including `docs/`, `.planning/`, `.claude/` - even when not in configured
content paths. Code examples in markdown get compiled into CSS.
```

**Prevention:**
- Use valid, current Tailwind classes in ALL documentation
- Or add to `.gitignore` for Tailwind scanning

**Phase mapping:** Phase 1 - clean up any deprecated class references in planning docs

---

### Pitfall 8: Gradient Fallback Code Using Hardcoded Colors

**What goes wrong:** Non-WebGL fallback paths in Hero (gradient backgrounds, canvas fallbacks) use hardcoded colors that don't respect theme.

**Current Hero implementation:**
```tsx
// Hero.tsx - GradientFallback component
style={useCustomGradient ? {
  background: `linear-gradient(180deg, ${gradientPalette[0]} 0%, ${gradientPalette[1]} 50%, ${gradientPalette[2]} 100%)`,
} : {
  background: `linear-gradient(180deg, var(--hero-gradient-start) 0%, var(--hero-gradient-mid) 50%, var(--hero-gradient-end) 100%)`,
}}
```

**Prevention:**
1. Always use CSS variables for gradients
2. Test gradient fallback in both themes
3. Verify `--hero-gradient-*` variables exist in both `:root` and `.dark`

**Phase mapping:** Phase 2 (Hero) - verify all gradient paths use variables

---

### Pitfall 9: Isolation Insufficient for Mixed Legacy/New Components

**What goes wrong:** Using `isolation: isolate` to contain z-index doesn't work when legacy components without isolation exist elsewhere.

**Evidence from codebase (LEARNINGS.md):**
```markdown
`isolate` only prevents z-index competition within subtree. Multiple isolated
sections still compete at document level. Legacy components without isolation
create z-index leakage.

**Solution:** Remove all legacy components, establish single z-index hierarchy
from app root.
```

**Prevention:**
- Audit ALL z-index usage across codebase
- Either isolate everything or nothing
- Prefer portal-based overlays (Radix) that escape stacking contexts

**Phase mapping:** Phase 1 (Foundation) - z-index audit before adding new layers

---

### Pitfall 10: Animation Spring Constants Creating Inconsistent Motion

**What goes wrong:** Different spring configurations across components (Framer Motion vs CSS springs) create jarring inconsistent motion.

**Current issue:** Hero uses custom spring config, cards use motion-tokens.ts springs, CSS uses different timing.

**Prevention:**
```tsx
// Centralize ALL spring configs in motion-tokens.ts
export const spring = {
  default: { stiffness: 200, damping: 20 },
  rubbery: { stiffness: 150, damping: 15 },
  snappy: { stiffness: 400, damping: 30 },
};

// Use everywhere - no inline spring values
<motion.div transition={getSpring(spring.default)} />
```

**Phase mapping:** Phase 2 (Hero) - use existing motion-tokens, don't add new springs

---

## Minor Pitfalls

Annoyances that waste time but are easily fixed.

---

### Pitfall 11: Focus Ring Color Not Respecting Theme

**What goes wrong:** Focus rings use hardcoded colors or default browser blue, looking out of place.

**Prevention:**
```css
/* Use theme-aware focus ring */
:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

---

### Pitfall 12: SVG Icons Using currentColor Inconsistently

**What goes wrong:** Some SVG icons use `currentColor` (theme-aware), others use hardcoded fills.

**Prevention:**
```tsx
// Always use currentColor for icons
<svg fill="currentColor" stroke="currentColor">
// Set color via parent
<div className="text-primary"><Icon /></div>
```

---

### Pitfall 13: Button Shadows Using Hardcoded Colors

**What goes wrong:** Box shadows with hardcoded rgba values don't adapt to theme.

**Current Hero has:**
```tsx
className="shadow-lg shadow-secondary/30"  // OK - uses Tailwind opacity
```

But some components use:
```tsx
style={{ boxShadow: "0 4px 14px rgba(164, 16, 52, 0.15)" }}  // Hardcoded!
```

**Prevention:** Use CSS variable shadows from tokens.css

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Audit | Missing inline styles | grep for `style={{` with color/background |
| Phase 1 | Audit | Missing SVG colors | grep for `fill=` and `stroke=` |
| Phase 1 | Foundation | Z-index conflicts | Complete audit before any fixes |
| Phase 2 | Hero 3D | preserve-3d + scale conflict | Disable scale when tilt enabled |
| Phase 2 | Hero | Mobile Safari parallax | Use CSS scroll-timeline, fallback gracefully |
| Phase 2 | Hero | Touch detection | SSR-safe detection, disable tilt on touch |
| Phase 3 | Fix pages | Partial fixes | Fix ALL occurrences per file, not just visible ones |
| Phase 3 | Testing | One theme only | Always test BOTH themes before marking complete |

---

## Prevention Checklist for Theme/Hero Work

Before starting theme audit:
- [ ] Run grep commands to establish complete violation inventory
- [ ] Document all files with hardcoded colors
- [ ] Check inline styles, not just classNames
- [ ] Verify CSS variable coverage for both themes

Before implementing hero parallax:
- [ ] Test on real iOS Safari device
- [ ] Implement touch detection with mounted state
- [ ] Verify `prefers-reduced-motion` disables parallax
- [ ] Check CSS scroll-timeline browser support

Before shipping any fix:
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Tested with `prefers-reduced-motion: reduce`
- [ ] No hydration warnings in console
- [ ] Lighthouse performance not degraded

---

## Sources

**Codebase Documentation:**
- `.claude/ERROR_HISTORY.md` (2026-01-22 to 2026-01-26)
- `.claude/LEARNINGS.md` (2026-01-25, 2026-01-26)

**Official Documentation:**
- [TailwindCSS 4 Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [TailwindCSS 4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [Next.js Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error)
- [MDN transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style)
- [MDN CSS Scroll-Driven Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)

**Community Resources:**
- [CSS 3D Transform Gotchas](https://css-tricks.com/things-watch-working-css-3d/)
- [Performant Parallaxing](https://developer.chrome.com/blog/performant-parallaxing)
- [Fixing Hydration Mismatch in Next.js](https://medium.com/@pavan1419/fixing-hydration-mismatch-in-next-js-next-themes-issue-8017c43dfef9)
- [Understanding FOUC in Next.js 2025](https://dev.to/amritapadhy/understanding-fixing-fouc-in-nextjs-app-router-2025-guide-ojk)

**GitHub Issues:**
- [TailwindCSS 4 Dark Mode Migration](https://github.com/tailwindlabs/tailwindcss/discussions/16517)
- [W3C CSS preserve-3d Stacking Context](https://github.com/w3c/csswg-drafts/issues/6430)
- [shadcn/ui Theme Provider Hydration Error](https://github.com/shadcn-ui/ui/issues/5552)
