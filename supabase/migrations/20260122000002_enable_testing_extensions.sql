-- ===========================================
-- Enable Database Linting & Testing Extensions
-- Date: 2026-01-22
-- ===========================================

-- ===========================================
-- 1. ENABLE PLPGSQL_CHECK (DB Linting)
-- ===========================================
-- plpgsql_check provides static analysis for PL/pgSQL functions
-- Catches: undefined variables, type mismatches, performance issues

CREATE EXTENSION IF NOT EXISTS plpgsql_check;

-- ===========================================
-- 2. ENABLE PGTAP (DB Unit Testing)
-- ===========================================
-- pgTAP provides TAP-compliant unit testing for PostgreSQL
-- Used for testing RLS policies, functions, and triggers

CREATE EXTENSION IF NOT EXISTS pgtap;

-- ===========================================
-- 3. CREATE TESTING SCHEMA
-- ===========================================
-- Separate schema for test utilities to avoid polluting public

CREATE SCHEMA IF NOT EXISTS testing;

COMMENT ON SCHEMA testing IS 'Schema for pgTAP tests and testing utilities';

-- ===========================================
-- 4. HELPER FUNCTION: Check all functions for issues
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
-- 5. HELPER FUNCTION: Check specific function
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
-- 6. HELPER FUNCTION: Check for mutable search_path
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
-- 7. HELPER FUNCTION: Verify RLS is enabled
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
    AND c.relkind = 'r'  -- ordinary tables only
    AND c.relname NOT LIKE 'pg_%'
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

COMMENT ON FUNCTION testing.check_rls_enabled() IS 'Check which tables have RLS enabled';
