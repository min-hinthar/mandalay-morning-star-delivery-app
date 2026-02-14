# Roadmap: Morning Star Delivery App

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-23)
- v1.1 Tech Debt - Phases 9-14 (shipped 2026-01-23)
- v1.2 Playful UI Overhaul - Phases 15-24 (shipped 2026-01-27)
- v1.3 Full Codebase Consolidation - Phases 25-34 (shipped 2026-01-28)
- v1.4 Mobile Excellence - Phases 35-39 (shipped 2026-02-05)
- v1.5 Performance & Repo Health - Phases 40-47 (shipped 2026-02-07)
- v1.6 Production Polish - Phases 48-57 (shipped 2026-02-13)
- v1.7 Production Deployment & Readiness - Phases 58-66 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (58, 59, 60...): Planned milestone work
- Decimal phases (59.1, 59.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 58: Deployment Verification** - Validate production environment and service connectivity
- [x] **Phase 59: Monitoring & Error Tracking** - Sentry initialization and real user monitoring
- [x] **Phase 60: LCP Optimization** - Server-rendered hero and async LazyMotion for sub-4s LCP
- [x] **Phase 61: Admin Pages** - Order detail and profile pages (APIs already exist)
- [ ] **Phase 62: Production Operations** - OAuth, Stripe webhook, Resend domain, Search Console
- [ ] **Phase 63: Branding & Compliance** - Homepage content for Google OAuth verification
- [ ] **Phase 64: Service Worker Hardening** - Full-scope SW with content-hash caching and update banner
- [ ] **Phase 65: CI/CD Hardening** - Lighthouse CI blocking, Chromatic visual regression, lint gates
- [ ] **Phase 66: Backlog Cleanup** - Language pref, cart modifiers, tracking fix, card refactor, dead code

## Phase Details

### Phase 58: Deployment Verification
**Goal**: Production environment is validated and all service connections are healthy
**Depends on**: Nothing (DEPL-01 already complete -- app deployed to Vercel)
**Requirements**: DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):
  1. `/api/health` endpoint returns status of Supabase, Stripe, and Resend connections
  2. All environment variables are configured in Vercel for production scope (not just preview/development)
  3. Health endpoint is accessible at `delivery.mandalaymorningstar.com/api/health` and reports all services green
**Plans:** 2 plans
Plans:
- [x] 58-01-PLAN.md -- Health library (types, env validation, service checks)
- [x] 58-02-PLAN.md -- Health API route, CORS config, verification

### Phase 59: Monitoring & Error Tracking
**Goal**: Production errors are captured, triaged, and linked to source code with readable stack traces
**Depends on**: Phase 58
**Requirements**: MNTR-01, MNTR-02, MNTR-03, MNTR-04, MNTR-05
**Success Criteria** (what must be TRUE):
  1. Client-side errors (uncaught exceptions, React error boundaries) appear in Sentry dashboard with component stack traces
  2. Server-side and Edge runtime errors appear in Sentry with source-mapped stack traces
  3. Real user Core Web Vitals (LCP, CLS, FID) are visible in Vercel Speed Insights dashboard
  4. Sentry source maps match deployed code (stack traces show original TypeScript, not minified JS)
**Plans:** 2 plans
Plans:
- [x] 59-01-PLAN.md -- Sentry SDK upgrade + server/edge/client config overhaul
- [x] 59-02-PLAN.md -- Vercel Speed Insights integration + web-vitals cleanup

### Phase 60: LCP Optimization
**Goal**: Homepage loads with visible content in under 4 seconds on mobile Lighthouse
**Depends on**: Phase 59 (monitoring must be live to observe real-user impact)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Hero heading text is visible at server render without waiting for JS hydration (no opacity:0 blocking LCP)
  2. LazyMotion features load asynchronously (domAnimation async import, not synchronous domMax)
  3. Lighthouse mobile performance score > 70 on homepage
  4. LCP < 4000ms on homepage (Lighthouse mobile emulation)
**Plans:** 3 plans
Plans:
- [x] 60-01-PLAN.md -- Hero LCP fix + async domAnimation root provider
- [x] 60-02-PLAN.md -- CSS transition migration for layoutId indicators (Tabs, NavDots, BottomNav, CategoryTabs, carousels)
- [x] 60-03-PLAN.md -- Per-route domMax providers + Toast cleanup + Lighthouse verification

### Phase 61: Admin Pages
**Goal**: Admins can view full order details and manage their own profile without leaving the app
**Depends on**: Phase 58 (needs working production environment)
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. Admin clicks an order row and sees full order detail at `/admin/orders/[id]` (items, totals, customer info, timestamps)
  2. Order detail page shows email history (sent emails for that order with status and timestamps)
  3. Admin can change order status (pending, confirmed, preparing, delivered, cancelled) from the order detail page
  4. Admin profile page at `/admin/profile` allows viewing and editing own name, email, and role info
**Plans:** 5 plans
Plans:
- [x] 61-01-PLAN.md -- Order detail API extensions + priority migration
- [x] 61-02-PLAN.md -- Admin profile API (GET/PATCH, stats, notification prefs)
- [x] 61-03-PLAN.md -- Order detail page (cards, status change, timeline, email history)
- [x] 61-04-PLAN.md -- Admin profile page (info, stats, notifications, theme, sign out)
- [x] 61-05-PLAN.md -- Manual email compose (Tiptap editor, compose API)

### Phase 62: Production Operations
**Goal**: Social login, transactional email, payment webhooks, and search indexing work on the production domain
**Depends on**: Phase 58 (needs production domain configured)
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06
**Success Criteria** (what must be TRUE):
  1. User can sign in with Google on the production domain (consent screen published, redirect URL configured)
  2. Apple Sign-in button works on production (domain verified, Service ID configured in Apple Developer Portal)
  3. Transactional emails (order confirmation, etc.) arrive in inbox (not spam) from a verified Resend domain with SPF/DKIM/DMARC
  4. Stripe webhooks fire successfully on production with correct signing secret (order events processed without signature errors)
  5. Production domain is verified in Google Search Console
**Plans:** 4 plans
Plans:
- [ ] 62-01-PLAN.md -- SEO foundation (sitemap.ts, robots.ts, Search Console verification metadata)
- [ ] 62-02-PLAN.md -- Email sender name update + OAuth error UX
- [ ] 62-03-PLAN.md -- Health endpoint extensions (Google OAuth, Search Console checks)
- [ ] 62-04-PLAN.md -- External dashboard configuration + production verification (checkpoint)

### Phase 63: Branding & Compliance
**Goal**: Homepage communicates app purpose clearly and links to required legal pages for OAuth verification
**Depends on**: Phase 62 (Google OAuth brand verification requires compliant homepage)
**Requirements**: BRND-01, BRND-02, BRND-03
**Success Criteria** (what must be TRUE):
  1. Homepage footer or nav links to privacy policy and terms of service pages
  2. Homepage clearly explains the app is a meal delivery subscription service (visible above the fold or in hero)
  3. Google OAuth brand verification application submitted with compliant homepage as evidence
**Plans**: TBD

### Phase 64: Service Worker Hardening
**Goal**: All app routes benefit from service worker caching with safe update behavior
**Depends on**: Phase 59 (Sentry tunnel route must be excluded from SW caching)
**Requirements**: SW-01, SW-02, SW-03, SW-04
**Success Criteria** (what must be TRUE):
  1. Service worker is active on all routes (not just `/driver`) -- customer and admin pages get offline caching
  2. Deploying a new version uses content-hash based revision (only changed assets invalidated, not entire cache)
  3. Users see an "Update available" banner when a new version is deployed, with a button to reload
  4. Auth callback (`/auth/callback`) and Sentry tunnel routes are excluded from SW interception
**Plans**: TBD

### Phase 65: CI/CD Hardening
**Goal**: PRs are blocked by performance regressions, visual regressions, and lint violations
**Depends on**: Phase 60 (LCP must pass before enabling blocking Lighthouse CI)
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04
**Success Criteria** (what must be TRUE):
  1. A PR that regresses LCP beyond 4000ms or CLS beyond 0.15 fails the Lighthouse CI check and cannot merge
  2. Visual regression snapshots are captured via Chromatic on every PR with review workflow
  3. CSS lint violations and Prettier formatting issues fail the CI check
  4. GitHub branch protection requires Lighthouse CI and Chromatic checks to pass before merge
**Plans**: TBD

### Phase 66: Backlog Cleanup
**Goal**: Outstanding feature gaps and tech debt items from previous milestones are resolved
**Depends on**: Nothing (independent items, can run after any phase)
**Requirements**: BKLG-01, BKLG-02, BKLG-03, BKLG-04, BKLG-05, BKLG-06
**Success Criteria** (what must be TRUE):
  1. Customer settings page includes a language preference selector (SETT-04)
  2. CartPage modifier button opens ItemDetailSheet for editing modifiers on an existing cart item
  3. Tracking page correctly extracts route_id from routeStop data (driver tracking works)
  4. UnifiedMenuItemCard is under 400 lines (refactored into sub-modules with barrel exports)
  5. Dead `send-order-confirmation` Edge Function is removed from the codebase
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 58 -> 59 -> 60 -> 61 -> 62 -> 63 -> 64 -> 65 -> 66

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 48. Error Boundaries & Loading States | v1.6 | 2/2 | Complete | 2026-02-08 |
| 49. Branded 404 & Error Pages | v1.6 | 2/2 | Complete | 2026-02-08 |
| 50. Data Foundation & Admin Settings | v1.6 | 4/4 | Complete | 2026-02-08 |
| 51. Customer Settings | v1.6 | 5/5 | Complete | 2026-02-08 |
| 52. Cart Validation & Cart Page | v1.6 | 5/5 | Complete | 2026-02-08 |
| 53. Auth Experience | v1.6 | 6/6 | Complete | 2026-02-09 |
| 54. Email System | v1.6 | 8/8 | Complete | 2026-02-09 |
| 55. Search Enhancement | v1.6 | 4/4 | Complete | 2026-02-11 |
| 56. Driver Offline Sync | v1.6 | 3/3 | Complete | 2026-02-11 |
| 57. Admin & Driver Polish | v1.6 | 8/8 | Complete | 2026-02-13 |
| 58. Deployment Verification | v1.7 | 2/2 | Complete | 2026-02-14 |
| 59. Monitoring & Error Tracking | v1.7 | 2/2 | Complete | 2026-02-14 |
| 60. LCP Optimization | v1.7 | 3/3 | Complete | 2026-02-14 |
| 61. Admin Pages | v1.7 | 5/5 | Complete | 2026-02-14 |
| 62. Production Operations | v1.7 | 0/0 | Not started | - |
| 63. Branding & Compliance | v1.7 | 0/0 | Not started | - |
| 64. Service Worker Hardening | v1.7 | 0/0 | Not started | - |
| 65. CI/CD Hardening | v1.7 | 0/0 | Not started | - |
| 66. Backlog Cleanup | v1.7 | 0/0 | Not started | - |

**Total: 66 phases across 8 milestones (61 complete, 5 pending)**

---
*v1.6 details archived to: .planning/milestones/v1.6-ROADMAP.md*
*v1.7 roadmap created: 2026-02-13*
