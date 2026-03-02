-- ===========================================
-- 030: EMAIL RELIABILITY
-- Phase 82: Schema changes for email delivery tracking,
-- webhook audit logging, and needs-contact flagging
-- ===========================================

-- -----------------------------------------------
-- 1. Orders: Add needs_contact flagging columns
-- -----------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS needs_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contacted_by UUID REFERENCES profiles(id);

-- Partial index for ops dashboard "Needs Contact" queries
CREATE INDEX IF NOT EXISTS idx_orders_needs_contact
  ON orders(needs_contact) WHERE needs_contact = TRUE;

-- -----------------------------------------------
-- 2. Notification Logs: Add retry_count
-- -----------------------------------------------
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Composite index for stats aggregation queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_created
  ON notification_logs(status, created_at DESC);

-- Index for resend_id lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_notification_logs_resend_id
  ON notification_logs(resend_id) WHERE resend_id IS NOT NULL;

-- -----------------------------------------------
-- 3. Webhook Audit Logs: New table
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  svix_id TEXT,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  source_ip TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook audit queries
CREATE INDEX IF NOT EXISTS idx_webhook_audit_svix_id
  ON webhook_audit_logs(svix_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_created
  ON webhook_audit_logs(created_at DESC);

-- -----------------------------------------------
-- 4. RLS: Webhook audit logs (service role only)
-- -----------------------------------------------
ALTER TABLE webhook_audit_logs ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — only service_role can access webhook audit logs
