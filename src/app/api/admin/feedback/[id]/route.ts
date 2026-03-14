import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

// ============================================
// Validation
// ============================================

const updateFeedbackSchema = z.object({
  status: z.enum(["new", "in_review", "resolved", "dismissed"]).optional(),
  admin_notes: z.string().max(2000).optional(),
});

// ============================================
// PATCH — Admin: update feedback status/notes
// ============================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid feedback ID" }, { status: 400 });
    }

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

    // Parse + validate body
    const body = await request.json();
    const parsed = updateFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { ...parsed.data };

    // Set/clear resolved_at based on status
    if (parsed.data.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    } else if (parsed.data.status) {
      updates.resolved_at = null;
    }

    const { data: updated, error: updateError } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("customer_feedback" as any)
      .update(updates)
      .eq("id", id)
      .select("id")
      .single();

    if (updateError || !updated) {
      logger.error("Failed to update feedback", { error: updateError?.message, id });
      return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
    }

    return NextResponse.json({
      id: (updated as unknown as Record<string, unknown>).id,
      message: "Updated",
    });
  } catch (err) {
    logger.error("Admin feedback PATCH error");
    logger.exception(err, { flowId: "admin-feedback" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
