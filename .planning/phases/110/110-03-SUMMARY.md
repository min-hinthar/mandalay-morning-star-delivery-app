---
phase: 110
plan: 03
subsystem: cart-checkout-reliability
tags: [cfix-04, cfix-05, stripe-timeout, cart-validation-timeout, proceed-anyway, abort-controller, persistent-toast, idempotency]
dependency_graph:
  requires:
    - "110-01 (queryKeys factory + retry=false contract — transitively preserved)"
    - "110-02 (cutoffModalOpen prop + defense-in-depth submit gate — preserved)"
  provides:
    - "src/types/errors.ts ClientErrorCodes const enum (CHECKOUT_NETWORK_TIMEOUT + CART_VALIDATION_TIMEOUT)"
    - "useToast persistent?: boolean flag (no auto-dismiss)"
    - "usePaymentSubmit hook (Stripe fetch + 10s AbortController + cleanup)"
    - "useCartValidation { timedOut, proceedAnyway } extension (30s timeout)"
    - "CartValidationTimeoutBanner component (role=alert, Proceed Anyway)"
    - "CheckoutErrorBanner CHECKOUT_NETWORK_TIMEOUT case with Retry button"
  affects:
    - "src/components/ui/checkout/PaymentStepV8.tsx (extracted to usePaymentSubmit)"
    - "src/components/ui/cart/CartPage/CartPageContent.tsx (PRIMARY banner consumer)"
    - "src/components/ui/cart/CartDrawer.tsx (SECONDARY banner consumer)"
    - "src/app/api/checkout/session/route.ts (idempotency risk TODO comment)"
tech_stack:
  added: []
  patterns:
    - "AbortController + setTimeout refs with cleanup useEffect ([] deps) — prevents leaked fetches on unmount"
    - "Persistent toast (no auto-dismiss) for critical errors — customer must acknowledge"
    - "Proceed Anyway escape hatch — customer agency wins when validation hangs"
    - "Timeout surfaces status='error' so existing gate consumers still block checkout"
    - "Retry re-invokes handleCheckout with same order.id — preserves Stripe idempotency_key"
    - "Extracted hook pattern (usePaymentSubmit) to satisfy max-lines=400 without behavior change"
key_files:
  created:
    - "src/types/errors.ts"
    - "src/types/__tests__/errors.test.ts"
    - "src/lib/hooks/__tests__/useToast.test.ts"
    - "src/lib/hooks/__tests__/useCartValidation.test.ts"
    - "src/components/ui/cart/CartValidationTimeoutBanner.tsx"
    - "src/components/ui/checkout/usePaymentSubmit.ts"
    - "e2e/cart-validation-timeout.spec.ts"
  modified:
    - "src/types/cart.ts (CartValidationResult + timedOut + proceedAnyway)"
    - "src/lib/hooks/useToast.ts (persistent?: boolean flag)"
    - "src/lib/hooks/useCartValidation.ts (30s AbortController + timeout state)"
    - "src/components/ui/cart/index.ts (barrel export)"
    - "src/components/ui/cart/CartPage/CartPageContent.tsx (PRIMARY banner wiring)"
    - "src/components/ui/cart/CartDrawer.tsx (SECONDARY banner wiring)"
    - "src/components/ui/checkout/PaymentStepV8.tsx (hook extraction)"
    - "src/components/ui/checkout/CheckoutErrorBanner.tsx (CHECKOUT_NETWORK_TIMEOUT case)"
    - "src/app/api/checkout/session/route.ts (idempotency TODO comment, line 393)"
decisions:
  - "D-16: CART_VALIDATION_TIMEOUT_MS = 30000 — long enough for genuine slow networks, short enough that customer notices"
  - "D-17: timedOut returns status='error' so CheckoutGate + CartFooter still block checkout"
  - "D-18: AbortController pattern keyed to ref so unmount cleanup can abort in-flight refetches"
  - "D-19: proceedAnyway resets timedOut WITHOUT re-fetching — customer agency wins"
  - "D-20: banner wired into BOTH CartPageContent (PRIMARY) AND CartDrawer (SECONDARY) — two consumers"
  - "D-21: banner uses role='alert' for SR announcement + animate-slide-in-up entrance"
  - "D-22: Proceed Anyway button variant=outline size=md (44px min-height) per a11y"
  - "D-23: STRIPE_TIMEOUT_MS = 10000 — balances Stripe slow-network reality vs customer patience"
  - "D-24: AbortError branch sets ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT + persistent toast"
  - "D-25: Retry re-invokes handleCheckout (same order.id) — server-side idempotency_key stays stable"
  - "D-26: retry also aborts any stale in-flight controller before creating a new one (double-click safe)"
  - "D-27: cleanup useEffect with [] deps runs ONCE on unmount — no dep array churn"
  - "D-28: extracted usePaymentSubmit hook to satisfy max-lines=400 without changing behavior"
  - "D-29: ClientErrorCodes as const enum (NOT TypeScript enum) — erasable, zero runtime cost"
  - "D-31: useToast persistent flag gates addToRemoveQueue — NO action field added (kept API minimal)"
  - "D-32: persistent toasts reserved for CHECKOUT_NETWORK_TIMEOUT + CART_VALIDATION_TIMEOUT — not general purpose"
  - "D-33: ClientErrorCodes lives at src/types/errors.ts — shared surface for client-side error code checks"
  - "D-34: TODO(Phase 111+) idempotency comment at route.ts:393 — flags risk if future phase regenerates order.id"
metrics:
  duration_minutes: ~35
  tasks_completed: 5
  completed_date: 2026-04-06
---

# Phase 110 Plan 03: Critical Fixes 4-5 (Stripe Timeout + Cart Validation Timeout) Summary

CFIX-04 wraps Stripe checkout session fetch in 10s AbortController with CHECKOUT_NETWORK_TIMEOUT error + persistent toast + Retry button preserving idempotency key; CFIX-05 adds 30s AbortController timeout to useCartValidation with `timedOut` state, `proceedAnyway` escape hatch, and CartValidationTimeoutBanner wired into BOTH CartPageContent (PRIMARY) AND CartDrawer (SECONDARY).

## What Was Built

### CFIX-04 — Stripe Checkout Session Timeout

- **`usePaymentSubmit` hook** (NEW, 262 lines): extracts all Stripe fetch logic from PaymentStepV8 to satisfy max-lines. Owns `stripeControllerRef`, `stripeTimeoutIdRef`, cleanup useEffect with `[]` deps, and the `handleCheckout` async function.
- **10s AbortController timeout**: fires `controller.abort()` after `STRIPE_TIMEOUT_MS = 10000`. Response arrival clears the pending timeout before parsing body.
- **AbortError branch**: catches `err.name === "AbortError"`, sets `ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT` error, and fires a persistent toast (`persistent: true, variant: "destructive"`) that customer must manually dismiss.
- **Retry path**: `CheckoutErrorBanner` renders the new `CHECKOUT_NETWORK_TIMEOUT` case with a Retry button that calls `onRetry={handleCheckout}`. Retry re-invokes `handleCheckout` which hits the same `order.id` — server-side Stripe `idempotency_key=checkout_${order.id}` returns the cached session instead of creating a duplicate.
- **Double-click safety**: stale in-flight controller is aborted before creating a new one.
- **Idempotency risk comment**: TODO(Phase 111+) added above `idempotencyKey: \`checkout_${order.id}\`` in `src/app/api/checkout/session/route.ts:393`. Documents the current assumption (retry preserves order.id) and the guardrail (PaymentStepV8 does not re-create orders on retry). Flags the risk if a future phase regenerates order.id mid-flow.
- **Plan 02 contract preserved**: `cutoffModalOpen` gate still runs first inside handleCheckout, blocking programmatic Enter-key submissions.

### CFIX-05 — Cart Validation Timeout + Proceed Anyway

- **`useCartValidation` 30s timeout**: added `CART_VALIDATION_TIMEOUT_MS = 30000` constant. `triggerRefetch` creates an AbortController + setTimeout combo; if the timer fires before the refetch resolves, `setTimedOut(true)` runs.
- **`CartValidationResult` extension**: `timedOut: boolean` + `proceedAnyway: () => void` added to the shared type in `src/types/cart.ts`. All return branches of `useCartValidation` now spread `{ timedOut, proceedAnyway }` into the result.
- **Status blocking preserved**: when `timedOut === true`, hook returns `status: "error"` so existing `CheckoutGate` + `CartFooter.hasBlockingIssues` consumers still block checkout by default. Proceed Anyway is an explicit opt-in, not a default.
- **`proceedAnyway` action**: resets `timedOut` to `false` without re-fetching — customer agency wins over a hanging validation. Covered by Vitest D-19 test.
- **`CartValidationTimeoutBanner` component** (NEW, ~65 lines): `role="alert"`, `animate-slide-in-up`, status-warning tokens, AlertTriangle icon, Proceed Anyway outline button (44px min-height for a11y).
- **Wired into TWO consumers** (per spawn override):
  - **PRIMARY: `CartPageContent.tsx`** — renders above AttentionSection when `validation.timedOut`
  - **SECONDARY: `CartDrawer.tsx`** — renders inside non-empty branch with px-4 pt-2 wrapper
- **Unmount cleanup**: `useEffect(() => () => { ... }, [])` cleanup clears timeoutIdRef and aborts abortControllerRef on unmount — no leaked state updates on unmounted components.

### Shared Infrastructure

- **`src/types/errors.ts`** (NEW): `ClientErrorCodes` const enum with `CHECKOUT_NETWORK_TIMEOUT` + `CART_VALIDATION_TIMEOUT`. Const enum over TypeScript enum — fully erasable, zero runtime cost, no runtime lookup shim.
- **`useToast.ts` persistent flag**: added `persistent?: boolean` to `Toast` type + `ToastOptions`. Gated `addToRemoveQueue` behind `if (!options.persistent)` so persistent toasts never auto-dismiss. API kept minimal — NO action field added. Reserved for CHECKOUT_NETWORK_TIMEOUT + CART_VALIDATION_TIMEOUT per D-32.

## Tests Added

### Unit Tests (Vitest)

| File | Count | Coverage |
| ---- | ----- | -------- |
| `src/types/__tests__/errors.test.ts` | 5 | ClientErrorCodes identity, type derivation, const enum shape |
| `src/lib/hooks/__tests__/useToast.test.ts` | 5 | Auto-dismiss default, persistent=no dismiss, manual dismiss, destructive variant, mixed coexistence |
| `src/lib/hooks/__tests__/useCartValidation.test.ts` | 7 | Initial timedOut=false, proceedAnyway exposed, 30s timer flip, proceedAnyway reset w/o refetch, unmount cleanup, status=error surfacing, hasBlockingIssues default |

**Total: 17 new unit tests. All passing. Full suite: 900/900 passing across 54 files.**

### E2E Tests (Playwright, PLAYWRIGHT_AUTH gated)

| File | Count | Coverage |
| ---- | ----- | -------- |
| `e2e/cart-validation-timeout.spec.ts` | 2 | Cart page banner after 30s hang + drawer banner after 30s hang |

## useEffect Cleanup Audit (Task 4)

Scope: `src/lib/hooks/**`, `src/components/ui/checkout/**`, `src/components/ui/cart/**`.

| File | Pattern | Status |
| ---- | ------- | ------ |
| `useCartValidation.ts` | setTimeout + AbortController | Fixed in Task 2 — cleanup useEffect with [] deps |
| `usePaymentSubmit.ts` | setTimeout + AbortController | New in Task 3/4 — cleanup useEffect with [] deps |
| `useToast.ts` | addToRemoveQueue setTimeout | Pre-existing — guarded by toastTimeouts Map |
| `useUpdateBanner.ts` | setTimeout (countdown + idle) | Pre-existing — cleanup returns clearTimeout |
| `useTrackingSubscription.ts` | setTimeout (reconnect) | Pre-existing — cleanup clears ref |
| `useDebounce.ts` | setTimeout | Pre-existing — cleanup returns clearTimeout |
| `useCountdown.ts` | setInterval | Pre-existing — cleanup returns clearInterval |
| `useDeliveryGate.ts` | setTimeout (tick + next-window) | Pre-existing — cleanup clears timeout (x2) |
| `useBodyScrollLock.ts` | setTimeout | Pre-existing — cleanup clears timeout |
| `useOfflineSync.ts` | setInterval | Pre-existing — cleanup clears interval |
| `useCustomerOfflineSync.ts` | setInterval | Pre-existing — cleanup clears interval |
| `useSafeEffects/useSafeTimeout.ts` | setTimeout wrapper | Pre-existing — designed for safety |
| `useSafeEffects/useSafeInterval.ts` | setInterval wrapper | Pre-existing — designed for safety |
| `useSafeEffects/useSafeAsync.ts` | AbortController wrapper | Pre-existing — designed for safety |
| `useDynamicImportWithRetry.ts` | setTimeout | Pre-existing — cleanup clears timeout |
| `AddToCartButton.tsx` | Set<setTimeout> | Pre-existing — cleanup iterates Set and clears all |
| `AddressAutocomplete.tsx` | setTimeout (blur) | Pre-existing — cleanup clears ref on unmount + focus |
| `PaymentSuccess.tsx` | setTimeout (confetti, copy) | Pre-existing — cleanup returns clearTimeout |

**Verdict: No leaks detected. All setTimeout/setInterval/AbortController usages have proper cleanup returns or are inside useSafeEffects wrappers designed for safety.**

## Verification Suite Results

| Check | Result |
| ----- | ------ |
| `pnpm lint` | clean (0 errors, 0 warnings) |
| `pnpm lint:css` | clean |
| `pnpm typecheck` | clean |
| `pnpm test --run` | 900/900 passing (54 test files, 21.36s) |
| `pnpm prettier --check` on Plan 03 files | all clean after auto-format |
| `pnpm build` | succeeded (1m36s, service worker built) |

**Note:** Global `pnpm format:check` reports 1275 pre-existing warnings in files outside Plan 03 scope — these are pre-existing LF/CRLF line-ending drift and are out of scope per Rule SCOPE BOUNDARY. Plan 03 files all pass Prettier after auto-format.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vitest fake timer + waitFor deadlock in useCartValidation test**
- **Found during:** Task 2
- **Issue:** `vi.useFakeTimers()` without `shouldAdvanceTime: true` prevents `waitFor`'s internal polling from ticking forward, causing 4 tests to time out at 10s.
- **Fix:** Changed to `vi.useFakeTimers({ shouldAdvanceTime: true })` in beforeEach so waitFor can poll under fake timers.
- **Files modified:** `src/lib/hooks/__tests__/useCartValidation.test.ts`
- **Commit:** `72ee11f1`

**2. [Rule 3 - Blocker] vi.mock hoisting broke top-level variable references**
- **Found during:** Task 2
- **Issue:** `vi.mock()` factories are hoisted above top-level `let cartStoreCore` declarations, causing `ReferenceError: Cannot access 'cartStoreCore' before initialization`.
- **Fix:** Inlined the cart store + useMenu mock factories entirely inside `vi.mock()` calls. Added `__getRefetchMock` escape hatch via dynamic import for test-only access.
- **Files modified:** `src/lib/hooks/__tests__/useCartValidation.test.ts`
- **Commit:** `72ee11f1`

**3. [Rule 1 - Bug] PaymentStepV8 exceeded max-lines=400 after CFIX-04 additions**
- **Found during:** Task 4 (lint step)
- **Issue:** Adding AbortController refs + cleanup useEffect + AbortError branch pushed PaymentStepV8 from 400 to 482 lines, triggering max-lines warning.
- **Fix:** Extracted all Stripe submit logic into new `usePaymentSubmit` hook (262 lines). PaymentStepV8 dropped to ~330 lines. No behavior change.
- **Files modified:** `src/components/ui/checkout/PaymentStepV8.tsx`, `src/components/ui/checkout/usePaymentSubmit.ts` (NEW)
- **Commit:** `e0ead1bb`

**4. [Rule 3 - Blocker] PaymentMethod type mismatch after hook extraction**
- **Found during:** Task 4 (typecheck step)
- **Issue:** Initial hook signature used `paymentMethod: "card" | "cod"` but actual type is `PaymentMethod = "stripe" | "cod"` from `@/types/order`.
- **Fix:** Import `PaymentMethod` type from `@/types/order` and use it in `UsePaymentSubmitArgs`.
- **Files modified:** `src/components/ui/checkout/usePaymentSubmit.ts`
- **Commit:** `e0ead1bb`

**5. [Rule 3 - Blocker] Missing .env.local in worktree blocked production build**
- **Found during:** Task 4 (build step)
- **Issue:** `NEXT_PUBLIC_SUPABASE_URL is not configured` during static page generation because the worktree has no `.env.local` (only the main repo does).
- **Fix:** Copied `.env.local` from main repo into worktree for the build run, deleted after verification. Not a code change — infra-only workaround.
- **Files modified:** none (transient copy)
- **Note:** Not committed because `.env.local` is gitignored. This is a worktree-hygiene issue, not a Plan 03 regression.

## Auth Gates

None — no authentication required during execution.

## Commits

| Task | Hash | Message |
| ---- | ---- | ------- |
| 1 | `594c56dd` | feat(110-03): centralize ClientErrorCodes + useToast persistent flag |
| 2 | `72ee11f1` | feat(110-03): CFIX-05 useCartValidation 30s timeout + Proceed Anyway banner |
| 3 | `ec90cec6` | feat(110-03): CFIX-04 Stripe 10s timeout + persistent toast + retry |
| 4 | `e0ead1bb` | refactor(110-03): extract usePaymentSubmit hook to satisfy max-lines + prettier |

## Known Stubs

None — all data flows are wired. Banner is conditionally rendered on real `validation.timedOut` state from `useCartValidation` timer, not a placeholder.

## Threat Flags

No new security-relevant surface introduced. CFIX-04 / CFIX-05 affect client-side UX only; server-side `idempotency_key` behavior unchanged (TODO comment is documentation only).

## Phase 110 Contracts Preserved

- **Plan 01**: queryKeys factory + TanStack Query `retry: false` — no touch, no regression
- **Plan 02**: `cutoffModalOpen` prop + CSS-only responsive cart + EmptyCheckoutError — preserved; `cutoffModalOpen` gate still runs first inside `usePaymentSubmit.handleCheckout`
- **Phase 81**: cart NOT cleared on validation failure — cart store untouched, only transient hook state
- **Phase 84**: BUG-06 cart-store persistence contract — untouched
- **Phase 104**: no `as any` — all types explicit
- **Phase 106**: `useDeliveryGate` + `getZonedDayOfWeek` — untouched
- **Phase 108**: feedback system — untouched
- **No `void asyncFn()`**: all async calls either awaited or use existing catch handlers

## Self-Check: PASSED

**Files verified:**
- `src/types/errors.ts` FOUND
- `src/types/__tests__/errors.test.ts` FOUND
- `src/lib/hooks/__tests__/useToast.test.ts` FOUND
- `src/lib/hooks/__tests__/useCartValidation.test.ts` FOUND
- `src/components/ui/cart/CartValidationTimeoutBanner.tsx` FOUND
- `src/components/ui/checkout/usePaymentSubmit.ts` FOUND
- `e2e/cart-validation-timeout.spec.ts` FOUND
- `.planning/phases/110/110-03-SUMMARY.md` FOUND

**Commits verified:**
- `594c56dd` FOUND (Task 1 — ClientErrorCodes + useToast persistent)
- `72ee11f1` FOUND (Task 2 — CFIX-05 useCartValidation + banner)
- `ec90cec6` FOUND (Task 3 — CFIX-04 Stripe timeout)
- `e0ead1bb` FOUND (Task 4 — usePaymentSubmit extraction + verification)
