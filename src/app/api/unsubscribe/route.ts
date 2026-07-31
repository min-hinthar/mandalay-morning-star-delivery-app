import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import {
  verifyUnsubscribeToken,
  isUnsubscribeConfigured,
  type UnsubscribablePrefKey,
} from "@/lib/email/unsubscribe";
import { DEFAULT_NOTIFICATION_PREFS } from "@/components/ui/account/SettingsTab/settings-types";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

/**
 * One-click unsubscribe (RFC 8058).
 *
 * POST is the ONLY method that mutates. That split is load-bearing, not
 * stylistic: corporate mail security (Microsoft Safe Links, Proofpoint,
 * Mimecast) and inbox previewers issue a GET to every URL in an email before
 * the reader ever sees it, and each prefetch carries the real per-recipient
 * token from the List-Unsubscribe header. A GET that unsubscribed on load
 * would silently opt customers out sight unseen — which is exactly why RFC
 * 8058 makes one-click POST-only.
 *
 * So: mail providers POST (One-Click, no human involved). A human clicking
 * the link GETs a small confirmation page whose button POSTs back here.
 * Scanners follow GETs; they do not submit forms.
 *
 * Node runtime: the token HMAC uses `node:crypto`.
 */
export const runtime = "nodejs";

const FLOW_ID = "unsubscribe";

const PREF_LABELS: Record<UnsubscribablePrefKey, string> = {
  marketing: "marketing emails",
  order_updates: "order update emails",
  reminders: "reminder emails",
};

/**
 * What the customer keeps after unsubscribing from each key. Per-key on
 * purpose: telling an `order_updates` unsubscriber that "delivery updates are
 * unaffected" would contradict the thing they just did — those ARE the
 * delivery updates. That path is reachable (out_for_delivery / delivered /
 * arriving_soon / cancellation are non-mandatory and advertise one-click keyed
 * to order_updates).
 */
const PREF_KEEPS: Record<UnsubscribablePrefKey, string> = {
  marketing: "Order confirmations and delivery updates for orders you place are unaffected.",
  order_updates:
    "You will still receive order confirmations and refund receipts, which we send for every order.",
  reminders: "Order confirmations and delivery updates for orders you place are unaffected.",
};

/**
 * Turn one preference off.
 *
 * Uses the SERVICE client: there is no session here by design (a mail provider
 * POSTs this with no cookies), so RLS has no user to scope to. The token is the
 * only authority, which is why it is verified before we get here and why it
 * carries the userId rather than trusting anything in the request.
 *
 * Idempotent: unsubscribing twice is a no-op, and an already-unsubscribed user
 * is a success, not an error.
 */
async function applyUnsubscribe(
  userId: string,
  prefKey: UnsubscribablePrefKey
): Promise<{ ok: boolean }> {
  const supabase = createServiceClient();

  const { data: existing, error: readError } = await supabase
    .from("customer_settings")
    .select("notification_prefs")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    logger.error("Unsubscribe could not read customer settings", {
      flowId: FLOW_ID,
      userId,
      dbError: readError.message,
      dbErrorCode: readError.code,
    });
    return { ok: false };
  }

  // No row yet means the customer is on defaults (opted IN — see the consent
  // model note on the tracking issue). Write a full defaults row with this one
  // key flipped off, rather than a partial one, so the other prefs keep their
  // documented values instead of becoming undefined.
  const current = (existing?.notification_prefs as unknown as NotificationPrefs | null) ?? null;
  const nextPrefs: NotificationPrefs = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(current ?? {}),
    [prefKey]: false,
  };

  const { error: writeError } = await supabase.from("customer_settings").upsert(
    {
      user_id: userId,
      notification_prefs: nextPrefs as unknown as Record<string, boolean>,
    },
    { onConflict: "user_id" }
  );

  if (writeError) {
    logger.error("Unsubscribe could not write customer settings", {
      flowId: FLOW_ID,
      userId,
      prefKey,
      dbError: writeError.message,
      dbErrorCode: writeError.code,
    });
    return { ok: false };
  }

  logger.info("Customer unsubscribed via one-click link", { flowId: FLOW_ID, userId, prefKey });
  return { ok: true };
}

interface ParsedPostBody {
  token: string | null;
  /** True when the POST came from OUR confirmation form, not a mail provider. */
  fromConfirmForm: boolean;
}

/**
 * Pull the token from the query string OR the form body.
 *
 * Providers send the URL exactly as given in `List-Unsubscribe`, so the token
 * normally rides the query string and the body is just
 * `List-Unsubscribe=One-Click`. Reading the body too costs nothing, covers a
 * provider that relocates it — and is how our own confirmation form submits.
 */
async function parsePostBody(request: Request): Promise<ParsedPostBody> {
  const fromQuery = new URL(request.url).searchParams.get("token");

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return { token: fromQuery, fromConfirmForm: false };
  }

  try {
    const body = new URLSearchParams(await request.text());
    return {
      token: fromQuery ?? body.get("token"),
      fromConfirmForm: body.get("confirm") === "1",
    };
  } catch {
    return { token: fromQuery, fromConfirmForm: false };
  }
}

export async function POST(request: Request) {
  if (!isUnsubscribeConfigured()) {
    // Should be unreachable: with no secret the header is never advertised, so
    // no provider has a URL to POST. Log it — it means a message went out
    // promising one-click while the secret was missing or has since been
    // rotated away, and every reader who clicks is being silently ignored.
    logger.error("One-click unsubscribe POSTed but UNSUBSCRIBE_TOKEN_SECRET is not set", {
      flowId: FLOW_ID,
    });
    return NextResponse.json({ error: "Unsubscribe is not available" }, { status: 503 });
  }

  const { token, fromConfirmForm } = await parsePostBody(request);
  const verified = token ? verifyUnsubscribeToken(token) : null;

  if (!verified) {
    // One response for missing, malformed, and badly-signed alike — telling
    // them apart would make this an oracle for anyone probing tokens.
    logger.warn("Rejected an unsubscribe request with an invalid token", { flowId: FLOW_ID });
    if (fromConfirmForm) {
      return confirmationPage(
        "That link isn't valid",
        'This unsubscribe link is missing or incorrect. You can change your email preferences any time in <a href="/account?tab=settings">your account settings</a>.',
        400
      );
    }
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  }

  const { ok } = await applyUnsubscribe(verified.userId, verified.prefKey);
  if (!ok) {
    if (fromConfirmForm) {
      return confirmationPage(
        "Something went wrong",
        'We could not update your preferences just now. Please try again, or change them in <a href="/account?tab=settings">your account settings</a>.',
        500
      );
    }
    // 500 so the provider retries — silently 200ing a failed write would leave
    // the customer subscribed while their mail client says they're not.
    return NextResponse.json({ error: "Could not update preferences" }, { status: 500 });
  }

  // A human's form submit gets the human-readable outcome; a provider's
  // machine POST gets JSON.
  if (fromConfirmForm) {
    return confirmationPage(
      "You're unsubscribed",
      `You will no longer receive ${escapeHtml(PREF_LABELS[verified.prefKey])} from Mandalay Morning Star. ${escapeHtml(PREF_KEEPS[verified.prefKey])} Changed your mind? Re-subscribe any time in <a href="/account?tab=settings">your account settings</a>.`,
      200
    );
  }

  return NextResponse.json({ success: true });
}

/**
 * Tiny self-contained page rather than a redirect into the app: the reader is
 * unauthenticated and may be in a mail client's in-app browser, and bouncing
 * them to a login wall is precisely the friction that makes people hit "spam"
 * instead.
 *
 * INVARIANT: `message` and `formHtml` are interpolated as RAW HTML so callers
 * can include the settings link and the confirm form — every caller MUST
 * pre-escape any dynamic content inside them (see the `escapeHtml(...)` at
 * each call site). Only `title` is escaped here. Interpolating unescaped
 * request data into `message` would be reflected XSS on an unauthenticated
 * endpoint.
 */
function confirmationPage(title: string, message: string, status: number, formHtml = "") {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0; min-height: 100vh; display: grid; place-items: center;
        background: #faf9f7; color: #141413; padding: 24px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      .card {
        max-width: 30rem; width: 100%; background: #fff; border: 1px solid #e8e5e0;
        border-radius: 16px; padding: 32px; text-align: center;
        box-shadow: 0 1px 2px rgba(20,20,19,.04), 0 12px 32px -12px rgba(20,20,19,.12);
      }
      h1 { margin: 0 0 12px; font-size: 1.375rem; line-height: 1.3; }
      p { margin: 0; color: #5c5a55; line-height: 1.6; }
      a { color: #9a3412; }
      button {
        margin-top: 20px; padding: 12px 28px; font-size: 1rem; font-weight: 600;
        color: #fff; background: #9a3412; border: none; border-radius: 999px;
        cursor: pointer; min-height: 44px;
      }
      button:hover { background: #7c2d12; }
      @media (prefers-color-scheme: dark) {
        body { background: #141413; color: #f5f4f2; }
        .card { background: #1f1e1d; border-color: #34322e; }
        p { color: #a8a5a1; }
        a { color: #d97757; }
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>${message}</p>
      ${formHtml}
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * GET NEVER MUTATES — it renders a confirm page whose button POSTs back here.
 *
 * Link scanners GET every URL in an email before the reader sees it, carrying
 * the real token. If this handler unsubscribed on load, corporate recipients
 * would be opted out by their own mail security without ever clicking —
 * including killing order updates mid-delivery. Scanners follow GETs; they do
 * not submit forms. (The POST from the form is idempotent, so a double-submit
 * is harmless.)
 */
export async function GET(request: Request) {
  if (!isUnsubscribeConfigured()) {
    return confirmationPage(
      "Unsubscribe unavailable",
      'Sorry — we could not process that right now. You can change your email preferences any time in <a href="/account?tab=settings">your account settings</a>.',
      503
    );
  }

  const token = new URL(request.url).searchParams.get("token");
  const verified = token ? verifyUnsubscribeToken(token) : null;

  if (!verified) {
    return confirmationPage(
      "That link isn't valid",
      'This unsubscribe link is missing or incorrect. You can change your email preferences any time in <a href="/account?tab=settings">your account settings</a>.',
      400
    );
  }

  // Valid token, NO mutation. Echo the token only as an attribute-escaped
  // hidden field; `confirm=1` is what lets POST tell this form apart from a
  // provider's machine POST and answer with HTML instead of JSON.
  const form = `<form method="post" action="/api/unsubscribe">
        <input type="hidden" name="token" value="${escapeHtml(token!)}" />
        <input type="hidden" name="confirm" value="1" />
        <button type="submit">Yes, unsubscribe me</button>
      </form>`;

  return confirmationPage(
    "Confirm unsubscribe",
    `This will stop ${escapeHtml(PREF_LABELS[verified.prefKey])} from Mandalay Morning Star for your account. ${escapeHtml(PREF_KEEPS[verified.prefKey])}`,
    200,
    form
  );
}
