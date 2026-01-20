import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth callback handler for Supabase Auth
 *
 * IMPORTANT: If you're seeing 303 errors on auth callback:
 * 1. Set NEXT_PUBLIC_APP_URL in your production environment (Vercel)
 * 2. Add your production callback URL to Supabase Dashboard:
 *    Authentication > URL Configuration > Redirect URLs
 *    Add: https://your-domain.vercel.app/auth/callback
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Use 302 Found for successful auth redirect
      return NextResponse.redirect(`${origin}${next}`, { status: 302 });
    }

    console.error("[Auth Callback] Code exchange error:", error.message);
  }

  // Default error redirect with 302 status
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_error`,
    { status: 302 }
  );
}
