import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DriverInviteRow {
  id: string;
  email: string;
  accepted_at: string | null;
}

/** Validate that a redirect path is safe (no open redirect) */
function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

/** Resolve the dashboard path for a given user based on profiles.role */
async function getRoleDashboard(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();

  const role = data?.role as string | undefined;

  if (role === "admin") return "/admin";

  if (role === "driver") {
    // Only redirect to /driver if they have an active driver record
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (driver) return "/driver";
  }

  return "/";
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
    console.error("[Auth Callback] OAuth error:", errorParam, errorDescription);

    // Preserve driver invite context through error redirect
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
        { status: 302 },
      );
    }

    const errorMessage = encodeURIComponent(errorDescription || errorParam);
    return NextResponse.redirect(`${origin}/login?error=${errorMessage}`, { status: 302 });
  }

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Code exchange error:", error.message);
      const normalizedError = error.message.toLowerCase();
      if (normalizedError.includes("expired") || normalizedError.includes("invalid")) {
        // Look up email from invite record (email is never in callback URL)
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
            { status: 302 },
          );
        }
        return NextResponse.redirect(`${origin}/auth/expired`, { status: 302 });
      }
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`, { status: 302 });
    }

    // Handle driver invite flow
    if (inviteId && sessionData.session) {
      const serviceSupabase = createServiceClient();
      const userEmail = sessionData.session.user.email;
      const userId = sessionData.session.user.id;

      console.log("[Auth Callback] Processing driver invite:", { inviteId, userEmail });

      // Verify invite exists and matches user email
      const { data: invite, error: inviteError } = await serviceSupabase
        .from("driver_invites")
        .select("id, email, accepted_at")
        .eq("id", inviteId)
        .returns<DriverInviteRow[]>()
        .single();

      if (invite && !inviteError) {
        // Verify email matches (case-insensitive)
        if (invite.email.toLowerCase() === userEmail?.toLowerCase()) {
          // Update user metadata with driver role and invite_id
          const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...sessionData.session.user.user_metadata,
              role: "driver",
              invite_id: inviteId,
            },
          });

          if (updateError) {
            console.error("[Auth Callback] Failed to update user metadata:", updateError.message);
          } else {
            console.log("[Auth Callback] Set driver metadata for user:", userId);
          }
        } else {
          console.warn("[Auth Callback] Email mismatch:", {
            inviteEmail: invite.email,
            userEmail,
          });
        }
      } else {
        console.warn("[Auth Callback] Invite not found or error:", {
          inviteId,
          error: inviteError?.message,
        });
      }
    }

    // Determine redirect target
    // If next is /login (standard login flow), resolve by role
    // Otherwise honor the deep link as-is
    const isStandardLogin = next === "/login" || next === "/";
    const redirectPath = isStandardLogin
      ? await getRoleDashboard(supabase, sessionData.session!.user.id)
      : next;

    return NextResponse.redirect(`${origin}${redirectPath}`, { status: 302 });
  }

  // Default error redirect
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`, { status: 302 });
}
