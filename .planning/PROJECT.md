# Morning Star Delivery App — V8 UI Rewrite

## What This Is

A full frontend rewrite of the Morning Star Weekly Delivery meal subscription app. Fresh V8 component library with portal-based overlays, tokenized z-index system, and animation-first design using GSAP and Framer Motion. Nine milestones shipped (v1.0-v1.8): customer flows, tech debt cleanup, playful UI overhaul, codebase consolidation, mobile excellence, performance infrastructure, production polish, production deployment, and post-launch hardening with driver experience. V1.8 completed security hardening (enforcing CSP + security headers, comprehensive RLS audit of all 24 tables, distributed rate limiting via Upstash Redis), full driver experience overhaul (profile setup with photo upload, earnings dashboard with charts and badges, availability scheduling, weekly route visibility, history with pagination), role-based auth redirects (admin/driver/customer), passwordless driver onboarding, guided walkthrough with test delivery page, and glassmorphism UI polish matching customer-side quality.

## Core Value

**Every UI element is reliably clickable and the app feels delightfully alive with motion.** If overlays block clicks or animations feel janky, we've failed.

## Current State (v1.8 shipped)

- 9 milestones complete: v1.0-v1.8 (74 phases, 310 plans, 370+ requirements)
- Deployed to production at delivery.mandalaymorningstar.com
- Health endpoint validates 5 services (Supabase, Stripe, Google OAuth, Search Console, Resend)
- Full observability: Sentry client/server/edge with source maps, Speed Insights, web vitals
- LCP optimized to <4s (async LazyMotion, CSS-only hero, CI-enforced)
- Enforcing CSP + 5 security headers on all responses with Sentry violation reporting
- All 24 Supabase tables have verified RLS policies with 62-assertion regression test
- Distributed rate limiting via Upstash Redis on all API endpoints
- Role-based auth redirects: admin→/admin, driver→/driver, customer→/menu
- Full driver experience: profile, earnings, availability, schedule, history, onboarding walkthrough
- 335 unit tests passing across 16 test files
- ~123,633 lines TypeScript total

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

### Active

_(No active milestone — ready for v1.9+ planning)_

### Out of Scope

- Backend/schema changes — Supabase + Stripe contracts stay stable
- Multi-restaurant marketplace — not part of Morning Star scope
- Real-time subscriptions — current REST pattern sufficient for launch
- Docker/Kubernetes — Vercel is serverless; containerization adds zero value
- Multi-region deployment — single US region fine for LA-based service

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
- ~123,633 lines TypeScript total

**Remaining tech debt:**

- Lighthouse CI gates at score 60 (target 70, conservative threshold)
- Upstash Redis provisioning needed on Vercel Marketplace for production rate limiting
- Sentry alert rule "Rate Limit Spike" needs manual dashboard creation
- Apple Sign-in deferred (no Apple Developer account)
- Chromatic visual regression baselines deferred
- SETT-04 language preference deferred

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

---

_Last updated: 2026-02-23 after v1.8 milestone archived_
