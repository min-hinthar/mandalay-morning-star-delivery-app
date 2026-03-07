-- ===========================================
-- 017: Fix Driver Invites RLS using is_admin() function
-- Use SECURITY DEFINER function to bypass RLS recursion
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage driver invites" ON driver_invites;
DROP POLICY IF EXISTS "Users can read their own invites" ON driver_invites;

-- Admin full access using is_admin() function (SECURITY DEFINER bypasses RLS)
CREATE POLICY "Admins can manage driver invites"
  ON driver_invites
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Invited users can read their own invite (for onboarding page)
CREATE POLICY "Users can read their own invites"
  ON driver_invites
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
