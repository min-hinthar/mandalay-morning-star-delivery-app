---
phase: 84-production-hardening
plan: 01
status: complete
commit: 4f8533b2
requirements: [HARD-05]
---

## What was done

Created `supabase/migrations/032_production_indexes.sql` with 5 indexes:

1. `idx_orders_status_placed` - composite on `(status, placed_at DESC)` for ops dashboard sorting
2. `idx_orders_active_status` - partial index excluding delivered/cancelled/pending for active order queries
3. `idx_notification_logs_order_created` - composite on `(order_id, created_at DESC)` for N+1 fix join
4. `idx_routes_date_status` - composite on `(delivery_date, status)` for route listing
5. `idx_route_stops_order_route` - composite on `(order_id, route_id)` for stop lookups

All use `IF NOT EXISTS` for idempotent application.

## Verification
- `pnpm typecheck` passes
- Migration file is valid SQL
