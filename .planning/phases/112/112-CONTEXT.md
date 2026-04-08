# Phase 112: Order Tracking Overhaul - Context

**Gathered:** 2026-04-08 (auto mode — assumptions resolved via 12-agent precontext research)
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the customer order-tracking experience reliable and usable on mobile: full-height map with collapsible bottom sheet, transparent reconnection UX, battery-respectful visibility pausing, and a mute toggle for audio notifications. Client-side only — no API contract changes, no new tables, no migrations, no RLS edits.

**In scope (5 fixes):**
- CFIX-10: Visible mute toggle for tracking audio — persists across sessions
- TRAK-01: Full-height map + collapsible bottom sheet on mobile (desktop unchanged)
- TRAK-02: "Reconnecting..." banner when Realtime channel drops (2s debounce)
- TRAK-03: Pause Realtime + polling when tab hidden, resume on focus
- TRAK-04: Exponential backoff reconnect (1s→30s capped) — not linear 5s retry

**Explicitly NOT in scope (other phases own):**
- Desktop tracking layout changes → unchanged (mobile-only sheet)
- Offline tracking / service worker → Phase 114 (LOAD)
- A11Y audit of tracking components → Phase 113 (A11Y)
- Sticky reorder button / share previews → Phase 116 (UXPL)
- Push notifications → Phase v2.4 NOTF-01
- Map internals (LazyDeliveryMap untouched)
- 3-tier snap points (Drawer.tsx supports binary only — YAGNI)
- New bottom-sheet library (vaul) — Drawer.tsx already covers it

</domain>

<decisions>
## Implementation Decisions

### Bottom Sheet Primitive (TRAK-01)
- **D-01:** Reuse existing `src/components/ui/Drawer.tsx` as bottom sheet — no `vaul`, no `@radix-ui/react-dialog` drawer. Drawer already has focus trap, body-scroll lock with deferred restore, backdrop, ESC/outside-click close, swipe-to-dismiss, and mobile Safari GPU crash protection.
- **D-02:** **Binary snap points** (collapsed peek ↔ expanded 95vh). Drawer.tsx does not support 3-tier snap and adding it is YAGNI for tracking use case. Peek shows essential info (driver name, ETA, status); expanded shows full details.
- **D-03:** **Mobile-only sheet** — wrap mobile layout in `<div className="lg:hidden">`. Desktop `lg:grid-cols-2` 50/50 split at `TrackingPageClient.tsx:217` stays unchanged. Zero desktop regression risk.
- **D-04:** **NEVER modify Drawer.tsx exit animation** — must stay `duration: 0.15s easeIn`. Spring exit caused cascading mobile Safari GPU compositor crashes (commit 4087d3bf, 2026-01-30). Phase 112 wraps Drawer, does not reconfigure it.
- **D-05:** Sheet open spring: existing `overlayMotion.sheetOpen` (damping=30, stiffness=300). Backdrop `duration: 0.2s easeOut`. Drag handle `w-12 h-1.5 rounded-full bg-border-default`, scale+darken on drag. Swipe threshold 150px+velocity.
- **D-06:** Sheet height uses `100dvh`/`100svh` for iOS Safari safe area (not `100vh`). Apply `pb-safe` utility for home indicator clearance.
- **D-07:** `Drawer` may need a `dismissible={false}` prop (always-open variant). Verify during planning — if missing, add minimally without touching exit animation.

### Exponential Backoff (TRAK-04)
- **D-08:** Replace `RECONNECT_DELAY = 5000` in `useTrackingSubscription.ts:32` with exponential backoff: `Math.min(1000 * 2 ** attempt, 30000)` — curve 1s, 2s, 4s, 8s, 16s, 30s, 30s...
- **D-09:** **Extract to `src/lib/utils/backoff.ts`** shared util exporting `computeBackoffMs(attempt, base=1000, max=30000)`, `RECONNECT_BASE_MS`, `RECONNECT_MAX_MS`. Both `useTrackingSubscription.ts` AND `query-provider.tsx` (Phase 110) import from here — single source of truth, unit-testable in isolation.
- **D-10:** **Infinite retries while page open** — no max attempt counter. Delivery window is 30-90 min; user expects tracking to keep trying. Reset `attempt` counter to 0 on successful `SUBSCRIBED` status.
- **D-11:** Maintain existing Phase 110 retry-filter contract (5xx + 429 + status 0 only) when the hook eventually migrates polling to React Query. Not in scope for Phase 112 itself — polling stays as raw `fetch` in `fetchTrackingData()`.

### Visibility Pause (TRAK-03)
- **D-12:** On `document.visibilitychange` → `hidden`: call `supabase.removeChannel()` on **BOTH** `channelRef.current` AND `locationChannelRef.current`, then `clearInterval(pollIntervalRef.current)`, then `clearTimeout(reconnectTimeoutRef.current)`. Stop everything — no idle billing for Realtime channel or polling bandwidth.
- **D-13:** On `document.visibilitychange` → `visible`: call `fetchTrackingData()` immediately (refresh stale state), then `setupSubscriptions()` (re-subscribe tracking channel), then `setupLocationSubscription()` if `routeId` present.
- **D-14:** **Use React 19 `useEffectEvent`** for visibility handler to avoid stale closure on `setupSubscriptions`. Empty effect deps `[]` is OK with `useEffectEvent`.
- **D-15:** Visibility listener registered inside the same `useEffect` as subscription setup (shared closure scope). Cleanup in return function: `document.removeEventListener('visibilitychange', handler)`.
- **D-16:** Race protection — existing pattern at `useTrackingSubscription.ts:177-181` (clear pending reconnect timeout before re-subscribing) extends to visibility handler. Flip-flop tab behavior must not accumulate channels.

### Reconnecting Banner (TRAK-02)
- **D-17:** New component `src/components/ui/orders/tracking/ReconnectingBanner.tsx` (~80 LOC). Reusable, token-only, dark-mode compatible.
- **D-18:** **2-second debounce** before showing banner. `setTimeout(() => setShowBanner(true), 2000)` on first `CHANNEL_ERROR|CLOSED`. Clear timer on `SUBSCRIBED`. Eliminates 90%+ of transient-blip false alarms while still surfacing real disconnects quickly.
- **D-19:** Banner placement: **fixed top, below sticky header** — `position: fixed; top: 56px (header height); z-index: 25` (between sticky header z-20 and modal z-40). Visible regardless of sheet collapsed/expanded state.
- **D-20:** Banner copy: title `"Reconnecting..."` (calm, not `"Connection lost"`), optional subtitle `"We're updating your driver's location"` (conversational "we", not "system"). No exclamation marks. No technical jargon. Matches Burmese family-business warmth in `docs/frontend-design-system.md`.
- **D-21:** Auto-dismiss on reconnect — no dismiss button. Calm UX.
- **D-22:** Banner enter spring: `stiffness: 300, damping: 25` matching `NearbyBanner.tsx:81-86`. Exit: `duration: 0.15s easeIn` matching Drawer pattern. Wrap in `useAnimationPreference().getSpring()` for reduced-motion honor.
- **D-23:** Banner uses existing tokens: `bg-status-warning-bg`, `text-status-warning`, icon color matches. Dark mode variants already exist.
- **D-24:** Accessibility: `role="status" aria-live="polite"` (NOT assertive — connection state is not an emergency).
- **D-25:** Add missing `border-status-warning` token alias in `src/app/globals.css @theme inline` block: `--color-border-status-warning: var(--color-warning-300);`. Keeps ESLint clean and prevents Phase 113 tech debt.

### Mute Toggle (CFIX-10)
- **D-26:** New component `src/components/ui/orders/tracking/MuteToggle.tsx` (~50 LOC). Icon swap `Volume2 ↔ VolumeX` from `lucide-react` (already installed).
- **D-27:** New hook `src/lib/hooks/useMutePreference.ts` (~40 LOC). localStorage-backed, SSR-safe, returns `{ isMuted, setMuted, toggleMuted, isHydrated }`.
- **D-28:** **Global localStorage key** `trackingAudioMuted` (boolean) — persists across orders and sessions, NOT per-order. Matches `useSoundPreference` precedent. Once muted, all tracking pages respect it.
- **D-29:** SSR safety: `useState(false)` as default (matches server output), `useEffect` reads localStorage post-mount and sets state + `isHydrated` flag. Prevents Next.js 16 App Router hydration mismatch warnings.
- **D-30:** Mute button placement: **header**, between `ShareButton` and `RefreshCw` button at `TrackingPageClient.tsx:198-210`. Adjacent to other connection-related controls.
- **D-31:** Touch target ≥44px (Phase 113 A11Y compliance). Haptic `triggerHaptic("light")` on toggle (existing util).
- **D-32:** Accessibility: `<button aria-pressed={isMuted} aria-label={isMuted ? "Unmute notifications" : "Mute notifications"}>`. No toast on toggle — visual icon swap is enough (reduce noise).
- **D-33:** Optional scale pulse on click using `spring.snappy` (stiffness=600, damping=35); reduced-motion instant swap.

### Audio Gate (CFIX-10)
- **D-34:** Gate audio playback at `TrackingPageClient.tsx:90` status transition `useEffect`:
  ```typescript
  if (!isMuted && !document.hidden) {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.2;
      void audio.play().catch(() => {});
    } catch {}
  }
  ```
- **D-35:** Mirror canonical `NearbyBanner.tsx:40-69` audio pattern — do not invent new audio-loading code. Preserves autoplay policy handling (`try/catch` on `audio.play()` promise).
- **D-36:** When `document.hidden`, skip audio even if unmuted — double-guard against background playback.

### Test Coverage (SHOULD-HAVE — safety net before refactor)
- **D-37:** Add Vitest tests for `useTrackingSubscription.ts` **BEFORE** refactoring the hook. Mock Supabase `channel().on().subscribe()` chain, use `vi.useFakeTimers()` for backoff timer assertions. Current test file covers helpers only (`useShowLiveTracking`, `useLastUpdateDisplay`) — reconnect state machine is untested.
- **D-38:** New test cases:
  - Backoff curve computes `[1000, 2000, 4000, 8000, 16000, 30000, 30000, ...]`
  - Visibility hidden → `removeChannel` called twice + `clearInterval` + `clearTimeout`
  - Visibility visible → `fetchTrackingData` called + `setupSubscriptions` called
  - Mute persistence via localStorage (new hook `useMutePreference.test.ts`)
  - Audio gate skips on `document.hidden` even when unmuted
  - Banner 2s debounce: shows after 2000ms disconnect, not before; clears on reconnect within 2s
- **D-39:** New test file `src/lib/hooks/__tests__/useMutePreference.test.ts` (~80 LOC) covering SSR-safe hydration, toggle persistence, read on mount.
- **D-40:** `src/lib/utils/__tests__/backoff.test.ts` unit tests — pure function, trivial assertions.

### Scope Discipline
- **D-41:** **Backend: zero changes** — no API contract changes, no DB schema, no migrations, no RLS policy edits, no RPC edits. All Phase 112 work is client-side.
- **D-42:** **Map internals: zero changes** — `LazyDeliveryMap` component untouched. Phase 112 only wraps/positions the map in a new layout.
- **D-43:** **Polling interval unchanged** — `POLLING_INTERVAL = 30000` (30s) stays as-is. TRAK-03 adds pause logic; backoff only affects reconnect timing, not polling cadence.
- **D-44:** **No dependency additions** — no `vaul`, no `p-retry`, no new animation library. Everything reuses existing installed deps.
- **D-45:** Burmese copy for new strings ("Reconnecting...", "We're updating your driver's location", mute aria-labels) marked with `// BURMESE-REVIEW` comment for native-speaker review before ship. Defaults in research §8.

### Telemetry (NICE-TO-HAVE — optional)
- **D-46:** **Optional** Sentry breadcrumbs (not events) on reconnect attempts, visibility pause/resume, banner show/hide. Zero-cost in normal operation — only attach to error reports if something else fails. Planner may include or defer based on effort budget.

### Implementation Order (Goal-Backward)
- **D-47:** Sequence:
  1. **Extract** `src/lib/utils/backoff.ts` + tests (foundation; refactor `query-provider.tsx` to import from util in same commit)
  2. **Test coverage** for `useTrackingSubscription.ts` (baseline before refactor — D-37)
  3. **TRAK-04** (exponential backoff) — pure logic, single hook, low risk
  4. **TRAK-03** (visibility pause) — same hook as #3, mirrors Phase 111 conditional polling pattern
  5. **TRAK-02** (Reconnecting banner) — depends on #3's stable backoff state
  6. **CFIX-10** (mute toggle + audio gate) — independent, header-only, ~30 LOC
  7. **TRAK-01** (bottom sheet layout) — biggest visual change, last to land

### Cross-Cutting Rules
- **D-48:** All `useEffect` cleanups paired in return — listeners, timers, intervals, subscriptions. Phase 110 D-30 precedent, tightened by Phase 112's visibility handling.
- **D-49:** All motion through `useAnimationPreference().getSpring()` — honor `prefers-reduced-motion`.
- **D-50:** Token-only styling — no hex colors, no arbitrary px spacing. Sheet `h-[100dvh]` and viewport-dependent values are permitted per ESLint rules.
- **D-51:** File-size rule — Drawer subfolder extraction may be needed if `TrackingPageClient.tsx` nears 400-line limit. Planner decides.
- **D-52:** `'use client'` directive on all new hooks/components touching browser APIs (`localStorage`, `document`, `Audio`).

### Claude's Discretion
- Exact banner icon choice (WifiOff, AlertCircle, or Radio) — planner picks from lucide-react
- Mute-toggle entry animation (scale pulse vs instant) — planner picks based on motion token fit
- Test split between Vitest unit and additional integration coverage — planner decides
- Plan split (single plan vs two — e.g., hook refactor / UI changes) — planner decides
- Telemetry inclusion (D-46) — planner includes or defers based on budget
- Whether to co-locate new tracking components in `src/components/ui/orders/tracking/` subfolder or promote to own directory — current convention wins

### Folded Todos
None — `gsd-tools todo match-phase 112` returned 0 results.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 112 Research Artifacts
- `.planning/phases/112/112-PRECONTEXT-RESEARCH.md` — 12-agent deep research: resolved gray areas, gotcha inventory (20 entries: 5 critical + 9 high + 6 medium), data/scale analysis, cross-phase contract inventory, file map, architectural decisions, animation patterns, design token audit
- `.planning/phases/112/112-ENHANCEMENT-RECOMMENDATIONS.md` — Priority matrix (MUST/SHOULD/NICE), implementation hints with code snippets, R1-R12 with effort+risk tags

### Project Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 112: Order Tracking Overhaul" — phase goal, depends-on (Phase 110), success criteria
- `.planning/REQUIREMENTS.md` §"Critical Fixes" + §"Tracking & Delivery Reliability" — CFIX-10, TRAK-01..04 acceptance criteria
- `.planning/PROJECT.md` §"Current Milestone: v2.3 Customer UX Quality" — milestone goal, mobile-conversion focus

### Phase 110 Foundation (Inherited Contracts — MUST NOT BREAK)
- `.planning/phases/110/110-CONTEXT.md` — D-21..28 query key factory + retry config; D-30 useEffect cleanup discipline; D-31 no-void rule
- `src/lib/providers/query-provider.tsx:22,31-43` — `QUERY_RETRY_ATTEMPTS = 3`, `RETRY_BACKOFF_BASE_MS = 1000`, `RETRY_BACKOFF_MAX_MS = 30000`, `Math.min(1000 * 2 ** i, 30000)` formula. Phase 112 D-09 refactors to import from new shared util.
- `src/lib/queryKeys.ts:12-29` — query key factory; referenced by future tracking polling migration (out of scope for Phase 112)
- `src/types/errors.ts` — `ClientErrorCodes` enum home; may add `TRACKING_RECONNECT_TIMEOUT` if needed (planner decides)

### Phase 111 Patterns (Inherited — MUST NOT BREAK)
- `.planning/phases/111/111-CONTEXT.md` — D-10..14 conditional polling gate pattern (`refetchInterval: enabled ? MS : false`), D-15..21 banner rendering pattern with aria-live
- `src/components/ui/checkout/CheckoutErrorBanner.tsx:91,195-256` — Direction-aware banner render pattern. TRAK-02 banner mirrors `role="status" aria-live="polite"` approach
- `src/lib/hooks/useMenu.ts:42-47` — Direct Zustand selector without `useMemo`, conditional `refetchInterval` gate pattern

### Tracking Domain (Primary Modify Targets)
- `src/lib/hooks/useTrackingSubscription.ts` — 328 LOC, MAJOR refactor target. Current constants: `POLLING_INTERVAL = 30000` (line 29), `RECONNECT_DELAY = 5000` (line 32 — replaced by backoff util). Race protection pattern at lines 177-181, cleanup at lines 290-305. Existing helpers: `useShowLiveTracking` (line 332), `useLastUpdateDisplay` (line 342)
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` — 381 LOC, MAJOR refactor target. Header line 198-210 (Share + RefreshCw buttons), mobile layout line 217 (`lg:grid-cols-2`), audio trigger line 90 (`try/catch` on `audio.play()`)
- `src/types/tracking.ts` — `TrackingData`, `TrackingSubscriptionState`, `DriverLocation` types. Phase 112 may add `MutePreferenceReturn` interface; do not change existing shapes
- `src/components/ui/orders/tracking/NearbyBanner.tsx:40-69,81-86` — **Canonical audio+haptic+spring pattern reference**. Mirror exactly in ReconnectingBanner; do not invent new code
- `src/components/ui/maps/LazyMaps.tsx` — `LazyDeliveryMap` — READ ONLY, do not modify map internals
- `src/lib/hooks/useAnimationPreference.ts:39-85` — `getSpring()` wrapper for `prefers-reduced-motion`

### Drawer Primitive (Critical — do not touch exit animation)
- `src/components/ui/Drawer.tsx:52,257` — Binary snap point support; lines 85-106 exit animation (`duration: 0.15s easeIn` — **MUST NOT BECOME SPRING**, commit 4087d3bf); lines comment explains mobile Safari GPU crash history
- `src/components/ui/Drawer.tsx` body scroll lock + `onExitComplete` + `deferRestore: true` — preserve intact

### Design System
- `docs/frontend-design-system.md` §"Voice" — warmth-not-corporate, conversational possessives ("your driver"), Burmese family-business undertone, brevity-over-completeness
- `src/lib/design-system/tokens/motion.ts` — `overlayMotion.sheetOpen`, `overlayMotion.modalOpen`, `overlayMotion.backdrop`, spring presets (`snappy`, `default`)
- `src/app/globals.css @theme inline` — Phase 112 adds `--color-border-status-warning: var(--color-warning-300);` alias

### Project Conventions & Gotchas
- `CLAUDE.md` §"Gotchas" — `google.maps.*` in useMemo must guard `isLoaded`; `void asyncFn()` Vercel kill; `loading="lazy"` + opacity 0 broken; `useRef` on conditional render breaks observers
- `.claude/learnings/performance.md:18-40` — visibility listener cleanup discipline (avoid listener accumulation + audio on hidden tab)
- `.claude/learnings/mobile-ux.md:8-12,63-76,80-95` — iOS Safari `100vh` vs `100dvh`/`100svh`, two-layer touch-action handling, body scroll lock + AnimatePresence exit crash
- `.claude/learnings/supabase-auth.md` — Supabase Realtime channel cleanup is NOT automatic on unmount; `removeChannel()` must be called explicitly
- `.claude/learnings/animation.md:1-5` — `AnimatePresence` direction refs must be set synchronously before state change

### Accessibility (Phase 113 prep — get it right now to avoid rework)
- `src/lib/hooks/useAnimationPreference.ts` — `getSpring()` honors `prefers-reduced-motion`
- `NearbyBanner.tsx` — existing `aria-live` + audio pattern to mirror
- Touch targets 44px minimum (Phase 113 A11Y-01 prep)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Drawer.tsx`** (`src/components/ui/Drawer.tsx`) — Bottom sheet primitive with binary snap, focus trap, body-scroll lock, backdrop, swipe-to-dismiss, mobile Safari GPU crash protection. TRAK-01 wraps mobile layout in this — zero new bottom-sheet dependencies.
- **`query-provider.tsx` backoff formula** (`src/lib/providers/query-provider.tsx:41-43`) — `Math.min(1000 * 2 ** i, 30000)`. TRAK-04 extracts this to `src/lib/utils/backoff.ts` as shared util; both files import from there after refactor.
- **`NearbyBanner.tsx`** (`src/components/ui/orders/tracking/NearbyBanner.tsx:40-69,81-86`) — Canonical audio + haptic + spring + aria-live pattern. ReconnectingBanner mirrors structure exactly.
- **`CheckoutErrorBanner.tsx`** (`src/components/ui/checkout/CheckoutErrorBanner.tsx:91,192-256,378-433`) — Direction-aware banner with `role="status"`, token-only colors, `ErrorShake` + `spring.default`. TRAK-02 banner borrows the shell pattern.
- **`useAnimationPreference`** (`src/lib/hooks/useAnimationPreference.ts`) — `getSpring()` wraps motion tokens for reduced-motion honor. All Phase 112 new motion uses this.
- **`useBodyScrollLock`** — Already used inside Drawer.tsx with `deferRestore: true`. TRAK-01 inherits this for free.
- **`useSafeInterval`** — Battery-aware interval (already used in `ETACountdown`). Available for TRAK-03 polling restart on visible.
- **`triggerHaptic("light")`** — Existing util; mute toggle uses on click.
- **`lucide-react`** — `Volume2`, `VolumeX`, and banner icon candidates (`WifiOff`, `RefreshCw`, `AlertCircle`) already installed.
- **`useSoundPreference`** — Precedent for global localStorage audio preference; `useMutePreference` mirrors pattern.
- **`ClientErrorCodes` enum** (`src/types/errors.ts`) — Phase 110 D-33 precedent for type-safe error code registry. Planner may add `TRACKING_RECONNECT_TIMEOUT`.

### Established Patterns
- **Exponential backoff constant naming** — `RETRY_BACKOFF_BASE_MS`, `RETRY_BACKOFF_MAX_MS`, `QUERY_RETRY_ATTEMPTS` from `query-provider.tsx`. New `backoff.ts` util exports `RECONNECT_BASE_MS`, `RECONNECT_MAX_MS` for cross-file reuse.
- **Race protection on reconnect** — clear pending reconnect timeout BEFORE re-subscribing to avoid accumulation during flip-flop states (`useTrackingSubscription.ts:177-181`). TRAK-03 visibility handler extends this.
- **Channel cleanup pairs** — `supabase.removeChannel()` for BOTH `channelRef` and `locationChannelRef`. Single cleanup misses location channel and desyncs state.
- **SSR-safe localStorage hydration** — `useState(serverValue)` default, `useEffect` reads localStorage post-mount, `isHydrated` flag gates any SSR-sensitive render. Precedent: `useAnimationPreference.ts:62-67`.
- **`aria-live="polite"` for status banners** — non-interrupting screen reader announcement. Used in `CheckoutErrorBanner.tsx` and `NearbyBanner.tsx`.
- **`aria-pressed` for toggles** — not just visual state, semantic toggle state for screen readers. Precedent: `useAnimationPreference` toggle buttons.
- **Token-only ESLint enforcement** — no hex colors, no arbitrary px-spacing. Viewport-dependent values (`100dvh`, `100svh`) permitted per existing Drawer precedent.
- **Spring motion via `getSpring()`** — never raw spring token; always wrap for reduced-motion.
- **Co-location of feature components** — `src/components/ui/orders/tracking/` holds tracking-specific components (NearbyBanner, future ReconnectingBanner, MuteToggle). Barrel re-exports in `index.ts`.

### Integration Points
- `src/lib/hooks/useTrackingSubscription.ts` — Major refactor: backoff util, visibility listener + useEffectEvent, `removeChannel` BOTH, mute state accepted as arg or consumed from `useMutePreference` inside hook, cleanup discipline verified
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` — Major refactor: wrap mobile layout in `<Drawer>` (inside `lg:hidden`), mount `<ReconnectingBanner>` below header, mount `<MuteToggle>` in header between Share and Refresh, gate audio at status-transition useEffect with `isMuted` + `document.hidden`
- `src/lib/providers/query-provider.tsx` — Minor refactor: import `computeBackoffMs` / constants from `src/lib/utils/backoff.ts` (replace inline math)
- `src/lib/utils/backoff.ts` — **NEW** shared util (~20 LOC)
- `src/lib/utils/__tests__/backoff.test.ts` — **NEW** unit tests (~40 LOC)
- `src/lib/hooks/useMutePreference.ts` — **NEW** localStorage-backed hook (~40 LOC)
- `src/lib/hooks/__tests__/useMutePreference.test.ts` — **NEW** hook tests (~80 LOC)
- `src/lib/hooks/__tests__/useTrackingSubscription.test.ts` — Extended tests (backoff curve, visibility, channel cleanup, audio gate)
- `src/components/ui/orders/tracking/ReconnectingBanner.tsx` — **NEW** banner (~80 LOC)
- `src/components/ui/orders/tracking/MuteToggle.tsx` — **NEW** button (~50 LOC)
- `src/components/ui/orders/tracking/index.ts` — Barrel re-export new components
- `src/app/globals.css` — Add `--color-border-status-warning` alias in `@theme inline` block
- `src/types/tracking.ts` — Optional: add `MutePreferenceReturn` interface (minor)

### Gotcha Inventory (20 items — critical subset)
- **C-1 (CRITICAL):** Drawer exit MUST stay `duration: 0.15s easeIn` — never spring. Mobile Safari GPU crash, commit 4087d3bf
- **C-2 (CRITICAL):** `document.visibilitychange` listener cleanup required in `useEffect` return; otherwise listeners accumulate on remount and audio fires on hidden tab
- **C-3 (CRITICAL):** Realtime channel accumulation — `removeChannel()` must be called for BOTH channels; Supabase does not auto-unsubscribe on unmount
- **C-4 (CRITICAL):** Audio autoplay policy — `audio.play()` requires user gesture; wrap in `try/catch` (already done at line 90); handle promise rejection silently
- **C-5 (CRITICAL):** localStorage SSR safety — read in `useEffect`, not render; use `isHydrated` flag
- **H-1 (HIGH):** iOS Safari `100vh` excludes safe area; use `100dvh` or `100svh` + `pb-safe`
- **H-2 (HIGH):** Two-layer touch-action — Drawer.tsx already handles with ResizeObserver; reuse
- **H-3 (HIGH):** Channel subscription race on visibility flip-flop — extend existing race protection to visibility handler
- **H-4 (HIGH):** Reconnecting banner flicker — 2s debounce eliminates (D-18)
- **H-5 (HIGH):** Body scroll lock + AnimatePresence exit — Drawer.tsx already uses `deferRestore: true` + `onExitComplete`; preserve
- **H-6 (HIGH):** Map gesture conflict with sheet drag — 44px drag handle, `touch-action: pan-x pan-y` only inside sheet bounds
- **H-7 (HIGH):** `useEffect` deps for visibility listener — use `useEffectEvent` (D-14) to avoid stale closure
- **H-8 (HIGH):** Mute icon `aria-pressed` (D-32) — not just visual swap
- **H-9 (HIGH):** `google.maps.*` in `useMemo` runs before API loads — Phase 112 doesn't touch map internals; verify
- **M-1 (MEDIUM):** `NearbyBanner.tsx` is canonical audio pattern — mirror exactly
- **M-4 (MEDIUM):** `AnimatePresence` direction refs synchronous — set ref before state change if used
- **M-6 (MEDIUM):** Reduced motion gap in `StatusStepper` — out of scope for Phase 112; flag for Phase 113

**Full 20-item inventory with file:line evidence:** `.planning/phases/112/112-PRECONTEXT-RESEARCH.md` §5

</code_context>

<specifics>
## Specific Ideas

- **Calm voice over alarming voice** — "Reconnecting..." not "Connection lost"; "We're updating your driver's location" not "WebSocket disconnected". Burmese family-business warmth from `docs/frontend-design-system.md`.
- **Binary snap points** — peek shows driver name/ETA/status, expanded (95vh) shows everything. Users can still see the map with the sheet collapsed.
- **Mute persists across orders** — once a user mutes, they stay muted for all future tracking sessions. localStorage key `trackingAudioMuted`. No surprise sounds during calls.
- **2-second banner debounce** — don't flash the banner on 200ms network blips. Shows after 2s if still disconnected. Same 2s heuristic Phase 110 uses for fallback error escalation.
- **Visibility pause is aggressive** — remove BOTH channels, stop polling, clear reconnect timer. Nothing runs in the background. Fast reconnect on visible via `fetchTrackingData()` + `setupSubscriptions()`.
- **Exponential backoff, infinite attempts** — delivery window is 30-90 min; tracking must keep trying while the user has the page open. Reset counter on successful `SUBSCRIBED`.
- **Drawer exit stays instant** — `duration: 0.15s easeIn`. NEVER spring. Mobile Safari GPU crashes are a known regression (commit 4087d3bf). Phase 112 wraps Drawer, never reconfigures it.
- **Shared backoff util** — single source of truth for reconnect curve, imported by Phase 110 `query-provider.tsx` AND new tracking hook. Unit-testable in isolation.
- **Test-before-refactor** — `useTrackingSubscription.ts` has zero direct tests today. Add baseline coverage BEFORE touching the state machine to catch regressions.
- **Mobile-only sheet** — desktop 50/50 split stays exactly as-is. Zero regression risk on `lg:` breakpoint.
- **`useEffectEvent` for visibility handler** — React 19 native solution for stale-closure on `setupSubscriptions`. Avoids effect re-run on every dep change.
- **No dismiss button on banner** — auto-dismisses on reconnect. Calm, non-intrusive.
- **Header mute placement** — adjacent to Share and Refresh (other connection-related controls). Discoverable without clutter.
- **Burmese copy needs review** — all new strings marked with `// BURMESE-REVIEW` comment for native-speaker verification before ship.

</specifics>

<deferred>
## Deferred Ideas

- **Push notifications for delivery updates** — Phase v2.4 NOTF-01 (service worker scope, not client polling)
- **Offline tracking / service worker cache** — Phase 114 (LOAD) owns offline patterns
- **3-tier snap points (peek/half/full)** — YAGNI for tracking; Drawer.tsx is binary-only
- **`vaul` bottom sheet library** — Drawer.tsx covers it, bundle bloat not justified
- **Tracking page skeleton redesign** — Phase 114 (LOAD) owns skeleton work; new sheet shape may need skeleton refresh
- **Sticky reorder button patterns** — Phase 116 (UXPL-05) can borrow Phase 112 mute-toggle sticky approach
- **`StatusStepper` reduced-motion gap** — Pre-existing issue, Phase 113 (A11Y) scope
- **Tracking polling migration to React Query** — Phase 115 (DATA) owns React Query consolidation; Phase 112 keeps raw `fetch` in `fetchTrackingData()`
- **Telemetry dashboards for reconnect metrics** — Phase 95 observability owns; Phase 112 may add Sentry breadcrumbs (D-46) but no new dashboards
- **Burmese native-speaker review** — coordinate with project owner, not in code scope
- **ClientErrorCodes `TRACKING_RECONNECT_TIMEOUT` addition** — planner decides if worth adding; not strictly required
- **Map gesture customization** — Phase 112 does not modify map internals; map gestures stay default Google Maps

### Reviewed Todos (not folded)
None — `gsd-tools todo match-phase 112` returned 0 results.

</deferred>

---

*Phase: 112-order-tracking-overhaul*
*Context gathered: 2026-04-08*
