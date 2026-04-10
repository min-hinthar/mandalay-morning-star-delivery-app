# Phase 115: Data Layer Optimization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the auto-mode selections.

**Date:** 2026-04-10
**Phase:** 115-data-layer-optimization
**Mode:** auto (all areas auto-selected, recommended options chosen)
**Areas discussed:** Orders Pagination Strategy, Menu Search Limit Strategy, Cart Optimistic Scope, Search Dedup Verification Scope

---

## Orders Pagination Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Cursor-based (placed_at, id) | Stable under concurrent inserts, natural for chronological data | ✓ |
| Offset-based (page, limit) | Simpler, matches admin pattern but shifts with new orders | |

**Auto-selected:** Cursor-based (placed_at, id) — recommended by precontext research (95% confidence)

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid server/client | SSR first page, client Load More — preserves Phase 114 skeletons | ✓ |
| Pure client component | useInfiniteQuery for all pages — loses SSR benefits | |
| Pure server with URL params | Server-rendered pagination — loses interactivity | |

**Auto-selected:** Hybrid server/client — preserves SSR + progressive enhancement

| Option | Description | Selected |
|--------|-------------|----------|
| Load More button | Explicit user action, consistent with project patterns | ✓ |
| Infinite scroll | Auto-loads on scroll — useInfiniteQuery has zero usage in codebase | |

**Auto-selected:** Load More button — matches project pattern of explicit user actions

---

## Menu Search Limit Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side limit+offset, default 20 | Prevents unbounded payload, extends existing route | ✓ |
| Client-side truncation | Fetch all, show first N — doesn't solve "no unbounded fetch" requirement | |

**Auto-selected:** Server-side limit+offset — satisfies DATA-04 "no unbounded fetch" literally

| Option | Description | Selected |
|--------|-------------|----------|
| Show "X of Y results" when truncated | UX clarity, text-muted text-xs | ✓ |
| No count display | Simpler but user doesn't know if results were truncated | |

**Auto-selected:** Show result count — minimal effort, prevents user confusion

---

## Cart Optimistic Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Document existing local-first pattern | Cart already instant via Zustand. Add JSDoc + tests | ✓ |
| Rebuild with server-side cart API | useMutation + rollback — adds complexity for zero UX improvement | |

**Auto-selected:** Document existing — cart is already optimistic (synchronous Zustand, 95% confidence)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-update prices on detection | Call updateItemPrice() when validation detects change — cart reflects server truth | ✓ |
| Badge only (current behavior) | Show visual indicator but cart prices stay stale until checkout | |

**Auto-selected:** Auto-update prices — closes gap between detection and correction, reduces checkout friction

---

## Search Dedup Verification Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Verify existing + document | 300ms debounce + RQ dedup + 60s staleTime already works. Add tests | ✓ |
| Enhance with AbortController | Cancel stale requests — bandwidth saving but RQ handles ordering | |

**Auto-selected:** Verify existing — already satisfies requirement (95% confidence)

---

## Claude's Discretion

- Test split (Vitest vs Playwright) per feature
- "Load More" button exact styling
- Order count display in pagination
- Stagger animation delay for new batches
- AbortController for search (NICE-TO-HAVE)

## Deferred Ideas

- Admin orders frontend pagination wiring (NICE-TO-HAVE)
- Full menu list pagination (not needed at 47 items)
- Menu search AbortController (NICE-TO-HAVE)
- Cron job explicit limits (NICE-TO-HAVE)
- Server-side cart storage (wrong architecture for offline-first)
