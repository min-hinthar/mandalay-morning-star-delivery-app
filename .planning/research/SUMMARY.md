# Project Research Summary

**Project:** Mandalay Morning Star Delivery App — v1.8 Post-Launch Hardening & Driver Experience
**Domain:** Security hardening (CSP, RLS, rate limiting) + driver dashboard feature expansion for a Next.js 16 / Supabase / Vercel weekly meal delivery PWA
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

v1.8 is a hardening and driver-experience milestone on top of a fully operational delivery app. The security track (CSP headers, RLS audit, distributed rate limiting, role-based redirects) must land before driver features, because every driver feature query assumes correct RLS and every page load should be protected by CSP. The recommended execution order is: security foundations first (CSP via `next.config.ts` + `proxy.ts` for auth refresh, Upstash Redis rate limiting, RLS policy audit), then driver features (profile, earnings, availability, history, guided walkthrough).

Two major architectural decisions are resolved by research: (1) CSP must use `'unsafe-inline'` for `style-src` — the app has 700+ inline style usages, GSAP has no nonce support for style attributes, and nonce-based CSP would force all 20+ static/ISR pages to dynamic rendering, regressing the hard-won <4s LCP. (2) Rate limiting must move from the current in-memory `Map` to Upstash Redis — the in-memory limiter is already silently failing in production because Vercel serverless instances don't share state. Both decisions are HIGH confidence from official docs and direct codebase audit.

The main risks cluster in two areas: CSP rollout (breaking Google Maps markers, Stripe Elements, or Sentry reporting if the third-party domain allowlist is incomplete) and RLS modifications (policy changes on live tables with no policy temporarily expose all data — the project's own migration history shows 5 consecutive driver-invite RLS fix migrations as evidence). Both risks have clear mitigations: deploy CSP in Report-Only mode first, and always drop/create policies in the same transaction.

## Key Findings

### Recommended Stack

v1.8 requires exactly **two new npm packages**: `@upstash/redis` and `@upstash/ratelimit`. Everything else uses existing dependencies already installed. The CSP implementation goes in `next.config.ts` `headers()` (not nonce-based `proxy.ts`), which avoids forcing dynamic rendering. Auth token refresh requires a new `src/proxy.ts` file (Next.js 16 renamed `middleware.ts` to `proxy.ts`). Driver dashboards use already-installed Recharts 3.6.0 and date-fns 4.1.0. Driver availability uses a JSONB column on the existing `drivers` table rather than a new table. Upstash Redis is provisioned via Vercel Marketplace integration (free tier: 500K commands/month; estimated usage <10K/month for this scale).

**Core technologies:**
- `@upstash/redis@^1.36.2` + `@upstash/ratelimit@^2.0.8`: Replace in-memory Map rate limiter — HTTP-based, serverless-native, sliding window algorithm, shared state across all Vercel instances
- `src/proxy.ts` (new file): Supabase auth token refresh only — CSP and role redirects are handled elsewhere; excludes `/monitoring` (Sentry tunnel), webhooks, and static assets from matcher
- `next.config.ts` headers: CSP + security headers — non-nonce approach preserves static rendering and existing LCP performance
- Recharts 3.6.0 (existing): Driver earnings charts — already used for admin analytics, consistent, zero additional install
- `drivers.availability_json JSONB` (schema change): Driver availability — simpler than a new table for a once-per-week delivery service

### Expected Features

Research classified 13 features across 4 phases. Security features are P0 (must ship before driver features). Driver profile and earnings are P1 (highest-value visible improvements). Availability scheduling and history enhancements are P1-P2. Guided walkthrough and test delivery page are P2 (depends on all other driver features working).

**Must have (table stakes):**
- Role-based login redirects — drivers currently land on customer homepage after login; confusing UX
- CSP headers — no CSP exists today; only `poweredByHeader: false` is set as a security header
- RLS audit — newer tables (migrations 008-020) have unknown or inconsistent policy coverage
- Rate limiting upgrade — current in-memory limiter is silently non-functional on Vercel (new Map per cold start)
- Driver profile edit page — onboarding collects profile data but drivers cannot update it afterward
- Earnings dashboard — `weeklyEarningsCents` prop exists in `DriverDashboardProps` but is always `undefined`

**Should have (differentiators):**
- Planned/upcoming route visibility — drivers see only today's route, not the full coming week
- Driver availability scheduling — admin cannot see who is available when assigning routes
- History enhancements (date filter, pagination) — current history page has no filtering or pagination
- Driver nav restructure (add Earnings + Profile tabs) — current 3 tabs are insufficient for new pages

**Defer (v2+):**
- Push notifications for route assignments — requires service worker push subscription + backend push service
- Real-time earnings tracking — weekly delivery model makes this unnecessary; compute on route completion
- Driver-to-admin messaging — phone call is sufficient for 2-3 driver team
- Tip tracking — no tip infrastructure in current Stripe checkout flow
- Automated route assignment — manual admin assignment appropriate at this scale

### Architecture Approach

The v1.8 architecture is additive to the existing Next.js 16 App Router structure with no breaking changes. Security changes are either config-level (`next.config.ts` CSP headers) or new thin files (`src/proxy.ts` for auth refresh). Role-based redirects go in `src/app/auth/callback/route.ts` — NOT in `proxy.ts` — because the callback already has session context, while proxy runs on every request without reliable user identity. New driver pages follow the existing pattern: Server Component page with Suspense boundary, Client Component for interactivity, auth inherited from `driver/layout.tsx`. Driver availability uses `availability_json JSONB` on the `drivers` table. Test delivery uses an `is_test` flag on the `routes` table to use real APIs with flagged data.

**Major components:**
1. `src/proxy.ts` (new) — Supabase auth token refresh only; thin pass-through; no redirects or rate limiting
2. `next.config.ts` `headers()` (modified) — CSP directives + X-Frame-Options + HSTS + Referrer-Policy + Permissions-Policy
3. `src/lib/utils/rate-limit.ts` (rewrite) — replace `Map` with `@upstash/ratelimit` at module scope; sliding window for auth, fixed window for driver location
4. `src/app/auth/callback/route.ts` (modified) — add role-based redirect: admin→`/admin`, driver→`/driver`, customer→`/menu`; preserve `?next=` param
5. `src/app/(driver)/driver/earnings/` (new) — earnings dashboard with Recharts charts; computed from `routes`+`route_stops` aggregate via new `GET /api/driver/earnings`
6. `src/app/(driver)/driver/availability/` (new) — weekly availability UI; reads/writes `drivers.availability_json`
7. `src/app/(driver)/driver/profile/` (new) — profile edit form + photo upload to new `driver-photos` Supabase Storage bucket
8. `src/app/(driver)/driver/test-delivery/` (new) — guided walkthrough using real APIs with `routes.is_test = true` flag; `WalkthroughOverlay` component
9. SQL migrations — RLS policy fixes for `order_audit_log` and `driver_invites` consolidation; `drivers.availability_json` JSONB column; `routes.is_test` BOOLEAN column

### Critical Pitfalls

1. **CSP + GSAP/Framer Motion style-src conflict** — GSAP has zero nonce support for inline styles; JSX `style={{ }}` props use `setAttribute` which strict `style-src` blocks. Use `'unsafe-inline'` for `style-src`; apply nonces only to `script-src`. Refactor 5 `cssText` usages in `FlyToCart.tsx` (line 145) and `CustomMarkers.tsx` (lines 11/36/52/70) to individual DOM property assignments before enforcing CSP.

2. **CSP third-party domain allowlist is incomplete** — Google Maps requires `worker-src blob:` for web workers; Stripe.js requires `blob:` in `frame-src`; missing any one domain silently breaks that service with no user-visible error. Deploy `Content-Security-Policy-Report-Only` first; run in production collecting violations via Sentry before switching to enforcing mode.

3. **RLS policy gap window** — dropping an existing policy before its replacement creates a window where RLS is enabled with no policies and all queries return empty data (not errors). Always wrap in a transaction: `BEGIN; DROP POLICY old; CREATE POLICY new; COMMIT;`. The project's own migration history (5 consecutive driver-invite RLS fix migrations 014-018) is direct evidence of this pattern causing production cascades.

4. **RLS using user_metadata for role checks is insecure** — `user_metadata` is user-editable via `supabase.auth.updateUser()` from the browser. Any authenticated user could set `role: "admin"`. Always use database-backed functions: `is_admin()`, `is_driver()`, `get_my_driver_id()`. Existing policies are correct; all new driver policies must follow the same pattern.

5. **Role redirect breaks driver onboarding** — middleware detecting `role: "driver"` and redirecting to `/driver` before onboarding completes sends the driver to a page requiring `is_active = true`, which doesn't exist until after onboarding. Role-based redirects must live in the auth callback (not proxy.ts); whitelist `/driver/onboard` from all redirect logic; check `is_active` before redirecting to `/driver`.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Security Foundation — CSP + proxy.ts
**Rationale:** CSP is additive-only with zero feature dependencies. `proxy.ts` is required by Supabase SSR for auth token refresh on every page. Getting both right first means all subsequent pages are protected without modification. Lowest risk phase — pure additions.
**Delivers:** CSP headers on all routes via `next.config.ts`; `src/proxy.ts` for Supabase auth refresh; security header suite (X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy)
**Addresses:** Zero security headers in production today; Supabase SSR token expiry (no proxy exists)
**Avoids:** Pitfall 1 (CSP breaks animations) — `'unsafe-inline'` for `style-src`; deploy Report-Only first; Pitfall 2 (incomplete domain allowlist) — verify all 6 external services; Pitfall 3 (nonces kill LCP) — non-nonce approach confirmed

### Phase 2: Distributed Rate Limiting
**Rationale:** Short, self-contained, no UI work. Requires Vercel Marketplace provisioning (Upstash Redis) before coding begins. Parallelizable with Phase 3 RLS work since both are infra changes with no UI.
**Delivers:** Replace in-memory Map with `@upstash/ratelimit`; sliding window for auth endpoints; fixed window for driver location; rate limiting extended to all API routes (currently auth-only)
**Uses:** `@upstash/redis@^1.36.2` + `@upstash/ratelimit@^2.0.8` (2 new packages); Vercel Marketplace Redis integration
**Avoids:** Pitfall 7 (in-memory limiter silently fails) — Upstash Redis is shared state across all serverless instances; Upstash instance created at module scope for ephemeral cache benefits

### Phase 3: RLS Audit
**Rationale:** Security audit before adding driver features that touch more data. Can run in parallel with Phase 2 (both are SQL/infra work with no UI). Must complete before Phase 5+ driver features that introduce new tables and columns.
**Delivers:** Verified RLS on all 24 tables; fix `order_audit_log` using raw `profiles.role` instead of `is_admin()`; consolidate `driver_invites` policies (4 fix migrations indicates fragility); expanded `rls-isolation-test.mjs` covering all roles
**Avoids:** Pitfall 4 (policy gap window) — transactional DROP+CREATE; Pitfall 5 (user_metadata role checks) — policy review checklist; Pitfall 8 (missing RLS for new driver tables) — establish correct pattern before adding tables

### Phase 4: Role-Based Redirects
**Rationale:** Two-file change with high UX impact. Depends on Phase 1 (proxy.ts must exist for auth refresh). Must come before driver feature pages so drivers land correctly on first visit.
**Delivers:** admin→`/admin`, driver→`/driver`, customer→`/menu` after login; preserve `?next=` param; new-driver edge case defaults to `/menu`
**Addresses:** Drivers currently land on customer homepage after login
**Avoids:** Pitfall 6 (middleware redirect loop) — redirects in auth callback not proxy.ts; Pitfall 9 (breaks onboarding) — whitelist `/driver/onboard`; check `is_active` before redirecting to `/driver`

### Phase 5: Driver Profile Setup
**Rationale:** Schema foundation for other driver features. Adds `drivers.availability_json JSONB` column (used in Phase 7). Establishes `driver-photos` Storage bucket pattern. Earnings dashboard (Phase 6) displays vehicle info from profile.
**Delivers:** `/driver/profile` edit page; photo upload to `driver-photos` Supabase Storage bucket; PATCH API endpoint; `drivers.availability_json JSONB` column migration
**Uses:** Existing react-hook-form + zod; existing Radix UI Select/Dialog; Supabase Storage (new bucket, follows `menu-photos` pattern exactly)
**Avoids:** Pitfall 8 (missing driver RLS) — `driver-photos` bucket needs Storage policies; test as driver A cannot see driver B's photo

### Phase 6: Driver Earnings Dashboard
**Rationale:** Highest-value visible improvement for drivers. `weeklyEarningsCents` prop already exists in `DriverDashboardProps` but is always `undefined` — this phase wires it up. Recharts is already installed and in use for admin analytics.
**Delivers:** `/driver/earnings` page with weekly/monthly bar chart; earnings computed from `routes`+`route_stops` aggregate (no new tables); DriverNav restructured to 4 tabs (Home, Route, Earnings, Profile); `GET /api/driver/earnings` endpoint
**Uses:** Recharts 3.6.0 (existing); date-fns 4.1.0 `startOfWeek`/`eachDayOfInterval` (existing); exclude `routes.is_test = true` from earnings calculation
**Avoids:** Hardcoded earnings logic anti-pattern — centralize computation in API route, not scattered across components

### Phase 7: Driver Availability & Route Visibility
**Rationale:** Operational features that depend on Phase 5 schema (`drivers.availability_json` column). Planned routes require no schema changes — existing RLS already allows drivers to query future routes. Availability and route history are complementary features shipped together.
**Delivers:** `/driver/availability` page — weekly day-of-week toggles + specific date overrides; upcoming assigned routes section on driver home; history page date-range filter + pagination; `GET /api/driver/routes/upcoming` endpoint
**Uses:** Radix UI Checkbox (existing); date-fns `eachDayOfInterval` (existing); existing RLS on `routes` table already allows driver to query own future routes
**Avoids:** Separate availability table anti-pattern — once-weekly delivery model doesn't warrant full scheduling table; `availability_json` JSONB is sufficient and avoids new RLS surface area

### Phase 8: Guided First Delivery & Polish
**Rationale:** Last because it exercises all other driver features in sequence. Test delivery uses real APIs with `routes.is_test = true` flag — same code path, flagged data. Walkthrough overlay is a new UI pattern requiring design decisions not yet made.
**Delivers:** `/driver/test-delivery` page with step-by-step coach marks overlay; `routes.is_test BOOLEAN` migration; `WalkthroughOverlay` component; onboarding checklist on driver dashboard for new drivers; driver UI polish pass
**Uses:** Framer Motion (existing, for overlay transitions); real route/stop API endpoints with `is_test` flag
**Avoids:** Mock API anti-pattern — test delivery uses real APIs so drivers learn the actual flow; mock endpoints would diverge from real behavior silently

### Phase Ordering Rationale

- Security first: CSP and proxy.ts have zero feature dependencies and protect all subsequent work
- Rate limiting (Phase 2) and RLS audit (Phase 3) are parallelizable — both are infra/SQL work with no UI concerns
- Role redirects (Phase 4) require proxy.ts from Phase 1 to be working
- Driver features ordered by schema dependency: profile establishes `availability_json` column → earnings displays it → availability reads/writes it → walkthrough exercises all of it
- All phases follow the existing Server Component + Suspense + Client Component pattern; no architecture divergence introduced

### Research Flags

Needs deeper research during planning:
- **Phase 8 (Walkthrough):** Overlay UX design is unspecified — step content, trigger conditions, dismissal behavior, re-triggering mechanism. Needs product decisions before implementation begins.
- **Phase 7 (Availability business rules):** Is Saturday-only toggle sufficient, or do drivers set recurring day-of-week patterns? Confirm with product before finalizing schema.
- **Phase 6 (Earnings computation):** `route_stops` does not currently have `order_total_cents` — earnings must join through `orders.total_cents`. Verify join path and indexing before implementation.

Standard patterns (skip research-phase):
- **Phase 1 (CSP + proxy.ts):** Official Next.js 16 docs provide exact implementation; codebase audit confirmed all third-party domains
- **Phase 2 (Rate limiting):** Upstash + Vercel Marketplace is a first-party integration with reference template
- **Phase 3 (RLS audit):** Existing migration patterns (`is_admin()`, `get_my_driver_id()`) are the template; extend, do not invent
- **Phase 4 (Role redirects):** Two-file modification with clear Supabase SSR docs
- **Phase 5 (Driver profile):** Follows existing admin photo upload pattern exactly

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 2 new packages confirmed from official Upstash docs; all other dependencies verified as already installed in package.json |
| Features | HIGH | Verified against codebase; existing props (`weeklyEarningsCents`), pages, and API routes confirmed; earnings computation join path and availability business rules are MEDIUM |
| Architecture | HIGH | Codebase directly examined; Next.js 16 + Supabase SSR patterns verified from official docs; role redirect placement in callback vs proxy is definitively resolved |
| Pitfalls | HIGH | 9 pitfalls with direct codebase evidence (cssText locations, migration cascade history, in-memory Map code) and official doc citations |

**Overall confidence:** HIGH

### Gaps to Address

- **Earnings computation join path:** `route_stops` does not currently have `order_total_cents`. Earnings must join through `orders.total_cents`. Verify this join is viable and properly indexed before Phase 6 implementation begins.
- **Availability business rules:** Is Saturday-only toggle sufficient? Can drivers set recurring weekly day-of-week patterns or just mark specific dates? Confirm with product before Phase 7 schema design is finalized.
- **CSP domain completeness:** All known domains are documented in STACK.md and PITFALLS.md, but a 1-2 week Report-Only deployment may surface additional domains. Treat Phase 1 CSP as "ship Report-Only, harden in follow-up PR."
- **`worker-src blob:` requirement:** Google Maps and Stripe both use blob-based web workers. Verified from official docs but must be confirmed against the specific `@react-google-maps/api@2.20.8` version installed.
- **Upstash free tier adequacy:** Estimated <10K commands/month. Confirm actual usage stays below 500K/month free tier after rate limiting is extended from auth-only to all API routes.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 proxy.ts API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — middleware-to-proxy rename, exported function signature
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) — nonce vs non-nonce, dynamic rendering requirement, PPR incompatibility, SRI webpack-only limitation
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — proxy.ts pattern, `getClaims()` vs `getSession()`, cookie management
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy structure, USING vs WITH CHECK
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — index requirements, `(select auth.uid())` initplan optimization
- [Upstash Ratelimit Getting Started](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted) — sliding window setup, module-scope instantiation for ephemeral cache
- [Vercel Redis Marketplace](https://vercel.com/docs/redis) — Vercel KV deprecated; Upstash is official replacement
- [Upstash Rate Limiting Blog](https://upstash.com/blog/nextjs-ratelimiting) — Next.js API route integration pattern
- [Google Maps CSP Guide](https://developers.google.com/maps/documentation/javascript/content-security-policy) — `worker-src blob:` requirement
- [Stripe CSP Requirements](https://docs.stripe.com/security/guide) — `blob:` for Stripe.js web workers, `frame-src` domains
- [Sentry CSP Reporting](https://docs.sentry.io/platforms/javascript/guides/nextjs/security-policy-reporting/) — Report-Only mode, `connect-src` domain for `*.ingest.us.sentry.io`
- [Framer Motion CSP Issue #1727](https://github.com/framer/motion/issues/1727) — inline styles incompatibility documented
- [GSAP SplitText CSP Thread](https://gsap.com/community/forums/topic/34053-splittext-inline-style-content-security-policy-violation/) — GSAP has no nonce support for style attributes
- [MDN style-src Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src) — DOM property assignment not blocked; `cssText`/`setAttribute` are blocked
- Direct codebase audit — `src/lib/utils/rate-limit.ts` (Map-based, email-only identifier), `src/app/auth/callback/route.ts` (driver invite flow), `FlyToCart.tsx` line 145 + `CustomMarkers.tsx` lines 11/36/52/70 (cssText usages), `AppHeader.tsx` line 170 (dangerouslySetInnerHTML style), migrations 014-018 (RLS cascade evidence), `scripts/rls-isolation-test.mjs` (existing test scope)

### Secondary (MEDIUM confidence)
- [@upstash/ratelimit npm](https://www.npmjs.com/package/@upstash/ratelimit) — version 2.0.8 (npm page 403'd at research time; version from search results)
- [@upstash/redis npm](https://www.npmjs.com/package/@upstash/redis) — version 1.36.2 (from search results)
- [Supabase RLS Complete Guide 2026 (DesignRevision)](https://designrevision.com/blog/supabase-row-level-security) — user_metadata modification risk
- [Dashboard Design Principles (DesignRush)](https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-design-principles) — earnings dashboard UX patterns
- [UserPilot Onboarding UX Examples](https://userpilot.com/blog/onboarding-ux-examples/) — coach marks overlay pattern

---
*Research completed: 2026-02-16*
*Ready for roadmap: yes*
