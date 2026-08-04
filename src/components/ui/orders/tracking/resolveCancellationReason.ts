/**
 * Which cancellation reason the overlay should show.
 *
 * Two sources, and the choice between them is not a `??`.
 *
 * The SSR snapshot is captured at page load. The overlay's VISIBILITY follows
 * the live order status, so an order cancelled while the page is open shows the
 * overlay against a snapshot taken before that cancellation existed — where the
 * reason is necessarily null. So the snapshot alone is not enough.
 *
 * But once a tracking fetch has succeeded, its answer is AUTHORITATIVE,
 * including when it is null — and falling back to the snapshot there is a real
 * bug, not a harmless default. `cancelled -> pending -> cancelled` is a
 * supported sequence (the status route's own VALID_TRANSITIONS), and the second
 * cancellation legitimately has no readable reason when the admin opted out of
 * notifying, or when a non-audited path did it (account self-serve, the
 * pending-order route, the Stripe charge-refunded and checkout-session-expired
 * handlers). Falling back would then show the FIRST cancellation's reason for
 * the SECOND one — the same superseded-reason bug the server-side reader was
 * fixed for, reintroduced one layer up.
 *
 * So: snapshot until synced, live answer forever after.
 */
export function resolveCancellationReason({
  synced,
  live,
  snapshot,
}: {
  /** Has a tracking fetch succeeded yet? Before that the live value means nothing. */
  synced: boolean;
  /** The most recent fetched reason. Meaningful — including null — only once synced. */
  live: string | null;
  /** The SSR snapshot's reason. Correct only until the first successful fetch. */
  snapshot: string | null;
}): string | null {
  return synced ? live : snapshot;
}
