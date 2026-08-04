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
 * Read the NEWEST such row and stop. Do not scan back for an older cancel row:
 * an order can be un-cancelled (`cancelled -> pending`) and then cancelled
 * again by a path that writes no audit row at all, and reaching past that for
 * the previous admin reason attributes it — and its timestamp — to a
 * cancellation it had nothing to do with. See the note in the query below.
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

/**
 * The outcome of the lookup, not just its answer.
 *
 * `ok: false` means the READ FAILED — the answer is unknown, which is not the
 * same as "there is no reason". Callers must not let a failure present itself
 * as an authoritative null, or a transient audit-log error would replace a
 * reason the customer can legitimately see with nothing, and keep it hidden.
 */
export interface CancellationLookup {
  ok: boolean;
  cancellation: OrderCancellation | null;
}

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
 * The most recent admin cancellation record for an order.
 *
 * Never throws: this decorates a page that must still render without it. But a
 * failure is reported BOTH ways — logged, and surfaced as `ok: false` — so no
 * caller can mistake "we could not read it" for "there is nothing to read".
 */
export async function getOrderCancellation(orderId: string): Promise<CancellationLookup> {
  try {
    const { data, error } = await createServiceClient()
      .from("order_audit_log")
      .select("action, reason, created_at, new_value")
      .eq("order_id", orderId)
      .in("action", ["cancel", "status_change"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.exception(error, { api: "orders/cancellation", orderId });
      return { ok: false, cancellation: null };
    }
    if (!data) return { ok: true, cancellation: null };

    // ONLY the newest row decides, and it is never skipped.
    //
    // The `.in()` above leaves exactly two kinds of row, and both are
    // decisive: a 'cancel' row always cancelled, and a 'status_change' row
    // always carries the status it moved the order TO. So if the newest one
    // did not put the order into `cancelled`, no admin cancellation explains
    // the state it is in now.
    //
    // Scanning PAST a non-cancelling row to find an older cancel row is a real
    // bug, not a harmless fallback. `cancelled -> pending` is a permitted
    // transition (status route's VALID_TRANSITIONS), and FIVE paths then set
    // `cancelled` again while writing NO audit row — account self-serve (x2),
    // the pending-order route, and the Stripe charge-refunded and
    // checkout-session-expired handlers. Walking back past the un-cancel would
    // attribute a superseded admin reason, and its stale timestamp, to a
    // cancellation it had nothing to do with. Showing nothing there is right:
    // the reason genuinely is not recorded anywhere.
    const isCancellation =
      data.action === "cancel" || asObject(data.new_value)?.status === "cancelled";
    if (!isCancellation) return { ok: true, cancellation: null };

    const row = data;

    // Only surface the reason when the admin opted IN to telling the customer.
    // Anything other than an explicit true — false, or absent on a row written
    // before this was recorded — withholds it.
    const notified = asObject(row.new_value)?.notified === true;

    return {
      ok: true,
      cancellation: { cancelledAt: row.created_at, reason: notified ? row.reason : null },
    };
  } catch (err) {
    logger.exception(err, { api: "orders/cancellation", orderId });
    return { ok: false, cancellation: null };
  }
}
