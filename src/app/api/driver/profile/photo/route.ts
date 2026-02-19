import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireDriver } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

const BUCKET = "driver-photos";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Extract storage path from a Supabase public URL
 */
function extractPhotoPath(publicUrl: string): string | null {
  const match = publicUrl.match(/driver-photos\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * POST /api/driver/profile/photo
 * Upload a new profile photo for the authenticated driver
 * Accepts multipart/form-data with a "photo" field
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/profile/photo",
    });
    if (rl.limited) return rl.response;

    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!photo || !(photo instanceof Blob)) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    // Server-side validation (defense in depth — client also validates)
    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP files are accepted" },
        { status: 400 }
      );
    }

    if (photo.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    // Get existing profile_image_url for cleanup
    interface DriverPhotoRow {
      profile_image_url: string | null;
    }
    const { data: currentDriver } = await supabase
      .from("drivers")
      .select("profile_image_url")
      .eq("id", driverId)
      .returns<DriverPhotoRow[]>()
      .single();

    // Upload new photo to storage
    const filename = `${Date.now()}.jpg`;
    const storagePath = `${driverId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      logger.exception(uploadError, { api: "driver/profile/photo", flowId: "upload" });
      return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // Update driver record with new URL
    const { error: updateError } = await supabase
      .from("drivers")
      .update({ profile_image_url: publicUrl })
      .eq("id", driverId);

    if (updateError) {
      logger.exception(updateError, { api: "driver/profile/photo", flowId: "update-driver" });
      // Clean up uploaded file since DB update failed
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Delete old photo from storage (cleanup, non-critical)
    if (currentDriver?.profile_image_url) {
      const oldPath = extractPhotoPath(currentDriver.profile_image_url);
      if (oldPath) {
        const serviceSupabase = createServiceClient();
        const { error: deleteError } = await serviceSupabase.storage
          .from(BUCKET)
          .remove([oldPath]);
        if (deleteError) {
          logger.warn("Failed to delete old driver photo", { oldPath, error: deleteError });
        }
      }
    }

    revalidatePath("/driver");

    return NextResponse.json({ profileImageUrl: publicUrl });
  } catch (error) {
    logger.exception(error, { api: "driver/profile/photo" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/driver/profile/photo
 * Remove the current profile photo
 */
export async function DELETE() {
  try {
    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/profile/photo",
    });
    if (rl.limited) return rl.response;

    // Get current photo URL
    interface DriverPhotoRow {
      profile_image_url: string | null;
    }
    const { data: driver } = await supabase
      .from("drivers")
      .select("profile_image_url")
      .eq("id", driverId)
      .returns<DriverPhotoRow[]>()
      .single();

    if (driver?.profile_image_url) {
      const photoPath = extractPhotoPath(driver.profile_image_url);
      if (photoPath) {
        const serviceSupabase = createServiceClient();
        const { error: deleteError } = await serviceSupabase.storage
          .from(BUCKET)
          .remove([photoPath]);
        if (deleteError) {
          logger.warn("Failed to delete driver photo from storage", {
            photoPath,
            error: deleteError,
          });
        }
      }
    }

    // Null out the URL in the database
    const { error: updateError } = await supabase
      .from("drivers")
      .update({ profile_image_url: null })
      .eq("id", driverId);

    if (updateError) {
      logger.exception(updateError, { api: "driver/profile/photo", flowId: "delete-update" });
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    revalidatePath("/driver");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "driver/profile/photo" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
