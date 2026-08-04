/**
 * Where a cancellation actually lives.
 *
 * `orders` has no `cancelled_at` / `cancellation_reason` column — #231 removed
 * the selects that pretended otherwise, which had been failing every customer
 * tracking query outright. Cancellation is recorded in four different places
 * depending on who did it:
 *
 *   admin cancel  -> order_audit_log row, action='cancel', with `reason`
 *   admin status  -> order_audit_log row, action='status_change', with `reason`
 *   account       -> a note appended to orders.special_instructions
 *   pending route -> nowhere (only the status changes)
 *
 * This reads BOTH admin paths, and deliberately neither customer one. The
 * reason a customer needs surfaced is the one they did NOT write — "we
 * cancelled your order because …". Their own self-serve reason is something
 * they typed moments earlier; reading it back adds nothing, and mining it out
 * of a free-text notes field would be guesswork.
 *
 * The second admin path is easy to miss and was missed on the first pass:
 * `PATCH /api/admin/orders/[id]/status` allows pending | pending_approval |
 * confirmed | preparing -> cancelled, takes the same free-text `reason`, and
 * emails the customer the same OrderCancellation template — but records
 * `action:'status_change'`. Scoping to action='cancel' alone left that whole
 * path dead: the customer got an email with a reason and a tracking page that
 * showed none.
 *
 * Matching on the action alone is not enough either, because 'status_change'
 * is also what approve-cod and every forward transition write. So a
 * status_change row counts only when it moved INTO cancelled. Rows from the
 * dedicated cancel route need no such check — that route only ever cancels,
 * which also keeps legacy rows (written before `notified` existed) readable.
 *
 * The reason is withheld unless the admin chose to notify the customer. It is a
 * single required free-text field with no customer-copy/internal-note split, so
 * an admin who opts OUT of notifying may well have written it for staff
 * ("suspected card fraud — hold refund"). Both admin routes now record that
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

/** A `new_value` payload as a plain object, or null if it is not one. */
function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * How many recent rows to consider. The newest matching row is the current
 * cancellation in every ordinary case — the only transition OUT of `cancelled`
 * is back to `pending`, so anything written after a cancellation would mean the
 * order is no longer cancelled, and callers only ask about cancelled orders.
 * The small window is slack for an interleaved non-cancel audit row rather than
 * a real expectation; it is one indexed page either way.
 */
const CANDIDATE_ROWS = 10;

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
      .select("action, reason, created_at, new_value")
      .eq("order_id", orderId)
      .in("action", ["cancel", "status_change"])
      .order("created_at", { ascending: false })
      .limit(CANDIDATE_ROWS);

    if (error) {
      logger.exception(error, { api: "orders/cancellation", orderId });
      return null;
    }

    // The dedicated cancel route only ever cancels, so its rows need no shape
    // check. A status_change row counts only if it moved INTO cancelled —
    // approve-cod and every forward transition share that action.
    const row = data?.find(
      (candidate) =>
        candidate.action === "cancel" || asObject(candidate.new_value)?.status === "cancelled"
    );
    if (!row) return null;

    // Only surface the reason when the admin opted IN to telling the customer.
    // Anything other than an explicit true — false, or absent on a row written
    // before this was recorded — withholds it.
    const notified = asObject(row.new_value)?.notified === true;

    return { cancelledAt: row.created_at, reason: notified ? row.reason : null };
  } catch (err) {
    logger.exception(err, { api: "orders/cancellation", orderId });
    return null;
  }
}
