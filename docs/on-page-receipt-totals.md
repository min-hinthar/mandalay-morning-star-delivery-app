# On-page receipts — Tip & Discount rows

> Parallel of L-10 (`docs/email-discount-row.md`) for the **on-screen** receipts. Closes
> the gap the #189 review surfaced: the email receipts reconcile for coupon/tipped
> orders, but the two on-page receipts did not.

## Problem

`orders.total_cents` is net of any coupon **and** includes the tip, but the two
on-screen receipts rendered only Subtotal / Delivery / Tax / Total — **no Tip and no
Discount line**:

- `OrderConfirmationV8` (post-order confirmation page)
- `OrderSummary` (order-tracking page)

So for any **tipped or coupon** order the rows shown on screen didn't sum to the
displayed total — the same class of bug L-10 fixed for emails.

## Change

Both receipts now render a **Tip** row (when `tipCents > 0`) and a sage **Discount**
row (a negative savings line, when the discount > 0), placed to mirror the email
`OrderTotalsTable`: `Subtotal · Discount · Delivery · Tax · Tip · Total`.

The discount shown is clamped to `subtotal + delivery + tax + tip` so the rows always
reconcile to the stored total even though `calculateOrderTotals` floors it at $0. To
keep that clamp from drifting across the now-**three** receipt surfaces, it's extracted
into one shared, unit-tested helper — `receiptDisplayDiscountCents` in
`src/lib/utils/order.ts` — used by the email `OrderTotalsTable` and both on-page
receipts.

**Data wiring:**

- `OrderConfirmationV8` — the `Order` already carried `tipCents`/`discountCents`
  (`src/types/order.ts`, populated by the confirmation page loader), so only the rows
  were added.
- `OrderSummary` (tracking) — `tip_cents`/`discount_cents` were **not** in the tracking
  pipeline; threaded end-to-end: DB select + row type + transform in both
  `tracking/fetchTrackingData.ts` and `api/tracking/[orderId]/route.ts` (+ `types.ts`),
  the shared `TrackingOrderInfo` type (`src/types/tracking.ts`), and the
  `TrackingPageClient` → `OrderSummary` prop pass-through.

Presentation-only — no totals math changed; the rows surface tip + discount already
baked into the stored total.

## Verification

- `src/lib/utils/__tests__/order.test.ts` — `receiptDisplayDiscountCents`: no-discount →
  0, normal pass-through, over-discount clamp, tip included in the ceiling.
- Existing tracking tests (`api/tracking/__tests__/route.test.ts`,
  `useTrackingSubscription.test.ts`) stay green with the new fields; email
  reconciliation tests still pass against the shared helper.
- The on-page components themselves are presentation-only and (per repo convention) not
  unit-tested — the reconciliation logic they depend on is locked by the shared helper's
  tests + the `calculateOrderTotals` invariant test.
- Full suite: `lint · lint:css · format:check · typecheck · test · build`.
