-- ===========================================
-- pgTAP Tests: Function Security
-- Tests function search_path and SECURITY DEFINER
-- ===========================================

BEGIN;
SELECT plan(15);

-- ===========================================
-- 1. TEST: public.is_admin() EXISTS AND IS SECURE
-- ===========================================

SELECT has_function(
  'public',
  'is_admin',
  'public.is_admin() function exists'
);

SELECT function_returns(
  'public',
  'is_admin',
  'boolean',
  'public.is_admin() returns boolean'
);

SELECT ok(
  (SELECT prosecdef FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')),
  'public.is_admin() is SECURITY DEFINER'
);

-- ===========================================
-- 2. TEST: public.is_driver() EXISTS AND IS SECURE
-- ===========================================

SELECT has_function(
  'public',
  'is_driver',
  'public.is_driver() function exists'
);

SELECT function_returns(
  'public',
  'is_driver',
  'boolean',
  'public.is_driver() returns boolean'
);

SELECT ok(
  (SELECT prosecdef FROM pg_proc WHERE proname = 'is_driver' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')),
  'public.is_driver() is SECURITY DEFINER'
);

-- ===========================================
-- 3. TEST: SECURITY DEFINER FUNCTIONS HAVE search_path
-- ===========================================

SELECT ok(
  (
    SELECT p.proconfig IS NOT NULL AND
           EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ),
  'public.is_admin() has explicit search_path'
);

SELECT ok(
  (
    SELECT p.proconfig IS NOT NULL AND
           EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_driver'
  ),
  'public.is_driver() has explicit search_path'
);

-- ===========================================
-- 4. TEST: Admin wrapper functions exist
-- ===========================================

SELECT has_function(
  'public',
  'get_driver_stats_admin',
  'get_driver_stats_admin() function exists'
);

SELECT has_function(
  'public',
  'get_delivery_metrics_admin',
  'get_delivery_metrics_admin() function exists'
);

SELECT has_function(
  'public',
  'refresh_analytics_views_admin',
  'refresh_analytics_views_admin() function exists'
);

-- ===========================================
-- 5. TEST: Other SECURITY DEFINER functions have search_path
-- ===========================================

SELECT ok(
  (
    SELECT p.proconfig IS NOT NULL AND
           EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ),
  'handle_new_user() has explicit search_path'
);

SELECT ok(
  (
    SELECT p.proconfig IS NOT NULL AND
           EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'calculate_route_stats'
  ),
  'calculate_route_stats() has explicit search_path'
);

SELECT ok(
  (
    SELECT p.proconfig IS NOT NULL AND
           EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_driver_latest_location'
  ),
  'get_driver_latest_location() has explicit search_path'
);

SELECT ok(
  (
    SELECT p.proconfig IS NOT NULL AND
           EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_driver_rating_avg'
  ),
  'update_driver_rating_avg() has explicit search_path'
);

SELECT * FROM finish();
ROLLBACK;
