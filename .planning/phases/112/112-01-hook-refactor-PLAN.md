---
phase: 112
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/utils/backoff.ts
  - src/lib/utils/__tests__/backoff.test.ts
  - src/lib/providers/query-provider.tsx
  - src/lib/hooks/useTrackingSubscription.ts
  - src/lib/hooks/__tests__/useTrackingSubscription.test.ts
autonomous: true
requirements:
  - TRAK-03
  - TRAK-04
user_setup: []
must_haves:
  truths:
    - "Exponential backoff curve computes [1000, 2000, 4000, 8000, 16000, 30000, 30000] from shared util"
    - "query-provider.tsx imports backoff math from src/lib/utils/backoff.ts (single source of truth)"
    - "useTrackingSubscription reconnects via exponential backoff instead of linear 5s delay"
    - "When document.visibilityState === 'hidden', hook removes BOTH tracking + location channels, stops polling, clears reconnect timeout"
    - "When document.visibilityState === 'visible', hook re-fetches tracking data and re-subscribes BOTH channels"
    - "Attempt counter resets to 0 on successful SUBSCRIBED status"
    - "visibilitychange listener is registered + removed cleanly on mount/unmount with no leaks"
    - "useTrackingSubscription test suite covers backoff curve, visibility pause, channel cleanup, reconnect reset"
  artifacts:
    - path: "src/lib/utils/backoff.ts"
      provides: "getBackoffDelay(attempt, base?, max?) + RECONNECT_BASE_MS + RECONNECT_MAX_MS exports"
      contains: "Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS)"
    - path: "src/lib/utils/__tests__/backoff.test.ts"
      provides: "Unit tests for getBackoffDelay at attempts 0..7 + defaults + custom base/max"
    - path: "src/lib/providers/query-provider.tsx"
      provides: "queryRetryDelay imports getBackoffDelay from backoff.ts (zero behavior change)"
    - path: "src/lib/hooks/useTrackingSubscription.ts"
      provides: "Reconnect loop using exponential backoff + visibility pause/resume + attempt counter + BOTH channel cleanup"
      contains: "getBackoffDelay, visibilitychange, attemptRef"
    - path: "src/lib/hooks/__tests__/useTrackingSubscription.test.ts"
      provides: "Baseline state-machine tests + backoff + visibility + channel cleanup coverage"
  key_links:
    - from: "src/lib/hooks/useTrackingSubscription.ts"
      to: "src/lib/utils/backoff.ts"
      via: "named import { getBackoffDelay }"
      pattern: "from.*\"@/lib/utils/backoff\""
    - from: "src/lib/providers/query-provider.tsx"
      to: "src/lib/utils/backoff.ts"
      via: "named import { getBackoffDelay }"
      pattern: "from.*\"@/lib/utils/backoff\""
    - from: "src/lib/hooks/useTrackingSubscription.ts"
      to: "document.addEventListener('visibilitychange', ...)"
      via: "useEffect"
      pattern: "visibilitychange"
---

<objective>
Rewire the tracking subscription hook's reconnect + polling state machine so it (a) uses exponential backoff from a shared util, (b) pauses Realtime + polling when the tab is hidden and resumes on visible, and (c) has baseline test coverage BEFORE any other Phase 112 work touches the hook. This plan is plumbing-only — ZERO visible UI changes ship from it. TrackingPageClient, new components, and layout work all land in Plan 02.

Purpose: TRAK-04 replaces the current linear 5s retry with a capped exponential curve (1s→30s) so extended outages don't hammer the API; TRAK-03 kills idle Realtime channels + polling bandwidth when the user tabs away. Both changes sit inside the same 328-LOC untested state machine, so a baseline test suite lands first as a safety net (CONTEXT D-37/D-38).

Output:
- `src/lib/utils/backoff.ts` — shared exponential backoff util (~20 LOC)
- `src/lib/utils/__tests__/backoff.test.ts` — pure-function unit tests (~40 LOC)
- `src/lib/providers/query-provider.tsx` — refactored to import from shared util (zero behavior change)
- `src/lib/hooks/useTrackingSubscription.ts` — reconnect loop rewritten: attempt counter, exponential backoff, visibility listener, BOTH channel cleanup
- `src/lib/hooks/__tests__/useTrackingSubscription.test.ts` — extended with state-machine coverage (baseline tests added BEFORE refactor per D-37)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/112/112-CONTEXT.md
@.planning/phases/112/112-PRECONTEXT-RESEARCH.md
@.planning/phases/112/112-UI-SPEC.md
@src/lib/hooks/useTrackingSubscription.ts
@src/lib/providers/query-provider.tsx
@src/lib/hooks/__tests__/useTrackingSubscription.test.ts

<interfaces>
<!-- Phase 110 retry constants & formula currently inlined in query-provider.tsx:20-43 -->
<!-- Phase 112 Plan 01 extracts to shared util and re-imports here. Zero behavior change. -->

From src/lib/providers/query-provider.tsx (current state):
```typescript
const RETRY_BACKOFF_BASE_MS = 1000;
const RETRY_BACKOFF_MAX_MS = 30000;
const QUERY_RETRY_ATTEMPTS = 3;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean { ... }

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(RETRY_BACKOFF_BASE_MS * 2 ** attemptIndex, RETRY_BACKOFF_MAX_MS);
}
```

From src/lib/hooks/useTrackingSubscription.ts (current state):
```typescript
const POLLING_INTERVAL = 30000; // UNCHANGED
const RECONNECT_DELAY = 5000;   // DELETED — replaced with backoff util

export interface UseTrackingSubscriptionOptions {
  orderId: string;
  routeId?: string | null;
  enabled?: boolean;
  onOrderUpdate?: (status: OrderStatus) => void;
  onStopUpdate?: (stopData: Partial<RealtimeRouteStopUpdate>) => void;
  onLocationUpdate?: (location: DriverLocation) => void;
}

export interface UseTrackingSubscriptionReturn extends TrackingSubscriptionState {
  refresh: () => Promise<void>;
}

// Refs already present (lines 70-73):
const channelRef = useRef<RealtimeChannel | null>(null);
const locationChannelRef = useRef<RealtimeChannel | null>(null);
const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Current reconnect scheduling at lines 231-236:
reconnectTimeoutRef.current = setTimeout(() => {
  setupSubscriptions();
}, RECONNECT_DELAY);

// Current cleanup at lines 290-305:
return () => {
  if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  if (locationChannelRef.current) { supabase.removeChannel(locationChannelRef.current); locationChannelRef.current = null; }
  stopPolling();
  if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); }
};
```

NEW backoff util contract (Plan 01 introduces):
```typescript
// src/lib/utils/backoff.ts
export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30_000;

/**
 * Exponential backoff with cap.
 * attempt=0 → 1000ms, 1 → 2000ms, 2 → 4000ms, ..., 5 → 30000ms, 6+ → 30000ms (capped).
 * Mirrors the Phase 110 query-provider formula so both consumers share a single source of truth.
 */
export function getBackoffDelay(
  attempt: number,
  baseMs: number = RECONNECT_BASE_MS,
  maxMs: number = RECONNECT_MAX_MS,
): number {
  return Math.min(baseMs * 2 ** attempt, maxMs);
}
```

React 19 stale-closure strategy for visibility handler (D-14 says useEffectEvent — grep shows zero codebase usage; use stable ref pattern instead):
```typescript
// Store latest handler in a ref so useEffect deps can be [] without stale closure risk.
const visibilityHandlerRef = useRef<() => void>(() => {});

// Every render updates the ref with the latest closure (no dep tracking needed).
visibilityHandlerRef.current = () => {
  if (document.visibilityState === "hidden") {
    // pause: removeChannel BOTH, stopPolling, clearTimeout
  } else {
    // resume: fetchTrackingData + setupSubscriptions + setupLocationSubscription
  }
};

// Effect registers a stable callback that reads ref.current — deps []
useEffect(() => {
  const listener = () => visibilityHandlerRef.current();
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}, []);
```
</interfaces>
</context>

<locked_assumptions>
<!-- Decisions made in --auto mode without user input; record for traceability -->

1. **`useEffectEvent` rejected for this phase.** CONTEXT D-14 recommends React 19 `useEffectEvent`. Grep shows ZERO existing usage in the codebase. To avoid introducing an unproven hook into a critical state machine, this plan uses the **stable ref-callback pattern** (mutable ref holds latest closure, stable listener reads ref). Functionally equivalent, zero new React APIs, testable with existing patterns. If `useEffectEvent` lands elsewhere first, Phase 113+ can migrate.
2. **Backoff util export shape.** Named exports `getBackoffDelay`, `RECONNECT_BASE_MS`, `RECONNECT_MAX_MS`. Function signature supports optional `baseMs` / `maxMs` overrides so `query-provider.tsx` can pass its own constants without a second util.
3. **`query-provider.tsx` refactor scope = zero behavior change.** The existing `queryRetryDelay` stays as the exported fn consumed by React Query config; its body is replaced with a call to `getBackoffDelay(attemptIndex)`. Constants become re-exports or local aliases to the shared util. No test file updates required (existing `shouldRetryQuery` test is unaffected).
4. **Attempt counter lives on a ref, not state.** Using state would trigger re-renders during reconnect storms. `attemptRef.current` is incremented in the CHANNEL_ERROR branch and reset to 0 in the SUBSCRIBED branch.
5. **Test file structure.** Baseline tests added as a NEW top-level `describe("useTrackingSubscription subscription lifecycle", ...)` block so the existing helper tests (`useShowLiveTracking`, `useLastUpdateDisplay`) are untouched. Mocking strategy: mock `@/lib/supabase/client` via `vi.mock`, stub channel chain (`.channel().on().on().subscribe()`) with a queue of status callbacks driven by `vi.useFakeTimers()`.
6. **Sentry breadcrumbs deferred (D-46 NICE-TO-HAVE).** Not shipped in this plan to keep scope tight. Can be added in Phase 113 or on first production incident.
7. **Location channel: unchanged status callback.** Current hook has NO status callback on `setupLocationSubscription` (line 266: `.subscribe()` with no arg). Backoff + visibility applies to the location channel via `removeChannel` on hidden / re-calling `setupLocationSubscription` on visible — no new state machine on the location channel itself.
</locked_assumptions>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extract backoff util + refactor query-provider + unit tests (CHKP-01)</name>
  <files>
    src/lib/utils/backoff.ts (CREATE, ~20 LOC)
    src/lib/utils/__tests__/backoff.test.ts (CREATE, ~50 LOC)
    src/lib/providers/query-provider.tsx (MODIFY, lines 20-43)
  </files>
  <behavior>
    <!-- Pure-function util, test-first -->
    - `getBackoffDelay(0)` returns `1000`
    - `getBackoffDelay(1)` returns `2000`
    - `getBackoffDelay(2)` returns `4000`
    - `getBackoffDelay(3)` returns `8000`
    - `getBackoffDelay(4)` returns `16000`
    - `getBackoffDelay(5)` returns `30000` (first clamp to cap)
    - `getBackoffDelay(6)` returns `30000` (stays capped)
    - `getBackoffDelay(100)` returns `30000` (extreme clamp)
    - `getBackoffDelay(0, 500, 5000)` returns `500` (custom base)
    - `getBackoffDelay(10, 500, 5000)` returns `5000` (custom cap)
    - `RECONNECT_BASE_MS === 1000`
    - `RECONNECT_MAX_MS === 30_000`
    - `queryRetryDelay(i)` in query-provider produces IDENTICAL output to `getBackoffDelay(i)` for i in [0..6] (regression guard — consumer shape preserved)
  </behavior>
  <action>
    Step 1 — Write failing tests first (RED):
    Create `src/lib/utils/__tests__/backoff.test.ts` with the behaviors above. File should import from `../backoff` (not yet created). Run `pnpm test -- src/lib/utils/__tests__/backoff.test.ts` and confirm all tests FAIL with "module not found".

    Step 2 — Create util (GREEN):
    Create `src/lib/utils/backoff.ts`:
    ```typescript
    /**
     * Exponential backoff with a cap.
     *
     * Shared by Phase 110 query-provider (React Query retry delay) AND
     * Phase 112 useTrackingSubscription (Realtime reconnect delay).
     * Single source of truth prevents drift between the two consumers.
     *
     * Curve (default base=1000, max=30000):
     *   attempt 0 → 1000ms
     *   attempt 1 → 2000ms
     *   attempt 2 → 4000ms
     *   attempt 3 → 8000ms
     *   attempt 4 → 16000ms
     *   attempt 5 → 30000ms (cap reached)
     *   attempt 6+ → 30000ms (capped)
     */
    export const RECONNECT_BASE_MS = 1000;
    export const RECONNECT_MAX_MS = 30_000;

    export function getBackoffDelay(
      attempt: number,
      baseMs: number = RECONNECT_BASE_MS,
      maxMs: number = RECONNECT_MAX_MS,
    ): number {
      return Math.min(baseMs * 2 ** attempt, maxMs);
    }
    ```
    Run unit tests again — all green.

    Step 3 — Refactor query-provider (REFACTOR, zero behavior change):
    In `src/lib/providers/query-provider.tsx`:
    - Replace lines 20-21 (`const RETRY_BACKOFF_BASE_MS = 1000; const RETRY_BACKOFF_MAX_MS = 30000;`) with a named import: `import { getBackoffDelay, RECONNECT_BASE_MS, RECONNECT_MAX_MS } from "@/lib/utils/backoff";`
    - Keep `QUERY_RETRY_ATTEMPTS = 3` local (Phase 110 constant, unrelated to backoff).
    - Replace `queryRetryDelay` body (line 42) with `return getBackoffDelay(attemptIndex);`
    - Leave `shouldRetryQuery` untouched.
    - Leave the `QueryProvider` component untouched.
    - The inline comment block on lines 11-19 remains valid (Phase 110 intent preserved).

    CRITICAL: the existing `query-provider` test file (if any) covering `shouldRetryQuery` and `queryRetryDelay` must still pass. Do NOT change their exported signatures.

    Verification:
    - Run `pnpm test -- backoff` — all 12 cases pass
    - Run `pnpm test -- query-provider` — existing tests still pass
    - Run `pnpm typecheck` — no errors
    - Run `pnpm lint -- src/lib/utils/backoff.ts src/lib/providers/query-provider.tsx`

    Commit: `feat(112-01): extract exponential backoff to shared util (TRAK-04 prep)`
  </action>
  <verify>
    <automated>pnpm test -- src/lib/utils/__tests__/backoff.test.ts src/lib/providers/__tests__/query-provider.test.ts 2>/dev/null || pnpm test -- src/lib/utils/__tests__/backoff.test.ts</automated>
  </verify>
  <done>
    - `src/lib/utils/backoff.ts` exists with `getBackoffDelay` + both constants
    - `src/lib/utils/__tests__/backoff.test.ts` covers attempts 0..6, cap, custom base/max (12 cases minimum, all pass)
    - `src/lib/providers/query-provider.tsx` imports from `@/lib/utils/backoff` (no inline formula)
    - `pnpm typecheck` clean
    - `pnpm lint` clean on the 3 modified/created files
    - Git commit landed with scope `112-01`
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Baseline tests for useTrackingSubscription subscription lifecycle (CHKP-02)</name>
  <files>
    src/lib/hooks/__tests__/useTrackingSubscription.test.ts (MODIFY, append ~250 LOC)
  </files>
  <behavior>
    <!-- Baseline SAFETY NET tests — MUST land before Task 3 touches the hook internals (CONTEXT D-37) -->
    <!-- These document CURRENT behavior so the Task 3 refactor can be verified non-regressive -->

    New `describe("useTrackingSubscription — subscription lifecycle", ...)` block covering:

    Test A: Mount sets up tracking channel
    - Render hook with orderId="order-123", routeId=null, enabled=true
    - Expect `supabase.channel("tracking:order-123")` called exactly once
    - Expect `.on()` called twice (orders + route_stops subscriptions)
    - Expect `.subscribe()` called with a callback

    Test B: Mount sets up location channel when routeId present
    - Render hook with orderId="order-123", routeId="route-456", enabled=true
    - Expect `supabase.channel("location:route-456")` called
    - Expect a second `.on()` for location_updates

    Test C: Mount does not subscribe when enabled=false
    - Render hook with enabled=false
    - Expect no `.channel()` calls

    Test D: SUBSCRIBED status sets isConnected=true
    - Render hook, invoke the captured subscribe callback with `"SUBSCRIBED"`
    - `act(() => { statusCallback("SUBSCRIBED"); })`
    - Expect `result.current.isConnected === true`
    - Expect `result.current.connectionError === null`

    Test E: CLOSED status sets isConnected=false and starts polling
    - Render hook, invoke subscribe callback with `"CLOSED"`
    - Expect `result.current.isConnected === false`
    - Expect `result.current.connectionError` contains "Reconnecting" or is truthy
    - Expect `setInterval` called with POLLING_INTERVAL (30000) — use `vi.useFakeTimers()`

    Test F: CHANNEL_ERROR status schedules reconnect
    - Render hook, invoke subscribe callback with `"CHANNEL_ERROR"`
    - Advance `vi.useFakeTimers()` by 1000ms (first backoff attempt) — for CURRENT (pre-refactor) code this is 5000ms
    - IMPORTANT: this test will need a version-gate comment — the expected delay CHANGES in Task 3. Document the pre-refactor value (5000) in a `// TODO(Task 3): update to 1000 after backoff util lands` comment, then update in Task 3.
    - Expect `.subscribe()` called a SECOND time (reconnect fired)

    Test G: Cleanup on unmount calls removeChannel for BOTH channels
    - Render hook with routeId="route-456", unmount
    - Expect `supabase.removeChannel` called with the tracking channel
    - Expect `supabase.removeChannel` called with the location channel
    - Expect `clearInterval` called

    Test H: refresh() calls fetchTrackingData via fetch
    - Mock `global.fetch` to return `{ ok: true, json: () => ({ data: { order: { status: "preparing" }, routeStop: null, driverLocation: null } }) }`
    - Render hook, call `result.current.refresh()`
    - Expect `fetch` called with `/api/tracking/order-123`

    Test I: Polling fires on interval when disconnected
    - Render hook, trigger CLOSED, advance fake timers by POLLING_INTERVAL (30000ms)
    - Expect `fetch` called at least twice (initial + 1 poll)
  </behavior>
  <action>
    Open `src/lib/hooks/__tests__/useTrackingSubscription.test.ts`. Keep the existing `useShowLiveTracking` and `useLastUpdateDisplay` describe blocks untouched.

    Add a new top-level describe block `describe("useTrackingSubscription — subscription lifecycle", () => { ... })` at the END of the file.

    Mocking setup:
    ```typescript
    import { useTrackingSubscription } from "../useTrackingSubscription";

    // Mock supabase client with controllable channel chain
    const mockSubscribeCallbacks: Array<(status: string) => void> = [];
    const mockRemoveChannel = vi.fn();
    const mockChannels: Array<{ name: string; on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> }> = [];

    vi.mock("@/lib/supabase/client", () => ({
      createClient: () => ({
        channel: vi.fn((name: string) => {
          const ch = {
            name,
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn((cb?: (status: string) => void) => {
              if (cb) mockSubscribeCallbacks.push(cb);
              return ch;
            }),
          };
          mockChannels.push(ch);
          return ch;
        }),
        removeChannel: mockRemoveChannel,
      }),
    }));

    beforeEach(() => {
      mockSubscribeCallbacks.length = 0;
      mockChannels.length = 0;
      mockRemoveChannel.mockClear();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { order: { status: "preparing" }, routeStop: null, driverLocation: null } }),
      }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });
    ```

    Implement Tests A through I as described in `<behavior>`. Use `renderHook` from `@testing-library/react` + `act` to drive subscribe callbacks.

    For Test F, use a version comment:
    ```typescript
    // NOTE: Pre-backoff-refactor delay is 5000ms (RECONNECT_DELAY).
    // Task 3 of plan 112-01 updates this to 1000ms (getBackoffDelay(0)).
    const CURRENT_FIRST_RECONNECT_MS = 5000;
    act(() => { vi.advanceTimersByTime(CURRENT_FIRST_RECONNECT_MS); });
    ```

    Run `pnpm test -- src/lib/hooks/__tests__/useTrackingSubscription.test.ts`. All tests must pass against the CURRENT (pre-refactor) hook code. This proves the tests are a valid safety net.

    If any test fails because the mocking strategy doesn't match reality, debug BEFORE proceeding to Task 3. Do NOT refactor the hook to make tests pass — tests exist to document current behavior.

    Commit: `test(112-01): baseline subscription lifecycle tests for useTrackingSubscription (D-37)`
  </action>
  <verify>
    <automated>pnpm test -- src/lib/hooks/__tests__/useTrackingSubscription.test.ts</automated>
  </verify>
  <done>
    - All existing tests (`useShowLiveTracking`, `useLastUpdateDisplay`) still pass
    - New `describe("useTrackingSubscription — subscription lifecycle")` block has 9 passing tests (A-I)
    - Tests use `vi.useFakeTimers()` + mocked supabase client + stubbed fetch
    - `CURRENT_FIRST_RECONNECT_MS = 5000` constant marked with Task 3 TODO
    - `pnpm typecheck` clean
    - Git commit landed
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement TRAK-04 exponential backoff + TRAK-03 visibility pause in useTrackingSubscription (CHKP-03)</name>
  <files>
    src/lib/hooks/useTrackingSubscription.ts (MODIFY, lines 28-305 heavy rewrite)
    src/lib/hooks/__tests__/useTrackingSubscription.test.ts (MODIFY, update delay constant + add new tests)
  </files>
  <behavior>
    <!-- TDD: extend baseline test suite first, then make it pass -->

    NEW tests (add to the lifecycle describe block):

    Test J (backoff curve): Successive CHANNEL_ERROR events follow exponential backoff
    - Render hook, trigger CHANNEL_ERROR #1, advance timers by 1000ms → reconnect fires
    - Trigger CHANNEL_ERROR #2 after reconnect, advance by 2000ms → reconnect fires
    - Trigger CHANNEL_ERROR #3, advance by 4000ms → reconnect fires
    - Expect `.subscribe()` called 4 times total (initial + 3 reconnects)
    - Document the progression: [1000, 2000, 4000] via explicit assertions per step

    Test K (backoff cap): Attempt counter reaching 5 stays at 30000ms
    - Simulate 7 consecutive CHANNEL_ERROR events, each followed by timer advance matching the expected backoff
    - The 6th and 7th attempts must both use 30000ms (capped)
    - Expect `.subscribe()` called 8 times total

    Test L (attempt reset): Successful SUBSCRIBED resets attempt counter
    - Trigger CHANNEL_ERROR → advance 1000ms → reconnect → SUBSCRIBED
    - Trigger CHANNEL_ERROR → advance 1000ms (NOT 2000 — counter reset)
    - Expect reconnect fires after 1000ms (not 2000)

    Test M (visibility hidden): Document hidden triggers channel + polling + timeout cleanup
    - Render hook, trigger CHANNEL_ERROR to get into reconnect-pending state
    - Mock `document.visibilityState = "hidden"` via `Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true })`
    - Dispatch `new Event("visibilitychange")` on document
    - Expect `mockRemoveChannel` called with BOTH tracking channel AND location channel
    - Expect `clearInterval` called (polling stopped)
    - Expect `clearTimeout` called (pending reconnect cleared)

    Test N (visibility visible): Document visible triggers immediate fetch + re-subscribe
    - Render hook, go hidden (Test M setup), then flip to visible
    - Mock `document.visibilityState = "visible"`, dispatch `visibilitychange`
    - Expect `fetch` called with `/api/tracking/${orderId}` (immediate refresh)
    - Expect `.channel("tracking:...")` called AGAIN (re-subscription)
    - If routeId was set, expect `.channel("location:...")` called AGAIN

    Test O (visibility listener cleanup): Unmount removes visibilitychange listener
    - Spy on `document.removeEventListener`
    - Render hook, unmount
    - Expect `document.removeEventListener` called with `"visibilitychange"` and the registered handler
    - Expect NO remaining listeners after unmount (verified via second render — visibility event should not hit the old hook's handler)

    Test P (race: rapid hidden/visible flip-flop): No channel accumulation
    - Flip visibility hidden → visible → hidden → visible rapidly
    - Expect `removeChannel` called exactly for each "hidden" transition
    - Expect `.channel()` called exactly for initial mount + each "visible" transition
    - Expect no leaked timers (verify via `vi.getTimerCount()` if available, or by asserting exact channel count)

    Update Test F: change `CURRENT_FIRST_RECONNECT_MS` from 5000 to 1000 (reconnect now uses `getBackoffDelay(0)` = 1000ms)
  </behavior>
  <action>
    Step 1 — Extend tests FIRST (RED):

    In `src/lib/hooks/__tests__/useTrackingSubscription.test.ts`:
    - Update Test F: change `CURRENT_FIRST_RECONNECT_MS = 5000` to `1000` with comment "Post-refactor: getBackoffDelay(0)"
    - Add Tests J, K, L, M, N, O, P as described in `<behavior>`

    For visibility tests, use this helper:
    ```typescript
    function setVisibilityState(state: "visible" | "hidden") {
      Object.defineProperty(document, "visibilityState", {
        value: state,
        configurable: true,
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }
    ```

    Run `pnpm test -- useTrackingSubscription`. Expect Tests J-P to FAIL, Test F to FAIL (wrong delay), all others still pass.

    Step 2 — Rewrite hook internals (GREEN):

    In `src/lib/hooks/useTrackingSubscription.ts`:

    (a) Imports — add at line 15:
    ```typescript
    import { getBackoffDelay } from "@/lib/utils/backoff";
    ```

    (b) Delete line 32 `const RECONNECT_DELAY = 5000;` entirely. Keep `POLLING_INTERVAL = 30000` (unchanged).

    (c) Add two refs after line 73 (`reconnectTimeoutRef`):
    ```typescript
    const attemptRef = useRef<number>(0);
    const visibilityHandlerRef = useRef<() => void>(() => {});
    ```

    (d) Modify the `.subscribe` callback inside `setupSubscriptions` (currently lines 215-238):
    ```typescript
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        attemptRef.current = 0; // reset on successful connection
        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }));
        stopPolling();
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectionError: "Reconnecting...", // D-20 calm copy; banner owns user-facing UX
        }));
        startPolling();

        // Clear any pending reconnect before scheduling a new one (race protection, preserved from lines 231-233)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // TRAK-04: exponential backoff using shared util
        const delay = getBackoffDelay(attemptRef.current);
        attemptRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          setupSubscriptions();
        }, delay);
      }
    });
    ```

    (e) TRAK-03 visibility handler — add inside the main `useEffect` at line 279 (the `if (!enabled) return;` effect), RIGHT AFTER `setupSubscriptions();` call:

    ```typescript
    // TRAK-03: visibility pause/resume — use mutable ref pattern to avoid stale closures
    // without requiring React 19 useEffectEvent (see Locked Assumption #1 in plan)
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === "hidden") {
        // Aggressive pause: remove BOTH channels, stop polling, clear reconnect (CONTEXT D-12)
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        if (locationChannelRef.current) {
          supabase.removeChannel(locationChannelRef.current);
          locationChannelRef.current = null;
        }
        stopPolling();
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else {
        // Resume: immediate refresh + re-subscribe both channels (CONTEXT D-13)
        void fetchTrackingData();
        setupSubscriptions();
        setupLocationSubscription();
      }
    };

    // Stable listener reads ref.current — safe for empty effect deps
    const visibilityListener = () => visibilityHandlerRef.current();
    document.addEventListener("visibilitychange", visibilityListener);
    ```

    And extend the cleanup return at lines 290-305 to include:
    ```typescript
    return () => {
      document.removeEventListener("visibilitychange", visibilityListener);
      // ...existing cleanup (removeChannel both, stopPolling, clearTimeout)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (locationChannelRef.current) {
        supabase.removeChannel(locationChannelRef.current);
        locationChannelRef.current = null;
      }
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      attemptRef.current = 0;
    };
    ```

    (f) Dep array of the main `useEffect` (line 305): MUST include `setupLocationSubscription` since the visibility resume path calls it. Add if not already present.

    CRITICAL — Gotchas (Research §5):
    - **C-2:** visibilitychange listener is registered inside useEffect, removed in return function — no accumulation
    - **C-3:** removeChannel called for BOTH `channelRef.current` AND `locationChannelRef.current` in hidden branch
    - **H-3:** race protection — existing clear-pending-reconnect pattern extends to visibility handler via the `clearTimeout(reconnectTimeoutRef.current)` in the hidden branch
    - **H-7:** stale closure avoided via mutable ref pattern (locked assumption #1) — NO `useEffectEvent`
    - **D-48:** every listener/interval/timeout paired in cleanup

    Step 3 — Run tests (should be GREEN):
    `pnpm test -- useTrackingSubscription` — all lifecycle tests J through P pass, Test F passes with new 1000ms value.

    Step 4 — Verify no regression in existing helper tests (`useShowLiveTracking`, `useLastUpdateDisplay` must still pass).

    Step 5 — Verification suite:
    - `pnpm lint src/lib/hooks/useTrackingSubscription.ts src/lib/hooks/__tests__/useTrackingSubscription.test.ts`
    - `pnpm typecheck`
    - `pnpm test` (full suite — no regression elsewhere)

    Commit: `feat(112-01): exponential backoff + visibility pause in useTrackingSubscription (TRAK-03, TRAK-04)`
  </action>
  <verify>
    <automated>pnpm test -- src/lib/hooks/__tests__/useTrackingSubscription.test.ts && pnpm typecheck</automated>
  </verify>
  <done>
    - `useTrackingSubscription.ts` no longer contains `RECONNECT_DELAY` constant
    - `useTrackingSubscription.ts` imports `getBackoffDelay` from `@/lib/utils/backoff`
    - `attemptRef` present and reset on SUBSCRIBED
    - `visibilityHandlerRef` + listener registered/removed in main useEffect
    - All 16 subscription lifecycle tests pass (Tests A-P)
    - `useShowLiveTracking` and `useLastUpdateDisplay` helper tests still pass
    - `pnpm typecheck` clean
    - `pnpm lint` clean on the 2 modified files
    - Full `pnpm test` suite has no new failures
    - Git commit landed
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser tab ↔ Supabase Realtime WebSocket | Untrusted network; may drop, degrade, or flap rapidly |
| browser tab ↔ `/api/tracking/:orderId` | Polling fallback; rate-limited by `customerLimiter` (30/min) |
| client component ↔ `document.visibilityState` | Browser-provided state; treated as trusted signal |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-112-01 | Denial of Service (self-inflicted) | useTrackingSubscription reconnect loop | mitigate | Exponential backoff caps request rate at 2 req/30s per session during outages (10x reduction vs linear 5s retry). Cap at 30s prevents runaway. |
| T-112-02 | Denial of Service (server) | /api/tracking polling | accept | Existing `customerLimiter` (30/min) already rate-limits; Phase 112 does not change polling cadence (30s interval, D-43). |
| T-112-03 | Resource exhaustion (client) | Visibility pause | mitigate | `removeChannel` BOTH + stopPolling + clearTimeout on hidden — zero idle cost. Guards against Supabase billing for idle channels + battery drain from hidden-tab polling. |
| T-112-04 | Race condition | Rapid hidden/visible flip-flop | mitigate | Pre-existing race protection (clear pending reconnect before re-subscribe) extends to visibility handler. Test P verifies no channel accumulation. |
| T-112-05 | Memory leak | visibilitychange listener | mitigate | Listener registered inside useEffect, removed in cleanup return. Test O verifies removal. Ref-based handler pattern avoids stale-closure retention. |
| T-112-06 | Information disclosure | Backoff timing | accept | Retry timing reveals outage duration to observers — low impact, no PII, inherent to any retry loop. |
| T-112-07 | Tampering | Client-side backoff parameters | accept | Attacker with DevTools can modify base/max constants — localhost scope only; server enforces rate limits independently. |
</threat_model>

<verification>
  Test-first sequence for the whole plan:
  1. Task 1 backoff util tests pass (RED → GREEN)
  2. Task 2 baseline lifecycle tests pass against CURRENT hook (confirms safety net validity)
  3. Task 3 extended tests fail against current hook (RED), pass after refactor (GREEN)

  Full verification suite (run BEFORE claiming plan complete):
  `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`

  Manual smoke test (optional, no checkpoint — plan is plumbing-only):
  - Open a tracking page in dev mode
  - DevTools → Network → offline → wait 2s → online → verify reconnect (should happen ~1s after going online)
  - DevTools → Application → confirm no "WebSocket connections" still open when tab is hidden via DevTools "throttle" → "offline" trick
  - Browser tab → switch away → switch back → verify Realtime reconnects without full page reload

  Regression guards:
  - Existing `useShowLiveTracking` + `useLastUpdateDisplay` tests still pass
  - `queryRetryDelay` in query-provider returns identical values pre/post refactor
  - `POLLING_INTERVAL` constant remains 30000 (D-43)
  - Desktop tracking layout (TrackingPageClient.tsx:217 `lg:grid-cols-2`) NOT touched
</verification>

<success_criteria>
  - `src/lib/utils/backoff.ts` exists, tested, and imported by `query-provider.tsx`
  - `useTrackingSubscription.ts` uses `getBackoffDelay` (no inline `RECONNECT_DELAY`)
  - Visibility pause: `removeChannel` BOTH + `stopPolling` + `clearTimeout` on hidden
  - Visibility resume: `fetchTrackingData` + `setupSubscriptions` + `setupLocationSubscription` on visible
  - Attempt counter resets to 0 on SUBSCRIBED
  - `useTrackingSubscription.test.ts` has 16+ passing tests covering the state machine
  - Visibility listener cleanup verified via Test O
  - Race protection on hidden/visible flip-flop verified via Test P
  - `pnpm typecheck` clean, full test suite passes, no UI regressions (UI is untouched in this plan)
  - 3 git commits landed with scope `112-01`
  - REQ-ID coverage: TRAK-03 (visibility pause), TRAK-04 (exponential backoff) — both delivered
</success_criteria>

<output>
After completion, create `.planning/phases/112/112-01-SUMMARY.md` with:
- What shipped: backoff util, query-provider refactor, useTrackingSubscription state machine rewrite, 13 new tests
- Files touched: backoff.ts, backoff.test.ts, query-provider.tsx, useTrackingSubscription.ts, useTrackingSubscription.test.ts
- Hand-off to Plan 02: `useTrackingSubscription` now emits stable `isConnected` state that Plan 02's `ReconnectingBanner` will consume via the `subscription.isConnected` prop drilled from `TrackingPageClient`. No API changes to the hook's return shape — backward compatible.
- Locked assumptions carried forward: ref-callback pattern for visibility (not `useEffectEvent`), Sentry breadcrumbs deferred
- Test strategy carried forward: Plan 02 can mock `useTrackingSubscription` at the hook level (return shape unchanged)
</output>
</content>
</invoke>