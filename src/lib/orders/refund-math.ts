/**
 * Item-refund money math — the TS mirror of `apply_item_refunds`.
 *
 * The DB function (latest: supabase/migrations/20260805200000_discount_
 * proportional_refunds.sql) is the authority that actually moves money; this
 * mirror exists so the admin RefundDialog can preview the SAME amounts the
 * RPC will produce, and so the math has unit tests at all (the SQL cannot run
 * in this repo's test environment). Every formula here must stay
 * expression-for-expression identical to the SQL, including WHERE the
 * rounding happens — `refund-math.test.ts` pins parity vectors and the
 * migration-source guard pins the SQL side.
 *
 * Why the scaling exists (audit D4): the order's own math is
 *   total = subtotal + delivery + tax(10.5% of FULL subtotal) + tip − discount
 * so a discounted order's customer paid `line × (1 − discount/subtotal)` for
 * the goods on each line — but DID pay full tax on it (tax is computed on the
 * undiscounted subtotal). Refunding the raw line total therefore over-refunds
 * the goods by the discount share while silently keeping the tax the
 * customer also paid. The correct make-whole amount per line is
 *   round(gross × (1 − discountRatio)) + round(gross × tax/subtotal)
 * — less than the raw line total on discounted orders, more on plain ones.
 *
 * Rounding parity: SQL `round(numeric)` rounds half AWAY FROM ZERO;
 * `Math.round` rounds half UP. All amounts here are non-negative, where the
 * two agree — the tests pin the .5 boundary to keep that assumption honest.
 * One residual divergence is accepted: SQL computes the discount ratio in
 * arbitrary-precision `numeric` while this mirror uses float64, so at exact
 * `.5` product boundaries the PREVIEW can differ from the RPC by 1¢. The RPC
 * is authoritative and the success toast shows its actual total.
 */

export interface OrderRefundContext {
  /** orders.subtotal_cents — pre-discount goods total. */
  subtotalCents: number;
  /** orders.discount_cents — flat amount subtracted from the order total. */
  discountCents: number;
  /** orders.tax_cents — computed on the FULL (undiscounted) subtotal. */
  taxCents: number;
}

export interface ItemRefundBreakdown {
  /** The raw line share being refunded (pre-discount, pre-tax). */
  grossCents: number;
  /** Goods after the order's discount ratio — what the customer paid for them. */
  goodsCents: number;
  /** This line's share of the order's tax. */
  taxCents: number;
  /** goodsCents + taxCents — the amount the RPC refunds. */
  totalCents: number;
}

/**
 * The gross line share for refunding `refundQuantity` of an item.
 * Mirrors: `round(line_total_cents::numeric / quantity * qty)`.
 */
export function itemGrossRefundCents(
  lineTotalCents: number,
  quantity: number,
  refundQuantity: number
): number {
  if (quantity <= 0) return 0;
  return Math.round((lineTotalCents / quantity) * refundQuantity);
}

/**
 * The discount ratio the RPC applies to goods.
 * Mirrors: `LEAST(1, discount_cents::numeric / subtotal_cents)` with a 0
 * fallback when the subtotal is 0 (nothing to attribute a discount to).
 */
export function orderDiscountRatio(ctx: OrderRefundContext): number {
  if (ctx.subtotalCents <= 0) return 0;
  return Math.min(1, ctx.discountCents / ctx.subtotalCents);
}

/**
 * What the RPC refunds for a gross line share on this order.
 * Mirrors the per-item block of `apply_item_refunds`: goods scaled by the
 * discount ratio, plus the line's proportional share of the order tax — each
 * rounded independently, exactly as the SQL does.
 */
export function computeItemRefund(
  grossCents: number,
  ctx: OrderRefundContext
): ItemRefundBreakdown {
  const ratio = orderDiscountRatio(ctx);
  const goodsCents = Math.round(grossCents * (1 - ratio));
  const taxCents =
    ctx.subtotalCents > 0 ? Math.round((grossCents * ctx.taxCents) / ctx.subtotalCents) : 0;
  return { grossCents, goodsCents, taxCents, totalCents: goodsCents + taxCents };
}

/**
 * How much delivery fee is still refundable (audit D5): the fee is refunded
 * at most once per order, so a second "refund shipping" request returns only
 * the remainder — 0 once fully refunded.
 * Mirrors: `GREATEST(0, delivery_fee_cents − prior_shipping_refunds)`.
 */
export function remainingShippingRefundCents(
  deliveryFeeCents: number,
  alreadyRefundedShippingCents: number
): number {
  return Math.max(0, deliveryFeeCents - alreadyRefundedShippingCents);
}

export interface RefundCapResult {
  /** What the RPC will actually refund for this request. */
  totalCents: number;
  /**
   * "ok": fits the remaining balance. "clamped": per-line rounding overshot
   * by ≤1¢/line and the RPC trims to the remainder. "exceeds": a genuine
   * over-refund the RPC rejects outright.
   */
  outcome: "ok" | "clamped" | "exceeds";
}

/**
 * The RPC's cumulative cap, mirrored for the dialog (audit follow-up to D4):
 * each refunded line share rounds goods and tax independently (≤ +0.5¢
 * each), and the drift accumulates ACROSS calls when an order is refunded
 * item-by-item — so the tolerance is `roundingBoundUnits`, the order's
 * cumulative refunded UNIT count including this request (every rounding
 * event maps to at least one refunded unit). Within that bound — and only
 * while something remains refundable — the RPC clamps down to the remainder;
 * beyond it, it rejects. Mirrors the migration's `v_overshoot` branch.
 */
export function clampRefundToRemaining(
  requestedCents: number,
  remainingCents: number,
  roundingBoundUnits: number
): RefundCapResult {
  const overshoot = requestedCents - remainingCents;
  if (overshoot <= 0) return { totalCents: requestedCents, outcome: "ok" };
  if (remainingCents > 0 && overshoot <= roundingBoundUnits) {
    return { totalCents: remainingCents, outcome: "clamped" };
  }
  return { totalCents: requestedCents, outcome: "exceeds" };
}
