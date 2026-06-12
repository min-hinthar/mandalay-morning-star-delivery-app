-- Security lockdown: SECURITY DEFINER RPC guards + orders RLS repair
--
-- Findings (2026-06 review + live Supabase advisors):
--  1. create_order_with_items was executable by `anon` with no auth binding —
--     anyone holding the public anon key could forge orders for any user_id at
--     arbitrary prices via PostgREST RPC, bypassing the checkout route and the
--     orders_insert policy (SECURITY DEFINER skips RLS).
--  2. merge_routes / split_route / promote_next_stop had no internal authz and
--     were executable by anon/authenticated.
--  3. calculate_driver_streak / calculate_driver_weekly_deliveries /
--     get_driver_latest_location let any caller read any driver's stats and
--     real-time GPS position.
--  4. orders_update was admin-only with no WITH CHECK — which also meant the
--     driver route-start / delivered transitions and the customer self-cancel
--     (all running on user-scoped clients) were silently filtered to 0 rows by
--     RLS: prod audit log shows every transition was performed manually by an
--     admin. Replaced with scoped admin / driver / customer-cancel policies.
--  5. customer_feedback_insert was WITH CHECK (true) (inserts actually go
--     through the service client; the open policy was a spam vector).
--  6. feedback-attachments bucket was public read + write (customer screenshots
--     world-readable; bucket usable as an anonymous file host).
--
-- Guard convention: a check only constrains PostgREST JWT principals.
-- `auth.jwt() IS NULL` (direct DB connections: migrations, tests, psql) and
-- the `service_role` JWT are exempt, so server-side service-client callers and
-- tooling are unaffected.

-- ---------------------------------------------------------------------------
-- 1. create_order_with_items: bind the order to the calling user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb, p_modifiers jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_item_ids UUID[];
  v_item JSONB;
  v_modifier JSONB;
  v_inserted_id UUID;
  v_result JSONB;
  v_status order_status;
  v_payment_method TEXT;
BEGIN
  -- SECURITY DEFINER bypasses the orders_insert WITH CHECK, so bind the
  -- caller's identity here: JWT principals other than service_role may only
  -- create orders for themselves.
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND (
       (p_order ->> 'user_id') IS NULL
       OR auth.uid() IS NULL
       OR (p_order ->> 'user_id')::uuid <> auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Access denied: orders can only be created for the authenticated user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Determine payment method and initial status
  v_payment_method := COALESCE(p_order->>'payment_method', 'stripe');
  IF v_payment_method = 'cod' THEN
    v_status := 'pending_approval';
  ELSE
    v_status := 'pending';
  END IF;

  -- 1. Insert order
  INSERT INTO orders (
    user_id, address_id, status, payment_method,
    subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
    tip_cents, promo_code, discount_cents,
    delivery_window_start, delivery_window_end,
    special_instructions, delivery_instructions,
    customer_phone, customer_name, distance_miles
  ) VALUES (
    (p_order->>'user_id')::UUID,
    (p_order->>'address_id')::UUID,
    v_status,
    v_payment_method,
    (p_order->>'subtotal_cents')::INTEGER,
    (p_order->>'delivery_fee_cents')::INTEGER,
    (p_order->>'tax_cents')::INTEGER,
    (p_order->>'total_cents')::INTEGER,
    COALESCE((p_order->>'tip_cents')::INTEGER, 0),
    p_order->>'promo_code',
    COALESCE((p_order->>'discount_cents')::INTEGER, 0),
    (p_order->>'delivery_window_start')::TIMESTAMPTZ,
    (p_order->>'delivery_window_end')::TIMESTAMPTZ,
    p_order->>'special_instructions',
    p_order->>'delivery_instructions',
    p_order->>'customer_phone',
    p_order->>'customer_name',
    (p_order->>'distance_miles')::DOUBLE PRECISION
  )
  RETURNING id INTO v_order_id;

  -- 2. Insert order items and collect their IDs
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, name_snapshot, name_my_snapshot,
      base_price_snapshot, quantity, line_total_cents, special_instructions
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'name_snapshot',
      v_item->>'name_my_snapshot',
      (v_item->>'base_price_snapshot')::INTEGER,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'line_total_cents')::INTEGER,
      v_item->>'special_instructions'
    )
    RETURNING id INTO v_inserted_id;

    v_item_ids := array_append(v_item_ids, v_inserted_id);
  END LOOP;

  -- 3. Insert modifiers
  FOR v_modifier IN SELECT * FROM jsonb_array_elements(p_modifiers)
  LOOP
    INSERT INTO order_item_modifiers (
      order_item_id, modifier_option_id,
      name_snapshot, price_delta_snapshot
    ) VALUES (
      v_item_ids[(v_modifier->>'item_index')::INTEGER + 1],
      (v_modifier->>'modifier_option_id')::UUID,
      v_modifier->>'name_snapshot',
      (v_modifier->>'price_delta_snapshot')::INTEGER
    );
  END LOOP;

  -- Return order ID and item IDs
  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'order_item_ids', to_jsonb(v_item_ids)
  );

  RETURN v_result;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, jsonb) FROM anon;

-- ---------------------------------------------------------------------------
-- 2. Route-management RPCs: admin (or assigned driver) only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_routes(p_destination_route_id uuid, p_source_route_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max_index int;
  v_total_stops int;
  v_source_status text;
  v_dest_driver_id uuid;
BEGIN
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Access denied: admin role required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate source is not in_progress or completed (allow planned, assigned, accepted)
  SELECT status INTO STRICT v_source_status
  FROM routes WHERE id = p_source_route_id;

  IF v_source_status NOT IN ('planned', 'assigned', 'accepted') THEN
    RAISE EXCEPTION 'Can only merge planned/assigned/accepted routes (source is %)', v_source_status;
  END IF;

  -- Validate destination route exists and get its driver_id
  SELECT driver_id INTO STRICT v_dest_driver_id
  FROM routes WHERE id = p_destination_route_id;

  -- Get max stop_index in destination
  SELECT COALESCE(MAX(stop_index), -1) INTO v_max_index
  FROM route_stops WHERE route_id = p_destination_route_id;

  -- Defer unique constraint
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move all stops from source to destination, appending after last stop
  UPDATE route_stops
  SET route_id = p_destination_route_id,
      stop_index = v_max_index + 1 + sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE route_id = p_source_route_id
  ) sub
  WHERE route_stops.id = sub.id;

  -- Delete source route (no more stops, safe to delete)
  DELETE FROM routes WHERE id = p_source_route_id;

  -- After merge, if target has a driver, set to 'assigned' (driver needs to re-accept modified route)
  IF v_dest_driver_id IS NOT NULL THEN
    UPDATE routes
    SET status = 'assigned', accepted_at = NULL
    WHERE id = p_destination_route_id;
  END IF;

  -- Update destination stats
  PERFORM update_route_stats(p_destination_route_id);

  -- Return total stop count
  SELECT count(*) INTO v_total_stops
  FROM route_stops WHERE route_id = p_destination_route_id;

  RETURN v_total_stops;
END;
$function$;

CREATE OR REPLACE FUNCTION public.split_route(p_source_route_id uuid, p_stop_ids uuid[], p_new_driver_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_route_id uuid;
  v_delivery_date date;
  v_remaining_count int;
  v_source_status text;
  v_new_status text;
BEGIN
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Access denied: admin role required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate source route exists
  SELECT delivery_date, status INTO STRICT v_delivery_date, v_source_status
  FROM routes WHERE id = p_source_route_id;

  -- Validate all stop IDs belong to source route
  IF NOT (
    SELECT count(*) = array_length(p_stop_ids, 1)
    FROM route_stops
    WHERE id = ANY(p_stop_ids) AND route_id = p_source_route_id
  ) THEN
    RAISE EXCEPTION 'Some stop IDs do not belong to source route';
  END IF;

  -- Validate at least 1 stop remains in source after split
  SELECT count(*) INTO v_remaining_count
  FROM route_stops
  WHERE route_id = p_source_route_id AND id != ALL(p_stop_ids);

  IF v_remaining_count < 1 THEN
    RAISE EXCEPTION 'At least one stop must remain in the source route';
  END IF;

  -- Determine new route status: 'assigned' if driver provided, else 'planned'
  IF p_new_driver_id IS NOT NULL THEN
    v_new_status := 'assigned';
  ELSE
    v_new_status := 'planned';
  END IF;

  -- Create new route
  INSERT INTO routes (delivery_date, driver_id, status)
  VALUES (v_delivery_date, p_new_driver_id, v_new_status)
  RETURNING id INTO v_new_route_id;

  -- Defer unique constraint for reindexing
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move stops via UPDATE (avoids prevent_duplicate_active_assignment trigger on INSERT)
  UPDATE route_stops
  SET route_id = v_new_route_id, stop_index = sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE id = ANY(p_stop_ids)
  ) sub
  WHERE route_stops.id = sub.id;

  -- Reindex source route remaining stops
  PERFORM reindex_route_stops(p_source_route_id);

  -- If source was 'accepted', reset to 'assigned' (driver needs to re-accept modified route)
  IF v_source_status IN ('assigned', 'accepted') THEN
    UPDATE routes
    SET status = 'assigned', accepted_at = NULL
    WHERE id = p_source_route_id;
  END IF;

  -- Update stats for both routes
  PERFORM update_route_stats(p_source_route_id);
  PERFORM update_route_stats(v_new_route_id);

  RETURN v_new_route_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_next_stop(p_route_id uuid, p_completed_stop_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_next_stop_id uuid;
  v_next_stop_index int;
BEGIN
  -- Admins and the route's assigned driver may promote stops.
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
     AND NOT EXISTS (
       SELECT 1 FROM routes r
       WHERE r.id = p_route_id
         AND r.driver_id = public.get_my_driver_id()
     )
  THEN
    RAISE EXCEPTION 'Access denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate completed stop belongs to this route and is in terminal state
  IF NOT EXISTS (
    SELECT 1 FROM route_stops
    WHERE id = p_completed_stop_id
      AND route_id = p_route_id
      AND status IN ('delivered', 'skipped')
  ) THEN
    RAISE EXCEPTION 'Stop % is not a completed stop in route %',
      p_completed_stop_id, p_route_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Atomically select and lock the next pending stop
  -- SKIP LOCKED: if another transaction has this row locked, skip it
  -- and find the next one (prevents double-promotion)
  SELECT id, stop_index
  INTO v_next_stop_id, v_next_stop_index
  FROM route_stops
  WHERE route_id = p_route_id
    AND status = 'pending'
  ORDER BY stop_index ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- No pending stops remain - all stops are complete
  IF v_next_stop_id IS NULL THEN
    -- Still update stats to reflect final state
    PERFORM update_route_stats(p_route_id);
    RETURN jsonb_build_object(
      'promoted_stop_id', NULL,
      'stop_index', NULL
    );
  END IF;

  -- Promote the locked stop to enroute
  UPDATE route_stops
  SET status = 'enroute'
  WHERE id = v_next_stop_id;

  -- Update route stats atomically within the same transaction
  PERFORM update_route_stats(p_route_id);

  RETURN jsonb_build_object(
    'promoted_stop_id', v_next_stop_id,
    'stop_index', v_next_stop_index
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.merge_routes(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.split_route(uuid, uuid[], uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_next_stop(uuid, uuid) FROM anon;

-- ---------------------------------------------------------------------------
-- 3. Driver telemetry RPCs: admin or the driver themself
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_driver_streak(p_driver_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_route BOOLEAN;
BEGIN
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
     AND p_driver_id IS DISTINCT FROM public.get_my_driver_id()
  THEN
    RAISE EXCEPTION 'Access denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM routes
    WHERE driver_id = p_driver_id
      AND delivery_date = CURRENT_DATE
      AND status IN ('in_progress', 'completed')
  ) INTO v_has_route;

  IF v_has_route THEN
    v_streak := 1;
  END IF;

  v_check_date := CURRENT_DATE - 1;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM routes
      WHERE driver_id = p_driver_id
        AND delivery_date = v_check_date
        AND status = 'completed'
    ) INTO v_has_route;

    EXIT WHEN NOT v_has_route;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_driver_weekly_deliveries(p_driver_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_week_start DATE;
BEGIN
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
     AND p_driver_id IS DISTINCT FROM public.get_my_driver_id()
  THEN
    RAISE EXCEPTION 'Access denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM route_stops rs
  JOIN routes r ON r.id = rs.route_id
  WHERE r.driver_id = p_driver_id
    AND r.delivery_date >= v_week_start
    AND r.delivery_date < v_week_start + 7
    AND rs.status = 'delivered';
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_driver_latest_location(p_driver_id uuid)
 RETURNS TABLE(latitude numeric, longitude numeric, recorded_at timestamp with time zone, accuracy numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.jwt() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.is_admin()
     AND p_driver_id IS DISTINCT FROM public.get_my_driver_id()
  THEN
    RAISE EXCEPTION 'Access denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    lu.latitude,
    lu.longitude,
    lu.recorded_at,
    lu.accuracy
  FROM location_updates lu
  WHERE lu.driver_id = p_driver_id
  ORDER BY lu.recorded_at DESC
  LIMIT 1;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.calculate_driver_streak(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_driver_weekly_deliveries(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_driver_latest_location(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_route_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_driver_performance(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_delivery_metrics_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_driver_stats_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_analytics_views() FROM anon;

-- Trigger-only SECURITY DEFINER functions: never callable via PostgREST
-- (triggers do not check the caller's EXECUTE privilege).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_menu_item_photo() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_driver_deliveries_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_driver_rating_avg() FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. search_path hardening (advisor: function_search_path_mutable)
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.batch_update_stop_indices(uuid[], integer[]) SET search_path = public;
ALTER FUNCTION public.reindex_route_stops(uuid) SET search_path = public;
ALTER FUNCTION public.update_route_stats(uuid) SET search_path = public;
ALTER FUNCTION public.apply_item_refunds(uuid, jsonb, boolean) SET search_path = public;
ALTER FUNCTION public.check_route_completion() SET search_path = public;
ALTER FUNCTION public.update_image_updated_at() SET search_path = public;
ALTER FUNCTION public.compute_order_refund_status() SET search_path = public;
ALTER FUNCTION public.prevent_duplicate_active_assignment() SET search_path = public;
ALTER FUNCTION public.delivery_date(timestamp with time zone) SET search_path = public;

-- ---------------------------------------------------------------------------
-- 5. orders RLS: WITH CHECK for admins + the missing driver/customer policies
-- ---------------------------------------------------------------------------
-- The old admin-only orders_update silently no-opped the driver route-start /
-- delivered transitions and the customer self-cancel (user-scoped clients,
-- 0 rows matched, no error). Prod audit log confirms every status change to
-- date was admin-performed.

DROP POLICY IF EXISTS orders_update ON public.orders;

CREATE POLICY orders_update_admin ON public.orders AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- Drivers may read orders that have a stop on one of their routes (also
-- required for UPDATE ... RETURNING visibility).
CREATE POLICY orders_select_driver ON public.orders AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM route_stops rs
      JOIN routes r ON r.id = rs.route_id
      WHERE rs.order_id = orders.id
        AND r.driver_id = get_my_driver_id()
    )
  );

-- Drivers may transition orders on their routes within delivery-flow statuses
-- (route start: confirmed/preparing -> out_for_delivery; stop delivery:
-- out_for_delivery -> delivered; exception flag: needs_contact, status kept).
CREATE POLICY orders_update_driver ON public.orders AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM route_stops rs
      JOIN routes r ON r.id = rs.route_id
      WHERE rs.order_id = orders.id
        AND r.driver_id = get_my_driver_id()
    )
  )
  WITH CHECK (
    status = ANY (ARRAY['confirmed', 'preparing', 'out_for_delivery', 'delivered']::order_status[])
    AND EXISTS (
      SELECT 1
      FROM route_stops rs
      JOIN routes r ON r.id = rs.route_id
      WHERE rs.order_id = orders.id
        AND r.driver_id = get_my_driver_id()
    )
  );

-- Customers may cancel their own orders while still cancellable; the new row
-- must be the cancelled state (no other customer edits to orders).
CREATE POLICY orders_update_customer_cancel ON public.orders AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND status = ANY (ARRAY['pending', 'pending_approval', 'confirmed']::order_status[])
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'cancelled'::order_status
  );

-- ---------------------------------------------------------------------------
-- 6. customer_feedback: drop the WITH CHECK (true) insert policy
-- ---------------------------------------------------------------------------
-- Feedback is inserted by the API route via the service client (which bypasses
-- RLS); the open policy only enabled anonymous direct-to-PostgREST spam.
DROP POLICY IF EXISTS customer_feedback_insert ON public.customer_feedback;

-- ---------------------------------------------------------------------------
-- 7. feedback-attachments bucket: private, admin access via signed URLs
-- ---------------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'feedback-attachments';

DROP POLICY IF EXISTS feedback_attachments_read ON storage.objects;
DROP POLICY IF EXISTS feedback_attachments_upload ON storage.objects;
