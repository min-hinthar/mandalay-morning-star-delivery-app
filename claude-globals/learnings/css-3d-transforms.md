# CSS Transforms & Animation Conflicts

## 3D Flip Card: backfaceVisibility Does NOT Block Pointer Events

**Context:** Flashcard3D component with front/back faces using `transform: rotateY(180deg)` and `backfaceVisibility: hidden`. Users reported both sides were not interactive.

**Learning:** `backfaceVisibility: hidden` only controls visual rendering — it does NOT prevent the element from receiving pointer events. When two `absolute inset-0` faces overlap, the front face captures all clicks even when visually hidden. You must explicitly toggle `pointerEvents` based on flip state.

```tsx
// Front face - disable pointer events when flipped
style={{ backfaceVisibility: 'hidden', pointerEvents: isFlipped ? 'none' : 'auto' }}

// Back face - enable pointer events only when flipped
style={{
  backfaceVisibility: 'hidden',
  transform: 'rotateY(180deg)',
  pointerEvents: isFlipped ? 'auto' : 'none',
}}
```

**Apply when:** Any 3D flip card pattern with overlapping absolute-positioned faces. Check both CSS-based flip cards (can use `pointer-events: none` in CSS) and JS-animated flip cards (need inline style toggle).

**Note:** CSS-based flip cards (like `.flip-card` in globals.css) can handle this in stylesheet rules — JS-animated ones (motion/react) need React state-driven `pointerEvents`.

## CSS-Only 3D Flip Cards Require Three Properties on Three Elements

**Context:** Study guide flip cards used CSS transitions with `rotateY` and `translateY` shifts + opacity crossfade. The card appeared to "flip down" instead of rotating in 3D. The JS-animated `Flashcard3D` component (using motion/react) worked correctly.

**Learning:** CSS-only 3D flip cards require three properties distributed across three nesting levels. Missing any one produces a flat crossfade, not a 3D flip:

```css
/* Container: create the 3D rendering context */
.flip-card {
  perspective: 1000px;           /* 1. Enables 3D space */
}

/* Inner rotating element */
.flip-card-inner {
  transform-style: preserve-3d;  /* 2. Propagates 3D to children */
  transition: transform 0.5s;
}
.flip-card[data-flipped='true'] .flip-card-inner {
  transform: rotateY(180deg);
}

/* Both faces */
.flip-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;   /* 3. Auto-hides back of each face */
}
.flip-card-back {
  transform: rotateY(180deg);    /* Pre-rotated so it faces forward when parent flips */
}
```

Common mistakes that produce broken "flip-down" effects:
- Using `translateY` shifts instead of pure `rotateY` — vertical sliding, not rotation
- Using `opacity` crossfade — flat fade, no 3D illusion
- Missing `perspective` on container — transforms render flat (orthographic)
- Missing `preserve-3d` on inner — child faces collapse to parent's plane
- Missing `backface-visibility: hidden` — both faces visible simultaneously

**Apply when:** Any CSS-only flip card (no JS animation library). JS-animated versions (motion/react Flashcard3D) handle perspective/preserve-3d via inline styles and spring physics instead of CSS transitions.

## overflow:hidden Silently Flattens transform-style: preserve-3d

**Context:** Browse flip cards showed mirrored/reversed text after adding `transform-style: preserve-3d` to `.flip-card-inner`. The JSX had Tailwind `overflow-hidden` on the same element. `backface-visibility: hidden` appeared to have no effect — both faces were visible (back face mirrored).

**Learning:** Per CSS spec, **any `overflow` value other than `visible`** forces `transform-style` to compute as `flat`, even if `preserve-3d` is explicitly set. This silently collapses the 3D rendering context — children lose their 3D positioning and `backface-visibility: hidden` stops working.

```tsx
// BAD: overflow-hidden on same element as preserve-3d — 3D is silently killed
<div className="flip-card-inner overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
  <div style={{ backfaceVisibility: 'hidden' }}>Front</div>  // ← both visible!
  <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>Back (mirrored)</div>
</div>

// GOOD: overflow-hidden on face elements (which don't need preserve-3d)
<div className="flip-card-inner" style={{ transformStyle: 'preserve-3d' }}>
  <div className="overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>Front</div>
  <div className="overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>Back</div>
</div>
```

**Debugging clue:** If a 3D flip card shows mirrored text or both faces simultaneously despite `backface-visibility: hidden`, check for `overflow: hidden/auto/scroll/clip` on the `preserve-3d` element or any ancestor up to the `perspective` container.

**Also applies to:** `overflow: auto`, `overflow: scroll`, `overflow: clip`, `contain: paint/layout/strict` — all flatten `preserve-3d`.

**Safari note:** Always include `-webkit-backface-visibility: hidden` alongside `backface-visibility: hidden` for Safari/WebKit compatibility.

**Apply when:** Any 3D CSS transform that uses `preserve-3d`. Always audit for `overflow` on the same element or ancestors. Tailwind's `overflow-hidden` is an easy trap since it's commonly added for layout purposes.

## Mobile: backface-visibility Requires Explicit Transform on Each Face

**Context:** Flashcard3D had `backface-visibility: hidden` on both faces, but on mobile the front face (question) was still visible as mirrored text when flipped to the answer side. The back face worked correctly.

**Learning:** Mobile WebKit/Blink only honors `backface-visibility: hidden` when the element itself has an explicit `transform`. Desktop browsers infer 3D participation from the parent's `preserve-3d`, but mobile browsers require each face to declare a transform to "opt in" to the 3D rendering context.

```tsx
// BAD: Front face has no transform — mobile ignores backface-visibility
<div style={{ backfaceVisibility: 'hidden' }}>Front</div>
<div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>Back</div>

// GOOD: Both faces have explicit transforms — mobile respects backface-visibility
<div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}>Front</div>
<div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>Back</div>
```

**Apply when:** Any 3D flip card targeting mobile. Always give the front face `transform: rotateY(0deg)` even though it's the identity transform.

## Avoid backdrop-filter, isolation, transition:transform Inside preserve-3d

**Context:** Flashcard3D face elements used `glass-light` (backdrop-filter, transition:transform) and `prismatic-border` (position:relative, isolation:isolate) inside a `preserve-3d` container. Cards worked on desktop but 3D flip was completely broken on mobile.

**Learning:** Several CSS properties on children of a `preserve-3d` element cause mobile rendering failures:
- **`backdrop-filter`** — doesn't composite correctly in 3D space on mobile Safari
- **`isolation: isolate`** — creates stacking context boundaries that interfere with 3D rendering
- **`transition: transform`** — can fight static `rotateY()` values during React re-renders
- **`position: relative`** (from custom CSS) — can override `absolute` positioning needed for face stacking (production CSS source order issue)

```tsx
// BAD: Complex CSS classes inside preserve-3d context
const faceClasses = 'absolute inset-0 glass-light prismatic-border overflow-hidden';

// GOOD: Simple, 3D-safe styling only
const faceClasses = 'absolute inset-0 bg-card border border-border/60 overflow-hidden';
```

**Rule:** Keep face elements inside `preserve-3d` as simple as possible. Safe: `background-color`, `border`, `box-shadow`, `overflow`, `border-radius`. Unsafe: `backdrop-filter`, `filter`, `isolation`, `contain`, CSS `transition: transform`.

**Apply when:** Any element inside a `preserve-3d` context, especially on mobile. If visual effects are needed, apply them to a nested grandchild that doesn't participate in the 3D transform.

## Framer Motion Inline Transform Overrides CSS Transform Centering

**Context:** Radix Dialog centered with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` rendered in bottom-right corner when wrapped in a `motion.div` with `y` and `scale` animation variants.

**Learning:** Framer Motion (motion/react) applies inline `transform: translateY(0px) scale(1)` which completely overrides Tailwind's CSS `transform: translateX(-50%) translateY(-50%)`. The centering offset is lost, so the element's top-left corner sits at 50%/50% of the viewport.

**Fix:** Replace translate-based centering with a flexbox wrapper:

```tsx
// BAD: motion.div overwrites the translate centering
<motion.div
  animate={{ y: 0, scale: 1 }}
  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
>

// GOOD: flexbox centering is independent of transform
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
  <motion.div
    animate={{ y: 0, scale: 1 }}
    className="pointer-events-auto w-full max-w-lg"
  >
```

Key details:
- `pointer-events-none` on the flex wrapper prevents it from blocking overlay click-to-dismiss
- `pointer-events-auto` on the inner motion.div restores interactivity for the modal content
- This pattern works with any animation library that manipulates `transform` inline

**Apply when:** Centering any element that also uses Framer Motion, GSAP, react-spring, or other JS animation libraries that set inline `transform`.

## Tab Indicator: layoutId Pill vs CSS transition-colors Cross-Fade

**Context:** Mobile bottom nav bar pills used CSS `transition-colors duration-200` to toggle `bg-primary/20` on each tab independently. Users reported the pill "randomly shrinks and grows" when switching tabs.

**Learning:** CSS `transition-colors` on per-tab backgrounds creates a cross-fade where the old pill fades out and the new pill fades in simultaneously. This causes:
1. Two translucent backgrounds overlap during transition — visual "grow" illusion
2. `shadow-sm` doesn't animate (not a color property) — snaps on/off
3. No spatial continuity — highlight jumps rather than slides

**Fix:** Use a single `motion.span` with `layoutId` that only renders on the active tab. motion/react automatically FLIP-animates the pill from old position to new position.

```tsx
// BAD: Cross-fade — each tab toggles its own background
<span className={`rounded-full transition-colors ${isActive ? 'bg-primary/20' : ''}`}>
  {icon}
</span>

// GOOD: layoutId — single pill slides between tabs
<span className="relative flex h-8 w-12 items-center justify-center rounded-full">
  {isActive && (
    <motion.span
      layoutId="mobile-nav-pill"
      className="absolute inset-0 rounded-full bg-primary/20"
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  )}
  {icon}
</span>
```

**Caveat — layoutId + scrollTo race condition:** If the tab container uses `scrollTo({ behavior: 'smooth' })` to center the active tab, the smooth scroll fights with the FLIP animation. motion/react measures positions in `useLayoutEffect` (before paint), but `scrollTo` runs in `useEffect` (after paint). The smooth scroll shifts DOM positions mid-animation, causing the pill to overshoot or drift. Fix: use `behavior: 'instant'` — the layoutId animation provides sufficient visual continuity.

**Apply when:** Any tab bar, segmented control, or navigation with an active indicator that should slide between items. Especially useful when tabs are in a scrollable container or have variable widths (where translateX-based approaches are harder).

## Tailwind transition-all Fights JS Animation Libraries

**Context:** Sidebar nav items used Tailwind's `transition-all` for hover/active color changes. When the sidebar toggled between expanded (wide row) and collapsed (icon circle), `transition-all` animated layout properties (width, height, padding, gap) via CSS simultaneously with motion/react's spring animation on the parent — creating messy intermediate states.

**Learning:** Tailwind's `transition-all` transitions every CSS property, including layout-triggering ones. When a JS animation library (motion/react, GSAP) is already handling layout changes via springs, CSS `transition-all` creates competing animations on the same properties.

**Fix:** Use Tailwind's bare `transition` class instead:
- `transition-all`: ALL properties including width, height, padding, gap, margin
- `transition`: colors, box-shadow, transform, opacity, filter (visual-only, no layout)
- `transition-colors`: only color properties

```tsx
// BAD: CSS fights motion/react spring on layout properties
<motion.div animate={{ width }} className="transition-all bg-primary/20 hover:bg-primary/30">

// GOOD: CSS handles colors/shadow, motion/react handles layout
<motion.div animate={{ width }} className="transition bg-primary/20 hover:bg-primary/30">
```

**Apply when:** Any element animated by a JS library that also needs CSS transitions for hover/active states. Check for `transition-all` anywhere motion/react, GSAP, or react-spring handles layout or geometry changes.

## motion/react animate Prop Auto-Fires on Value Change

**Context:** Sidebar wrapped locked nav items in `<motion.div animate={isLocked ? SHAKE_KEYFRAMES : undefined}>`. When `isLocked` became true, ALL locked tabs simultaneously shook — the intent was tap-only shake.

**Learning:** motion/react's `animate` prop plays its animation whenever the target value changes. Setting it to keyframes on a condition means the animation plays immediately when the condition becomes true, not on user interaction. This is the intended API behavior — `animate` is for declarative state-driven animation, not gesture response.

**Fix:** Use `whileTap` for gesture-triggered animations. Add explicit `transition` to match intended timing:

```tsx
// BAD: Shakes all items immediately when isLocked becomes true
<motion.div animate={isLocked ? { x: [0, -6, 6, -4, 4, 0] } : undefined}>

// GOOD: Only shakes on tap gesture
<motion.div whileTap={isLocked ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } } : undefined}>
```

**Apply when:** Any motion/react animation that should be gesture-triggered (tap, hover, drag). Use `whileTap`, `whileHover`, `whileDrag` instead of conditional `animate`.

## Custom CSS Classes Silently Override Tailwind Positioning Utilities

**Context:** A `.prismatic-border { position: relative }` rule overrode Tailwind's `.fixed` on a sidebar, breaking layout in production but not dev.

**Learning:** When a custom CSS class sets `position` (or any property Tailwind utilities also set), and both have specificity 0-1-0, **source order in the compiled stylesheet** determines the winner. Tailwind utilities are typically emitted first, so custom classes defined in separate CSS files that are imported later will win.

This only manifests in **production builds** because dev mode HMR may inject CSS in a different order than the production bundler.

**Fix pattern:** Add compound selectors to preserve explicit positioning:

```css
/* Custom class needs position:relative for ::before */
.my-class { position: relative; }

/* Preserve Tailwind positioning when combined */
.my-class.fixed { position: fixed; }
.my-class.absolute { position: absolute; }
.my-class.sticky { position: sticky; }
```

Compound selectors (0-2-0) always beat single-class selectors (0-1-0) regardless of source order.

**Debugging technique:** Use browser evaluate to find which rules match:
```js
const sheets = document.styleSheets;
for (const sheet of sheets) {
  for (const rule of sheet.cssRules) {
    if (rule.selectorText && el.matches(rule.selectorText) && rule.style.position) {
      console.log(rule.selectorText, rule.style.position);
    }
  }
}
```

**Apply when:** Writing custom CSS classes that set `position`, `display`, `z-index`, or other properties that Tailwind utilities also control. Especially in projects with both custom CSS files and Tailwind.

## Orchestrator Container Variants Must Not Animate Visual Properties

**Context:** StaggeredList component used motion/react variant orchestration. The container `hidden` variant included `opacity: 0` alongside `staggerChildren`/`delayChildren`. In production, WAAPI didn't fire the container's opacity transition, so ALL content wrapped in StaggeredList was permanently invisible (12+ divs stuck at `opacity: 0`).

**Learning:** In motion/react's variant propagation pattern, the **container** should only orchestrate timing (`staggerChildren`, `delayChildren`). It should NOT include visual properties like `opacity`, `scale`, or `y` — those belong on the **item** variants. If the container animates `opacity: 0 → 1`, and the WAAPI animation fails or doesn't fire, the entire subtree is hidden with no fallback.

```tsx
// BAD: Container hides itself — if animation fails, everything invisible
const containerVariants = {
  hidden: { opacity: 0 },  // ← DANGEROUS
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// GOOD: Container only orchestrates timing
const containerVariants = {
  hidden: {},  // ← Empty or omit visual props
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// Items handle their own visual animation
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
};
```

**Apply when:** Any motion/react staggered list, grid, or parent-child variant propagation pattern. Always separate orchestration (container) from visual animation (items).
