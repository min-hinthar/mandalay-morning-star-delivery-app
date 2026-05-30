"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { detectStrandedAuthRedirect } from "@/lib/auth/recover-auth-landing";

/**
 * Safety net for magic-link / OAuth logins.
 *
 * If Supabase strands an auth redirect on the Site URL (because the callback URL
 * isn't allow-listed or NEXT_PUBLIC_APP_URL drifted), the token lands on the
 * homepage and the user is silently left logged out. This catches that case,
 * forwards the token to the real `/auth/callback` handler so login completes on
 * the same origin (preserving the cart), and alerts Sentry so the misconfig is
 * visible instead of quietly losing customers.
 *
 * Renders nothing. No-ops on every normal page load.
 */
export function AuthLandingRecovery(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stranded = detectStrandedAuthRedirect(window.location.pathname, window.location.search);
    if (!stranded) return;

    // Alert — but never log the token/code itself.
    Sentry.captureMessage(
      "Auth redirect stranded on Site URL; forwarding to /auth/callback. " +
        "Check the Supabase redirect allow-list and NEXT_PUBLIC_APP_URL.",
      {
        level: "warning",
        tags: { area: "auth", flow: "magic-link" },
        extra: { reason: stranded.reason, pathname: window.location.pathname },
      }
    );

    // Same-origin forward to the tested server handler (sets the session cookie
    // here, then routes the user to their dashboard). replace() keeps the
    // token out of history.
    window.location.replace(stranded.callbackUrl);
  }, []);

  return null;
}

export default AuthLandingRecovery;
