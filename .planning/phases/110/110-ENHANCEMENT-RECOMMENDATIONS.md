# Phase 110: Critical Fixes & Data Reliability — Enhancement Recommendations

## Priority Matrix

| #  | Enhancement                                             | Priority    | Effort | Impact                                     |
|----|---------------------------------------------------------|-------------|--------|--------------------------------------------|
| 1  | DATA-02: Query key factory + migrate 3 hooks            | MUST-HAVE   | Low    | Critical — unblocks Phase 111/115          |
| 2  | CFIX-06: Configure React Query retry (queries only)     | MUST-HAVE   | Low    | Critical — eliminates transient failures   |
| 3  | CFIX-01: CSS-only mobile cart (remove useEffect)        | MUST-HAVE   | Low    | High — eliminates white flash on mobile    |
| 4  | CFIX-02: Render-time empty cart guard                   | MUST-HAVE   | Low    | High — fixes spinner-redirect loop         |
| 5  | CFIX-03: Defense-in-depth cutoff submit disable         | MUST-HAVE   | Low    | Critical — prevents post-cutoff orders     |
| 6  | CFIX-05: Cart validation timeout + Proceed Anyway       | MUST-HAVE   | Medium | High — no infinite spinners                |
| 7  | CFIX-04: Stripe AbortController timeout + retry         | MUST-HAVE   | Medium | Critical — no silent payment failures      |
| 8  | Add `persistent: true` flag to useToast for criticals   | SHOULD-HAVE | Low    | Medium — error toasts must not auto-vanish |
| 9  | Re-audit Stripe idempotency strategy at route.ts:393    | SHOULD-HAVE | Low    | High — avoid duplicate-order risk on retry |
| 10 | useEffect cleanup audit across all 7 fixes              | SHOULD-HAVE | Low    | High — prevents memory leak regressions    |
| 11 | Centralize new error code constants in shared enum      | NICE-TO-HAVE| Low    | Low — discoverability for Phase 111+       |
| 12 | Add Storybook stories for EmptyCheckoutError            | NICE-TO-HAVE| Low    | Low — visual regression coverage           |

---

## Detailed Recommendations

### 1. DATA-02: Query Key Factory + Migrate 3 Hooks (MUST-HAVE)

**What**: Create `src/lib/queryKeys.ts` exporting a typed factory object, then migrate `useMenu.ts`, `useAddresses.ts`, `useOrderHistorySearch.ts` to use factory keys instead of inline arrays.

**Why**: Phase 111 (form state recovery + price polling) and Phase 115 (optimistic cart updates) BOTH require centralized cache invalidation. Currently, 12+ inline arrays scattered across hooks make it impossible to invalidate consistently — a search hook caches under `["menu", "search", q]` while invalidation tries `["menu"]` and misses. Without this, future phases will hit cache staleness bugs.

**Design compliance**: Foundation for v2.3 data layer goals. No UI surface change.

**Implementation hint**:
```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  menu: {
    all: ['menu'] as const,
    list: () => [...queryKeys.menu.all, 'list'] as const,
    search: (q: string) => [...queryKeys.menu.all, 'search', q] as const,
  },
  addresses: { all: ['addresses'] as const, list: () => [...queryKeys.addresses.all, 'list'] as const },
  orders: { all: ['orders'] as const, history: () => [...queryKeys.orders.all, 'history'] as const },
} as const;
```
Migrate sites: 3 hooks, ~12 inline arrays. Verify zero `as any` casts.

---

### 2. CFIX-06: Configure React Query Retry (MUST-HAVE)

**What**: In `src/lib/providers/query-provider.tsx`, set `defaultOptions.queries.retry: 3` with exponential backoff `Math.min(1000 * 2 ** attemptIndex, 30000)`. Filter retries to 5xx + 429 + network errors only. **Mutations: NO retry.**

**Why**: Default React Query has zero retries — single transient failures become permanent. Mutations must NOT retry: a retried `add to cart` could double-add, a retried checkout could double-charge. This split matches React Query's own defaults but the project's `query-provider.tsx` doesn't make it explicit, leaving room for future drift.

**Design compliance**: Customer trust principle "Errors must offer retry OR alternative" (PRECONTEXT §7).

**Implementation hint**:
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (failureCount >= 3) return false;
        const status = error?.status ?? 0;
        return status >= 500 || status === 429 || status === 0;
      },
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    },
    mutations: { retry: false },
  },
});
```

---

### 3. CFIX-01: CSS-Only Mobile Cart Approach (MUST-HAVE)

**What**: Remove the `useEffect` mobile redirect in `src/app/(customer)/cart/page.tsx` (lines 18-23). Replace with Tailwind responsive classes `md:hidden` / `hidden md:block` so the appropriate cart view renders without JS.

**Why**: The current `useEffect` runs AFTER hydration, so during the first render the cart page returns `null` → ~100ms blank screen → then redirect or render. Zustand+IDB hydration is async, compounding the race. CSS-only responsive eliminates the JS branching entirely → zero flash, zero hydration mismatch warnings.

**Design compliance**: Audit C1 (cart mobile white flash). Customer trust principle "no broken states".

**Implementation hint**: Drop the `useIsMobile()` hook usage entirely from this page. Wrap desktop content in `<div className="hidden md:block">` and provide a mobile-specific subview in `<div className="md:hidden">` that links to the cart drawer or shows the simplified mobile cart. No new component file needed.

---

### 4. CFIX-02: Render-Time Empty Cart Guard (MUST-HAVE)

**What**: In `CheckoutClient.tsx`, replace any `useEffect`-based empty cart redirect with a synchronous render-time check: read `useCart().isEmpty` before any other JSX, and return `<EmptyCheckoutError />` immediately if empty.

**Why**: Cart store is client-only (Zustand + IDB), so server components can't read it. Current `useEffect` approach causes spinner-then-redirect loop when deep-linking to `/checkout` with empty cart. By the time React renders, hydration is complete — the synchronous check is safe.

**Design compliance**: Audit C2. Forbidden anti-pattern: spinner-redirect loops (PRECONTEXT §7).

**Implementation hint**:
```tsx
// CheckoutClient.tsx — top of return
const isEmpty = useCart((s) => s.items.length === 0);
if (isEmpty) return <EmptyCheckoutError />;
```
Create `src/components/ui/checkout/EmptyCheckoutError.tsx` (~40 lines) with friendly copy + "Browse Menu" CTA. Use `fade-in` (existing token) for entrance.

---

### 5. CFIX-03: Defense-in-Depth Cutoff Submit Disable (MUST-HAVE)

**What**: When `CutoffModal` is open, BOTH (a) pass `disabled={cutoffModalOpen}` to PaymentStepV8's submit button, AND (b) early-return from `handleCheckout` if `cutoffModalOpen` is true.

**Why**: HTML `disabled` alone is bypassable: keyboard `Enter` on a focused form can submit even with a disabled button in some browsers. Handler guard alone doesn't prevent visual confusion (button looks clickable). Combining both gives true defense in depth — visual + behavioral. Server already returns `CUTOFF_PASSED`, but a race could submit a valid order if user clicks "Submit" microseconds after cutoff fires.

**Design compliance**: Audit C3. Customer trust principle "Disabled buttons must show WHY" — modal IS the explanation (PRECONTEXT §7).

**Implementation hint**:
```tsx
// CheckoutClient.tsx
<PaymentStepV8 cutoffModalOpen={showCutoffModal} ... />

// PaymentStepV8.tsx handleCheckout (line 86)
async function handleCheckout(e: FormEvent) {
  e.preventDefault();
  if (cutoffModalOpen) return; // early guard
  // ... existing logic
}

// Submit button (line 382)
<Button type="submit" disabled={isCreatingSession || cutoffModalOpen}>
```

---

### 6. CFIX-05: Cart Validation Timeout + Proceed Anyway (MUST-HAVE)

**What**: In `useCartValidation.ts`, wrap the menu refetch (lines 142-154) in an `AbortController` with a 30s timeout. Add a new state `timedOut: boolean`. When triggered, expose a `proceedAnyway` action and render fallback UI: "Validation is taking longer than usual. Proceed anyway?"

**Why**: Audit H1: cart validation has no timeout — slow networks freeze the cart UI indefinitely. Auto-retry would be a silent failure (audit L7 forbids silent fallbacks). Customer agency wins: explicit button for "I understand, let me through" preserves trust without auto-overriding safety. 30s is conservative — p99 is ~3s, so true hangs are the only triggers.

**Design compliance**: Customer trust principle "Timeouts must surface explicit error states" (PRECONTEXT §7). Forbidden: silent retries.

**Implementation hint**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30_000);
try {
  await refetch({ signal: controller.signal });
} catch (err) {
  if (err.name === 'AbortError') setTimedOut(true);
} finally {
  clearTimeout(timeoutId);
}
```
**Critical**: cleanup MUST live in `useEffect` return (gotcha #9). Add `proceedAnyway: () => setTimedOut(false)` to bypass blocking gate without re-validating.

---

### 7. CFIX-04: Stripe AbortController Timeout + Retry (MUST-HAVE)

**What**: In `PaymentStepV8.tsx` `handleCheckout`, wrap the `fetch('/api/checkout/session')` call in an `AbortController` with a **10s** timeout. On `AbortError`, set error state with code `CHECKOUT_NETWORK_TIMEOUT` and a "Try Again" button that resubmits the form (does NOT clear form state, does NOT recreate the session client-side).

**Why**: Stripe session creation can hang on network instability or rate limit propagation. p99 latency is ~5s; 10s leaves headroom. The retry MUST resubmit the form (not call Stripe directly) so the existing idempotency key `checkout_${order.id}` is reused — recreating the session would create a duplicate order. This is the most nuanced fix in Phase 110.

**Design compliance**: Audit C5. Customer trust principles: "Errors must offer retry OR alternative" + "Form state must survive transient errors" (PRECONTEXT §7).

**Implementation hint**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10_000);
try {
  const res = await fetch('/api/checkout/session', { signal: controller.signal, ... });
  // existing branches
} catch (err) {
  if (err.name === 'AbortError') {
    setError({ code: 'CHECKOUT_NETWORK_TIMEOUT', message: 'Payment service is slow to respond. Try again?' });
  }
} finally {
  clearTimeout(timeoutId);
  setIsCreatingSession(false);
}
```
Cleanup in `useEffect` return on unmount.

---

### 8. Add `persistent: true` Flag to useToast for Critical Errors (SHOULD-HAVE)

**What**: Extend `src/lib/hooks/useToast.ts` to accept a `persistent: boolean` option. When true, suppress the `TOAST_REMOVE_DELAY` (5000ms) auto-dismiss. Use for `CHECKOUT_NETWORK_TIMEOUT` and `CART_VALIDATION_TIMEOUT` toasts.

**Why**: Existing toast hook auto-dismisses after 5s — fine for "Item added to cart" but **dangerous for critical errors**. A customer who looks away during a Stripe timeout loses the error message before they can act. Forbidden anti-pattern (PRECONTEXT §7): "Toast-then-vanish for critical errors".

**Design compliance**: Single design token gap surfaced in PRECONTEXT §14.

**Implementation hint**:
```typescript
// useToast.ts — add to options type
export interface ToastOptions {
  // ...existing
  persistent?: boolean;
}

// In timeout setup
if (!options.persistent) {
  setTimeout(() => removeToast(id), TOAST_REMOVE_DELAY);
}
```
Pair with explicit "Dismiss" button in toast variant when persistent.

---

### 9. Re-Audit Stripe Idempotency Strategy at route.ts:393 (SHOULD-HAVE)

**What**: Add a code comment + risk note at `src/app/api/checkout/session/route.ts:392-394` documenting that the idempotency key `checkout_${order.id}` is constructed AFTER the order RPC completes. If the order RPC succeeds but Stripe fails, retrying with the same form input will hit a different code path (order already exists).

**Why**: Gotcha #7 in PRECONTEXT §5. CFIX-04 (Stripe timeout retry) directly exercises this path. Phase 110 doesn't FIX this (out of scope), but planning MUST acknowledge it so the retry behavior in CFIX-04 doesn't accidentally create duplicate orders. The ideal fix (move Stripe call before order creation, or use a deterministic key from cart hash) is a Phase 111+ concern.

**Design compliance**: Risk documentation, not functional change.

**Implementation hint**:
```typescript
// route.ts:392 — add comment
// TODO(Phase 111+): If Stripe call below fails after order RPC succeeds,
// client-side retry will hit a different branch. Current behavior: retry
// resubmits form → server detects existing order → returns existing session.
// Verify this branch in CheckoutClient does not create duplicate session.
const session = await stripe.checkout.sessions.create({
  // ...
}, { idempotencyKey: `checkout_${order.id}` });
```
Phase 110 plan should add a Playwright E2E test exercising this race.

---

### 10. useEffect Cleanup Audit Across All 7 Fixes (SHOULD-HAVE)

**What**: Before merging, manually audit every `useEffect` modified or created in Phase 110 for a return cleanup function that clears intervals, aborts controllers, removes listeners, or releases resources.

**Why**: Gotcha #9 in PRECONTEXT §5: "useEffect cleanup gaps in 5 of 7 fixes". This is the highest cross-cutting risk in Phase 110. Missing cleanup in CFIX-04 means orphaned `setTimeout` after unmount. Missing in CFIX-05 means abort never fires. Missing in DATA-02 hook migration means stale closures. Audit is the only defense; lint cannot catch all cases.

**Design compliance**: Customer trust — no memory leak regressions.

**Implementation hint**: Checklist for each useEffect in modified files:
- [ ] All `setTimeout` paired with `clearTimeout` in return
- [ ] All `AbortController.abort()` called in return
- [ ] All event listeners removed in return
- [ ] All `subscribe()` calls returned for unsubscribe
- [ ] No dangling `void asyncFn()` patterns (Vercel kills these)

Grep target: `useEffect\(\(\) => \{[^}]*\}, \[\]\)` without `return` inside.

---

### 11. Centralize New Error Code Constants in Shared Enum (NICE-TO-HAVE)

**What**: Create or extend an existing error code enum (likely `src/types/errors.ts` or similar) to include `CHECKOUT_NETWORK_TIMEOUT` and `CART_VALIDATION_TIMEOUT` as exported string literal types.

**Why**: Both new error codes are client-only (server doesn't emit them). Phase 111 will need to map them to specific recovery UI. Centralizing makes them grep-discoverable and prevents typos in handlers.

**Design compliance**: Codebase hygiene, no UX surface.

**Implementation hint**:
```typescript
// src/types/errors.ts
export const ClientErrorCodes = {
  CHECKOUT_NETWORK_TIMEOUT: 'CHECKOUT_NETWORK_TIMEOUT',
  CART_VALIDATION_TIMEOUT: 'CART_VALIDATION_TIMEOUT',
} as const;
export type ClientErrorCode = typeof ClientErrorCodes[keyof typeof ClientErrorCodes];
```
Reference in PaymentStepV8 + useCartValidation instead of inline strings.

---

### 12. Add Storybook Stories for EmptyCheckoutError (NICE-TO-HAVE)

**What**: When creating `src/components/ui/checkout/EmptyCheckoutError.tsx`, add a sibling `EmptyCheckoutError.stories.tsx` with at least two stories: default state and dark mode variant.

**Why**: Phase 110 introduces one net-new UI component. Storybook coverage prevents Phase 113 (A11Y) and Phase 116 (Polish) from accidentally regressing it. Negligible cost (~10 lines), permanent value.

**Design compliance**: Project convention — UI components have stories where practical.

**Implementation hint**: Use existing checkout story patterns. Wrap in `Meta` with `parameters: { layout: 'centered' }`. Add `viewport: 'mobile1'` variant story.

---

## Implementation Phases (Suggested Plan Split)

### Plan 1: Foundation (DATA-02 + CFIX-06)
- Create query key factory (rec 1)
- Migrate 3 hooks to factory (rec 1)
- Configure React Query retry (rec 2)
- Audit cleanup (rec 10) for migrated hooks

### Plan 2: Cart/Checkout UI Guards (CFIX-01 + CFIX-02 + CFIX-03)
- CSS-only mobile cart (rec 3)
- Render-time empty cart guard + EmptyCheckoutError component (rec 4)
- Cutoff modal defense-in-depth disable (rec 5)
- Storybook stories for EmptyCheckoutError (rec 12)

### Plan 3: Network Timeout Resilience (CFIX-05 + CFIX-04 + Toasts)
- Cart validation 30s timeout + Proceed Anyway (rec 6)
- `persistent: true` flag on useToast (rec 8)
- Stripe 10s timeout + retry (rec 7)
- Re-audit Stripe idempotency comment (rec 9)
- Centralize new error codes (rec 11)
- Final cleanup audit across all useEffects (rec 10)

---

**Next step:** Run `/gsd-plan-phase 110` consuming both this file and `110-PRECONTEXT-RESEARCH.md`.
