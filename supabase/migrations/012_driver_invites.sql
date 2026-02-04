-- ===========================================
-- 012: Driver Invites
-- Token-based email invitations for driver onboarding
-- ===========================================

-- Driver invite tokens for email-based onboarding
CREATE TABLE IF NOT EXISTS driver_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup (used during onboarding)
CREATE INDEX idx_driver_invites_token ON driver_invites(token);

-- Index for email lookup (check existing invites)
CREATE INDEX idx_driver_invites_email ON driver_invites(email);

-- ===========================================
-- RLS Policies
-- ===========================================
ALTER TABLE driver_invites ENABLE ROW LEVEL SECURITY;

-- Admins can manage invites
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

-- Public can read valid tokens (for onboarding page)
CREATE POLICY "Anyone can validate invite tokens"
  ON driver_invites
  FOR SELECT
  TO public
  USING (
    token IS NOT NULL
    AND expires_at > NOW()
    AND accepted_at IS NULL
    AND revoked_at IS NULL
  );
