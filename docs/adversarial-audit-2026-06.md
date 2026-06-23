# Adversarial Audit — June 2026

> Full-codebase adversarial review (not a diff review). Scope: security, correctness,
> payments/money, order lifecycle, RLS/RPC/storage, customer-facing email, perf, a11y,
> mobile/iOS-OOM budget, design-token purity, dead code.
>
> Method: parallel deep sweeps per surface, then **direct code verification of every
> flagged item** — several agent "HIGH"s were false positives and are recorded as such
> below (verifying the verifier is the point of an adversarial pass).

## Verdict

The **security/correctness core is solid.** Every big-ticket vulnerability surfaced was
already remediated in prior PRs (#173 lockdown, #174 + money-correctness money fixes).
This pass confirms those hold, fixes one live email-correctness bug, tightens admin-auth
consistency, and records the residual Low/Med items as fix-later.

| Severity | Open (this audit) | Fixed in this PR | By-design / accepted |
| -------- | ----------------- | ---------------- | -------------------- |
| High     | 0                 | 0                | —                    |
| Medium   | 2 (fix-later)     | 2                | 2                    |
| Low      | 7 (fix-later)     | 2                | several              |

## Fixed in this PR

1. **Tip dropped from admin status emails** (Med, correctness).
   `src/app/api/admin/orders/[id]/status/route.ts` hardcoded `tipCents: 0` and omitted
   `tip_cents` from the order select, so the **out_for_delivery / delivered** emails sent
   from the admin status route showed `Tip $0` and itemized rows that did not sum to the
   stored `total_cents`. The Stripe webhook path
   (`webhooks/stripe/handlers/checkout-session-completed.ts`) was already correct. Fix:
   select `tip_cents` and pass `orderData?.tip_cents ?? 0`.
2. **Inline admin-auth → shared `requireAdmin()`** (Low, consistency / defense-in-depth).
   `admin/settings/route.ts` and `admin/feedback/route.ts` hand-rolled
   `auth.getUser()` + `profiles.role` checks instead of `requireAdmin()`
   (`src/lib/auth/admin.ts`), which adds the JWT-claim fast path. Functionally equal;
   now consistent. (14 other admin routes use the same inline pattern — see L-1.)
3. **Hero ambient framer loops ticking offscreen** (Med, iOS-OOM / battery).
   `HeroAmbient.tsx` constellation `<m.line>`s and `FloatingEmoji.tsx` float glyphs ran
   `repeat: Infinity` framer JS loops gated only by `shouldAnimate` (or nothing) — not
   by in-view. `.hero-anim-paused` (CSS) can't stop framer JS, so they kept ticking
   after the hero scrolled away (the documented iOS-WebKit-memory gotcha). Fix: gate the
   constellation on `shouldAnimate && useInView(ref)`; thread a `paused={!heroInView}`
   prop into `FloatingEmoji` so it drops to its static render offscreen. Matches the
   `CheckoutStepperV8` `loop = shouldAnimate && inView` pattern.

## Open findings (fix-later)

### Medium

- **M-1 · `delivery_photos` storage read scope too broad.** Baseline policy
  `delivery_photos_select` grants SELECT to **all authenticated users**, not just the
  order's customer + assigned driver + admin. Low live exposure (paths are opaque UUIDs,
  bucket isn't listable to clients), but a cross-customer read is possible with a guessed
  path. Fix = tighten the policy via a new timestamped migration + `pnpm gen:types`
  (needs the local Supabase stack so the `db-drift` guard passes — out of scope for this
  report-only pass). `supabase/migrations/00000000000000_baseline.sql`.
- **M-2 · Checkout idempotency key (Phase-111 TODO).** `checkout/session/route.ts` keys
  Stripe idempotency on `order.id`; if a refactor ever regenerates `order.id` on client
  retry, duplicate sessions become possible. Current callers reuse the same id, so not
  live. Proper fix = a request-level UUID minted per "Place Order" click, deduped
  server-side.

### Low

- **L-1 · 14 more admin routes use inline role checks.** Same pattern as the two fixed
  above (functionally correct, no fast path): `admin/settings/restore`,
  `admin/routes/[id]/stops/*`, `admin/routes/[id]/exceptions/*`, `admin/feedback/[id]`,
  `admin/drivers/[id]/*`, `admin/analytics/*`. Recommend a follow-up PR converting them
  to `requireAdmin()` (mechanical, but touches many endpoints — keep isolated + verified).
- **L-2 · Welcome email not logged.** `src/lib/email/welcome.ts` sends directly via
  `getResendClient()`, bypassing `sendEmail()` — so it's absent from `notification_logs`.
  The send itself is idempotent (atomic `welcomed_at` claim) and safe. Routing it through
  `sendEmail()` requires adding a `welcome` value to the DB `notification_type` enum (a
  migration), so it's deferred rather than a one-line change.
- **L-3 · Delivery-reminder cron double-send race.**
  `api/cron/delivery-reminders/route.ts` dedups via SELECT-then-INSERT on
  `notification_logs` with no lock; two overlapping cron invocations could each send.
  Real fix = a unique index on `(order_id, notification_type, day)` (migration).
- **L-4 · `arriving_soon` is dead.** Present in `CustomerEmailType` and
  `mapTypeToPrefKey` (`src/lib/email/types.ts`) but no template/trigger exists. Remove or
  implement.
- **L-5 · `EMAIL_CC` blanket admin copy / magic-link fragility.** `sendEmail()` CC's
  every customer email to the admin inbox (by design, for monitoring), and the magic-link
  email stays safe only because it bypasses `sendEmail()`. If a future refactor routes it
  through `sendEmail()`, the one-time token would land in the shared inbox. Add an
  explicit `type === "auth"` CC-skip guard before that ever happens.
- **L-6 · Status-email `idempotencyKey: Date.now()`** (`admin/orders/[id]/status`).
  Defeats Resend's dedup across separate requests — but here that's _intended_ (a
  legitimate `delivered → out_for_delivery → delivered` re-transition should re-notify).
  Within a single `sendEmail` call the key is stable, so the internal 3× retry does not
  double-send. The **admin email-resend route** uses the same `Date.now()` pattern, where
  a network-retried POST _can_ double-send — make that one deterministic.
- **L-7 · A few hardcoded hex colors.** Inline `style` hexes in
  `admin/.../ManualEmailDialog.tsx` (email-preview markup — acceptable) and map/marker
  colors in `CoverageRouteMap` / `SimulatedPins` / `DeliveryDayMap` / `RouteBuilderMap`
  (Leaflet/SVG library escapes — acceptable). No token-system regression.

## By-design / accepted (no change)

- **`app_settings` is world-readable** (`USING (true)`). Intentional (public delivery
  metadata). Guard: keep secrets out of this table — if sensitive config is ever added,
  move it to an admin-only `internal_settings` table.
- **Refund double-email** is already guarded by the `source === 'admin-item-refund'` tag
  in `charge-refunded.ts`; a manual Stripe-dashboard refund sends only the generic email
  (correct, not a duplicate).
- **`after()`-wrapped email sends are not silent.** `sendEmail()` retries 3×, then on
  final failure logs a `failed` row to `notification_logs` **and** flags the order
  `needs_contact = true` for manual follow-up (`src/lib/email/send.ts`).

## False positives caught (recorded so the next pass doesn't re-flag)

- **"Route-start partial failure leaves orders undeliverable" (claimed HIGH).** False —
  `driver/routes/[routeId]/start/route.ts` is already idempotent: re-entry when route is
  `in_progress`, first-stop promotion guarded `.eq("status","pending")`, order batch
  transition guarded `.in("status",["confirmed","preparing"])` and surfaced as 500 so the
  whole start is retryable. Matches the existing CLAUDE.md gotcha.
- **"Admin status regress double-counts loyalty" (claimed HIGH).** Benign — milestone
  rewards are issued idempotently on **payment** (webhook / COD-approval), not on status
  flips; tier is recomputed from current status set. No double-count.
- **"`text-hero-*` / `bg-hero-*` utilities emit no CSS — BLOCKING" (claimed HIGH).**
  False — the agent only inspected `tailwind.config.ts`. Tailwind v4 generates these from
  the `@theme inline` block in `globals.css` (`--color-hero-ink: var(--hero-ink)`, …,
  lines 146–152). All hero/menu utilities are emitted; the live design proves it.
- **Email idempotency "duplicate-send on every retry — HIGH" ×3.** Overstated — the key
  is evaluated once per `sendEmail` call and held across the internal retry loop, so a
  single call never double-sends. Only the cross-request admin-resend case is real
  (downgraded to L-6).

## Verified-secure (checked this pass, held)

- **Money math** server-authoritative: delivery fee, tax (10.5%), and totals are
  recomputed server-side (`lib/utils/order.ts`, `checkout/session/route.ts`); the client
  cannot tamper the fee/total. Percent coupons discount **subtotal only** (converted to a
  one-off `amount_off` at session creation) — tax/tip no longer shaved.
- **Webhooks** verify signature, dedup on a UNIQUE `webhook_events.event_id`, return 500
  on DB error for Stripe retry, and never swallow into 200.
- **RLS / RPC lockdown** (PR #173) holds: `create_order_with_items` and the driver-GPS /
  streak RPCs are auth-bound + revoked from anon/PUBLIC; orders RLS allows driver +
  customer-cancel transitions via `app_private.order_on_my_route()`; the
  `feedback-attachments` bucket is private (admin signed-URLs only).
- **Loyalty** net-spend = `subtotal − discount − refunds` over paid statuses;
  `pending_approval` (unpaid COD) excluded; milestones idempotent via a unique constraint;
  refunds reduce spend retroactively.
- **Refunds** idempotent: `apply_item_refunds` is atomic (row lock + audit row), Stripe
  refund is a delta against the cumulative audited total with an idempotency key.

## A11y / perf / mobile-budget sweep

The mobile/iOS-OOM budget is **well-honored** across the surfaces checked — the two
`repeat: Infinity` gaps above were the only real violations; both are fixed in this PR.
Clean patterns confirmed (no change needed):

- **Modal/backdrop blur is mobile-safe** — `Modal.tsx` uses `sm:backdrop-blur-*`
  (blur only ≥ `sm`), never on mobile; the iOS-OOM rule holds.
- **Inputs are 16px on mobile** — `input.tsx` / `ValidatedInput.tsx` default to
  `text-base` (no iOS focus auto-zoom).
- **`HeroAmbient` heavy layers are FX-budget-gated** — auroras / orb `blur()` /
  spotlight render only on rich tiers (`fx.auroras`/`orbBlur`/`spotlight`); lite/mobile
  gets radial-gradient falloffs, not `blur()` backing stores.
- **Decorative layers** consistently carry `aria-hidden` + `pointer-events-none`.
- **`CheckoutStepperV8`** is the reference gate (`loop = shouldAnimate && inView`) — no
  change.
- No `void asyncFn()` fire-and-forget found on the customer paths (promo fetches `await`).

Residual a11y/perf items are folded into L-7 (hardcoded map/SVG hexes) above; nothing
else rose above Low.
