/**
 * Supabase Storage utilities for driver profile photos
 *
 * Provides image validation, compression, upload, and management functions
 * for the driver-photos bucket.
 */

import { createClient } from "./client";

const BUCKET = "driver-photos";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

export interface DriverPhotoUploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Validate driver photo file before upload
 * Checks both MIME type and file extension (HEIC detection is inconsistent)
 */
export function validateDriverPhoto(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  const hasValidType = ALLOWED_TYPES.includes(file.type);

  // Fallback: check extension (HEIC files sometimes report empty MIME)
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: "Only JPEG, PNG, WebP, and HEIC files are accepted",
    };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File exceeds 5MB limit" };
  }

  return { valid: true };
}

/**
 * Compress and convert driver photo using browser-image-compression
 * Handles HEIC→JPEG conversion, EXIF orientation fix, and size reduction
 */
export async function compressDriverPhoto(file: File): Promise<File> {
  const imageCompression = (await import("browser-image-compression")).default;

  return imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
}

/**
 * Upload a compressed photo blob to driver-photos storage bucket
 * Uses timestamped filenames to avoid conflicts
 */
export async function uploadDriverPhoto(
  blob: Blob,
  driverId: string
): Promise<DriverPhotoUploadResult> {
  const supabase = createClient();
  const filename = `${Date.now()}.jpg`;
  const path = `${driverId}/${filename}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return { path: data.path, publicUrl };
}

/**
 * Delete a driver photo from storage
 */
export async function deleteDriverPhoto(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/**
 * Extract the storage path from a full Supabase public URL
 * URL format: https://<project>.supabase.co/storage/v1/object/public/driver-photos/<path>
 */
export function extractDriverPhotoPath(publicUrl: string): string | null {
  const match = publicUrl.match(/driver-photos\/(.+)$/);
  return match ? match[1] : null;
}
