# Roadmap: Morning Star Delivery App

## Milestones

- v1.0-v1.9: Shipped (88 phases, 350 plans)
- v2.0 Production-Grade Launch MVP: Shipped (10 phases, 34 plans)
- v2.1 Route Operations & Admin Mobile: Shipped (5 phases, 22 plans)
- v2.2 Stability & Correctness: In progress (6 phases, 104-109)

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

<details>
<summary>v2.1 Route Operations & Admin Mobile (Phases 99-103) — SHIPPED 2026-03-17</summary>

- [x] Phase 99: Foundation Fixes (3/3 plans) — completed 2026-03-15
- [x] Phase 100: Admin Route Editing (4/4 plans) — completed 2026-03-15
- [x] Phase 101: Driver Experience (6/6 plans) — completed 2026-03-16
- [x] Phase 102: Admin Mobile UX (6/6 plans) — completed 2026-03-16
- [x] Phase 103: Tech Debt & Nyquist Compliance (3/3 plans) — completed 2026-03-16

</details>

### v2.2 Stability & Correctness (In Progress)

**Milestone Goal:** Fix all critical bugs and correctness issues found in codebase deep dive -- driver route lifecycle blockers, checkout delivery window discrepancies, timezone bugs, missing RPCs, broken rate limiting, race conditions, and test coverage gaps.

- [x] **Phase 104: Type Safety & API Corrections** (2 plans) - Add missing Supabase types, fix revalidateTag/active-route/stats bugs (completed 2026-03-20)
- [ ] **Phase 105: Route Lifecycle Guards** (2 plans) - Fix driver route start blocker and admin override bypass
- [ ] **Phase 106: Timezone Correctness** - Batch-fix all timezone bugs across checkout, email, cron, and date filtering
- [ ] **Phase 107: Data Integrity** - Atomic stop promotion RPC and dead code removal
- [ ] **Phase 108: Rate Limiting Restoration** - Provision Upstash REST Redis and restore all 13 rate limiters
- [ ] **Phase 109: Quality & Maintenance** - Integration tests for route lifecycle, webhook handler file split

## Phase Details

### Phase 104: Type Safety & API Corrections
**Goal**: All Supabase types are accurate and trivial API bugs are eliminated -- subsequent phases build on correct types
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-02, API-01, API-02, ROUTE-02
**Success Criteria** (what must be TRUE):
  1. `npx supabase gen types` output includes `delivery_zones` table and all `as any` casts referencing it are removed
  2. Driver active route API returns `customer_name` and `customer_phone` for every stop -- COD customers' contact info is visible
  3. `revalidateTag` calls across the codebase have no invalid second argument -- zero runtime warnings in server logs
  4. Admin ops dashboard shows correct in-progress count when a route has `enroute` stops (not counted as pending)
**Plans:** 2/2 plans complete
Plans:
- [ ] 104-01-PLAN.md — Add missing Supabase types + remove as-any casts + fix revalidateTag
- [ ] 104-02-PLAN.md — Fix active route customer contact + updateRouteStats pending count

### Phase 105: Route Lifecycle Guards
**Goal**: Drivers can start and proceed through assigned routes, and admins cannot bypass lifecycle states
**Depends on**: Phase 104 (accurate types needed for route status type narrowing)
**Requirements**: ROUTE-01, ROUTE-03
**Success Criteria** (what must be TRUE):
  1. Driver sees "Accept Route" button for routes in `assigned` status -- tapping it transitions to `accepted`, not a 400 error
  2. Driver sees "Start Route" button only after accepting -- the start action transitions `accepted` to `in_progress`
  3. Admin route status override dropdown excludes states that violate lifecycle (cannot set `in_progress` without driver acceptance)
  4. Manual admin overrides are logged with timestamp and previous state for audit trail
**Plans:** 1/2 plans executed
Plans:
- [ ] 105-01-PLAN.md — Add VALID_ROUTE_TRANSITIONS constant + fix driver start endpoint
- [ ] 105-02-PLAN.md — Admin PATCH lifecycle guard + frontend dropdown + migration

### Phase 106: Timezone Correctness
**Goal**: All date/time operations use LA timezone consistently -- customers see correct delivery windows, reminders fire on the right day, checkout rejects stale or far-future dates
**Depends on**: Phase 104 (clean types prevent masking timezone issues)
**Requirements**: TZ-01, TZ-02, TZ-03, TZ-04, TZ-05
**Success Criteria** (what must be TRUE):
  1. Checkout `scheduledDate` is constructed via `toISOWithTimezone` -- no raw `new Date(date + "T12:00:00")` string concatenation
  2. COD confirmation email shows delivery window with timezone offset (e.g., "10:00 AM - 6:00 PM PST") matching Stripe checkout path
  3. Delivery reminder cron at 12:00 UTC sends reminders for LA-date orders, not UTC-date orders -- correct between midnight UTC and 8AM LA
  4. Customer date picker shows only future dates with cutoff not yet passed -- no stale "today" slot when cutoff has elapsed
  5. Checkout API returns 400 for `scheduledDate` more than 30 days in the future
**Plans**: TBD

### Phase 107: Data Integrity
**Goal**: Route stop promotion is race-free and driver delivery counts are accurate
**Depends on**: Phase 105 (route lifecycle must be correct before fixing stop transitions within routes)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Completing two stops in rapid succession (< 500ms apart) never promotes the same next stop twice -- atomic `FOR UPDATE SKIP LOCKED` prevents double-promotion
  2. `complete/route` endpoint does not call `increment_driver_deliveries` RPC -- the existing `update_driver_deliveries_count` trigger handles counts per stop, preventing double-counting
**Plans**: TBD

### Phase 108: Rate Limiting Restoration
**Goal**: All API endpoints have functional distributed rate limiting -- no more null rate limiters
**Depends on**: Phase 104 (type safety), independent of Phases 105-107
**Requirements**: INFRA-01
**Success Criteria** (what must be TRUE):
  1. Upstash REST Redis is provisioned and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars are set
  2. All 13 `Ratelimit` constructors in `client.ts` return functional instances (not null)
  3. Exceeding rate limit on any endpoint returns 429 with appropriate `Retry-After` header
**Plans**: TBD

### Phase 109: Quality & Maintenance
**Goal**: Route lifecycle has integration test coverage and webhook handler file meets ESLint size limit
**Depends on**: Phase 105 (lifecycle must be final), Phase 107 (stop promotion must be final)
**Requirements**: QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. Integration test suite covers full route lifecycle: `assigned` -> accept -> start -> stop arrive -> stop deliver -> next-stop promoted -> route complete -- all assertions pass
  2. `handlers.ts` is split into per-event-type handler files, each under 400 lines, with barrel re-export preserving the existing import contract
  3. `pnpm test` passes with zero failures including the new integration tests
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 104 -> 105 -> 106 -> 107 -> 108 -> 109

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 104. Type Safety & API Corrections | 2/2 | Complete    | 2026-03-20 |
| 105. Route Lifecycle Guards | 1/2 | In Progress|  |
| 106. Timezone Correctness | 0/TBD | Not started | - |
| 107. Data Integrity | 0/TBD | Not started | - |
| 108. Rate Limiting Restoration | 0/TBD | Not started | - |
| 109. Quality & Maintenance | 0/TBD | Not started | - |

| Milestone              | Phases  | Plans | Shipped    |
| ---------------------- | ------- | ----- | ---------- |
| v1.0 MVP               | 1-8     | 32    | 2026-01-23 |
| v1.1 Tech Debt         | 9-14    | 21    | 2026-01-23 |
| v1.2 Playful UI        | 15-24   | 29    | 2026-01-27 |
| v1.3 Consolidation     | 25-34   | 53    | 2026-01-28 |
| v1.4 Mobile            | 35-39   | 39    | 2026-02-05 |
| v1.5 Performance       | 40-47   | 34    | 2026-02-07 |
| v1.6 Polish            | 48-57   | 47    | 2026-02-13 |
| v1.7 Deployment        | 58-66   | 32    | 2026-02-16 |
| v1.8 Hardening         | 67-76   | 25    | 2026-02-26 |
| v1.9 Launch-Ready MVP  | 77-88   | 38    | 2026-03-03 |
| v2.0 Launch MVP        | 89-98   | 34    | 2026-03-04 |
| v2.1 Route Ops & Mobile| 99-103  | 22    | 2026-03-17 |
| v2.2 Stability         | 104-109 | TBD   | -          |
| **Total shipped**      | **103** | **406** |          |

---

_v1.6 details archived to: .planning/milestones/v1.6-ROADMAP.md_
_v1.7 details archived to: .planning/milestones/v1.7-ROADMAP.md_
_v1.8 details archived to: .planning/milestones/v1.8-ROADMAP.md_
_v1.9 details archived to: .planning/milestones/v1.9-ROADMAP.md_
_v2.0 details archived to: .planning/milestones/v2.0-ROADMAP.md_
_v2.1 details archived to: .planning/milestones/v2.1-ROADMAP.md_
