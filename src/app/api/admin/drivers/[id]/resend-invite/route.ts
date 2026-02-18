import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * POST /api/admin/drivers/[id]/resend-invite
 * Resend a pending driver invite using unified magic link approach
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

    // Use service client to bypass RLS
    const supabase = createServiceClient();

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
      return NextResponse.json({ error: "This invite has already been accepted" }, { status: 400 });
    }

    if (invite.revoked_at) {
      return NextResponse.json({ error: "This invite has been revoked" }, { status: 400 });
    }

    // Update expiration
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { data: updatedInvite, error: updateError } = await supabase
      .from("driver_invites")
      .update({
        expires_at: newExpiresAt.toISOString(),
      })
      .eq("id", id)
      .select("id, email, expires_at")
      .returns<DriverInviteRow[]>()
      .single();

    if (updateError) {
      logger.exception(updateError, { api: "admin/drivers/[id]/resend-invite", flowId: "update" });
      return NextResponse.json({ error: "Failed to update invite" }, { status: 500 });
    }

    // Check if user exists in auth system
    const { data: userData } = await supabase.auth.admin.listUsers();
    const existingUser = userData?.users?.find(
      (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
    );

    // Update user metadata if they exist
    if (existingUser) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          pending_driver_invite: invite.id,
        },
      });
    }

    // Generate new magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: invite.email,
      options: {
        redirectTo: `${BASE_URL}/auth/callback?next=/driver/onboard&invite_id=${invite.id}`,
      },
    });

    if (linkError || !linkData) {
      logger.exception(linkError, {
        api: "admin/drivers/[id]/resend-invite",
        flowId: "generate-link",
      });
      return NextResponse.json(
        { error: "Failed to generate invite link", details: linkError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedInvite.id,
      email: updatedInvite.email,
      expiresAt: updatedInvite.expires_at,
      magicLink: linkData.properties.action_link,
      message: existingUser
        ? "User has an existing account. Share this link to add driver role."
        : "Share this link with the new driver to complete registration.",
      isExistingUser: !!existingUser,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/resend-invite" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
