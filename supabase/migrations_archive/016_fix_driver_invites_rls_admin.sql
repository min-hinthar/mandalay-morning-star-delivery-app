-- ===========================================
-- 016: Fix Driver Invites RLS for Admin Access
-- Ensures admins can fully manage driver invites
-- ===========================================

-- Drop all existing policies on driver_invites to start fresh
DROP POLICY IF EXISTS "Admins can manage driver invites" ON driver_invites;
DROP POLICY IF EXISTS "Users can read their own invites" ON driver_invites;
DROP POLICY IF EXISTS "Anyone can validate invite tokens" ON driver_invites;

-- Admin full access policy (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage driver invites"
  ON driver_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Invited users can read their own invite (for onboarding page)
CREATE POLICY "Users can read their own invites"
  ON driver_invites
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
