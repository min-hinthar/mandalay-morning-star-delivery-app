/**
 * Same-origin guard for post-auth redirect targets (`?next=` / `redirectTo`).
 *
 * This was four copy-pasted predicates of the form
 *   path.startsWith("/") && !path.startsWith("//") && !path.includes("://")
 * which is NOT sufficient, because the WHATWG URL parser normalizes more than
 * the obvious protocol-relative form before resolving:
 *
 *   new URL("/\\evil.com",  origin).origin === "https://evil.com"
 *      — for special schemes (http/https) a backslash is an alias for "/", so
 *        "/\evil.com" resolves as "//evil.com".
 *   new URL("/\t/evil.com", origin).origin === "https://evil.com"
 *      — ASCII tab, LF and CR are STRIPPED from the input before parsing, so
 *        "/<TAB>/evil.com" also collapses to "//evil.com".
 *
 * Both slip past the old check and hand an attacker an off-site
 * `router.replace()` the instant a sign-in succeeds — and `?next=` is now the
 * standard customer flow (the middleware attaches it to every unauthenticated
 * /checkout · /cart · /orders · /account hit), so a `?next=` lure is plausible.
 *
 * The character rejections below are the explicit, readable half; the
 * resolve-and-compare is the belt that catches whatever normalization quirk
 * comes next.
 */
export function isSafeRedirect(path: string): boolean {
  if (typeof path !== "string" || path.length === 0) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  // Backslash aliases to "/"; tab/LF/CR are stripped pre-parse. Either can
  // synthesize a protocol-relative "//host" that the checks above miss.
  if (/[\\\t\n\r]/.test(path)) return false;

  // Authoritative check: resolve against a throwaway origin and demand it back.
  try {
    const probe = "https://redirect-guard.invalid";
    return new URL(path, probe).origin === probe;
  } catch {
    return false;
  }
}

export default isSafeRedirect;
