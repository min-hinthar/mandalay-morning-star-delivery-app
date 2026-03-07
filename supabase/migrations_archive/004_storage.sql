-- ===========================================
-- 004: Storage Buckets and Policies
-- Delivery photos storage with RLS
-- SECURITY FIX: Using (select auth.uid()) for initplan optimization
-- ===========================================

-- ===========================================
-- 1. CREATE DELIVERY PHOTOS BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-photos',
  'delivery-photos',
  false,
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- 2. STORAGE RLS POLICIES (idempotent)
-- Using consolidated policies with (select auth.uid())
-- ===========================================

-- Upload: Drivers can upload to their own routes
DROP POLICY IF EXISTS "delivery_photos_insert" ON storage.objects;
CREATE POLICY "delivery_photos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  EXISTS (
    SELECT 1 FROM routes r
    JOIN drivers d ON r.driver_id = d.id
    WHERE d.user_id = (select auth.uid())
    AND (storage.foldername(name))[1] = r.id::text
  )
);

-- Read: Drivers can read their own OR admin can read all
DROP POLICY IF EXISTS "delivery_photos_select" ON storage.objects;
CREATE POLICY "delivery_photos_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-photos' AND (
    -- Admin can read all
    public.is_admin()
    -- Drivers can read their own route photos
    OR EXISTS (
      SELECT 1 FROM routes r
      JOIN drivers d ON r.driver_id = d.id
      WHERE d.user_id = (select auth.uid())
      AND (storage.foldername(name))[1] = r.id::text
    )
  )
);

-- Delete: Drivers can delete their own photos before route completion
DROP POLICY IF EXISTS "delivery_photos_delete" ON storage.objects;
CREATE POLICY "delivery_photos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  EXISTS (
    SELECT 1 FROM routes r
    JOIN drivers d ON r.driver_id = d.id
    WHERE d.user_id = (select auth.uid())
    AND r.status = 'in_progress'
    AND (storage.foldername(name))[1] = r.id::text
  )
);
