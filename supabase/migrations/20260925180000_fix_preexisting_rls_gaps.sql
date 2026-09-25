-- Pre-existing RLS / schema gaps found by the privilege-hardening verification
-- (#257). None was caused by that migration; each broke a legitimate app path.
-- Idempotent: every object is dropped-if-exists or replaced.

-- ---------------------------------------------------------------------------
-- 1. order_items had no UPDATE or DELETE policy, so admin item edits matched
--    0 rows (silently) and apply_item_refunds (SECURITY INVOKER; takes
--    SELECT ... FOR UPDATE on order_items, which needs an UPDATE policy)
--    raised "Order item not found" for every admin item refund. Admin-only —
--    customers and drivers still cannot touch line items.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS order_items_update_admin ON public.order_items;
CREATE POLICY order_items_update_admin ON public.order_items AS PERMISSIVE FOR UPDATE TO authenticated
  USING (( SELECT public.is_admin()))
  WITH CHECK (( SELECT public.is_admin()));

DROP POLICY IF EXISTS order_items_delete_admin ON public.order_items;
CREATE POLICY order_items_delete_admin ON public.order_items AS PERMISSIVE FOR DELETE TO authenticated
  USING (( SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2. order_audit_log_action_check allowed only status_change/cancel/refund/edit,
--    so every other action the app writes was rejected and the audit row lost
--    (the routes treat the audit insert as non-fatal): priority_change,
--    update_items, assign_driver, unassign_driver, marked_contacted,
--    delivery_exception.
-- ---------------------------------------------------------------------------
ALTER TABLE public.order_audit_log DROP CONSTRAINT IF EXISTS order_audit_log_action_check;
ALTER TABLE public.order_audit_log ADD CONSTRAINT order_audit_log_action_check
  CHECK (action = ANY (ARRAY[
    'status_change', 'cancel', 'refund', 'edit',
    'priority_change', 'update_items', 'assign_driver', 'unassign_driver',
    'marked_contacted', 'delivery_exception'
  ]::text[]));

-- ---------------------------------------------------------------------------
-- 3. split_route failed for every caller: v_new_status was declared text and
--    routes.status is the route_status enum (no text → enum assignment cast).
--    Body identical to 20260612120000_rpc_rls_lockdown.sql except that type.
--    CREATE OR REPLACE keeps the existing grants.
-- ---------------------------------------------------------------------------
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
  v_new_status public.route_status;
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

-- ---------------------------------------------------------------------------
-- 4. Drivers could not read the delivery address of any stop on their own
--    route: addresses_select is owner-or-admin, so every driver route embed
--    (orders → addresses) came back null — no street, city or lat/lng for
--    navigation. Grant a driver SELECT on exactly the addresses referenced by
--    orders on their routes. get_my_driver_id() requires drivers.is_active, so
--    a deactivated driver sees none, and route_stops re-pointing is blocked by
--    trg_guard_route_stop_identity, so a driver cannot pull other orders (and
--    their addresses) onto a route. profiles_select is deliberately NOT
--    widened: it would expose email/role, and the driver UI already reads the
--    customer's name/phone from the orders.customer_name/customer_phone snapshot.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.address_on_my_route(p_address_id uuid)
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
     WHERE o.address_id = p_address_id
       AND r.driver_id = public.get_my_driver_id()
  );
$function$;
REVOKE ALL ON FUNCTION app_private.address_on_my_route(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.address_on_my_route(uuid) TO authenticated;

DROP POLICY IF EXISTS addresses_select_driver ON public.addresses;
CREATE POLICY addresses_select_driver ON public.addresses AS PERMISSIVE FOR SELECT TO authenticated
  -- The initplan (SELECT get_my_driver_id()) runs once per query, so customers
  -- and admins (NULL driver id) never pay the per-row helper call.
  USING (( SELECT public.get_my_driver_id()) IS NOT NULL AND app_private.address_on_my_route(id));
