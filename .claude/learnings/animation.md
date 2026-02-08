# Animation Learnings

## Framer Motion Step Animation Direction

When direction is calculated in `useEffect` after step change, animation starts with stale direction value. AnimatePresence reads `custom={direction}` on render, before useEffect runs.

**Fix:** Use ref for direction, set synchronously BEFORE step change:
```tsx
const directionRef = useRef(1);
const goToPrevStep = () => {
  directionRef.current = -1;  // Set BEFORE step change
  forceUpdate({});
  setStep(STEPS[currentIndex - 1]);
};
```

**Apply when:** Step navigation with direction-aware animations (slide left/right with `custom` prop).

---

## GSAP ScrollTrigger Play-Once

```tsx
gsap.from(cards, {
  y: 40, opacity: 0, stagger: 0.06,
  scrollTrigger: {
    trigger: containerRef.current,
    start: "top 85%",
    toggleActions: "play none none none",  // Play once only
  },
});
```

---

## 3D Transforms + Scale/Z-Index = Flickering

`zIndex` changes and `scale` transforms in `whileHover`/`whileTap` create new stacking contexts that break `preserve-3d` inheritance.

```tsx
// Flickering: zIndex and scale create stacking context conflicts
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={{ scale: 1.03, zIndex: 50 }}  // Breaks 3D context

// No flickering: disable scale when using 3D tilt
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={!shouldEnableTilt ? { scale: 1.03 } : undefined}
```

**Apply when:** Combining Framer Motion hover/tap with CSS 3D transforms. The 3D effect itself provides hover feedback.

---

## Skeleton Loading Structure

Match exact DOM structure of loaded state to prevent layout shift:
- Same sticky positions, heights, spacing
- Same grid structure, aspect ratios

---

## Stacking Context: Isolation Insufficient

`isolate` only prevents z-index competition within subtree. Multiple isolated sections still compete at document level. Legacy components without isolation create z-index leakage.

**Solution:** Remove all legacy components, establish single z-index hierarchy from app root.

---

## Integration Gap: Atomic Swap Pattern

Incremental adoption creates "frankenstein" state (V8 tokens conflicting with legacy values, import path ambiguity, CSS cascade conflicts).

**Pattern:** Replace ALL usages of legacy component in single commit, then delete legacy files.
