/**
 * Display status of an app coupon — mirrors claim_coupon's release rule so the
 * admin list agrees with what checkout will actually do. Pure; no I/O.
 */

export type CouponStatus = "active" | "in_checkout" | "redeemed" | "expired" | "revoked";

export const STALE_PENDING_MS = 2 * 60 * 60 * 1000;

export interface CouponStatusInput {
  revoked_at: string | null;
  expires_at: string | null;
  order_id: string | null;
  /** Last claim time (bumped by every retry-payment re-claim). */
  redeemed_at: string | null;
  /** The holding order, when `order_id` is set and the row still exists. */
  holder: { status: string } | null;
}

export function couponStatus(c: CouponStatusInput, now: number = Date.now()): CouponStatus {
  if (c.revoked_at) return "revoked";
  if (c.order_id && c.holder && c.holder.status !== "cancelled") {
    if (c.holder.status !== "pending") return "redeemed";
    const claimedAt = c.redeemed_at ? new Date(c.redeemed_at).getTime() : 0;
    if (now - claimedAt <= STALE_PENDING_MS) return "in_checkout";
  }
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return "expired";
  return "active";
}
