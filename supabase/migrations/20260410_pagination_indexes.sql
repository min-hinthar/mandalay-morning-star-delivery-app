-- Phase 115 DATA-04: Pagination indexes
-- Applied CONCURRENTLY to avoid table locks in production (D-28)

-- D-26: Customer orders cursor pagination
-- Covers: WHERE user_id = $1 ORDER BY placed_at DESC, id DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_placed_id
  ON orders (user_id, placed_at DESC, id DESC);

-- D-27: Menu items sorted by name for paginated active search
-- Partial index: only active items (matches WHERE is_active = true predicate)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_active_name
  ON menu_items (name_en)
  WHERE is_active = true;
