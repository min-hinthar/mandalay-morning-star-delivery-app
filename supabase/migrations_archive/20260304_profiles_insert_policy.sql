-- ===========================================
-- Add INSERT policy on profiles table
--
-- Previously profiles only had SELECT and UPDATE policies.
-- The handle_new_user() trigger creates profiles on auth.users INSERT,
-- but Google OAuth returning users (already in auth.users) never trigger it.
-- The service-client ensureProfile() function is the backup, but if it fails
-- (env misconfiguration, timeout, etc.), there's NO fallback.
--
-- This policy lets authenticated users insert their OWN profile row,
-- providing a final safety net for profile creation.
-- ===========================================

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));
