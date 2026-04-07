# Phase 110: Critical Fixes & Data Reliability - Context

**Gathered:** 2026-04-06 (auto mode — assumptions resolved via 12-agent precontext research)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix conversion-blocking bugs in cart→checkout→payment flow and establish query retry infrastructure as foundation for v2.3 milestone. Surgical, low-risk fixes — no new tables, no new API routes, no new features.

**In scope (7 fixes):**
- CFIX-01: Mobile cart white flash
- CFIX-02: Empty cart spinner-redirect loop
- CFIX-03: Cutoff modal submit gate
- CFIX-04: Stripe payment timeout + retry
- CFIX-05: Cart validation timeout + Proceed Anyway
- CFIX-06: React Query retry config (queries only)
- DATA-02: Query key factory (foundation for Phase 111/115)

**Explicitly NOT in scope (other phases own):**
- Form state recovery across errors → Phase 111 (CFIX-07)
- Offline cart sync → Phase 114 (CFIX-08)
- Menu price polling → Phase 111 (CFIX-09)
- Optimistic cart updates → Phase 115 (DATA-01)
- Cart-store debounce changes (BUG-06 already fixed — DO NOT touch)

</domain>

<decisions>
## Implementation Decisions

### Mobile Cart Flash (CFIX-01)
- **D-01:** Remove `useEffect` mobile redirect from `src/app/(customer)/cart/page.tsx` (lines 18-23)
- **D-02:** Use Tailwind responsive classes only (`md:hidden` / `hidden md:block`) — zero JS branching, zero hydration mismatch
- **D-03:** Drop `useIsMobile()` hook usage from this page entirely

### Empty Checkout Guard (CFIX-02)
- **D-04:** Render-time synchronous check using `useCart((s) => s.items.length === 0)` — direct selector, NOT `useMemo + getState()` (precedent: commit `8a54200a`)
- **D-05:** Return `<EmptyCheckoutError />` JSX immediately — no `useEffect`, no redirect, no spinner state
- **D-06:** Create `src/components/ui/checkout/EmptyCheckoutError.tsx` (~40 lines) with friendly copy + "Browse Menu" CTA, `fade-in` token entrance

### Cutoff Submit Gate (CFIX-03)
- **D-07:** Defense-in-depth — BOTH HTML `disabled={isCreatingSession || cutoffModalOpen}` AND handler early return `if (cutoffModalOpen) return`
- **D-08:** Pass `cutoffModalOpen` prop from `CheckoutClient.tsx` to `PaymentStepV8.tsx`
- **D-09:** Cutoff day-of-week MUST use `getZonedDayOfWeek(TIMEZONE)` — never `getUTCDay()` (precedent: commit `f658c8a1`)
- **D-10:** Do NOT clear cart on modal display — Phase 81 contract preserved

### Stripe Payment Timeout (CFIX-04)
- **D-11:** Wrap `fetch('/api/checkout/session')` in `AbortController` with **10s** timeout (`STRIPE_TIMEOUT_MS = 10000`)
- **D-12:** On `AbortError`, set error with new client-only code `CHECKOUT_NETWORK_TIMEOUT` and "Try Again" button
- **D-13:** Retry behavior: **resubmit form** (NOT recreate session). Existing idempotency key `checkout_${order.id}` is reused — recreating would create duplicate order
- **D-14:** Form state preserved across timeout — Phase 110 must NOT clear inputs (Phase 111 will add explicit recovery patterns)
- **D-15:** `clearTimeout` and `AbortController` cleanup MUST live in `useEffect` return — not after the fetch (gotcha #9)

### Cart Validation Timeout (CFIX-05)
- **D-16:** Wrap `useCartValidation` menu refetch (lines 142-154) in `AbortController` with **30s** timeout (`CART_VALIDATION_TIMEOUT_MS = 30000`)
- **D-17:** Add new state `timedOut: boolean` to hook
- **D-18:** Fallback UI: "Validation is taking longer than usual. Proceed at own risk?" with explicit "Proceed Anyway" button
- **D-19:** No auto-retry — customer agency wins. `proceedAnyway` action sets `timedOut: false` and bypasses blocking gate without re-validating
- **D-20:** New client-only error code: `CART_VALIDATION_TIMEOUT`

### React Query Retry Config (CFIX-06)
- **D-21:** Configure `defaultOptions.queries.retry: 3` with exponential backoff `Math.min(1000 * 2 ** attemptIndex, 30000)`
- **D-22:** Retry predicate: `5xx + 429 + network errors only` — never 401/403/4xx-other
- **D-23:** **Mutations: NO retry** — `mutations: { retry: false }`. Mutation retries risk double-add cart, double-charge payment
- **D-24:** Honor existing `checkoutLimiter` (3/1m on `/api/checkout/session`) — backoff respects 429

### Query Key Factory (DATA-02)
- **D-25:** Create `src/lib/queryKeys.ts` (matches project convention `src/lib/{noun}.ts`)
- **D-26:** Factory shape: `queryKeys.{namespace}.{operation}(args)` — namespaces: `menu`, `addresses`, `orders`. Returns `as const` tuples
- **D-27:** Full migration of all 3 existing hooks (`useMenu.ts`, `useAddresses.ts`, `useOrderHistorySearch.ts`) — ~12 inline arrays
- **D-28:** Zero `as any` casts — preserves Phase 104 type safety

### Cross-Cutting Decisions
- **D-29:** Implementation order: `DATA-02 → CFIX-06 → (CFIX-01 ∥ CFIX-02 ∥ CFIX-03) → CFIX-05 → CFIX-04`
- **D-30:** All `useEffect` cleanups audited — every `setTimeout`, `AbortController`, listener, subscription paired with cleanup in return
- **D-31:** No `void asyncFn()` patterns — Vercel kills fire-and-forget. Use `await` or `after()`
- **D-32:** Toast hook extension: add `persistent: true` flag to `useToast.ts` for `CHECKOUT_NETWORK_TIMEOUT` and `CART_VALIDATION_TIMEOUT` toasts (forbidden anti-pattern: toast-then-vanish for critical errors)
- **D-33:** Centralize new error codes in `src/types/errors.ts` as `ClientErrorCodes` const enum

### Claude's Discretion
- Test coverage strategy (Vitest unit, Playwright E2E) — planner decides per-fix
- Storybook story for `EmptyCheckoutError` (NICE-TO-HAVE rec #12) — include if time
- Stripe idempotency code comment at `route.ts:393` (rec #9) — add as risk note, no functional change
- Plan split: suggested 3 plans (Foundation / Cart-Checkout UI Guards / Network Timeout Resilience) — planner can adjust

### Folded Todos
None — todo match returned 0 results.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 110 Research Artifacts
- `.planning/phases/110/110-PRECONTEXT-RESEARCH.md` — 12-agent deep research: resolved gray areas, gotcha inventory, file map, error code mappings, architectural decisions, past lessons from git history
- `.planning/phases/110/110-ENHANCEMENT-RECOMMENDATIONS.md` — Priority matrix (MUST/SHOULD/NICE), implementation hints with code snippets, suggested 3-plan split

### Project Specs
- `.planning/REQUIREMENTS.md` §Critical Fixes — CFIX-01 through CFIX-06 acceptance criteria
- `.planning/REQUIREMENTS.md` §Data Layer — DATA-02 acceptance criteria
- `.planning/ROADMAP.md` §Phase 110 — Goal, success criteria, requirements mapping
- `.planning/PROJECT.md` — Core value: "Every UI element is reliably clickable and the app feels delightfully alive with motion"

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — Provider tree, route groups, state management layers
- `.planning/codebase/CONVENTIONS.md` — File organization, naming, barrel pattern
- `.planning/codebase/STACK.md` — React 19, React Compiler, Tailwind v4, TanStack Query, Zustand
- `.planning/codebase/STRUCTURE.md` — Path layout for `src/app/(customer)/`, `src/components/ui/checkout/`, `src/lib/hooks/`, `src/lib/providers/`

### Critical Gotcha References (`.claude/learnings/`)
- `.claude/learnings/state-management.md` §112-128 — Zustand + async IDB hydration race, direct selector pattern (CFIX-01, CFIX-02)
- `.claude/learnings/react-patterns.md` §3-5, §14-18 — Context provider re-render loops, AbortController cleanup MUST live in useEffect return (CFIX-04, CFIX-05)
- `.claude/learnings/stripe.md` §98-122 — Webhook idempotency, return 500 on transient errors not 200 (CFIX-04)
- `.claude/learnings/nextjs.md` §106-123 — `void asyncFn()` killed on Vercel; server component fetch to own API is fragile (CFIX-04)
- `.claude/learnings/email-sending-failures.md` — `after()` API for fire-and-forget pattern
- `.claude/learnings/email-resend-order-not-found.md` — Stripe verify-payment race + idempotency
- `.claude/learnings/production-ssr-hang.md` — Run `pnpm build && pnpm start` locally before merge
- `.claude/learnings/mobile-ux.md` — Nested `overflow-y-auto` wheel event blocking (background only — not Phase 110 scope)

### Inherited Phase Contracts (MUST NOT BREAK)
- Phase 81 (v1.9): `useDeliveryGate` urgency thresholds; `CutoffModal` cart-preservation contract
- Phase 84 (v1.9): `checkoutLimiter` rate limit (3/1m) on `/api/checkout/session`
- Phase 104 (v2.2): Strongly typed `delivery_zones`; `revalidateTag` 2-arg form — no `as any`
- Phase 106 (v2.2): `TIMEZONE` constant in `src/types/delivery.ts`; `getZonedDayOfWeek()` helper required
- Phase 108 (v2.2): 13 rate limiters via Upstash REST; in-memory fallback (15/min) — CFIX-06 must honor 429
- BUG-06: Cart-store debounce atomicity inside `set()` callback — Phase 110 must NOT touch `cart-store.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`AbortableAsync`** (`src/lib/hooks/useSafeEffects/useSafeAsync.ts`) — Existing state machine `idle → executing → (success | aborted | error)`. Use for CFIX-04 Stripe wrapper and CFIX-05 validation wrapper
- **`LoadingWithTimeout`** (`src/components/ui/LoadingWithTimeout.tsx`) — `idle → loading → (success | timed_out)`. Pattern for CFIX-05 fallback UI
- **`useToast`** / **`useToastV8`** (`src/lib/hooks/useToast.ts`) — `TOAST_REMOVE_DELAY = 5000`. Extend with `persistent: true` flag for critical errors
- **`Button`** (`src/components/ui/Button.tsx`) line 34 — Existing `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` tokens
- **`EmptyState`** component in `src/components/ui/` — Reference patterns for `EmptyCheckoutError` styling
- **`fade-in`** / **`slide-in-up`** animation tokens — Existing Tailwind utilities for new error UI entrances
- **`bg-skeleton`** + **`animate-shimmer`** — Loading skeleton tokens (background reference)

### Established Patterns
- **Retry curves already in codebase:**
  - `IMPORT_RETRY_DELAYS = [1000, 2000, 4000]ms` (`useDynamicImportWithRetry.ts`)
  - `OFFLINE_RETRY_BASE_MS = 2000`, `OFFLINE_RETRY_MAX_MS = 32000` (`offline-store/retry.ts` — uses `Math.min(2000 * 2**attempt, 32000)`)
  - CFIX-06 should follow `Math.min(1000 * 2 ** i, 30000)` — slightly tighter than offline pattern
- **Cart hydration:** Direct selector `useCartStore((s) => ...)` is the established pattern, NOT `useMemo + getState()` (commit `8a54200a` precedent)
- **Day-of-week:** Always `getZonedDayOfWeek(TIMEZONE)` from `src/types/delivery.ts` — `getUTCDay()` is wrong in LA timezone (commit `f658c8a1` precedent)
- **Error code → UI mapping:** Server emits 10 codes (`VALIDATION_ERROR`, `CUTOFF_PASSED`, `STRIPE_ERROR`, etc.) handled in `PaymentStepV8.tsx` lines 119-139. Phase 110 adds 2 client-only codes
- **React Query factory pattern:** Project has none yet — Phase 110 introduces it. Match `src/lib/{noun}.ts` convention

### Integration Points
- **`src/lib/providers/query-provider.tsx`** — QueryClient defaults configuration site for CFIX-06
- **`src/app/(customer)/cart/page.tsx`** — Mobile cart page (CFIX-01)
- **`src/app/(customer)/checkout/CheckoutClient.tsx`** — Checkout container; render-time empty guard (CFIX-02), `cutoffModalOpen` wiring (CFIX-03)
- **`src/components/ui/checkout/PaymentStepV8.tsx`** — Submit button + handler (CFIX-03), Stripe fetch (CFIX-04)
- **`src/lib/hooks/useCartValidation.ts`** lines 142-154 — Menu refetch (CFIX-05)
- **`src/lib/hooks/useMenu.ts`, `useAddresses.ts`, `useOrderHistorySearch.ts`** — Migration sites (DATA-02)
- **`src/types/delivery.ts`** — `TIMEZONE` constant (used by CFIX-03 indirectly via `getZonedDayOfWeek`)
- **`src/components/ui/delivery/CutoffModal.tsx`** — Wiring contract source for CFIX-03 (read-only reference)
- **`src/lib/hooks/useDeliveryGate.ts`, `useDeliveryGateMultiDay.ts`** — Cutoff state source for CFIX-03 (read-only reference)

### Files NOT to Touch
- `src/lib/stores/cart-store.ts` — BUG-06 debounce fix in place; Phase 110 must NOT modify
- `src/app/api/checkout/session/route.ts` — Server-side error contract preserved (no changes); read-only reference for client wiring

</code_context>

<specifics>
## Specific Ideas

- **Defense-in-depth philosophy** for cutoff submit (CFIX-03): visual disable + behavioral handler guard. Keyboard `Enter` on focused form can bypass HTML `disabled` in some browsers — handler guard catches programmatic submission
- **Customer agency over silent retries** (CFIX-05): "Proceed Anyway" button instead of auto-retry. Aligns with project core value "every UI element is reliably clickable" — silent fallbacks are forbidden anti-patterns
- **Zero JS branching for responsive** (CFIX-01): CSS-only `md:hidden / hidden md:block` is the cleanest fix. Tailwind responsive primitives handle this natively — no hydration race possible
- **Form-resubmit retry** (CFIX-04) instead of session-recreate: idempotency key `checkout_${order.id}` is constructed AFTER order RPC. Recreating client-side would bypass the server's existing-order detection branch and risk duplicate orders
- **Conservative timeout values:** Stripe p99 ≈ 5s → 10s timeout has headroom. Cart validation p99 ≈ 3s → 30s timeout catches only true hangs. False positives will be rare
- **Tone for error UI:** "warm, family business" — Mandalay Morning Star branding. Error copy should be friendly, not technical. "Browse Menu" CTA, not "Return to /menu"

</specifics>

<deferred>
## Deferred Ideas

- **CFIX-07 Form state recovery across errors** → Phase 111 (Checkout Conversion). Phase 110 just must not break what exists
- **CFIX-08 Offline cart sync** → Phase 114 (Loading & Offline)
- **CFIX-09 Menu price polling** → Phase 111. Will use the query key factory Phase 110 creates
- **CFIX-10 Tracking audio mute** → Phase 112 (Order Tracking)
- **DATA-01 Optimistic cart updates** → Phase 115 (Data Layer Optimization). Will use the query key factory Phase 110 creates
- **DATA-03 Menu search dedup** → Phase 115
- **DATA-04 Pagination** → Phase 115
- **Stripe idempotency restructure** (move Stripe call before order RPC, or use cart-hash deterministic key) → Phase 111+. Phase 110 only adds a code comment risk note
- **Cart-store debounce changes** → Never. BUG-06 already fixed; do not touch `cart-store.ts`
- **Modal/Dialog/Drawer API consolidation** → Out of scope for v2.3 entirely (REQUIREMENTS.md §Out of Scope)

### Reviewed Todos (not folded)
None — todo match returned 0 results for Phase 110.

</deferred>

---

*Phase: 110*
*Context gathered: 2026-04-06 (auto mode, assumptions resolved via 12-agent precontext research)*
