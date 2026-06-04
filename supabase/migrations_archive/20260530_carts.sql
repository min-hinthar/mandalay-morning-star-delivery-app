-- ===========================================
-- 20260530: Server-persisted carts
-- ===========================================
-- One cart row per user, mirroring the client cart. Lets a signed-in
-- customer's cart survive across devices/browsers (cross-device restore)
-- and powers abandoned-cart recovery. The client cart (IndexedDB) remains
-- the source of truth during an active session; this is the durable copy.
--
-- Item prices stored here are a display snapshot only — checkout re-validates
-- authoritatively server-side, so these values are never trusted for payment.
-- ===========================================

CREATE TABLE IF NOT EXISTS carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  -- Last time an abandoned-cart reminder was sent (dedupe for the cron).
  reminded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index for the abandoned-cart cron: non-empty carts by recency.
CREATE INDEX IF NOT EXISTS idx_carts_abandoned ON carts (updated_at) WHERE item_count > 0;

-- ===========================================
-- RLS — a user may only touch their own cart
-- ===========================================
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carts_select" ON carts;
CREATE POLICY "carts_select" ON carts FOR SELECT
  USING (user_id = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "carts_insert" ON carts;
CREATE POLICY "carts_insert" ON carts FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "carts_update" ON carts;
CREATE POLICY "carts_update" ON carts FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "carts_delete" ON carts;
CREATE POLICY "carts_delete" ON carts FOR DELETE
  USING (user_id = (select auth.uid()));

COMMENT ON TABLE carts IS
  'Server-persisted shopping cart (one per user) for cross-device restore and abandoned-cart recovery. Prices are a display snapshot; checkout re-validates authoritatively.';
