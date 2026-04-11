# Phase 115: Enhancement Recommendations

**Generated:** 2026-04-10
**Phase:** 115 — Data Layer Optimization
**Requirements:** DATA-01, DATA-03, DATA-04

---

## Priority Matrix

| # | Enhancement | Priority | Effort | Impact |
|---|------------|----------|--------|--------|
| E1 | Customer orders cursor pagination API | MUST-HAVE | 3h | HIGH |
| E2 | Orders page hybrid server/client rendering | MUST-HAVE | 3h | HIGH |
| E3 | Menu search server-side limit | MUST-HAVE | 1.5h | MEDIUM |
| E4 | Composite pagination indexes | MUST-HAVE | 0.5h | HIGH |
| E5 | Cart optimistic pattern documentation | MUST-HAVE | 1h | LOW |
| E6 | QueryKeys factory pagination extension | MUST-HAVE | 0.5h | MEDIUM |
| E7 | Fix ROADMAP.md Phase 111-04 stale checkbox | SHOULD-HAVE | 5min | LOW |
| E8 | Search result count display | SHOULD-HAVE | 1h | MEDIUM |
| E9 | Orders empty-after-filter state | SHOULD-HAVE | 0.5h | LOW |
| E10 | Menu search AbortController | NICE-TO-HAVE | 1h | LOW |
| E11 | Admin orders frontend pagination wiring | NICE-TO-HAVE | 2h | MEDIUM |
| E12 | Cron job explicit limits | NICE-TO-HAVE | 0.5h | LOW |

**Total MUST-HAVE effort: ~9.5h**

---

## Detailed Recommendations

### E1: Customer Orders Cursor Pagination API (MUST-HAVE)

**What:** Create `GET /api/account/orders` with cursor-based pagination using `(placed_at, id)` composite cursor.

**Why:** Customer orders page currently fetches ALL orders with no limit. Users accumulating 100+ orders will see degraded load times and memory usage. Success criterion DATA-04 requires "no unbounded fetch regardless of data volume."

**Implementation:**
- New route: `src/app/api/account/orders/route.ts`
- Parameters: `?cursor=<base64_json>&limit=10`
- Response: `{ data: Order[], pagination: { nextCursor, hasMore, limit } }`
- Auth: `supabase.auth.getUser()` + RLS `user_id = auth.uid()`
- Sort: `placed_at DESC, id DESC` (consistent with current page)
- Cursor encode: `btoa(JSON.stringify({ placed_at, id }))`
- Fetch N+1 to detect `hasMore` without separate count query

**Design compliance:** Follows admin orders API pattern (Phase 84). Uses queryKeys factory (Phase 110). Respects RLS policies (Phase 68).

---

### E2: Orders Page Hybrid Server/Client Rendering (MUST-HAVE)

**What:** Convert orders page to hybrid: server-render first page (cursor=null), client-side "Load More" for subsequent pages.

**Why:** Preserves SSR benefits (fast first paint, Phase 114 skeleton compatibility) while adding progressive pagination. Pure client conversion would lose SSR and break the loading.tsx pattern.

**Implementation:**
- `orders/page.tsx`: Fetch first 10 orders via direct Supabase query (no API route for first page — avoids self-fetch gotcha H7)
- Pass `initialOrders` + `initialCursor` to new `OrderListPaginated` client component
- New hook: `useOrdersPaginated(initialData, initialCursor)` using `useQuery` with manual cursor tracking
- "Load More" button at bottom (NOT infinite scroll — explicit user action)
- Reuse `OrderCardSkeleton` for loading state during fetch
- Animation: stagger delay applies per-batch (reset index for each new page)

**Design compliance:** Follows Phase 114 loading hierarchy (skeleton > spinner > timeout). Maintains 44px touch target for "Load More" button (Phase 113).

---

### E3: Menu Search Server-Side Limit (MUST-HAVE)

**What:** Add `limit` and `offset` query parameters to `/api/menu/search` route. Default limit: 20.

**Why:** Menu search currently returns ALL matching items with no upper bound. At 47 items this is fine, but success criterion DATA-04 requires pagination protection. Defensive implementation prevents future issues as menu grows.

**Implementation:**
- Extend route: `?q=query&limit=20&offset=0`
- Zod validation: `limit: z.coerce.number().min(1).max(50).default(20)`
- Supabase: `.range(offset, offset + limit - 1)` + `{ count: "exact" }`
- Response: Add `pagination: { limit, offset, total, hasMore }` to `MenuSearchResponse`
- Update `useMenuSearch` hook to pass limit (default 20)
- Update `SearchAutocomplete` to show "Showing X of Y results" when truncated

**Design compliance:** Follows admin API pagination pattern. Extends queryKeys.menu.search() with pagination params (Phase 110).

---

### E4: Composite Pagination Indexes (MUST-HAVE)

**What:** Create database indexes optimized for cursor pagination queries.

**Why:** Without composite indexes, cursor pagination falls back to sequential scan. The customer orders query filters by `user_id`, sorts by `placed_at DESC`, and needs `id` for tie-breaking.

**Implementation:**
```sql
-- Customer orders: user filter + date sort + id tiebreak
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_placed_id
  ON orders (user_id, placed_at DESC, id DESC);

-- Menu search: active filter + name sort
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_active_name
  ON menu_items (name_en)
  WHERE is_active = true;
```

**Design compliance:** Uses `CONCURRENTLY` to avoid table locks. Partial index on `is_active = true` matches query predicate. Follows Phase 107 index patterns.

---

### E5: Cart Optimistic Pattern Documentation (MUST-HAVE)

**What:** Formalize the existing cart optimistic update pattern to satisfy DATA-01 without over-engineering.

**Why:** DATA-01 says "cart add/remove uses optimistic updates with rollback on error." The cart is ALREADY optimistic (synchronous Zustand mutations). The three-layer validation (UI detection, online sync, checkout) provides the "rollback" semantics. This needs documentation, not new code.

**Implementation:**
- Add JSDoc comments to `addItem`, `removeItem`, `updateQuantity` explaining they are optimistic
- Add JSDoc to `syncPendingCartItems` explaining rollback behavior
- Ensure `useCartValidation` price-change detection auto-updates cart prices (currently shows badge only)
- Minor enhancement: when price change detected, auto-call `updateItemPrice()` so cart always reflects server truth
- Add tests: add item → verify immediate state update → verify no server call

**Design compliance:** Local-first architecture is correct for offline-first delivery app. No server-side cart API needed.

---

### E6: QueryKeys Factory Pagination Extension (MUST-HAVE)

**What:** Extend the query key factory to support paginated query keys for orders and menu search.

**Why:** Phase 110 established the factory pattern with `as const` tuples. Pagination adds new key dimensions that must follow the same pattern for cache invalidation to work correctly.

**Implementation:**
```typescript
orders: {
  ...existing,
  list: (cursor?: string) =>
    [...queryKeys.orders.all, "list", cursor ?? "initial"] as const,
}
menu: {
  ...existing,
  search: (query: string, page?: number) =>
    [...queryKeys.menu.all, "search", query, page ?? 1] as const,
}
```

**Design compliance:** Maintains Phase 110 contract: `as const` tuples, hierarchical namespacing, factory functions.

---

### E7: Fix ROADMAP.md Phase 111-04 Stale Checkbox (SHOULD-HAVE)

**What:** Update ROADMAP.md line 142 to mark 111-04-PLAN.md as complete (`[x]`). Update progress table to show 4/4 plans.

**Why:** Phase 111-04 is fully executed and verified (SUMMARY.md exists, completed 2026-04-08). The unchecked box is a documentation-sync issue that creates confusion in progress reports.

**Implementation:** Single-line edit in ROADMAP.md.

---

### E8: Search Result Count Display (SHOULD-HAVE)

**What:** Show "Showing X of Y results" in SearchAutocomplete when server returns truncated results.

**Why:** With server-side limit (E3), users need to know if their search returned all matches or was truncated. UX clarity prevents user confusion.

**Implementation:**
- `SearchAutocomplete` reads `pagination.total` from response
- If `total > limit`: show "Showing {limit} of {total} results"
- If `total <= limit`: show "{total} results" (no truncation indicator)
- Positioned below search results, above any empty state

**Design compliance:** Uses text-muted token (Phase 113 WCAG AA contrast). Font size: text-xs.

---

### E9: Orders Empty-After-Filter State (SHOULD-HAVE)

**What:** Handle the edge case where the first page of orders is empty (new user, no orders yet) vs. a subsequent page returning empty (end of list).

**Why:** Pagination introduces a new state: "no more results." This is different from "no orders at all." UX must distinguish these clearly.

**Implementation:**
- If `initialOrders.length === 0`: show existing EmptyOrdersState component
- If "Load More" returns 0 results: hide button, show "All orders loaded" text
- If loading: show OrderCardSkeleton (reuse Phase 114 pattern)

---

### E10: Menu Search AbortController (NICE-TO-HAVE)

**What:** Add AbortController to `useMenuSearch` to cancel in-flight requests when the query changes.

**Why:** When a user types quickly past the 300ms debounce boundary, two requests may be in-flight simultaneously. While React Query handles result ordering correctly, canceling the stale request saves bandwidth and reduces server load.

**Implementation:**
- Pass `AbortSignal` to `fetch()` in `useMenuSearch` queryFn
- React Query v5 supports signal via `queryFn({ signal })` automatically
- Cancel previous request when queryKey changes

**Design compliance:** Follows Phase 110 AbortController cleanup pattern.

---

### E11: Admin Orders Frontend Pagination Wiring (NICE-TO-HAVE)

**What:** Wire up the existing admin orders API pagination (`?page=1&limit=25`) to the admin frontend.

**Why:** Admin orders page loads all orders despite the API supporting pagination. Out of Phase 115 scope (success criteria focus on customer), but quick win since API is ready.

**Implementation:**
- Add page/limit state to `AdminOrdersPage`
- Pass params to fetch call
- Add pagination controls (Prev/Next + page indicator)

---

### E12: Cron Job Explicit Limits (NICE-TO-HAVE)

**What:** Add explicit `.limit()` to cron job Supabase queries (delivery-reminders, admin-daily-digest).

**Why:** Currently rely on implicit date-range scoping. Adding explicit limits is defensive programming against data anomalies.

**Implementation:**
- `delivery-reminders`: `.limit(500)` (max reasonable daily orders)
- `admin-daily-digest`: `.limit(1000)` (max reasonable daily summary)

---

## Implementation Sequence

```
Plan 1: Foundation (E4 + E6 + E7)
  → Migration: pagination indexes
  → queryKeys factory extension
  → ROADMAP fix

Plan 2: Orders Pagination (E1 + E2 + E9)
  → API route with cursor pagination
  → Hybrid page conversion
  → Empty/end-of-list states

Plan 3: Search + Cart (E3 + E5 + E8)
  → Menu search server-side limit
  → Cart optimistic documentation
  → Search result count display
```

---

_Generated: 2026-04-10_
_Protocol: Deep Phase Assumptions (12-Agent, 2-Wave)_
