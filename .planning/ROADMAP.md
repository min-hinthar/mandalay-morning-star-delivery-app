# Roadmap: Morning Star Delivery App

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-01-23)
- ✅ **v1.1 Tech Debt** — Phases 9-14 (shipped 2026-01-23)
- ✅ **v1.2 Playful UI Overhaul** — Phases 15-24 (shipped 2026-01-27)
- ✅ **v1.3 Full Codebase Consolidation** — Phases 25-34 (shipped 2026-01-28)
- ✅ **v1.4 Mobile Excellence** — Phases 35-39 (shipped 2026-02-05)
- ✅ **v1.5 Performance & Repo Health** — Phases 40-47 (shipped 2026-02-07)
- ✅ **v1.6 Production Polish** — Phases 48-57 (shipped 2026-02-13)
- ✅ **v1.7 Production Deployment & Readiness** — Phases 58-66 (shipped 2026-02-16)
- ✅ **v1.8 Post-Launch Hardening & Driver Experience** — Phases 67-74 (shipped 2026-02-19)
- ✅ **v1.8 Gap Closure** — Phases 75-76 (shipped 2026-02-26)
- **v1.9 Launch-Ready MVP** — Phases 77-86 (in progress)

## Phases

<details>
<summary>v1.7 Production Deployment & Readiness (Phases 58-66) -- SHIPPED 2026-02-16</summary>

- [x] Phase 58: Deployment Verification (2/2 plans) -- completed 2026-02-14
- [x] Phase 59: Monitoring & Error Tracking (2/2 plans) -- completed 2026-02-14
- [x] Phase 60: LCP Optimization (3/3 plans) -- completed 2026-02-14
- [x] Phase 61: Admin Pages (5/5 plans) -- completed 2026-02-14
- [x] Phase 62: Production Operations (4/4 plans) -- completed 2026-02-14
- [x] Phase 63: Branding & Compliance (3/3 plans) -- completed 2026-02-15
- [x] Phase 64: Service Worker Hardening (5/5 plans) -- completed 2026-02-15
- [x] Phase 65: CI/CD Hardening (1/1 plan) -- completed 2026-02-15
- [x] Phase 66: Backlog Cleanup (7/7 plans) -- completed 2026-02-15

</details>

<details>
<summary>v1.8 Post-Launch Hardening & Driver Experience (Phases 67-74) -- SHIPPED 2026-02-19</summary>

- [x] Phase 67: CSP & Security Headers (3/3 plans) -- completed 2026-02-17
- [x] Phase 68: RLS Audit & Hardening (3/3 plans) -- completed 2026-02-17
- [x] Phase 69: Distributed Rate Limiting (3/3 plans) -- completed 2026-02-18
- [x] Phase 70: Role-Based Auth Redirects (3/3 plans) -- completed 2026-02-19
- [x] Phase 71: Driver Profile Setup (2/2 plans) -- completed 2026-02-19
- [x] Phase 72: Driver Earnings Dashboard (3/3 plans) -- completed 2026-02-19
- [x] Phase 73: Driver Availability & Route Visibility (3/3 plans) -- completed 2026-02-19
- [x] Phase 74: Guided Walkthrough & Driver UI Polish (3/3 plans) -- completed 2026-02-19

</details>

<details>
<summary>v1.8 Gap Closure (Phases 75-76) -- SHIPPED 2026-02-26</summary>

- [x] Phase 75: Fix Security & Navigation Wiring (SEC-02, DPROF-05) -- 1/1 plans -- completed 2026-02-26
- [x] Phase 76: Surface Hidden Components & Dead Code Cleanup (DDASH-07) -- 1/1 plans -- completed 2026-02-26

</details>

### v1.9 Launch-Ready MVP (Phases 77-84)

**Milestone Goal:** Production-ready for real Saturday operations -- solo operator triaging 20-50 orders with family/friend drivers.

- [x] **Phase 77: Critical Bug Fixes** - Fix checkout TOCTOU, cutoff logic, cart race condition, and data integrity issues (5/5 plans) -- completed 2026-03-01
- [x] **Phase 78: Configurable Business Rules** - Admin-editable settings replace all hardcoded constants (no deploy needed) (completed 2026-03-01)
- [x] **Phase 79: Saturday Ops Dashboard** - Single-screen command center for Saturday order triage with bulk operations (completed 2026-03-01)
- [x] **Phase 80: Route & Driver Assignment** - Visual dashboard for creating routes and assigning drivers to orders (completed 2026-03-02)
- [ ] **Phase 81: Customer Pre-Checkout Gate** - Saturday-only messaging and cutoff enforcement across customer pages
- [ ] **Phase 82: Email Reliability** - Failure tracking, retry, webhook verification, and self-service recovery
- [ ] **Phase 83: Driver Simplification** - Simple mode for non-technical family drivers (name, address, phone, deliver)
- [ ] **Phase 84: Production Hardening** - Indexes, N+1 fixes, rate limit tuning, and pre-launch checklist
- [ ] **Phase 85: Phase 77 Verification & Bug Traceability** - Verify bug fixes, create VERIFICATION.md, update traceability (gap closure)
- [ ] **Phase 86: Deferred Integration & Tech Debt Cleanup** - Wire remaining cutoff callsites to DB, fix SUMMARY frontmatter (gap closure)

## Phase Details

### Phase 77: Critical Bug Fixes
**Goal**: Checkout and cart operations produce correct, consistent results under all timing conditions
**Depends on**: Nothing (first phase -- unblocks everything)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08
**Success Criteria** (what must be TRUE):
  1. Checkout cleanup deletes exactly the items belonging to the current order (no orphaned or cross-order deletions)
  2. Orders placed after Saturday cutoff are rejected with a clear "next Saturday" message, regardless of what day/time the user visits
  3. Rapid add-to-cart clicks produce the correct final quantity (no duplicates, no lost updates)
  4. Stale modifier prices in the cart are detected and surfaced to the user before payment
  5. Refund status is tracked as a distinct order state visible in admin
**Plans**: 5 (complete)

### Phase 78: Configurable Business Rules
**Goal**: Operator changes delivery fee, cutoff time, and delivery hours from admin settings without a code deploy
**Depends on**: Phase 77 (bug fixes stabilize cutoff logic that settings will control)
**Requirements**: RULES-01, RULES-02, RULES-03, RULES-04, RULES-05, RULES-06, RULES-07, RULES-08, RULES-10
**Success Criteria** (what must be TRUE):
  1. Admin can edit cutoff day/hour, delivery fee, free delivery threshold, delivery hours, and radius from a single settings page
  2. Customer-facing pages (menu banner, cart, checkout, hero, order confirmation) display the configured delivery fee and cutoff time -- not hardcoded values
  3. Changes take effect on the next page load without a deploy (verified by changing a value and refreshing)
  4. Invalid settings are rejected with clear validation errors (e.g., cutoff_hour outside 0-23)
  _Note: RULES-09 (ops countdown timers) deferred to Phase 79 where the ops dashboard is built._
**Plans**: 4 plans
Plans:
- [ ] 78-01-PLAN.md -- Foundation: settings library, migration, schema extension, cache invalidation
- [ ] 78-02-PLAN.md -- Server consumer migration: delivery-dates, order, checkout route
- [ ] 78-03-PLAN.md -- Admin form enhancement: subsections, cutoff inputs, confirmation diff dialog
- [ ] 78-04-PLAN.md -- Client consumer migration: replace constant imports with props, remove dead constants

### Phase 79: Saturday Ops Dashboard
**Goal**: Operator answers "what needs attention right now?" from a single screen in under 3 seconds
**Depends on**: Phase 78 (countdown timers consume configured cutoff/delivery times)
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07
**Success Criteria** (what must be TRUE):
  1. Ops center shows live order counts by status (pending, confirmed, preparing, out, delivered) with 5-second auto-refresh
  2. Operator can select multiple orders via checkboxes and change their status in a single bulk action
  3. Countdown timers show time remaining until cutoff and delivery start, sourced from configured settings
  4. A red badge shows the count of unassigned orders (confirmed but not on any route)
  5. Driver availability widget shows which drivers are ready and who hasn't checked in
**Plans**: 3 plans
Plans:
- [x] 79-01-PLAN.md -- Foundation: types, helpers, hooks, API endpoint, unit tests, admin nav link
- [x] 79-02-PLAN.md -- Core UI: page shell, countdown bar, KPI grid, order list, bulk toolbar
- [x] 79-03-PLAN.md -- Driver panel, OpsCenter wiring, end-to-end verification

### Phase 80: Route & Driver Assignment
**Goal**: Operator creates delivery routes and assigns drivers without texting or spreadsheets
**Depends on**: Phase 79 (shares unassigned orders data layer and ops context)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05, ROUTE-06, ROUTE-07
**Success Criteria** (what must be TRUE):
  1. Unassigned orders panel shows all confirmed orders not yet on a route, filterable by time window
  2. Operator selects orders + a driver and creates a route in one click (atomic -- no orphaned routes on failure)
  3. Route summary shows stop count, estimated duration, and a map preview with pins
  4. Orders can be reassigned between existing routes
  5. Driver API queries enforce ownership -- drivers only see their own routes and stops
**Plans**: Plan 01 (DONE - clustering, Leaflet, validation), Plan 02 (DONE - route builder UI, Leaflet map, driver selector), Plans 03-04 (pending)

### Phase 81: Customer Pre-Checkout Gate
**Goal**: Customers always know when the next delivery is, whether they can still order, and what happens if they cannot
**Depends on**: Phase 78 (cutoff modal displays database-driven cutoff time, not hardcoded)
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06
**Success Criteria** (what must be TRUE):
  1. Homepage hero CTA changes dynamically based on whether ordering is currently open or closed
  2. Menu page banner shows the upcoming Saturday delivery date and time until cutoff
  3. Cart drawer displays the delivery date and a live cutoff countdown
  4. Past-cutoff checkout attempt shows a modal with the next available Saturday date (not a generic error)
  5. Order tracking page shows a polling indicator and "last updated X ago" timestamp
**Plans**: 3 plans
Plans:
- [ ] 81-01-PLAN.md -- Foundation: useDeliveryGate hook, useCountdown relocation, DeliveryBanner/CutoffModal components
- [ ] 81-02-PLAN.md -- Hero dynamic CTA + countdown, menu page delivery banner
- [ ] 81-03-PLAN.md -- Cart delivery info, checkout cutoff gate, empty states, tracking enhancement

### Phase 82: Email Reliability
**Goal**: Operator can self-diagnose and recover from email delivery failures without developer help
**Depends on**: Phase 77 (stable order states required for email status tracking)
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05, EMAIL-06
**Success Criteria** (what must be TRUE):
  1. Every email send attempt is logged with status (sent, delivered, failed, bounced) in a trackable table
  2. Admin email dashboard shows failed emails with a one-click retry button
  3. Order detail page shows whether the confirmation email was sent, delivered, or failed
  4. After 3 failed attempts, the order is flagged for manual customer contact
  5. Resend webhook payloads are verified via signature check before processing (no forged updates)
**Plans**: TBD

### Phase 83: Driver Simplification
**Goal**: A non-technical family member completes a delivery route without any verbal instructions
**Depends on**: Phase 77 (stable order/delivery states)
**Requirements**: DRV-01, DRV-02, DRV-03, DRV-04, DRV-05
**Success Criteria** (what must be TRUE):
  1. Simple mode shows only: customer name, address (tap opens Maps), phone (tap calls), and a large "Mark Delivered" button
  2. Marking an order as delivered requires explicit confirmation ("Mark as delivered at [address]?")
  3. Complex UI sections (route optimization, exception modals, earnings dashboard) are hidden in simple mode
  4. Simple mode preference persists across devices (stored server-side, not localStorage)
  5. Offline instructions are displayed when connectivity is lost ("Route saved locally. Will sync when reconnected.")
**Plans**: TBD

### Phase 84: Production Hardening
**Goal**: The app handles a full Saturday cycle (50 orders, 4 drivers) without performance degradation, data errors, or unmonitored failures
**Depends on**: Phase 83 (indexes and N+1 fixes benefit from seeing final query patterns from all preceding phases)
**Requirements**: HARD-01, HARD-02, HARD-03, HARD-04, HARD-05, HARD-06, HARD-07
**Success Criteria** (what must be TRUE):
  1. Bulk status endpoint is rate-limited (max 100 orders per call) and all API endpoints have specific rate limits
  2. N+1 query on ops dashboard is eliminated -- orders load with driver info and addresses in a single query
  3. Admin pagination shows "Showing X of Y" with correct totals on all list pages
  4. Database indexes exist for high-frequency query patterns (orders by status/date, unassigned orders, notification logs, routes by date)
  5. All critical API paths have specific error handling with correct HTTP status codes and Sentry context
**Plans**: TBD

### Phase 85: Phase 77 Verification & Bug Traceability
**Goal**: All 8 BUG requirements are formally verified with evidence, traceability table reflects completion, and Phase 77 documentation gaps are closed
**Depends on**: Phase 77 (verifying its completed work)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08
**Gap Closure:** Closes verification gaps from v1.9 audit
**Success Criteria** (what must be TRUE):
  1. VERIFICATION.md exists for Phase 77 with pass/fail for each of the 8 BUG requirements
  2. Each BUG fix has code-level evidence (file, line, behavior) documented in verification
  3. REQUIREMENTS.md traceability shows BUG-01 through BUG-08 as Complete
  4. SUMMARY frontmatter `requirements-completed` populated for plans 77-01 and 77-02
**Plans**: TBD

### Phase 86: Deferred Integration & Tech Debt Cleanup
**Goal**: All known deferred integration gaps and documentation tech debt from phases 77-79 are resolved
**Depends on**: Phase 78 (extends its business rules wiring to remaining callsites)
**Requirements**: None (integration/tech debt closure -- no new requirements)
**Gap Closure:** Closes integration gaps and tech debt from v1.9 audit
**Success Criteria** (what must be TRUE):
  1. retry-payment route uses `getBusinessRules()` for cutoff params (not hardcoded defaults)
  2. customer orders/[id] page uses `getBusinessRules()` for cutoff params (not hardcoded defaults)
  3. SUMMARY frontmatter `requirements-completed` populated for phases 78 and 79
  4. deliveryRadiusMiles/maxDeliveryDurationMinutes enforcement documented as intentionally deferred or implemented
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 77 -> 78 -> 79 -> 80 -> 81 -> 82 -> 83 -> 84 -> 85 -> 86
Phases 82 and 83 are independent of each other and can execute after Phase 80 in any order.
Phase 85 can execute immediately (only depends on completed Phase 77).
Phase 86 can execute immediately (only depends on completed Phase 78).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 77. Critical Bug Fixes | v1.9 | 5/5 | Complete | 2026-03-01 |
| 78. Configurable Business Rules | 4/4 | Complete    | 2026-03-01 | - |
| 79. Saturday Ops Dashboard | 3/3 | Complete    | 2026-03-01 | - |
| 80. Route & Driver Assignment | 4/4 | Complete    | 2026-03-02 | - |
| 81. Customer Pre-Checkout Gate | 1/3 | In Progress|  | - |
| 82. Email Reliability | v1.9 | 0/TBD | Not started | - |
| 83. Driver Simplification | v1.9 | 0/TBD | Not started | - |
| 84. Production Hardening | v1.9 | 0/TBD | Not started | - |
| 85. Phase 77 Verification & Bug Traceability | v1.9 | 0/TBD | Not started | - |
| 86. Deferred Integration & Tech Debt Cleanup | v1.9 | 0/TBD | Not started | - |

### Historical Progress

| Milestone          | Phases | Plans | Shipped    |
| ------------------ | ------ | ----- | ---------- |
| v1.0 MVP           | 1-8    | 32    | 2026-01-23 |
| v1.1 Tech Debt     | 9-14   | 21    | 2026-01-23 |
| v1.2 Playful UI    | 15-24  | 29    | 2026-01-27 |
| v1.3 Consolidation | 25-34  | 53    | 2026-01-28 |
| v1.4 Mobile        | 35-39  | 39    | 2026-02-05 |
| v1.5 Performance   | 40-47  | 34    | 2026-02-07 |
| v1.6 Polish        | 48-57  | 47    | 2026-02-13 |
| v1.7 Deployment    | 58-66  | 32    | 2026-02-16 |
| v1.8 Hardening     | 67-74  | 23    | 2026-02-19 |
| v1.8 Gap Closure   | 75-76  | 2     | 2026-02-26 |
| **Total shipped**  | **76** | **312** |          |

---

_v1.6 details archived to: .planning/milestones/v1.6-ROADMAP.md_
_v1.7 details archived to: .planning/milestones/v1.7-ROADMAP.md_
_v1.8 details archived to: .planning/milestones/v1.8-ROADMAP.md_
