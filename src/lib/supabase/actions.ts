"use server";

import React from "react";
import { render } from "@react-email/render";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkServerActionRateLimit, authSignInLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { MagicLinkLogin } from "@/emails/MagicLinkLogin";
import { getRoleDashboard } from "@/lib/auth/role-redirect";

export interface ActionResult {
  error?: string;
  success?: string;
}

function stripWww(url: string): string {
  return url.replace(/^(https?:\/\/)www\./i, "$1");
}

/** Safe internal redirect path (no open-redirect / off-site jumps). */
function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

/**
 * Auth redirect URLs are normalized to the canonical apex host (no www, no
 * trailing slash). If NEXT_PUBLIC_APP_URL isn't already canonical, the
 * normalized host MUST be the one allow-listed in Supabase — otherwise magic
 * links silently fall back to the Site URL. Surface that drift in logs.
 */
function warnIfAppUrlNotCanonical(envUrl: string): void {
  const issues: string[] = [];
  if (/^https?:\/\/www\./i.test(envUrl)) issues.push("www-host");
  if (/\/$/.test(envUrl)) issues.push("trailing-slash");
  try {
    new URL(envUrl);
  } catch {
    issues.push("invalid-url");
  }
  if (issues.length > 0) {
    logger.warn(
      "NEXT_PUBLIC_APP_URL is not canonical; auth redirects use the normalized apex host. " +
        "Ensure the Supabase redirect allow-list matches it or magic links fall back to the Site URL.",
      { flowId: "auth", api: "auth/app-url", issues }
    );
  }
}

/**
 * On Vercel Preview deployments the canonical NEXT_PUBLIC_APP_URL points at
 * production — so an auth link built from it would send the user to prod
 * instead of back to the preview they're testing. Resolve THIS preview's own
 * origin instead.
 *
 * Precedence is security-ordered: prefer Vercel's server-set, client-unforgeable
 * URLs (VERCEL_BRANCH_URL — the stable branch alias testers browse — then
 * VERCEL_URL), and only fall back to the request host (bounded to *.vercel.app)
 * if neither is present. The header carries a sign-in token URL, so we never
 * trust it ahead of the env. The *.vercel.app bound still permits any Vercel
 * app, so the Supabase redirect allow-list must be per-deployment, not a bare
 * *.vercel.app wildcard.
 */
async function getPreviewOrigin(): Promise<string | null> {
  const stripProto = (u: string) => u.replace(/^https?:\/\//, "");
  if (process.env.VERCEL_BRANCH_URL) return `https://${stripProto(process.env.VERCEL_BRANCH_URL)}`;
  if (process.env.VERCEL_URL) return `https://${stripProto(process.env.VERCEL_URL)}`;

  const headerList = await headers();
  const fwdHost = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (fwdHost && /(^|\.)vercel\.app$/i.test(fwdHost)) {
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    return `${proto}://${fwdHost.replace(/^www\./i, "")}`;
  }
  return null;
}

export async function getAppUrl(): Promise<string> {
  // Vercel Preview: prefer the preview's own origin (NEXT_PUBLIC_APP_URL is the
  // production host, which would bounce magic links off the preview). Prod and
  // local dev keep using the canonical configured URL unchanged.
  if (process.env.VERCEL_ENV === "preview") {
    const previewUrl = await getPreviewOrigin();
    if (previewUrl) return previewUrl;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    warnIfAppUrlNotCanonical(envUrl);
    return stripWww(envUrl.replace(/\/$/, ""));
  }

  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return stripWww(origin);
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    const normalizedHost = host.replace(/^www\./i, "");
    return `${proto}://${normalizedHost}`;
  }

  return "http://localhost:3000";
}

export async function signInWithMagicLink(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const redirectTo = (formData.get("redirectTo") as string) || "/menu";

  if (!email) {
    return { error: "Email is required" };
  }

  const rateCheck = await checkServerActionRateLimit({
    limiter: authSignInLimiter,
    identifier: email.toLowerCase(),
    role: "anon",
    route: "auth/signIn",
  });
  if (rateCheck.limited) {
    return {
      error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const appUrl = await getAppUrl();

  // Generate the magic link with the admin API and deliver it ourselves via
  // our own /auth/confirm route (token_hash + verifyOtp). Unlike signInWithOtp,
  // the link is fully app-controlled — it can't silently fall back to the
  // Supabase Site URL — and it verifies cross-browser (no PKCE verifier cookie
  // tied to the device that requested it).
  const serviceClient = createServiceClient();
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    logger.exception(linkError ?? new Error("generateLink returned no hashed_token"), {
      flowId: "auth",
      api: "auth/magic-link",
    });
    return { error: "We couldn't send your sign-in link. Please try again." };
  }

  const confirmUrl = new URL(`${appUrl}/auth/confirm`);
  confirmUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
  confirmUrl.searchParams.set("type", "magiclink");
  if (isSafeRedirect(redirectTo)) {
    confirmUrl.searchParams.set("next", redirectTo);
  }

  try {
    const emailComponent = React.createElement(MagicLinkLogin, {
      email,
      magicLink: confirmUrl.toString(),
      // One-time code so the customer can finish signing in WITHOUT leaving
      // their tab (preserves their cart). generateLink returns this alongside
      // the hashed token.
      code: linkData.properties.email_otp,
      expiresIn: "1 hour",
    });
    const [html, text] = await Promise.all([
      render(emailComponent),
      render(emailComponent, { plainText: true }),
    ]);

    await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: EMAIL_REPLY_TO,
      subject: "Your sign-in link for Mandalay Morning Star",
      html,
      text,
    });
  } catch (sendError) {
    logger.exception(sendError, { flowId: "auth", api: "auth/magic-link" });
    return { error: "We couldn't send your sign-in link. Please try again." };
  }

  return { success: "Check your email for a magic link to sign in" };
}

export interface VerifyOtpResult extends ActionResult {
  /** Where the client should navigate after a successful verification. */
  redirectPath?: string;
}

/**
 * Verify the one-time code from the sign-in email. Lets the customer finish
 * logging in WITHOUT clicking the link / leaving their tab — so their cart
 * (per-origin IndexedDB) is never lost to a mail-app browser switch.
 *
 * Length is not hard-coded: Supabase's email OTP length is a project setting
 * (commonly 6, sometimes 8). We sanity-check digits only and let verifyOtp be
 * the authority on correctness.
 */
export async function verifyEmailOtp(formData: FormData): Promise<VerifyOtpResult> {
  const email = (formData.get("email") as string)?.trim();
  const code = (formData.get("code") as string)?.replace(/\D/g, "");
  const redirectTo = (formData.get("redirectTo") as string) || "/menu";

  if (!email || !code) {
    return { error: "Enter the code from your email." };
  }
  if (code.length < 4 || code.length > 12) {
    return { error: "That code doesn't look right — check your email and try again." };
  }

  const rateCheck = await checkServerActionRateLimit({
    limiter: authSignInLimiter,
    identifier: email.toLowerCase(),
    role: "anon",
    route: "auth/verifyOtp",
  });
  if (rateCheck.limited) {
    return {
      error: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });

  if (error || !data.session) {
    return { error: "That code is invalid or expired. Request a new one and try again." };
  }

  // Session cookie is now set. Resolve where this user should land.
  const roleResult = await getRoleDashboard(
    createServiceClient(),
    data.session.user.id,
    data.session.user.email ?? email
  );

  const redirectPath =
    redirectTo !== "/menu" && redirectTo !== "/login" && isSafeRedirect(redirectTo)
      ? redirectTo
      : roleResult.path;

  return { success: "Signed in", redirectPath };
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

  const rateCheck = await checkServerActionRateLimit({
    limiter: authSignInLimiter,
    identifier: invite.email.toLowerCase(),
    role: "anon",
    route: "auth/resendInvite",
  });
  if (rateCheck.limited) {
    return {
      error: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    };
  }

  const appUrl = await getAppUrl();
  const next = encodeURIComponent("/driver/onboard");

  // Use anon-key client for OTP — service role suppresses Supabase email delivery
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
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
