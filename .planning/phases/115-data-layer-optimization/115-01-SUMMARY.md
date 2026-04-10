---
phase: 115-data-layer-optimization
plan: 01
subsystem: data-layer
tags: [pagination, indexes, query-keys, types]
dependency_graph:
  requires: []
  provides: [pagination-indexes, orders-list-querykey, menu-search-pagination-type]
  affects: [115-02, 115-03]
tech_stack:
  added: []
  patterns: [cursor-pagination-keys, partial-index]
key_files:
  created:
    - supabase/migrations/20260410_pagination_indexes.sql
  modified:
    - src/lib/queryKeys.ts
    - src/lib/queryKeys.test.ts
    - src/types/menu.ts
decisions:
  - "menu.search key now includes page number (default 1) -- changes cache key shape for existing callers"
  - "orders.list uses 'initial' as default cursor sentinel for consistent key identity"
  - "MenuSearchPagination.pagination is optional for backward compat with existing consumers"
metrics:
  duration: 5min
  completed: "2026-04-10T12:17:00Z"
  tasks: 2
  files: 4
---

# Phase 115 Plan 01: Foundation (Indexes + QueryKeys + Types) Summary

Pagination indexes for orders cursor scan and menu search sort, extended queryKeys factory with orders.list(cursor) and menu.search(query, page), MenuSearchPagination type with limit/offset/total/hasMore.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create pagination indexes migration | e9e3c582 | supabase/migrations/20260410_pagination_indexes.sql |
| 2 | Extend queryKeys factory + MenuSearchResponse type | ce5912b7 | src/lib/queryKeys.ts, src/lib/queryKeys.test.ts, src/types/menu.ts |

## Key Changes

### Migration: Pagination Indexes
- `idx_orders_user_placed_id`: composite `(user_id, placed_at DESC, id DESC)` for cursor pagination
- `idx_menu_items_active_name`: partial index on `name_en WHERE is_active = true` for sorted search
- Both use `CONCURRENTLY` to avoid table locks (D-28)
- Both use `IF NOT EXISTS` for idempotent re-runs

### QueryKeys Extension
- `orders.list(cursor?)` -- cursor defaults to `"initial"` for cache identity (D-29)
- `menu.search(query, page?)` -- page defaults to `1` (D-30)
- `QueryKey` union includes `orders.list` (D-31)
- Zero `as any` casts (D-32)
- JSDoc on new factory methods

### MenuSearchResponse Extension
- New `MenuSearchPagination` interface: `{ limit, offset, total, hasMore }` (D-16)
- `MenuSearchResponse.data.pagination?` optional for backward compat

## Verification

- `pnpm typecheck` -- clean (zero type errors)
- `pnpm test` -- 1032 tests passing (67 test files)
- queryKeys tests: 13 tests (added 3 for orders.list and paginated search)
- Existing `useMenuSearch` single-arg call compiles without changes

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Cache key shape change**: `menu.search("pizza")` now produces `["menu", "search", "pizza", 1]` instead of `["menu", "search", "pizza"]`. This is a cache key change but since all callers go through the factory, cache invalidation stays consistent. Existing cached data will be refetched on next load (one-time cost).

2. **Default cursor sentinel**: Using `"initial"` string (not `undefined`) as default cursor ensures `orders.list()` and `orders.list(undefined)` produce identical keys for structural equality.

3. **Optional pagination field**: `MenuSearchResponse.data.pagination?` marked optional so existing search consumers (SearchAutocomplete, useMenuSearch) work without changes until Plan 03 wires pagination params.

## Self-Check: PASSED

- All 5 files verified present on disk
- Both commit hashes (e9e3c582, ce5912b7) found in git log
