# Animation Learnings

## Framer Motion Step Direction

Direction calculated in `useEffect` runs after render — AnimatePresence reads stale `custom={direction}`. Use ref, set synchronously BEFORE step change.

---

## GSAP ScrollTrigger Play-Once

`toggleActions: "play none none none"` — plays entrance animation once, doesn't reverse on scroll.

---

## 3D Transforms + Scale = Flickering

`zIndex`/`scale` in `whileHover` create stacking contexts that break `preserve-3d`. Disable scale when using 3D tilt.

---

## Skeleton Loading Structure

Match exact DOM structure of loaded state (sticky positions, heights, grid, aspect ratios) to prevent layout shift.

---

## `loading="lazy"` + Animated Containers = Images Never Load

`loading="lazy"` on `<img>` inside framer-motion containers with `initial={{ opacity: 0 }}` prevents the browser's IntersectionObserver from ever triggering the image load during SPA navigation. The element is "invisible" (opacity 0, scale 0.9) when the observer checks, so the browser skips loading. Hard reload uses eager loading heuristics for initial paint, bypassing this.

**Fix:** Don't use `loading="lazy"` on images inside animated wrappers that start invisible. Use the default `loading="eager"` for primary content images.

**Apply when:** Any `<img>` with `loading="lazy"` inside framer-motion `<m.div>` or CSS animation that starts with `opacity: 0` or `display: none`.

---

## Atomic Swap for Component Migration

Replace ALL usages of legacy component in single commit, then delete. Incremental = "frankenstein" state.

---

## Hero Motion System (Anthropic warm-paper)

Full spec: [`docs/hero-design-language.md`](../../docs/hero-design-language.md). Reusable kit in `src/components/ui/homepage/Hero/`.

- **Catalogue (globals.css, search `hero-`):** `animate-hero-develop-1..5` (page-load cascade), `hero-font-breathe` (Fraunces variable-axis), `hero-accent-underline` (swash draw-on), `animate-hero-sheen`, `animate-hero-ripple`, `hero-halo-breathe`, `hero-aurora`/`-2`, `hero-steam`, `hero-sparkle`, `hero-comet`, `hero-twinkle`, `hero-orb-morph`, `hero-grain-drift*`, `animate-hero-draw`. Hooks (`interactions.ts`): `useTilt`/`useMagnetic`/`useHeroParallax`/`useRipple`; particles `HeroBurst`; odometer reels `RollingDigits`.
- **Non-negotiables:** 60fps (transform/opacity only — never animate layout/`width`/`top`); reduced-motion honored (CSS in `@media (prefers-reduced-motion)` or `motion-safe:`; JS via `useAnimationPreference().shouldAnimate`); rAF-throttle pointer; **pause CSS loops offscreen** (`.hero-anim-paused` toggled by an IntersectionObserver on the hero section) and **detach window listeners offscreen** (`useHeroParallax` self-gates via IO).
- **No scroll-coupled background translate** — motion sickness. Parallax = pointer + device-orientation only.
- **Watch the count.** The maximalist hero stacked ~150 concurrent animations + duplicate orb systems + a full-screen `hue-rotate` filter before a calibration pass cut them. Budget animations; dedupe competing layers; `backdrop-filter`/large `blur()`/`mix-blend` are expensive — keep bounded (glass on 1-2 cards, opaque paper elsewhere).
- **Framer + LazyMotion:** `m.span/div/li/line/circle` work; use `repeatType: "loop"` + seamless (start===end) keyframes for continuous loops; clear `setTimeout`s on unmount (`useBurst`/`useRipple`).
