import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { FeedbackCategory, FeedbackStatus } from "@/types/feedback";

// ============================================
// GET — Admin: list all feedback
// ============================================

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    // Parse filters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") as FeedbackStatus | null;
    const categoryFilter = searchParams.get("category") as FeedbackCategory | null;

    // Build query
    let query = supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("customer_feedback" as any)
      .select(
        `
        *,
        profiles (
          full_name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }

    const { data: feedback, error } = await query;

    if (error) {
      logger.error("Admin feedback fetch failed", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    // Screenshots live in a private bucket: swap stored paths (and legacy
    // public URLs) for short-lived signed URLs.
    const service = createServiceClient();
    const legacyPublicPrefix = "/storage/v1/object/public/feedback-attachments/";
    const rows = (feedback ?? []) as unknown as Array<{
      screenshot_url: string | null;
      screenshot_path: string | null;
    }>;
    await Promise.all(
      rows.map(async (item) => {
        const legacyPath = item.screenshot_url?.includes(legacyPublicPrefix)
          ? decodeURIComponent(item.screenshot_url.split(legacyPublicPrefix)[1] ?? "")
          : null;
        const path = item.screenshot_path ?? (legacyPath || null);
        if (!path) {
          item.screenshot_url = null;
          return;
        }
        const { data: signed } = await service.storage
          .from("feedback-attachments")
          .createSignedUrl(path, 60 * 60);
        item.screenshot_url = signed?.signedUrl ?? null;
      })
    );

    return NextResponse.json({ feedback: rows });
  } catch (err) {
    logger.error("Admin feedback GET error");
    logger.exception(err, { flowId: "admin-feedback" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
