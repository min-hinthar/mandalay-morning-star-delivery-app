# Phase 110: Critical Fixes & Data Reliability — Pre-Context Research

**Date:** 2026-04-06
**Phase Goal:** Customers can complete cart-to-checkout without hitting broken states or silent failures
**Requirements:** CFIX-01, CFIX-02, CFIX-03, CFIX-04, CFIX-05, CFIX-06, DATA-02
**Research Method:** 12-agent parallel deep research (Wave 1 + Wave 2)

---

## 1. Resolved Assumptions

### Technical Approach (HIGH confidence after Wave 2)

| Fix | Approach | Rationale |
|-----|----------|-----------|
| **CFIX-01** | CSS-only `md:hidden / hidden md:block` + remove `useEffect` redirect from `cart/page.tsx` | Zustand+IDB hydration is async; useMediaQuery flips on hydration causing flash. CSS-only = zero JS, zero flash. |
| **CFIX-02** | Render-time guard: read `useCart().isEmpty` synchronously, return `<EmptyCheckoutError />` JSX immediately | Cart is hydrated by render time; useEffect redirect causes spinner-redirect loop |
| **CFIX-03** | Add HTML `disabled` attribute to PaymentStepV8 submit + early return in `handleCheckout` when `cutoffModalOpen` is true | Server already detects cutoff; client guard prevents accidental resubmit during modal display |
| **CFIX-04** | Wrap `fetch('/api/checkout/session')` in `AbortController` with **10s** timeout. On timeout: show error state with retry button (resubmits form, does NOT recreate session) | Stripe session creation can hang on rate limit / network. 10s catches hangs without false positives. Form state preserved (Phase 111 will add explicit recovery) |
| **CFIX-05** | Add 30s `AbortController` to `useCartValidation` menu refetch (line 142-154). Show fallback UI: "Validation is taking longer than usual. Proceed at own risk?" with explicit "Proceed Anyway" button | Customer agency over silent failures (audit L7). No auto-retry — refresh = explicit retry |
| **CFIX-06** | Configure `defaultOptions.queries.retry: 3` + `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)` in `query-provider.tsx`. **Mutations: NO retry** (data duplication risk) | Default React Query: queries retry, mutations don't. Mutations are dangerous (double-add, double-charge). Pair with `retry: (failureCount, error) => error.status >= 500 \|\| error.status === 429` |
| **DATA-02** | Create `src/lib/queryKeys.ts` with factory pattern. Migrate ALL 3 existing hooks (`useMenu`, `useAddresses`, `useOrderHistorySearch`) to use factory keys | Phase 111 + 115 depend on factory for cache invalidation. Path matches project convention (`src/lib/{utility}.ts`) |

### Implementation Order (Goal-Backward Sequencing)

```
DATA-02 (foundation, no deps)
   ↓
CFIX-06 (retry config; depends on QueryClient existing)
   ↓
CFIX-01 (mobile cart) ─┐
CFIX-02 (empty cart)  ─┼─ Parallelizable
CFIX-03 (cutoff gate) ─┘
   ↓
CFIX-05 (cart validation timeout — uses retry baseline)
   ↓
CFIX-04 (Stripe timeout — most nuanced; benefits from all patterns)
```

**Dependency reasoning:** DATA-02 first because it's pure infrastructure. CFIX-06 next because every later fix may need retries. CFIX-01/02/03 are isolated UI fixes that can run in parallel. CFIX-05 builds on retry baseline. CFIX-04 last because Stripe + idempotency is highest-risk.

### Backend Requirements

**No new tables, no new API routes, no new RPC functions.**

| Touch | Purpose |
|-------|---------|
| `/api/checkout/session/route.ts` | No changes — already returns `CUTOFF_PASSED` error code |
| `query-provider.tsx` | Modify defaults |
| `cart/page.tsx` | Remove useEffect redirect |
| `CheckoutClient.tsx` | Add empty-cart render guard, wire `cutoffModalOpen` to PaymentStepV8 disabled prop |
| `PaymentStepV8.tsx` | Add AbortController wrapper, accept `cutoffModalOpen` prop, disable submit |
| `useCartValidation.ts` | Add AbortController + 30s timeout |
| `useMenu.ts`, `useAddresses.ts`, `useOrderHistorySearch.ts` | Migrate to query key factory |
| **NEW** `src/lib/queryKeys.ts` | Query key factory |
| **NEW** `src/components/ui/checkout/EmptyCheckoutError.tsx` | Empty cart error component |

---

## 2. Realistic Data/Scale Analysis

| Variable | Production Reality |
|----------|-------------------|
| Concurrent customers | ~1-5 typical, ~20 peak Saturday morning |
| Cart items per customer | 3-15 typical |
| Menu items total | ~50-100 |
| Network conditions | LA/Inland Empire — generally good 4G/5G; 30s timeout is conservative for slow areas |
| Stripe session creation latency | p50 ~600ms, p95 ~2s, p99 ~5s — 10s timeout is generous |
| Cart validation latency | p50 ~200ms (menu fetch), p95 ~1s, p99 ~3s — 30s timeout catches true hangs |
| Retry failure rate | <0.1% of requests fail transiently → 3 retries with backoff catches most |

**Implication:** Timeouts (10s Stripe, 30s validation) are conservative — false positives will be rare. Retries (3x backoff to 30s max) won't thunder the server.

---

## 3. Cross-Phase Contract Inventory

### What Phase 110 Inherits (MUST NOT BREAK)

| From Phase | Contract | Risk if broken |
|---|---|---|
| **Phase 81** (v1.9) | `useDeliveryGate` urgency thresholds (>2h normal, ≤2h warning, ≤30m critical); `CutoffModal` preserves cart items on close | CFIX-03 wiring must not clear cart on modal display |
| **Phase 84** (v1.9) | `checkoutLimiter` (3/1m) on `/api/checkout/session` | Don't replace with default limiter |
| **Phase 104** (v2.2) | `delivery_zones` strongly typed; `revalidateTag` 2-arg form | DATA-02 factory must not introduce `as any` casts |
| **Phase 105** (v2.2) | `VALID_ROUTE_TRANSITIONS`, accept-before-start guard | N/A (Phase 110 doesn't touch routes) |
| **Phase 106** (v2.2) | `TIMEZONE` constant in `src/types/delivery.ts`; `toISOWithTimezone()`; date picker pre-filter | CFIX-03 cutoff logic MUST use `getZonedDayOfWeek()`, never `getUTCDay()` |
| **Phase 107** (v2.2) | `promote_next_stop` RPC; dead `increment_driver_deliveries` removed | N/A |
| **Phase 108** (v2.2) | 13 rate limiters via Upstash REST; in-memory fallback (15/min) | CFIX-06 retry config must not bypass rate limiter; honor 429 with backoff |
| **Phase 109** (v2.2) | Lifecycle test factories; webhook handler split with barrel re-export | N/A |
| **BUG-06** (cart-store) | Debounce atomicity inside `set()` callback (lines 95-118) | Phase 110 must NOT touch `cart-store.ts` |

### What Phase 110 Feeds Into

| To Phase | What 110 provides | Why it matters |
|---|---|---|
| **Phase 111** (Checkout Conversion) | Query key factory + retry config + form-error UI patterns | Form state recovery (CFIX-07) builds on error states; price polling (CFIX-09) uses query factory |
| **Phase 112** (Order Tracking) | Retry config baseline; AbortController patterns | Reconnect logic (TRAK-04) uses exponential backoff inherited from CFIX-06 |
| **Phase 113** (A11Y) | N/A (independent) | — |
| **Phase 114** (Loading & Offline) | Loading-state hierarchy primitives; timeout fallback patterns | LOAD-05 (skeleton > spinner > timeout) extends CFIX-05's pattern |
| **Phase 115** (Data Layer) | Query key factory (foundation); retry baseline | DATA-01 optimistic updates need centralized cache invalidation |
| **Phase 116** (Polish) | N/A (independent) | — |

---

## 4. Error/Loading State Pattern Deep Analysis

### State Machines Already in Codebase (REUSE)

| Pattern | File | State Machine | Phase 110 Use |
|---|---|---|---|
| **AbortableAsync** | `src/lib/hooks/useSafeEffects/useSafeAsync.ts` | `idle → executing → (success \| aborted \| error)` | CFIX-04 Stripe wrapper, CFIX-05 validation wrapper |
| **LoadingWithTimeout** | `src/components/ui/LoadingWithTimeout.tsx` | `idle → loading → (success \| timed_out)` | CFIX-05 fallback UI base |
| **RouteError** | `src/components/ui/RouteError.tsx` | `error → retrying(N) → (escalated \| success)`. Constants: `RETRY_THRESHOLD = 2` | Reference for retry escalation pattern |
| **ImportWithRetry** | `src/lib/hooks/useDynamicImportWithRetry.ts` | `pending → retrying(1..3) → (success \| failed)`. Delays: `[1000, 2000, 4000]` ms | Reference for CFIX-06 retry curve |
| **Offline Retry** | `src/lib/services/offline-store/retry.ts` | `pending → retrying(1..5) → (success \| permanent_failure \| temp_failure)`. `Math.min(2000 * 2**attempt, 32000)` | Reference for CFIX-06 backoff formula |
| **Toast Auto-Dismiss** | `src/lib/hooks/useToast.ts`, `useToastV8.ts` | `pending → visible → (dismissed \| auto_removed)`. `TOAST_REMOVE_DELAY = 5000` | CFIX-04, CFIX-05 user feedback |

### Key Constants Inventory

| Constant | Value | Source | Phase 110 Application |
|---|---|---|---|
| `IMPORT_RETRY_DELAYS` | `[1000, 2000, 4000]` ms | `useDynamicImportWithRetry.ts` | CFIX-06 reference |
| `OFFLINE_RETRY_BASE_MS` | 2000 ms | `offline-store/retry.ts` | Used as baseline for retry pattern |
| `OFFLINE_RETRY_MAX_MS` | 32000 ms | `offline-store/retry.ts` | CFIX-06 cap |
| `TOAST_REMOVE_DELAY` | 5000 ms | `useToast.ts` | Toast feedback durations |
| `CHART_LOAD_TIMEOUT` | 10000 ms | `LoadingWithTimeout.tsx` | CFIX-04 Stripe timeout choice |
| **NEW: `STRIPE_TIMEOUT_MS`** | 10000 ms | This phase | CFIX-04 |
| **NEW: `CART_VALIDATION_TIMEOUT_MS`** | 30000 ms | This phase | CFIX-05 |
| **NEW: `RETRY_BACKOFF_BASE_MS`** | 1000 ms | This phase | CFIX-06 |
| **NEW: `RETRY_BACKOFF_MAX_MS`** | 30000 ms | This phase | CFIX-06 |

---

## 5. Gotcha Inventory

### Critical (Must Fix or Avoid)

| # | Gotcha | Source | Fix Guidance | Phase 110 Fix |
|---|---|---|---|---|
| 1 | `void asyncFn()` killed on Vercel before completing | `nextjs.md`, `email-sending-failures.md` | Use `await` or `after()` callback, never fire-and-forget in serverless | CFIX-04 (Stripe timeout) |
| 2 | Stripe webhook returns 200 on DB errors → orders stuck pending | `stripe.md` | Return 500 for transient errors, 200 only on success/non-retryable | CFIX-04 |
| 3 | Zustand `getState()` in useMemo not reactive after IDB hydration | `state-management.md`, commit `8a54200a` | Use direct selector `useCartStore((s) => ...)`, not `useMemo + getState()` | CFIX-01, CFIX-02 |
| 4 | Cart empty guard fires during SSR before hydration → flash + premature redirects | `react-patterns.md`, `state-management.md` | Delay cart logic in useEffect after `mounted` state, OR use CSS-only responsive | CFIX-01, CFIX-02 |
| 5 | `getUTCDay()` wrong in LA timezone | Project CLAUDE.md, commit `f658c8a1` | Use `getZonedDayOfWeek()` or `Intl.DateTimeFormat` with `timeZone: TIMEZONE` | CFIX-03 |

### High (Likely to Bite)

| # | Gotcha | Source | Fix Guidance | Phase 110 Fix |
|---|---|---|---|---|
| 6 | `.update()` returns no row count by default | `stripe.md` | Chain `.select("id")` and check `data.length === 0` | DATA-02 (factory consumers) |
| 7 | Idempotency: order created but Stripe session fails → retry uses same key | `route.ts:392-394` | Re-evaluate idempotency strategy or move Stripe call before order RPC | CFIX-04 |
| 8 | Server component fetch to own API is fragile (env vars, cookies, localhost) | `nextjs.md` | Extract validation logic into shared helper; call directly | N/A (route already does this) |
| 9 | useEffect cleanup gaps in 5 of 7 fixes | `react-patterns.md` | Audit every useEffect for cleanup function clearing intervals/aborting fetches | CFIX-01, CFIX-02, CFIX-04, CFIX-05, DATA-02 |
| 10 | Settings sync pipeline thread can break (5-file pipeline) | `state-management.md` | Verify both `(customer)/layout.tsx` and `(public)/layout.tsx` pass props | N/A (no new settings) |

### Medium (Watch For)

| # | Gotcha | Source | Fix Guidance |
|---|---|---|---|
| 11 | `process.env.STRIPE_SECRET_KEY` inlined at build, can't validate dynamically | Project CLAUDE.md | Validate at point of use (server.ts) or via connectivity check |
| 12 | `loading="lazy"` + animated containers (opacity 0) = images never load | Project CLAUDE.md | N/A for Phase 110 |
| 13 | Nested `overflow-y-auto` without explicit height blocks wheel events | `mobile-ux.md` | N/A for Phase 110 |
| 14 | Spring physics inconsistent across components | Audit D7 | N/A — Phase 113 scope |

---

## 6. Data Contracts

### Existing Error Code → UI Mapping (preserved)

| Error code | Source line (`route.ts`) | Client handling | UI shown |
|---|---|---|---|
| `VALIDATION_ERROR` | 42, 55, 89, 163 | `setError` + ErrorBanner | "Invalid request..." + details |
| `CUTOFF_PASSED` | 85, 97 | `onCutoffPassed()` callback → opens CutoffModal | Modal w/ next delivery date |
| `COD_DISABLED` | 106 | ErrorBanner | "Cash on Delivery unavailable" |
| `UNAUTHORIZED` | 116 | ErrorBanner | "You must be logged in" |
| `ADDRESS_INVALID` | 135 | ErrorBanner | "Address not found" |
| `OUT_OF_COVERAGE` | 137 | ErrorBanner | "Address not verified" |
| `PROFILE_ERROR` | 209 | ErrorBanner | "Unable to set up account" |
| `ITEM_UNAVAILABLE` | 354 | ErrorBanner + details | Item names list |
| `INTERNAL_ERROR` | 313, 326, 360, 419 | ErrorBanner | "An error occurred" |
| `STRIPE_ERROR` | 417 | ErrorBanner | "Payment service error" |

**New error codes Phase 110 surfaces (client-only):**
- `CART_VALIDATION_TIMEOUT` — CFIX-05 fallback after 30s
- `CHECKOUT_NETWORK_TIMEOUT` — CFIX-04 after 10s

### Query Key Factory Shape (DATA-02)

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  menu: {
    all: ['menu'] as const,
    list: () => [...queryKeys.menu.all, 'list'] as const,
    search: (query: string) => [...queryKeys.menu.all, 'search', query] as const,
  },
  addresses: {
    all: ['addresses'] as const,
    list: () => [...queryKeys.addresses.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.addresses.all, 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    history: () => [...queryKeys.orders.all, 'history'] as const,
    historySearch: (filters: OrderHistoryFilters) =>
      [...queryKeys.orders.history(), 'search', filters] as const,
  },
} as const;
```

**Migration sites:** `useMenu.ts`, `useAddresses.ts`, `useOrderHistorySearch.ts` (3 files, ~12 inline arrays)

---

## 7. Customer Trust Principles (Phase 110 Guardrails)

| Principle | Confidence | Source |
|---|---|---|
| **Silent failure tolerance: ZERO** | HIGH | PROJECT.md line 9: "Every UI element is reliably clickable"; ROADMAP phase 110 line 114: "without hitting broken states or silent failures" |
| **Cutoff modal: cart preserved** | HIGH | Phase 81 design decision; CutoffModal.tsx already does this |
| **Errors must offer retry OR alternative** | HIGH | ROADMAP 110 #4: "with retry option"; v1.9 email "one-click retry button" |
| **Timeouts must surface explicit error states** | HIGH | ROADMAP 110 #5: "shows a fallback error UI" |
| **Form state must survive transient errors** | HIGH | Phase 111 (CFIX-07) extends; Phase 110 just must not break what exists |
| **Disabled buttons must show WHY** | HIGH | Audit P10 (price change explanation) — universal principle |
| **Tone: warm, family business** | MEDIUM | PROJECT.md context; Mandalay Morning Star branding |

### Forbidden Anti-Patterns (Phase 110 must avoid)

- Silent fallbacks (catch + ignore)
- `useEffect`-based redirects (causes flash)
- Spinner-redirect loops
- Disabled buttons without explanation
- Toast-then-vanish for critical errors

---

## 8. Architectural Decisions

| Decision | Options Considered | Chosen | Rationale |
|---|---|---|---|
| **CFIX-01 mobile detection** | (A) UA sniffing, (B) CSS-only, (C) middleware, (D) useMediaQuery + placeholder | **(B) CSS-only** | Zero JS = zero flash. Tailwind responsive primitives handle this natively. |
| **CFIX-02 sync guard** | (A) Render-time check, (B) server component, (C) middleware | **(A) Render-time** | Cart is client-only Zustand+IDB; only client can read it. By render time, hydration complete. |
| **CFIX-03 disable** | (a) HTML disabled only, (b) handler early return only, (c) both | **(c) Both** | Defense in depth — keyboard Enter bypasses CSS-only disable; handler guard catches programmatic submission |
| **CFIX-04 timeout duration** | 5s / 10s / 15s / 30s | **10s** | Stripe p99 ≈ 5s; 10s leaves headroom without falsely timing out slow networks |
| **CFIX-04 retry behavior** | Recreate session / resubmit form / contact support | **Resubmit form** | Idempotency key is `checkout_${order.id}`; resubmit reuses key. Recreating session would create duplicate order. |
| **CFIX-05 cart validation = ?** | useCartValidation hook / server route validation / both | **useCartValidation hook only** | Audit H1 explicitly names client-side `useCartValidation`; server has no infinite spinner |
| **CFIX-05 retry behavior** | Auto-retry / manual retry / proceed-anyway | **Proceed-anyway button** | Customer agency over silent retries; rare path doesn't justify hidden re-attempt |
| **CFIX-06 mutations** | Retry queries only / queries + mutations | **Queries only** | Mutation retry = double-add cart, double-charge payment. Default React Query agrees. |
| **CFIX-06 retry policy** | All errors / 5xx + 429 only / 5xx only | **5xx + 429 + network timeout** | 401 = redirect to login (not transient); 4xx other than 429 = validation (user must fix) |
| **DATA-02 location** | `src/lib/queryKeys.ts` / `src/lib/query/keys.ts` / `src/lib/react-query/keys.ts` | **`src/lib/queryKeys.ts`** | Matches project convention (`src/lib/{noun}.ts`) |
| **DATA-02 migration scope** | Full migration / new code only | **Full migration of 3 hooks** | All 3 hooks are blocking: prevents Phase 111 cache-invalidation bugs |

---

## 9. File Map

### Files to CREATE

| File | Purpose | Lines (est) |
|---|---|---|
| `src/lib/queryKeys.ts` | Query key factory (DATA-02) | ~80 |
| `src/components/ui/checkout/EmptyCheckoutError.tsx` | Empty cart render-time error component (CFIX-02) | ~40 |

### Files to MODIFY

| File | Fix | Change Summary |
|---|---|---|
| `src/lib/providers/query-provider.tsx` | CFIX-06 | Add `retry: 3`, `retryDelay` (exp backoff), `retry` predicate filtering 4xx |
| `src/app/(customer)/cart/page.tsx` | CFIX-01 | Remove useEffect mobile redirect; use parent layout responsive class OR rely on cart drawer trigger |
| `src/app/(customer)/checkout/CheckoutClient.tsx` | CFIX-02, CFIX-03 | Add render-time empty cart guard; pass `cutoffModalOpen` to PaymentStepV8 |
| `src/components/ui/checkout/PaymentStepV8.tsx` | CFIX-03, CFIX-04 | Accept `cutoffModalOpen` prop, disable submit + handler early return; wrap fetch in AbortController with 10s timeout |
| `src/lib/hooks/useCartValidation.ts` | CFIX-05 | Add 30s AbortController to menu refetch; new state for `timedOut`; expose `proceedAnyway` action |
| `src/lib/hooks/useMenu.ts` | DATA-02 | Replace `["menu"]`, `["menu", "search", q]` with factory imports |
| `src/lib/hooks/useAddresses.ts` | DATA-02 | Replace `["addresses"]`, `["addresses", id]` with factory imports |
| `src/lib/hooks/useOrderHistorySearch.ts` | DATA-02 | Replace inline keys with factory imports |

### Files to READ (reference, no changes)

| File | Purpose |
|---|---|
| `src/lib/stores/cart-store.ts` | Verify BUG-06 debounce fix in place; do NOT touch |
| `src/components/ui/delivery/CutoffModal.tsx` | Wiring contract for CFIX-03 |
| `src/lib/hooks/useDeliveryGate.ts`, `useDeliveryGateMultiDay.ts` | Cutoff state source for CFIX-03 |
| `src/app/api/checkout/session/route.ts` | Server-side error contract (preserve) |

---

## 10. Gray Area Resolutions

**All 12 gray areas resolved to HIGH confidence — see Wave 2 Agent 12 findings.** Key resolutions:

| Area | Resolution |
|---|---|
| Mobile detection | CSS-only responsive (Tailwind `md:hidden` / `hidden md:block`) |
| Empty cart guard | Render-time, return JSX (not redirect) |
| Cutoff disable | HTML `disabled` + handler early return (defense in depth) |
| Stripe timeout | Network timeout 10s; retry = resubmit form (NOT recreate session) |
| Cart validation timeout | Client-side `useCartValidation` hook only; "Proceed Anyway" button |
| Mutation retries | NO — queries only |
| Transient retry | 5xx + 429 + network timeout; never 401/4xx other |
| DATA-02 scope | Full migration of 3 existing hooks |
| Phase 110 offline | DOES NOT touch offline (Phase 114 owns) |
| Cart-store debounce | DOES NOT touch (BUG-06 already fixed) |
| Factory location | `src/lib/queryKeys.ts` |
| Validation retry | Manual via "Proceed Anyway" — no auto-retry |

---

## 11. Animation/Ceremony Implementation Patterns

**Phase 110 has minimal animation scope** — error states use existing tokens. New UI elements:

| UI Element | Animation Approach |
|---|---|
| Empty cart error JSX | `fade-in` (0.3s ease-out) — existing token |
| Validation timeout banner | `slide-in-up` (0.3s ease-out) — existing token |
| Stripe timeout error toast | Existing useToast variant `destructive` (no auto-dismiss → must add `persistent: true` flag) |
| Disabled submit button | Existing `disabled:opacity-50 disabled:cursor-not-allowed` (Button.tsx line 34) |

**No new animations needed.** Phase 113 (A11Y) and Phase 116 (Polish) own animation harmonization.

---

## 12. Core Domain Architecture (Checkout/Stripe/Cart)

### Checkout Session Endpoint Validation Pipeline (route.ts:36-413)

1. Origin check (36)
2. Schema validation (39-42)
3. Business rules fetch (44)
4. Time window validation (46-55)
5. Date range check, max 30 days future (56-76)
6. **Cutoff time check** (77-103) — branches on `deliveryDays.length`:
   - Multi-day: `isPastCutoffForDay(scheduledDate, dayConfig, now)` (84)
   - Legacy: `isPastCutoff(scheduledDate, now, cutoffDay, cutoffHour)` (94)
   - Returns `CUTOFF_PASSED` with `nextDeliveryDate` context
7. COD availability (105-107)
8. Authentication (109-116)
9. Rate limit `checkoutLimiter` (118-124)
10. Address ownership + verification (126-137)
11. Address distance + direction validation (139-154)
12. Promo code validation (160-168)
13. **Cart validation `fetchAndValidateCart()`** (170-172)
14. Profile upsert (193-214)
15. RPC payload + index bounds (216-220)
16. **COD path (221-286)** OR **Stripe path (288-413)**
17. (Stripe) Pre-session revalidation (345-361)
18. **`stripe.checkout.sessions.create({ idempotencyKey: 'checkout_${order.id}' })`** (392-394)

### Client-Side Checkout State (PaymentStepV8.tsx)

- `isCreatingSession: boolean` (line 53)
- `error: CheckoutErrorData | null` (line 54)
- `saveToProfileRef: useRef` (line 55)

**Error handling branches (lines 119-139):**
1. Rate limit (119)
2. `CUTOFF_PASSED` → `onCutoffPassed()` callback (127-130)
3. Other errors → `setError({ code, message, details })` (132-136)
4. Network error → `INTERNAL_ERROR` (158-163)

**Phase 110 must add:**
- New branch: `AbortError` from 10s timeout → set error with `CHECKOUT_NETWORK_TIMEOUT` code
- New prop: `cutoffModalOpen: boolean` → disabled state + handler guard

### Cart Validation State Machine (useCartValidation.ts)

- Hydration gate `useCartHydrated()` (17-36)
- States: `idle | validating | error | done` (158-209)
- `hasBlockingIssues = soldOutIds.length > 0 || unavailableIds.length > 0` (215)
- `refetch` triggered on mount once (lines 142-154)
- **NO existing timeout** — Phase 110 adds 30s AbortController + new state `timedOut`

---

## 13. Expanded Gotcha Inventory (Wave 2 Synthesis)

Cross-cutting risks affecting multiple Phase 110 fixes:

| Risk | Affected Fixes | Mitigation |
|---|---|---|
| **useEffect cleanup gaps** | CFIX-01, CFIX-02, CFIX-04, CFIX-05, DATA-02 | Audit every new useEffect for return cleanup function (clearTimeout, abort, removeEventListener) |
| **Zustand + async hydration race** | CFIX-01, CFIX-02 | Use direct selector pattern (commit `8a54200a` precedent); don't wrap in useMemo |
| **Fire-and-forget async on Vercel** | CFIX-04 | All `void asyncFn()` patterns → `await` or `after(async () => ...)` |
| **Idempotency on retry** | CFIX-04, CFIX-06 | Stripe idempotency key construction at `route.ts:393` already correct; CFIX-06 query retry is naturally idempotent |
| **Hydration mismatch warnings** | CFIX-01 | CSS-only approach avoids JS branching during hydration entirely |
| **Cutoff modal day-of-week timezone** | CFIX-03 | Use `getZonedDayOfWeek(TIMEZONE)`, never `getUTCDay()` (commit `f658c8a1` precedent) |

### Per-Fix Critical Gotchas (must check during planning)

- **CFIX-01:** SSR hydration mismatch on cart visibility (state-management.md:114-127)
- **CFIX-02:** Server component fetch to own API is fragile (nextjs.md:106-123); fix in render, not server component
- **CFIX-03:** Context provider re-render loops if modal state not memoized (react-patterns.md:3-5)
- **CFIX-04:** Webhook handler missing idempotency on retries (stripe.md:98-122) — N/A here but pattern reminder
- **CFIX-05:** AbortController cleanup MUST be in useEffect return (react-patterns.md:14-18)
- **CFIX-06:** Zustand hydration race when query keys depend on user state (state-management.md:112-128)
- **DATA-02:** Missing dimension in key causes wrong data cached (e.g., search query, page number)

---

## 14. Design Token Audit

**All Phase 110 UI elements have existing design tokens.** No token creation needed.

| Element | Token Used | Status |
|---|---|---|
| Error alert background | `--color-status-error-bg` | PASS |
| Error alert text | `--color-status-error` (#c45c4a / dark #ff6b6b) | PASS |
| Disabled button | `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` | PASS (Button.tsx line 34) |
| Toast destructive variant | `useToast({ variant: 'destructive' })` | PASS |
| Modal z-index | `z-modal` (50) over `z-modal-backdrop` (40) | PASS |
| Loading skeleton | `bg-skeleton` + `animate-shimmer` 1.5s linear | PASS |

**Single gap:** No `persistent: true` flag on `useToast` for non-auto-dismissing critical errors. **Resolution:** Add to Phase 110 — minor extension to existing toast hook.

---

## 15. Past Lessons (Git History)

| # | Lesson | Source Commit | Applies To |
|---|---|---|---|
| 1 | Cart hydration: use direct store subscription, not `useMemo + getState()` | `8a54200a` | CFIX-01, CFIX-02 |
| 2 | useEffect redirects need hydration sequencing guards | `0ca7126b`, `e4c536d6` | CFIX-01 |
| 3 | Cutoff/day-of-week MUST be timezone-aware | `f658c8a1`, `e4c536d6` | CFIX-03 |
| 4 | Email sending in checkout MUST use `after()` API | `email-sending-failures.md` resolved | CFIX-04 |
| 5 | Stripe verify-payment race must use idempotency key | `email-resend-order-not-found.md` | CFIX-04 |
| 6 | PWA SW must have NODE_ENV=production | `6c164675` | CFIX-01 (mobile context) |
| 7 | Always run `pnpm build && pnpm start` locally | `production-ssr-hang.md` | All |
| 8 | Cart navigation guards must coordinate with sync logic | `0ca7126b` | CFIX-02 |
| 9 | IndexedDB hydration is async; gate dependent useEffects | `ecde60ae`, `c622f7ca` | CFIX-01 |
| 10 | DB query optimization needs both indexes AND cache invalidation | `4f8533b2` | DATA-02 |

---

## Summary

**Phase 110 is a high-confidence, low-architectural-risk phase** — all 7 fixes are surgical, all gray areas resolved, all patterns already exist in the codebase. Key risks are around hydration timing (CFIX-01, CFIX-02) and Stripe idempotency (CFIX-04). With the patterns documented above (CSS-only mobile detection, render-time empty cart check, defense-in-depth cutoff disable, AbortController-based timeouts, queries-only retry policy), Phase 110 should plan and execute cleanly.

**Next step:** Run `/gsd-plan-phase 110` with this research as input.
