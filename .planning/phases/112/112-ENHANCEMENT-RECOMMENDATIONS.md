# Phase 112 Enhancement Recommendations

**Phase**: 112 — Order Tracking Overhaul
**Generated**: 2026-04-08
**Source**: 12-agent deep research protocol (Wave 1 + Wave 2)
**Companion**: `112-PRECONTEXT-RESEARCH.md`

---

## Priority Matrix

| #   | Recommendation                              | Priority    | Effort | Risk if skipped                                       |
| --- | ------------------------------------------- | ----------- | ------ | ----------------------------------------------------- |
| R1  | Reuse Drawer.tsx (NOT vaul)                 | MUST-HAVE   | S      | Mobile Safari GPU compositor crashes (commit 4087d3bf)|
| R2  | Extract `backoff.ts` utility                | MUST-HAVE   | S      | Duplicate logic; Phase 110 backoff drift              |
| R3  | Visibility pause: removeChannel + stopPoll  | MUST-HAVE   | S      | Wakelock battery drain; channel state desync          |
| R4  | localStorage mute with SSR-safe hydration   | MUST-HAVE   | M      | Hydration mismatch warnings; lost preference          |
| R5  | 2-second debounce on Reconnecting banner    | MUST-HAVE   | S      | Banner flash on transient blips (UX noise)            |
| R6  | Mobile-only sheet (desktop unchanged)       | MUST-HAVE   | S      | Desktop regression on `lg:` breakpoint                |
| R7  | Add `useTrackingSubscription` test coverage | SHOULD-HAVE | M      | Untested core hook — regression-prone refactor        |
| R8  | Add `border-status-warning` token alias     | SHOULD-HAVE | XS     | Manual hex; token system bypassed                     |
| R9  | useEffectEvent for visibility handler       | SHOULD-HAVE | S      | Stale closure on `pollOnce` ref                       |
| R10 | aria-live="polite" on Reconnecting banner   | SHOULD-HAVE | XS     | Screen readers miss connection state                  |
| R11 | `prefers-reduced-motion` for sheet/banner   | NICE-TO-HAVE| S      | A11Y miss for vestibular-disorder users               |
| R12 | Telemetry: reconnect attempts + visibility  | NICE-TO-HAVE| M      | Blind to backoff effectiveness in production          |

---

## MUST-HAVE Recommendations

### R1. Reuse Drawer.tsx — Do NOT pull in `vaul`

**What**: Use the existing `src/components/ui/Drawer.tsx` component for the mobile bottom sheet. Do not add `vaul` or any new bottom-sheet dependency.

**Why**: Drawer.tsx already implements every needed feature (focus trap, body-scroll lock with deferred restore, backdrop, ESC + outside-click close, swipe-to-close, snap points). Critically, commit `4087d3bf` fixed mobile Safari GPU compositor crashes by switching the *exit* transition from spring physics to `duration: 0.15s easeIn`. Adding vaul reintroduces that risk and bloats the bundle by ~12KB gzipped for zero benefit.

**Design compliance**:
- **Animation tokens**: Drawer uses `springs.snappy` for open and explicit `easeIn 0.15s` for exit (Phase 110 motion contract).
- **Z-index**: Drawer's backdrop `z-overlay` and content `z-modal` are already correct (no manual values).
- **Surface**: `bg-surface-elevated` matches design system; rounded-top corners use `rounded-t-2xl`.

**Implementation hint**:
```tsx
// TrackingPageClient.tsx
<div className="lg:hidden">
  <Drawer
    open={true}                    // always-open variant; no close button
    onClose={() => {}}             // no-op (always visible)
    snapPoints={['minimized', 'expanded']}
    defaultSnap="minimized"
    showHandle
    dismissible={false}
  >
    <TrackingInfoSheet order={order} location={location} />
  </Drawer>
</div>
```
Drawer.tsx may need a small `dismissible` prop addition if it doesn't already support always-open mode — verify before extending.

---

### R2. Extract `src/lib/utils/backoff.ts` shared utility

**What**: Extract exponential backoff into `src/lib/utils/backoff.ts` exporting `computeBackoffMs(attempt: number, base = 1000, max = 30000)`. Use it in both `query-provider.tsx` (Phase 110) and `useTrackingSubscription.ts` (Phase 112).

**Why**: Phase 110 already implements the exact same `Math.min(base * 2 ** attempt, max)` formula in `src/lib/providers/query-provider.tsx:41-43`. Duplicating it in TRAK-04 creates two sources of truth and risks drift. A shared utility also makes the formula unit-testable in isolation.

**Design compliance**:
- **DATA-02 alignment**: Phase 110 mandates centralized infrastructure (query key factory pattern). A shared backoff utility extends that principle.
- **Test coverage**: Pure function, fully testable with Vitest.

**Implementation hint**:
```typescript
// src/lib/utils/backoff.ts
export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30000;

export function computeBackoffMs(
  attempt: number,
  base = RECONNECT_BASE_MS,
  max = RECONNECT_MAX_MS,
): number {
  return Math.min(base * 2 ** attempt, max);
}
```
Then in query-provider.tsx, replace inline math with `computeBackoffMs(attemptIndex)`. In useTrackingSubscription.ts, use it for the reconnect timer.

---

### R3. Visibility pause: `removeChannel` BOTH channels + stopPolling

**What**: When `document.visibilitychange` fires `hidden`, call `supabase.removeChannel()` on **both** `channelRef.current` AND `locationChannelRef.current`, then `clearInterval(pollIntervalRef.current)`. On `visible`, restart by calling the existing subscription setup function.

**Why**: `useTrackingSubscription.ts` maintains TWO channels (one for `tracking_events`, one for `delivery_locations`). Pausing only the polling interval still leaves WebSocket connections open, draining battery and consuming Supabase Realtime quotas. Removing only one channel desyncs internal state. Phase 110 retry config already handles transient errors — don't reinvent it.

**Design compliance**:
- **TRAK-03 explicit**: "Tracking polling stops when page is hidden" — but the spirit covers all subscriptions, not just polling.
- **Resource hygiene**: Aligns with the cleanup pattern at lines 290-305 of the existing hook.

**Implementation hint**:
```typescript
const handleVisibility = useCallback(() => {
  if (document.hidden) {
    // Pause: remove channels + stop polling
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (locationChannelRef.current) {
      supabase.removeChannel(locationChannelRef.current);
      locationChannelRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPaused(true);
  } else {
    // Resume: re-subscribe + restart polling
    setupSubscriptions();  // existing setup function
    setIsPaused(false);
  }
}, [setupSubscriptions]);

useEffect(() => {
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, [handleVisibility]);
```

---

### R4. localStorage mute with SSR-safe hydration

**What**: Persist mute preference in `localStorage` under key `trackingAudioMuted` (boolean). Read it in `useEffect` (NOT initial render) to avoid SSR hydration mismatch. Default to unmuted on first visit.

**Why**: CFIX-10 requires a "visible mute toggle" but the requirement implies persistence — users muting once during a call shouldn't have to mute again on every page load. localStorage is the lightweight solution; Zustand-persist or DB columns are overkill for one boolean. The SSR safety pattern is critical: initial render must match server output (always `false`), then sync from localStorage post-mount.

**Design compliance**:
- **Next.js 16 SSR**: App Router renders on server first; reading localStorage during render causes hydration mismatch errors and console warnings.
- **CFIX-10 spec**: "no interruption on calls" — persistence makes the toggle meaningful across sessions.

**Implementation hint**:
```typescript
// useTrackingMute.ts
'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'trackingAudioMuted';

export function useTrackingMute() {
  const [isMuted, setIsMuted] = useState(false); // SSR-safe default

  useEffect(() => {
    // Hydrate from localStorage post-mount only
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setIsMuted(true);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { isMuted, toggleMute };
}
```
In TrackingPageClient.tsx, gate the audio playback: `if (!isMuted) void audio.play().catch(...);`

---

### R5. 2-second debounce on Reconnecting banner

**What**: Don't show the "Reconnecting..." banner immediately on `CHANNEL_ERROR`. Set a 2-second timer; only show the banner if the channel still hasn't recovered after 2s. Cancel the timer on successful re-`SUBSCRIBED`.

**Why**: Supabase Realtime channels briefly flicker on network blips, page focus changes, and during background tab waking. Showing a banner for every 200ms blip is UX noise. A 2-second debounce eliminates 90%+ of false alarms while still surfacing real disconnections quickly. (2s is the same threshold Phase 110 uses for fallback error UI escalation.)

**Design compliance**:
- **TRAK-02 spirit**: "shows banner when connection drops" — the user only perceives a drop after meaningful delay.
- **Animation tokens**: Banner enter/exit should use `springs.snappy` (existing `NearbyBanner.tsx` pattern at lines 81-86).

**Implementation hint**:
```typescript
const [showReconnectBanner, setShowReconnectBanner] = useState(false);
const banner DebounceRef = useRef<NodeJS.Timeout | null>(null);

// In channel.subscribe callback:
if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
  bannerDebounceRef.current = setTimeout(() => {
    setShowReconnectBanner(true);
  }, 2000);
}
if (status === 'SUBSCRIBED') {
  if (bannerDebounceRef.current) {
    clearTimeout(bannerDebounceRef.current);
    bannerDebounceRef.current = null;
  }
  setShowReconnectBanner(false);
}
```

---

### R6. Mobile-only sheet — desktop layout untouched

**What**: Render the new bottom sheet ONLY at `< lg` breakpoint (768px and below). Keep the existing `lg:grid-cols-2` 50/50 desktop split layout exactly as-is in `TrackingPageClient.tsx:217`.

**Why**: TRAK-01 explicitly says "on mobile". Desktop has plenty of horizontal space; the 50/50 split works fine there. Refactoring desktop adds risk of regression and isn't in scope. Use Tailwind's responsive utilities (`lg:hidden` / `hidden lg:grid`) to fork layouts cleanly.

**Design compliance**:
- **TRAK-01 spec**: "on mobile — not 50/50 split" (mobile-specific)
- **Scope discipline**: v2.3 is mobile-conversion focused; desktop is not regressing.

**Implementation hint**:
```tsx
{/* Mobile: full-height map + bottom sheet */}
<div className="lg:hidden h-screen relative">
  <div className="absolute inset-0">
    <TrackingMap location={location} />
  </div>
  <Drawer ...>
    <TrackingInfoSheet ... />
  </Drawer>
</div>

{/* Desktop: existing 50/50 split (unchanged) */}
<div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
  {/* existing layout */}
</div>
```

---

## SHOULD-HAVE Recommendations

### R7. Add `useTrackingSubscription` test coverage before refactor

**What**: Write Vitest tests for `useTrackingSubscription.ts` BEFORE editing it. Mock Supabase channel lifecycle (`SUBSCRIBED`, `CLOSED`, `CHANNEL_ERROR`), test polling pause/resume, test reconnect backoff sequence. Use existing patterns from `src/lib/hooks/__tests__/`.

**Why**: The hook is 328 lines of complex async logic with two channels, race protection, and a state machine. It currently has ZERO direct tests (only helper functions are tested). Refactoring it for TRAK-02/03/04 without tests is regression-prone. Add tests first as a safety net.

**Design compliance**:
- **Frustrations directive**: "Never skip verification steps... do not trade correctness for speed."
- **Phase 110 precedent**: query-provider.tsx ships with full test coverage.

**Implementation hint**:
- Mock `@supabase/supabase-js` `channel().on().subscribe()` chain.
- Use `vi.useFakeTimers()` for backoff timer assertions.
- Test cleanup runs on unmount (no leaked channels/intervals).

---

### R8. Add `border-status-warning` token alias

**What**: Add a single line to `src/app/globals.css` `@theme inline` block: `--color-border-status-warning: var(--color-warning-300);` (or whatever maps to the existing warning border). Use the alias in the Reconnecting banner.

**Why**: Token audit (Wave 2 Agent 10) found that `border-status-warning` doesn't exist as an alias, while `bg-status-warning-soft` and `text-status-warning` already do. Without the alias, you'd be forced to use `border-warning-300` (a primitive) or a hex value — both bypass the design system.

**Design compliance**:
- **62+ design tokens enforced via ESLint**: keeps lint clean.
- **Phase 113 prep**: Phase 113 (A11Y & Design System) will harmonize tokens — adding this now prevents tech debt.

**Implementation hint**:
```css
/* src/app/globals.css inside @theme inline */
--color-border-status-warning: var(--color-warning-300);
```
Then `border-status-warning` becomes available as a Tailwind utility.

---

### R9. Use `useEffectEvent` for visibility handler

**What**: Wrap the visibility change handler in React 19's `useEffectEvent` (or equivalent ref pattern) so the latest version of `setupSubscriptions` is always invoked without re-running the effect.

**Why**: The visibility handler closes over `setupSubscriptions`, which itself depends on hook state/props. Without `useEffectEvent`, the effect re-runs on every dependency change, repeatedly adding/removing the visibility listener. With it, the listener registers once and always calls the freshest setup function.

**Design compliance**:
- **React 19 patterns**: `useEffectEvent` is the canonical solution for this stale-closure issue.
- **React Compiler safe**: works correctly with auto-memoization.

**Implementation hint**:
```typescript
import { useEffectEvent } from 'react'; // React 19+

const onVisibilityChange = useEffectEvent(() => {
  if (document.hidden) pauseSubscriptions();
  else resumeSubscriptions();
});

useEffect(() => {
  document.addEventListener('visibilitychange', onVisibilityChange);
  return () => document.removeEventListener('visibilitychange', onVisibilityChange);
}, []); // Empty deps OK with useEffectEvent
```

---

### R10. `aria-live="polite"` on Reconnecting banner

**What**: Add `role="status" aria-live="polite"` to the Reconnecting banner element so screen readers announce connection state changes without interrupting other speech.

**Why**: Connection state is critical accessibility info — blind/low-vision users need to know their tracking is offline. `polite` is correct here (not `assertive`) because it's not an emergency.

**Design compliance**:
- **A11Y precedent**: Existing `NearbyBanner.tsx` uses similar live-region pattern.
- **Phase 113 prep**: Phase 113 covers WCAG compliance — getting this right now avoids rework.

**Implementation hint**:
```tsx
<motion.div
  role="status"
  aria-live="polite"
  className="fixed top-14 left-0 right-0 z-25 ..."
>
  Reconnecting...
</motion.div>
```

---

## NICE-TO-HAVE Recommendations

### R11. Honor `prefers-reduced-motion`

**What**: Wrap sheet open/close and Reconnecting banner animations in a `useReducedMotion()` check (Framer Motion hook). When reduced motion is preferred, use instant transitions instead of springs.

**Why**: Vestibular disorders make spring physics nauseating. Phase 113 (A11Y) will enforce this project-wide; doing it for new components in 112 prevents accumulating debt. Drawer.tsx may already handle this — verify.

**Design compliance**:
- **WCAG 2.3.3** (Animation from Interactions, Level AAA)
- **Framer Motion built-in**: minimal effort.

**Implementation hint**:
```tsx
import { useReducedMotion } from 'framer-motion';
const reduceMotion = useReducedMotion();
const transition = reduceMotion ? { duration: 0 } : springs.snappy;
```

---

### R12. Telemetry: reconnect attempts + visibility pauses

**What**: Add Sentry breadcrumbs (NOT events) on: each reconnect attempt with backoff delay, visibility pause/resume cycles, banner show/hide events. Use `Sentry.addBreadcrumb({ category: 'tracking', message: '...' })`.

**Why**: Without telemetry, you'll be blind to whether the backoff strategy actually works in production. Breadcrumbs (not events) are zero-cost in normal operation — they only attach to error reports if something else goes wrong.

**Design compliance**:
- **Existing Sentry integration**: project already uses Sentry for error tracking.
- **Phase 95 precedent**: Observability phase established breadcrumb patterns.

**Implementation hint**:
```typescript
import * as Sentry from '@sentry/nextjs';

// On reconnect:
Sentry.addBreadcrumb({
  category: 'tracking.reconnect',
  message: `Attempt ${attempt}, delay ${delayMs}ms`,
  level: 'info',
});

// On visibility pause:
Sentry.addBreadcrumb({
  category: 'tracking.visibility',
  message: 'Paused (tab hidden)',
  level: 'info',
});
```

---

## Recommendations NOT Included (and why)

| Idea                                      | Why excluded                                                       |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Pull in `vaul` for bottom sheet           | Drawer.tsx already covers it; bundle bloat (R1)                    |
| Service Worker for offline tracking      | Out of scope — Phase 114 covers offline                            |
| 3-tier snap points (peek/half/full)       | Drawer.tsx is binary; YAGNI for tracking use case                  |
| Real-time push notifications              | NOTF-01 deferred to v2.4                                           |
| Map gesture handler refactor              | Not in TRAK requirements; risk-to-value too high                   |
| Migrate from `Math.min(2**i)` to library  | Native math is 5 lines; libraries like `p-retry` add 8KB           |
| WebSocket heartbeat ping                  | Supabase Realtime handles internally; not project's responsibility |

---

## Cross-Reference

- Detailed gotchas, gray-area resolutions, and architectural decisions: `112-PRECONTEXT-RESEARCH.md`
- Phase 110 backoff source: `src/lib/providers/query-provider.tsx:41-43`
- Drawer GPU fix commit: `4087d3bf` (mobile Safari exit transition)
- Audio pattern reference: `src/components/ui/orders/tracking/NearbyBanner.tsx:40-50`

---

_Generated by deep-phase-assumptions skill (12-agent protocol), 2026-04-08._
