import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getRoleDashboard } from "@/lib/auth/role-redirect";
import { resolveOAuthEmail } from "@/lib/auth/resolve-oauth-email";
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
 * Auth callback handler for Supabase Auth
 * Handles OAuth callbacks and magic link tokens
 *
 * For driver invites:
 * 1. Exchange code for session
 * 2. Check if invite_id is in params
 * 3. Verify invite exists and matches user email
 * 4. Update user metadata with role: "driver", invite_id
 * 5. Redirect to /driver/onboard
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = isSafeRedirect(rawNext) ? rawNext : "/";
  const inviteId = searchParams.get("invite_id");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors from Supabase
  if (errorParam) {
    logger.error("OAuth error in callback", { api: "auth/callback", flowId: "auth" });

    // Preserve driver invite context through error redirect
    if (inviteId) {
      const serviceClient = createServiceClient();
      const { data: invite } = await serviceClient
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

    const errorMessage = encodeURIComponent(errorDescription || errorParam);
    return NextResponse.redirect(`${origin}/login?error=${errorMessage}`, { status: 302 });
  }

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error("Code exchange error", { api: "auth/callback", flowId: "auth" });
      const normalizedError = error.message.toLowerCase();
      if (normalizedError.includes("expired") || normalizedError.includes("invalid")) {
        // Look up email from invite record (email is never in callback URL)
        if (inviteId) {
          const serviceClient = createServiceClient();
          const { data: invite } = await serviceClient
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
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`, { status: 302 });
    }

    // Shared service client for profile sync, driver invite, and role lookup
    const serviceClient = createServiceClient();

    // Sync profile email (returning OAuth users bypass the DB trigger)
    if (sessionData.session) {
      const userEmail = resolveOAuthEmail(sessionData.session.user);
      const userId = sessionData.session.user.id;
      if (userEmail && userId) {
        await serviceClient
          .from("profiles")
          .update({ email: userEmail })
          .eq("id", userId)
          .is("email", null);
      } else if (!userEmail) {
        logger.warn("OAuth callback: email is NULL after all sources checked", {
          api: "auth/callback",
          flowId: "auth",
          userId,
          hasUserMetadata: !!sessionData.session.user.user_metadata?.email,
          hasIdentities: !!sessionData.session.user.identities?.length,
        });
      }
    }

    // Handle driver invite flow
    if (inviteId && sessionData.session) {
      const userEmail = resolveOAuthEmail(sessionData.session.user);
      const userId = sessionData.session.user.id;

      logger.info("Processing driver invite", { api: "auth/callback", flowId: "auth" });

      // Verify invite exists and matches user email
      const { data: invite, error: inviteError } = await serviceClient
        .from("driver_invites")
        .select("id, email, accepted_at")
        .eq("id", inviteId)
        .returns<DriverInviteRow[]>()
        .single();

      if (invite && !inviteError) {
        // Verify email matches (case-insensitive)
        if (invite.email.toLowerCase() === userEmail?.toLowerCase()) {
          // Update user metadata with driver role and invite_id
          const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...sessionData.session.user.user_metadata,
              role: "driver",
              invite_id: inviteId,
            },
          });

          if (updateError) {
            logger.error("Failed to update user metadata", {
              api: "auth/callback",
              flowId: "auth",
              userId,
            });
          } else {
            logger.info("Set driver metadata for user", {
              api: "auth/callback",
              flowId: "auth",
              userId,
            });
          }
        } else {
          logger.warn("Email mismatch on driver invite", { api: "auth/callback", flowId: "auth" });
        }
      } else {
        logger.warn("Invite not found or error", { api: "auth/callback", flowId: "auth" });
      }
    }

    // Determine redirect target
    // Use service client for role lookup — SSR cookie state after
    // exchangeCodeForSession can be inconsistent in Route Handlers,
    // causing RLS-gated queries to return no data.
    const result = await getRoleDashboard(
      serviceClient,
      sessionData.session!.user.id,
      resolveOAuthEmail(sessionData.session!.user)
    );

    // If next is /login or / (standard login flow), resolve by role
    const isStandardLogin = next === "/login" || next === "/";

    let redirectPath = result.path;

    // If role lookup failed, redirect to login with error (never silently to /)
    if (result.role === "unknown") {
      return NextResponse.redirect(`${origin}${result.path}`, { status: 302 });
    }

    if (!isStandardLogin) {
      // Honor ?next= deep link — but verify role authorization
      if (next.startsWith("/admin") && result.role !== "admin") {
        redirectPath = result.path; // Unauthorized for /admin, go to own dashboard
      } else if (next.startsWith("/driver") && result.role !== "driver") {
        redirectPath = result.path; // Unauthorized for /driver, go to own dashboard
      } else {
        redirectPath = next; // Authorized — honor the deep link
      }
    }

    return NextResponse.redirect(`${origin}${redirectPath}`, { status: 302 });
  }

  // Default error redirect
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`, { status: 302 });
}
