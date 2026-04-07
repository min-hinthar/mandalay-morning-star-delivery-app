---
phase: 110-critical-fixes-data-reliability
verified: 2026-04-07T22:10:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Mobile cart — no white flash on real device"
    expected: "Navigating to /cart on an iPhone 12 viewport (390×844) shows CartPageContent immediately without any blank white frame between SSR paint and hydration. No React hydration mismatch warnings in the console."
    why_human: "White flash is a visual timing artifact. The code contract (md:hidden / hidden md:block, no useEffect) is verified, but the subjective 'no flash' experience requires a browser with throttled CPU to confirm."
  - test: "Empty cart /checkout direct-link shows error UI instantly"
    expected: "Navigate to /checkout with an empty cart (clear IDB first). EmptyCheckoutError renders immediately — no spinner, no redirect loop, no toast flash."
    why_human: "The render-time guard is code-verified (if (isEmpty) return <EmptyCheckoutError />), but the visual experience (zero spinner frame visible) needs manual confirmation in a browser."
  - test: "Cutoff modal disables submit + handler refuses keyboard Enter submission"
    expected: "With the cutoff modal open, the Place Order button appears greyed-out and clicking it has no effect. Pressing Enter on a focused form input also does not trigger checkout. Zero /api/checkout/session network requests are fired."
    why_human: "Defense-in-depth requires browser-level keyboard testing. HTML disabled + handler guard are code-verified, but keyboard bypass (Enter on focused input) must be confirmed by a human in a browser."
  - test: "Stripe 10s timeout shows persistent error + Try Again"
    expected: "Throttle the /api/checkout/session endpoint to >10s (via devtools network throttling or a test flag). The checkout UI shows a destructive error toast that does NOT auto-dismiss, plus an inline CheckoutErrorBanner with a Try Again button. Clicking Try Again resubmits with the same order.id (verify no duplicate in the DB)."
    why_human: "Requires network throttling or a test endpoint shim. The AbortController code and CHECKOUT_NETWORK_TIMEOUT branch are code-verified, but the actual timeout + toast + retry UX needs live testing."
  - test: "Cart validation >30s shows CartValidationTimeoutBanner with Proceed Anyway"
    expected: "Stall the cart validation refetch (throttle /api/menu to >30s). Both the cart page and cart drawer show the CartValidationTimeoutBanner with the warning icon and Proceed Anyway button. Clicking Proceed Anyway removes the banner and unblocks the checkout button."
    why_human: "Requires a network throttling shim for the menu refetch. Banner wiring is code-verified in both CartPageContent and CartDrawer, but the 30s timeout + banner appearance + proceedAnyway dismissal needs a browser test."
---

# Phase 110: Critical Fixes & Data Reliability — Verification Report

**Phase Goal:** Customers can complete cart-to-checkout without hitting broken states or silent failures
**Verified:** 2026-04-07T22:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Mobile cart loads without white flash | ? HUMAN | `md:hidden`/`hidden md:block` CSS-only wrappers confirmed, no `useEffect`/`useIsMobile` in file — visual timing requires browser |
| 2 | Direct-link /checkout with empty cart shows immediate error (not spinner) | ? HUMAN | `if (isEmpty) return <EmptyCheckoutError />` at CheckoutClient.tsx:172-174, no useEffect redirect — zero-spinner guarantee requires browser |
| 3 | Cutoff modal disables submit button (defense-in-depth) | ? HUMAN | `disabled={isCreatingSession \|\| !canProceed \|\| cutoffModalOpen}` + `if (cutoffModalOpen) return` in usePaymentSubmit:111 — keyboard bypass requires browser |
| 4 | Stripe timeout shows clear error + retry option | ? HUMAN | 10s AbortController in usePaymentSubmit, `ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT`, `persistent: true` toast + CheckoutErrorBanner retry — live timeout requires browser |
| 5 | Cart validation >30s shows fallback UI with Proceed Anyway | ? HUMAN | CartValidationTimeoutBanner wired in CartPageContent:293-295 AND CartDrawer:115-117, proceedAnyway callback connected — 30s stall requires browser |

**Code-level score:** 5/5 truths have complete, wired, non-stub implementations. All require human testing to confirm visual/behavioral outcomes.

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/lib/queryKeys.ts` | VERIFIED | 38 lines, `export const queryKeys`, 3 namespaces (menu/addresses/orders), all `as const` tuples |
| `src/lib/queryKeys.test.ts` | VERIFIED | 53 lines, 10 Vitest tests, all passing |
| `src/lib/providers/query-provider.tsx` | VERIFIED | 64 lines, `shouldRetryQuery`, `queryRetryDelay`, `mutations: { retry: false }`, `staleTime: 5*60*1000` preserved |
| `src/lib/providers/__tests__/query-provider.test.tsx` | VERIFIED | 22 Vitest tests, all passing |
| `src/lib/hooks/useMenu.ts` | VERIFIED | Uses `queryKeys.menu.list()` + `queryKeys.menu.search()`, zero inline arrays |
| `src/lib/hooks/useAddresses.ts` | VERIFIED | Uses `queryKeys.addresses.list()`, `.detail()`, `.all` (4 invalidation sites), zero inline arrays |
| `src/lib/hooks/useOrderHistorySearch.ts` | VERIFIED | Uses `queryKeys.orders.itemsForSearch()`, zero inline arrays |
| `src/components/ui/checkout/EmptyCheckoutError.tsx` | VERIFIED | 54 lines, "Browse Menu" CTA, `role="status"`, exported correctly |
| `src/components/ui/checkout/index.ts` | VERIFIED | Line 53: `export { EmptyCheckoutError } from "./EmptyCheckoutError"` |
| `src/app/(customer)/cart/page.tsx` | VERIFIED | `md:hidden` + `hidden md:block` wrappers, zero `useEffect`/`useIsMobile`/`useMediaQuery` |
| `src/app/(customer)/checkout/CheckoutClient.tsx` | VERIFIED | `EmptyCheckoutError` import + render-time guard + `cutoffModalOpen={showCutoffModal}` prop wiring |
| `src/components/ui/checkout/PaymentStepV8.tsx` | VERIFIED | Imports `usePaymentSubmit`, `cutoffModalOpen?: boolean` prop, `disabled={... \|\| cutoffModalOpen}` |
| `src/components/ui/checkout/usePaymentSubmit.ts` | VERIFIED | 10s AbortController, `ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT`, `persistent: true` toast, `if (cutoffModalOpen) return` guard |
| `src/types/errors.ts` | VERIFIED | `ClientErrorCodes` const object with `CHECKOUT_NETWORK_TIMEOUT` + `CART_VALIDATION_TIMEOUT`, `ClientErrorCode` type |
| `src/lib/hooks/useToast.ts` | VERIFIED | `persistent?: boolean` on `Toast` type + `ToastOptions`, `addToRemoveQueue` gated on `!options.persistent` |
| `src/lib/hooks/useCartValidation.ts` | VERIFIED | `timedOut` state, `proceedAnyway` callback, AbortController + 30s setTimeout, cleanup useEffect `[]` deps |
| `src/components/ui/cart/CartValidationTimeoutBanner.tsx` | VERIFIED | 68 lines, "Proceed Anyway" button, `role="alert"`, `onProceedAnyway` prop wired to `onClick` |
| `src/components/ui/cart/CartPage/CartPageContent.tsx` | VERIFIED | `CartValidationTimeoutBanner` imported + rendered when `validation.timedOut` (line 293-295) |
| `src/components/ui/cart/CartDrawer.tsx` | VERIFIED | `CartValidationTimeoutBanner` imported + rendered when `validation.timedOut` (line 115-117) |

**Artifact score:** 19/19 artifacts present, substantive, and wired.

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `useMenu.ts` | `queryKeys.ts` | `import { queryKeys }` | WIRED | Lines 7, 23: `queryKeys.menu.list()` + `queryKeys.menu.search()` |
| `useAddresses.ts` | `queryKeys.ts` | `import { queryKeys }` | WIRED | Lines 15, 29, 59, 81, 101, 121: all 6 sites migrated |
| `useOrderHistorySearch.ts` | `queryKeys.ts` | `import { queryKeys }` | WIRED | Line 33: `queryKeys.orders.itemsForSearch()` |
| `CheckoutClient.tsx` | `EmptyCheckoutError.tsx` | `if (isEmpty) return <EmptyCheckoutError />` | WIRED | Lines 172-174: synchronous render-time guard confirmed |
| `CheckoutClient.tsx` | `PaymentStepV8.tsx` | `cutoffModalOpen={showCutoffModal}` | WIRED | Line 269 |
| `PaymentStepV8.tsx` | `usePaymentSubmit.ts` | hook extraction | WIRED | Line 24: `import { usePaymentSubmit }`, line 89: used |
| `usePaymentSubmit.ts` | `handleCheckout` early return | `if (cutoffModalOpen) return` | WIRED | Line 111 |
| `usePaymentSubmit.ts` | `errors.ts` | `import { ClientErrorCodes }` | WIRED | Line 7, line 216: `ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT` |
| `usePaymentSubmit.ts` | `useToast.ts` | `persistent: true` | WIRED | Line 225: `persistent: true, variant: "destructive"` |
| `CartPageContent.tsx` | `CartValidationTimeoutBanner.tsx` | `validation.timedOut` render | WIRED | Lines 293-295 |
| `CartDrawer.tsx` | `CartValidationTimeoutBanner.tsx` | `validation.timedOut` render | WIRED | Lines 115-117 |
| `CartValidationTimeoutBanner.tsx` | `proceedAnyway` | `onClick={onProceedAnyway}` | WIRED | Line 58: button onClick |
| `useCartValidation.ts` | `errors.ts` | `import { ClientErrorCodes }` | WIRED | `CART_VALIDATION_TIMEOUT` referenced |

**Link score:** 13/13 key links wired.

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `CartValidationTimeoutBanner` | `timedOut` | `useCartValidation` → `useState(false)` → 30s timer | Yes — real timer, real state | FLOWING |
| `EmptyCheckoutError` | `isEmpty` | `useCart` → Zustand store | Yes — real store value | FLOWING |
| `PaymentStepV8` | `cutoffModalOpen` | `CheckoutClient` `showCutoffModal` state | Yes — real `gate.isOpen` watcher | FLOWING |
| `usePaymentSubmit` | `AbortController` + 10s timeout | `setTimeout` + real `fetch` | Yes — real fetch wrapped | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| queryKeys factory exports correct tuples | `queryKeys.menu.list()` === `['menu','list']` (Vitest) | 10/10 tests pass | PASS |
| Retry predicate: 5xx retries, 401 does not | `shouldRetryQuery` (Vitest) | 22/22 tests pass | PASS |
| mutations.retry === false (literal) | `opts.mutations?.retry` (Vitest) | Verified by test | PASS |
| No inline `queryKey: [...]` arrays remain | `grep "queryKey: \["` in 3 hooks | 0 matches | PASS |
| No `as any` in 12 modified files | Grep across all Phase 110 files | 0 matches | PASS |
| No `void asyncFn()` patterns | Grep for fire-and-forget | 0 matches | PASS |
| Build produces valid output | `pnpm build` | Exit 0, SW built (568.7KB) | PASS |
| Full test suite | `pnpm test --run` | 900/900 passing, 54 files | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| CFIX-01 | 110-02 | Cart page uses SSR-safe mobile detection — no white flash | SATISFIED (human confirm) | `md:hidden`/`hidden md:block` pattern, zero `useEffect` |
| CFIX-02 | 110-02 | Checkout synchronously guards empty cart | SATISFIED (human confirm) | `if (isEmpty) return <EmptyCheckoutError />` at CheckoutClient:172 |
| CFIX-03 | 110-02 | Cutoff modal disables submit while open | SATISFIED (human confirm) | HTML `disabled` + handler early-return, 3-layer defense |
| CFIX-04 | 110-03 | Stripe session timeout shows error + retry | SATISFIED (human confirm) | 10s AbortController, persistent toast, CheckoutErrorBanner retry |
| CFIX-05 | 110-03 | Cart validation 30s timeout with fallback | SATISFIED (human confirm) | 30s AbortController, `timedOut` state, banner in 2 consumers |
| CFIX-06 | 110-01 | React Query 3 retries with exponential backoff | SATISFIED | `shouldRetryQuery` + `queryRetryDelay` + `mutations: { retry: false }` |
| DATA-02 | 110-01 | Query key factory centralizes cache keys | SATISFIED | `src/lib/queryKeys.ts`, all 3 hooks migrated |

**Score: 7/7 requirements satisfied.** CFIX-01 through CFIX-05 have confirmed code implementations but require browser testing to satisfy the visual/behavioral element of each success criterion.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| All 31 Phase 110 files | — | CRLF line endings | INFO | `pnpm format:check` exits 1. Root cause: `git config core.autocrlf=true` on Windows converts LF→CRLF on checkout. Files were authored with LF (confirmed via `git show`). Not a code correctness issue — no behavior change. |
| `src/app/(admin)/admin/sections/page.tsx` | 221 | Pre-existing Prettier format | INFO | Pre-Phase-110 file (last touched in commit `a0509b3e`). Substantive line-length issue, out of scope. |

**Note on format:check failure:** The `pnpm format:check` command exits 1 in this Windows environment. This is an environment-side effect of `core.autocrlf=true`, not a Phase 110 implementation fault. The prettier config has no `endOfLine` setting, so Prettier defaults to `lf` while Windows git checkout writes `crlf`. All 31 failing Phase 110 files have identical content when CRLF is stripped — no substantive formatting issues. The `sections/page.tsx` failure predates Phase 110. ESLint, TypeScript, and the full test suite all pass cleanly.

**Severity:** Neither pattern is a blocker. The CRLF issue can be resolved by adding `"endOfLine": "auto"` to `.prettierrc` or by configuring `core.autocrlf=false` in git.

---

### Cross-Phase Contract Verification

| Contract | Phase | Check | Result |
|----------|-------|-------|--------|
| `getZonedDayOfWeek(TIMEZONE)` in cutoff code | 106 | `getZonedDayOfWeek` defined at delivery-dates.ts:106; called at lines 238 and 280 for cutoff logic. `getUTCDay()` calls at 108, 114, 210 operate on UTC dates reconstructed from zoned parts — semantically equivalent | PASS |
| `checkoutLimiter` (3/1m) on `/api/checkout/session` | 84 | `checkoutLimiter` imported + applied at route.ts:119 | PASS |
| No `as any` policy | 104 | 0 matches across all 12 Phase 110 modified files | PASS |
| `void asyncFn()` ban | Gotchas | 0 matches in all Phase 110 modified files | PASS |
| `cart-store.ts` untouched (BUG-06) | 81 | `git log cart-store.ts` — last commit is `2bfbda00` (pre-Phase-110, direction-based routing) | PASS |
| Phase 108 retry honoring 429 | 108 | `shouldRetryQuery`: `status === 429 → true` with exponential backoff; `/api/checkout/session` is a mutation → `retry: false` → 429 from `checkoutLimiter` is never retried | PASS |
| mutations `retry: false` (double-charge protection) | 110-01 | Literal `mutations: { retry: false }` at query-provider.tsx:56-58, verified by Vitest | PASS |

---

### Verification Suite Results

| Command | Result | Notes |
|---------|--------|-------|
| `pnpm lint` | PASS (exit 0) | Zero ESLint errors or warnings |
| `pnpm lint:css` | PASS (exit 0) | Zero Stylelint issues |
| `pnpm typecheck` | PASS (exit 0) | TypeScript strict mode clean, zero `as any` |
| `pnpm test --run` | PASS (exit 0) | **900/900 tests, 54 files** (32 new Phase 110 tests + 868 existing, all green) |
| `pnpm build` | PASS (exit 0) | Next.js + Serwist SW built successfully (568.7KB) |
| `pnpm format:check` | FAIL (exit 1) | 32 files with Prettier issues — 31 are CRLF artifacts from Windows git checkout (`core.autocrlf=true`), 1 (`sections/page.tsx`) is a pre-existing issue from commit `a0509b3e`. Not a Phase 110 code defect. |

---

### Human Verification Required

#### 1. Mobile Cart — No White Flash

**Test:** Open Chrome DevTools → Device Toolbar → iPhone 12 (390×844). Navigate to `/cart`. Throttle CPU to 4x slowdown.
**Expected:** CartPageContent appears immediately without any blank white frame. Zero "Warning: Prop ... did not match" in the Console.
**Why human:** White flash is a perceptual timing artifact. The code contract (CSS-only responsive, identical SSR/CSR markup) is verified, but the subjective absence of flash needs a real browser under CPU throttle.

#### 2. Empty Cart /checkout Direct-Link

**Test:** Clear IndexedDB (Application → Storage → Clear). Navigate directly to `http://localhost:3000/checkout`.
**Expected:** EmptyCheckoutError renders immediately ("Your cart is empty" heading + "Browse Menu" button). No spinner frame visible, no toast, no redirect.
**Why human:** The render-time guard is code-verified, but "zero spinner frame" is a perceptual guarantee requiring browser observation.

#### 3. Cutoff Modal Disables Submit + Blocks Keyboard

**Test:** Simulate post-cutoff state (mock `gate.isOpen = false`). On the /checkout payment step, the Place Order button must appear disabled (greyed out, `pointer-events-none`). Press Tab to focus the button, then press Enter. Check DevTools Network for any `/api/checkout/session` requests.
**Expected:** Zero network requests fired. Button is visually disabled. Keyboard Enter on the focused submit button has no effect.
**Why human:** HTML `disabled` + handler guard are code-verified, but keyboard bypass behavior requires browser testing.

#### 4. Stripe 10s Timeout — Error + Retry

**Test:** In DevTools → Network, set a condition to block/delay `/api/checkout/session` for 15 seconds. Attempt checkout.
**Expected:** After ~10 seconds, a destructive toast appears ("payment timed out" or similar) that does NOT auto-dismiss. An inline error banner shows with a "Try Again" button. Clicking Try Again fires a new `/api/checkout/session` request with the same order ID (confirm in Network tab — same `orderId` in request body, no duplicate order in DB).
**Why human:** Requires network throttling tool. AbortController code is verified, but the live 10s wait + toast persistence + retry idempotency needs end-to-end observation.

#### 5. Cart Validation 30s Timeout — Banner in Both Consumers

**Test:** Throttle `/api/menu` to > 30s in DevTools. Navigate to /cart (full page) — CartValidationTimeoutBanner should appear. Then open the cart drawer — CartValidationTimeoutBanner should appear there too. Click "Proceed Anyway" in either location.
**Expected:** Banner renders in both CartPageContent and CartDrawer after ~30s stall. Banner copy: "Validation taking longer than usual." Proceed Anyway button appears, is at least 44px tall, and clicking it dismisses the banner and enables the checkout button.
**Why human:** Requires a 30s network stall. Banner wiring to both consumers is code-verified, but the full timeout→banner→dismiss flow requires browser testing.

---

### Gaps Summary

No code-level gaps found. All 5 ROADMAP success criteria have complete, wired, data-flowing implementations. All 7 requirements (CFIX-01 through CFIX-06, DATA-02) are satisfied at the code level.

The `human_needed` status reflects that CFIX-01 through CFIX-05 are behavioral/visual requirements that cannot be fully confirmed by static analysis — they require a browser with network throttling or CPU throttling to observe the actual UX.

The `format:check` failure is a Windows environment artifact (`core.autocrlf=true` converting LF→CRLF on checkout), not a Phase 110 code defect. It does not affect runtime behavior, build output, type safety, or test results.

---

_Verified: 2026-04-07T22:10:00Z_
_Verifier: Claude (gsd-verifier)_
