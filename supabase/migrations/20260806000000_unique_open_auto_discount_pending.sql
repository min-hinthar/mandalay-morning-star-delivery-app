-- DB belt for the concurrent-tab first-order discount race (audit D6
-- follow-up, deferred from the app-level fix).
--
-- The app-level gate (resolveFirstOrderDiscount) reads "no discounted
-- pending orders" during discount resolution, but the current checkout's own
-- row isn't inserted until create_order_with_items much later in the route —
-- two genuinely parallel submissions can both read zero pendings and both be
-- granted the first-order discount. This index makes the second INSERT fail
-- (SQLSTATE 23505), which the checkout route maps to a friendly 409.
--
-- The predicate is DELIBERATELY NARROWED to promo_code IS NULL — exactly the
-- auto-granted first-order rows (welcome/referee bare coupons; the discount
-- resolver only sets discount_cents with a NULL promo_code on this path):
--
--   * A blanket (status='pending' AND discount_cents>0) predicate would
--     break legitimate flows: amount_off promo codes (loyalty KYAYZU-,
--     shareable referral codes) and non-first-time percent codes create
--     discounted pendings with NO reclaim flow, so abandon-and-retry with
--     such a code would 23505 for up to the 30-minute Stripe session
--     lifetime. Those rows always carry promo_code NOT NULL and stay
--     outside this index.
--   * Sequential first-order retry still works: the resolver reclaims
--     (expires + cancels) every stale auto-discounted pending BEFORE
--     granting again, freeing the slot; if reclaim fails, the discount is
--     withheld and the new row has discount_cents=0 — outside the
--     predicate either way.
--   * COD orders insert as 'pending_approval', never 'pending' — untouched.
--
-- Residual (documented, not closed): one tab holding a promo-coded
-- discounted pending while another gets the auto discount — the app-level
-- gate (which counts ANY discounted pending) remains the only cover there.
--
-- Pre-clean: if the exact race artifact already exists (two open
-- auto-discounted pendings for one user), index creation would fail.
-- Cancel all but the newest per user. Raw-cancelling skips the Stripe
-- session-expire step, but these rows are ≤30 min old by construction
-- (session lifetime); if such a session still completes, the
-- checkout.session.completed webhook records the payment and the order
-- surfaces for admin review — money is never lost, and stacking is
-- prevented from this point on.
UPDATE public.orders o
SET status = 'cancelled'
WHERE o.status = 'pending'
  AND o.discount_cents > 0
  AND o.promo_code IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders newer
    WHERE newer.user_id = o.user_id
      AND newer.status = 'pending'
      AND newer.discount_cents > 0
      AND newer.promo_code IS NULL
      -- Tuple tie-break: created_at is transaction-start time, so genuinely
      -- parallel inserts (the exact race this closes) can land equal
      -- timestamps — a bare created_at comparison would keep BOTH rows and
      -- fail the CREATE UNIQUE INDEX below. id is the PK, so the tuple
      -- comparison is strictly total: exactly one row per user survives.
      AND (newer.created_at, newer.id) > (o.created_at, o.id)
  );

-- Plain (non-CONCURRENT) creation: the Supabase CLI wraps migrations in a
-- transaction, where CREATE UNIQUE INDEX CONCURRENTLY is not allowed. The
-- brief lock is fine at current scale.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_open_auto_discount
  ON public.orders (user_id)
  WHERE status = 'pending' AND discount_cents > 0 AND promo_code IS NULL;
