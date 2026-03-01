# Requirements: Morning Star Delivery App

**Defined:** 2026-03-01
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.9 Requirements

Requirements for Launch-Ready MVP. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Fix checkout TOCTOU cleanup — `.eq()` → `.in()` with proper order_item_id array
- [ ] **BUG-02**: Fix `isPastCutoff()` — add full date+time comparison, not just time
- [ ] **BUG-03**: Add time window validation — `.refine()` against `TIME_WINDOWS` list
- [ ] **BUG-04**: Fix cart debounce race condition — timestamp-based dedup
- [ ] **BUG-05**: Re-validate coverage + cutoff at checkout submission
- [ ] **BUG-06**: Add quantity limit toast when silently capped
- [ ] **BUG-07**: Unify refund and status transition logic — add 'refunded' status
- [ ] **BUG-08**: Re-validate modifiers against DB at checkout — stale cart warning

### Ops Dashboard

- [ ] **OPS-01**: Ops center widget with order status counts and quick-action buttons
- [ ] **OPS-02**: Bulk operations — checkbox select + bulk status change
- [ ] **OPS-03**: Countdown timers — cutoff warning and delivery start time
- [ ] **OPS-04**: Unassigned orders badge — red indicator for orders not on a route
- [ ] **OPS-05**: Driver availability widget — who's ready, who hasn't arrived
- [ ] **OPS-06**: Time window grouping — orders by delivery slot
- [ ] **OPS-07**: Toast confirmation + optimistic UI on status changes

### Route Assignment

- [ ] **ROUTE-01**: Unassigned orders panel — confirmed orders not on a route
- [ ] **ROUTE-02**: Available drivers panel — drivers with capacity indicator
- [ ] **ROUTE-03**: One-click route creation — select orders + driver = route
- [ ] **ROUTE-04**: Auto-suggest grouping by geography / time window
- [ ] **ROUTE-05**: Route summary — stop count, estimated duration, map preview
- [ ] **ROUTE-06**: Reassign orders between routes
- [ ] **ROUTE-07**: Driver ownership check on all driver API queries

### Customer Gate

- [ ] **GATE-01**: Homepage hero — dynamic CTA based on delivery availability
- [ ] **GATE-02**: Menu page banner — Saturday delivery schedule + cutoff
- [ ] **GATE-03**: Cart drawer — show delivery date + cutoff countdown
- [ ] **GATE-04**: Checkout gate — past cutoff modal with next Saturday date
- [ ] **GATE-05**: Update empty states with Saturday schedule context
- [ ] **GATE-06**: Order tracking — polling indicator + "last updated" timestamp

### Business Rules

- [ ] **RULES-01**: `cutoff_hour` + `cutoff_day` configurable via admin settings
- [ ] **RULES-02**: `delivery_fee_cents` configurable via admin settings
- [ ] **RULES-03**: `free_delivery_threshold_cents` configurable via admin settings
- [ ] **RULES-04**: `delivery_start_hour` / `delivery_end_hour` configurable
- [ ] **RULES-05**: `max_delivery_radius_miles` / `max_delivery_duration_minutes` configurable
- [ ] **RULES-06**: Admin Settings form to edit all values
- [ ] **RULES-07**: Server reads from `app_settings` instead of constants with 5min cache
- [ ] **RULES-08**: Customer pages display configured delivery fee, cutoff time, and delivery hours dynamically (menu banner, cart, checkout, homepage hero)
- [ ] **RULES-09**: Admin ops dashboard uses configured cutoff/delivery times for countdown timers
- [ ] **RULES-10**: Changes take effect immediately on next page load (cache bust via `revalidateTag`)

### Email Reliability

- [ ] **EMAIL-01**: Email failure tracking table — log attempts, failures, retries
- [ ] **EMAIL-02**: Admin email dashboard — failed emails with one-click retry
- [ ] **EMAIL-03**: Order detail indicator — email sent/pending/failed status
- [ ] **EMAIL-04**: Surface Resend webhook data in admin (delivered, opened, bounced)
- [ ] **EMAIL-05**: Fallback — 3 failures flag order for manual contact
- [ ] **EMAIL-06**: Webhook audit logging — body hash + signature verification

### Driver Simplification

- [ ] **DRV-01**: Simple mode toggle — strip to essentials (name, address, phone, mark delivered)
- [ ] **DRV-02**: Confirmation dialogs — "Mark as delivered at [address]?"
- [ ] **DRV-03**: One-tap customer contact — phone call / text button on each stop
- [ ] **DRV-04**: Offline instructions — "Route saved locally. Will sync when reconnected."
- [ ] **DRV-05**: Hide by default — route optimization, exception modals, earnings dashboard

### Production Hardening

- [ ] **HARD-01**: Rate limit fallback — reduce to 5 req/min, endpoint-specific limits
- [ ] **HARD-02**: Error context — specific catch blocks, correct HTTP status codes
- [ ] **HARD-03**: N+1 fix — join driver info in order queries
- [ ] **HARD-04**: Admin pagination — total counts + "showing X of Y"
- [ ] **HARD-05**: Audit missing DB indexes
- [ ] **HARD-06**: Modifier price delta validation in checkout
- [ ] **HARD-07**: Sentry integration review — all critical paths covered

## Future Requirements

Deferred to post-launch. Tracked but not in current roadmap.

### Quality & Accessibility (from original v1.9 plan)

- **A11Y-01**: WCAG 2.1 AA compliance across all roles
- **A11Y-02**: High-contrast mode integration
- **A11Y-03**: Full prefers-reduced-motion compliance
- **I18N-01**: next-intl infrastructure with Myanmar/English
- **I18N-02**: Customer pages bilingual display
- **DX-01**: Storybook stories for 8+ core components
- **DX-02**: Chromatic visual regression baselines
- **TEST-01**: Component unit tests for checkout, cart, orders
- **TEST-02**: Webhook & integration tests

### Advanced Features

- **ADV-01**: Real-time GPS tracking map for customers
- **ADV-02**: Driver gamification / badges
- **ADV-03**: Route optimization algorithm
- **ADV-04**: Push notifications via service worker
- **ADV-05**: Customer loyalty / referral system
- **ADV-06**: Multi-admin role system

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time GPS map for customers | Text status updates suffice at 20-50 orders |
| Driver gamification/badges | Family drivers don't need gamification |
| Route optimization algorithm | Manual assignment fine at 2-4 drivers |
| Push notifications | Email + text covers this volume |
| Customer loyalty/referral | Get first 50 regulars first |
| Multi-admin roles | Solo operator for now |
| Drag-and-drop route ordering | Click-to-assign faster at this scale (research confirmed) |
| Supabase Realtime for ops | 5s polling indistinguishable from real-time at 20-50 orders |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | — | Pending |
| BUG-02 | — | Pending |
| BUG-03 | — | Pending |
| BUG-04 | — | Pending |
| BUG-05 | — | Pending |
| BUG-06 | — | Pending |
| BUG-07 | — | Pending |
| BUG-08 | — | Pending |
| OPS-01 | — | Pending |
| OPS-02 | — | Pending |
| OPS-03 | — | Pending |
| OPS-04 | — | Pending |
| OPS-05 | — | Pending |
| OPS-06 | — | Pending |
| OPS-07 | — | Pending |
| ROUTE-01 | — | Pending |
| ROUTE-02 | — | Pending |
| ROUTE-03 | — | Pending |
| ROUTE-04 | — | Pending |
| ROUTE-05 | — | Pending |
| ROUTE-06 | — | Pending |
| ROUTE-07 | — | Pending |
| GATE-01 | — | Pending |
| GATE-02 | — | Pending |
| GATE-03 | — | Pending |
| GATE-04 | — | Pending |
| GATE-05 | — | Pending |
| GATE-06 | — | Pending |
| RULES-01 | — | Pending |
| RULES-02 | — | Pending |
| RULES-03 | — | Pending |
| RULES-04 | — | Pending |
| RULES-05 | — | Pending |
| RULES-06 | — | Pending |
| RULES-07 | — | Pending |
| RULES-08 | — | Pending |
| RULES-09 | — | Pending |
| RULES-10 | — | Pending |
| EMAIL-01 | — | Pending |
| EMAIL-02 | — | Pending |
| EMAIL-03 | — | Pending |
| EMAIL-04 | — | Pending |
| EMAIL-05 | — | Pending |
| EMAIL-06 | — | Pending |
| DRV-01 | — | Pending |
| DRV-02 | — | Pending |
| DRV-03 | — | Pending |
| DRV-04 | — | Pending |
| DRV-05 | — | Pending |
| HARD-01 | — | Pending |
| HARD-02 | — | Pending |
| HARD-03 | — | Pending |
| HARD-04 | — | Pending |
| HARD-05 | — | Pending |
| HARD-06 | — | Pending |
| HARD-07 | — | Pending |

**Coverage:**
- v1.9 requirements: 49 total
- Mapped to phases: 0
- Unmapped: 49

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
