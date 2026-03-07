-- ===========================================
-- 007: Menu Photos Storage Bucket
-- Storage for admin-uploaded food photos
-- SECURITY: Admin write, public read
-- ===========================================

-- ===========================================
-- 1. CREATE MENU PHOTOS BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-photos',
  'menu-photos',
  true,
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- 2. STORAGE RLS POLICIES (idempotent)
-- Using (select auth.uid()) for initplan optimization
-- ===========================================

-- Upload: Admin only
DROP POLICY IF EXISTS "menu_photos_insert" ON storage.objects;
CREATE POLICY "menu_photos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-photos' AND
  public.is_admin()
);

-- Read: Public (anyone can view menu photos)
DROP POLICY IF EXISTS "menu_photos_select" ON storage.objects;
CREATE POLICY "menu_photos_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'menu-photos');

-- Update: Admin only
DROP POLICY IF EXISTS "menu_photos_update" ON storage.objects;
CREATE POLICY "menu_photos_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-photos' AND
  public.is_admin()
)
WITH CHECK (
  bucket_id = 'menu-photos' AND
  public.is_admin()
);

-- Delete: Admin only
DROP POLICY IF EXISTS "menu_photos_delete" ON storage.objects;
CREATE POLICY "menu_photos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-photos' AND
  public.is_admin()
);

-- ===========================================
-- 3. CASCADE DELETE TRIGGER
-- When menu_item deleted, delete associated photo from storage
-- ===========================================

-- Function to delete menu item photo from storage
CREATE OR REPLACE FUNCTION delete_menu_item_photo()
RETURNS TRIGGER AS $$
DECLARE
  v_path TEXT;
BEGIN
  -- Extract storage path from image_url if it's a Supabase Storage URL
  -- Format: https://<project>.supabase.co/storage/v1/object/public/menu-photos/<path>
  -- OR just the path: menu-photos/<path>
  IF OLD.image_url IS NOT NULL AND OLD.image_url LIKE '%menu-photos/%' THEN
    -- Extract the path after 'menu-photos/'
    v_path := substring(OLD.image_url FROM 'menu-photos/(.+)$');

    IF v_path IS NOT NULL THEN
      -- Delete from storage using storage API
      -- Note: storage.delete requires the bucket name and path separately
      DELETE FROM storage.objects
      WHERE bucket_id = 'menu-photos'
        AND name = v_path;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage;

-- Create trigger on menu_items
DROP TRIGGER IF EXISTS trg_delete_menu_item_photo ON menu_items;
CREATE TRIGGER trg_delete_menu_item_photo
  BEFORE DELETE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION delete_menu_item_photo();

-- ===========================================
-- 4. COMMENTS
-- ===========================================
COMMENT ON FUNCTION delete_menu_item_photo() IS 'Cascade delete menu item photos from storage when menu item is deleted';
