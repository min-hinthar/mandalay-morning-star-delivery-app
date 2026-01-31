import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";

const verifyDriveSchema = z.object({
  url: z.string().url("Invalid URL"),
});

/**
 * Extract Google Drive file ID from various URL formats
 */
function extractDriveFileId(url: string): string | null {
  // Format 1: drive.google.com/file/d/XXX/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Format 2: drive.google.com/open?id=XXX or drive.google.com/uc?id=XXX
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Format 3: docs.google.com/document/d/XXX (for docs, but might have images)
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) return docMatch[1];

  return null;
}

/**
 * POST /api/admin/photos/verify-drive
 * Verify Google Drive URL is accessible and extract preview URL
 * Body: { url: string }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = verifyDriveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    // Check if it's a Google Drive URL
    if (!url.includes("drive.google.com") && !url.includes("docs.google.com")) {
      return NextResponse.json({
        valid: false,
        previewUrl: null,
        fileId: null,
        error: "Not a Google Drive URL",
      });
    }

    // Extract file ID
    const fileId = extractDriveFileId(url);
    if (!fileId) {
      return NextResponse.json({
        valid: false,
        previewUrl: null,
        fileId: null,
        error: "Invalid Drive URL format - could not extract file ID",
      });
    }

    // Construct direct image URL
    const previewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    // Try to verify accessibility with a HEAD request
    try {
      const response = await fetch(previewUrl, {
        method: "HEAD",
        redirect: "follow",
      });

      // Google Drive returns 200 for public files, or redirects to login for private
      // Check if we got redirected to a login page
      const finalUrl = response.url;
      if (finalUrl.includes("accounts.google.com") || finalUrl.includes("ServiceLogin")) {
        return NextResponse.json({
          valid: false,
          previewUrl: null,
          fileId,
          error: "File is not publicly accessible - please update sharing settings",
        });
      }

      // Check content type (should be an image)
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.startsWith("image/") && !contentType.includes("text/html")) {
        // If it's a valid response but not an image, it might still work (Google sometimes returns html wrapper)
        logger.info(`Drive file content-type: ${contentType}`, { fileId });
      }

      if (response.ok) {
        return NextResponse.json({
          valid: true,
          previewUrl,
          fileId,
        });
      }

      return NextResponse.json({
        valid: false,
        previewUrl: null,
        fileId,
        error: `Could not verify accessibility (status: ${response.status})`,
      });
    } catch (fetchError) {
      logger.exception(fetchError, { api: "admin/photos/verify-drive", flowId: "head-request" });

      // Network error - URL might still be valid, just can't verify
      return NextResponse.json({
        valid: true, // Assume valid if we can't verify
        previewUrl,
        fileId,
        warning: "Could not verify accessibility - URL may or may not work",
      });
    }
  } catch (error) {
    logger.exception(error, { api: "admin/photos/verify-drive", flowId: "verify" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
