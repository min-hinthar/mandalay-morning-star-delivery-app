-- Follow-up to #173 (20260612120000 / 120001 / 120002).
--
-- #173 already revoked `anon` on every dangerous SECURITY DEFINER RPC and
-- rewrote 8 bodies with admin/owner guards. Those migrations live in
-- supabase/migrations/ (NOT migrations_archive/), so a fresh `supabase db start`
-- applies them after the baseline — there is no fresh-environment gap.
--
-- What #173 missed is the `authenticated` role on two driver-analytics RPCs it
-- revoke-listed but never guarded, plus a handful of vestigial `anon` grants.
--
-- Signatures unchanged -> generated types unchanged (db-drift-neutral).
-- Precedent: 20260612160000_apply_item_refunds_atomic_audit.sql, same claim.

-- ---------------------------------------------------------------------------
-- 1. Repair get_driver_performance's fail-OPEN guard.
--
-- The baseline guard (00000000000000_baseline.sql:1146) is:
--     IF NOT public.is_admin() AND p_driver_id != public.get_my_driver_id()
-- get_my_driver_id() returns NULL for any caller who is not a driver, so
-- `p_driver_id != NULL` is NULL, `TRUE AND NULL` is NULL, the IF is not taken,
-- and the function returns another driver's stats. It only ever fires for a
-- caller who IS a driver asking about a DIFFERENT driver — every ordinary
-- customer session walks straight through.
--
-- #173 fixed exactly this in the three sibling RPCs by switching to the
-- NULL-safe `IS DISTINCT FROM` (20260612120000:409, :441, :471). This one was
-- left behind. Same guard shape adopted verbatim: direct DB connections
-- (auth.jwt() IS NULL — migrations, pgTAP, psql) and the service_role JWT are
-- exempt; every other PostgREST principal is checked.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_driver_performance(p_driver_id uuid)
 RETURNS TABLE(total_deliveries bigint, deliveries_last_7_days bigint, deliveries_last_30_days bigint, on_time_rate numeric, avg_rating numeric, total_ratings bigint, total_exceptions bigint)
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
    ds.total_deliveries,
    ds.deliveries_last_7_days,
    ds.deliveries_last_30_days,
    ds.on_time_rate,
    ds.avg_rating,
    ds.total_ratings,
    ds.total_exceptions
  FROM driver_stats_mv ds
  WHERE ds.driver_id = p_driver_id;
END;
$function$
;

-- ---------------------------------------------------------------------------
-- 2. Revokes. CREATE OR REPLACE above preserves the existing ACL, so these run
--    after it deliberately.
-- ---------------------------------------------------------------------------

-- get_driver_performance: zero app callers (only src/types/database.generated.ts:1781);
-- not referenced by any policy. Belt to go with the guard above, so a future
-- accidental GRANT cannot reopen it.
REVOKE EXECUTE ON FUNCTION public.get_driver_performance(uuid) FROM authenticated;

-- calculate_route_stats: SECURITY DEFINER read over route_stops with NO
-- authorization check at all, so it bypasses route_stops_select (baseline:2353)
-- which otherwise scopes a customer to their own stop. Route UUIDs are not
-- secret — src/app/api/tracking/[orderId]/route.ts:366 returns routeId to the
-- customer. Zero app callers (generated type only). Not referenced by any policy.
REVOKE EXECUTE ON FUNCTION public.calculate_route_stats(uuid) FROM authenticated;

-- is_driver: self-scoped on auth.uid() so it was never exploitable, but it is
-- dead — grep of the baseline finds it in zero policies, and no .rpc() caller
-- exists. The #173 comment (20260612120002:11-13) groups it with is_admin /
-- get_my_driver_id, which DO need the grant; is_driver does not.
-- (Left callable by `authenticated` so any future policy use still works.)
REVOKE EXECUTE ON FUNCTION public.is_driver() FROM anon;

-- The four below are SECURITY INVOKER (verified: no SECURITY DEFINER in the
-- baseline definitions), so RLS already constrains an anon caller and these are
-- hygiene, not a hole. All four have real admin/driver callers on caller-scoped
-- clients, which is why only `anon` is revoked and `authenticated` is kept.
REVOKE EXECUTE ON FUNCTION public.apply_item_refunds(uuid, jsonb, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.batch_update_stop_indices(uuid[], integer[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reindex_route_stops(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_route_stats(uuid) FROM anon;
