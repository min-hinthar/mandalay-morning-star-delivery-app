# Roadmap: Morning Star Delivery App

## Milestones

- v1.0-v1.9: Shipped (88 phases, 350 plans)
- v2.0 Production-Grade Launch MVP: Shipped (10 phases, 34 plans)
- v2.1 Route Operations & Admin Mobile: Phases 99-102 (in progress)

## Phases

<details>
<summary>v1.7 Production Deployment & Readiness (Phases 58-66) — SHIPPED 2026-02-16</summary>

- [x] Phase 58: Deployment Verification (2/2 plans) — completed 2026-02-14
- [x] Phase 59: Monitoring & Error Tracking (2/2 plans) — completed 2026-02-14
- [x] Phase 60: LCP Optimization (3/3 plans) — completed 2026-02-14
- [x] Phase 61: Admin Pages (5/5 plans) — completed 2026-02-14
- [x] Phase 62: Production Operations (4/4 plans) — completed 2026-02-14
- [x] Phase 63: Branding & Compliance (3/3 plans) — completed 2026-02-15
- [x] Phase 64: Service Worker Hardening (5/5 plans) — completed 2026-02-15
- [x] Phase 65: CI/CD Hardening (1/1 plan) — completed 2026-02-15
- [x] Phase 66: Backlog Cleanup (7/7 plans) — completed 2026-02-15

</details>

<details>
<summary>v1.8 Post-Launch Hardening & Driver Experience (Phases 67-76) — SHIPPED 2026-02-26</summary>

- [x] Phase 67: CSP & Security Headers (3/3 plans) — completed 2026-02-17
- [x] Phase 68: RLS Audit & Hardening (3/3 plans) — completed 2026-02-17
- [x] Phase 69: Distributed Rate Limiting (3/3 plans) — completed 2026-02-18
- [x] Phase 70: Role-Based Auth Redirects (3/3 plans) — completed 2026-02-19
- [x] Phase 71: Driver Profile Setup (2/2 plans) — completed 2026-02-19
- [x] Phase 72: Driver Earnings Dashboard (3/3 plans) — completed 2026-02-19
- [x] Phase 73: Driver Availability & Route Visibility (3/3 plans) — completed 2026-02-19
- [x] Phase 74: Guided Walkthrough & Driver UI Polish (3/3 plans) — completed 2026-02-19
- [x] Phase 75: Fix Security & Navigation Wiring (1/1 plan) — completed 2026-02-26
- [x] Phase 76: Surface Hidden Components & Dead Code Cleanup (1/1 plan) — completed 2026-02-26

</details>

<details>
<summary>v1.9 Launch-Ready MVP (Phases 77-88) — SHIPPED 2026-03-03</summary>

- [x] Phase 77: Critical Bug Fixes (5/5 plans) — completed 2026-03-01
- [x] Phase 78: Configurable Business Rules (4/4 plans) — completed 2026-03-01
- [x] Phase 79: Saturday Ops Dashboard (3/3 plans) — completed 2026-03-01
- [x] Phase 80: Route & Driver Assignment (4/4 plans) — completed 2026-03-02
- [x] Phase 81: Customer Pre-Checkout Gate (3/3 plans) — completed 2026-03-02
- [x] Phase 82: Email Reliability (4/4 plans) — completed 2026-03-02
- [x] Phase 83: Driver Simplification (4/4 plans) — completed 2026-03-02
- [x] Phase 84: Production Hardening (4/4 plans) — completed 2026-03-02
- [x] Phase 85: Phase 77 Verification & Bug Traceability (2/2 plans) — completed 2026-03-02
- [x] Phase 86: Deferred Integration & Tech Debt Cleanup (2/2 plans) — completed 2026-03-02
- [x] Phase 87: Fix Code Gaps (1/1 plan) — completed 2026-03-03
- [x] Phase 88: Phase 83 & 84 Verification (2/2 plans) — completed 2026-03-03

</details>

<details>
<summary>v2.0 Production-Grade Launch MVP (Phases 89-98) — SHIPPED 2026-03-04</summary>

- [x] Phase 89: Critical Bug Fixes (4/4 plans) — completed 2026-03-03
- [x] Phase 90: Menu & Photo Pipeline (4/4 plans) — completed 2026-03-03
- [x] Phase 91: Checkout & Payment Hardening (4/4 plans) — completed 2026-03-03
- [x] Phase 92: Customer UX - Discovery & Shopping (4/4 plans) — completed 2026-03-03
- [x] Phase 93: Customer UX - Engagement & Accessibility (3/3 plans) — completed 2026-03-03
- [x] Phase 94: Admin & Driver Enhancements (2/2 plans) — completed 2026-03-03
- [x] Phase 95: Observability, Performance & Testing (8/8 plans) — completed 2026-03-04
- [x] Phase 96: Integration Wiring & Dead Code Resolution (2/2 plans) — completed 2026-03-04
- [x] Phase 97: Phase 89/90 Verification & Traceability (2/2 plans) — completed 2026-03-04
- [x] Phase 98: Delivery Photo Signed URL Fix (1/1 plan) — completed 2026-03-04

</details>

### v2.1 Route Operations & Admin Mobile (Phases 99-102)

**Milestone Goal:** Full route lifecycle management — admins and drivers can plan, edit, optimize, and execute delivery routes entirely from their phones on Saturday.

**Phase Numbering:**
- Integer phases (99, 100, 101, 102): Planned v2.1 milestone work
- Decimal phases (100.1, 100.2): Urgent insertions if needed (marked with INSERTED)

- [x] **Phase 99: Foundation Fixes** - Auth redirect bug fix, order detail completeness, delivery notes, manual tracking display (completed 2026-03-15)
- [x] **Phase 100: Admin Route Editing** - Drag-reorder stops, split/merge routes, driver reassignment with @dnd-kit (completed 2026-03-15)
- [x] **Phase 101: Driver Experience** - Route acceptance, page audit, stop reordering in advanced mode (completed 2026-03-16)
- [ ] **Phase 102: Admin Mobile UX** - Sidebar to drawer, tables to cards, touch targets, route progress widget

## Phase Details

### Phase 99: Foundation Fixes
**Goal**: Admins and drivers see complete, accurate information on every screen and land on the correct dashboard after login
**Depends on**: Nothing (first phase of v2.1)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. Admin logging in via OAuth or magic link lands on /admin dashboard (not homepage)
  2. Driver logging in via magic link lands on /driver dashboard (not homepage)
  3. Order detail screen shows full item list with modifiers, special instructions, tip amount, delivery notes, payment status, and customer contact info on one screen
  4. Driver can type and save delivery notes for any stop during delivery
  5. Admin route detail shows arrived_at and delivered_at timestamps per stop
**Plans**: 3 plans

Plans:
- [ ] 99-01-PLAN.md — Auth redirect E2E tests and bug fix
- [ ] 99-02-PLAN.md — Order detail completeness and OrderDetailPanel extraction
- [ ] 99-03-PLAN.md — Driver delivery notes and admin timestamp display

### Phase 100: Admin Route Editing
**Goal**: Admins can fully edit route composition and stop order from both desktop and mobile during Saturday ops
**Depends on**: Phase 99 (OrderDetailPanel shared component needed for route detail)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05
**Success Criteria** (what must be TRUE):
  1. Admin can drag stops to reorder on desktop using @dnd-kit, changes persist via batch_update_stop_indices RPC
  2. Admin can reorder stops on mobile using move-up/move-down buttons (no drag required)
  3. Admin can select stops from an overloaded route and split them into a new route with driver assignment
  4. Admin can merge two light routes into one route
  5. Admin can reassign a different driver to an in-progress route
**Plans**: 4 plans

Plans:
- [x] 100-01-PLAN.md — Install @dnd-kit, extract RouteStopCard subfolder, build DragReorderList, Actions dropdown shell
- [ ] 100-02-PLAN.md — Supabase migration (split_route/merge_routes RPCs), API endpoints, Zod schemas
- [ ] 100-03-PLAN.md — Drag reorder wiring, mobile move buttons, driver reassignment with confirmation
- [ ] 100-04-PLAN.md — Split route flow, merge route flow, selection mode, modals

### Phase 101: Driver Experience
**Goal**: Drivers can accept routes, execute deliveries through a complete stop-by-stop flow, and all driver pages show real working data
**Depends on**: Phase 100 (@dnd-kit installed, DragReorderList component available for reuse)
**Requirements**: DRV-01, DRV-02, DRV-03
**Success Criteria** (what must be TRUE):
  1. Driver sees assigned route and can accept or decline before starting deliveries
  2. Every driver page (dashboard, earnings, history, schedule, profile, active route) loads real data with no empty/stub content
  3. Driver in advanced mode can drag-reorder remaining pending stops on their active route
**Plans**: 6 plans

Plans:
- [ ] 101-01-PLAN.md — Database migrations (enum, backfill, RPC updates), TypeScript types, Zod schemas, email type registration
- [ ] 101-02-PLAN.md — Accept/decline/reorder API endpoints, client hooks with tests, React Email template
- [ ] 101-03-PLAN.md — Status filter audit (9 queries + 6 guards) + admin PATCH auto-transition
- [ ] 101-03b-PLAN.md — Admin UI status updates (StatusBadge, RouteHeader, RouteCardRow, ops dashboard)
- [ ] 101-04-PLAN.md — AcceptDeclineCard, AcceptDeclineBar, DeclineConfirmDialog, DragReorderList in ActiveRouteView, LocationTracker cleanup
- [ ] 101-05-PLAN.md — Full verification suite + manual page audit checkpoint

### Phase 102: Admin Mobile UX
**Goal**: Solo operator can run all Saturday kitchen operations from a phone without pinching, scrolling sideways, or missing touch targets
**Depends on**: Phase 101 (all features finalized before responsive overhaul to avoid double-touching pages)
**Requirements**: MOBL-01, MOBL-02, MOBL-03, MOBL-04
**Success Criteria** (what must be TRUE):
  1. Admin sidebar is replaced by a drawer or bottom nav on screens below md: breakpoint
  2. All admin data tables render as card layouts on mobile (no horizontal scroll)
  3. Every interactive element on admin pages meets 44px minimum touch target
  4. Ops dashboard shows a route progress widget per active route (driver name, progress bar, delivered/total count)
**Plans**: 5 plans

Plans:
- [ ] 102-01-PLAN.md — Prerequisites (Drawer cleanup, photos extraction) + admin mobile navigation (header, drawer, layout)
- [ ] 102-02-PLAN.md — Flex-based table card conversions (menu, categories, routes)
- [ ] 102-03-PLAN.md — HTML table card conversions (emails, feedback, ratings) + responsive padding sweep
- [ ] 102-04-PLAN.md — Route progress widget (API endpoint, polling hook, widget component, OpsCenter wiring)
- [ ] 102-05-PLAN.md — Touch target sweep + reduced-motion sweep + final verification checkpoint

## Progress

| Milestone              | Phases | Plans | Shipped    |
| ---------------------- | ------ | ----- | ---------- |
| v1.0 MVP               | 1-8    | 32    | 2026-01-23 |
| v1.1 Tech Debt         | 9-14   | 21    | 2026-01-23 |
| v1.2 Playful UI        | 15-24  | 29    | 2026-01-27 |
| v1.3 Consolidation     | 25-34  | 53    | 2026-01-28 |
| v1.4 Mobile            | 35-39  | 39    | 2026-02-05 |
| v1.5 Performance       | 40-47  | 34    | 2026-02-07 |
| v1.6 Polish            | 48-57  | 47    | 2026-02-13 |
| v1.7 Deployment        | 58-66  | 32    | 2026-02-16 |
| v1.8 Hardening         | 67-76  | 25    | 2026-02-26 |
| v1.9 Launch-Ready MVP  | 77-88  | 38    | 2026-03-03 |
| v2.0 Launch MVP        | 89-98  | 34    | 2026-03-04 |
| **Total shipped**      | **98** | **384** |            |

**Execution Order:**
Phases execute in numeric order: 99 -> 100 -> 101 -> 102

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 99. Foundation Fixes | 3/3 | Complete    | 2026-03-15 | - |
| 100. Admin Route Editing | 4/4 | Complete    | 2026-03-15 | - |
| 101. Driver Experience | 6/6 | Complete    | 2026-03-16 | - |
| 102. Admin Mobile UX | v2.1 | 0/5 | Not started | - |

---

_v1.6 details archived to: .planning/milestones/v1.6-ROADMAP.md_
_v1.7 details archived to: .planning/milestones/v1.7-ROADMAP.md_
_v1.8 details archived to: .planning/milestones/v1.8-ROADMAP.md_
_v1.9 details archived to: .planning/milestones/v1.9-ROADMAP.md_
_v2.0 details archived to: .planning/milestones/v2.0-ROADMAP.md_
