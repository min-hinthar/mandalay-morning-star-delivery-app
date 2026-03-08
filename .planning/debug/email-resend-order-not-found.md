---
status: awaiting_human_verify
trigger: "Order confirmation email not sent for Stripe orders. Admin cannot resend — UI toast shows 'order not found'."
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:02:00Z
---

## Current Focus

hypothesis: TWO root causes confirmed and fixed
test: typecheck + unit tests pass
expecting: User verifies in real environment
next_action: Await human verification

## Symptoms

expected: Stripe order confirmation email sent automatically after payment. Admin can resend from order detail page.
actual: No confirmation email sent. Admin resend shows "order not found" toast.
errors: UI toast "order not found" when admin attempts to resend confirmation email
reproduction: Complete a Stripe checkout, observe no email. Go to admin order detail, try resend email — get "order not found" toast.
started: Unknown. COD orders may work fine — only Stripe orders affected.

## Eliminated

- hypothesis: RLS blocks admin from reading orders
  evidence: orders_select policy includes `OR public.is_admin()` — admin can read all orders
  timestamp: 2026-03-07T00:00:30Z

- hypothesis: Order ID format mismatch between Stripe and admin
  evidence: Both use UUID from the same `create_order_with_items` RPC call
  timestamp: 2026-03-07T00:00:30Z

- hypothesis: `after()` doesn't work for webhook routes on Vercel
  evidence: `after()` is stable in Next.js 15+, project uses Next.js 16. The function keeps serverless alive after response.
  timestamp: 2026-03-07T00:00:45Z

## Evidence

- timestamp: 2026-03-07T00:00:30Z
  checked: orders table schema (001_schema.sql line 163-192)
  found: No `delivery_address` column exists. Orders have `address_id` FK to `addresses` table.
  implication: Any query selecting `delivery_address` from orders will fail with PostgREST error.

- timestamp: 2026-03-07T00:00:35Z
  checked: /api/admin/emails/send (route.ts line 88)
  found: Selects `delivery_address` column which doesn't exist on orders table
  implication: Query always fails -> returns "Order not found" for ALL orders, not just Stripe

- timestamp: 2026-03-07T00:00:35Z
  checked: /api/admin/emails/[id]/resend (route.ts line 88-89)
  found: Also selects `delivery_address` — same bug
  implication: Resend also always fails

- timestamp: 2026-03-07T00:00:35Z
  checked: /api/admin/emails/compose (route.ts line 74)
  found: Also selects `delivery_address` — same bug
  implication: Compose also always fails

- timestamp: 2026-03-07T00:00:45Z
  checked: /api/orders/[id]/verify-payment (route.ts line 99-108)
  found: Confirms order (pending->confirmed) but does NOT send confirmation email
  implication: When verify-payment runs before webhook, webhook sees order already confirmed and skips email

- timestamp: 2026-03-07T00:00:50Z
  checked: Stripe webhook handler (handlers.ts line 50-91)
  found: `.eq("status", "pending")` guard means if order already confirmed by verify-payment, 0 rows updated, email skipped
  implication: Race condition — verify-payment wins -> no email ever sent

- timestamp: 2026-03-07T00:01:30Z
  checked: typecheck and unit tests after fix
  found: `tsc --noEmit` passes, all 614 tests pass
  implication: Fix is type-safe and doesn't regress existing tests

## Resolution

root_cause: |
  TWO bugs:
  1. Admin email endpoints (send, resend, compose) query non-existent `delivery_address` column on orders table.
     PostgREST returns error, interpreted as "Order not found". Affects ALL orders, not just Stripe.
  2. verify-payment endpoint races with Stripe webhook. verify-payment confirms order but doesn't send email.
     Webhook sees order already confirmed, skips email. Result: confirmation email never sent for Stripe orders.
fix: |
  1. Replaced `delivery_address` with `addresses(line_1, line_2, city, state, postal_code)` FK join in all 3 email endpoints.
     Updated address property access from `line1`/`postalCode` to `line_1`/`postal_code` (DB column names).
  2. Added confirmation email sending to verify-payment endpoint using same pattern as webhook handler:
     `after()` + `sendEmail()` with same idempotency key to prevent duplicates if both webhook and verify-payment fire.
verification: typecheck passes, 614 unit tests pass
files_changed:
  - src/app/api/admin/emails/send/route.ts
  - src/app/api/admin/emails/[id]/resend/route.ts
  - src/app/api/admin/emails/compose/route.ts
  - src/app/api/orders/[id]/verify-payment/route.ts
