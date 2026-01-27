# Technology Stack: Theme Consistency & Hero Redesign

**Project:** Mandalay Morning Star Delivery App
**Researched:** 2026-01-27
**Focus:** Theme token consistency, parallax hero with floating emojis, mobile 3D tilt fix

---

## Executive Summary

Three focus areas, no new dependencies required:

1. **Theme Token Consistency:** Enforce via ESLint rules + Stylelint + CSS-first patterns (existing tooling)
2. **Parallax Hero with Floating Emojis:** Use existing Framer Motion scroll hooks + CSS keyframes
3. **Mobile 3D Tilt Fix:** CSS `@media (hover: hover) and (pointer: fine)` media query

---

## 1. Theme Token Consistency Patterns

### Problem Statement

84 files contain hardcoded `text-white`, `bg-white`, or `text-black` instead of theme tokens. This breaks light/dark mode consistency.

### Existing Enforcement Infrastructure

The project already has linting infrastructure:

| Tool | Config File | Current State |
|------|-------------|---------------|
| ESLint | `eslint.config.mjs` | Has `no-restricted-syntax` rules for hex colors in `bg-[]` and `text-[]` |
| Stylelint | `.stylelintrc.json` | Has `declaration-property-value-disallowed-list` for z-index |
| Tailwind IntelliSense | VS Code extension | Detects conflicting classes |

### Recommended ESLint Rules to Add

Extend existing `no-restricted-syntax` in `eslint.config.mjs`:

```javascript
{
  // Catch hardcoded color utilities that break theming
  selector: "Literal[value=/(?:^|\\s)(text-white|text-black|bg-white|bg-black)(?:\\s|$)/]",
  message: "Use theme-aware tokens (text-text-primary, text-text-inverse, bg-surface-primary) instead of hardcoded text-white/black/bg-white/black."
},
```

### Why ESLint Over Stylelint for This

| Approach | Pros | Cons |
|----------|------|------|
| ESLint (recommended) | Catches Tailwind classes in JSX/TSX | More complex selector syntax |
| Stylelint | CSS-only; already configured | Doesn't catch utility classes in React components |
| eslint-plugin-tailwindcss | Dedicated Tailwind rules | v4 support still in beta |

**Recommendation:** Extend existing ESLint `no-restricted-syntax` since 84/84 violations are in TSX files.

### Semantic Token Mapping

Map hardcoded colors to theme-aware alternatives:

| Hardcoded | Theme-Aware Replacement | Usage |
|-----------|-------------------------|-------|
| `text-white` | `text-hero-text` | Hero/dark sections |
| `text-white` | `text-text-inverse` | On primary backgrounds |
| `text-black` | `text-text-primary` | Standard text |
| `bg-white` | `bg-surface-primary` | Card/page backgrounds |
| `bg-black` | `bg-surface-primary` (dark mode handles) | Rarely needed |

### TailwindCSS 4 @theme Pattern (Context7 verified)

The project already uses `@theme inline` correctly in `globals.css`. Key pattern:

```css
@theme inline {
  /* Theme variables instruct Tailwind to create utility classes */
  --color-text-primary: var(--color-text-primary);
  --color-surface-primary: var(--color-surface-primary);
}
```

**Critical:** Use `@theme` when you want tokens to map to utility classes. Use `:root` for internal CSS variables.

### Confidence: HIGH

- Existing ESLint infrastructure validated
- TailwindCSS 4 @theme pattern already in use
- Token system in `tokens.css` is comprehensive

---

## 2. Parallax Hero with Floating Emojis

### Approach Comparison

| Approach | Bundle Size | Performance | Complexity | Recommendation |
|----------|-------------|-------------|------------|----------------|
| **Framer Motion scroll hooks** | Already included (32KB) | Excellent (Intersection Observer) | Low | **RECOMMENDED** |
| GSAP ScrollTrigger | Already included (23KB) | Excellent (frame throttling) | Medium | Good alternative |
| CSS-only scroll-timeline | 0KB | Good | Low | Future option (limited support) |

### Why Framer Motion for This Project

The project already uses Framer Motion 12.26.1. Relevant existing utilities in `motion-tokens.ts`:

```typescript
// Already defined - use these
export const parallaxPresets = {
  background: { speedFactor: 0.1 },
  far: { speedFactor: 0.25 },
  mid: { speedFactor: 0.4 },
  near: { speedFactor: 0.6 },
  foreground: { speedFactor: 0.8 },
};

export function parallaxLayer(speed: number) {
  return {
    style: { willChange: "transform" },
    speedFactor: speed,
  };
}
```

### Implementation Pattern

```typescript
import { useScroll, useTransform, motion } from 'framer-motion';

function ParallaxHero() {
  const { scrollYProgress } = useScroll();

  // Different layers move at different speeds
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);  // far
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);  // mid
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '70%']);  // near

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div style={{ y: y1 }}>/* Background layer */</motion.div>
      <motion.div style={{ y: y2 }}>/* Floating emojis */</motion.div>
      <motion.div style={{ y: y3 }}>/* Foreground content */</motion.div>
    </div>
  );
}
```

### Floating Emoji Animation: CSS Keyframes Recommended

**Why CSS over JavaScript for floating:**

| Approach | Performance | Browser Optimization |
|----------|-------------|---------------------|
| **CSS keyframes** | GPU-accelerated | Browser can skip frames under load |
| JS (requestAnimationFrame) | Similar | More control, more overhead |
| Framer Motion infinite | Good | Runs through React reconciliation |

**Recommendation:** Use CSS `@keyframes` for idle floating (already defined in project), use Framer Motion for scroll-linked parallax.

Existing animation in `globals.css`:
```css
.float-element {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
```

Also in `tailwind.config.ts`:
```typescript
animation: {
  float: "float 8s ease-in-out infinite",
  "float-slow": "float 12s ease-in-out infinite",
}
```

### Floating Emoji Component Pattern

```typescript
// Combine CSS float animation with Framer Motion parallax
function FloatingEmoji({
  emoji,
  delay = 0,
  parallaxSpeed = 0.3
}: FloatingEmojiProps) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${parallaxSpeed * 100}%`]);

  return (
    <motion.span
      style={{ y }}
      className="animate-float text-4xl"
      // Stagger float animation start
      aria-hidden="true"
      style={{ animationDelay: `${delay}s` }}
    >
      {emoji}
    </motion.span>
  );
}
```

### Performance Best Practices

| Practice | Reason |
|----------|--------|
| Use `transform` and `opacity` only | GPU-accelerated, no layout recalculation |
| Add `will-change: transform` | Hints browser to GPU-composite |
| Limit floating elements to 6-8 | More elements = more paint operations |
| Use `prefers-reduced-motion` | Respect user accessibility settings |

Existing reduced motion support in `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  .float-element {
    animation: none;
  }
}
```

### Confidence: HIGH

- Framer Motion already installed and configured
- Parallax utilities already exist in `motion-tokens.ts`
- Float animation already defined in CSS

---

## 3. Mobile 3D Tilt Fix: Disable on Touch Devices

### Problem Statement

3D tilt effects (presumably from hover interactions) cause issues on touch devices. Need to disable tilt on mobile/touch while keeping it on desktop.

### Recommended: CSS Media Query Approach

```css
/* Only apply tilt on hover-capable devices with fine pointer (mouse/trackpad) */
@media (hover: hover) and (pointer: fine) {
  .tilt-enabled {
    /* 3D tilt styles */
    transform-style: preserve-3d;
    perspective: 1000px;
  }

  .tilt-enabled:hover {
    transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  }
}

/* Touch devices: flat, no tilt */
@media (hover: none) or (pointer: coarse) {
  .tilt-enabled {
    transform: none !important;
  }
}
```

### Why CSS Over JavaScript Detection

| Approach | Pros | Cons |
|----------|------|------|
| **CSS `@media (hover: hover) and (pointer: fine)`** | No JS, instant, no FOUC | Samsung browser quirk (see below) |
| `window.matchMedia()` in JS | Programmatic control | Requires hydration, adds complexity |
| User-Agent sniffing | Works for known devices | Unreliable, breaks on new devices |
| Touch event detection | Catches touch capability | Hybrid devices have both touch AND hover |

**Recommendation:** CSS media queries. They are:
- Zero JavaScript
- SSR-compatible (no hydration mismatch)
- Supported in all modern browsers
- Recommended by MDN and web standards

### Samsung Browser Quirk Mitigation

Samsung browsers sometimes report touchscreen as having hover capability. Mitigation:

```css
/* More specific: require BOTH hover capability AND fine pointer */
@media (hover: hover) and (pointer: fine) {
  /* Desktop styles */
}

/* NOT just @media (hover: hover) - catches Samsung false positives */
```

### Implementation in Existing Component Pattern

Looking at `motion-tokens.ts`, there's a `hover.tilt` preset:

```typescript
export const hover = {
  tilt: {
    whileHover: { rotate: 2, scale: 1.02 },
    whileTap: { rotate: -1, scale: 0.98 },
    transition: spring.snappy,
  },
};
```

**For Framer Motion tilt with device detection:**

```typescript
// Option A: CSS variable controlled (recommended)
function TiltCard({ children }) {
  return (
    <motion.div
      className="tilt-card" // CSS handles media query
      whileHover={{
        rotateX: 'var(--tilt-x, 0)',
        rotateY: 'var(--tilt-y, 0)'
      }}
    >
      {children}
    </motion.div>
  );
}
```

```css
/* CSS sets variables only on hover-capable devices */
@media (hover: hover) and (pointer: fine) {
  .tilt-card {
    --tilt-x: 5deg;
    --tilt-y: 5deg;
  }
}

@media (hover: none) or (pointer: coarse) {
  .tilt-card {
    --tilt-x: 0;
    --tilt-y: 0;
  }
}
```

**Option B: JavaScript matchMedia (if dynamic control needed):**

```typescript
function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none) or (pointer: coarse)');
    setIsTouch(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isTouch;
}
```

### Confidence: MEDIUM-HIGH

- CSS media queries widely supported
- Samsung quirk documented but rare
- May need testing on actual devices

---

## Stack Summary: No New Dependencies

### What to Use

| Need | Solution | Already Installed |
|------|----------|-------------------|
| Theme token enforcement | ESLint `no-restricted-syntax` | Yes (eslint 9) |
| Parallax scrolling | Framer Motion `useScroll`, `useTransform` | Yes (12.26.1) |
| Floating animation | CSS `@keyframes float` | Yes (globals.css) |
| Touch device detection | CSS `@media (hover: hover) and (pointer: fine)` | Native CSS |

### Configuration Changes Needed

| File | Change |
|------|--------|
| `eslint.config.mjs` | Add `no-restricted-syntax` rule for `text-white/black`, `bg-white/black` |
| `src/app/globals.css` | Add `@media (hover: hover)` styles for tilt |
| Component files | Replace hardcoded colors with theme tokens |

### Files to Audit for Theme Consistency

Based on grep results, 84 files contain hardcoded colors. Priority order:

1. **Homepage/Hero** - Most visible
2. **Layout components** - AppHeader, MobileDrawer, Footer
3. **UI primitives** - Modal, Drawer, Toast
4. **Feature components** - Cart, Menu, Checkout

---

## Implementation Patterns Cheatsheet

### Hardcoded Color Replacement

```diff
- <span className="text-white">Welcome</span>
+ <span className="text-hero-text">Welcome</span>

- <div className="bg-white rounded-lg">
+ <div className="bg-surface-primary rounded-lg">

- <p className="text-black">Description</p>
+ <p className="text-text-primary">Description</p>
```

### Floating Emoji with Parallax

```tsx
<motion.span
  style={{ y: useTransform(scrollY, [0, 1], ['0%', '40%']) }}
  className="animate-float absolute text-4xl"
  aria-hidden="true"
>
  {/* Food emoji */}
</motion.span>
```

### Touch-Safe Tilt

```css
@media (hover: hover) and (pointer: fine) {
  .card-3d:hover {
    transform: perspective(1000px) rotateX(5deg) rotateY(5deg);
  }
}
```

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Theme token enforcement via ESLint | HIGH | Existing infrastructure, just needs rule extension |
| Framer Motion parallax | HIGH | Already used in Hero.tsx with `useScroll` |
| CSS float animations | HIGH | Already defined and used in project |
| Touch device detection | MEDIUM-HIGH | CSS approach is standard; Samsung quirk documented |
| No new dependencies needed | HIGH | All tools already installed |

---

## Sources

- [TailwindCSS v4.0 @theme Directive](https://tailwindcss.com/blog/tailwindcss-v4) - CSS-first configuration
- [Theme Variables - Tailwind CSS Docs](https://tailwindcss.com/docs/theme) - @theme vs :root guidance
- [eslint-plugin-tailwindcss](https://www.npmjs.com/package/eslint-plugin-tailwindcss) - v4 beta support
- [Tailwind CSS IntelliSense Linting](https://tailwindcss.com/blog/introducing-linting-for-tailwindcss-intellisense) - Built-in linting
- [CSS and JavaScript Animation Performance - MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) - CSS vs JS animations
- [Framer vs GSAP Comparison](https://pentaclay.com/blog/framer-vs-gsap-which-animation-library-should-you-choose) - When to use each
- [Migrate from GSAP to Motion](https://motion.dev/docs/migrate-from-gsap-to-motion) - Motion's scroll approach
- [A Guide to Hover and Pointer Media Queries - Smashing Magazine](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) - Touch detection best practices
- [Detecting Hover-Capable Devices - CSS-IRL](https://css-irl.info/detecting-hover-capable-devices/) - CSS-first approach
- [Samsung CSS Hover Bug - Ctrl Blog](https://www.ctrl.blog/entry/css-media-hover-samsung.html) - Samsung quirk documentation
- [How to Detect Touch Devices - DEV Community](https://dev.to/morewings/how-to-detect-touch-devices-using-browser-media-queries-1kbm) - matchMedia approach
