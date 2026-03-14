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

## Responsive Negative Margin Must Match Parent Padding at All Breakpoints

**Context:** `TimeSlotPicker` used `px-6 -mx-6` for full-bleed horizontal scroll, but parent card had `p-4 sm:p-6`. On mobile, `-mx-6` (24px) exceeded `p-4` (16px) by 8px per side. Parent's `overflow-hidden` clipped the overflow, hiding edge date pills.

**Learning:** When using negative margin to extend a child beyond parent padding (common for full-bleed scroll areas), the negative margin must be responsive-aware and match the parent padding at every breakpoint.

```tsx
// BAD — assumes parent always has p-6
"px-6 -mx-6"

// GOOD — matches parent's p-4 (mobile) and sm:p-6 (desktop)
"px-4 -mx-4 sm:px-6 sm:-mx-6"
```

**Apply when:** Full-bleed scroll containers inside cards/containers with responsive padding. Related: "items-center width collapse" in `react-patterns.md`.

---

## Defensive Framer Motion Drag Handlers

`PanInfo` may have undefined `offset`/`velocity` on rapid/interrupted gestures. Always null-check: `if (!info?.offset || !info?.velocity) return;`

---

## Drawer Swipe-to-Close: Two-Layer Fix

**Context:** FeedbackSheet swipe-to-close required two separate fixes across sessions.

**Layer 1 — `height="full"` blocks swipe:** `height="full"` fills the viewport with `overflow-y-auto` + `touchAction: "pan-y"`, capturing all touch events. Fix: use `height="auto"`.

**Layer 2 — content wrapper still blocks swipe when not scrollable:** Even with `height="auto"`, the content wrapper has `touchAction: "pan-y"` which tells the browser to handle vertical touches as scroll — framer-motion drag never fires. Fix: use ResizeObserver to detect when content doesn't overflow, then remove `touchAction: "pan-y"` (inherits parent's `"pan-x"` → swipe-to-close works from anywhere). Also enlarge drag handle padding (`pb-2` → `pb-4`) to meet 44px touch target.

```tsx
// Content wrapper: conditionally set touchAction
style={{ touchAction: contentScrollable ? "pan-y" : undefined }}
```

**Apply when:** Bottom sheet with swipe-to-close. Always check both layers.

---

## Safe Area Inset: Position Not Padding

**Context:** FeedbackFAB had `pb-[env(safe-area-inset-bottom)]` which pushed the icon off-center (34px padding inside a 56px button). During iOS scroll (browser chrome hide/show), the off-center icon made repositioning visually jarring.

**Learning:** `env(safe-area-inset-bottom)` on fixed-position elements should be applied to the `bottom` position, not as internal padding. Padding changes the content layout; position just moves the whole element.

```tsx
// BAD — icon pushed to top of button
className="pb-[env(safe-area-inset-bottom,0px)]"
style={{ bottom: 24 }}

// GOOD — icon stays centered, button sits above safe area
style={{ bottom: `calc(24px + env(safe-area-inset-bottom, 0px))` }}
```

**Apply when:** Fixed-position buttons/FABs on iOS with safe area insets.
