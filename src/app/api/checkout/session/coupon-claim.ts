import type { NextResponse } from "next/server";

import { claimCoupon, claimFailureMessage } from "@/lib/coupons";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

import type { CheckoutDiscount } from "./discount";
import { errorResponse } from "./validation";

/**
 * Bind a one-time app coupon to the order just created. The claim is the
 * authoritative single-use gate (row lock in claim_coupon) — the earlier
 * lookup is only a preview, so two concurrent checkouts can both reach here
 * and exactly one wins. The loser's order is deleted (order_items cascade)
 * before any payment surface exists, and it gets a 409.
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
  const result = await claimCoupon(service, discount.appCoupon.id, orderId, userId);
  if (result === "ok") return null;

  const { error } = await service.from("orders").delete().eq("id", orderId);
  if (error) {
    logger.exception(error, { api: "checkout-session", orderId, cleanup: "coupon-claim" });
  }
  logger.warn("Coupon claim rejected — order rolled back", {
    api: "checkout-session",
    orderId,
    couponId: discount.appCoupon.id,
    reason: result,
  });
  return result === "error"
    ? errorResponse("INTERNAL_ERROR", claimFailureMessage(result), 500)
    : errorResponse("VALIDATION_ERROR", claimFailureMessage(result), 409);
}
