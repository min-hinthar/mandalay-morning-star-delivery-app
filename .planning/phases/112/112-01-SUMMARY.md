---
phase: 112
plan: 01
subsystem: customer-tracking
tags: [hooks, realtime, backoff, visibility, tdd, testing]
requires: []
provides:
  - "src/lib/utils/backoff.ts — getBackoffDelay + RECONNECT_BASE_MS + RECONNECT_MAX_MS"
  - "Shared exponential backoff curve [1000, 2000, 4000, 8000, 16000, 30000ms cap] usable by React Query + Realtime"
  - "useTrackingSubscription.isConnected state reflects current Realtime health (for Plan 02 ReconnectingBanner)"
  - "useTrackingSubscription pauses Realtime + polling when tab is hidden, resumes on visible"
affects:
  - "src/lib/providers/query-provider.tsx — queryRetryDelay now delegates to shared util (zero behavior change)"
  - "src/lib/hooks/useTrackingSubscription.ts — reconnect state machine rewritten"
tech-stack:
  added: []
  patterns:
    - "Mutable ref + stable listener pattern for visibilitychange (avoids React 19 useEffectEvent)"
    - "Ref-based attempt counter (avoids re-render storms during reconnect loops)"
    - "Shared backoff util across React Query retry + Supabase Realtime reconnect"
key-files:
  created:
    - "src/lib/utils/backoff.ts (22 LOC)"
    - "src/lib/utils/__tests__/backoff.test.ts (52 LOC, 15 tests)"
  modified:
    - "src/lib/providers/query-provider.tsx (import shared util, drop inline constants)"
    - "src/lib/hooks/useTrackingSubscription.ts (reconnect state machine + visibility pause, duplicate routeId effect removed)"
    - "src/lib/hooks/__tests__/useTrackingSubscription.test.ts (+16 lifecycle tests A-P + shared mocks)"
decisions:
  - "Chose stable ref-callback pattern over React 19 useEffectEvent (grep shows zero existing usage)"
  - "Removed duplicate routeId useEffect — main effect's setupLocationSubscription dep covers routeId changes via useCallback identity"
  - "Connection error copy changed from 'Connection lost. Retrying...' to 'Reconnecting...' (D-20 calm tone; banner UX owned by Plan 02)"
  - "Named exports getBackoffDelay + RECONNECT_BASE_MS + RECONNECT_MAX_MS (query-provider re-imports constants for readability)"
  - "Test F value changed from 5000ms to 1000ms in same PR as hook refactor (RED→GREEN within Task 3)"
metrics:
  duration: "~30 min"
  tasks: 3
  files_created: 2
  files_modified: 3
  tests_added: 22
  tests_passing: 984
  commits: 3
  completed: "2026-04-10"
---

# Phase 112 Plan 01: Tracking Hook Refactor Summary

Extracted exponential backoff to a shared util, added baseline test coverage for `useTrackingSubscription`, then rewired the hook's reconnect loop to use exponential backoff and pause Realtime + polling when the tab is hidden. Zero UI changes — pure plumbing for Plan 02.

## What Shipped

| Area | Change |
|------|--------|
| New util | `src/lib/utils/backoff.ts` exporting `getBackoffDelay`, `RECONNECT_BASE_MS`, `RECONNECT_MAX_MS` |
| Query provider | `queryRetryDelay` now delegates to `getBackoffDelay` (zero behavior change) |
| Tracking hook | Reconnect uses exponential backoff [1s → 2s → 4s → 8s → 16s → 30s cap] |
| Tracking hook | Visibility pause: hidden → remove BOTH channels + stop polling + clear reconnect |
| Tracking hook | Visibility resume: immediate fetch + re-subscribe BOTH channels |
| Tracking hook | Attempt counter resets to 0 on `SUBSCRIBED` |
| Tracking hook | Duplicate routeId useEffect removed (main effect covers routeId via `setupLocationSubscription` dep) |
| Tests | 16 new subscription lifecycle tests (A-P) covering state machine, backoff curve, visibility, race guards |

## Files Touched

| File | Change | LOC |
|------|--------|-----|
| `src/lib/utils/backoff.ts` | **CREATE** | 22 |
| `src/lib/utils/__tests__/backoff.test.ts` | **CREATE** | 52 |
| `src/lib/providers/query-provider.tsx` | MODIFY (import shared util) | -3 / +9 |
| `src/lib/hooks/useTrackingSubscription.ts` | MODIFY (state machine rewrite) | -39 / +60 |
| `src/lib/hooks/__tests__/useTrackingSubscription.test.ts` | MODIFY (+16 tests + shared mocks) | -4 / +262 |

## Tasks & Commits

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Extract backoff util + refactor query-provider + 15 unit tests | `fd034c51` | PASS |
| 2 | Baseline subscription lifecycle tests (9 tests A-I) | `f212a9c9` | PASS |
| 3 | Exponential backoff + visibility pause + 7 tests (J-P) | `c92a27be` | PASS |

## Test Coverage

**Backoff util (`backoff.test.ts`)** — 15 tests:
- Default curve: attempts 0..100, confirming `[1000, 2000, 4000, 8000, 16000, 30000, 30000, ...]`
- Custom base/max overrides
- Exported constants

**Tracking subscription (`useTrackingSubscription.test.ts`)** — 33 tests total:
- 9 helper tests (existing `useShowLiveTracking`, `useLastUpdateDisplay`)
- 8 state-shape tests (existing type validation, polling interval)
- 16 new lifecycle tests:
  - **A**: mount creates tracking channel (order + stop handlers)
  - **B**: mount creates location channel when routeId present
  - **C**: disabled hook creates no channels
  - **D**: SUBSCRIBED → isConnected=true + clears error
  - **E**: CLOSED → isConnected=false + sets error + polling
  - **F**: CHANNEL_ERROR schedules reconnect (1000ms post-refactor)
  - **G**: unmount removes BOTH channels
  - **H**: refresh() fetches `/api/tracking/:orderId`
  - **I**: mount triggers initial fetch
  - **J**: successive CHANNEL_ERRORs follow `[1000, 2000, 4000]` backoff
  - **K**: 7 errors progress through curve and cap at 30s
  - **L**: SUBSCRIBED resets attempt counter (next error waits 1000ms, not 2000)
  - **M**: visibilitychange→hidden removes channels, stops polling, clears reconnect
  - **N**: visibilitychange→visible re-subscribes + immediate refetch
  - **O**: unmount removes `visibilitychange` listener (leak guard)
  - **P**: rapid hidden→visible flip-flop no channel accumulation

**Full suite verification**: 984 tests passing across 63 files after refactor. No regression elsewhere.

## Verification Suite

```
pnpm lint           → CLEAN
pnpm lint:css       → CLEAN
pnpm format:check   → CLEAN (after prettier --write on new test file)
pnpm typecheck      → CLEAN
pnpm test           → 984 PASS / 0 FAIL / 63 files
pnpm build          → COMPILED SUCCESSFULLY (26.7s) + prerender OK
```

## Deviations from Plan

**None for Rules 1-3.**

One intentional departure from the plan's literal text: the plan said to keep the secondary `routeId` useEffect untouched and add `setupLocationSubscription` to the main effect's deps. Following that literally caused Test P's `initialLocationCount` assertion to fail (2 location channels created on mount instead of 1). Fix: removed the now-redundant secondary effect — the main effect's `setupLocationSubscription` dep already triggers re-runs when routeId changes via the `useCallback` identity cascade. Documented in Key Decisions above.

No architectural changes, no auth gates, no blockers encountered.

## Hand-off to Plan 02

- `useTrackingSubscription` return shape is **unchanged** — `isConnected`, `connectionError`, etc. all backward compatible.
- Plan 02's `ReconnectingBanner` can consume `subscription.isConnected` directly from `TrackingPageClient` via prop drill.
- Connection error copy simplified to `"Reconnecting..."` — Plan 02's banner component owns the full user-facing UX copy, so the hook only exposes a truthy signal.
- Plan 02 can mock `useTrackingSubscription` at the hook level — tests in this plan prove the mocking strategy works.
- `getBackoffDelay` is available at `@/lib/utils/backoff` if Plan 02 or future hooks need the curve.

## Locked Assumptions Carried Forward

1. **Ref-callback pattern for visibility** (not `useEffectEvent`). If Phase 113+ introduces `useEffectEvent` elsewhere, migration is a follow-up.
2. **Sentry breadcrumbs deferred** (D-46 NICE-TO-HAVE). Can be added in Phase 113 or post-incident.
3. **Location channel has no status callback** on `.subscribe()` — backoff + visibility applies via `removeChannel` + re-setup, not per-channel state machine.
4. **Named exports** `getBackoffDelay`, `RECONNECT_BASE_MS`, `RECONNECT_MAX_MS` — query-provider re-imports constants for readability rather than inlining numeric literals.

## Known Stubs

None. All wiring is end-to-end with test coverage for state transitions.

## Self-Check: PASSED

- [x] `src/lib/utils/backoff.ts` exists (verified via git log)
- [x] `src/lib/utils/__tests__/backoff.test.ts` exists (15 tests pass)
- [x] `src/lib/providers/query-provider.tsx` imports from `@/lib/utils/backoff`
- [x] `src/lib/hooks/useTrackingSubscription.ts` no longer contains `RECONNECT_DELAY` constant
- [x] `src/lib/hooks/useTrackingSubscription.ts` imports `getBackoffDelay`
- [x] `attemptRef` + `visibilityHandlerRef` present in hook
- [x] `visibilitychange` listener registered + removed
- [x] All 33 subscription-related tests pass (16 lifecycle + 17 helper/state tests)
- [x] Full unit suite 984 passing / 0 failing
- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm format:check` clean
- [x] `pnpm build` compiled successfully
- [x] 3 commits landed on worktree-agent-ad24593d: `fd034c51`, `f212a9c9`, `c92a27be`
- [x] REQ-ID coverage: TRAK-03 (visibility pause), TRAK-04 (exponential backoff)
