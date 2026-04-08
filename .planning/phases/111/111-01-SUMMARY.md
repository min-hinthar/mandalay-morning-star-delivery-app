---
phase: 111-checkout-conversion
plan: 01
subsystem: ui
tags: [react, zustand, vitest, framer-motion, checkout, stripe, sessionstorage]

# Dependency graph
requires:
  - phase: 110-checkout-foundation
    provides: "useCheckoutStore persist middleware (sessionStorage), CutoffModal base component, EmptyCheckoutError synchronous guard, ClientErrorCodes registry, defense-in-depth cutoffModalOpen prop"
  - phase: 106-multi-day-delivery
    provides: "getNextDeliveryDate(now, deliveryDays) timezone-correct helper, DeliveryDayConfig type"
provides:
  - "Stripe-redirect-aware reset() gate on CheckoutClient unmount (CFIX-07 unblock)"
  - "CutoffModal three-action layout with optional reschedule CTA (CHKP-04)"
  - "handleReschedule composition: setDelivery + setStep('time') + close modal"
  - "Vitest contract tests for both reset() gate and reschedule wiring"
affects: [111-02-CFIX-07-form-persistence, 111-03-checkout-polish, 111-04-prefetch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Window-location-based unmount gate (typeof window check + href.includes for Stripe domain)"
    - "Optional CutoffModal additive props pattern — backward compat via undefined-falsy gate"
    - "Property-spy mock pattern for capturing modal props in Vitest (cutoffModalSpy)"
    - "Stable mock fn identity (top-level vi.fn refs) for assertion across renders"

key-files:
  created:
    - ".planning/phases/111/111-01-SUMMARY.md"
  modified:
    - "src/app/(customer)/checkout/CheckoutClient.tsx"
    - "src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx"
    - "src/components/ui/delivery/CutoffModal.tsx"

key-decisions:
  - "Use timeWindows[0] (global list) for reschedule auto-pick — DeliveryDayConfig has no per-day windows array; mirrors TimeStepV8 default-selection pattern"
  - "Local-date ISO build (getFullYear/getMonth/getDate) instead of toISOString() — avoids LA-vs-UTC day shift on overnight reschedules"
  - "Reschedule button + Burmese sr-only span share a fragment — prevents the span from being read as a separate flex child"

patterns-established:
  - "Same-tab navigation guard: window.location.href.includes('checkout.stripe.com') used to detect Stripe redirect during unmount"
  - "Three-action modal with one-visible-primary rule: reschedule replaces Browse Menu as primary when present, Browse Menu downgrades to outline"
  - "Reschedule composition contract: setDelivery + setStep('time') + setShowCutoffModal(false) — missing any one breaks UX (D-31)"

requirements-completed: [CHKP-04]

# Metrics
duration: ~30min
completed: 2026-04-08
---

# Phase 111 Plan 01: Cutoff Reschedule + Stripe-Redirect Unmount Guard Summary

**Adds one-click cutoff recovery to CutoffModal and gates CheckoutClient.unmount → reset() against Stripe same-tab redirect, unblocking CFIX-07 form persistence.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-08T05:55:00Z (approx)
- **Completed:** 2026-04-08T06:28:17Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- **CFIX-07 architectural risk resolved.** The unmount cleanup now skips reset() when `window.location.href` contains `checkout.stripe.com`, so sessionStorage survives the same-tab Stripe redirect. Plan 02's CFIX-07 form persistence work can now proceed.
- **CHKP-04 ships in one click.** CutoffModal renders a primary "Reschedule to {date}" button between "Got it" and "Browse Menu" whenever an active delivery day exists. The handler composes setDelivery + setStep('time') + close-modal so the customer lands on the time step with the next available date pre-selected.
- **3 new Vitest cases lock the reset() gate and 4 new cases lock the reschedule wiring.** Both the legacy 2-action modal and the new 3-action modal are covered, including the empty-deliveryDays degradation path and the empty-timeWindows defensive guard.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate reset() cleanup against Stripe redirect + test** - `3eb9d026` (fix)
2. **Task 2: Extend CutoffModal with rescheduleOption + onReschedule** - `c87abfbe` (feat)
3. **Task 3: Wire reschedule handler in CheckoutClient + test composition** - `6a33f7dd` (feat)

**Plan metadata:** *(this commit)* (docs: complete plan)

## Files Created/Modified

- `src/app/(customer)/checkout/CheckoutClient.tsx` — Added Stripe-redirect unmount gate (D-03), `getNextDeliveryDate` import, `useMemo` for `nextDelivery` shape, `useCallback` for `handleReschedule` composition, and CutoffModal prop wiring (`rescheduleOption={nextDelivery}` + `onReschedule={handleReschedule}`).
- `src/components/ui/delivery/CutoffModal.tsx` — Extended `CutoffModalProps` with optional `rescheduleOption?: { dateString; displayDate }` + `onReschedule?: () => void`. Three-action layout when both present, two-action legacy when absent. `aria-label` plus screen-reader-only Burmese companion span (BURMESE-REVIEW).
- `src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx` — Replaced ad-hoc `vi.fn()` mock returns with stable top-level fn refs (`mockResetFn`, `mockSetStepFn`, `mockSetDeliveryFn`). Added `cutoffModalSpy` to capture modal props. Added two new describe blocks: `CFIX-07 D-03 — reset() gate on unmount` (3 tests) and `CHKP-04 — CutoffModal reschedule wiring` (4 tests).

## Decisions Made

1. **Auto-picked time window comes from `timeWindows[0]` (global list), not `dayConfig.windows`.** Mirrors `TimeStepV8.tsx:135-140`. Plan referenced a non-existent `windows` array on `DeliveryDayConfig` — see Deviation 1.
2. **Local-date ISO string built manually (`YYYY-MM-DD`) rather than `toISOString().split('T')[0]`.** `toISOString()` shifts the date back a day in LA timezone overnight (e.g. Apr 11 23:30 PT → Apr 12 06:30 UTC). Building from `getFullYear/getMonth/getDate` keeps the customer's intended day.
3. **Reschedule button + Burmese span share a `<>` fragment.** A bare adjacent `<span>` would become a flex child of the actions row and disrupt the `sm:flex-row sm:justify-center` layout. Wrapping in a fragment keeps the visual layout intact while still rendering the screen-reader text in source order next to the button.
4. **Stable test mock fn identity (top-level `mockResetFn` etc.) instead of inline `vi.fn()` per render.** The original mock returned a fresh `vi.fn()` on every `useCheckoutStore()` call, which made it impossible to assert "reset was called once after unmount". Hoisting the spies fixes this and enables the new gate test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug in plan] `dayConfig.windows` does not exist on `DeliveryDayConfig`**

- **Found during:** Task 3 (Wire reschedule handler in CheckoutClient)
- **Issue:** Plan instructed to look up the next day's `dayConfig.windows.find((w) => w.isActive)` to pick the auto-selected time window. Reading `src/types/delivery.ts` revealed `DeliveryDayConfig` has fields `id, dayOfWeek, isActive, cutoffDay, cutoffHour, deliveryFeeCents, displayOrder, direction` — there is no `windows` array on the type. Time windows are global and live in the `timeWindows: TimeWindow[]` prop already passed into `CheckoutClient`.
- **Fix:** Mirror the existing default-selection pattern in `TimeStepV8.tsx:135-140`, which picks `timeWindows[0]` for the first available date. The reschedule handler now uses `timeWindows[0]` and short-circuits if `timeWindows.length === 0` (defensive Rule 3 — also covered by a new test case).
- **Files modified:** `src/app/(customer)/checkout/CheckoutClient.tsx`
- **Verification:** Unit test `composes setDelivery + setStep('time') on reschedule click (D-31)` asserts `setDelivery({ date, windowStart: '10:00', windowEnd: '12:00' })` is invoked with the expected window. Defensive test `does NOT crash on reschedule when timeWindows is empty` covers the early return.
- **Committed in:** `6a33f7dd`

**2. [Rule 1 — Bug] `cutoffModalSpy` import scope inside `vi.mock` factory**

- **Found during:** Task 3 (test wiring)
- **Issue:** `vi.mock` factories are hoisted; referencing a top-level `cutoffModalSpy = vi.fn()` declared with `const` outside the factory triggers Vitest's "Cannot access … before initialization" warning when the factory captures the binding incorrectly.
- **Fix:** Declared `cutoffModalSpy` immediately above the `vi.mock("@/components/ui/delivery", …)` call so the binding is in scope before the factory closure captures it. Verified by green test run (`pnpm vitest run` → 912/912).
- **Files modified:** `src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx`
- **Verification:** All 7 new tests pass; no console warnings emitted from Vitest's hoist analyzer.
- **Committed in:** `6a33f7dd`

---

**Total deviations:** 2 auto-fixed (1 plan-vs-reality bug, 1 test wiring bug)
**Impact on plan:** Both deviations preserved the plan's behavioral contract. The reschedule auto-pick still picks the "first active window of the next available day" — just from the global `timeWindows` source, which is what the rest of checkout already does.

## Empirical Reset() Audit Findings (D-03 deliverable)

The plan required confirming whether `useCheckoutStore.reset()` clears sessionStorage during the same-tab Stripe redirect. Empirical analysis:

- **Stripe redirect path** (`usePaymentSubmit.ts:203`) is `window.location.href = data.data.sessionUrl` — same-tab navigation.
- **React unmount behavior on `window.location.href` assignment**: React's render cycle does NOT synchronously unmount on navigation assignment; the browser begins navigation, but in-flight effects + `useEffect` cleanup CAN run before the new page loads if the script blocks for any reason (or if the user hits Back from Stripe before the page fully unloads).
- **Risk classification**: REAL but intermittent — the behavior was reproducible in dev (slow network throttle + React StrictMode) but not in fast production. The gate is a defense-in-depth fix, not a "this is broken in prod today" fix.
- **Outcome**: Gate is now in place. Plan 02's CFIX-07 contract test can safely assert sessionStorage survives the redirect path because the only code path that could clear it is now opt-in to non-Stripe URLs only.

## CutoffModal Call Sites Updated

| Call site | Updated? | Notes |
|-----------|----------|-------|
| `src/app/(customer)/checkout/CheckoutClient.tsx:293-297` | Yes | Now passes `rescheduleOption={nextDelivery}` + `onReschedule={handleReschedule}` |

`grep -rn "CutoffModal" src/` showed only the one call site. No legacy callers needed updating because the new props are optional.

## nextDelivery Shape

```ts
nextDelivery: { dateString: "2026-04-11", displayDate: "Saturday, April 11" } | undefined
```

`dateString` is a local-date ISO `YYYY-MM-DD` (NOT a UTC ISO). `displayDate` uses `Intl.DateTimeFormat` via `toLocaleDateString("en-US", { weekday, month, day })`.

## Test Output

```text
Test Files  55 passed (55)
     Tests  912 passed (912)
```

Delta from baseline: +12 tests (3 from CFIX-07 reset gate + 4 from CHKP-04 reschedule wiring + 5 pre-existing CheckoutClient CFIX-02 tests imported into the worktree). All other 900 existing tests pass — zero regressions.

## Verification Suite

| Step | Result |
|------|--------|
| `pnpm lint` | PASS (zero ESLint errors / warnings on changed files) |
| `pnpm lint:css` | PASS |
| `pnpm format:check` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` (vitest run) | 912/912 PASS |
| `pnpm build` | PASS (.env.local copied from main repo to satisfy supabase URL prerender check) |

## Issues Encountered

1. **Worktree had no `node_modules` and no `.env.local`.** Resolved by `pnpm install --prefer-offline` and copying `.env.local` from the main repo (gitignored, will not pollute commits).
2. **Worktree HEAD was older than the expected base.** The `EnterWorktree` checkout landed on `a0509b3e` (37 commits behind `7be9d88f`). Reset hard to `7be9d88f` per the worktree branch check protocol. No work was lost since the working tree was clean at start.
3. **Test file lived only in the main repo (uncommitted).** The git status snapshot at agent start showed `AM` for `CheckoutClient.test.tsx` from a prior worktree. Copied the up-to-date version into the worktree before adding the new describe blocks.

## Threat Flags

None — all changes stay within the existing client-side checkout trust boundary. The Stripe-redirect string match is tamper-proof for the legitimate use case (per T-111-01 in plan threat model). No new network endpoints, no schema changes, no auth/authz surface.

## Next Phase Readiness

- **Plan 02 (CFIX-07 form persistence)** can now write the integration test that asserts all 13 form fields survive the Stripe redirect path. The reset() gate guarantees sessionStorage will not be wiped on the same-tab navigation.
- **Plan 03 (polish)** can build on the CutoffModal API without re-deriving the optional-prop pattern.
- **Plan 04 (prefetch)** is unaffected by Plan 01 changes.

## Self-Check: PASSED

- `src/app/(customer)/checkout/CheckoutClient.tsx` — FOUND
- `src/components/ui/delivery/CutoffModal.tsx` — FOUND
- `src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx` — FOUND
- `.planning/phases/111/111-01-SUMMARY.md` — FOUND (this file)
- Commit `3eb9d026` — FOUND
- Commit `c87abfbe` — FOUND
- Commit `6a33f7dd` — FOUND

---

*Phase: 111-checkout-conversion*
*Plan: 01 — Cutoff Reschedule + Stripe-Redirect Unmount Guard*
*Completed: 2026-04-08*
