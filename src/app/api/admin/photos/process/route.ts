import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RAW_SIZE = 10 * 1024 * 1024; // 10MB raw input limit
const MAX_PROCESSED_SIZE = 2 * 1024 * 1024; // 2MB after processing
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const OUTPUT_WIDTH = 800;
const OUTPUT_HEIGHT = 600;
const WEBP_QUALITY = 80;
const BUCKET = "menu-photos";

/**
 * POST /api/admin/photos/process
 * Server-side photo processing: validate, crop to 4:3, convert to WebP, upload to Supabase Storage.
 *
 * Accepts FormData with:
 * - file: image file (JPEG, PNG, or WebP)
 * - menuItemId: optional menu item ID for direct assignment
 *
 * Returns: { path, publicUrl, width, height, size, format }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/photos/process",
    });
    if (rl.limited) return rl.response;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const menuItemId = formData.get("menuItemId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate content type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP files are accepted" },
        { status: 400 }
      );
    }

    // Validate raw size
    if (file.size > MAX_RAW_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Get metadata and validate dimensions
    const metadata = await sharp(inputBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "Could not read image dimensions" }, { status: 400 });
    }

    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
      return NextResponse.json(
        {
          error: `Image must be at least ${MIN_WIDTH}x${MIN_HEIGHT} pixels. Got ${metadata.width}x${metadata.height}.`,
        },
        { status: 400 }
      );
    }

    // Process: resize + crop to 4:3 + convert to WebP
    const processedBuffer = await sharp(inputBuffer)
      .resize({
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Validate processed size
    if (processedBuffer.length > MAX_PROCESSED_SIZE) {
      return NextResponse.json(
        {
          error: `Processed image exceeds 2MB limit (${(processedBuffer.length / 1024 / 1024).toFixed(1)}MB). Try a smaller or simpler image.`,
        },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const folder = menuItemId || "unassigned";
    const filename = `${Date.now()}.webp`;
    const storagePath = `${folder}/${filename}`;

    const { data, error: uploadError } = await auth.supabase.storage
      .from(BUCKET)
      .upload(storagePath, processedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      logger.error("Photo upload failed", { error: uploadError, storagePath });
      return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = auth.supabase.storage.from(BUCKET).getPublicUrl(data.path);

    return NextResponse.json({
      path: data.path,
      publicUrl,
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      size: processedBuffer.length,
      format: "webp",
    });
  } catch (error) {
    logger.error("Photo processing error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
