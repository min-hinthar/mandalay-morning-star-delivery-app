/**
 * Pure coupon math — shared by the server checkout, the validate-promo preview
 * and the client order summary so the three can never disagree. No I/O.
 */

export type CouponKind = "free_delivery" | "amount_off" | "percent_off";

export interface CouponValues {
  amount_off_cents: number | null;
  percent_off: number | null;
  /** Cap: max $ off for percent codes, max fee waived for free delivery. */
  max_discount_cents: number | null;
}

export interface CouponEffect {
  /** Off the FOOD subtotal (stored as orders.discount_cents). */
  discountCents: number;
  /** Off the delivery fee (the charged delivery_fee_cents is reduced by this). */
  deliveryWaiverCents: number;
}

export function couponEffect(
  kind: CouponKind,
  values: CouponValues,
  subtotalCents: number,
  deliveryFeeCents: number
): CouponEffect {
  const cap = values.max_discount_cents ?? Number.POSITIVE_INFINITY;
  const subtotal = Math.max(0, subtotalCents);
  const fee = Math.max(0, deliveryFeeCents);

  if (kind === "free_delivery") {
    return { discountCents: 0, deliveryWaiverCents: Math.min(fee, cap) };
  }
  if (kind === "amount_off") {
    return {
      discountCents: Math.min(values.amount_off_cents ?? 0, subtotal, cap),
      deliveryWaiverCents: 0,
    };
  }
  const pct = Math.round((subtotal * (values.percent_off ?? 0)) / 100);
  return { discountCents: Math.min(pct, subtotal, cap), deliveryWaiverCents: 0 };
}

export function couponLabel(kind: CouponKind, values: CouponValues): string {
  const cap =
    values.max_discount_cents != null
      ? ` (up to $${(values.max_discount_cents / 100).toFixed(2)})`
      : "";
  if (kind === "free_delivery") return `Free delivery${cap}`;
  if (kind === "amount_off") return `$${((values.amount_off_cents ?? 0) / 100).toFixed(2)} off`;
  return `${values.percent_off ?? 0}% off${cap}`;
}
