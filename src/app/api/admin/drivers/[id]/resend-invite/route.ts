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
 * Resend a pending driver invite using Supabase Auth
 * Note: [id] is the invite ID, not driver ID
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
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
      return NextResponse.json(
        { error: "Failed to update invite" },
        { status: 500 }
      );
    }

    // Try to send invite - this works for new users
    const { error: inviteResendError } = await supabase.auth.admin.inviteUserByEmail(
      invite.email,
      {
        redirectTo: `${BASE_URL}/driver/onboard`,
        data: {
          role: "driver",
          invite_id: invite.id,
        },
      }
    );

    // If user already exists, generate a magic link instead
    if (inviteResendError?.message?.includes("already been registered") ||
        inviteResendError?.message?.includes("email_exists")) {
      // First, update the user's metadata
      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users?.find(
        (u) => u.email?.toLowerCase() === invite.email.toLowerCase()
      );

      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            role: "driver",
            invite_id: invite.id,
          },
        });
      }

      // Generate magic link for existing user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: invite.email,
        options: {
          redirectTo: `${BASE_URL}/driver/onboard`,
        },
      });

      if (linkError || !linkData) {
        logger.exception(linkError, { api: "admin/drivers/[id]/resend-invite", flowId: "generate-link" });
        return NextResponse.json(
          { error: "Failed to generate invite link", details: linkError?.message },
          { status: 500 }
        );
      }

      // Return success with the magic link for existing users
      return NextResponse.json({
        id: updatedInvite.id,
        email: updatedInvite.email,
        expiresAt: updatedInvite.expires_at,
        message: "User already has an account. Share this magic link with them:",
        magicLink: linkData.properties.action_link,
        isExistingUser: true,
      });
    }

    // Handle rate limiting
    if (inviteResendError?.message?.includes("rate") ||
        inviteResendError?.message?.includes("429") ||
        inviteResendError?.status === 429) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    // Log other errors but don't fail (invite record was updated)
    if (inviteResendError) {
      logger.exception(inviteResendError, { api: "admin/drivers/[id]/resend-invite", flowId: "supabase-invite" });
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
