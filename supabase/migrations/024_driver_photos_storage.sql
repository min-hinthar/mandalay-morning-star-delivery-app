-- ===========================================
-- 024: Driver Photos Storage Bucket
-- Storage for driver profile photos
-- SECURITY: Driver-own write, public read
-- Uses (select auth.uid()) for initplan optimization
-- ===========================================

-- ===========================================
-- 1. CREATE DRIVER PHOTOS BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-photos',
  'driver-photos',
  true,
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- 2. STORAGE RLS POLICIES (idempotent)
-- ===========================================

-- Upload: Drivers can upload to their own folder (path: {driver_id}/*)
DROP POLICY IF EXISTS "driver_photos_insert" ON storage.objects;
CREATE POLICY "driver_photos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-photos' AND
  EXISTS (
    SELECT 1 FROM drivers d
    WHERE d.user_id = (select auth.uid())
    AND d.is_active = true
    AND (storage.foldername(name))[1] = d.id::text
  )
);

-- Read: Public (anyone can view driver profile photos — needed for customer tracking)
DROP POLICY IF EXISTS "driver_photos_select" ON storage.objects;
CREATE POLICY "driver_photos_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'driver-photos');

-- Update: Drivers can update their own photos
DROP POLICY IF EXISTS "driver_photos_update" ON storage.objects;
CREATE POLICY "driver_photos_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-photos' AND
  EXISTS (
    SELECT 1 FROM drivers d
    WHERE d.user_id = (select auth.uid())
    AND d.is_active = true
    AND (storage.foldername(name))[1] = d.id::text
  )
)
WITH CHECK (
  bucket_id = 'driver-photos' AND
  EXISTS (
    SELECT 1 FROM drivers d
    WHERE d.user_id = (select auth.uid())
    AND d.is_active = true
    AND (storage.foldername(name))[1] = d.id::text
  )
);

-- Delete: Drivers can delete their own photos OR admin can delete any
DROP POLICY IF EXISTS "driver_photos_delete" ON storage.objects;
CREATE POLICY "driver_photos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-photos' AND (
    -- Admin can delete any driver photo
    public.is_admin()
    -- Drivers can delete their own photos
    OR EXISTS (
      SELECT 1 FROM drivers d
      WHERE d.user_id = (select auth.uid())
      AND (storage.foldername(name))[1] = d.id::text
    )
  )
);

-- ===========================================
-- 3. COMMENTS
-- ===========================================
COMMENT ON POLICY "driver_photos_insert" ON storage.objects IS 'Active drivers can upload photos to their own folder';
COMMENT ON POLICY "driver_photos_select" ON storage.objects IS 'Public read for driver profile photos (customer tracking)';
COMMENT ON POLICY "driver_photos_update" ON storage.objects IS 'Active drivers can update their own photos';
COMMENT ON POLICY "driver_photos_delete" ON storage.objects IS 'Drivers can delete own photos, admins can delete any';
