-- ===========================================
-- 015: Update Driver Invites for Supabase Auth
-- Removes token dependency since Supabase Auth handles tokens
-- ===========================================

-- Drop unique constraint on token (we use placeholder "supabase-auth" now)
ALTER TABLE driver_invites DROP CONSTRAINT IF EXISTS driver_invites_token_key;

-- Make token nullable (no longer used for auth)
ALTER TABLE driver_invites ALTER COLUMN token DROP NOT NULL;

-- Drop index on token (no longer used for lookups)
DROP INDEX IF EXISTS idx_driver_invites_token;

-- Update existing public SELECT policy to be more restrictive
-- Only allow reading invite by ID for authenticated users with matching email
DROP POLICY IF EXISTS "Anyone can validate invite tokens" ON driver_invites;

-- Authenticated users can read invites matching their email
-- This allows the onboarding page to verify invite status
CREATE POLICY "Users can read their own invites"
  ON driver_invites
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
