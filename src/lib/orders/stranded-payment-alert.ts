/**
 * Stranded-payment alerting.
 *
 * Raises a durable, human-visible alert (Sentry + structured log + an admin
 * email) when a stranded Stripe payment is detected. Kept separate from the
 * pure detector in `@/lib/stripe/stranded-payment` so the classifier stays
 * side-effect-free and unit-testable.
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";
import { getResendClient } from "@/lib/email/client";
import { EMAIL_FROM, EMAIL_REPLY_TO, APP_URL } from "@/lib/email/constants";
import { getAdminEmails } from "@/lib/email/admin-recipients";
import type { StrandedKind, PaymentInspection } from "@/lib/stripe/stranded-payment";

export interface StrandedAlertContext {
  orderId: string;
  userId?: string | null;
  /** Where the detection fired: "stripe-webhook" | "verify-payment" | "cron-reconciliation". */
  source: string;
  inspection: PaymentInspection;
}

const KIND_SUMMARY: Record<StrandedKind, string> = {
  paid_but_pending: "Customer was charged but the order is still PENDING (not being processed)",
  paid_but_cancelled: "Customer was charged but the order is CANCELLED and not refunded",
};

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Log + Sentry-alert a stranded payment. Never throws — alerting must not break
 * the caller (a webhook returning 500 would make Stripe retry a non-DB issue).
 */
export function captureStrandedPayment(kind: StrandedKind, ctx: StrandedAlertContext): void {
  const { orderId, userId, source, inspection } = ctx;
  const netChargedCents = inspection.amountCents - inspection.amountRefundedCents;
  const detail = {
    orderId,
    userId: userId ?? undefined,
    kind,
    source,
    paymentIntentId: inspection.paymentIntentId ?? undefined,
    sessionId: inspection.sessionId ?? undefined,
    netChargedCents,
    amountRefundedCents: inspection.amountRefundedCents,
    api: source,
    flowId: "stranded-payment",
  };

  logger.error(
    `Stranded payment (${kind}) on order ${orderId} — ${dollars(netChargedCents)}`,
    detail
  );

  Sentry.captureMessage(`Stranded Stripe payment: ${kind}`, {
    level: "error",
    tags: { area: "payments", stranded_kind: kind, source },
    // Fingerprint per order+kind so each stranded payment is its OWN Sentry
    // issue. Without this, captureMessage groups by the constant message string
    // and distinct money-loss events fold into one issue (and once that issue is
    // resolved/muted, later strandings stop paging). Critical for
    // `paid_but_pending`, whose only alert channel is Sentry.
    fingerprint: ["stranded-payment", kind, orderId],
    extra: detail,
  });
}

/**
 * Email the admin team about a stranded payment so a human can reconcile
 * (confirm the order, or refund in Stripe). Best-effort: logs and swallows any
 * send failure — the Sentry alert from `captureStrandedPayment` is the durable
 * record. This send is intentionally NOT idempotency-keyed: re-alert volume is
 * bounded by the callers instead (the cron's recency window, and the webhook /
 * verify-payment paths firing at most once per event / page mount). A rare
 * duplicate email on a money-loss event is acceptable — over-alerting beats a
 * missed refund.
 */
export async function emailAdminsStrandedPayment(
  kind: StrandedKind,
  ctx: StrandedAlertContext
): Promise<void> {
  try {
    const admins = await getAdminEmails();
    if (admins.length === 0) return;

    const { orderId, inspection } = ctx;
    const netChargedCents = inspection.amountCents - inspection.amountRefundedCents;
    const shortId = orderId.slice(0, 8).toUpperCase();
    const orderUrl = `${APP_URL}/admin/orders/${orderId}`;
    const piId = inspection.paymentIntentId ?? "—";

    const html = `
      <div style="font-family: system-ui, sans-serif; color: #141413; max-width: 560px;">
        <h2 style="color: #A41034; margin: 0 0 8px;">⚠️ Stranded payment needs review</h2>
        <p style="margin: 0 0 16px;">${KIND_SUMMARY[kind]}.</p>
        <table style="border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Order</td><td><strong>#${shortId}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Net charged (unrefunded)</td><td><strong>${dollars(netChargedCents)}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Stripe PaymentIntent</td><td>${piId}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b6b6b;">Detected by</td><td>${ctx.source}</td></tr>
        </table>
        <p style="margin: 16px 0 0;">
          <a href="${orderUrl}" style="color: #A41034;">Open the order</a> —
          ${kind === "paid_but_cancelled" ? "refund in Stripe or reinstate the order." : "confirm the order so it is fulfilled."}
        </p>
      </div>`;
    const text =
      `Stranded payment needs review\n${KIND_SUMMARY[kind]}.\n\n` +
      `Order #${shortId}\nNet charged (unrefunded): ${dollars(netChargedCents)}\n` +
      `Stripe PaymentIntent: ${piId}\nDetected by: ${ctx.source}\n\n${orderUrl}`;

    const resend = getResendClient();
    await resend.emails.send({
      from: EMAIL_FROM,
      to: admins.map((a) => a.email),
      replyTo: EMAIL_REPLY_TO,
      subject: `⚠️ Stranded payment — order #${shortId} (${dollars(netChargedCents)})`,
      html,
      text,
    });
  } catch (err) {
    logger.error("Failed to email admins about stranded payment", {
      orderId: ctx.orderId,
      error: err instanceof Error ? err.message : String(err),
      flowId: "stranded-payment",
    });
  }
}
