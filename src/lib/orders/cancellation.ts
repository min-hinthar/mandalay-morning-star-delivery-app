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
 * The reason is withheld unless the admin chose to notify the customer. It is a
 * single required free-text field with no customer-copy/internal-note split, so
 * an admin who opts OUT of notifying may well have written it for staff
 * ("suspected card fraud — hold refund"). The cancel route now records that
 * choice as `new_value.notified`; a row without the flag predates it and is
 * treated as "do not show", because the failure mode of withholding is exactly
 * the pre-existing behaviour (no reason displayed) while the failure mode of
 * showing is leaking a staff note.
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
  /** When the cancellation was recorded. Always safe to show. */
  cancelledAt: string;
  /**
   * Admin-supplied reason — null unless the admin chose to notify the customer,
   * which is the only case where it is known to be customer-facing copy.
   */
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
      .select("reason, created_at, new_value")
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

    // Only surface the reason when the admin opted IN to telling the customer.
    // Anything other than an explicit true — false, or absent on a row written
    // before this was recorded — withholds it.
    const newValue = data.new_value;
    const notified =
      typeof newValue === "object" &&
      newValue !== null &&
      !Array.isArray(newValue) &&
      (newValue as Record<string, unknown>).notified === true;

    return { cancelledAt: data.created_at, reason: notified ? data.reason : null };
  } catch (err) {
    logger.exception(err, { api: "orders/cancellation", orderId });
    return null;
  }
}
