/**
 * Secret-bearing query params that must never reach Sentry (audit D10):
 * - token: share-tracking links (?token=) on /api/tracking
 * - token_hash: Supabase auth links (/auth/confirm?token_hash=) — driver
 *   onboarding invites, magic-link login, email confirms
 * - code: OAuth authorization codes + promo codes
 * - share_token: defensive only — the live share secret travels in the PATH
 *   (/orders/<share_token>/share), which scrubUrl also redacts below
 */
export const SENSITIVE_QUERY_PARAMS = ["token", "token_hash", "share_token", "code"];

// Share links carry the secret as a path segment, not a query param.
const SHARE_PATH_RE = /^(\/orders\/)[^/]+(\/share)$/;

export function scrubUrl(rawUrl: string): string {
  try {
    // Relative URLs resolve against a throwaway origin; strip it back off.
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(rawUrl);
    const url = new URL(rawUrl, "https://relative.invalid");
    let changed = false;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, "[redacted]");
        changed = true;
      }
    }
    if (SHARE_PATH_RE.test(url.pathname)) {
      url.pathname = url.pathname.replace(SHARE_PATH_RE, "$1[redacted]$2");
      changed = true;
    }
    if (!changed) return rawUrl;
    return isAbsolute ? url.toString() : url.pathname + url.search + url.hash;
  } catch {
    return rawUrl;
  }
}
