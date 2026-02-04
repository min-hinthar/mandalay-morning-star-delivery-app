import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { sendDriverInvite } from "@/lib/services/email";
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
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

/**
 * POST /api/admin/drivers/[id]/resend-invite
 * Resend a pending driver invite with a new token
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
      .select("id, email, expires_at, accepted_at, revoked_at")
      .eq("id", id)
      .returns<DriverInviteRow[]>()
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Verify invite is still pending
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "This invite has already been accepted" },
        { status: 400 }
      );
    }

    if (invite.revoked_at) {
      return NextResponse.json(
        { error: "This invite has been revoked" },
        { status: 400 }
      );
    }

    // Generate new token and expiration
    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update invite record
    const { data: updatedInvite, error: updateError } = await supabase
      .from("driver_invites")
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq("id", id)
      .select("id, email, expires_at")
      .returns<DriverInviteRow[]>()
      .single();

    if (updateError) {
      logger.exception(updateError, { api: "admin/drivers/[id]/resend-invite", flowId: "update" });
      return NextResponse.json(
        { error: "Failed to update invite" },
        { status: 500 }
      );
    }

    // Send new invite email
    try {
      const { error: emailError } = await sendDriverInvite(
        invite.email,
        newToken,
        newExpiresAt
      );

      if (emailError) {
        logger.exception(emailError, { api: "admin/drivers/[id]/resend-invite", flowId: "email" });
      }
    } catch (emailError) {
      logger.exception(emailError, { api: "admin/drivers/[id]/resend-invite", flowId: "email" });
    }

    return NextResponse.json({
      id: updatedInvite.id,
      email: updatedInvite.email,
      expiresAt: updatedInvite.expires_at,
      message: "Invite resent successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/resend-invite" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
