import { createServiceClient } from "./server";

const DELIVERY_PHOTOS_BUCKET = "delivery-photos";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extract the storage path from a full URL or return as-is if already a path.
 * Handles backward compatibility with rows that store full public URLs.
 */
export function extractDeliveryPhotoPath(
  pathOrUrl: string
): string | null {
  if (!pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }

  const match = pathOrUrl.match(/delivery-photos\/(.+)$/);
  return match?.[1] ?? null;
}

/**
 * Generate a time-limited signed URL for a delivery photo.
 * Returns null for null/empty input or on SDK error (photo is non-critical).
 */
export async function getDeliveryPhotoSignedUrl(
  pathOrUrl: string | null
): Promise<string | null> {
  if (!pathOrUrl) return null;

  const path = extractDeliveryPhotoPath(pathOrUrl);
  if (!path) return null;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from(DELIVERY_PHOTOS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);

    if (error) {
      console.error("[delivery-photos] Failed to create signed URL:", error.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("[delivery-photos] Unexpected error creating signed URL:", err);
    return null;
  }
}
