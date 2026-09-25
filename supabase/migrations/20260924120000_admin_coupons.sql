-- Admin-issued one-time coupons: free delivery, fixed $ off, or % off.
--
-- Why app-native (not Stripe promotion codes):
--   * "Free delivery" has no Stripe coupon equivalent — the app waives the
--     delivery fee server-side instead of discounting the charge.
--   * COD orders never touch Stripe, so Stripe's max_redemptions can't make a
--     code single-use there. One row = one redemption, enforced here.
--
-- Single-use model: a coupon is CONSUMED while `order_id` points at an order
-- that is still live. `claim_coupon` (service_role only) takes the row lock and
-- re-assigns the coupon only when the previous holder is gone (FK ON DELETE
-- SET NULL — e.g. checkout cleanup), cancelled, or a Stripe checkout that has
-- sat unpaid in `pending` for 2h since the coupon was LAST CLAIMED
-- (`redeemed_at`). Sessions expire at 30 min and retry-payment re-claims
-- (bumping `redeemed_at`) before every new session, so a payable session
-- never outlives its hold; the margin covers a late completion webhook.
-- Known residual: an admin reinstating a cancelled holder
-- (`cancelled -> pending`) after the coupon was re-claimed elsewhere.

CREATE TABLE public.coupons (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    kind text NOT NULL,
    amount_off_cents integer,
    percent_off integer,
    max_discount_cents integer,
    min_subtotal_cents integer NOT NULL DEFAULT 0,
    assigned_user_id uuid,
    expires_at timestamp with time zone,
    note text,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    revoked_at timestamp with time zone,
    order_id uuid,
    redeemed_at timestamp with time zone,
    redeemed_by uuid,
    CONSTRAINT coupons_pkey PRIMARY KEY (id),
    CONSTRAINT coupons_code_key UNIQUE (code),
    CONSTRAINT coupons_code_format CHECK (code ~ '^[A-Z0-9-]{4,32}$'),
    CONSTRAINT coupons_kind_check CHECK (kind = ANY (ARRAY['free_delivery'::text, 'amount_off'::text, 'percent_off'::text])),
    CONSTRAINT coupons_value_check CHECK (
        (kind = 'free_delivery' AND amount_off_cents IS NULL AND percent_off IS NULL)
        OR (kind = 'amount_off' AND amount_off_cents IS NOT NULL AND percent_off IS NULL)
        OR (kind = 'percent_off' AND percent_off IS NOT NULL AND amount_off_cents IS NULL)
    ),
    CONSTRAINT coupons_amount_off_check CHECK (amount_off_cents IS NULL OR (amount_off_cents > 0 AND amount_off_cents <= 100000)),
    CONSTRAINT coupons_percent_off_check CHECK (percent_off IS NULL OR (percent_off >= 1 AND percent_off <= 100)),
    CONSTRAINT coupons_max_discount_check CHECK (max_discount_cents IS NULL OR max_discount_cents > 0),
    CONSTRAINT coupons_min_subtotal_check CHECK (min_subtotal_cents >= 0),
    CONSTRAINT coupons_note_length CHECK (note IS NULL OR char_length(note) <= 200),
    CONSTRAINT coupons_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT coupons_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT coupons_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_coupons_order_id ON public.coupons USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX idx_coupons_assigned_user ON public.coupons USING btree (assigned_user_id) WHERE (assigned_user_id IS NOT NULL);
CREATE INDEX idx_coupons_created_at ON public.coupons USING btree (created_at DESC);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Read: admins only (rows carry internal notes + holder order ids; customers
-- learn about their coupons by email / at checkout). All writes go through
-- the service role (admin routes after the admin gate; checkout claim).
CREATE POLICY coupons_select ON public.coupons AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_admin());

REVOKE ALL ON TABLE public.coupons FROM anon, authenticated;
GRANT SELECT ON TABLE public.coupons TO authenticated;
GRANT ALL ON TABLE public.coupons TO service_role;

-- Atomically claim a coupon for an order. Returns one of:
--   'ok' | 'not_found' | 'revoked' | 'expired' | 'wrong_user' | 'in_use'
CREATE OR REPLACE FUNCTION public.claim_coupon(p_coupon_id uuid, p_order_id uuid, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_holder_status public.order_status;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE id = p_coupon_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  IF v_coupon.revoked_at IS NOT NULL THEN
    RETURN 'revoked';
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    RETURN 'expired';
  END IF;
  IF v_coupon.assigned_user_id IS NOT NULL AND v_coupon.assigned_user_id <> p_user_id THEN
    RETURN 'wrong_user';
  END IF;

  IF v_coupon.order_id IS NOT NULL AND v_coupon.order_id <> p_order_id THEN
    SELECT status INTO v_holder_status
      FROM public.orders WHERE id = v_coupon.order_id;
    IF FOUND AND NOT (
      v_holder_status = 'cancelled'
      OR (v_holder_status = 'pending' AND v_coupon.redeemed_at < now() - interval '2 hours')
    ) THEN
      RETURN 'in_use';
    END IF;
  END IF;

  UPDATE public.coupons
     SET order_id = p_order_id, redeemed_at = now(), redeemed_by = p_user_id
   WHERE id = p_coupon_id;
  RETURN 'ok';
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_coupon(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_coupon(uuid, uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_coupon(uuid, uuid, uuid) TO service_role;
