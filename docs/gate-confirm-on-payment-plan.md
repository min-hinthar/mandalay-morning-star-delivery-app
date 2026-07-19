# Incident #71DC108A — "confirmed for delivery" with a declined payment

## What happened

A customer's card **declined** at checkout, yet their order showed as **confirmed
for delivery**, and the order carried **no `stripe_payment_intent_id`**. We were
set to deliver food we were never paid for (revenue loss — the mirror image of the
stranded-payment series, which protected the _customer's_ money).

## Forensics (Stripe, read-only)

- Order short id `71DC108A`, customer `april.ny2012@gmail.com` (Aye Thu Thu Shein).
- PaymentIntent `pi_3Tu12GD7LsBxOcnN1T8mnSoJ` — **canceled**, `amount_received = 0`.
- Charge `ch_3Tu12GD7LsBxOcnN1fqYQZ7j` — **failed** (`card_declined` / `do_not_honor`,
  Amex ····2006 via Apple Pay, $112.71).
- **No successful charge exists — $0 captured.** COD ruled out (a real card decline
  exists; COD creates no Stripe session).

## Root cause

`PATCH /api/admin/orders/[id]/status` allowed `pending → confirmed` for a **Stripe**
order with **no payment gate**. The only payment-aware guard covered COD
(`pending_approval → confirmed`, routed to `/approve-cod`); there was **no
equivalent "Stripe must be paid" gate**. The admin one-click **"Confirm Order"**
button (`OrderDetailDrawer`) posts straight to that route, so an unpaid/declined
`pending` order could be confirmed by mistake — and that route never sets
`stripe_payment_intent_id`, exactly matching the null-PI fingerprint. The delivery
pipeline (route-builder → driver assign → route start) then trusts `status` alone,
so a confirmed-but-unpaid order is fully routable.

**Paid predicate (sound):** for a `stripe` order, `stripe_payment_intent_id IS NOT
NULL`. Only the `checkout.session.completed` webhook and `verify-payment` write that
column, and both verify real payment first (a `session_<id>` placeholder still
counts as paid). COD is exempt (approved via `/approve-cod`).

## Fix shipped (this PR — app-level, fully verified locally)

1. **Root cause — `/status` payment gate.** Reject moving a `payment_method !== 'cod'`
   order with a null `stripe_payment_intent_id` into any fulfillment status
   (`confirmed`/`preparing`/`out_for_delivery`/`delivered`). +regression test.
2. **Defense in depth — route creation.** `POST /api/admin/routes` rejects stripe +
   null-PI orders before creating stops (keeps a stray bad row out of a route).
3. **Admin UX.** `/api/admin/orders` returns a derived `awaiting_payment` flag (raw
   PI id is not leaked); `OrderDetailDrawer` shows a **"Payment not received"** badge
   and **disables the fulfillment actions** for unpaid card orders (Cancel stays
   enabled), so the mistake can't be made in the first place.

## Durable follow-up (needs Docker/Supabase local — NOT in this PR)

The app-level gate closes every realistic recurrence path. One theoretical hole
remains: a direct PostgREST write by an admin JWT (`orders_update_admin` RLS)
bypasses all API guards. A **DB trigger** closes it universally and enforces the
invariant as a true source of truth. Deferred because `db-drift` (needs Docker)
can't be validated in this session.

```sql
-- supabase/migrations/<timestamp>_gate_confirm_on_payment.sql
-- Function in app_private so it never leaks into public generated types
-- (gen:types introspects `public` only). Trigger (not CHECK) so existing rows
-- are not validated on deploy — the incident row can still be cancelled
-- (cancelled is not a fulfillment status). A `session_<id>` placeholder is
-- non-null, so legitimately-paid orders pass.
create schema if not exists app_private;

create or replace function app_private.enforce_paid_before_fulfillment()
returns trigger language plpgsql as $$
begin
  if new.status in ('confirmed','preparing','out_for_delivery','delivered')
     and new.payment_method <> 'cod'
     and new.stripe_payment_intent_id is null then
    raise exception
      'Order % cannot be % without a captured payment (stripe_payment_intent_id is null)',
      new.id, new.status using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function app_private.enforce_paid_before_fulfillment() from public;

drop trigger if exists trg_enforce_paid_before_fulfillment on public.orders;
create trigger trg_enforce_paid_before_fulfillment
  before insert or update of status on public.orders
  for each row execute function app_private.enforce_paid_before_fulfillment();
```

Validation checklist for the follow-up session: `supabase db start` applies clean →
`pnpm gen:types` shows **no** change to `database.generated.ts` (function is in
`app_private`) → `pnpm rls:test` + full suite green. Watch: a batch route-`start`
that includes a pre-existing bad row would now raise — remediate bad rows first.

## Immediate ops remediation for THIS order (owner action — no live DB/write access here)

`71DC108A` captured **$0**. Do **not** deliver. Either collect payment (send the
customer a fresh Stripe payment link / re-checkout) **or** cancel the order. Do
**not** write the canceled PI onto it.

```sql
-- Against the DELIVERY app DB (project ukuzkhuppqwtrdkjqrkv — NOT the MMS QR
-- Platform project attached to MCP). Confirm first, then cancel if unpaid:
select id, status, payment_method, stripe_payment_intent_id, total_cents
from orders where id::text ilike '71dc108a%';

update orders set status = 'cancelled', updated_at = now()
where id::text ilike '71dc108a%' and status <> 'cancelled';
```
