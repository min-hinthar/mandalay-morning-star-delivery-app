import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendDriverInvite } from "@/lib/services/email";
import { logger } from "@/lib/utils/logger";

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
 * Send a driver invite email with onboarding token
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

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

    // Generate secure token and expiration
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert invite record
    const { data: invite, error: insertError } = await supabase
      .from("driver_invites")
      .insert({
        email: normalizedEmail,
        token,
        invited_by: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, email, expires_at")
      .returns<DriverInviteRow[]>()
      .single();

    if (insertError) {
      logger.exception(insertError, { api: "admin/drivers/invite", flowId: "insert" });
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    // Send invite email (non-blocking - log error but still return success)
    try {
      const { error: emailError } = await sendDriverInvite(
        normalizedEmail,
        token,
        expiresAt
      );

      if (emailError) {
        logger.exception(emailError, { api: "admin/drivers/invite", flowId: "email" });
        // Still return success since DB insert worked
      }
    } catch (emailError) {
      logger.exception(emailError, { api: "admin/drivers/invite", flowId: "email" });
      // Still return success since DB insert worked
    }

    return NextResponse.json(
      {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expires_at,
        message: "Invite sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/invite" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
