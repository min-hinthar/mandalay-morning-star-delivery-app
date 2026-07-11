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
 * This job is READ-ONLY on `orders` — it detects and alerts (Sentry always;
 * admin email for the money-loss `paid_but_cancelled` case). Auto-heal
 * (confirm paid-pending) and auto-refund (cancelled-paid) land in a follow-up.
 * It runs DAILY (Vercel Hobby caps cron frequency at once/day), so the scan
 * window spans ~2 days (`LOOKBACK_MS`) to cover every order across runs. The
 * webhook + `verify-payment` detectors catch the race cases in real time; this
 * sweep is the backstop for strandings with no triggering event (e.g. an admin
 * cancelling a paid order). Every confirm path otherwise guards on
 * `status = 'pending'`, so without this a paid+cancelled order is never
 * re-inspected.
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
  let inspectErrors = 0;

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
        } else {
          strandedCancelled++;
          // Money-loss case → notify a human, but only while it is fresh so a
          // persistent unresolved order is not re-emailed every run.
          if (isWithinEmailRecency(order, now)) {
            await emailAdminsStrandedPayment(kind, ctx);
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
    inspectErrors,
  } as Record<string, unknown>);

  return NextResponse.json({
    candidates: orders?.length ?? 0,
    scanned,
    strandedPending,
    strandedCancelled,
    inspectErrors,
  });
}
