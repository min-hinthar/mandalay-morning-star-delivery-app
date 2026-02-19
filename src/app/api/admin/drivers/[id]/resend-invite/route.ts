import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";

import { DriverInvite } from "@/emails/DriverInvite";
import { requireAdmin } from "@/lib/auth";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { getAppUrl } from "@/lib/supabase/actions";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/drivers/:id/resend-invite",
    });
    if (rl.limited) return rl.response;

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

    // Generate magic link token — use hashed_token + /auth/confirm route
    const appUrl = await getAppUrl();
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: invite.email,
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

    // Construct verification URL with all params preserved in our own route
    const confirmUrl = new URL(`${appUrl}/auth/confirm`);
    confirmUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
    confirmUrl.searchParams.set("type", "magiclink");
    confirmUrl.searchParams.set("next", "/driver/onboard");
    confirmUrl.searchParams.set("invite_id", invite.id);

    // Send invite email to driver
    const resend = getResendClient();
    const emailComponent = React.createElement(DriverInvite, {
      driverEmail: invite.email,
      magicLink: confirmUrl.toString(),
      expiresIn: "24 hours",
    });
    const html = await render(emailComponent);
    const text = await render(emailComponent, { plainText: true });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: invite.email,
      replyTo: EMAIL_REPLY_TO,
      subject: "You're invited to drive for Mandalay Morning Star",
      html,
      text,
    });

    return NextResponse.json({
      id: updatedInvite.id,
      email: updatedInvite.email,
      expiresAt: updatedInvite.expires_at,
      emailSent: true,
      message: "Invite email sent to driver",
      isExistingUser: !!existingUser,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/resend-invite" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
