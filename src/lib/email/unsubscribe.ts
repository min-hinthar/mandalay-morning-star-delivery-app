import { createHmac, timingSafeEqual } from "node:crypto";

import { APP_URL } from "./constants";

/**
 * Signed one-click unsubscribe tokens (RFC 8058).
 *
 * Every outbound email used to set BOTH `List-Unsubscribe` and
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. The second header tells
 * the mail client it can unsubscribe the reader with a plain unauthenticated
 * POST — but the URL was an authenticated settings PAGE with no POST handler
 * anywhere. A reader who used Gmail's built-in unsubscribe got a success
 * indication while `notification_prefs.marketing` was never touched, and stayed
 * targetable by the marketing cron. #205 dropped the header as an interim fix;
 * this module is what earns it back.
 *
 * Token design, and why each part is the way it is:
 *
 *   `<userId>.<prefKey>.<signature>`
 *
 * - NO EXPIRY. Unsubscribe links live in inboxes forever; a token that stops
 *   working turns a working unsubscribe into a dead one years later, which is
 *   the exact failure this replaces.
 * - Signed, so it cannot be forged or enumerated. The userId is visible but not
 *   secret; without the HMAC it is useless, and guessing a signature is the
 *   whole problem HMAC solves.
 * - Scoped to ONE preference key, checked against a fixed allow-list. A token
 *   authorizes exactly one thing: turning that pref off. It is not a session,
 *   it cannot read anything, and it cannot turn a pref back ON — re-subscribing
 *   requires an authenticated settings visit, so an intercepted link can't be
 *   used to quietly re-enable mail the customer stopped.
 */

/**
 * Keys a token may target. Constraining this matters: the pref key is written
 * into a JSONB column, so an unconstrained value would let a forged (or simply
 * malformed) token write arbitrary keys into notification_prefs.
 */
export const UNSUBSCRIBABLE_PREF_KEYS = ["marketing", "order_updates", "reminders"] as const;

export type UnsubscribablePrefKey = (typeof UNSUBSCRIBABLE_PREF_KEYS)[number];

export function isUnsubscribablePrefKey(value: string): value is UnsubscribablePrefKey {
  return (UNSUBSCRIBABLE_PREF_KEYS as readonly string[]).includes(value);
}

/**
 * Returns the signing secret, or null when it isn't configured.
 *
 * Null is a real, expected state — not an error to throw on. It means the
 * feature is dormant: no one-click header is advertised and the endpoint
 * refuses everything. Failing CLOSED here is the whole point, since the
 * alternative (a predictable fallback secret) would make every token forgeable.
 */
function getSecret(): string | null {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

/** True when tokens can be minted and verified at all. */
export function isUnsubscribeConfigured(): boolean {
  return getSecret() !== null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Mint a token for one user + one preference key.
 *
 * Returns "" (empty string, falsy) when no secret is configured — NOT null.
 * Every caller guards with `if (!token)`, and the URL/header builders treat it
 * as "don't advertise one-click for this message".
 */
export function createUnsubscribeToken(userId: string, prefKey: UnsubscribablePrefKey): string {
  const secret = getSecret();
  if (!secret) return "";
  // `.` separates the fields, so neither field may contain one. userId is a
  // uuid and prefKey comes from the allow-list, so neither can today — this
  // guards a future key with a dot in it from silently shifting the parse.
  const payload = `${userId}:${prefKey}`;
  return `${userId}.${prefKey}.${sign(payload, secret)}`;
}

export interface VerifiedUnsubscribeToken {
  userId: string;
  prefKey: UnsubscribablePrefKey;
}

/**
 * Verify a token. Returns null for anything that isn't a valid, well-formed,
 * correctly-signed token for an allowed pref key.
 *
 * A single null for every failure mode is deliberate: distinguishing "bad
 * signature" from "unknown user" in the response would turn this endpoint into
 * an account-existence oracle for anyone who can POST to it.
 */
export function verifyUnsubscribeToken(token: string): VerifiedUnsubscribeToken | null {
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, prefKey, signature] = parts;
  if (!userId || !prefKey || !signature) return null;
  if (!isUnsubscribablePrefKey(prefKey)) return null;

  const expected = sign(`${userId}:${prefKey}`, secret);

  // timingSafeEqual throws on length mismatch, so compare lengths first — and
  // do it on the raw strings, since a length difference is not secret.
  if (expected.length !== signature.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  } catch {
    return null;
  }

  return { userId, prefKey };
}

/**
 * Per-recipient unsubscribe URL, or null when unconfigured.
 *
 * Null is what tells the sender not to promise one-click for this message.
 */
export function buildUnsubscribeUrl(userId: string, prefKey: UnsubscribablePrefKey): string | null {
  if (!isUnsubscribeConfigured()) return null;
  const token = createUnsubscribeToken(userId, prefKey);
  if (!token) return null;
  return `${APP_URL}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * The `List-Unsubscribe` / `List-Unsubscribe-Post` header pair for a message.
 *
 * These two must move TOGETHER. `List-Unsubscribe-Post` is a promise that a
 * bare POST to the URL unsubscribes the reader; setting it alongside a URL that
 * can't honor it is what broke before. So when there's no token to build (no
 * secret configured, or no real recipient), this falls back to the RFC 2369
 * link only — honest, just not one-click.
 */
export function buildUnsubscribeHeaders(
  userId: string | null | undefined,
  prefKey: UnsubscribablePrefKey
): Record<string, string> {
  const url = userId ? buildUnsubscribeUrl(userId, prefKey) : null;

  if (!url) {
    return { "List-Unsubscribe": `<${APP_URL}/account?tab=settings>` };
  }

  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
