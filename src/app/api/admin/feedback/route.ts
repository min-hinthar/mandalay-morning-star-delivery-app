import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";
import type { FeedbackCategory, FeedbackStatus } from "@/types/feedback";

// ============================================
// GET — Admin: list all feedback
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth + admin check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<{ role: ProfileRole }[]>()
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

    return NextResponse.json({ feedback: feedback ?? [] });
  } catch (err) {
    logger.error("Admin feedback GET error");
    logger.exception(err, { flowId: "admin-feedback" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
