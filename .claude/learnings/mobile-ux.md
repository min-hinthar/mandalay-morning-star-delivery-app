# Mobile UX Learnings

## touchAction Conflicts in Nested Elements

Parent's `touchAction: "pan-x"` (for swipe gesture) blocks vertical scroll in children.

- **Drag handle:** `touch-none` (let Framer handle all gestures)
- **Content areas:** `pan-y` (allow native scroll)

```tsx
<motion.div style={{ touchAction: "pan-x" }} drag="y">
  <div style={{ touchAction: "pan-y" }}>{/* Scrollable content */}</div>
</motion.div>
```

**Apply when:** Swipeable overlays (drawers, sheets) with scrollable content on mobile.

---

## Scroll Lock Cleanup Must Defer Until Animation Complete

`useBodyScrollLock` calling `window.scrollTo()` on unmount races with AnimatePresence exit animation (~200-300ms). iOS Safari: layout thrashing -> memory pressure -> crash.

**Fix:** Defer scroll restoration:

```tsx
// Hook supports deferred restore
useBodyScrollLock(isLocked, { deferScrollRestore: true });

// Call restore in onExitComplete
<AnimatePresence onExitComplete={() => restoreBodyScroll()}>
  {isOpen && <DrawerContent />}
</AnimatePresence>;
```

Key patterns:

1. `requestAnimationFrame` for scroll operations
2. Global lock counting for nested overlays
3. `AnimatePresence.onExitComplete` for deferred restore

**Apply when:** Any overlay with exit animations + scroll lock. Symptoms: mobile crashes, white screen on close.

---

## Bottom Sheet UX Fallbacks

Swipe-to-close gesture is unreliable on mobile. Always provide:

1. **Close button (X)** — explicit, accessible, always works
2. **Reduced height (80vh not 90vh)** — exposes backdrop for tap-to-close
3. **Swipe gesture** — nice-to-have, not required

**Apply when:** Mobile bottom sheets with scrollable content.

---

## Backdrop Blur Mobile Issues

`backdrop-blur-sm` on mobile causes performance issues, visual artifacts, janky animations.

```tsx
// Blur only on tablet+ (sm: = 640px+)
className = "fixed inset-0 bg-overlay-heavy sm:backdrop-blur-sm";
```

Increase overlay opacity to compensate for missing blur on mobile.

**Apply when:** Drawer/modal overlays on mobile-first apps.

---

## Defensive Checks for Framer Motion Drag Handlers

Framer Motion's `PanInfo` in drag handlers may have undefined `offset`/`velocity` in edge cases (rapid gestures, interrupted drags).

```tsx
const handleDragEnd = (_: unknown, info: PanInfo) => {
  if (!info?.offset || !info?.velocity) return;
  // ... rest of logic
};
```

**Apply when:** Any Framer Motion drag implementation, especially on mobile.
