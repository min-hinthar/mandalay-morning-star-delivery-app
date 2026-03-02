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

## Atomic Swap for Component Migration

Replace ALL usages of legacy component in single commit, then delete. Incremental = "frankenstein" state.
