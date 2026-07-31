import { render } from "@react-email/render";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

import { getResendClient } from "./client";
import { buildUnsubscribeHeaders } from "./unsubscribe";
import {
  APP_URL,
  EMAIL_CC,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  SEND_ATTEMPT_TIMEOUT_MS,
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
  const attemptTimeoutMs = options.attemptTimeoutMs ?? SEND_ATTEMPT_TIMEOUT_MS;

  // One-click is offered ONLY for mail the recipient can actually stop.
  //
  // A MANDATORY type (order confirmation, refund) bypasses the preference
  // check entirely, so a one-click unsubscribe on it would report success and
  // keep sending — the same broken promise this feature exists to fix, just
  // relocated. Those messages keep the plain settings link, which is honest:
  // the customer can manage the prefs that DO apply. Transactional mail needs
  // no unsubscribe under CAN-SPAM anyway.
  const unsubscribeHeaders = isMandatory
    ? { "List-Unsubscribe": `<${APP_URL}/account?tab=settings>` }
    : buildUnsubscribeHeaders(options.userId, mapTypeToPrefKey(options.type));

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    // We own the timer rather than using AbortSignal.timeout() because Resend
    // swallows the abort: fetchRequest catches everything and returns a generic
    // `application_error` / "Unable to fetch data" — indistinguishable from a
    // network failure. Tracking our own flag is the only way to log "we gave up
    // on a stuck request" rather than "the network died".
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, attemptTimeoutMs);

    // Built as a variable, not an inline literal, on purpose. `signal` is NOT
    // declared on Resend's PostOptions (only `query` and `headers` are), but
    // `post()` spreads its options object straight into fetch —
    // `{ method, body, ...options, headers }` in resend@6.9.1 — so the signal
    // does reach the request and genuinely cancels it. TypeScript's
    // excess-property check only fires on fresh object literals, so hoisting it
    // here passes the extra field through without an `as` cast that would
    // suppress real type errors too.
    //
    // The gap is load-bearing: if a future SDK version stops spreading, the
    // timeout silently stops working. send-timeout.test.ts pins it by asserting
    // the signal is both RECEIVED and ABORTED, so that regression fails loudly.
    const requestOptions = {
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
      signal: controller.signal,
    };

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
          // Per-recipient, because a one-click URL has to carry a token that
          // identifies WHO is unsubscribing — a constant header can't. The
          // helper emits the RFC 8058 `List-Unsubscribe-Post` pair only when it
          // can actually mint a token, and falls back to the plain RFC 2369
          // link otherwise: advertising one-click against a URL that can't
          // honor it is what made Gmail's unsubscribe silently do nothing.
          //
          // Keyed to the pref this message is gated on, so unsubscribing from
          // marketing doesn't also silence order updates.
          headers: unsubscribeHeaders,
        },
        // MUST be the second argument. Resend reads the dedupe key from the
        // request OPTIONS and sets it as the HTTP `Idempotency-Key` header
        // (`post(path, entity, { idempotencyKey })`). Passing it as a custom
        // header inside the email PAYLOAD — which is what this did — makes it a
        // header on the outgoing message and Resend never dedupes: every retry,
        // re-run, or duplicate cron invocation sends a fresh copy. That silently
        // defeated the stable keys the order-status emails and the route-day
        // invite both rely on for at-most-once delivery.
        requestOptions
      );

      // Disarm as soon as the request resolves. The `finally` below is the
      // safety net for the throw path; this keeps the timer from staying armed
      // through the notification_logs work that follows on the success path.
      clearTimeout(timer);

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

        // A timeout is RETRYABLE, never permanent — the next attempt reuses the
        // same idempotency key, so if Resend actually accepted the aborted
        // request it answers `invalid_idempotent_request` above and we report
        // delivered rather than double-sending.
        lastError = timedOut
          ? `Request timed out after ${attemptTimeoutMs}ms`
          : (error.message ?? "Unknown send error");
        logger.warn(
          timedOut
            ? `Email send attempt ${attempt} timed out`
            : `Email send attempt ${attempt} failed`,
          {
            flowId,
            orderId: options.orderId,
            ...(timedOut ? { attemptTimeoutMs } : {}),
          }
        );

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
      //
      // NOT fully atomic: two truly concurrent callers can both see no row and
      // both insert. Closing that needs a UNIQUE index on resend_id (the
      // baseline has a plain btree) plus upsert-on-conflict — a schema change,
      // so it waits on the Docker session tracked in #208. This narrows a
      // certainty to a race, which is worth doing on its own.
      let alreadyLogged = false;
      if (!isUnlogged && resendId) {
        const { data: existingLog, error: existingLogError } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("resend_id", resendId)
          .maybeSingle();
        // PGRST116 here means rows ALREADY EXIST, not "lookup broke": on a GET,
        // maybeSingle() asks for `application/json` and postgrest-js synthesizes
        // that code client-side when the array comes back with >1 row (it never
        // reaches PostgREST's singular-representation check). So the duplicates
        // this guard exists to prevent are already there, and inserting anyway
        // would add a third. Treat it as logged and skip.
        const duplicatesExist = existingLogError?.code === "PGRST116";

        // Any OTHER error is a genuinely failed lookup — fall through to the
        // insert (alreadyLogged stays false), since a possible duplicate row
        // beats dropping the log entirely. Either way it must be surfaced
        // rather than read as a clean "no row found": duplicates are the exact
        // condition the `.single()` webhook lookup chokes on.
        if (existingLogError) {
          logger.warn(
            duplicatesExist
              ? "notification_logs already holds duplicate rows for this resend_id — skipping insert"
              : "notification_logs duplicate check failed — inserting anyway",
            {
              flowId,
              orderId: options.orderId,
              userId: options.userId,
              emailType: options.type,
              resendId,
              dbError: existingLogError.message,
              dbErrorCode: existingLogError.code,
            }
          );
        }
        alreadyLogged = existingLog != null || duplicatesExist;
      }

      if (!isUnlogged && !alreadyLogged) {
        const { error: logError } = await supabase.from("notification_logs").insert({
          // `notification_logs.order_id` is a uuid column, but non-order mail
          // passes a synthetic handle (`route-<date>`) purely for tagging. Now
          // that route_day_invite is a LOGGED type, sending that string
          // straight through would make Postgres reject every marketing row
          // with 22P02. The column is nullable and ON DELETE SET NULL, so null
          // is the honest value: the row still records recipient, type and
          // user_id, which is what an opt-out or spam-complaint audit needs.
          order_id: UUID_RE.test(options.orderId) ? options.orderId : null,
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

        // The email HAS shipped, so this never fails the send — but a dropped
        // row means the Resend status webhook has no resend_id to match, so
        // delivery/bounce/complaint tracking for this message is lost and the
        // customer's notification history is missing an entry. Silent before.
        if (logError) {
          logger.error("Email sent but notification_logs insert failed", {
            flowId,
            orderId: options.orderId,
            userId: options.userId,
            emailType: options.type,
            resendId,
            dbError: logError.message,
            dbErrorCode: logError.code,
          });
        }
      }

      logger.info("Email sent successfully", {
        flowId,
        orderId: options.orderId,
        userId: options.userId,
      });

      return { success: true, resendId: resendId ?? undefined };
    } catch (err) {
      // Disarm before the backoff sleep, matching the eager clear on the
      // resolved path. Left to the `finally` alone, the timer would stay armed
      // through a 10–20s sleep and fire a late abort on an already-settled
      // request. Harmless (both are block-scoped and re-created each iteration,
      // and aborting a dead controller is a no-op) but pointless.
      clearTimeout(timer);

      lastError = timedOut
        ? `Request timed out after ${attemptTimeoutMs}ms`
        : err instanceof Error
          ? err.message
          : "Unknown send error";
      logger.warn(
        timedOut
          ? `Email send attempt ${attempt} timed out`
          : `Email send attempt ${attempt} threw`,
        {
          flowId,
          orderId: options.orderId,
          ...(timedOut ? { attemptTimeoutMs } : {}),
        }
      );

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await sleep(attempt * RETRY_BASE_DELAY_MS);
      }
    } finally {
      // An un-cleared 15s timer holds a handle on the event loop after a fast
      // send, which in a serverless invocation delays teardown for every email
      // the app sends. clearTimeout is idempotent, so the eager clear above and
      // this one can't conflict.
      clearTimeout(timer);
    }
  }

  // -----------------------------------------------
  // Step 6: All retries exhausted — log failure (logged types only)
  // -----------------------------------------------
  const isUnloggedFailed = (UNLOGGED_EMAIL_TYPES as readonly string[]).includes(options.type);
  if (!isUnloggedFailed) {
    const { error: failLogError } = await supabase.from("notification_logs").insert({
      // Same uuid-column constraint as the success path above.
      order_id: UUID_RE.test(options.orderId) ? options.orderId : null,
      user_id: options.userId,
      notification_type: options.type as CustomerEmailType,
      channel: "email",
      recipient: options.to,
      subject: options.subject,
      status: "failed",
      retry_count: MAX_RETRY_ATTEMPTS,
      error_message: lastError ?? "Unknown error after retries",
    });

    // Worse than the success-path case: the send failed AND the failure row is
    // gone, so nothing in the DB shows this customer was never emailed. The
    // logger.error below records the send failure; this records that the audit
    // trail for it is missing too.
    if (failLogError) {
      logger.error("Email failed and the notification_logs failure row could not be written", {
        flowId,
        orderId: options.orderId,
        userId: options.userId,
        emailType: options.type,
        dbError: failLogError.message,
        dbErrorCode: failLogError.code,
      });
    }
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
