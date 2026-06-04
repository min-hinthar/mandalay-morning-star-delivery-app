-- ============================================
-- Customer Feedback System
-- ============================================

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE feedback_category AS ENUM ('bug_report', 'order_issue', 'suggestion', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feedback_status AS ENUM ('new', 'in_review', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS customer_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email   text,
  category        feedback_category NOT NULL,
  subject         text NOT NULL,
  message         text NOT NULL,
  order_id        uuid REFERENCES orders(id) ON DELETE SET NULL,
  page_url        text,
  user_agent      text,
  sentry_event_id text,
  screenshot_url  text,
  screenshot_path text,
  status          feedback_status NOT NULL DEFAULT 'new',
  admin_notes     text,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_feedback_user_id ON customer_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_status ON customer_feedback(status);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_created_at ON customer_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_category ON customer_feedback(category);

-- Updated_at trigger (reuse existing function)
DROP TRIGGER IF EXISTS customer_feedback_updated_at ON customer_feedback;
CREATE TRIGGER customer_feedback_updated_at
  BEFORE UPDATE ON customer_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated can insert
DROP POLICY IF EXISTS "customer_feedback_insert" ON customer_feedback;
CREATE POLICY "customer_feedback_insert" ON customer_feedback
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own feedback
DROP POLICY IF EXISTS "customer_feedback_select_own" ON customer_feedback;
CREATE POLICY "customer_feedback_select_own" ON customer_feedback
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Admins can read all feedback
DROP POLICY IF EXISTS "customer_feedback_select_admin" ON customer_feedback;
CREATE POLICY "customer_feedback_select_admin" ON customer_feedback
  FOR SELECT
  USING (public.is_admin());

-- Admins can update all feedback
DROP POLICY IF EXISTS "customer_feedback_update_admin" ON customer_feedback;
CREATE POLICY "customer_feedback_update_admin" ON customer_feedback
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- Storage Bucket: feedback-attachments
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "feedback_attachments_upload" ON storage.objects;
CREATE POLICY "feedback_attachments_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'feedback-attachments');

DROP POLICY IF EXISTS "feedback_attachments_read" ON storage.objects;
CREATE POLICY "feedback_attachments_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'feedback-attachments');
