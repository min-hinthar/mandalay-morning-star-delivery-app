/**
 * Where a cancellation actually lives.
 *
 * `orders` has no `cancelled_at` / `cancellation_reason` column — #231 removed
 * the selects that pretended otherwise, which had been failing every customer
 * tracking query outright. Cancellation is recorded in three different places
 * depending on who did it:
 *
 *   admin   -> order_audit_log row, action='cancel', with `reason`
 *   account -> a note appended to orders.special_instructions
 *   pending -> nowhere (only the status changes)
 *
 * This reads the first of those, and deliberately only that one. The reason a
 * customer needs surfaced is the one they did NOT write — "we cancelled your
 * order because …". Their own self-serve reason is something they typed
 * moments earlier; reading it back adds nothing, and mining it out of a
 * free-text notes field would be guesswork.
 *
 * SERVICE CLIENT, deliberately: `order_audit_log`'s RLS is admin-only for both
 * SELECT and INSERT (baseline:2288-2292), so a customer-scoped client reads
 * nothing here. Callers must therefore have already proven the requester owns
 * the order — both current callers match `user_id` in the query that fetched
 * it. Only `reason` and `created_at` are returned, never actor identity.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface OrderCancellation {
  /** When the cancellation was recorded. */
  cancelledAt: string;
  /** Admin-supplied reason, already shown to the customer in the cancellation email. */
  reason: string | null;
}

/**
 * The most recent admin cancellation record for an order, or null.
 *
 * Returns null rather than throwing: this decorates a page that must still
 * render without it. A failure is logged so it does not read as "no reason".
 */
export async function getOrderCancellation(orderId: string): Promise<OrderCancellation | null> {
  try {
    const { data, error } = await createServiceClient()
      .from("order_audit_log")
      .select("reason, created_at")
      .eq("order_id", orderId)
      .eq("action", "cancel")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.exception(error, { api: "orders/cancellation", orderId });
      return null;
    }
    if (!data) return null;

    return { cancelledAt: data.created_at, reason: data.reason };
  } catch (err) {
    logger.exception(err, { api: "orders/cancellation", orderId });
    return null;
  }
}
