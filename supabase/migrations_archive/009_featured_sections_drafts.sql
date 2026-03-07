-- ===========================================
-- 009: Featured Sections Draft Workflow
-- Add draft tracking for publish workflow
-- ===========================================

-- ===========================================
-- 1. ADD DRAFT TRACKING COLUMN
-- ===========================================
ALTER TABLE featured_sections
ADD COLUMN IF NOT EXISTS has_unpublished_changes BOOLEAN NOT NULL DEFAULT false;

-- Update existing sections to have no unpublished changes
UPDATE featured_sections
SET has_unpublished_changes = false
WHERE has_unpublished_changes IS NULL;

-- ===========================================
-- 2. COMMENTS
-- ===========================================
COMMENT ON COLUMN featured_sections.has_unpublished_changes IS 'True when section has been modified but not yet published';
