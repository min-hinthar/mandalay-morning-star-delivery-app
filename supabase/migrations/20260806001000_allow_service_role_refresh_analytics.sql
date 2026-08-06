-- Allow the scheduled cron (service client) to refresh the analytics MVs.
--
-- refresh_analytics_views() gates its body on public.is_admin(), which
-- resolves profiles.role by auth.uid() — NULL under the service key, so a
-- cron endpoint calling through createServiceClient() was rejected with
-- 'Access denied: admin role required' despite service_role holding EXECUTE
-- (granted in baseline, never revoked). Widen only the body gate to accept
-- service_role; admin dashboard calls keep working unchanged.
--
-- auth.role() is schema-qualified because search_path is pinned to
-- 'public', and COALESCEd because it is NULL for direct DB connections.
--
-- Function-body-only CREATE OR REPLACE: signature unchanged → generated
-- types unchanged → db-drift-neutral (same shape as the 20260612160000 and
-- 20260805200000 precedents).
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.is_admin() OR COALESCE(auth.role(), '') = 'service_role') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;
END;
$function$
;
