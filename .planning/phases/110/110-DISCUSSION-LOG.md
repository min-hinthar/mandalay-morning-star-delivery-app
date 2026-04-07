# Phase 110: Critical Fixes & Data Reliability - Discussion Log (Auto Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 110-CONTEXT.md — this log preserves the analysis trail.

**Date:** 2026-04-06
**Phase:** 110 — Critical Fixes & Data Reliability
**Mode:** discuss-phase --auto
**Source:** All decisions resolved via 12-agent precontext research (Wave 1 + Wave 2). User did not need to answer interactive questions because all 12 gray areas were already resolved to HIGH confidence.

## Auto-Mode Justification

Phase 110 had a comprehensive `110-PRECONTEXT-RESEARCH.md` produced by 12 parallel research agents covering:
- Technical approach for all 7 fixes (HIGH confidence)
- Implementation order (goal-backward dependency analysis)
- Backend requirements (none — pure client-side fixes)
- Cross-phase contract inventory
- Gotcha inventory (15 critical/high/medium risks identified)
- Architectural decisions (12 decisions with rationale)
- Past lessons from git history (10 commits analyzed)

Plus `110-ENHANCEMENT-RECOMMENDATIONS.md` with priority matrix and implementation hints.

All 12 gray areas resolved to HIGH confidence. Auto mode used recommended option for each.

## Areas Auto-Resolved

| # | Area | Decision | Source |
|---|------|----------|--------|
| 1 | Mobile detection (CFIX-01) | CSS-only Tailwind responsive (`md:hidden` / `hidden md:block`) | PRECONTEXT §8 |
| 2 | Empty cart guard (CFIX-02) | Render-time JSX return, NOT redirect | PRECONTEXT §8 |
| 3 | Cutoff disable (CFIX-03) | Defense-in-depth: HTML `disabled` + handler early return | PRECONTEXT §8 |
| 4 | Stripe timeout duration (CFIX-04) | 10s | PRECONTEXT §8 (p99 ≈ 5s, 10s headroom) |
| 5 | Stripe retry behavior (CFIX-04) | Resubmit form (NOT recreate session) | PRECONTEXT §8 (idempotency key reuse) |
| 6 | Cart validation source (CFIX-05) | `useCartValidation` hook only — server has no spinner | PRECONTEXT §8 (audit H1) |
| 7 | Cart validation retry (CFIX-05) | "Proceed Anyway" button — manual, no auto-retry | PRECONTEXT §8 (customer agency) |
| 8 | Mutation retries (CFIX-06) | NO — queries only | PRECONTEXT §8 (double-charge risk) |
| 9 | Retry policy (CFIX-06) | 5xx + 429 + network timeout (never 401/4xx-other) | PRECONTEXT §8 |
| 10 | Factory location (DATA-02) | `src/lib/queryKeys.ts` | PRECONTEXT §8 (project convention) |
| 11 | Factory migration scope (DATA-02) | Full migration of 3 hooks (~12 inline arrays) | PRECONTEXT §8 (Phase 111/115 dependency) |
| 12 | Phase 110 offline scope | Does NOT touch offline (Phase 114 owns) | PRECONTEXT §10 |

## Architectural Decisions Recorded (from PRECONTEXT §8)

| Decision | Options Considered | Chosen | Rationale |
|---|---|---|---|
| CFIX-01 mobile detection | UA sniffing / CSS-only / middleware / useMediaQuery+placeholder | **CSS-only** | Zero JS = zero flash. Tailwind primitives native. |
| CFIX-02 sync guard | Render-time check / server component / middleware | **Render-time** | Cart is client-only Zustand+IDB; only client can read it |
| CFIX-03 disable | HTML disabled only / handler early return only / both | **Both** | Defense in depth — keyboard Enter bypasses CSS-only disable |
| CFIX-04 timeout duration | 5s / 10s / 15s / 30s | **10s** | Stripe p99 ≈ 5s; 10s leaves headroom without false positives |
| CFIX-04 retry behavior | Recreate session / resubmit form / contact support | **Resubmit form** | Idempotency key `checkout_${order.id}` is reused; recreating creates duplicate order |
| CFIX-05 cart validation = ? | useCartValidation hook / server route / both | **useCartValidation hook only** | Audit H1 names client-side hook; server has no infinite spinner |
| CFIX-05 retry behavior | Auto-retry / manual retry / proceed-anyway | **Proceed-anyway button** | Customer agency over silent retries |
| CFIX-06 mutations | Retry queries only / queries + mutations | **Queries only** | Mutation retry = double-add cart, double-charge payment |
| CFIX-06 retry policy | All errors / 5xx + 429 only / 5xx only | **5xx + 429 + network timeout** | 401 = redirect to login; 4xx = validation user must fix |
| DATA-02 location | `src/lib/queryKeys.ts` / `src/lib/query/keys.ts` / `src/lib/react-query/keys.ts` | **`src/lib/queryKeys.ts`** | Matches project convention (`src/lib/{noun}.ts`) |
| DATA-02 migration scope | Full migration / new code only | **Full migration of 3 hooks** | All 3 hooks blocking; prevents Phase 111 cache-invalidation bugs |

## Cross-Phase Contracts Confirmed (from PRECONTEXT §3)

Phase 110 must NOT break:
- Phase 81 `CutoffModal` cart-preservation contract
- Phase 84 `checkoutLimiter` (3/1m) on `/api/checkout/session`
- Phase 104 type safety (`as any` forbidden)
- Phase 106 `getZonedDayOfWeek()` requirement (never `getUTCDay()`)
- Phase 108 rate limit honoring (CFIX-06 retry must respect 429)
- BUG-06 cart-store debounce (do NOT touch `cart-store.ts`)

Phase 110 enables:
- Phase 111 form state recovery (uses error patterns from CFIX-04)
- Phase 111 price polling (uses query key factory)
- Phase 112 reconnect logic (uses retry baseline)
- Phase 114 loading hierarchy (uses CFIX-05 timeout fallback pattern)
- Phase 115 optimistic updates (uses query key factory)

## Implementation Order (Goal-Backward)

Auto-resolved sequencing per PRECONTEXT §1:
```
DATA-02 (foundation, no deps)
  → CFIX-06 (retry config; depends on QueryClient existing)
    → CFIX-01 ∥ CFIX-02 ∥ CFIX-03 (parallelizable UI fixes)
      → CFIX-05 (uses retry baseline)
        → CFIX-04 (most nuanced; benefits from all patterns)
```

## Corrections Made

None — all assumptions confirmed via auto mode. User did not override any decision.

## External Research

All research already performed by 12-agent Wave 1 + Wave 2 prior to this session. No additional research needed.

## Skipped Steps (Auto Mode)

- **present_gray_areas**: Skipped — auto-selected all 12 gray areas
- **discuss_areas**: Skipped — auto-selected recommended option for each
- **scope_creep_check**: No user input, no creep possible
- **correct_assumptions**: No corrections requested

## Next Step

Auto-advance to `/gsd-plan-phase 110 --auto` per chain mode behavior.
