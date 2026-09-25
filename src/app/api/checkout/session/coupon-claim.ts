import type { NextResponse } from "next/server";

import { claimCoupon, claimFailureMessage } from "@/lib/coupons";
import { reclaimPendingCheckouts } from "@/lib/referrals/reclaim-pending-checkouts";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

import type { CheckoutDiscount } from "./discount";
import { errorResponse } from "./validation";

type Service = ReturnType<typeof createServiceClient>;

/**
 * Bind a one-time app coupon to the order just created. The claim is the
 * authoritative single-use gate (row lock in claim_coupon) — the earlier
 * lookup is only a preview, so two concurrent checkouts can both reach here
 * and exactly one wins. The loser's order is removed before any payment
 * surface exists, and it gets a 409.
 *
 * Returns null on success (or when there is no app coupon).
 */
export async function claimAppCouponOrRollback(
  discount: CheckoutDiscount,
  orderId: string,
  userId: string
): Promise<NextResponse | null> {
  if (!discount.appCoupon) return null;
  const service = createServiceClient();
  const couponId = discount.appCoupon.id;
  let result = await claimCoupon(service, couponId, orderId, userId);
  // Held by this customer's own abandoned card checkout (they left Stripe and
  // came back): expire that session + cancel its order, then claim again.
  // Done here — after every non-destructive checkout gate has passed — so a
  // request that was going to be rejected anyway never tears down a live
  // checkout.
  if (
    result === "in_use" &&
    (await releaseOwnAbandonedHolder(service, couponId, orderId, userId))
  ) {
    result = await claimCoupon(service, couponId, orderId, userId);
  }
  if (result === "ok") return null;

  await discardUnclaimedOrder(service, orderId);
  logger.warn("Coupon claim rejected — order rolled back", {
    api: "checkout-session",
    orderId,
    couponId,
    reason: result,
  });
  return result === "error"
    ? errorResponse("INTERNAL_ERROR", claimFailureMessage(result), 500)
    : errorResponse("VALIDATION_ERROR", claimFailureMessage(result), 409);
}

async function releaseOwnAbandonedHolder(
  service: Service,
  couponId: string,
  orderId: string,
  userId: string
): Promise<boolean> {
  const { data: coupon } = await service
    .from("coupons")
    .select("order_id")
    .eq("id", couponId)
    .maybeSingle();
  const holderId = coupon?.order_id;
  if (!holderId || holderId === orderId) return false;
  const { data: holder } = await service
    .from("orders")
    .select("user_id, status")
    .eq("id", holderId)
    .maybeSingle();
  if (!holder || holder.user_id !== userId || holder.status !== "pending") return false;
  return reclaimPendingCheckouts(stripe, service, userId, { orderIds: [holderId] });
}

/**
 * Remove an order whose coupon claim lost (order_items cascade). If the delete
 * itself fails, cancel instead — an unclaimed discounted order must never be
 * left live (a COD order would otherwise sit in pending_approval with the
 * discount). Both writes are guarded to the pre-payment statuses.
 */
async function discardUnclaimedOrder(service: Service, orderId: string): Promise<void> {
  const { error } = await service.from("orders").delete().eq("id", orderId);
  if (!error) return;
  logger.exception(error, { api: "checkout-session", orderId, cleanup: "coupon-claim" });
  const { error: cancelError } = await service
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .in("status", ["pending", "pending_approval"]);
  if (cancelError) {
    logger.exception(cancelError, { api: "checkout-session", orderId, cleanup: "coupon-cancel" });
  }
}
