/**
 * Authed path prefixes the service worker must never cache (audit D7).
 *
 * This is a privacy boundary, not a perf choice: cached copies of these
 * pages — an admin's dashboard, a driver's stop manifest, a customer's
 * account/orders pages — hold names, addresses, and phone numbers that would
 * outlive logout on a shared device and stay readable to anything that can
 * open Cache Storage.
 *
 * It must be enforced on BOTH request shapes the App Router produces:
 *  - hard navigations (`request.mode === "navigate"`) — handled by the
 *    NavigationRoute denylist in sw.ts;
 *  - soft navigations and Link prefetches, which are RSC FETCHES (`RSC: 1`
 *    header, not navigation requests) — handled by wrapping the
 *    `@serwist/next` defaultCache matchers (`pages-rsc`,
 *    `pages-rsc-prefetch`) with `isAuthedPath` in sw.ts. Missing this half
 *    left the D7 hole open on the DOMINANT path of an installed PWA.
 *
 * Prefix notes:
 *  - `/orders` also covers the public token-share page — it renders a
 *    delivery address, so keeping shared tracking links out of a
 *    device-wide cache is intended.
 *  - `/driver` also covers the public onboard/deactivated pages —
 *    DELIBERATELY: /driver/onboard URLs carry one-time invite tokens, which
 *    must never sit in Cache Storage; /driver/deactivated losing its
 *    offline fallback is a non-cost.
 *  - `/checkout` covers the prefilled-address checkout flow.
 */
export const AUTHED_PATH_PREFIXES: RegExp[] = [
  /^\/admin(\/|$)/,
  /^\/driver(\/|$)/,
  /^\/account(\/|$)/,
  /^\/orders(\/|$)/,
  /^\/checkout(\/|$)/,
];

/** True when a same-origin pathname belongs to the authed/PII surface. */
export function isAuthedPath(pathname: string): boolean {
  return AUTHED_PATH_PREFIXES.some((prefix) => prefix.test(pathname));
}

/**
 * True when the defaultCache wrapper must refuse to cache a same-origin
 * request. Beyond the authed pages, this covers ALL of `/api/` — serwist's
 * defaultCache ships an `apis` NetworkFirst handler that would otherwise
 * cache authed JSON (`/api/account/profile` name+phone, `/api/orders` —
 * the same PII class as the pages) into an unversioned `apis` cache.
 *
 * Blanket-skipping `/api/` here does NOT cost the public menu its offline
 * support: sw.ts registers an explicit `menu-api-cache` handler for
 * `/api/menu` BEFORE the defaultCache spread, and first match wins — this
 * predicate only governs the defaultCache entries behind it.
 */
export function isUncacheablePath(pathname: string): boolean {
  return pathname.startsWith("/api/") || isAuthedPath(pathname);
}
