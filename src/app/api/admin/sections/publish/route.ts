import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/admin/sections/publish
 * Publish all section changes - sets has_unpublished_changes = false for all sections
 */
export async function POST() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
      return NextResponse.json(
        { error: "Failed to publish changes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      publishedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/publish" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
