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
