-- ===========================================
-- 20260530: Web Push subscriptions
-- ===========================================
-- Stores browser Push API subscriptions so we can send order-status updates
-- ("Out for delivery", "Arriving") to a customer's device. One row per
-- browser/device endpoint; a user can have several.
-- ===========================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ===========================================
-- RLS — a user manages only their own subscriptions
-- ===========================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select" ON push_subscriptions FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE
  USING (user_id = (select auth.uid()));

COMMENT ON TABLE push_subscriptions IS
  'Browser Web Push subscriptions (one per device endpoint) for order-status notifications.';
