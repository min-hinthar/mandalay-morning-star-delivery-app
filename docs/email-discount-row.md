# Email totals — discount row (coupon orders reconcile)

> Closes audit finding **L-10** (`docs/adversarial-audit-2026-06.md`), the documented
> follow-up to the admin-status tip fix in #187. Stacked on #187 (shares the
> `status/route.ts` email payload).

## Problem

`orders.total_cents` is stored **net of any coupon** (`amount_off` / first-order /
loyalty discount), but the email receipt (`OrderTotalsTable`) only rendered
Subtotal / Delivery / Tax / Tip. So for a **coupon order** the itemized rows did not
sum to the shown Total — the customer saw, e.g., rows adding to $51 over a $43 total
with no explanation. The tip fix in #187 closed the non-coupon gap; this closes it for
coupon orders. The same omission existed on the Stripe-webhook payload.

## Change

`OrderTotalsTable` gains an optional `discountCents` and renders a **Discount** line
(a sage "savings" subtraction, shown only when `discountCents > 0`) right under
Subtotal, so `subtotal − discount + delivery + tax + tip = total` reads cleanly.

`discountCents` is threaded from `orders.discount_cents` (a NOT-NULL column) through
every customer-facing path that builds these templates:

| Surface                  | Template                                    | File                                                                 |
| ------------------------ | ------------------------------------------- | -------------------------------------------------------------------- |
| Stripe-paid confirmation | OrderConfirmation + AdminNewOrderAlert      | `webhooks/stripe/handlers/checkout-session-completed.ts`             |
| Payment-verify fallback  | OrderConfirmation                           | `orders/[id]/verify-payment/route.ts`                                |
| Admin status re-send     | OrderConfirmation (via `buildEmailElement`) | `admin/orders/[id]/status/route.ts`, `lib/email/build.ts`            |
| COD order received       | OrderConfirmation + AdminNewOrderAlert      | `checkout/session/helpers.ts` (+ caller `checkout/session/route.ts`) |
| COD approval             | OrderConfirmation                           | `admin/orders/[id]/approve-cod/route.ts`                             |
| Delivery reminder        | DeliveryReminder                            | `cron/delivery-reminders/route.ts` (+ `lib/email/build.ts`)          |

COD orders carry `discount_cents` too (first-order/welcome/loyalty discounts apply to
COD), so the COD paths are wired, not just the Stripe ones. The DB selects that didn't
already fetch `discount_cents` were extended; `approve-cod` already used `select("*")`.

Totals are **presentation-only** — no tax/tip/discount/total math changed; the row
just surfaces the discount already baked into the stored total.

## Verification

- `src/emails/__tests__/order-details.test.tsx` — a coupon order renders the Discount
  row and reconciles ($43 − $8 + $0 + $3.50 = $38.50); a non-coupon order shows no
  Discount row.
- Full suite: `lint · lint:css · format:check · typecheck · test · build`.
