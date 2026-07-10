/**
 * Payment-Reconciliation Cron (safety net)
 *
 * Finds Stripe payments that captured money but whose order row does not
 * reflect a live, paid order, and raises an alert so nothing is stranded
 * silently:
 *   - `paid_but_pending`   — charged but the order never left `pending`
 *     (dropped `checkout.session.completed` webhook, or the customer never
 *     returned to the confirmation page). The order is not being processed.
 *   - `paid_but_cancelled` — charged but the order is `cancelled` and no refund
 *     covers the charge (cancel of a paid order, or a cancel/expiry-vs-payment
 *     race). The customer is out the money.
 *
 * Besides alerting (Sentry), it RESOLVES each stranding idempotently:
 *   - `paid_but_pending`   → re-drives `handleCheckoutSessionCompleted` (the
 *     normal confirm flow, status-guarded + idempotent) so the order is
 *     confirmed and its confirmation/admin emails fire.
 *   - `paid_but_cancelled` → refunds the captured amount via the idempotent
 *     `refundPaidOrderInFull` (delta refund; the charge.refunded webhook emails
 *     the customer). Admins are emailed only if the auto-refund FAILS.
 *
 * It runs DAILY (Vercel Hobby caps cron frequency at once/day), so the scan
 * window spans ~2 days (`LOOKBACK_MS`) to cover every order across runs. The
 * webhook + `verify-payment` detectors catch the race cases in real time; this
 * sweep is the backstop for strandings with no triggering event (e.g. an admin
 * cancelling a paid order). Both resolution paths are idempotent, so re-running
 * over an already-healed/refunded order is a no-op.
 */

import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";
import { inspectOrderPayment, classifyStrandedPayment } from "@/lib/stripe/stranded-payment";
import {
  captureStrandedPayment,
  emailAdminsStrandedPayment,
} from "@/lib/orders/stranded-payment-alert";
import { refundPaidOrderInFull } from "@/lib/orders/refund-on-cancel";
import { handleCheckoutSessionCompleted } from "@/app/api/webhooks/stripe/handlers/checkout-session-completed";
import {
  LOOKBACK_MS,
  MAX_PER_RUN,
  hasStripeHandle,
  isPendingWithinGrace,
  isWithinEmailRecency,
} from "./helpers";

const CRON_SECRET = process.env.CRON_SECRET;
const FLOW_ID = "payment-reconciliation";

// Up to MAX_PER_RUN sequential Stripe retrievals — give the function headroom
// over the platform default so a busy day can't abort the sweep mid-scan.
export const maxDuration = 60;

interface CandidateOrder {
  id: string;
  status: string;
  user_id: string;
  payment_method: string;
  placed_at: string;
  updated_at: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
}

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET is not configured — rejecting cron request", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const rl = await checkRateLimit({
    limiter: webhookLimiter,
    identifier: getClientIp(request),
    role: "anon",
    route: "cron/payment-reconciliation",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();
  const now = Date.now();
  const lookbackIso = new Date(now - LOOKBACK_MS).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, status, user_id, payment_method, placed_at, updated_at, stripe_checkout_session_id, stripe_payment_intent_id"
    )
    .in("status", ["pending", "cancelled"])
    .neq("payment_method", "cod")
    .gte("updated_at", lookbackIso)
    // Newest first: in a rare flood, prioritise the freshest (email-eligible,
    // most actionable) strandings within MAX_PER_RUN.
    .order("updated_at", { ascending: false })
    .limit(MAX_PER_RUN)
    .returns<CandidateOrder[]>();

  if (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query orders", 500);
  }

  // No Stripe handle ⇒ nothing captured (COD already excluded); young pending
  // orders still have their normal-confirm grace window — filter both out first.
  const toScan = (orders ?? []).filter(
    (order) => hasStripeHandle(order) && !isPendingWithinGrace(order, now)
  );
  const scanned = toScan.length;
  let strandedPending = 0;
  let strandedCancelled = 0;
  let healedPending = 0;
  let refundedCancelled = 0;
  let inspectErrors = 0;
  let resolveErrors = 0;

  // Bound concurrency: each candidate is a sequential Stripe round-trip, so up
  // to MAX_PER_RUN=200 in series could brush maxDuration and abort the sweep
  // mid-scan (starving the tail). Batches of CONCURRENCY finish all candidates
  // well inside the budget. Counter mutations are safe — JS runs each task's
  // sync steps to completion between awaits (no data race).
  const CONCURRENCY = 5;
  for (let i = 0; i < toScan.length; i += CONCURRENCY) {
    const batch = toScan.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (order) => {
        let inspection;
        try {
          inspection = await inspectOrderPayment(stripe, {
            paymentIntentId: order.stripe_payment_intent_id,
            sessionId: order.stripe_checkout_session_id,
          });
        } catch (err) {
          inspectErrors++;
          logger.error("Failed to inspect Stripe payment during reconciliation", {
            orderId: order.id,
            error: err instanceof Error ? err.message : String(err),
            flowId: FLOW_ID,
            api: "cron",
          });
          return;
        }

        const kind = classifyStrandedPayment(order.status, inspection);
        if (!kind) return;

        const ctx = {
          orderId: order.id,
          userId: order.user_id,
          source: "cron-reconciliation",
          inspection,
        };
        captureStrandedPayment(kind, ctx);

        if (kind === "paid_but_pending") {
          strandedPending++;
          // Auto-heal: re-drive the normal confirm flow (idempotent, status-
          // guarded) so the order is confirmed and its confirmation + admin
          // emails fire. Needs the full Session (metadata.order_id); a pending
          // order's session id is the one that was actually paid.
          if (!order.stripe_checkout_session_id) {
            // No session to re-drive the confirm flow → can't auto-heal. Don't
            // leave it Sentry-only; alert a human.
            if (isWithinEmailRecency(order, now)) await emailAdminsStrandedPayment(kind, ctx);
            return;
          }
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(
              order.stripe_checkout_session_id
            );
            await handleCheckoutSessionCompleted(supabase, fullSession);
            healedPending++;
          } catch (healErr) {
            resolveErrors++;
            logger.error("Auto-heal (confirm) failed during reconciliation", {
              orderId: order.id,
              error: healErr instanceof Error ? healErr.message : String(healErr),
              flowId: FLOW_ID,
              api: "cron",
            });
            if (isWithinEmailRecency(order, now)) await emailAdminsStrandedPayment(kind, ctx);
          }
        } else {
          strandedCancelled++;
          // Auto-refund the captured amount (idempotent delta refund). The
          // charge.refunded webhook emails the customer (source auto-reconcile).
          try {
            const refund = await refundPaidOrderInFull({
              serviceClient: supabase,
              stripe,
              orderId: order.id,
              order: {
                payment_method: order.payment_method,
                stripe_payment_intent_id: order.stripe_payment_intent_id,
                stripe_checkout_session_id: order.stripe_checkout_session_id,
              },
              actorId: order.user_id, // system actor (FK requires a real profile)
              actorRole: "system",
              reason: "Auto-reconcile: cancelled order with a captured payment",
              refundSource: "auto-reconcile",
            });
            if (refund.refunded) {
              refundedCancelled++;
            } else if (isWithinEmailRecency(order, now)) {
              // Couldn't move money (e.g. no PI resolvable) → a human must look.
              await emailAdminsStrandedPayment(kind, ctx);
            }
          } catch (refundErr) {
            resolveErrors++;
            logger.error("Auto-refund failed during reconciliation", {
              orderId: order.id,
              error: refundErr instanceof Error ? refundErr.message : String(refundErr),
              flowId: FLOW_ID,
              api: "cron",
            });
            if (isWithinEmailRecency(order, now)) await emailAdminsStrandedPayment(kind, ctx);
          }
        }
      })
    );
  }

  logger.info("Payment-reconciliation cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    candidates: orders?.length ?? 0,
    scanned,
    strandedPending,
    strandedCancelled,
    healedPending,
    refundedCancelled,
    inspectErrors,
    resolveErrors,
  } as Record<string, unknown>);

  return NextResponse.json({
    candidates: orders?.length ?? 0,
    scanned,
    strandedPending,
    strandedCancelled,
    healedPending,
    refundedCancelled,
    inspectErrors,
    resolveErrors,
  });
}
