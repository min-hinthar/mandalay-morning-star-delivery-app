-- ===========================================
-- 018: Fix Driver Invites RLS - Use JWT email instead of auth.users query
-- The previous policy failed because users can't query auth.users directly
-- ===========================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read their own invites" ON driver_invites;

-- Recreate using auth.jwt() to get email from JWT token (no table query needed)
CREATE POLICY "Users can read their own invites"
  ON driver_invites
  FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')
  );
