-- Privilege hardening: close customer/driver/anon escalation paths through the
-- Supabase REST API (PostgREST), all reproduced against a local stack built
-- from these migrations.
--
-- Root cause shared by most of these: Supabase's default ACL grants anon and
-- authenticated full DML (+ TRUNCATE/TRIGGER/REFERENCES) on every public table,
-- so row-level policies are the ONLY guard — and several owner-scoped policies
-- had no column restriction. Whoever holds a session (or just the public anon
-- key) could write any column the policy's row filter admitted.
--
-- Every app write listed as "legit" below was re-verified after this migration.
-- Server paths use the service role (bypasses RLS and these column grants) or
-- run as an admin (explicitly exempted where a trigger guards columns).
--
-- COLUMN GRANTS FAIL CLOSED: a column added later to profiles / drivers /
-- addresses is NOT writable through a user-scoped client until a migration
-- grants it. That is intended.

-- ---------------------------------------------------------------------------
-- 1. profiles — any customer could PATCH their own role to 'admin' (is_admin()
--    and requireAdmin() trust profiles.role), and reset one-shot reward stamps
--    (loyalty_thanked_at → a fresh $5 code every day) or forge email /
--    referral_code. Legit user-scoped writes: full_name, phone (account,
--    driver and admin profile routes) and the ensureProfile fallback insert
--    {id, email, role:'customer'} ON CONFLICT DO NOTHING.
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT INSERT (id, email, role) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, updated_at) ON public.profiles TO authenticated;

-- The self-heal insert (ensureProfile's user-client fallback) sends the auth
-- email or null; pin it so a user whose row went missing can't claim another
-- identity's email.
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    (id = ( SELECT auth.uid() AS uid))
    AND (role = 'customer'::text)
    AND (email IS NULL OR lower(email) = lower(( SELECT auth.jwt() ->> 'email')))
  );

-- Belt that survives a future blanket re-grant: end-user roles can never set
-- or change profiles.role. SECURITY INVOKER on purpose — current_user must be
-- the caller (a definer function would see its owner and exempt everyone).
CREATE OR REPLACE FUNCTION app_private.guard_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND NEW.role IS DISTINCT FROM 'customer' THEN
      RAISE EXCEPTION 'profiles.role can only be set by the server' USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'profiles.role can only be changed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION app_private.guard_profile_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_profile_role ON public.profiles;
CREATE TRIGGER trg_guard_profile_role BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_profile_role();

-- ---------------------------------------------------------------------------
-- 2. Marketing / cron SECURITY DEFINER readers were executable by anon: one
--    POST /rest/v1/rpc/... dumped every opted-in customer's email + name and
--    live unredeemed reward codes. Only the service role calls them (cron
--    routes, admin referrals page after its own admin check).
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_expiring_loyalty_rewards(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_lapsed_customers(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_loyalty_thankyou_candidates(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_anniversary_customers(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_loyalty_tier_distribution() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_expiring_loyalty_rewards(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lapsed_customers(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_loyalty_thankyou_candidates(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_anniversary_customers(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_loyalty_tier_distribution() TO service_role;

-- ---------------------------------------------------------------------------
-- 3. drivers — a deactivated driver could set is_active=true again (and forge
--    rating_avg / deliveries_count / onboarding_completed_at). Legit
--    driver-scoped writes: vehicle_type, license_plate, phone, simple_mode
--    (profile), profile_image_url (photo), availability_json. Admin writes
--    use the service client; rating/deliveries are maintained by definer
--    triggers. INSERT stays (drivers_insert is admin-only).
-- ---------------------------------------------------------------------------
REVOKE UPDATE ON public.drivers FROM anon, authenticated;
GRANT UPDATE (vehicle_type, license_plate, phone, simple_mode, profile_image_url, availability_json, updated_at)
  ON public.drivers TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. addresses — customers could forge is_verified / distance_miles / lat /
--    lng, which checkout trusts for coverage, direction routing and the
--    delivery-fee band (a 95mi address priced as local). The add/edit routes
--    now write through the service client after auth + ownership checks;
--    the only user-scoped write left is set-default (is_default, updated_at).
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.addresses FROM anon, authenticated;
GRANT UPDATE (is_default, updated_at) ON public.addresses TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. orders / order_items / order_item_modifiers — a customer could INSERT a
--    fully forged order (any status, $0 total, fake payment intent, COD
--    pre-approved) or append $0 items to a paid order, bypassing the
--    server-priced create_order_with_items RPC. No app code inserts these
--    through a user-scoped client.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS orders_insert ON public.orders;
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
DROP POLICY IF EXISTS order_item_modifiers_insert ON public.order_item_modifiers;
REVOKE INSERT ON public.orders, public.order_items, public.order_item_modifiers FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. orders UPDATE by customers and drivers had no column scope:
--    - customer self-cancel could rewrite stripe_payment_intent_id / totals
--      while cancelling (the refund cron then refunds a DIFFERENT, delivered
--      order's charge to the attacker);
--    - a driver could rewrite money / payment / owner columns of any order on
--      their route and jump statuses (cancelled→delivered, delivered→confirmed).
--    Allowed for end users (admins and the service role are exempt):
--      owner:  status (pending|pending_approval|confirmed → cancelled),
--              special_instructions, rating_dismissed
--      driver: status (confirmed|preparing → out_for_delivery,
--              out_for_delivery → delivered), delivered_at (only on that
--              delivered step), needs_contact (→ true)
--    RLS still decides WHICH rows each may touch; this decides WHAT changes.
--    The owner's source-status bound is load-bearing even though
--    orders_update_customer_cancel's USING already has it: permissive UPDATE
--    policies are OR-ed per clause, so a driver whose OWN order sits on their
--    route passes USING via orders_update_driver (any status) and WITH CHECK
--    via the cancel policy — delivered → cancelled, which the refund cron
--    would then auto-refund.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.guard_order_client_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_changed text[];
BEGIN
  -- SECURITY INVOKER: current_user is the PostgREST role for end users.
  IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(array_agg(n.key), ARRAY[]::text[]) INTO v_changed
    FROM jsonb_each(to_jsonb(NEW)) AS n
   WHERE n.key <> 'updated_at'
     AND n.value IS DISTINCT FROM (to_jsonb(OLD) -> n.key);

  IF cardinality(v_changed) = 0 THEN
    RETURN NEW;
  END IF;

  -- Owner (customer): cancel, notes, dismiss the rating prompt.
  IF OLD.user_id = (SELECT auth.uid())
     AND v_changed <@ ARRAY['status', 'special_instructions', 'rating_dismissed']
     AND (NEW.status = OLD.status
          OR (NEW.status = 'cancelled' AND OLD.status IN ('pending', 'pending_approval', 'confirmed'))) THEN
    RETURN NEW;
  END IF;

  -- Driver with this order on their route: forward delivery steps only.
  IF app_private.order_on_my_route(OLD.id)
     AND v_changed <@ ARRAY['status', 'delivered_at', 'needs_contact']
     AND (NEW.status = OLD.status
          OR (OLD.status IN ('confirmed', 'preparing') AND NEW.status = 'out_for_delivery')
          OR (OLD.status = 'out_for_delivery' AND NEW.status = 'delivered'))
     AND (NEW.needs_contact IS NOT DISTINCT FROM OLD.needs_contact OR NEW.needs_contact = true)
     AND (NEW.delivered_at IS NOT DISTINCT FROM OLD.delivered_at
          OR (OLD.status = 'out_for_delivery' AND NEW.status = 'delivered')) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'orders: change to (%) is not permitted for this caller', array_to_string(v_changed, ', ')
    USING ERRCODE = '42501';
END;
$function$;
REVOKE ALL ON FUNCTION app_private.guard_order_client_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_order_client_update ON public.orders;
CREATE TRIGGER trg_guard_order_client_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_order_client_update();

-- ---------------------------------------------------------------------------
-- 7. route_stops — a driver could re-point a stop on their own route to ANY
--    order_id, which order_on_my_route() then treated as theirs (read the
--    customer's PII, move unpaid orders into fulfillment). Only admins (and
--    definer RPCs like merge_routes) may change a stop's order_id / route_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.guard_route_stop_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF (NEW.order_id IS DISTINCT FROM OLD.order_id OR NEW.route_id IS DISTINCT FROM OLD.route_id)
     AND current_user IN ('anon', 'authenticated')
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'route_stops.order_id/route_id can only be changed by an admin'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION app_private.guard_route_stop_identity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_route_stop_identity ON public.route_stops;
CREATE TRIGGER trg_guard_route_stop_identity BEFORE UPDATE OF order_id, route_id ON public.route_stops
  FOR EACH ROW EXECUTE FUNCTION app_private.guard_route_stop_identity();

-- ---------------------------------------------------------------------------
-- 8. Analytics materialized views were readable by anon (driver names/emails,
--    daily revenue). MVs can't carry RLS; the app reads them only through the
--    is_admin()-gated SECURITY DEFINER wrappers. NOTE: a migration that
--    re-creates either view must repeat this REVOKE (default privileges
--    re-grant anon/authenticated on every new relation).
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.driver_stats_mv, public.delivery_metrics_mv FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. driver_ratings — a customer with any delivered order could rate ANY
--    driver (and any stop). Bind the rating to the driver whose route
--    actually delivered the caller's order. Definer helper because customers
--    can't read `routes` under RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.can_rate_delivery(p_order_id uuid, p_driver_id uuid, p_route_stop_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM public.orders o
      JOIN public.route_stops rs ON rs.order_id = o.id
      JOIN public.routes r ON r.id = rs.route_id
     WHERE o.id = p_order_id
       AND o.user_id = (SELECT auth.uid())
       AND o.status = 'delivered'
       AND rs.status = 'delivered'
       AND r.driver_id = p_driver_id
       AND (p_route_stop_id IS NULL OR rs.id = p_route_stop_id)
  );
$function$;
REVOKE ALL ON FUNCTION app_private.can_rate_delivery(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.can_rate_delivery(uuid, uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS driver_ratings_insert ON public.driver_ratings;
CREATE POLICY driver_ratings_insert ON public.driver_ratings AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (app_private.can_rate_delivery(order_id, driver_id, route_stop_id));

-- Recompute on DELETE too (the trigger read NEW, which is NULL on delete, so
-- removing a forged rating never repaired the average), and recompute the
-- previous driver when an UPDATE moves a rating.
CREATE OR REPLACE FUNCTION public.update_driver_rating_avg()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_driver uuid;
  v_new_avg NUMERIC(3, 2);
BEGIN
  FOREACH v_driver IN ARRAY ARRAY[
    CASE WHEN TG_OP <> 'DELETE' THEN NEW.driver_id END,
    CASE WHEN TG_OP <> 'INSERT' THEN OLD.driver_id END
  ] LOOP
    CONTINUE WHEN v_driver IS NULL;
    SELECT ROUND(AVG(rating)::NUMERIC, 2) INTO v_new_avg
      FROM driver_ratings
     WHERE driver_id = v_driver;
    UPDATE drivers
       SET rating_avg = COALESCE(v_new_avg, 0), updated_at = NOW()
     WHERE id = v_driver;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 10. delivery_exceptions — a driver could file an exception already marked
--     resolved (credited to an admin), hiding a skipped stop from ops, or
--     backdate it / attach an arbitrary photo URL. The driver route sends only
--     route_stop_id, exception_type, description.
-- ---------------------------------------------------------------------------
REVOKE INSERT ON public.delivery_exceptions FROM anon, authenticated;
GRANT INSERT (route_stop_id, exception_type, description) ON public.delivery_exceptions TO authenticated;
DROP POLICY IF EXISTS delivery_exceptions_insert ON public.delivery_exceptions;
CREATE POLICY delivery_exceptions_insert ON public.delivery_exceptions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    resolved_at IS NULL AND resolved_by IS NULL AND resolution_notes IS NULL
    AND (EXISTS ( SELECT 1
       FROM (public.route_stops rs
         JOIN public.routes r ON ((rs.route_id = r.id)))
      WHERE ((rs.id = delivery_exceptions.route_stop_id) AND (r.driver_id = ( SELECT public.get_my_driver_id())))))
  );

-- ---------------------------------------------------------------------------
-- 11. app_settings was readable in full by anon (driver pay, admin contact
--     info, kill switches, admin ids). Public pricing needs only 'delivery';
--     drivers read only their pay rate; everything else is admin or service.
--     (is_admin() isn't executable by anon, hence the per-role split. The
--     authenticated policy keeps the name app_settings_select.)
-- ---------------------------------------------------------------------------
-- anon also loses the admin-id column: its readers select only key/value and
-- filter on category (fetchBusinessRules, the health check).
REVOKE SELECT ON public.app_settings FROM anon;
GRANT SELECT (key, value, category) ON public.app_settings TO anon;

DROP POLICY IF EXISTS app_settings_select ON public.app_settings;
CREATE POLICY app_settings_select_anon ON public.app_settings AS PERMISSIVE FOR SELECT TO anon
  USING (category = 'delivery');
CREATE POLICY app_settings_select ON public.app_settings AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    category = 'delivery'
    OR ( SELECT public.is_admin())
    OR (key = 'driver_pay_per_stop_cents' AND EXISTS (
          SELECT 1 FROM public.drivers d
           WHERE d.user_id = ( SELECT auth.uid()) AND d.is_active))
  );

-- ---------------------------------------------------------------------------
-- 12. location_updates — a driver could tag GPS points onto another driver's
--     route (the API's ownership check read the foreign route as null and
--     let it through; fixed in the route too).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS location_updates_insert ON public.location_updates;
CREATE POLICY location_updates_insert ON public.location_updates AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    driver_id = ( SELECT public.get_my_driver_id())
    AND (route_id IS NULL OR EXISTS (
      SELECT 1 FROM public.routes r
       WHERE r.id = location_updates.route_id
         AND r.driver_id = ( SELECT public.get_my_driver_id())))
  );

-- ---------------------------------------------------------------------------
-- 13. TRUNCATE ignores RLS entirely; anon/authenticated held it (plus TRIGGER,
--     REFERENCES) on every public table. PostgREST can't issue TRUNCATE today,
--     but any future SQL-exposing path would wipe the menu, orders or audit
--     logs. No client needs these. Also stop granting them on new tables.
-- ---------------------------------------------------------------------------
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 14. A DEACTIVATED driver kept their DB-level driver identity:
--     get_my_driver_id() matched on user_id alone, so every policy keyed on it
--     (routes, route_stops, location_updates, delivery_exceptions, and
--     orders via order_on_my_route) still admitted them on any route left
--     assigned — straight PostgREST could start the route and move orders to
--     out_for_delivery/delivered. requireDriver() already demands is_active;
--     the DB now agrees. (Deactivated drivers have no app surface that reads
--     through these policies — /driver/deactivated uses the service client.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_driver_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT id INTO v_driver_id
  FROM public.drivers
  WHERE user_id = (select auth.uid())
    AND is_active;
  RETURN v_driver_id;
END;
$function$;
