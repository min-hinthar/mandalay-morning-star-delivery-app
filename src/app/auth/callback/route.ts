import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface DriverInviteRow {
  id: string;
  email: string;
  accepted_at: string | null;
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
  const next = searchParams.get("next") ?? "/";
  const inviteId = searchParams.get("invite_id");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors from Supabase
  if (errorParam) {
    console.error("[Auth Callback] OAuth error:", errorParam, errorDescription);
    const errorMessage = encodeURIComponent(errorDescription || errorParam);
    return NextResponse.redirect(
      `${origin}/login?error=${errorMessage}`,
      { status: 302 }
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Code exchange error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_error`,
        { status: 302 }
      );
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
          const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                ...sessionData.session.user.user_metadata,
                role: "driver",
                invite_id: inviteId,
              },
            }
          );

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

    // Redirect to the target page
    return NextResponse.redirect(`${origin}${next}`, { status: 302 });
  }

  // Default error redirect
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_error`,
    { status: 302 }
  );
}
