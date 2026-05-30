/**
 * Auth-redirect recovery.
 *
 * When Supabase cannot match `emailRedirectTo` against the project's allow-list
 * (e.g. NEXT_PUBLIC_APP_URL host ≠ allow-listed host, or the callback URL was
 * never added), it does NOT error — it silently redirects to the project's
 * **Site URL** (the homepage) with the auth params still attached. The user
 * lands on a normal page that never consumes the token, so they appear logged
 * out (and, having possibly switched origin, lose their cart).
 *
 * This detects that "stranded" auth redirect so the client can forward it to
 * the real `/auth/callback` handler (which exchanges the code and routes the
 * user correctly) and alert that the redirect config has drifted.
 *
 * Pure + framework-free so it can be unit-tested without a browser.
 */

const AUTH_ROUTE_PREFIX = "/auth/";

export interface StrandedAuthRedirect {
  /** Same-origin URL to forward to so the normal server handler finishes login. */
  callbackUrl: string;
  /** Why it was flagged — for logging/alerting (never the token itself). */
  reason: "code" | "error";
}

/**
 * Supabase PKCE codes are long, opaque, URL-safe tokens. Requiring length +
 * charset avoids hijacking unrelated `?code=` params (e.g. promo codes).
 */
function isLikelyAuthCode(code: string): boolean {
  return code.length >= 20 && /^[A-Za-z0-9._~-]+$/.test(code);
}

function isSafeNext(next: string | null): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//") && !next.includes("://");
}

/**
 * Detect an auth redirect that was stranded on the Site URL (the site root).
 * Returns the `/auth/callback` URL to forward to, or null when there's nothing
 * to recover.
 *
 * Scoped to the root path because that is where Supabase's Site-URL fallback
 * lands — it deliberately avoids touching `?code=`/`?error=` on other pages,
 * which belong to unrelated app flows.
 */
export function detectStrandedAuthRedirect(
  pathname: string,
  search: string
): StrandedAuthRedirect | null {
  // The dedicated auth routes already handle their own params.
  if (pathname.startsWith(AUTH_ROUTE_PREFIX)) return null;
  // Supabase strands the redirect on the configured Site URL = the site root.
  if (pathname !== "/") return null;

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const error = params.get("error");
  if (error) {
    const out = new URLSearchParams({ error });
    const description = params.get("error_description");
    if (description) out.set("error_description", description);
    return { callbackUrl: `${AUTH_ROUTE_PREFIX}callback?${out.toString()}`, reason: "error" };
  }

  const code = params.get("code");
  if (code && isLikelyAuthCode(code)) {
    const out = new URLSearchParams({ code });
    const next = params.get("next");
    if (isSafeNext(next)) out.set("next", next);
    return { callbackUrl: `${AUTH_ROUTE_PREFIX}callback?${out.toString()}`, reason: "code" };
  }

  return null;
}
