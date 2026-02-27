import crypto from "crypto";
import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { z } from "zod";

import { DriverInvite } from "@/emails/DriverInvite";
import { requireAdmin } from "@/lib/auth";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { getAppUrl } from "@/lib/supabase/actions";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email("Invalid email format"),
});

interface PendingInvite {
  id: string;
  email: string;
}

interface ExistingDriver {
  id: string;
}

interface DriverInviteRow {
  id: string;
  email: string;
  expires_at: string;
}

/**
 * POST /api/admin/drivers/invite
 * Send a driver invite using unified magic link approach
 * Works for both new and existing users
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/drivers/invite",
    });
    if (rl.limited) return rl.response;
    const { userId } = auth;

    // Use service client to bypass RLS for admin operations
    const supabase = createServiceClient();

    // Parse and validate request body
    const body = await request.json();
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already has a pending invite
    const { data: existingInvite } = await supabase
      .from("driver_invites")
      .select("id, email")
      .eq("email", normalizedEmail)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .returns<PendingInvite[]>()
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "This email already has a pending invite. Use resend to send a new invitation." },
        { status: 409 }
      );
    }

    // Check if email is already registered as a driver
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingProfile) {
      const { data: existingDriver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", existingProfile.id)
        .returns<ExistingDriver[]>()
        .single();

      if (existingDriver) {
        return NextResponse.json(
          { error: "This email is already registered as a driver" },
          { status: 409 }
        );
      }
    }

    // Create invite record (24 hour expiry)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const placeholderToken = `supabase-${crypto.randomBytes(16).toString("hex")}`;

    const { data: invite, error: insertError } = await supabase
      .from("driver_invites")
      .insert({
        email: normalizedEmail,
        token: placeholderToken,
        invited_by: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, email, expires_at")
      .returns<DriverInviteRow[]>()
      .single();

    if (insertError) {
      logger.exception(insertError, { api: "admin/drivers/invite", flowId: "insert" });
      return NextResponse.json(
        { error: "Failed to create invite", details: insertError.message },
        { status: 500 }
      );
    }

    // Check if user already exists in auth system
    const { data: userData } = await supabase.auth.admin.listUsers();
    const existingUser = userData?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    // Update user metadata if they exist (so callback can detect driver invite)
    if (existingUser) {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          pending_driver_invite: invite.id,
        },
      });

      if (metadataError) {
        // H-04 FIX: Don't silently swallow — this failure means the driver
        // will get customer role instead of driver role on login.
        logger.error("Failed to set pending_driver_invite metadata on existing user", {
          api: "admin/drivers/invite",
          flowId: "metadata",
          userId: existingUser.id,
          inviteId: invite.id,
          error: metadataError.message,
        });
        // Clean up the invite since it won't work without metadata
        await supabase.from("driver_invites").delete().eq("id", invite.id);
        return NextResponse.json(
          { error: "Failed to prepare user account for driver invite. Please try again." },
          { status: 500 }
        );
      }
    }

    // Generate magic link token — we use hashed_token + our own /auth/confirm
    // route instead of action_link because generateLink's implicit flow delivers
    // tokens as hash fragments invisible to server-side Route Handlers.
    const appUrl = await getAppUrl();
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkError || !linkData) {
      logger.exception(linkError, { api: "admin/drivers/invite", flowId: "generate-link" });
      await supabase.from("driver_invites").delete().eq("id", invite.id);
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
      driverEmail: normalizedEmail,
      magicLink: confirmUrl.toString(),
      expiresIn: "24 hours",
    });
    const html = await render(emailComponent);
    const text = await render(emailComponent, { plainText: true });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: normalizedEmail,
      replyTo: EMAIL_REPLY_TO,
      subject: "You're invited to drive for Mandalay Morning Star",
      html,
      text,
    });

    return NextResponse.json(
      {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expires_at,
        emailSent: true,
        message: "Invite email sent to driver",
        isExistingUser: !!existingUser,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/invite" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
