-- ===========================================
-- 020: Email System Foundation
-- Webhook idempotency table + enum expansions for email notifications
-- ===========================================

-- ===========================================
-- 1. WEBHOOK_EVENTS TABLE (idempotency)
-- ===========================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- ===========================================
-- 2. RLS FOR WEBHOOK_EVENTS
-- Service-role only — no public/authenticated access
-- ===========================================
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies = only service_role can access (bypasses RLS)

-- ===========================================
-- 3. ENUM EXPANSIONS
-- ===========================================

-- Add new notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'cancellation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'delivery_reminder';

-- Add new notification statuses for webhook tracking
ALTER TYPE notification_status ADD VALUE IF NOT EXISTS 'opened';
ALTER TYPE notification_status ADD VALUE IF NOT EXISTS 'clicked';

-- ===========================================
-- 4. APP SETTINGS: Email kill switch
-- ===========================================
INSERT INTO app_settings (key, value, category)
  VALUES ('email_sending_enabled', 'true'::jsonb, 'notifications')
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- 5. COMMENTS
-- ===========================================
COMMENT ON TABLE webhook_events IS 'Idempotency table for Resend webhook events — prevents duplicate processing';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique event ID from Resend webhook payload';
COMMENT ON COLUMN webhook_events.event_type IS 'Webhook event type (email.sent, email.delivered, email.opened, etc.)';
