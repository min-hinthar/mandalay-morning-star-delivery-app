/**
 * Morning Star Rewards — loyalty constants and pure helpers.
 *
 * Stars are simply the customer's completed-order count (no stored counter, so
 * nothing can drift). Every Nth order crosses a milestone and auto-issues a $5
 * "Kyay-Zu-Par!" thank-you coupon.
 */

/** Loyalty thank-you discount (cents) — the "Kyay-Zu-Par!" reward. */
export const LOYALTY_REWARD_CENTS = 500;

/** A reward is issued every Nth completed order. */
export const LOYALTY_MILESTONE_STEP = 5;

/** Minimum cart subtotal (cents) required to redeem a loyalty reward. */
export const LOYALTY_MIN_SUBTOTAL_CENTS = 5000;

/** Order statuses that count as a real (Star-earning) order. */
export const STAR_EARNING_STATUSES = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "pending_approval",
] as const;

/** The next milestone (multiple of the step) strictly above `stars`. */
export function nextMilestone(stars: number): number {
  return (Math.floor(stars / LOYALTY_MILESTONE_STEP) + 1) * LOYALTY_MILESTONE_STEP;
}

/** Orders remaining until the next reward unlocks. */
export function ordersToNextMilestone(stars: number): number {
  return nextMilestone(stars) - stars;
}

/**
 * The milestone reached at exactly this completed-order count, or null if the
 * count isn't on a milestone boundary.
 */
export function milestoneReached(orderCount: number): number | null {
  return orderCount > 0 && orderCount % LOYALTY_MILESTONE_STEP === 0 ? orderCount : null;
}

/** Progress (0–step) toward the next milestone, for the progress ring. */
export function progressInCycle(stars: number): number {
  return stars % LOYALTY_MILESTONE_STEP;
}
