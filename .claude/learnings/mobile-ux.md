# Mobile UX Learnings

## touchAction Conflicts

Parent `touchAction: "pan-x"` blocks child vertical scroll. Drag handle: `touch-none`. Content: `pan-y`.

---

## Scroll Lock Defer Until Animation Complete

`window.scrollTo()` during AnimatePresence exit → iOS crash. Use `useBodyScrollLock(isLocked, { deferScrollRestore: true })` + `onExitComplete`.

---

## Bottom Sheet Fallbacks

Swipe-to-close unreliable on mobile. Always provide: close button (X), reduced height (80vh), backdrop tap-to-close.

---

## Backdrop Blur Mobile

`backdrop-blur` causes performance issues on mobile. Apply only on tablet+: `sm:backdrop-blur-sm`. Increase overlay opacity to compensate.

---

## Defensive Framer Motion Drag Handlers

`PanInfo` may have undefined `offset`/`velocity` on rapid/interrupted gestures. Always null-check: `if (!info?.offset || !info?.velocity) return;`
