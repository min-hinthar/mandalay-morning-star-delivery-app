import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface DriverInviteRow {
  id: string;
  email: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

/**
 * POST /api/admin/drivers/[id]/revoke-invite
 * Revoke a pending driver invite
 * Note: [id] is the invite ID, not driver ID
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify admin access
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/drivers/:id/revoke-invite" });
    if (rl.limited) return rl.response;
    const { userId } = auth;

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    // Fetch the invite
    const { data: invite, error: inviteError } = await supabase
      .from("driver_invites")
      .select("id, email, accepted_at, revoked_at")
      .eq("id", id)
      .returns<DriverInviteRow[]>()
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Verify invite can be revoked
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "Cannot revoke an invite that has already been accepted" },
        { status: 400 }
      );
    }

    if (invite.revoked_at) {
      return NextResponse.json({ error: "This invite has already been revoked" }, { status: 400 });
    }

    // Revoke the invite
    const revokedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("driver_invites")
      .update({ revoked_at: revokedAt })
      .eq("id", id);

    if (updateError) {
      logger.exception(updateError, { api: "admin/drivers/[id]/revoke-invite", flowId: "revoke" });
      return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
    }

    logger.info("Driver invite revoked", {
      inviteId: id,
      email: invite.email,
      revokedBy: userId,
      revokedAt,
    });

    return NextResponse.json({
      id,
      email: invite.email,
      revokedAt,
      message: "Invite revoked successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/revoke-invite" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
