# Requirements: Morning Star Delivery App

**Defined:** 2026-03-01
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.9 Requirements

Requirements for Launch-Ready MVP. Each maps to roadmap phases.

### Bug Fixes

- [x] **BUG-01**: Fix checkout TOCTOU cleanup — `.eq()` → `.in()` with proper order_item_id array
- [x] **BUG-02**: Fix `isPastCutoff()` — add full date+time comparison, not just time
- [x] **BUG-03**: Add time window validation — `.refine()` against `TIME_WINDOWS` list
- [x] **BUG-04**: Fix cart debounce race condition — timestamp-based dedup
- [x] **BUG-05**: Re-validate coverage + cutoff at checkout submission
- [x] **BUG-06**: Add quantity limit toast when silently capped
- [x] **BUG-07**: Unify refund and status transition logic — add 'refunded' status
- [x] **BUG-08**: Re-validate modifiers against DB at checkout — stale cart warning

### Ops Dashboard

- [x] **OPS-01**: Ops center widget with order status counts and quick-action buttons
- [x] **OPS-02**: Bulk operations — checkbox select + bulk status change
- [x] **OPS-03**: Countdown timers — cutoff warning and delivery start time
- [x] **OPS-04**: Unassigned orders badge — red indicator for orders not on a route
- [x] **OPS-05**: Driver availability widget — who's ready, who hasn't arrived
- [x] **OPS-06**: Time window grouping — orders by delivery slot
- [x] **OPS-07**: Toast confirmation + optimistic UI on status changes

### Route Assignment

- [x] **ROUTE-01**: Unassigned orders panel — confirmed orders not on a route
- [x] **ROUTE-02**: Available drivers panel — drivers with capacity indicator
- [x] **ROUTE-03**: One-click route creation — select orders + driver = route
- [x] **ROUTE-04**: Auto-suggest grouping by geography / time window
- [x] **ROUTE-05**: Route summary — stop count, estimated duration, map preview
- [x] **ROUTE-06**: Reassign orders between routes
- [x] **ROUTE-07**: Driver ownership check on all driver API queries

### Customer Gate

- [x] **GATE-01**: Homepage hero — dynamic CTA based on delivery availability
- [x] **GATE-02**: Menu page banner — Saturday delivery schedule + cutoff
- [x] **GATE-03**: Cart drawer — show delivery date + cutoff countdown
- [x] **GATE-04**: Checkout gate — past cutoff modal with next Saturday date
- [x] **GATE-05**: Update empty states with Saturday schedule context
- [x] **GATE-06**: Order tracking — polling indicator + "last updated" timestamp

### Business Rules

- [x] **RULES-01**: `cutoff_hour` + `cutoff_day` configurable via admin settings
- [x] **RULES-02**: `delivery_fee_cents` configurable via admin settings
- [x] **RULES-03**: `free_delivery_threshold_cents` configurable via admin settings
- [x] **RULES-04**: `delivery_start_hour` / `delivery_end_hour` configurable
- [x] **RULES-05**: `max_delivery_radius_miles` / `max_delivery_duration_minutes` configurable
- [x] **RULES-06**: Admin Settings form to edit all values
- [x] **RULES-07**: Server reads from `app_settings` instead of constants with 5min cache
- [x] **RULES-08**: Customer pages display configured delivery fee, cutoff time, and delivery hours dynamically (menu banner, cart, checkout, homepage hero)
- [x] **RULES-09**: Admin ops dashboard uses configured cutoff/delivery times for countdown timers
- [x] **RULES-10**: Changes take effect immediately on next page load (cache bust via `revalidateTag`)

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
| BUG-01 | Phase 77 | Complete |
| BUG-02 | Phase 77 | Complete |
| BUG-03 | Phase 77 | Complete |
| BUG-04 | Phase 77 | Complete |
| BUG-05 | Phase 77 | Complete |
| BUG-06 | Phase 77 | Complete |
| BUG-07 | Phase 77 | Complete |
| BUG-08 | Phase 77 | Complete |
| OPS-01 | Phase 79 | Complete |
| OPS-02 | Phase 79 | Complete |
| OPS-03 | Phase 79 | Complete |
| OPS-04 | Phase 79 | Complete |
| OPS-05 | Phase 79 | Complete |
| OPS-06 | Phase 79 | Complete |
| OPS-07 | Phase 79 | Complete |
| ROUTE-01 | Phase 80 | Complete |
| ROUTE-02 | Phase 80 | Complete |
| ROUTE-03 | Phase 80 | Complete |
| ROUTE-04 | Phase 80 | Complete |
| ROUTE-05 | Phase 80 | Complete |
| ROUTE-06 | Phase 80 | Complete |
| ROUTE-07 | Phase 80 | Complete |
| GATE-01 | Phase 81 | Complete |
| GATE-02 | Phase 81 | Complete |
| GATE-03 | Phase 81 | Complete |
| GATE-04 | Phase 81 | Complete |
| GATE-05 | Phase 81 | Complete |
| GATE-06 | Phase 81 | Complete |
| RULES-01 | Phase 78 | Complete |
| RULES-02 | Phase 78 | Complete |
| RULES-03 | Phase 78 | Complete |
| RULES-04 | Phase 78 | Complete |
| RULES-05 | Phase 78 | Complete |
| RULES-06 | Phase 78 | Complete |
| RULES-07 | Phase 78 | Complete |
| RULES-08 | Phase 78 | Complete |
| RULES-09 | Phase 79 | Complete |
| RULES-10 | Phase 78 | Complete |
| EMAIL-01 | Phase 82 | Pending |
| EMAIL-02 | Phase 82 | Pending |
| EMAIL-03 | Phase 82 | Pending |
| EMAIL-04 | Phase 82 | Pending |
| EMAIL-05 | Phase 82 | Pending |
| EMAIL-06 | Phase 82 | Pending |
| DRV-01 | Phase 83 | Pending |
| DRV-02 | Phase 83 | Pending |
| DRV-03 | Phase 83 | Pending |
| DRV-04 | Phase 83 | Pending |
| DRV-05 | Phase 83 | Pending |
| HARD-01 | Phase 84 | Pending |
| HARD-02 | Phase 84 | Pending |
| HARD-03 | Phase 84 | Pending |
| HARD-04 | Phase 84 | Pending |
| HARD-05 | Phase 84 | Pending |
| HARD-06 | Phase 84 | Pending |
| HARD-07 | Phase 84 | Pending |

**Coverage:**
- v1.9 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-02 after Phase 85 verification (BUG-01–08 verified complete in Phase 77)*
