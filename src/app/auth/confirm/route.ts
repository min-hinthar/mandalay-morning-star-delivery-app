import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getRoleDashboard } from "@/lib/auth/role-redirect";
import { logger } from "@/lib/utils/logger";

interface DriverInviteRow {
  id: string;
  email: string;
  accepted_at: string | null;
}

/** Validate that a redirect path is safe (no open redirect) */
function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

/**
 * GET /auth/confirm
 *
 * Server-side token verification for magic links generated via
 * `admin.generateLink()`. Bypasses the implicit-flow `action_link`
 * (which delivers tokens as hash fragments invisible to Route Handlers)
 * and instead verifies the `hashed_token` directly with `verifyOtp()`.
 *
 * Query params:
 *   - token_hash: hashed token from generateLink
 *   - type: OTP type (e.g. "magiclink")
 *   - next: redirect path after verification (default "/")
 *   - invite_id: optional driver invite ID
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/";
  const next = isSafeRedirect(rawNext) ? rawNext : "/";
  const inviteId = searchParams.get("invite_id");

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`, {
      status: 302,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error || !data.session) {
    logger.error("verifyOtp error", { api: "auth/confirm", flowId: "auth" });

    // Token expired or invalid — route to expired page with invite context
    if (inviteId) {
      const serviceSupabase = createServiceClient();
      const { data: invite } = await serviceSupabase
        .from("driver_invites")
        .select("email")
        .eq("id", inviteId)
        .single();
      const email = invite?.email ?? "";
      return NextResponse.redirect(
        `${origin}/auth/expired?email=${encodeURIComponent(email)}&invite_id=${inviteId}`,
        { status: 302 }
      );
    }

    return NextResponse.redirect(`${origin}/auth/expired`, { status: 302 });
  }

  // Process driver invite if present
  if (inviteId) {
    const serviceSupabase = createServiceClient();
    const userEmail = data.session.user.email;
    const userId = data.session.user.id;

    logger.info("Processing driver invite", { api: "auth/confirm", flowId: "auth" });

    const { data: invite, error: inviteError } = await serviceSupabase
      .from("driver_invites")
      .select("id, email, accepted_at")
      .eq("id", inviteId)
      .returns<DriverInviteRow[]>()
      .single();

    if (invite && !inviteError) {
      if (invite.email.toLowerCase() === userEmail?.toLowerCase()) {
        const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...data.session.user.user_metadata,
            role: "driver",
            invite_id: inviteId,
          },
        });

        if (updateError) {
          logger.error("Failed to update user metadata", { api: "auth/confirm", flowId: "auth" });
        }
      } else {
        logger.warn("Email mismatch on driver invite", { api: "auth/confirm", flowId: "auth" });
      }
    }
  }

  // Resolve role-based redirect
  const roleClient = createServiceClient();
  const {
    data: { user: confirmedUser },
  } = await supabase.auth.getUser();
  const roleResult = confirmedUser
    ? await getRoleDashboard(roleClient, confirmedUser.id, confirmedUser.email)
    : { path: next };

  // For driver invites, always go to /driver/onboard
  const finalPath = inviteId ? "/driver/onboard" : roleResult.path;

  return NextResponse.redirect(`${origin}${finalPath}`, { status: 302 });
}
