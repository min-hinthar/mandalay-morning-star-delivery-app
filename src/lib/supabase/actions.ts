"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export interface ActionResult {
  error?: string;
  success?: string;
}

async function getAppUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function signInWithMagicLink(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/login";

  if (!email) {
    return { error: "Email is required" };
  }

  const rateCheck = checkRateLimit(email, "signIn");
  if (!rateCheck.allowed) {
    return {
      error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const appUrl = await getAppUrl();
  const callbackNext = encodeURIComponent(redirectTo);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${callbackNext}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a magic link to sign in" };
}

export async function resendDriverInvite(inviteId: string): Promise<ActionResult> {
  if (!inviteId) {
    return { error: "Invite ID is required" };
  }

  const serviceSupabase = createServiceClient();

  // Look up the invite to get the email
  const { data: invite, error: inviteError } = await serviceSupabase
    .from("driver_invites")
    .select("email")
    .eq("id", inviteId)
    .single();

  if (inviteError || !invite) {
    return { error: "Invite not found" };
  }

  const rateCheck = checkRateLimit(invite.email, "signIn");
  if (!rateCheck.allowed) {
    return {
      error: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const appUrl = await getAppUrl();
  const next = encodeURIComponent("/driver/onboard");

  // Send OTP with invite-aware redirect so the callback preserves invite context
  const { error } = await serviceSupabase.auth.signInWithOtp({
    email: invite.email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${next}&invite_id=${inviteId}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Update expires_at on the invite record
  await serviceSupabase
    .from("driver_invites")
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .eq("id", inviteId);

  return { success: "A new invite link has been sent to your email" };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
