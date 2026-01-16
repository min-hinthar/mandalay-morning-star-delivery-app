-- ===========================================
-- 005: Testing Extensions and Utilities
-- Database linting and unit testing support
-- ===========================================

-- ===========================================
-- 1. ENABLE EXTENSIONS
-- ===========================================
CREATE EXTENSION IF NOT EXISTS plpgsql_check;
CREATE EXTENSION IF NOT EXISTS pgtap;

-- ===========================================
-- 2. TESTING SCHEMA
-- ===========================================
CREATE SCHEMA IF NOT EXISTS testing;
COMMENT ON SCHEMA testing IS 'Schema for pgTAP tests and testing utilities';

-- ===========================================
-- 3. LINT ALL FUNCTIONS
-- ===========================================
CREATE OR REPLACE FUNCTION testing.lint_all_functions()
RETURNS TABLE (
  function_name TEXT,
  issue_type TEXT,
  message TEXT,
  detail TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.proname::TEXT AS function_name,
    cf.check::TEXT AS issue_type,
    cf.message::TEXT,
    cf.detail::TEXT
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  CROSS JOIN LATERAL plpgsql_check_function(p.oid) AS cf
  WHERE n.nspname IN ('public', 'auth')
    AND p.prokind = 'f'
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql');
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.lint_all_functions() IS 'Run plpgsql_check on all PL/pgSQL functions';

-- ===========================================
-- 4. LINT SPECIFIC FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION testing.lint_function(p_function_name TEXT)
RETURNS TABLE (
  issue_type TEXT,
  message TEXT,
  detail TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.check::TEXT AS issue_type,
    cf.message::TEXT,
    cf.detail::TEXT
  FROM plpgsql_check_function(p_function_name::regprocedure) AS cf;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.lint_function(TEXT) IS 'Run plpgsql_check on a specific function';

-- ===========================================
-- 5. CHECK SECURITY DEFINER SEARCH PATHS
-- ===========================================
CREATE OR REPLACE FUNCTION testing.check_function_search_paths()
RETURNS TABLE (
  schema_name TEXT,
  function_name TEXT,
  has_secure_search_path BOOLEAN,
  search_path_setting TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.nspname::TEXT AS schema_name,
    p.proname::TEXT AS function_name,
    (p.proconfig IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM unnest(p.proconfig) AS c
       WHERE c LIKE 'search_path=%'
     )) AS has_secure_search_path,
    (SELECT c FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%' LIMIT 1)::TEXT AS search_path_setting
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname IN ('public', 'auth')
    AND p.prokind = 'f'
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    AND p.prosecdef = true  -- Only check SECURITY DEFINER functions
  ORDER BY n.nspname, p.proname;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.check_function_search_paths() IS 'Check SECURITY DEFINER functions for mutable search_path';

-- ===========================================
-- 6. CHECK RLS ENABLED
-- ===========================================
CREATE OR REPLACE FUNCTION testing.check_rls_enabled()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT AS table_name,
    c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.check_rls_enabled() IS 'Check which tables have RLS enabled';

-- ===========================================
-- 7. CHECK UNINDEXED FOREIGN KEYS
-- Implements lint 0001 check
-- ===========================================
CREATE OR REPLACE FUNCTION testing.check_unindexed_foreign_keys()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  referenced_table TEXT,
  has_index BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.table_name::TEXT,
    kcu.column_name::TEXT,
    ccu.table_name::TEXT AS referenced_table,
    EXISTS (
      SELECT 1 FROM pg_indexes pi
      WHERE pi.tablename = tc.table_name
      AND pi.indexdef LIKE '%' || kcu.column_name || '%'
    ) AS has_index
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.check_unindexed_foreign_keys() IS 'Find foreign key columns without indexes (lint 0001)';

-- ===========================================
-- 8. CHECK MULTIPLE PERMISSIVE POLICIES
-- Implements lint 0006 check
-- ===========================================
CREATE OR REPLACE FUNCTION testing.check_multiple_permissive_policies()
RETURNS TABLE (
  table_name TEXT,
  operation TEXT,
  policy_count BIGINT,
  policy_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.relname::TEXT AS table_name,
    pp.cmd::TEXT AS operation,
    COUNT(*) AS policy_count,
    array_agg(pp.polname)::TEXT[] AS policy_names
  FROM pg_policy pp
  JOIN pg_class pc ON pp.polrelid = pc.oid
  JOIN pg_namespace pn ON pc.relnamespace = pn.oid
  WHERE pn.nspname = 'public'
    AND pp.polpermissive = true
  GROUP BY pc.relname, pp.cmd
  HAVING COUNT(*) > 1
  ORDER BY pc.relname, pp.cmd;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.check_multiple_permissive_policies() IS 'Find tables with multiple permissive policies (lint 0006)';

-- ===========================================
-- 9. RLS TEST HELPER
-- ===========================================
CREATE OR REPLACE FUNCTION testing.test_rls_isolation()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Use Supabase client to test cross-user access. Functions available:
  - testing.check_rls_enabled() - verify RLS is on for all tables
  - testing.check_unindexed_foreign_keys() - find missing FK indexes
  - testing.check_multiple_permissive_policies() - find policy conflicts
  - testing.check_function_search_paths() - verify SECURITY DEFINER safety';
END;
$$ LANGUAGE plpgsql SET search_path = public;
