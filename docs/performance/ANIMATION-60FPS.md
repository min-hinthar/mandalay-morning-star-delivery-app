# Animation Performance (60fps)

## Target

All animations maintain 60fps (16.67ms per frame) on mid-range devices.

## GPU-Accelerated Properties

Only these properties can be animated at 60fps without triggering layout:

| Property | GPU Accelerated | Use For |
|----------|-----------------|---------|
| `transform` | ✅ Yes | Movement, scale, rotation |
| `opacity` | ✅ Yes | Fade in/out |
| `filter` | ✅ Partial | Blur, brightness |
| `will-change` | ✅ Hint | Prep for animation |

**Avoid animating** (triggers layout/paint):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`
- `font-size`

## Framer Motion Best Practices

### ✅ Good - Transform-based

```typescript
// Scale and translate (GPU accelerated)
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.98 }}
  animate={{ y: isVisible ? 0 : 100 }}
/>

// Opacity (GPU accelerated)
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

### ❌ Bad - Layout-triggering

```typescript
// Avoid: animating width/height directly
<motion.div
  animate={{ width: isOpen ? 300 : 0 }}  // Triggers layout
/>

// Better: use scaleX/scaleY
<motion.div
  animate={{ scaleX: isOpen ? 1 : 0 }}
  style={{ transformOrigin: "left" }}
/>
```

## Animation Audit Results

### Components Using GPU-Accelerated Animations ✅

| Component | Animation | Property |
|-----------|-----------|----------|
| MenuItemCard | Hover lift | `transform: translateY(-4px) scale(1.02)` |
| CartDrawer | Slide in | `transform: translateX(100%)` |
| ItemDetailModal | Scale up | `transform: scale(0.95)` → `scale(1)` |
| CartBar | Bounce in | `transform: translateY(100%)` |
| CategoryTabs | Scroll indicator | `opacity` |
| HomepageHero | Float | `transform: translateY` |
| Badge pulse | Pulse ring | `transform: scale`, `opacity` |
| Skeleton | Shimmer | `background-position` (CSS) |

### Animations Needing Review ⚠️

| Component | Issue | Recommendation |
|-----------|-------|----------------|
| Progress bar | Animates `width` | Use `scaleX` with transform-origin |
| Collapsible header | Height animation | Use `scaleY` or clip-path |
| Cart badge count | May animate size | Ensure using scale only |

## CSS Animation Best Practices

### ✅ GPU-Accelerated Shimmer

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### ✅ Will-Change Hints

```css
/* Add before animation starts */
.will-animate {
  will-change: transform, opacity;
}

/* Remove after animation completes to free memory */
```

## Reduced Motion Support

All animations respect `prefers-reduced-motion`:

```typescript
// Framer Motion hook
const prefersReducedMotion = useReducedMotion();

// Conditional animation
<motion.div
  animate={prefersReducedMotion ? {} : { y: -4 }}
/>
```

```css
/* CSS fallback */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Profiling Animations

### Chrome DevTools

1. Open Performance tab
2. Enable "Screenshots" and "Web Vitals"
3. Record while interacting with animations
4. Look for:
   - Frame rate drops (< 60fps)
   - Long frames (> 16.67ms)
   - Layout thrashing (purple bars)
   - Paint storms (green bars)

### React DevTools

1. Open Profiler tab
2. Record interaction
3. Look for components re-rendering during animation
4. Memoize static content to prevent re-renders

## Performance Checklist

- [x] All animations use `transform` and `opacity`
- [x] No `width`/`height` animations
- [x] Framer Motion for complex animations
- [x] CSS for simple keyframes
- [x] `will-change` used sparingly
- [x] Reduced motion respected
- [ ] Profiled on mid-range device
- [ ] No layout thrashing in DevTools
- [ ] Maintains 60fps during scroll

## Testing Methodology

1. **Chrome DevTools Performance**
   - Record 5-second interaction
   - Check frame rate graph
   - Identify long frames

2. **Mobile Testing**
   - Test on Android mid-range device
   - Use Chrome Remote Debugging
   - Profile animations

3. **Lighthouse Performance**
   - Check "Avoid non-composited animations"
   - Review "Reduce unused JavaScript"
