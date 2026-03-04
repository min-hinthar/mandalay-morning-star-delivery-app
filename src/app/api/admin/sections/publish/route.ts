import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

/**
 * POST /api/admin/sections/publish
 * Publish all section changes - sets has_unpublished_changes = false for all sections
 */
export async function POST() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections/publish",
    });
    if (rl.limited) return rl.response;

    const { error } = await auth.supabase
      .from("featured_sections")
      .update({
        has_unpublished_changes: false,
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      })
      .eq("has_unpublished_changes", true);

    if (error) {
      logger.exception(error, { api: "admin/sections/publish" });
      return apiError("INTERNAL_ERROR", "Failed to publish changes", 500);
    }

    return NextResponse.json({
      success: true,
      publishedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/publish" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
