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
- 🚧 **v1.8 Post-Launch Hardening & Driver Experience** — Phases 67-74 (in progress)

## Phases

<details>
<summary>✅ v1.7 Production Deployment & Readiness (Phases 58-66) — SHIPPED 2026-02-16</summary>

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

### 🚧 v1.8 Post-Launch Hardening & Driver Experience (In Progress)

**Milestone Goal:** Harden production security (CSP, RLS, rate limiting), overhaul driver experience (profile, earnings, availability, onboarding), and add role-based login redirects.

#### Phase 67: CSP & Security Headers
**Goal**: All pages served with Content Security Policy and security headers protecting against XSS, clickjacking, and MIME-sniffing
**Depends on**: Nothing (first phase of v1.8)
**Requirements**: SEC-01, SEC-02, SEC-08, CLN-01, CLN-02, CLN-03
**Success Criteria** (what must be TRUE):
  1. Every page response includes Content-Security-Policy-Report-Only header with all external domains (Stripe, Google Maps, Supabase, Sentry, Google Fonts, Vercel Analytics) whitelisted
  2. CSP violations reported to Sentry without breaking any existing functionality (maps, payments, animations)
  3. All cssText usages in FlyToCart.tsx and CustomMarkers.tsx replaced with individual DOM property assignments that pass CSP
  4. CSP upgraded from Report-Only to enforcing mode after validation
  5. Dead code exports and barrel file removed, placeholder social links resolved
**Plans**: 3 plans (Wave 1: all parallel)

Plans:
- [ ] 67-01-PLAN.md — CSP Report-Only header, security headers, Sentry reporting, ESLint cssText guard
- [ ] 67-02-PLAN.md — Replace all cssText usages with individual DOM style assignments
- [ ] 67-03-PLAN.md — Remove dead code exports, barrel file, useABTest, resolve placeholder links

#### Phase 68: RLS Audit & Hardening
**Goal**: Every Supabase table has verified row-level security policies with correct role-based access
**Depends on**: Phase 67 (proxy.ts created for auth refresh)
**Requirements**: SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. All 7 target tables (featured_sections, customer_settings, driver_invites, webhook_events, order_audit_log, app_settings, email_logs) have documented RLS policies
  2. Missing policies added with proper role gating (driver own-read, admin bypass, service-role for system tables)
  3. Performance indexes exist on user_id, driver_id, route_id columns used in RLS policy checks
  4. RLS isolation test script passes for all roles (customer, driver, admin, anonymous)
**Plans**: TBD

Plans:
- [ ] 68-01: TBD
- [ ] 68-02: TBD

#### Phase 69: Distributed Rate Limiting
**Goal**: API endpoints are protected by distributed rate limiting that works correctly across serverless instances
**Depends on**: Nothing (independent infra; parallelizable with Phase 68)
**Requirements**: SEC-06, SEC-07
**Success Criteria** (what must be TRUE):
  1. Rate limiting uses Upstash Redis instead of in-memory Map (shared state across all Vercel instances)
  2. Auth endpoints enforce limits (5/min signIn, 3/hr signUp) and return 429 with retry-after header
  3. High-traffic API routes (location updates, order creation) are rate-limited with appropriate windows
**Plans**: TBD

Plans:
- [ ] 69-01: TBD
- [ ] 69-02: TBD

#### Phase 70: Role-Based Auth Redirects
**Goal**: Users land on the correct dashboard for their role after login
**Depends on**: Phase 67 (proxy.ts must exist for auth token refresh)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. Admin users redirect to /admin dashboard after login
  2. Driver users with active status redirect to /driver dashboard after login
  3. Customer users redirect to /menu after login
  4. New drivers without active driver record redirect to /driver/onboard instead of /driver
  5. Admin and driver routes are protected at proxy level — unauthorized users cannot access them even by direct URL
**Plans**: TBD

Plans:
- [ ] 70-01: TBD
- [ ] 70-02: TBD

#### Phase 71: Driver Profile Setup
**Goal**: Drivers can manage their profile information and photo from within the app
**Depends on**: Phase 68 (RLS patterns established before adding driver data features)
**Requirements**: DPROF-01, DPROF-02, DPROF-03
**Success Criteria** (what must be TRUE):
  1. Driver can edit name, phone, vehicle type, and license plate from /driver/profile page
  2. Driver can upload a profile photo that persists in Supabase Storage (driver-photos bucket)
  3. Dashboard shows profile completeness indicator highlighting missing fields
**Plans**: TBD

Plans:
- [ ] 71-01: TBD
- [ ] 71-02: TBD

#### Phase 72: Driver Earnings Dashboard
**Goal**: Drivers can view their earnings history with weekly/monthly breakdowns and achievement badges
**Depends on**: Phase 71 (driver profile and nav restructure foundation)
**Requirements**: DDASH-01, DDASH-02, DDASH-03, DDASH-11, DDASH-12, DUI-01
**Success Criteria** (what must be TRUE):
  1. Driver sees weekly earnings summary card on dashboard with computed total (per-delivery rate x completed deliveries)
  2. Per-route earnings breakdown shows individual route earnings on /driver/earnings page
  3. Earnings history chart (Recharts bar/line) shows weekly and monthly trends
  4. Bottom nav includes Earnings and Schedule tabs alongside existing tabs
  5. Streak badges and performance milestones (100 deliveries, 5-star streak) display when earned
**Plans**: TBD

Plans:
- [ ] 72-01: TBD
- [ ] 72-02: TBD
- [ ] 72-03: TBD

#### Phase 73: Driver Availability & Route Visibility
**Goal**: Drivers can set their availability schedule and see upcoming assigned routes beyond today
**Depends on**: Phase 72 (nav restructure with Schedule tab)
**Requirements**: DDASH-04, DDASH-05, DDASH-06, DDASH-07, DDASH-08, DDASH-09, DDASH-10, DUI-04
**Success Criteria** (what must be TRUE):
  1. Driver can mark available days of the week (recurring weekly pattern)
  2. Driver can block specific dates for one-off unavailability (vacation, sick)
  3. Upcoming assigned routes visible on driver home — not just today's route
  4. Weekly schedule view shows all planned routes for the coming week
  5. History page supports date-range filtering, pagination, and monthly summary with aggregate stats
  6. Admin can view driver availability when creating or assigning routes
**Plans**: TBD

Plans:
- [ ] 73-01: TBD
- [ ] 73-02: TBD
- [ ] 73-03: TBD

#### Phase 74: Guided Walkthrough & Driver UI Polish
**Goal**: New drivers have a guided first-delivery experience and the driver interface matches customer-side visual quality
**Depends on**: Phase 73 (all driver features exist for walkthrough to exercise)
**Requirements**: DPROF-04, DPROF-05, DUI-02, DUI-03
**Success Criteria** (what must be TRUE):
  1. Onboarding checklist on dashboard shows new drivers their progress (profile complete, first route viewed, first delivery done)
  2. Test delivery page (/driver/test-delivery) lets drivers practice the full delivery flow with mock route data
  3. Driver layouts are mobile-first with larger touch targets and better scan hierarchy
  4. Driver pages have animation polish, glassmorphism cards, and consistent design tokens matching customer-side quality
**Plans**: TBD

Plans:
- [ ] 74-01: TBD
- [ ] 74-02: TBD
- [ ] 74-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 67 → 68 → 69 → 70 → 71 → 72 → 73 → 74
Note: Phases 68 and 69 are parallelizable (both are infra with no UI overlap).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 67. CSP & Security Headers | v1.8 | 0/TBD | Not started | - |
| 68. RLS Audit & Hardening | v1.8 | 0/TBD | Not started | - |
| 69. Distributed Rate Limiting | v1.8 | 0/TBD | Not started | - |
| 70. Role-Based Auth Redirects | v1.8 | 0/TBD | Not started | - |
| 71. Driver Profile Setup | v1.8 | 0/TBD | Not started | - |
| 72. Driver Earnings Dashboard | v1.8 | 0/TBD | Not started | - |
| 73. Driver Availability & Route Visibility | v1.8 | 0/TBD | Not started | - |
| 74. Guided Walkthrough & Driver UI Polish | v1.8 | 0/TBD | Not started | - |

**Historical:**

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI | 15-24 | 29 | 2026-01-27 |
| v1.3 Consolidation | 25-34 | 53 | 2026-01-28 |
| v1.4 Mobile | 35-39 | 39 | 2026-02-05 |
| v1.5 Performance | 40-47 | 34 | 2026-02-07 |
| v1.6 Polish | 48-57 | 47 | 2026-02-13 |
| v1.7 Deployment | 58-66 | 32 | 2026-02-16 |
| **Total** | **66** | **287** | |

---
*v1.6 details archived to: .planning/milestones/v1.6-ROADMAP.md*
*v1.7 details archived to: .planning/milestones/v1.7-ROADMAP.md*
