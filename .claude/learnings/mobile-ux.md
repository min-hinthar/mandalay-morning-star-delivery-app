# Mobile UX Learnings

## touchAction Conflicts

Parent `touchAction: "pan-x"` blocks child vertical scroll. Drag handle: `touch-none`. Content: `pan-y`.

---

## Scroll Lock Defer Until Animation Complete

`window.scrollTo()` during AnimatePresence exit → iOS crash. Use `useBodyScrollLock(isLocked, { deferScrollRestore: true })` + `onExitComplete`.

---

## Bottom Sheet Fallbacks

Swipe-to-close unreliable on mobile. Always provide: close button (X), backdrop tap-to-close. Drawer "full" height is 95vh (was 80vh — too short for content-heavy sheets like ItemDetailSheet).

---

## Nested Scroll Containers Block Desktop Wheel Events

**Context:** ItemDetailSheet inside Modal on desktop — inner divs had `overflow-y-auto overscroll-contain` while Modal's content wrapper also had `overflow-y-auto`. Scrollbar worked but wheel scroll over content did not.

**Learning:** When a child has `overflow-y-auto` but no resolved height constraint (e.g., `flex-1` with parent using `max-h` not `height`, or `h-full` on parent without explicit height), the browser treats it as a scroll container that captures wheel events but can't actually scroll. Events don't bubble to the outer scrollable wrapper.

**Fix:** On desktop, let the Modal content wrapper be the sole scroll container. Remove `overflow-y-auto`, `overscroll-contain`, and `h-full` from inner elements. Keep them for mobile Drawer (which has explicit height via `95vh`).

**Apply when:** Modal/dialog wrapping content that has its own `overflow-y-auto` — only one scroll container should exist per axis.

---

## Backdrop Blur Mobile

`backdrop-blur` causes performance issues on mobile. Apply only on tablet+: `sm:backdrop-blur-sm`. Increase overlay opacity to compensate.

---

## Defensive Framer Motion Drag Handlers

`PanInfo` may have undefined `offset`/`velocity` on rapid/interrupted gestures. Always null-check: `if (!info?.offset || !info?.velocity) return;`
