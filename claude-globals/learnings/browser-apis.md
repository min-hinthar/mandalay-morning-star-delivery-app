# Browser API Gotchas

## history.pushState / replaceState Rate Limit

**Context:** Safari enforces ~100 pushState/replaceState calls per 30 seconds (the exact limit varies by version). The error `SecurityError: Attempt to use history.replaceState() more than 100 times per N seconds` is unrecoverable if thrown from framework internals (React Router, Angular Router, etc.) that don't wrap calls in try-catch.

**Learning:** Per-callsite try-catch is insufficient — framework-internal `replaceState` calls (e.g., React Router v7's state sync) are unprotected. The robust fix is a **global history guard** that monkey-patches the API before the router mounts.

### Global history guard (recommended)

```typescript
// Install ONCE before Router mounts (module scope or app init)
const originalReplaceState = history.replaceState.bind(history);
const originalPushState = history.pushState.bind(history);

history.pushState = function (...args) {
  try { originalPushState(...args); }
  catch (e) { if (!(e instanceof DOMException && e.name === 'SecurityError')) throw e; }
};
history.replaceState = function (...args) {
  try { originalReplaceState(...args); }
  catch (e) { if (!(e instanceof DOMException && e.name === 'SecurityError')) throw e; }
};
```

### React Router v7 interaction

React Router v7 stores `{idx, key}` in `history.state`. External `pushState(null, '')` wipes this metadata, forcing React Router to call `replaceState` to restore it — doubling history API calls per interaction. Fix: use typed state objects in navigation locks.

```typescript
// BAD: wipes React Router's {idx, key} metadata
window.history.pushState(null, '', url);

// GOOD: non-null state; React Router's metadata is separate per history entry
window.history.pushState({ navLock: true }, '', url);
```

### Redirect chains

If route A `navigate()`s to route B which has `<Navigate replace to="/C" />`, each hop produces a `replaceState` call. Navigate directly to the final destination.

**Apply when:** Any SPA with navigation locks (test guards, unsaved-changes prompts) or deprecated route redirects. Especially important on Safari/iOS.

## WAAPI (Web Animations API) Only Supports 2-Keyframe Arrays

**Context:** NavItem icon pop animation used `scale: [0.85, 1.08, 1]` (3 keyframes) in motion/react's `animate` prop. Production build threw "Only two keyframes currently supported" error.

**Learning:** When motion/react delegates to WAAPI (which it does by default in production for performance), array-based keyframe animations are limited to exactly 2 values. Three or more keyframes cause a runtime error that silently breaks the animation.

```tsx
// BAD: 3 keyframes — WAAPI throws error
animate={{ scale: [0.85, 1.08, 1] }}

// GOOD: 2 keyframes — works with WAAPI
animate={{ scale: [0.9, 1] }}

// GOOD: repeatType 'mirror' for oscillating loops (idle→active→idle)
initial={{ scale: 1, opacity: 0.7 }}
animate={{ scale: 1.15, opacity: 1 }}
transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}

// GOOD: Spring physics for pop-in/bounce (natural overshoot replaces 3-keyframe)
initial={{ scale: 0 }}
animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 400, damping: 15 }}

// GOOD: Spring for shake-settle (offset → rest with oscillation)
initial={{ x: -8 }}
animate={{ x: 0 }}
transition={{ type: 'spring', stiffness: 600, damping: 12 }}
```

Key details:
- This only manifests in production builds where WAAPI is active (dev mode often uses JS animation path)
- The error is caught and logged but the animation simply doesn't play — content may appear frozen
- `repeatType: 'mirror'` is the go-to for `[a, b, a]` oscillation patterns (breathing, pulsing, equalizer bars)
- Spring physics with overshoot (`damping < 20`) replaces `[0, overshoot, 1]` pop-in patterns
- Spring from offset replaces multi-keyframe shake patterns like `x: [0, -5, 5, -3, 3, 0]`

**Apply when:** Any motion/react array-based keyframe animation. Always limit to exactly 2 values, use `repeatType: 'mirror'` for loops, or spring physics for multi-step effects.

## pointerdown vs mousedown for Touch-Capable Devices

**Context:** Tablet sidebar click-outside-to-collapse handler used `mousedown`. Touch taps didn't reliably dismiss the sidebar because `mousedown` fires with ~300ms delay (or not at all) on touch devices.

**Learning:** Always use `pointerdown`/`PointerEvent` instead of `mousedown`/`MouseEvent` for handlers that must work across mouse, touch, and stylus. The Pointer Events API fires immediately for all input types with no emulation delay.

```typescript
// BAD: unreliable on touch
document.addEventListener('mousedown', (e: MouseEvent) => { ... });

// GOOD: works for mouse, touch, and stylus
document.addEventListener('pointerdown', (e: PointerEvent) => { ... });
```

Key points:
- `mousedown` on touch devices relies on the browser's touch→click emulation layer, adding ~300ms delay
- Some browsers skip `mousedown` entirely if `touchstart`/`touchend` triggers a default action
- `PointerEvent` extends `MouseEvent` — same properties (clientX, target, etc.) so it's a drop-in replacement
- No polyfill needed: supported in all modern browsers (Chrome 55+, Firefox 59+, Safari 13+)

**Apply when:** Any `mousedown`/`mouseup`/`mousemove` listener that must work on touch or hybrid devices. Especially important for dismiss-on-outside-click patterns.

## focus() Scrolls Page Without preventScroll

**Context:** SpeechButton added `buttonRef.current?.focus()` when speaking began (accessibility). This caused the page to scroll to the button's position, jumping the user's viewport.

**Learning:** `HTMLElement.focus()` triggers the browser's built-in scroll-into-view behavior by default. When focusing an element programmatically (not via user click), always use `{ preventScroll: true }` to avoid unwanted page jumping.

```typescript
// BAD: scrolls page to element
buttonRef.current?.focus();

// GOOD: focuses without scrolling
buttonRef.current?.focus({ preventScroll: true });
```

Key points:
- User-initiated focus (clicking a button) doesn't cause this because the element is already in view
- Programmatic focus from effects (e.g., state change triggers focus) is where this bites
- Especially problematic when multiple instances of a component exist on the page (e.g., SpeechButton in each card)
- `preventScroll` is supported in all modern browsers

**Apply when:** Any programmatic `.focus()` call in effects, callbacks, or state-change handlers — especially for components that appear multiple times on a page.

## Mobile Autoplay Policy: Persistent Audio Element + Unlock Pool

**Context:** Interview questions (triggered from `useEffect`) had no audio on mobile, while answers (triggered shortly after a grade button tap) played fine. Both used `new Audio(url).play()`.

**Learning:** Mobile browsers block `HTMLAudioElement.play()` unless called within a user gesture context. The gesture context expires quickly (~seconds), so audio triggered from `useEffect` chains or `setTimeout` cascades (e.g., greeting → chime → typing → reading) will fail even if the original gesture was recent.

**Fix pattern — persistent element pool:**
1. On user gesture (button click), pre-create Audio elements and `.play()` silence through them
2. Store "blessed" elements in a module-level pool
3. When creating players later, consume from pool instead of `new Audio()`
4. Reuse the same element for all plays (change `.src` instead of creating new)

```typescript
const _unlockedPool: HTMLAudioElement[] = [];

// Call from gesture handler (click/tap)
export function unlockAudioSession(): void {
  for (let i = 0; i < 3; i++) {
    const el = new Audio();
    el.src = silenceUrl; // tiny WAV blob
    el.volume = 0.01;
    el.play().then(() => { el.pause(); el.volume = 1; }).catch(() => {});
    _unlockedPool.push(el);
  }
  // Also unlock AudioContext (belt-and-suspenders for Chrome MEI)
  const ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
}

// Players consume from pool
export function createAudioPlayer(): AudioPlayer {
  const el = _unlockedPool.shift() ?? new Audio();
  // Reuse el by setting el.src = newUrl on each play()
}
```

Key points:
- Safari iOS: per-element restriction — reusing the same element that was `.play()`'d from a gesture works
- Chrome Android: origin-level + MEI-based — AudioContext resume + silent play helps score
- The silent WAV can be generated as a blob URL at runtime (46 bytes: 44-byte header + 2 bytes silence)
- Pool size should match number of concurrent AudioPlayer instances needed
- `cancel()` should increment a `playId` counter (not destroy the element) to invalidate stale callbacks

**Apply when:** Any web app that plays audio from `useEffect`, `setTimeout`, or other non-gesture contexts on mobile. Especially SPA flows where user gesture → state transition → audio playback spans multiple renders.
