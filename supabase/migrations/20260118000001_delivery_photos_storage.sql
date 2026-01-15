-- Migration: Delivery Photos Storage Bucket
-- Description: Creates storage bucket for delivery photos with RLS policies

-- 1. Create delivery photos bucket
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

-- 2. RLS Policy: Drivers can upload photos to their own routes
-- Path structure: delivery-photos/{route_id}/{stop_id}.jpg
CREATE POLICY "driver_upload_photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  EXISTS (
    SELECT 1 FROM routes r
    JOIN drivers d ON r.driver_id = d.id
    WHERE d.user_id = auth.uid()
    AND (storage.foldername(name))[1] = r.id::text
  )
);

-- 3. RLS Policy: Drivers can read their own route photos, admins can read all
CREATE POLICY "driver_read_own_photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-photos' AND (
    -- Admins can read all photos
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    -- Drivers can read their own route photos
    EXISTS (
      SELECT 1 FROM routes r
      JOIN drivers d ON r.driver_id = d.id
      WHERE d.user_id = auth.uid()
      AND (storage.foldername(name))[1] = r.id::text
    )
  )
);

-- 4. RLS Policy: Drivers can delete their own photos (before route completion)
CREATE POLICY "driver_delete_own_photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  EXISTS (
    SELECT 1 FROM routes r
    JOIN drivers d ON r.driver_id = d.id
    WHERE d.user_id = auth.uid()
    AND r.status = 'in_progress'
    AND (storage.foldername(name))[1] = r.id::text
  )
);

-- 5. Add delivery_photo_url column to route_stops if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'route_stops' AND column_name = 'delivery_photo_url'
  ) THEN
    ALTER TABLE route_stops ADD COLUMN delivery_photo_url TEXT;
  END IF;
END $$;

-- 6. Create index for photo lookups
CREATE INDEX IF NOT EXISTS idx_route_stops_delivery_photo_url
ON route_stops(delivery_photo_url) WHERE delivery_photo_url IS NOT NULL;
