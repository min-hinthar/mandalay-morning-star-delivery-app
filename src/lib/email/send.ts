import { render } from "@react-email/render";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

import { getResendClient } from "./client";
import {
  APP_URL,
  EMAIL_CC,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
} from "./constants";
import {
  UNLOGGED_EMAIL_TYPES,
  MANDATORY_EMAIL_TYPES,
  mapTypeToPrefKey,
  type EmailType,
  type CustomerEmailType,
  type SendEmailOptions,
  type SendEmailResult,
} from "./types";

// ===========================================
// SEND EMAIL
// ===========================================

/** `orders.id` is a uuid — non-order email passes a synthetic handle instead. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Types that must NOT copy the admin inbox.
 *
 * Every other send CCs admin@ so the team sees transactional mail as it goes
 * out — reasonable at one-email-per-order volume. It breaks down for a BULK
 * marketing run: the admin inbox takes one CC per recipient (a whole cron run
 * at once), and, worse, each customer sees an internal address sitting in the
 * CC header of a promotional email — which invites reply-all and reads as
 * unprofessional. Marketing gets no CC; the run summary is the operator signal.
 */
const NO_CC_EMAIL_TYPES: readonly EmailType[] = ["route_day_invite"];

/**
 * Sends an email through Resend with:
 * 1. Admin kill switch check
 * 2. User notification preference check
 * 3. React-to-HTML rendering
 * 4. Retry with exponential backoff
 * 5. Notification log insert
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const supabase = createServiceClient();
  const flowId = "email";

  // -----------------------------------------------
  // Step 1: Admin kill switch
  // -----------------------------------------------
  try {
    const { data: killSwitch } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "email_sending_enabled")
      .single();

    if (killSwitch?.value === false) {
      logger.info("Email sending disabled by admin kill switch", {
        flowId,
        orderId: options.orderId,
        userId: options.userId,
      });
      return { success: true, suppressed: true };
    }
  } catch {
    // If we can't read the setting, continue sending (fail open)
    logger.warn("Could not read email kill switch, proceeding", {
      flowId,
    });
  }

  // -----------------------------------------------
  // Step 2: User notification preference check
  // -----------------------------------------------
  const isMandatory =
    options.mandatory || (MANDATORY_EMAIL_TYPES as readonly string[]).includes(options.type);

  if (!isMandatory) {
    try {
      const { data: settings } = await supabase
        .from("customer_settings")
        .select("notification_prefs")
        .eq("user_id", options.userId)
        .single();

      // If no record exists, treat as all opted-in (new customer default)
      if (settings?.notification_prefs) {
        const prefs = settings.notification_prefs as unknown as NotificationPrefs;
        const prefKey = mapTypeToPrefKey(options.type);

        if (prefs[prefKey] === false) {
          logger.info("Email skipped: user preference opt-out", {
            flowId,
            userId: options.userId,
            orderId: options.orderId,
          });
          return { success: true, suppressed: true };
        }
      }
    } catch {
      // No customer_settings row = new customer = all opted-in
    }
  }

  // -----------------------------------------------
  // Step 3: Render React element to HTML + plain text
  // -----------------------------------------------
  let html: string;
  let text: string;
  try {
    html = await render(options.react);
    text = await render(options.react, { plainText: true });
  } catch (err) {
    logger.error("Email render failed", {
      flowId,
      orderId: options.orderId,
      userId: options.userId,
    });
    logger.exception(err, { flowId, orderId: options.orderId });
    return { success: false, error: "Email render failed" };
  }

  // -----------------------------------------------
  // Step 4: Send via Resend with retry
  // -----------------------------------------------
  const resend = getResendClient();
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend.emails.send(
        {
          from: EMAIL_FROM,
          to: options.to,
          cc: NO_CC_EMAIL_TYPES.includes(options.type) ? undefined : EMAIL_CC,
          replyTo: EMAIL_REPLY_TO,
          subject: options.subject,
          html,
          text,
          tags: [
            { name: "type", value: options.type },
            { name: "order_id", value: options.orderId },
          ],
          headers: {
            // RFC 2369 link only. `List-Unsubscribe-Post: One-Click` (RFC 8058)
            // is deliberately NOT set: it promises the mail client that a plain
            // POST to this URL unsubscribes the reader, but the URL is an
            // authenticated settings PAGE with no POST handler — so a one-click
            // unsubscribe would appear to succeed in the client and change
            // nothing, which is worse than not offering it. Restore the header
            // together with a real signed-token endpoint (see the tracking
            // issue) before this is claimed again.
            "List-Unsubscribe": `<${APP_URL}/account?tab=settings>`,
          },
        },
        // MUST be the second argument. Resend reads the dedupe key from the
        // request OPTIONS and sets it as the HTTP `Idempotency-Key` header
        // (`post(path, entity, { idempotencyKey })`). Passing it as a custom
        // header inside the email PAYLOAD — which is what this did — makes it a
        // header on the outgoing message and Resend never dedupes: every retry,
        // re-run, or duplicate cron invocation sends a fresh copy. That silently
        // defeated the stable keys the order-status emails and the route-day
        // invite both rely on for at-most-once delivery.
        options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
      );

      if (error) {
        // EXACTLY one of Resend's three idempotency errors means the mail went
        // out. Matching them loosely would report success for sends that never
        // happened:
        //   invalid_idempotent_request  — key reused with a DIFFERENT body, so
        //       the first request succeeded. Retrying can never win (the key is
        //       spent) and failing here would flag a good order needs_contact.
        //   invalid_idempotency_key     — the key itself is malformed. NOTHING
        //       was sent; must fail loudly.
        //   concurrent_idempotent_requests — a same-key request is in flight and
        //       may yet fail. Must retry, not assume the other one delivered.
        // The latter two fall through to the normal retry/failure path below.
        if (error.name === "invalid_idempotent_request") {
          logger.info("Email already sent for this idempotency key — treating as delivered", {
            flowId,
            orderId: options.orderId,
            userId: options.userId,
          });
          return { success: true, suppressed: true };
        }

        lastError = error.message;
        logger.warn(`Email send attempt ${attempt} failed`, {
          flowId,
          orderId: options.orderId,
        });

        if (attempt < MAX_RETRY_ATTEMPTS) {
          await sleep(attempt * RETRY_BASE_DELAY_MS);
          continue;
        }
        break;
      }

      // -----------------------------------------------
      // Step 5: Success — log to notification_logs (logged types only)
      // -----------------------------------------------
      const resendId = data?.id;
      const isUnlogged = (UNLOGGED_EMAIL_TYPES as readonly string[]).includes(options.type);

      // A dedupe REPLAY returns the original send's id, so two callers sharing
      // a key (the Stripe webhook and verify-payment both send
      // `order-confirmation-<orderId>`) would each insert a row carrying the
      // SAME resend_id. The Resend status webhook looks that id up with
      // `.single()`, which errors on duplicates — silently stopping
      // delivery/bounce/complaint tracking for those orders. Only the first
      // caller logs. Now that the idempotency key is actually honoured this is
      // reachable on every Stripe order, not a theoretical race.
      let alreadyLogged = false;
      if (!isUnlogged && resendId) {
        const { data: existingLog } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("resend_id", resendId)
          .maybeSingle();
        alreadyLogged = existingLog != null;
      }

      if (!isUnlogged && !alreadyLogged) {
        await supabase.from("notification_logs").insert({
          order_id: options.orderId,
          user_id: options.userId,
          notification_type: options.type as CustomerEmailType,
          channel: "email",
          recipient: options.to,
          subject: options.subject,
          resend_id: resendId ?? null,
          status: "sent",
          retry_count: attempt,
          sent_at: new Date().toISOString(),
        });
      }

      logger.info("Email sent successfully", {
        flowId,
        orderId: options.orderId,
        userId: options.userId,
      });

      return { success: true, resendId: resendId ?? undefined };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown send error";
      logger.warn(`Email send attempt ${attempt} threw`, {
        flowId,
        orderId: options.orderId,
      });

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await sleep(attempt * RETRY_BASE_DELAY_MS);
      }
    }
  }

  // -----------------------------------------------
  // Step 6: All retries exhausted — log failure (logged types only)
  // -----------------------------------------------
  const isUnloggedFailed = (UNLOGGED_EMAIL_TYPES as readonly string[]).includes(options.type);
  if (!isUnloggedFailed) {
    await supabase.from("notification_logs").insert({
      order_id: options.orderId,
      user_id: options.userId,
      notification_type: options.type as CustomerEmailType,
      channel: "email",
      recipient: options.to,
      subject: options.subject,
      status: "failed",
      retry_count: MAX_RETRY_ATTEMPTS,
      error_message: lastError ?? "Unknown error after retries",
    });
  }

  logger.error("Email send failed after all retries", {
    flowId,
    orderId: options.orderId,
    userId: options.userId,
  });

  // -----------------------------------------------
  // Step 7: Flag order for manual customer contact
  // -----------------------------------------------
  // Only meaningful for order-scoped mail. Non-order email (e.g. the route-day
  // invite, which passes a synthetic `route-<date>` handle) would make Postgres
  // reject `id=eq.<non-uuid>` with 22P02 on EVERY failed send — swallowed, but
  // it logs an exception that masquerades as a real order-flagging failure.
  if (!UUID_RE.test(options.orderId)) {
    return { success: false, error: lastError };
  }

  try {
    // needs_contact column added in migration 030 — not in generated types yet
    await (supabase
      .from("orders")
      .update({ needs_contact: true } as Record<string, unknown>)
      .eq("id", options.orderId) as unknown as Promise<unknown>);

    logger.warn("Order flagged for manual contact after email failure", {
      flowId,
      orderId: options.orderId,
      userId: options.userId,
    });
  } catch (flagErr) {
    // Non-blocking — email failure is already logged
    logger.error("Failed to flag order for manual contact", {
      flowId,
      orderId: options.orderId,
    });
    logger.exception(flagErr, { flowId, orderId: options.orderId });
  }

  return { success: false, error: lastError };
}

// ===========================================
// HELPERS
// ===========================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
