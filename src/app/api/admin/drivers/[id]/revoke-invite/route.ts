import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

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
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<ProfileCheck[]>()
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      return NextResponse.json(
        { error: "This invite has already been revoked" },
        { status: 400 }
      );
    }

    // Revoke the invite
    const revokedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("driver_invites")
      .update({ revoked_at: revokedAt })
      .eq("id", id);

    if (updateError) {
      logger.exception(updateError, { api: "admin/drivers/[id]/revoke-invite", flowId: "revoke" });
      return NextResponse.json(
        { error: "Failed to revoke invite" },
        { status: 500 }
      );
    }

    logger.info("Driver invite revoked", {
      inviteId: id,
      email: invite.email,
      revokedBy: user.id,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
