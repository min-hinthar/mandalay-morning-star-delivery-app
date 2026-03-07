-- Migration: Photo Pipeline
-- Adds image_updated_at column to menu_items for tracking photo freshness.

-- Add image_updated_at column
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;

-- Trigger function: auto-set image_updated_at when image_url changes
CREATE OR REPLACE FUNCTION update_image_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
    NEW.image_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to menu_items
DROP TRIGGER IF EXISTS trg_menu_items_image_updated ON menu_items;
CREATE TRIGGER trg_menu_items_image_updated
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_image_updated_at();
