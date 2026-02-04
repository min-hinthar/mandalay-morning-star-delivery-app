-- ===========================================
-- 014: Fix Driver Invites RLS Policy
-- Adds WITH CHECK clause for INSERT operations
-- ===========================================

-- Drop existing policy that lacks WITH CHECK
DROP POLICY IF EXISTS "Admins can manage driver invites" ON driver_invites;

-- Recreate with proper WITH CHECK clause
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
