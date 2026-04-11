# Phase 115: Data Layer Optimization — Precontext Research

**Generated:** 2026-04-10
**Protocol:** Deep Phase Assumptions (12-Agent, 2-Wave)
**Requirements:** DATA-01, DATA-03, DATA-04

---

## 1. Resolved Assumptions

### Technical Approach

| Assumption | Resolution | Confidence |
|-----------|-----------|------------|
| DATA-01 needs server-side cart API | NO — cart is already local-first (Zustand + IDB). "Optimistic with rollback" describes the EXISTING pattern. | 95% |
| DATA-03 needs manual deduplication | NO — React Query auto-dedup + 300ms debounce + 60s staleTime already satisfies requirement. | 95% |
| DATA-04 needs useInfiniteQuery | NOT NECESSARILY — page-number pagination with "Load More" is simpler and consistent with admin API pattern. useInfiniteQuery is zero-usage in codebase. | 70% |
| Orders page must convert to client component | PARTIALLY — hybrid approach: server-render first page, client-side "Load More" via new API route. | 85% |
| Menu search needs server-side pagination | YES — `/api/menu/search` returns unbounded results. Add `limit` + `offset` or cursor. | 95% |

### Scope Boundaries

**In scope (from success criteria):**
- DATA-01: Formalize cart optimistic pattern + ensure price-change handling is clean
- DATA-03: Verify dedup works (already does), document the pattern
- DATA-04: Customer orders list pagination + menu search result pagination

**Out of scope (from success criteria literal read):**
- Admin page pagination (admin API already supports it, frontend unused)
- Full menu listing pagination (47 items, not a problem at current scale)
- Server-side cart storage (local-first is correct for this domain)
- Internationalization, push notifications, any v2.4+ requirements

**Ambiguous (resolved):**
- "Menu search paginate" = autocomplete dropdown, NOT a separate search results page (85%)
- "Orders list" = customer `/orders` page, NOT admin orders (95%)

### Implementation Order

1. **DATA-04: Orders pagination** — biggest real gap, most user-facing
2. **DATA-04: Menu search pagination** — second biggest gap
3. **DATA-01: Cart optimistic formalization** — mostly documentation + minor cleanup
4. **DATA-03: Search dedup verification** — already satisfied, verify + document

---

## 2. Realistic Data/Scale Analysis

| Entity | Current Count | Growth Expectation | Pagination Urgency |
|--------|--------------|--------------------|--------------------|
| Menu items | ~47 | <200 (single restaurant) | LOW for full list |
| Menu categories | ~8 | <20 | NONE |
| Customer orders | Unbounded per user | 100+ over time | HIGH |
| Search results | Up to ~47 | Proportional to menu | MEDIUM |
| Admin orders | ALL orders in system | 1000+ over time | DEFERRED (has API) |

**Key insight:** At 20-50 orders/week, a customer who orders weekly accumulates 100+ orders in 2 years. The orders page will degrade without pagination. Menu search at 47 items is borderline — pagination is defensive.

---

## 3. Cross-Phase Contract Inventory

### From Phase 110: Critical Fixes & Data Reliability
| Contract | Location | Phase 115 Must |
|----------|----------|----------------|
| `queryKeys` factory | `src/lib/queryKeys.ts` | Extend (add `orders.paginated`), never inline arrays |
| Query retry: 3x exp backoff | `query-provider.tsx` | Use as-is, never change mutation retry (literal `false`) |
| Error code registry | `src/types/errors.ts` | Extend with new codes if needed |
| Shared backoff util | `src/lib/utils/backoff.ts` | Import, don't duplicate |
| AbortController cleanup | All async hooks | Follow pattern in new hooks |

### From Phase 111: Checkout Conversion
| Contract | Location | Phase 115 Must |
|----------|----------|----------------|
| Menu polling (`pollWhileNonEmpty`) | `useMenu.ts` | Not trigger unsolicited polling on /menu page |
| Canonical `menuQueryFn` export | `useMenu.ts` | Share queryFn refs for prefetch |
| `queryKeys.menu.*` structure | `queryKeys.ts` | Extend `.search()` with pagination params |
| CheckoutErrorBanner pattern | `CheckoutErrorBanner.tsx` | Extend error enum if needed |
| Form persistence (sessionStorage) | `checkout-store.ts` | Not break `partialize` config |

### From Phase 112: Order Tracking Overhaul
| Contract | Location | Phase 115 Must |
|----------|----------|----------------|
| Visibility pause pattern | `useTrackingSubscription.ts` | Extend (not replace) for offline features |
| Drawer exit animation | `Drawer.tsx` | NEVER modify (GPU crash protection) |

### From Phase 113: Accessibility & Design System
| Contract | Location | Phase 115 Must |
|----------|----------|----------------|
| 44px touch targets | Button/Input `sm` | Apply to any new interactive elements |
| Focus-visible ring pattern | All interactive | Use `focus-visible:`, never `focus:` |
| Token enforcement | ESLint rules | No hardcoded colors |

### From Phase 114: Loading States & Offline
| Contract | Location | Phase 115 Must |
|----------|----------|----------------|
| Skeleton + LoadingWithTimeout | All loading.tsx | Respect 15s/30s hierarchy |
| IDB-first menu | `useMenuCache` | Not bypass IDB on cold start |
| Cart sync on reconnect | `syncPendingCartItems` | Not duplicate sync logic |
| Hydration guards | `useEffect + mounted` | SSR-safe patterns |

### Feeds into Phase 116: Micro-Interactions & Polish
| What 115 Establishes | What 116 Needs |
|---------------------|----------------|
| Optimistic cart mutation pattern | Undo-delete needs optimistic-delete + timer rollback |
| Query invalidation after mutations | Delete operations invalidate correct key |
| Pagination infrastructure | Smooth list rendering for swipe-to-delete |

---

## 4. Gotcha Inventory

### CRITICAL (Must address or will break)

| # | Gotcha | Feature | Fix | Source |
|---|--------|---------|-----|--------|
| C1 | PostgREST ambiguous FK hints | DATA-04 | When querying orders with profile joins, always use `profiles!orders_user_id_fkey` hint | data-schema.md |
| C2 | Mutations NEVER retry | DATA-01 | Phase 115 must maintain `retry: false` for all mutations | Phase 110 D-23 |
| C3 | Debounce check MUST be inside Zustand `set()` | DATA-01 | Atomic batching prevents race conditions on rapid adds | BUG-06, cart-store.ts |
| C4 | Settings sync full thread required | DATA-01 | New settings: `getBusinessRules()` → layout → Shell → DeliverySettingsSync → store | state-management.md |
| C5 | No `void asyncFn()` on Vercel | All | Use `await` or `after()` for fire-and-forget | nextjs.md |
| C6 | Business rules mock must handle all Promise.all queries | All | Test mocks must include all tables in `getBusinessRules` | testing.md |

### HIGH (Will cause bugs if ignored)

| # | Gotcha | Feature | Fix | Source |
|---|--------|---------|-----|--------|
| H1 | Zustand + IDB hydration not reactive in useMemo | DATA-01 | Use direct selector `useStore((s) => s.field)`, not `getState()` in useMemo | state-management.md |
| H2 | Single mutation owner principle | DATA-01 | Action buttons use callbacks, never mutate directly | state-management.md |
| H3 | IMMUTABLE required for index expressions | DATA-04 | Wrap `timestamptz::date` casts in IMMUTABLE function for index predicates | data-schema.md |
| H4 | Supabase fluent chain mocks must match exact shape | All | Adding `.range()` to queries requires updating test mocks | testing.md |
| H5 | CartItemValidation lacks name/oldPrice | DATA-01 | Join against `useCartStore((s) => s.items)` via cartItemId for display data | Phase 111-03 SUMMARY |
| H6 | Server component can't use useInfiniteQuery | DATA-04 | Orders page.tsx is server component — need hybrid approach or full client conversion | orders/page.tsx |
| H7 | Never internal fetch from server components to own API | DATA-04 | Extract shared query logic into helper, call directly from server component | nextjs.md |
| H8 | Stale tests after validation rule changes | All | Grep for affected tests when modifying validation schemas | testing.md |

### MEDIUM (Nice to know, may cause issues)

| # | Gotcha | Feature | Fix | Source |
|---|--------|---------|-----|--------|
| M1 | `.update()` returns no row count | DATA-01 | Chain `.select("id")` to verify affected rows | stripe.md |
| M2 | Supabase types need manual entries for new RPCs | DATA-04 | Add to `database.ts` Functions block before queries | data-schema.md |
| M3 | Optional interface fields for backward compat | All | Prefer `field?: Type` over required when extending interfaces | testing.md |
| M4 | Modifier option slugs need group prefix | DATA-04 | Use `buildOptionSlug(groupSlug, optionSlug)` pattern | data-schema.md |
| M5 | `process.env.KEY` inlined at build time | All | Don't validate secrets via Zod on process.env | nextjs.md |

---

## 5. Data Contracts

### Current Cart Store Shape
```typescript
CartStore {
  items: CartItem[]           // Persisted to IDB
  _hasHydrated: boolean       // Gate for rendering
  // Delivery settings (transient, set on app load)
  deliveryFeeCents, freeDeliveryThresholdCents, cutoffDay, cutoffHour
  deliveryDays: DeliveryDayConfig[], addressDistanceMiles: number | null
  // Actions
  addItem, removeItem, updateQuantity, updateItem, clearCart, updateItemPrice
  // Computed
  getItemsSubtotal, getEstimatedDeliveryFee, getItemCount, getItemTotal
}
```

### CartItem Data Model
```typescript
CartItem {
  cartItemId: string          // UUID, generated on add
  menuItemId: string          // FK to menu_items
  basePriceCents: number
  quantity: number            // [1, 50]
  modifiers: SelectedModifier[]
  notes: string
  pendingSync?: boolean       // Set when offline
}
```

### Query Key Factory (Phase 110)
```typescript
queryKeys = {
  menu:      { all, list(), search(query) }
  addresses: { all, list(), detail(id) }
  orders:    { all, history(), itemsForSearch(userId) }
}
```

### Phase 115 Extensions Needed
```typescript
// Extend queryKeys for paginated orders
orders: {
  ...existing,
  paginated: (cursor?: string, limit?: number) =>
    [...queryKeys.orders.all, "paginated", cursor ?? "initial", limit ?? 10] as const,
}

// Extend menu search for paginated results
menu: {
  ...existing,
  search: (query: string, page?: number) =>
    [...queryKeys.menu.all, "search", query, page ?? 1] as const,
}
```

### New API Response Types
```typescript
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// For cursor-based (orders)
interface CursorPaginatedResponse<T> {
  data: T[]
  pagination: {
    nextCursor: string | null
    hasMore: boolean
    limit: number
  }
}
```

---

## 6. React Query Infrastructure

### Current State
| Aspect | Status |
|--------|--------|
| useQuery hooks | 5 (menu, menuSearch, addresses, address, orderHistorySearch) |
| useMutation hooks | 5 (address CRUD + coverage check) |
| useInfiniteQuery | NOT USED (zero instances) |
| Optimistic mutations | NONE |
| setQueryData calls | NONE (production) |
| Prefetching | Checkout step-ahead (menuQueryFn, addressesQueryFn) |
| Cache invalidation | Only addresses namespace (`queryKeys.addresses.all`) |

### Phase 115 Additions
- New `useOrdersPaginated` hook (useQuery or useInfiniteQuery with pagination)
- Extend `useMenuSearch` with limit parameter
- Potentially: `useMutation` wrapper for cart operations (if formalizing pattern)

---

## 7. Pagination Feasibility

### Orders: Cursor Pagination
- **Composite index exists:** `idx_orders_status_placed` on `(status, placed_at DESC)`
- **Cursor column:** `placed_at` (already used for sorting) + `id` for tie-breaking
- **RLS:** `user_id = auth.uid()` filter applies before pagination
- **Missing index:** Need `(user_id, placed_at DESC, id)` for optimal cursor scan
- **Feasibility:** HIGH

### Menu Search: Offset Pagination
- **Current query:** `.or(name_en.ilike.%, name_my.ilike.%, description_en.ilike.%)`
- **Sort:** `.order("name_en")`
- **Add:** `.range(0, limit - 1)` for offset pagination
- **Missing index:** `(is_active, name_en)` for sorted active items
- **Feasibility:** HIGH

### Admin Orders: Already Paginated
- `/api/admin/orders` supports `?page=1&limit=25` with `.range()`
- Frontend doesn't use pagination params — out of Phase 115 scope

---

## 8. Existing Pattern Analysis

### Cart Optimistic Update (Already Implemented)
```
User clicks "Add to Cart"
  → AddToCartButton debounce check (500ms)
  → Parent onAdd callback
  → cart-store.addItem() — synchronous Zustand set()
    → Dedup check (signature: menuItemId + modifiers + notes)
    → Store-level debounce check (300ms, inside set())
    → Item added/merged in state
    → Persisted to IndexedDB
  → UI updates immediately (zero latency)
```

### Cart Validation (Three Layers)
```
Layer 1: UI Detection (useCartValidation)
  - Polls /api/menu every 3min while cart non-empty
  - Detects: price changes, sold-out, unavailable
  - Shows: PriceChangeBadge on affected items
  - User action: dismiss or navigate to cart

Layer 2: Online Sync (syncPendingCartItems)
  - Triggers on browser "online" event
  - Validates pendingSync items against /api/menu
  - Removes unavailable, updates prices, clears flags
  - Toast notifications for each change

Layer 3: Checkout Validation (fetchAndValidateCart)
  - Server-side authoritative validation
  - Checks: existence, active status, modifier constraints
  - Revalidation before Stripe session creation
  - Blocks checkout on failure (user must fix cart)
```

### Search Deduplication (Already Implemented)
```
User types "noodle" rapidly
  → SearchInput: query state updates per keystroke
  → useDebounce(query, 300ms): only last value propagates
  → useMenuSearch(debouncedQuery): single React Query call
  → queryKey: ["menu", "search", "noodle"]
  → React Query: auto-dedups concurrent same-key requests
  → staleTime: 60s (cached result on re-search)
  → Result: 1 API call per typing burst
```

---

## 9. File Map

### Create
| File | Purpose |
|------|---------|
| `src/app/api/account/orders/route.ts` | Customer orders list API with cursor pagination |
| `src/lib/hooks/useOrdersPaginated.ts` | React Query hook for paginated orders |
| `supabase/migrations/0XX_pagination_indexes.sql` | Composite indexes for cursor pagination |

### Modify
| File | Change |
|------|--------|
| `src/lib/queryKeys.ts` | Extend orders + menu search with pagination params |
| `src/app/api/menu/search/route.ts` | Add `limit` + `offset` query params |
| `src/lib/hooks/useMenu.ts` | Extend `useMenuSearch` with limit parameter |
| `src/components/ui/menu/SearchAutocomplete.tsx` | Handle paginated results (show count, "N results") |
| `src/app/(customer)/orders/page.tsx` | Fetch first page only, pass to client wrapper |
| `src/components/ui/orders/OrderListAnimated.tsx` | Accept pagination props or wrap with paginator |
| `src/types/menu.ts` | Add pagination fields to `MenuSearchResponse` |

### Read (Reference Only)
| File | Why |
|------|-----|
| `src/lib/stores/cart-store.ts` | Understand existing optimistic pattern |
| `src/lib/hooks/useCartValidation.ts` | Understand validation layers |
| `src/lib/providers/query-provider.tsx` | QueryClient config constraints |
| `src/app/api/admin/orders/route.ts` | Reference pagination implementation |

---

## 10. Gray Area Resolutions

| # | Ambiguity | Resolution | Evidence | Confidence |
|---|-----------|-----------|----------|------------|
| G1 | "Optimistic updates" on local-only cart | Formalizing EXISTING local-first pattern, NOT creating server API | cart-store.ts is synchronous Zustand, no server round-trip on add/remove | 95% |
| G2 | Menu search pagination = autocomplete or page? | Autocomplete dropdown ONLY (no `/search` route exists) | SearchAutocomplete.tsx is the only search UI | 85% |
| G3 | Orders: infinite scroll vs page numbers? | Page numbers or "Load More" button, NOT infinite scroll | Admin API uses page/limit; useInfiniteQuery has zero usage | 70% |
| G4 | Phase 111-04 status | COMPLETE — ROADMAP checkbox is stale | 111-04-SUMMARY.md exists, completed 2026-04-08 | 99% |
| G5 | Admin pagination in scope? | OUT OF SCOPE — success criteria say "orders list" (customer) | Literal read of success criteria | 95% |
| G6 | Full menu list pagination? | OUT OF SCOPE — criteria say "menu search", not "menu list" | 47 items, single restaurant | 95% |
| G7 | Cart validation timing after add/remove? | Current pattern correct — mount + 3min poll, NOT per-mutation | Phase 110/111 explicitly defined this | 95% |

---

## 11. Database Migrations Needed

### New Composite Indexes
```sql
-- Customer orders cursor pagination (user_id filter + placed_at sort + id tiebreak)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_placed_id
  ON orders (user_id, placed_at DESC, id DESC);

-- Menu items sorted by name for paginated search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_active_name
  ON menu_items (name_en)
  WHERE is_active = true;
```

### No Schema Changes Required
- No new tables needed
- No column additions needed
- Cart stays client-side (no server cart table)

---

## 12. Architecture Decisions

### Decision 1: Orders Pagination — Hybrid Server/Client
**Options:**
- A) Pure server component with URL-based pagination (`?page=2`)
- B) Full client component with useInfiniteQuery
- C) **Hybrid: server-render first page, client "Load More"** (CHOSEN)

**Rationale:** Preserves SSR benefits (SEO, fast first paint, Phase 114 skeleton), adds progressive enhancement. Creates new `/api/account/orders` route with cursor pagination; client-side hook fetches subsequent pages.

### Decision 2: Menu Search — Server-side Limit
**Options:**
- A) Client-side truncation (fetch all, show first N)
- B) **Server-side limit+offset on /api/menu/search** (CHOSEN)

**Rationale:** Prevents unbounded payload. At 47 items it's fine, but success criteria mandate "no unbounded fetch." Add `?limit=20` default with server enforcement.

### Decision 3: Cart Optimistic — Document, Don't Rebuild
**Options:**
- A) Add server-side cart API with useMutation + rollback
- B) **Document existing local-first pattern as "already optimistic"** (CHOSEN)

**Rationale:** Cart is already instant (synchronous Zustand). Adding server round-trip would hurt offline UX and add complexity for zero UX improvement. The 3-layer validation (UI detection, online sync, checkout) is the correct architecture.

### Decision 4: Cursor vs Offset Pagination for Orders
**Options:**
- A) Offset (`?page=2&limit=10`) — simpler, matches admin pattern
- B) **Cursor (`?cursor=<placed_at>&limit=10`)** — better for real-time data (CHOSEN)

**Rationale:** New orders shift offset pagination results. Cursor pagination is stable across concurrent inserts. `placed_at + id` composite cursor is natural for chronological data.

---

## 13. Verification Approach

### DATA-01: Cart Optimistic Updates
- **Test:** Add item → UI updates immediately (measure: <16ms, one frame)
- **Test:** Add item offline → `pendingSync: true` flag set
- **Test:** Come online with stale item → item removed, toast shown
- **Test:** Checkout with price-changed item → server rejects, error banner shown
- **Verify:** No regressions in cart debounce (300ms store-level, 500ms button-level)

### DATA-03: Search Deduplication
- **Test:** Type "noodle" rapidly → network tab shows 1 API call
- **Test:** Search "noodle", clear, search "noodle" within 60s → cached response
- **Test:** Two search mounts with same query → React Query dedup (1 call)
- **Verify:** 300ms debounce + 60s staleTime + enabled gate all working

### DATA-04: Pagination
- **Test:** Orders page loads first 10 orders, "Load More" fetches next 10
- **Test:** Menu search returns max 20 results per page
- **Test:** Empty search returns no API call (enabled: false)
- **Test:** Orders with 0 results shows empty state (no pagination UI)
- **Verify:** Composite indexes created and query plans use them

---

_Research completed: 2026-04-10_
_Protocol: Deep Phase Assumptions (12-Agent, 2-Wave)_
_Agents: 6 Wave 1 + 6 Wave 2 = 12 parallel research agents_
