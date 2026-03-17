# Morning Star Delivery App — V8 UI Rewrite

## What This Is

A production-ready Saturday meal delivery app for Morning Star Weekly Delivery. Eleven milestones shipped (v1.0-v2.1) across 103 phases and 406 plans. V8 component library with portal-based overlays, tokenized z-index system, and animation-first design using GSAP and Framer Motion. Complete operator tooling: ops dashboard with route progress monitoring, route builder with Leaflet maps, full route editing (drag-reorder, split, merge, driver reassignment), configurable business rules, email reliability. Admin mobile UX with drawer navigation, card layouts, 44px touch targets — all ops runnable from a phone. Customer UX with Saturday-only delivery gate, cutoff countdown, and dynamic pricing. Driver experience with route accept/decline flow, stop-by-stop delivery, simple mode for non-technical family members, offline overlay, and guided onboarding. Production hardened with CSP headers, RLS on all tables, distributed rate limiting, composite indexes, and endpoint-specific error handling.

## Core Value

**Every UI element is reliably clickable and the app feels delightfully alive with motion.** If overlays block clicks or animations feel janky, we've failed.

## Current State (v2.1 Route Operations & Admin Mobile shipped)

- 11 milestones complete: v1.0-v2.1 (103 phases, 406 plans, 18/18 v2.1 requirements at 100%)
- Deployed to production at delivery.mandalaymorningstar.com
- Full route lifecycle: drag-reorder stops (desktop DnD + mobile move buttons), split/merge routes, driver reassignment with confirmation
- Route progress widget: real-time 5s polling ops dashboard showing per-route driver, status, delivered/total
- Admin mobile UX: drawer navigation, 6 table-to-card conversions, 44px touch targets — all ops from phone
- Driver accept/decline: 5-status lifecycle, decline with reason + admin email alert, area description preview
- Order detail completeness: items/modifiers/instructions, contact (click-to-call/SMS), payment, tip, delivery notes on one screen
- Auth routing: admin/driver/customer land on correct dashboard after login/OAuth
- Saturday ops dashboard: bulk status changes, countdown timers, driver availability, route progress
- Route builder: Leaflet map with geographic clustering, one-click route creation, order reassignment
- Configurable business rules: cutoff, delivery fee, hours, radius — all from admin settings (no deploy)
- Customer delivery gate: dynamic hero CTA, menu banner, cart countdown, cutoff modal, order tracking
- Email reliability: svix webhook verification, retry with max 3 attempts, admin dashboard with stats
- Driver simple mode: 2-tab nav, SimpleStopView, confirm dialog, offline overlay (DB-backed, default on)
- Production hardened: 5 composite indexes, endpoint-specific rate limits, N+1 eliminated, pagination on all lists
- Full observability: Sentry client/server/edge with source maps, Speed Insights, web vitals
- ~90,766 lines TypeScript (src/)

## Requirements

### Validated

<details>
<summary>v1.0-v1.7 requirements (224 items) — all validated</summary>

- ✓ Customer order flow (menu → cart → checkout → Stripe) — existing
- ✓ Supabase auth with role-based access (customer/admin/driver) — existing
- ✓ Stripe subscription and checkout integration — existing
- ✓ Cart state persistence via Zustand + localStorage — existing
- ✓ Server-side rendering with React Query caching — existing
- ✓ Google Maps integration for delivery tracking — existing
- ✓ Admin analytics dashboards — existing
- ✓ Driver delivery management — existing
- ✓ Z-index token system with semantic names — v1
- ✓ ESLint/Stylelint rules enforcing tokenized z-index — v1
- ✓ Color token system with light/dark mode support — v1
- ✓ Motion token system (springs, durations, easings) — v1
- ✓ GSAP plugin registration and useGSAP patterns — v1
- ✓ GSAP scroll choreography patterns library — v1
- ✓ Stacking context isolation rules documented — v1
- ✓ Creative page layouts and effects system — v1
- ✓ Portal-based overlay infrastructure (Modal, Drawer, Dropdown, Tooltip, Toast) — v1
- ✓ App shell with sticky header, bottom nav, mobile menu — v1
- ✓ Cart experience with fly-to-cart, swipe-to-delete, quantity animations — v1
- ✓ Menu browsing with scrollspy, card effects, search, staggered reveal — v1
- ✓ Checkout flow with step progress, form micro-interactions, celebration — v1
- ✓ E2E tests for header clickability, cart drawer, dropdown dismissal — v1
- ✓ Zero z-index ESLint violations, strict TypeScript flags — v1.1
- ✓ Dead code cleanup (44 files, 480 exports analyzed) — v1.1
- ✓ UnifiedMenuItemCard with glassmorphism, 3D tilt, shine — v1.2
- ✓ 12 micro-interactions, OLED dark mode, theme toggle — v1.2
- ✓ 221 hardcoded colors → 62+ semantic tokens with ESLint enforcement — v1.3
- ✓ Component consolidation, hero redesign, Husky pre-commit — v1.3
- ✓ Zero mobile crashes, CLS 0, service worker, device-adaptive animations — v1.4
- ✓ LCP 45% improvement, React Compiler, LazyMotion, file refactoring — v1.5
- ✓ Error boundaries, passwordless auth, transactional emails, fuzzy search — v1.6
- ✓ Health endpoint, Sentry, LCP <4s, admin pages, CI/CD gates — v1.7

</details>

- ✓ Enforcing CSP + 5 security headers with Sentry violation reporting — v1.8
- ✓ All 24 Supabase tables RLS-audited with 62-assertion regression test — v1.8
- ✓ Distributed rate limiting via Upstash Redis on all API endpoints — v1.8
- ✓ cssText eliminated for CSP compatibility — v1.8
- ✓ Role-based auth redirects (admin→/admin, driver→/driver, customer→/menu) — v1.8
- ✓ Proxy-level route protection for admin and driver routes — v1.8
- ✓ Passwordless driver onboarding with invite metadata — v1.8
- ✓ Driver profile setup with photo upload (Supabase Storage) — v1.8
- ✓ Profile completeness indicator on driver dashboard — v1.8
- ✓ Driver earnings dashboard with Recharts charts and streak badges — v1.8
- ✓ Driver availability scheduling (recurring + one-off blocking) — v1.8
- ✓ Weekly schedule view with route visibility — v1.8
- ✓ History page with date-range filtering, pagination, monthly grouping — v1.8
- ✓ Admin view of driver availability — v1.8
- ✓ Onboarding walkthrough checklist with milestone celebration — v1.8
- ✓ Test delivery page (/driver/test-delivery) with mock data — v1.8
- ✓ Mobile-first driver layouts with WCAG touch targets — v1.8
- ✓ Glassmorphism polish and stagger animations on driver pages — v1.8
- ✓ Dead code cleanup (~10 unused exports, useABTest, barrel file) — v1.8
- ✓ Checkout TOCTOU cleanup, cutoff datetime logic, cart dedup, modifier validation, refund status — v1.9
- ✓ Configurable business rules (cutoff, fee, hours, radius) via admin settings — v1.9
- ✓ Saturday Ops Dashboard with bulk operations, countdown timers, driver availability — v1.9
- ✓ Route & driver assignment with Leaflet map, geographic clustering, one-click routes — v1.9
- ✓ Customer delivery gate (dynamic hero, menu banner, cart countdown, cutoff modal) — v1.9
- ✓ Email reliability (webhook verification, retry, admin dashboard, ops indicators) — v1.9
- ✓ Driver simple mode (2-tab nav, SimpleStopView, confirm dialog, offline overlay) — v1.9
- ✓ Production hardening (5 indexes, rate limits, N+1 fix, pagination, Sentry context) — v1.9
- ✓ Auth routing fix (admin/driver land on correct dashboard after login/OAuth) — v2.1
- ✓ Order detail completeness (items/modifiers/instructions, contact, payment, tip, delivery notes on one screen) — v2.1
- ✓ Admin route editing (drag-reorder stops, split/merge routes, driver reassignment) — v2.1
- ✓ Driver route flow (accept/decline → stop reordering in advanced mode) — v2.1
- ✓ Admin mobile UX (drawer nav, card layouts, 44px touch targets, route progress widget) — v2.1
- ✓ Driver page audit (all pages load real data, no empty/stub content) — v2.1

### Active

<!-- Next milestone TBD -->

- [ ] Push/email notifications for route assignments (NOTF-01)
- [ ] Customer delivery status email updates with photo proof (NOTF-02)
- [ ] Photo proof delivery (optional, visible to admin + customer + email updates)
- [ ] Manual delivery tracking (driver status updates per stop, no live GPS)
- [ ] Route optimization (auto-sort by proximity beyond existing drag-reorder)

### Out of Scope

- Real-time GPS map for customers — text status updates suffice at 20-50 orders
- Driver gamification/badges — family drivers don't need this
- Advanced analytics dashboards — simple counts + revenue enough
- Route optimization algorithm — manual drag-reorder shipped in v2.1; auto-sort by proximity deferred to next milestone
- Push notifications via service worker — email + text covers it
- Customer loyalty/referral system — get first 50 regulars first
- Multi-admin role system — solo operator for now
- WCAG 2.1 AA compliance — deferred from original v1.9 plan
- Internationalization (Myanmar/English) — deferred from original v1.9 plan
- Storybook/Chromatic visual regression — deferred from original v1.9 plan
- Multi-restaurant marketplace — not part of Morning Star scope
- Docker/Kubernetes — Vercel is serverless; containerization adds zero value

## Last Milestone: v2.1 Route Operations & Admin Mobile (SHIPPED 2026-03-17)

**Delivered:** Full route lifecycle management — admins and drivers can plan, edit, optimize, and execute delivery routes entirely from their phones on Saturday. 18/18 requirements, 5 phases, 22 plans.

## Previous Milestone: v2.0 Production-Grade Launch MVP (SHIPPED 2026-03-04)

**Delivered:** Production-ready for real Saturday operations — solo operator triaging 20-50 orders with family/friend drivers. All 49 requirements satisfied across 12 phases.

## Context

**Tech stack:**

- Next.js 16.1.2 + React 19.2.3 + TailwindCSS 4
- Framer Motion 12.26.1 (async domAnimation root, per-route domMax) + GSAP 3.14.2
- React Compiler (babel-plugin-react-compiler)
- Zustand + idb-keyval for state management (cart persisted to IndexedDB)
- Supabase auth + Stripe checkout
- Serwist for service worker (@serwist/build)
- Resend + React Email for transactional emails
- Sentry for error monitoring + Speed Insights for RUM
- Fuse.js for fuzzy search
- Upstash Redis for distributed rate limiting
- Recharts for driver earnings charts
- @dnd-kit for drag-reorder on admin and driver routes
- ~90,766 lines TypeScript (src/)

**Remaining tech debt:**

- 6+ Supabase migrations pending production apply
- RESEND_WEBHOOK_SECRET env var needs configuration for webhook verification
- Upstash Redis provisioning needed on Vercel Marketplace for production rate limiting
- Sentry alert rule "Rate Limit Spike" needs manual dashboard creation
- Timezone confirmation: Asia/Yangon vs America/Los_Angeles for customer-facing cutoff
- Lighthouse CI gates at score 60 (target 70, conservative threshold)
- Apple Sign-in deferred (no Apple Developer account)
- Chromatic visual regression baselines deferred
- SETT-04 language preference deferred
- OrderDetailPanel composed wrapper unused in route detail context (subcomponents used directly)
- Human verification outstanding for phases 101 (6 items) and 102 (9 items)

**Deferred requirements (carried from v1.8):**

- NOTF-01/02: Push/email notifications for route assignments
- ADV-01-04: Driver messaging, weather alerts, auto-assignment, tip tracking
- QUAL-01-03: Chromatic baselines, Lighthouse 70, Apple Sign-in

**Design direction:**

- Animation-first: GSAP for timelines/scroll, Framer Motion for components
- Reference apps: DoorDash, Uber Eats, Pepper template
- V8 colors: amber-500 primary accent, warm dark mode undertones
- Admin accent: teal for admin/driver pages (distinct from customer amber)

## Constraints

- **Tech stack**: Next.js App Router, TailwindCSS, Supabase, Stripe — keep existing
- **Backend contracts**: API routes and Supabase schema stay stable
- **Approach**: Fresh components in new directories, parallel development, swap when ready
- **Skill usage**: Use `@.claude/skills/UI-UX-Color-Designs` for design system work

## Key Decisions

<details>
<summary>v1.0-v1.7 decisions (50+ items)</summary>

| Decision | Rationale | Outcome |
|---|---|---|
| Full frontend rewrite (not incremental fixes) | V7 has systemic layering issues | ✓ Good — clean codebase |
| Animation everywhere (not selective) | User wants "over-the-top animated" | ✓ Good — distinctive feel |
| ESLint z-index rules at error severity | Prevents regression | ✓ Good — enforced |
| UnifiedMenuItemCard 3D tilt | 18-degree max, spring physics | ✓ Good — premium feel |
| OLED dark mode (pure black) | #000000 surfaces for OLED | ✓ Good — battery friendly |
| React Compiler enabled globally | 282 client components auto-memoized | ✓ Good |
| LazyMotion domMax + strict at root | motion._ → m._ migration (174 files) | ✓ Good |
| CSS-only hero animations | No LCP-blocking opacity:0 | ✓ Good |
| Passwordless auth | Magic link + OAuth more secure | ✓ Good |
| Fire-and-forget email sending | Email failure never blocks API | ✓ Good |
| Content-hash precache | Deterministic cache invalidation | ✓ Good |
| Lighthouse CI error assertions | LCP <4s and CLS <0.15 block PRs | ✓ Good |

</details>

### v1.8 Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| CSP `unsafe-inline` for style-src | GSAP has no nonce support; Tailwind uses inline styles | ✓ Acceptable — documented exception |
| Upstash Redis for rate limiting | In-memory Map non-functional on serverless (no shared state) | ✓ Good — production-ready |
| Fail-open rate limiting | Redis outage shouldn't block all requests | ✓ Good — availability over strictness |
| Role redirects in auth callback | Callback has session context; middleware doesn't | ✓ Good — reliable role detection |
| Silent wrong-role redirects | No `/?error=` params; just redirect to correct dashboard | ✓ Good — clean UX |
| getRoleDashboard() centralized | Single source of truth for role-to-dashboard mapping | ✓ Good — DRY |
| Passwordless driver onboarding | Magic link auth only; no password pages for drivers | ✓ Good — simpler UX |
| JSONB for driver availability | Flexible schema for recurring + blocked dates | ✓ Good — avoids join tables |
| Recharts for earnings charts | Already in bundle; lighter than Victory/Nivo | ✓ Good — zero new deps |
| testMode prop pattern | Components skip API calls when testMode=true | ✓ Good — mock data isolation |
| Gap closure via milestone audit | Audit caught 3 wiring gaps that verification missed | ✓ Essential — pre-built components need integration testing |
| Wiring fixes over rebuilds | SEC-02, DPROF-05, DDASH-07 were all existing components needing connection | ✓ Good — minimal code, maximum impact |

### v1.9 Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| 5s polling over Supabase Realtime for ops dashboard | Indistinguishable at 20-50 orders, no new dependency | ✓ Good — simpler, reliable |
| Click-to-assign over drag-and-drop for routes | Faster at 2-4 drivers, research confirmed | ✓ Good — efficient UX |
| Server-side simple_mode DB column | Persists across devices, not localStorage | ✓ Good — reliable |
| Bulk ops via server-side RPC | Atomicity + sequential PATCH with 100ms delay avoids rate limits | ✓ Good — no partial failures |
| Zero new npm packages for entire milestone | Reduced bundle, used installed deps | ✓ Good — discipline |
| Trigger-based refund_status computation | Single source of truth, no application logic drift | ✓ Good — data integrity |
| unstable_cache + tag invalidation for business rules | Immediate propagation on admin save, 5min default TTL | ✓ Good — fast updates |
| Greedy clustering over k-means for route suggestions | Simpler, stable at 10-50 orders, no param tuning | ✓ Good — predictable |
| svix HMAC for webhook verification | Industry standard, prevents forged email status updates | ✓ Good — security |
| simple_mode default true for new drivers | Non-technical family members see simple UI by default | ✓ Good — safe default |
| Gap closure via 4 additional phases (85-88) | Audit found verification + integration gaps after core 8 phases | ✓ Essential — 100% coverage |

### v2.1 Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| @dnd-kit for drag-reorder (not react-beautiful-dnd) | Active maintenance, smaller bundle, better touch support | ✓ Good — works on desktop + mobile |
| DragReorderList as generic component | Reused in admin (StopsList) and driver (ActiveRouteView) | ✓ Good — zero duplication |
| Move-up/move-down buttons for mobile reorder | Drag on mobile is unreliable; discrete buttons with 44px targets | ✓ Good — accessible, reliable |
| split_route/merge_routes as PostgreSQL RPCs | Atomic multi-table operations; SECURITY DEFINER bypasses RLS | ✓ Good — no partial failures |
| 5-status route lifecycle (planned→assigned→accepted→in_progress→completed) | Separates admin assignment from driver acknowledgment | ✓ Good — clear state transitions |
| Admin PATCH auto-transitions (assign→assigned, unassign→planned) | Reduces admin clicks; status always reflects reality | ✓ Good — intuitive |
| after() for decline email | Fire-and-forget; never blocks the API response | ✓ Good — consistent with v1.9 pattern |
| Drawer navigation (not bottom nav) for admin mobile | 12+ nav items; bottom nav can't hold that many | ✓ Good — scales to any nav count |
| Strategy B (dual render) for table/card | md:hidden + hidden md:block; no JS needed for responsive switch | ✓ Good — instant, no layout shift |
| 5s polling for route progress widget | Same pattern as v1.9 ops dashboard; Supabase Realtime overkill | ✓ Good — consistent, reliable |
| Gap closure as Phase 103 (not inline fixes) | 19 structural gaps from audit; better tracked as explicit phase | ✓ Good — clean audit trail |

---

_Last updated: 2026-03-17 after v2.1 milestone completion_
