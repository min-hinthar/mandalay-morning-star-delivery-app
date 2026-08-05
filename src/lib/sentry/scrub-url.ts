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

// Hash-borne secrets: the app's PKCE flow keeps tokens out of fragments
// today, but Supabase's implicit flow (and OAuth generally) delivers
// `#access_token=…&refresh_token=…` — scrub the fragment defensively so a
// future flow change can't reintroduce the leak.
const HASH_SENSITIVE_PARAMS = [...SENSITIVE_QUERY_PARAMS, "access_token", "refresh_token"];

/**
 * Sentry http.client span descriptions are "METHOD url" — scrub only the
 * url token, or the whole string parses as a relative path and mangles
 * ("GET /x?token=…" → "/GET%20/x?token=[redacted]"). Descriptions that are
 * a bare URL (navigation spans) or prose (multi-word) pass to scrubUrl
 * directly, which returns them unchanged unless a secret actually matches.
 */
export function scrubSpanDescription(description: string): string {
  const m = /^(\S+)\s+(\S+)$/.exec(description);
  return m ? `${m[1]} ${scrubUrl(m[2])}` : scrubUrl(description);
}

/**
 * Console breadcrumbs carry free text (`console.error("failed", url)` —
 * and removeConsole keeps error/warn in prod). Scrub URL-shaped tokens
 * word-wise so a token-bearing URL mid-sentence redacts without mangling
 * the surrounding prose (whole-message scrubUrl would percent-encode it).
 */
export function scrubConsoleMessage(message: string): string {
  return message.replace(/\S+/g, (token) => {
    // Peel sentence punctuation off the token edges ("…/share," would
    // otherwise defeat SHARE_PATH_RE's $ anchor) and re-attach after.
    const m = /^([("'[]*)(.*?)([.,;:!?)"']*)$/.exec(token);
    if (!m) return token;
    const [, lead, core, trail] = m;
    if (!core.includes("/") && !core.includes("?")) return token;
    return lead + scrubUrl(core) + trail;
  });
}

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
    if (url.hash.length > 1) {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      let hashChanged = false;
      for (const param of HASH_SENSITIVE_PARAMS) {
        if (hashParams.has(param)) {
          hashParams.set(param, "[redacted]");
          hashChanged = true;
        }
      }
      if (hashChanged) {
        url.hash = `#${hashParams.toString()}`;
        changed = true;
      }
    }
    if (!changed) return rawUrl;
    return isAbsolute ? url.toString() : url.pathname + url.search + url.hash;
  } catch {
    // INTENTIONALLY fail-open: `new URL` almost never throws for real
    // navigation/fetch URLs, truly malformed input rarely carries a clean
    // secret param, and failing closed would drop legit telemetry. Pinned
    // by the "fails open on unparseable input" test — don't "fix" this
    // into returning a placeholder.
    return rawUrl;
  }
}
