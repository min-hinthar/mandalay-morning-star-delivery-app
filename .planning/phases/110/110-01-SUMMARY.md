---
phase: 110
plan: 01
subsystem: data-layer
tags: [query-key-factory, react-query, retry-policy, DATA-02, CFIX-06]
dependency_graph:
  requires: []
  provides:
    - "queryKeys factory (menu, addresses, orders namespaces)"
    - "QueryClient retry policy (queries 3x exp backoff, mutations disabled)"
    - "shouldRetryQuery + queryRetryDelay exported helpers"
  affects:
    - "src/lib/hooks/useMenu.ts"
    - "src/lib/hooks/useAddresses.ts"
    - "src/lib/hooks/useOrderHistorySearch.ts"
    - "src/lib/providers/query-provider.tsx"
tech_stack:
  added: []
  patterns:
    - "query key factory (as const tuples)"
    - "exponential backoff via Math.min(base * 2 ** i, max)"
    - "retry predicate guards against 401/403/4xx (user-actionable)"
key_files:
  created:
    - "src/lib/queryKeys.ts"
    - "src/lib/queryKeys.test.ts"
    - "src/lib/providers/__tests__/query-provider.test.tsx"
  modified:
    - "src/lib/hooks/useMenu.ts"
    - "src/lib/hooks/useAddresses.ts"
    - "src/lib/hooks/useOrderHistorySearch.ts"
    - "src/lib/providers/query-provider.tsx"
decisions:
  - "D-21: queries retry 3x with exp backoff 1s→30s cap"
  - "D-22: retry predicate = 5xx + 429 + network (status 0) only"
  - "D-23: mutations never retry (literal retry: false)"
  - "D-24: honors Phase 108 checkoutLimiter via 429 backoff"
  - "D-25: factory location src/lib/queryKeys.ts (matches project convention)"
  - "D-26: factory shape queryKeys.{namespace}.{operation}(args) as const tuples"
  - "D-27: full migration of all 3 existing hooks (12 inline arrays)"
  - "D-28: zero as any casts (Phase 104 contract preserved)"
  - "D-30: useEffect cleanup audit (partial - all 4 modified files had no useEffect)"
metrics:
  duration_minutes: ~12
  tasks_completed: 3
  tests_added: 32
  files_created: 3
  files_modified: 4
  completed_date: 2026-04-06
---

# Phase 110 Plan 01: Query Key Factory + React Query Retry Config Summary

Foundation wave for v2.3 data layer: centralized query key factory (DATA-02) and retry semantics (CFIX-06) so Phase 111 and Phase 115 can consume consistent cache invalidation and transient failure recovery without data duplication risk.

## What Was Built

### DATA-02: Query Key Factory
- **`src/lib/queryKeys.ts`** (39 lines) — Centralized factory with three namespaces (`menu`, `addresses`, `orders`), each exposing `all`, `list()`/`history()`, and operation-specific builders. All keys returned as `as const` tuples for TanStack structural equality. Exports `QueryKey` union type.
- **`src/lib/queryKeys.test.ts`** (53 lines, 10 vitest cases) — Verifies each namespace's tuple shape and cross-call value equality.
- **Three hooks migrated** — useMenu (2 sites), useAddresses (6 sites: 2 queries + 4 invalidations), useOrderHistorySearch (1 site). All inline `["menu"]`, `["addresses"]`, `["order-items-for-search", ...]` arrays replaced with factory calls. Mutation invalidations use `queryKeys.addresses.all` (broader namespace → invalidates both list and detail).

### CFIX-06: React Query Retry Config
- **`src/lib/providers/query-provider.tsx`** (64 lines) — Extended existing `QueryClient` defaults (preserved `staleTime: 5min` and `refetchOnWindowFocus: false`) with `retry: shouldRetryQuery`, `retryDelay: queryRetryDelay`, and `mutations: { retry: false }`. Exports `shouldRetryQuery` and `queryRetryDelay` as pure helpers for unit testing.
- **Retry policy:**
  - Queries: up to 3 retries, exp backoff `Math.min(1000 * 2 ** i, 30000)` → 1s, 2s, 4s, 8s, 16s, 30s (capped).
  - Retryable statuses: **5xx + 429 + network (status 0)**. Never 401/403/404/422 (user-actionable).
  - Mutations: literal `retry: false` — prevents double-add cart and double-charge payment. Defense in depth beyond Stripe's idempotency.
- **`src/lib/providers/__tests__/query-provider.test.tsx`** (83 lines, 22 vitest cases via `it.each` expansions) — Covers retry predicate status matrix (5xx/429/0 = true, 401/403/404/400/422 = false), retry cap at 3, null error → network error path, backoff curve (attempts 0-10), and smoke test of provider rendering + default options shape.

## Key Decisions Honored

| Decision | Implementation | Evidence |
|----------|---------------|----------|
| D-21 queries retry 3x exp backoff | `QUERY_RETRY_ATTEMPTS = 3`, `queryRetryDelay` caps at 30000 | query-provider.tsx:22, 41-43 |
| D-22 predicate: 5xx + 429 + network | `status >= 500 \|\| status === 429 \|\| status === 0` | query-provider.tsx:35 |
| D-23 mutations.retry = false (literal, non-negotiable) | `mutations: { retry: false }` | query-provider.tsx:56-58 |
| D-24 honor checkoutLimiter via 429 backoff | 429 included in retry predicate with exp backoff | query-provider.tsx:35 |
| D-25 factory at src/lib/queryKeys.ts | File created at that exact path | queryKeys.ts |
| D-26 factory shape + as const tuples | `queryKeys.{ns}.{op}(args) as const` pattern | queryKeys.ts:12-29 |
| D-27 full migration (not incremental) | All 3 hooks consume factory; zero inline arrays remain | useMenu.ts, useAddresses.ts, useOrderHistorySearch.ts |
| D-28 zero `as any` | Grep confirms 0 hits across 5 modified files | verification below |

## useEffect Cleanup Audit (D-30, partial scope)

Per plan Step F (Task 1) and Step C (Task 2):

| File | useEffect count | Cleanup risk | Status |
|------|-----------------|--------------|--------|
| `src/lib/queryKeys.ts` | 0 | N/A (pure module) | PASS |
| `src/lib/hooks/useMenu.ts` | 0 | N/A | PASS |
| `src/lib/hooks/useAddresses.ts` | 0 | N/A | PASS |
| `src/lib/hooks/useOrderHistorySearch.ts` | 0 (uses `useMemo` only) | N/A | PASS |
| `src/lib/providers/query-provider.tsx` | 0 (uses lazy `useState` initializer) | N/A | PASS |

All 5 files for this plan are free of uncleaned `setTimeout`/`AbortController`/listener/subscription. D-30 audit scope for Plans 02 and 03 remains with those executors.

## Mutations Literal Verification

**`mutations: { retry: false }`** appears verbatim in `src/lib/providers/query-provider.tsx` line 56-58 and is verified by test case:

```typescript
expect(opts.mutations?.retry).toBe(false);
```

Test passes. Non-negotiable D-23 contract enforced.

## Test Count

| File | Tests | Approach |
|------|-------|----------|
| `queryKeys.test.ts` | 10 | Describe blocks per namespace + 1 value-equality |
| `query-provider.test.tsx` | 22 | `it.each` predicate matrix (5+5+1+1+1), backoff curve (7), provider smoke (2), default options (1) |
| **Total added** | **32** | |

Plan spec required ≥28 (11 + 17). Exceeded: `it.each` expansions gave full coverage.

## Verification Results

| Command | Exit | Notes |
|---------|------|-------|
| `pnpm test src/lib/queryKeys.test.ts --run` | 0 | 10 tests pass |
| `pnpm test src/lib/providers/__tests__/query-provider.test.tsx --run` | 0 | 22 tests pass |
| `pnpm lint` | 0 | zero errors, zero warnings |
| `pnpm typecheck` | 0 | strict mode clean; no `as any` introduced |
| `pnpm test --run` | 0 | 51 files, 883 tests pass (includes 32 new) |
| `grep "as any" src/lib/queryKeys.ts src/lib/hooks/useMenu.ts src/lib/hooks/useAddresses.ts src/lib/hooks/useOrderHistorySearch.ts src/lib/providers/query-provider.tsx` | - | zero matches |
| `grep "queryKey: \["` in migrated hooks | - | zero matches |

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed in order (Task 1 → Task 2 → Task 3 verification). Task 3 is a verification-only task with no file artifacts, so no separate commit was created for it; the verification runs are logged above.

## Commits

| Task | Commit | Summary |
|------|--------|---------|
| 1 | `5bc557ed` | feat(110-01): add query key factory and migrate 3 hooks |
| 2 | `70448272` | feat(110-01): configure React Query retry policy with exponential backoff |
| 3 | (no artifact) | Verification-only — results documented in this SUMMARY |

## Downstream Notes

- **Plan 02 (Wave 2)** may now consume `queryKeys.*` for any new cache invalidation. Do NOT re-introduce inline arrays.
- **Plan 03 (Wave 3)** must wait for Plan 02 due to shared `PaymentStepV8.tsx` modifications.
- **Phase 111** will use `queryKeys.menu.search()` and `queryKeys.menu.list()` for price polling invalidation.
- **Phase 115** will use `queryKeys.addresses.all` and menu keys for optimistic cart updates.
- **Phase 108 contract:** `checkoutLimiter` (3/1m) 429 responses WILL be retried by any query using the new predicate — but `/api/checkout/session` is a mutation (POST) and mutations never retry (D-23). The 429 path only affects queries, so the limiter is honored without amplifying checkout requests.

## Self-Check: PASSED

- [x] `src/lib/queryKeys.ts` — FOUND
- [x] `src/lib/queryKeys.test.ts` — FOUND
- [x] `src/lib/providers/query-provider.tsx` — FOUND (modified)
- [x] `src/lib/providers/__tests__/query-provider.test.tsx` — FOUND
- [x] `src/lib/hooks/useMenu.ts` — FOUND (migrated)
- [x] `src/lib/hooks/useAddresses.ts` — FOUND (migrated)
- [x] `src/lib/hooks/useOrderHistorySearch.ts` — FOUND (migrated)
- [x] Commit `5bc557ed` — FOUND in `git log`
- [x] Commit `70448272` — FOUND in `git log`
- [x] 10 queryKeys tests passing
- [x] 22 query-provider tests passing
- [x] Full suite 883 tests passing
- [x] Lint + typecheck exit 0
- [x] Zero `as any` casts introduced
