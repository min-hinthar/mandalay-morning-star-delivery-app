# docs/06-stripe.md (v1.0) — One-Time Payments + Delivery Fee Threshold

## Goals
- Collect payment for a la carte orders (one-time).
- Persist Stripe customer for returning users.
- Keep checkout secure, minimal PCI scope.
- Ensure idempotency + correct order state transitions.

## Recommended Approach (v1)
Use **Stripe Checkout Sessions** for one-time payments:
- Lowest implementation risk
- Fastest to ship
- Supports saved cards via Stripe Customer
- Supports promotion codes if desired

### Flow Summary
1) Customer builds cart (draft order) in app.
2) Customer selects:
   - saved address (must be coverage-valid)
   - Saturday hourly time window
3) Server creates:
   - Order in DB: status = `pending_payment`
   - Stripe Checkout Session with line items:
     - menu items (snapshot name/price)
     - delivery fee line (if subtotal < $100)
     - optional tip (if enabled)
4) Customer completes checkout.
5) Webhook `checkout.session.completed`:
   - verify signature
   - confirm payment
   - mark order `paid` and `confirmed`
   - lock in scheduled delivery + cutoff time
6) Post-cutoff: no user-initiated changes.

## Amount Calculation (Server Source of Truth)
Inputs:
- cart items + selected modifiers + qty
- items_subtotal_cents = Σ((base + modifiers_delta) * qty)
- delivery_fee_cents = (items_subtotal_cents < 10000) ? 1500 : 0
- tax_cents:
  - v1: optional fixed tax config or Stripe Tax later
- tip_cents:
  - v1 optional; if enabled, treat as separate line
- total_cents = items_subtotal + delivery_fee + tax + tip

## Checkout Session Design
- mode: `payment`
- customer: attach Stripe Customer ID (create if missing)
- metadata:
  - order_id
  - user_id
  - scheduled_date (Saturday)
  - time_window_start / end
- success_url / cancel_url:
  - success routes to /order/{id}?status=success
  - cancel returns to cart with order still editable
- Idempotency:
  - when creating sessions, use an idempotency key = `order_id`
  - prevent multiple paid orders for same cart

## Webhooks (Minimum)
- `checkout.session.completed` (primary)
- `payment_intent.payment_failed` (mark order failed / allow retry)
- `charge.refunded` (sync refunds)

## Refunds
- Admin-only action in dashboard:
  - partial or full refund via Stripe API
  - mirror in `refunds` table + order status `refunded`
- Cancellation policy:
  - customer cancellation allowed **until Friday 15:00 PT cutoff**
  - after cutoff: require admin intervention

## Coupons / Promotions (Optional v1)
Two options:
A) Stripe Promotion Codes (recommended)
- Store promotion_code_id in internal coupons table
- Apply in Checkout Session
B) Internal coupons (more control)
- Validate coupon in app, apply discount server-side, pass discounted amount to Stripe

## Security
- Validate cart server-side (prices from DB, never trust client)
- Validate coverage server-side (distance/duration)
- Verify webhook signature
- Store only Stripe IDs in DB, never card data