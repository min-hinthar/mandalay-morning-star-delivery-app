-- ===========================================
-- 20260530: Referral program
-- ===========================================
-- Each customer gets a shareable referral_code. New customers are attributed
-- to a referrer; when the referee places their first order, the referrer earns
-- a reward (a one-time Stripe promo code, issued by the webhook). Redemption
-- reuses the existing checkout promo-code flow.
-- ===========================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_code TEXT,
  reward_cents INTEGER NOT NULL DEFAULT 0 CHECK (reward_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  -- A customer can be referred only once.
  CONSTRAINT referrals_referee_unique UNIQUE (referee_id),
  -- No self-referrals.
  CONSTRAINT referrals_not_self CHECK (referrer_id <> referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- ===========================================
-- RLS — referrer or referee may read their own rows; writes are server-only
-- (claim + reward run through the service role, which bypasses RLS).
-- ===========================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select" ON referrals;
CREATE POLICY "referrals_select" ON referrals FOR SELECT
  USING (
    referrer_id = (select auth.uid())
    OR referee_id = (select auth.uid())
    OR public.is_admin()
  );

COMMENT ON TABLE referrals IS
  'Referral attributions. One row per referee; referrer earns a reward when the referee places their first order.';
