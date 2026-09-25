/**
 * Display status of an app coupon — mirrors claim_coupon's release rule so the
 * admin list agrees with what checkout will actually do. Pure; no I/O.
 */

export type CouponStatus =
  | "active"
  | "in_checkout"
  | "awaiting_approval"
  | "redeemed"
  | "expired"
  | "revoked";

export const STALE_PENDING_MS = 2 * 60 * 60 * 1000;

export interface CouponStatusInput {
  revoked_at: string | null;
  expires_at: string | null;
  order_id: string | null;
  /** Last claim time (bumped by every retry-payment re-claim). */
  redeemed_at: string | null;
  /** The holding order, when `order_id` is set and the row still exists. */
  holder: HolderOrder | null;
}

export interface HolderOrder {
  status: string;
  payment_method: string;
  stripe_payment_intent_id: string | null;
}

/**
 * Only an unpaid card checkout can be abandoned (and its coupon released after
 * STALE_PENDING_MS). A paid card order or a COD order that an admin reverted
 * to `pending` still holds its coupon — mirrors claim_coupon's release rule.
 */
export function isUnpaidCardCheckout(holder: HolderOrder): boolean {
  return (
    holder.status === "pending" &&
    holder.payment_method === "stripe" &&
    holder.stripe_payment_intent_id == null
  );
}

export function couponStatus(c: CouponStatusInput, now: number = Date.now()): CouponStatus {
  if (c.revoked_at) return "revoked";
  if (c.order_id && c.holder && c.holder.status !== "cancelled") {
    // COD order placed but not yet approved: consumed (a rejection cancels it
    // and frees the coupon), but not "used" in the fulfilled sense.
    if (c.holder.status === "pending_approval") return "awaiting_approval";
    if (!isUnpaidCardCheckout(c.holder)) return "redeemed";
    const claimedAt = c.redeemed_at ? new Date(c.redeemed_at).getTime() : 0;
    if (now - claimedAt <= STALE_PENDING_MS) return "in_checkout";
  }
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return "expired";
  return "active";
}
