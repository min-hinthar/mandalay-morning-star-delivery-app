-- ===========================================
-- 008: Featured Sections Schema
-- Admin-manageable featured sections for homepage
-- ===========================================

-- ===========================================
-- 1. FEATURED_SECTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS featured_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT, -- lucide icon name
  accent_color TEXT, -- hex color e.g. '#FF5733'
  sort_order INTEGER NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 6, -- how many items to show
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_predefined BOOLEAN NOT NULL DEFAULT false, -- for Featured, Popular, New
  deleted_at TIMESTAMPTZ, -- soft delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_sections_sort ON featured_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_sections_visible ON featured_sections(is_visible) WHERE is_visible = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_featured_sections_slug ON featured_sections(slug);

-- ===========================================
-- 2. FEATURED_SECTION_ITEMS JUNCTION TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS featured_section_items (
  section_id UUID NOT NULL REFERENCES featured_sections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_section_items_section ON featured_section_items(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_section_items_item ON featured_section_items(item_id);

-- ===========================================
-- 3. RLS POLICIES FOR FEATURED_SECTIONS
-- ===========================================
ALTER TABLE featured_sections ENABLE ROW LEVEL SECURITY;

-- SELECT: Public sees visible sections, admin sees all (including soft-deleted)
DROP POLICY IF EXISTS "featured_sections_select" ON featured_sections;
CREATE POLICY "featured_sections_select" ON featured_sections FOR SELECT USING (
  (is_visible = true AND deleted_at IS NULL) OR public.is_admin()
);

-- INSERT: Admin only
DROP POLICY IF EXISTS "featured_sections_insert" ON featured_sections;
CREATE POLICY "featured_sections_insert" ON featured_sections FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Admin only
DROP POLICY IF EXISTS "featured_sections_update" ON featured_sections;
CREATE POLICY "featured_sections_update" ON featured_sections FOR UPDATE
  USING (public.is_admin());

-- DELETE: Admin only (hard delete, though soft delete is preferred)
DROP POLICY IF EXISTS "featured_sections_delete" ON featured_sections;
CREATE POLICY "featured_sections_delete" ON featured_sections FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 4. RLS POLICIES FOR FEATURED_SECTION_ITEMS
-- ===========================================
ALTER TABLE featured_section_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Public can see items in visible sections
DROP POLICY IF EXISTS "featured_section_items_select" ON featured_section_items;
CREATE POLICY "featured_section_items_select" ON featured_section_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM featured_sections fs
    WHERE fs.id = section_id
    AND (fs.is_visible = true AND fs.deleted_at IS NULL)
  )
  OR public.is_admin()
);

-- INSERT: Admin only
DROP POLICY IF EXISTS "featured_section_items_insert" ON featured_section_items;
CREATE POLICY "featured_section_items_insert" ON featured_section_items FOR INSERT
  WITH CHECK (public.is_admin());

-- UPDATE: Admin only
DROP POLICY IF EXISTS "featured_section_items_update" ON featured_section_items;
CREATE POLICY "featured_section_items_update" ON featured_section_items FOR UPDATE
  USING (public.is_admin());

-- DELETE: Admin only
DROP POLICY IF EXISTS "featured_section_items_delete" ON featured_section_items;
CREATE POLICY "featured_section_items_delete" ON featured_section_items FOR DELETE
  USING (public.is_admin());

-- ===========================================
-- 5. UPDATED_AT TRIGGER
-- ===========================================
DROP TRIGGER IF EXISTS update_featured_sections_updated_at ON featured_sections;
CREATE TRIGGER update_featured_sections_updated_at
  BEFORE UPDATE ON featured_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 6. SEED PREDEFINED SECTIONS
-- ===========================================
INSERT INTO featured_sections (slug, name, icon, is_predefined, sort_order, item_count)
VALUES
  ('featured-dishes', 'Featured Dishes', 'star', true, 0, 6),
  ('most-popular', 'Most Popular', 'trending-up', true, 1, 6),
  ('new-arrivals', 'New Arrivals', 'sparkles', true, 2, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  is_predefined = EXCLUDED.is_predefined;

-- ===========================================
-- 7. COMMENTS
-- ===========================================
COMMENT ON TABLE featured_sections IS 'Admin-manageable featured sections for homepage display';
COMMENT ON TABLE featured_section_items IS 'Junction table linking featured sections to menu items';
COMMENT ON COLUMN featured_sections.is_predefined IS 'True for system sections: Featured Dishes, Most Popular, New Arrivals';
COMMENT ON COLUMN featured_sections.deleted_at IS 'Soft delete timestamp, allows 30-day recovery';
COMMENT ON COLUMN featured_sections.item_count IS 'Number of items to display in this section';
