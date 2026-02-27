# React Patterns & Gotchas

## Effect Race Conditions: Closure-Local vs Shared Ref

**Context:** `useAutoRead` hook had a shared `useRef(false)` for cancellation across effect invocations. When a new effect fired (new question), it reset the ref to `false`, but the OLD effect's async chain was still running and checked the same ref — finding it `false` (not cancelled), so it continued playing audio from the previous question.

**Learning:** For async effects with cleanup, use a closure-local `let cancelled = false` instead of a shared `useRef`. Each effect invocation gets its own independent cancellation flag in its closure.

```typescript
// BAD: shared ref — new effect resets it, old effect sees the reset
const cancelledRef = useRef(false);
useEffect(() => {
  cancelledRef.current = false; // Resets for ALL closures!
  async function run() {
    await step1();
    if (cancelledRef.current) return; // Old effect checks SAME ref
    await step2();
  }
  run();
  return () => { cancelledRef.current = true; };
}, [dep]);

// GOOD: closure-local — each invocation isolated
useEffect(() => {
  let cancelled = false; // Scoped to THIS invocation only
  async function run() {
    await step1();
    if (cancelled) return; // Checks OWN flag
    await step2();
  }
  run();
  return () => { cancelled = true; }; // Only affects THIS closure
}, [dep]);
```

Key insight: `useRef` is ONE mutable slot shared across all closures. A closure-local variable creates a FRESH slot per effect invocation, which is what you need when the cleanup of one invocation must not interfere with the next.

**Apply when:** Any `useEffect` with async work (fetches, sequential TTS playback, animations) that re-fires before the previous invocation completes.

## useReducer initialArg Staleness

**Context:** Quiz mock test used `useReducer(quizReducer, { questionCount: questions.length, ... })`. When user changed question count via PreTestScreen (re-rendering parent), `questions.length` changed but the reducer's `state.questionCount` stayed at the ORIGINAL value from first render.

**Learning:** `useReducer(reducer, initialArg)` only uses `initialArg` on first render. If the source data for initial state can change between renders (e.g., parent re-renders with different props), the reducer state becomes stale. You must either:
1. Dispatch an update action when the source data changes
2. Derive the check from props/state outside the reducer
3. Use a `key` prop to force remount with fresh initial state

```typescript
// BAD: stale questionCount if questions array changes
const [state, dispatch] = useReducer(reducer, { questionCount: questions.length });
// state.questionCount is frozen at initial value!

// GOOD: check against live data, not reducer state
if (state.currentIndex + 1 >= questions.length) {
  dispatch({ type: 'FINISH' });
}
```

**Apply when:** Any `useReducer` where initial state derives from props/external data that might change during the component's lifetime.

## Effect Deps Must Include Behavior-Controlling Params

**Context:** `useAutoRead` hook had `autoReadLang` controlling which branch ran (english/burmese/both), but deps were only `[triggerKey, enabled]`. Changing `autoReadLang` in settings had no effect until the next question.

**Learning:** If a value controls WHICH code path runs inside an effect (not just how it runs), it must be in the dependency array — even if you think it "only changes rarely." The effect needs to re-fire to pick up the new behavior.

```typescript
// BAD: autoReadLang controls branching but isn't in deps
useEffect(() => {
  if (autoReadLang === 'both') { /* ... */ }
  else if (autoReadLang === 'english') { /* ... */ }
}, [triggerKey, enabled]); // Stale autoReadLang!

// GOOD: include behavior-controlling params
useEffect(() => {
  if (autoReadLang === 'both') { /* ... */ }
  else if (autoReadLang === 'english') { /* ... */ }
}, [triggerKey, enabled, autoReadLang]);
```

Rule of thumb: if a variable appears in an `if`/`switch` inside the effect, it likely belongs in the deps array.

**Apply when:** Any effect with conditional behavior based on settings, mode flags, or configuration values.

## State Machine Multi-Entry-Point Flow Divergence

**Context:** Sort mode reducer transitions to `animating` phase on `SORT_CARD` dispatch. For drag gestures, `onAnimationComplete` fires after the spring fling and dispatches `ANIMATION_COMPLETE` to exit the phase. But button-initiated sorts call `handleSort()` (dispatching `SORT_CARD`) without ever triggering the animation callback — so the phase stays stuck on `animating` forever, disabling buttons.

**Learning:** When a `useReducer` state machine has multiple UI entry points (buttons, gestures, keyboard) that trigger the same action, each entry point must complete the **full action lifecycle**, not just the initial dispatch. If one path relies on a callback that only fires from a specific interaction type (e.g., spring animation `.then()`), other paths will leave the state machine in a transitional state.

Fix pattern: dispatch the lifecycle-completing action from ALL entry points, and make the action idempotent via a phase guard:
```typescript
// Reducer: guard makes duplicate dispatches harmless
case 'ANIMATION_COMPLETE':
  if (state.phase !== 'animating') return state; // no-op guard
  return { ...state, phase: 'sorting' };

// Button handler: complete the full lifecycle
handleSort(direction);
handleAnimationComplete(); // Immediate — no animation to wait for

// Drag handler: onAnimationComplete fires after spring
// The second ANIMATION_COMPLETE dispatch is a harmless no-op
```

**Apply when:** Any useReducer state machine with transitional phases (e.g., `animating`, `loading`, `submitting`) that multiple UI interaction types can trigger.

## JSX Text Does NOT Interpret Unicode Escapes

**Context:** Myanmar text in DeckManager.tsx breadcrumb and subtitle rendered as literal `\u101C\u1031\u1037...` on the deployed site, but worked in dev. The strings used `\uXXXX` escape sequences directly in JSX text content between tags.

**Learning:** JSX text content is treated as a string literal by the JSX transformer, but `\uXXXX` escape sequences are only interpreted inside JavaScript string expressions. In JSX text, `\u1000` becomes the 6 characters `\`, `u`, `1`, `0`, `0`, `0` — not the Unicode codepoint.

```tsx
// BAD: JSX text — \u escapes are literal characters
<span>\u101C\u1031\u1037\u101C\u100A\u103A\u1015\u1031\u1038\u101B\u1014\u103A</span>
// Renders: \u101C\u1031\u1037\u101C\u100A\u103A...

// GOOD: JS expression — \u escapes are interpreted
<span>{'\u101C\u1031\u1037\u101C\u100A\u103A\u1015\u1031\u1038\u101B\u1014\u103A'}</span>
// Renders: လေ့လည်ပေးရန်

// ALSO GOOD: direct Unicode characters (no escapes needed)
<span>လေ့လည်ပေးရန်</span>
```

**Why it worked in dev:** HMR may process strings differently, or the dev build path preserves Unicode literals while the production build re-escapes them. The fix is to always use JS expressions for non-ASCII escape sequences.

**Apply when:** Any JSX that contains `\uXXXX` or `\xXX` escape sequences in text content. Especially relevant for non-Latin scripts (Myanmar, CJK, Arabic, Devanagari).

## useState Initializer Stale With Async Props (+ React Compiler)

**Context:** `ResumePromptModal` received `sessions` prop that started as `[]` (IndexedDB loads async). The `useState` initializer `sessions.length === 1 ? sessions[0].id : null` ran once at mount with empty array, so `selectedId` stayed `null` even after sessions populated. This kept Resume/Start Fresh buttons permanently disabled.

**Learning:** `useState(() => f(props))` initializers only run once. When props load asynchronously (IndexedDB, fetch, context), the initial value is stale. The naive fix (`useEffect` + `setState`) is blocked by React Compiler's `set-state-in-effect` rule. The correct pattern is **derived state** — compute the effective value during render:

```typescript
// BAD: stale initializer (sessions=[] at mount time)
const [selectedId, setSelectedId] = useState<string | null>(() =>
  sessions.length === 1 ? sessions[0].id : null
);

// ALSO BAD: React Compiler blocks setState in effects
useEffect(() => {
  if (sessions.length === 1) setSelectedId(sessions[0].id);
}, [sessions]); // ❌ react-hooks/set-state-in-effect

// GOOD: derived state — always fresh, no effect needed
const [selectedId, setSelectedId] = useState<string | null>(null);
const effectiveId = hasMultiple ? selectedId : (sessions[0]?.id ?? null);
```

The derived value (`effectiveId`) automatically reflects the latest props without synchronization. User-driven state (`selectedId` from clicking cards) only matters in the multi-session case.

**Apply when:** Any `useState` whose initial value depends on props that may arrive asynchronously (IndexedDB, API fetch, lazy context). Especially in React 19 / React Compiler projects where `set-state-in-effect` is enforced.
