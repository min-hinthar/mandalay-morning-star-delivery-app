# V4: Launch-Ready MVP

> **Target:** Production-ready for real Saturday operations
> **Duration:** 10 weeks | **Start:** March 2026
> **Context:** Staging → Live | Solo operator | 20-50 orders/Sat | Family/friend drivers

---

## Findings Summary

| Severity | Count | Key Areas                                                                                                   |
| -------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| CRITICAL | 5     | Checkout cleanup bug, cutoff logic, ops dashboard, bulk ops, route assignment                               |
| HIGH     | 6     | Cart race condition, availability gate, Saturday messaging, cutoff config, webhook audit, email reliability |
| MEDIUM   | 14    | Error handling, validation gaps, driver UX, N+1 queries, rate limits                                        |
| LOW      | 2     | Pagination, missing indexes                                                                                 |

---

## Phase 0 — Critical Bug Fixes (Week 1)

**Goal:** Eliminate bugs that would cause production failures.

- [ ] **CQ-01** Fix checkout TOCTOU cleanup — `.eq()` → `.in()` with proper order_item_id array (`checkout/session/route.ts`)
- [ ] **BL-01** Fix `isPastCutoff()` — add full date+time comparison, not just time (`utils/delivery-dates.ts`)
- [ ] **BL-04** Add time window validation — `.refine()` against `TIME_WINDOWS` list (`validations/checkout.ts`)
- [ ] **CQ-02** Fix cart debounce race condition — timestamp-based dedup (`stores/cart-store.ts`)
- [ ] **BL-02** Re-validate coverage + cutoff at checkout submission (`checkout/session/route.ts`)
- [ ] Add quantity limit toast when silently capped

**Acceptance:** Unit tests pass. Order at Friday 3:01 PM rejected. Failed checkout cleans up DB. Cart can't produce duplicates.

---

## Phase 1 — Saturday Ops Dashboard (Weeks 2–3)

**Goal:** Solo operator triages 40 orders from one screen in <3 minutes.

- [ ] Ops center widget — order status counts with quick-action buttons
  - Pending: X → `[Confirm All]`
  - Confirmed: X → `[Mark Preparing]`
  - Preparing: X → `[Ready to Ship]`
  - Out for Delivery: X → `[In Progress]`
- [ ] Bulk operations — checkbox select + bulk status change
- [ ] Countdown timers — cutoff warning, delivery start time
- [ ] Unassigned orders badge — red indicator for orders not on a route
- [ ] Driver availability widget — who's ready, who hasn't arrived
- [ ] Time window grouping — orders by delivery slot (11am: 12, 1pm: 8)
- [ ] Toast confirmation + optimistic UI on all status changes

**Acceptance:** Bulk confirm 20 pending orders in one click. See all Saturday state at a glance.

---

## Phase 2 — Route & Driver Assignment (Weeks 4–5)

**Goal:** Create a 5-stop route in <30 seconds.

- [ ] "Unassigned Orders" panel — confirmed orders not on a route
- [ ] "Available Drivers" panel — drivers with capacity indicator
- [ ] One-click route creation — select orders + select driver = route
- [ ] Auto-suggest grouping by geography / time window
- [ ] Route summary — stop count, estimated duration, map preview
- [ ] Reassign orders between routes
- [ ] Driver ownership check on all driver API queries (SC-03)

**Acceptance:** Visual assignment from dashboard. No SQL needed. Unassigned count = 0 when done.

---

## Phase 3 — Customer Pre-Checkout Gate (Week 6)

**Goal:** Customer understands Saturday-only within 3 seconds of landing.

- [ ] Homepage hero — dynamic CTA: "Order for Saturday" or "Next delivery: Saturday Mar 7"
- [ ] Menu page banner — "Saturday Delivery 11am–7pm | Order by Friday 3pm"
- [ ] Cart drawer — show delivery date + cutoff countdown
- [ ] Checkout gate — past cutoff? Modal: "Ordering closed. Order for next Saturday."
- [ ] Update empty states with Saturday schedule context (UX-03)
- [ ] Order tracking — add polling indicator + "last updated" timestamp (UX-04)

**Acceptance:** Non-Saturday visitor sees schedule instantly. Past-cutoff user gets clear explanation, not error.

---

## Phase 4 — Configurable Business Rules (Week 7)

**Goal:** Change business rules from admin UI, no deploy needed.

Move to `app_settings` table:

- [ ] `cutoff_hour` + `cutoff_day` (currently hardcoded Friday 3PM)
- [ ] `delivery_fee_cents` (currently $15)
- [ ] `free_delivery_threshold_cents` (currently $100)
- [ ] `delivery_start_hour` / `delivery_end_hour`
- [ ] `max_delivery_radius_miles` / `max_delivery_duration_minutes`

Build:

- [ ] Admin Settings form to edit all values
- [ ] Server reads from `app_settings` instead of constants
- [ ] Cache: read once per request, TTL 5 minutes

**Acceptance:** Operator changes cutoff from 3PM to 5PM via Settings. Takes effect immediately.

---

## Phase 5 — Email Reliability (Week 8)

**Goal:** Every customer knows their order status. Admin can monitor + retry.

- [ ] Email failure tracking table — log attempts, failures, retries
- [ ] Admin email dashboard — failed emails with one-click retry
- [ ] Order detail indicator — "Email sent" / "Email pending" / "Email failed"
- [ ] Surface Resend webhook data in admin (delivered, opened, bounced)
- [ ] Fallback: 3 failures → flag order for manual contact
- [ ] Webhook audit logging — body hash + signature (SC-01)

**Acceptance:** Admin sees email status for every order. One-click retry for failures.

---

## Phase 6 — Driver Simplification (Week 9)

**Goal:** Non-technical family member completes 5 stops with zero training.

- [ ] Simple mode toggle — strip to: customer name, address, phone, `[Mark Delivered]`
- [ ] Confirmation dialogs — "Mark as delivered at 123 Main St?"
- [ ] One-tap customer contact — phone call / text button on each stop
- [ ] Offline instructions — "Route saved locally. Will sync when reconnected."
- [ ] Hide by default: route optimization comparison, exception modals, earnings dashboard

**Acceptance:** Family member completes route without training. No accidental "completed" on wrong stop.

---

## Phase 7 — Production Hardening (Week 10)

**Goal:** Ready for real traffic. Secure, monitored, performant.

- [ ] Rate limit fallback — reduce to 5 req/min, endpoint-specific limits (SC-02)
- [ ] Error context — specific catch blocks, correct HTTP status codes (CQ-05)
- [ ] N+1 fix — join driver info in order queries (PF-01)
- [ ] Admin pagination — total counts + "showing X of Y" (PF-02)
- [ ] Audit missing DB indexes (PF-03)
- [ ] Modifier price delta validation in checkout (reasonable bounds)
- [ ] Sentry integration review — all critical paths covered

**Acceptance:** Load test 50 concurrent orders. All API <500ms. No security warnings.

---

## What NOT to Build Yet

At 20-50 orders/Saturday with family/friend drivers, these are premature:

- Real-time GPS map for customers (text status updates suffice)
- Driver gamification / badges (family doesn't need this)
- Advanced analytics dashboards (simple counts + revenue enough)
- Route optimization algorithm (manual assignment fine at 2-4 drivers)
- Push notifications via service worker (email + text covers it)
- Customer loyalty / referral system (get first 50 regulars first)
- Multi-admin role system (solo operator for now)

Revisit when orders consistently exceed 100/week or driver pool expands.

---

## Pre-Launch Checklist

- [ ] All Phase 0 bugs fixed + tested
- [ ] Ops Dashboard functional (Phase 1)
- [ ] Route assignment works (Phase 2)
- [ ] Stripe webhook tested with real test payments
- [ ] Email delivery confirmed — all 4 templates
- [ ] **Full Saturday dry run:** 10 test orders through complete lifecycle
- [ ] DNS + domain on Vercel
- [ ] Supabase production instance (separate from staging)
- [ ] Production env vars set
- [ ] Sentry capturing in production
- [ ] Google Maps API billing enabled
- [ ] Resend domain verified
- [ ] CRON job (delivery reminders) scheduled
- [ ] Upstash Redis provisioned
- [ ] Database backup strategy in place
