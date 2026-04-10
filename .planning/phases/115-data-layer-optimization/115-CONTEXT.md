# Phase 115: Data Layer Optimization - Context

**Gathered:** 2026-04-10 (auto mode — resolved via 12-agent precontext research)
**Status:** Ready for planning

<domain>
## Phase Boundary

Cart interactions feel instant and repeated queries don't waste bandwidth. Customer orders list and menu search paginate — no unbounded fetch regardless of data volume.

**In scope (3 requirements):**
- DATA-01: Cart add/remove uses optimistic updates with rollback on error — instant UI feedback
- DATA-03: Menu search deduplicates concurrent identical queries — no redundant API calls
- DATA-04: Orders list and menu search support pagination — no unbounded fetches

**Explicitly NOT in scope:**
- Admin page pagination (admin API supports it but frontend wiring is separate initiative)
- Full menu listing pagination (47 items, single restaurant — not a problem at current scale)
- Server-side cart storage (local-first is correct for this offline-capable delivery app)
- Service worker caching changes (Phase 114 shipped NetworkFirst /api/menu)
- Cart-store debounce changes (BUG-06 fix in place — DO NOT touch `cart-store.ts` debounce logic)

</domain>

<decisions>
## Implementation Decisions

### Orders Cursor Pagination (DATA-04)
- **D-01:** New API route `GET /api/account/orders` with cursor-based pagination using `(placed_at, id)` composite cursor — stable under concurrent inserts, unlike offset which shifts
- **D-02:** Cursor encoding: `btoa(JSON.stringify({ placed_at, id }))` — URL-safe, decodable
- **D-03:** Fetch N+1 rows to detect `hasMore` without separate count query — single round-trip
- **D-04:** Default page size: 10 orders per page (Zod-validated: `limit: z.coerce.number().min(1).max(50).default(10)`)
- **D-05:** Auth via `supabase.auth.getUser()` + RLS `user_id = auth.uid()` — same pattern as existing orders page
- **D-06:** Response shape: `{ data: Order[], pagination: { nextCursor: string | null, hasMore: boolean, limit: number } }`

### Orders Page Hybrid Rendering (DATA-04)
- **D-07:** Hybrid approach: `orders/page.tsx` server-renders first page via direct Supabase query (no API route self-fetch — gotcha H7), passes `initialOrders` + `initialCursor` to client wrapper
- **D-08:** New `OrderListPaginated` client component wraps `OrderListAnimated` with "Load More" button — NOT infinite scroll (explicit user action, consistent with project patterns)
- **D-09:** New `useOrdersPaginated(initialData, initialCursor)` hook using `useQuery` with manual cursor tracking — NOT `useInfiniteQuery` (zero usage in codebase, simpler mental model)
- **D-10:** "Load More" button follows 44px touch target (Phase 113), shows `OrderCardSkeleton` during fetch (Phase 114 pattern)
- **D-11:** Stagger animation resets per batch — new page items animate from index 0
- **D-12:** Empty states: 0 orders total → existing `EmptyOrdersState`; end of list → hide button + "All orders loaded" text

### Menu Search Server-Side Limit (DATA-04)
- **D-13:** Extend `/api/menu/search/route.ts` with `limit` + `offset` query params — `?q=query&limit=20&offset=0`
- **D-14:** Zod validation: `limit: z.coerce.number().min(1).max(50).default(20)`, `offset: z.coerce.number().min(0).default(0)`
- **D-15:** Supabase: `.range(offset, offset + limit - 1)` + `{ count: "exact" }` for total
- **D-16:** Response: add `pagination: { limit, offset, total, hasMore }` to `MenuSearchResponse`
- **D-17:** Update `SearchAutocomplete` to show "Showing X of Y results" when `total > limit` — text-muted, text-xs

### Cart Optimistic Formalization (DATA-01)
- **D-18:** Cart is ALREADY optimistic — `addItem`, `removeItem`, `updateQuantity` are synchronous Zustand mutations with IDB persist. No server round-trip on add/remove. Phase 115 documents this, not rebuilds it
- **D-19:** Three-layer validation IS the rollback: Layer 1 (useCartValidation polling), Layer 2 (syncPendingCartItems on reconnect), Layer 3 (fetchAndValidateCart at checkout) — each progressively stricter
- **D-20:** Enhancement: when `useCartValidation` detects price change, auto-call `updateItemPrice()` so cart always reflects server truth — currently only shows PriceChangeBadge
- **D-21:** Add JSDoc comments to `addItem`, `removeItem`, `updateQuantity`, `syncPendingCartItems` documenting optimistic + rollback semantics
- **D-22:** Add verification tests: add item → verify immediate state update (<16ms, one frame), verify no server call; add item offline → verify `pendingSync: true`; come online → verify stale items removed

### Search Deduplication Verification (DATA-03)
- **D-23:** Search dedup ALREADY WORKS: 300ms `useDebounce` → single `useMenuSearch` call → React Query auto-dedup → 60s `staleTime`. Phase 115 verifies + documents this
- **D-24:** Add verification tests: type "noodle" rapidly → network shows 1 API call; search same term within 60s → cached response; two mounts with same query → 1 call
- **D-25:** No code changes needed for dedup — existing implementation satisfies requirement

### Pagination Indexes (DATA-04)
- **D-26:** New migration: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_placed_id ON orders (user_id, placed_at DESC, id DESC)` — optimal for cursor scan
- **D-27:** New migration: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_active_name ON menu_items (name_en) WHERE is_active = true` — partial index for sorted active items
- **D-28:** Use `CONCURRENTLY` to avoid table locks in production

### QueryKeys Factory Extension (Phase 110 Contract)
- **D-29:** Extend `queryKeys.orders` with `list: (cursor?: string) => [...queryKeys.orders.all, "list", cursor ?? "initial"] as const`
- **D-30:** Extend `queryKeys.menu.search` to accept optional pagination: `search: (query: string, page?: number) => [...queryKeys.menu.all, "search", query, page ?? 1] as const`
- **D-31:** Update `QueryKey` type union to include new factory return types
- **D-32:** Zero `as any` casts — maintains Phase 110 type safety contract

### Implementation Order
- **D-33:** Plan 1: Foundation — pagination indexes (D-26, D-27), queryKeys extension (D-29-D-32), ROADMAP.md 111-04 stale checkbox fix
- **D-34:** Plan 2: Orders pagination — API route (D-01-D-06), hybrid page conversion (D-07-D-12)
- **D-35:** Plan 3: Search + Cart — menu search limit (D-13-D-17), cart documentation + price auto-update (D-18-D-22), search dedup verification (D-23-D-25)

### Cross-Cutting Rules
- **D-36:** All async hooks follow AbortController cleanup in `useEffect` return (Phase 110 D-30)
- **D-37:** No `void asyncFn()` — use `await` or `after()` (Vercel kills fire-and-forget)
- **D-38:** Mutations NEVER retry — `retry: false` for all mutations (Phase 110 D-23)
- **D-39:** 44px touch targets on all new interactive elements (Phase 113 A11Y-01)
- **D-40:** No hardcoded colors — use semantic tokens (Phase 113 ESLint enforcement)
- **D-41:** Loading states follow hierarchy: skeleton > spinner > timeout (Phase 114 D-10)
- **D-42:** Use `queryKeys` factory exclusively — no inline arrays (Phase 110 D-26)

### Claude's Discretion
- Test split between Vitest unit and Playwright E2E — planner decides per feature
- Exact "Load More" button styling (within design token system)
- Whether to show total order count in pagination UI
- Stagger animation delay values for new order batches
- Whether to add AbortController to `useMenuSearch` (NICE-TO-HAVE E10)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 115 Research Artifacts (CRITICAL)
- `.planning/phases/115-data-layer-optimization/115-PRECONTEXT-RESEARCH.md` — 12-agent deep research: resolved gray areas, gotcha inventory (C1-C6, H1-H8, M1-M5), data contracts, architecture decisions, verification approach
- `.planning/phases/115-data-layer-optimization/115-ENHANCEMENT-RECOMMENDATIONS.md` — Priority matrix (E1-E12), implementation hints, suggested 3-plan split

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §Data Layer — DATA-01, DATA-03, DATA-04 acceptance criteria
- `.planning/ROADMAP.md` §Phase 115 — Goal, success criteria, dependencies

### Phase 110 Foundation (Inherited Contracts — MUST NOT BREAK)
- `src/lib/queryKeys.ts` — Query key factory: `menu.list()`, `menu.search(q)`, `orders.history()`. Phase 115 EXTENDS, never replaces
- `src/lib/providers/query-provider.tsx` — `shouldRetryQuery` predicate, `mutations: { retry: false }`. NEVER add retry to mutations
- `src/types/errors.ts` — `ClientErrorCodes` enum. Extend if new error codes needed
- Phase 110 D-30: AbortController cleanup MUST live in `useEffect` return

### Phase 111 Contracts (Checkout — MUST NOT BREAK)
- `src/lib/hooks/useMenu.ts` — `pollWhileNonEmpty` option, `menuQueryFn` exported const. Phase 115 must not trigger unsolicited polling on /menu page
- `src/lib/hooks/useCartValidation.ts` — Exposes `priceChangedIds`, `newPriceCents`, `priceDirection`. Phase 115 wires `updateItemPrice()` on detection

### Phase 114 Contracts (Loading — MUST NOT BREAK)
- `src/app/(customer)/orders/loading.tsx` — Content-shaped skeleton. Phase 115 preserves RSC streaming boundary
- `src/components/ui/SkeletonCrossfade.tsx` — Generic crossfade. Reuse for pagination loading
- `src/components/ui/LoadingWithTimeout.tsx` — Timeout hierarchy (15s/30s)

### Cart Store (READ ONLY — DO NOT MODIFY DEBOUNCE)
- `src/lib/stores/cart-store.ts` — `addItem`, `removeItem`, `updateQuantity`, `updateItemPrice()`, `syncPendingCartItems()`. BUG-06 debounce fix is atomic inside `set()` — NEVER touch debounce logic
- `src/lib/services/cart-idb-storage.ts` — IDB persistence layer
- `src/lib/hooks/useCartValidation.ts` — 3-layer validation (UI + sync + checkout)

### Existing Patterns (Reference)
- `src/app/api/admin/orders/route.ts` — Admin orders pagination API (offset-based). Reference implementation for orders API
- `src/app/api/menu/search/route.ts` — Current unbounded search. Extend with limit+offset
- `src/components/ui/orders/OrderListAnimated.tsx` — Current orders display. Wrap with pagination
- `src/components/ui/account/OrdersTab/OrderCardSkeleton.tsx` — Reusable for pagination loading state

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — File naming, barrel patterns, 400-line limit
- `.planning/codebase/STACK.md` — React 19, React Compiler, TanStack Query, Zustand

### Gotcha References
- `.claude/learnings/state-management.md` — Zustand + IDB hydration: direct selector, not `useMemo + getState()`
- `.claude/learnings/nextjs.md` — `void asyncFn()` killed on Vercel; server component self-fetch is fragile
- `.claude/learnings/data-schema.md` — PostgREST FK hints: ambiguous joins need `!fk_name` hint

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`queryKeys` factory** (`src/lib/queryKeys.ts`) — Phase 110 foundation. Extend with `orders.list(cursor)` and paginated search keys
- **`OrderCardSkeleton`** (`src/components/ui/account/OrdersTab/OrderCardSkeleton.tsx`) — Reuse for pagination loading state
- **`OrderListAnimated`** (`src/components/ui/orders/OrderListAnimated.tsx`) — Existing orders display with stagger animation. Wrap with pagination wrapper
- **`OrdersHeader`** (`src/components/ui/orders/OrdersHeader.tsx`) — Keep as-is in hybrid page
- **`Button`** (`src/components/ui/button.tsx`) — "Load More" uses existing component with 44px touch target
- **`useCartValidation`** (`src/lib/hooks/useCartValidation.ts`) — Already exposes `priceChangedIds`. Wire `updateItemPrice()` call
- **`updateItemPrice()`** (`src/lib/stores/cart-store.ts`) — Existing store action to update cart item price. Currently unused by validation layer
- **Admin orders API** (`src/app/api/admin/orders/route.ts`) — Reference pagination implementation with `.range()` + `{ count: "exact" }`

### Established Patterns
- **Cursor pagination** — Not yet in codebase (orders API is first cursor-based endpoint). Admin API uses offset-based. Both patterns will coexist
- **Server component → client wrapper** — Established pattern: `page.tsx` fetches → passes props to client component (e.g., `OrdersPage` → `OrderListAnimated`)
- **Query key factory** — `queryKeys.{ns}.{op}(args)` returns `as const` tuples. Phase 115 extends, never replaces
- **Cart optimistic pattern** — Synchronous Zustand `set()` → immediate UI update → IDB persist → 3-layer async validation. This IS the optimistic pattern
- **Search debounce** — `useDebounce(query, 300ms)` → `useMenuSearch(debouncedQuery)` → React Query dedup + 60s staleTime. Already satisfies DATA-03

### Integration Points
- `src/app/(customer)/orders/page.tsx` — Convert to hybrid: SSR first page, pass to `OrderListPaginated`
- `src/app/api/menu/search/route.ts` — Extend with `limit` + `offset` params
- `src/lib/hooks/useMenu.ts` — Extend `useMenuSearch` to pass limit
- `src/components/ui/menu/SearchAutocomplete.tsx` — Show "X of Y results" when truncated
- `src/lib/queryKeys.ts` — Extend factory with pagination keys
- `src/lib/hooks/useCartValidation.ts` — Wire `updateItemPrice()` on price change detection
- `supabase/migrations/` — New migration for pagination indexes

</code_context>

<specifics>
## Specific Ideas

- **Cursor pagination over offset** for orders — new orders shifting results is a real problem for repeat-order customers
- **Hybrid rendering preserves SSR** — pure client conversion would lose Phase 114's content-shaped skeleton streaming
- **"Load More" over infinite scroll** — explicit action is the project pattern; useInfiniteQuery has zero usage in codebase
- **Document, don't rebuild** the cart — local-first Zustand is already optimistic. Adding a server cart API would hurt offline UX for zero benefit
- **Auto-update prices on detection** — closing the gap between "show badge" and "fix the cart" reduces checkout friction
- **Search dedup is already solved** — 300ms debounce + RQ dedup + 60s staleTime. Just verify and document

</specifics>

<deferred>
## Deferred Ideas

- **Admin orders frontend pagination** — API supports it, frontend doesn't use it. Separate initiative (NICE-TO-HAVE E11)
- **Full menu list pagination** — 47 items, single restaurant. Not needed at current scale (research G6)
- **Menu search AbortController** — NICE-TO-HAVE E10, saves bandwidth but RQ handles result ordering correctly
- **Cron job explicit limits** — NICE-TO-HAVE E12, defensive but not user-facing
- **Server-side cart storage** — Local-first is correct for this domain. Would hurt offline UX

</deferred>

---

*Phase: 115-data-layer-optimization*
*Context gathered: 2026-04-10 (auto mode, resolved via 12-agent precontext research)*
