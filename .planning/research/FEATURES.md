# Feature Landscape: v1.8 Post-Launch Hardening & Driver Experience

**Domain:** Driver experience overhaul, security hardening, and role-based auth for weekly meal delivery PWA
**Researched:** 2026-02-16
**Confidence:** HIGH (verified against codebase, official Supabase/Next.js docs, web research)

## Current State Assessment

| Area                | Current State                                                                                 | v1.8 Target                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Driver dashboard    | Home with today's route + stats, active route view, history page                              | Add earnings, planned routes, availability, profile setup                        |
| Driver nav          | 3 tabs: Home, Route, History                                                                  | Expand for earnings + schedule tabs                                              |
| Driver onboarding   | POST /api/driver/onboard collects name, phone, vehicle, plate, password                       | Add guided first-delivery walkthrough                                            |
| Auth redirects      | All users land on `/` after login; driver layout checks role on render                        | Middleware-based redirect: admin -> /admin, driver -> /driver, customer -> /menu |
| CSP headers         | None configured; `poweredByHeader: false` is only security header                             | Full CSP with nonces for inline scripts                                          |
| RLS policies        | 17 tables have RLS policies in migration 002; newer tables (011-020) have partial RLS         | Audit all tables, add missing policies                                           |
| Rate limiting       | In-memory Map in `rate-limit.ts`; resets per serverless cold start                            | Upgrade to Upstash Redis or Vercel KV                                            |
| Driver profile      | DriversRow has vehicle_type, license_plate, phone, profile_image_url, onboarding_completed_at | Add profile edit page, photo upload                                              |
| Driver earnings     | DriverDashboardProps has `weeklyEarningsCents` field (unused, always undefined)               | Compute from route/delivery data, display dashboard                              |
| Driver availability | No concept of availability or schedule in schema                                              | New: driver_availability table + UI                                              |
| Planned routes      | Driver only sees today's in_progress/planned routes                                           | Show future assigned routes                                                      |

---

## Table Stakes (Users Expect These)

Features that are non-negotiable for the v1.8 driver experience and security milestones.

### 1. Role-Based Login Redirects

| Feature                                                                 | Why Expected                                                                               | Complexity | Depends On                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| Middleware-based auth redirect                                          | Drivers currently land on customer homepage after login; confusing UX                      | MEDIUM     | Next.js middleware, Supabase session, profiles.role lookup               |
| Role detection from JWT/profile                                         | Must check `profiles.role` (or `app_metadata.role` for admin) to determine redirect target | LOW        | Existing `requireAdmin`/`requireDriver` patterns                         |
| Redirect targets: admin -> /admin, driver -> /driver, customer -> /menu | Each role has a distinct landing page already built                                        | LOW        | Existing route groups                                                    |
| Auth callback role-aware redirect                                       | `/auth/callback` currently redirects to `next` param or `/`; should detect role            | LOW        | Existing callback route at `src/app/auth/callback/route.ts`              |
| Protect admin routes from non-admins at middleware level                | Currently checked in layout.tsx; middleware is more secure (blocks before render)          | MEDIUM     | Middleware must NOT call `getUser()` (expensive); use session JWT claims |

**Implementation pattern (verified from Supabase docs):**

- Create `middleware.ts` at project root (currently none exists)
- Use `@supabase/ssr` `updateSession()` to refresh auth tokens
- Read role from `session.user.app_metadata.role` (fast, no DB query)
- For drivers, fall back to profiles table check (role not in app_metadata by default)
- Redirect map: `{ admin: '/admin', driver: '/driver', customer: '/menu' }`
- Exclude from middleware: `/api/*`, `/_next/*`, `/auth/*`, `/login`, public pages

**Caveats:**

- `user_metadata` is user-editable and MUST NOT be trusted for auth. Use `app_metadata` (server-side only) or DB query.
- Middleware runs on edge; cannot use Node.js-only Supabase client. Use `@supabase/ssr` cookie-based client.
- Do NOT use middleware for heavy role lookups on every request; cache role in JWT claims via Supabase auth hook.

**Confidence:** HIGH -- verified via Supabase official docs for Next.js server-side auth and middleware pattern.

### 2. Content Security Policy Headers

| Feature                                             | Why Expected                                                                | Complexity | Depends On                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| CSP header via middleware (nonce-based)             | Prevents XSS; required for production security                              | MEDIUM     | Next.js middleware                               |
| Nonce generation per request                        | Each page render gets a unique nonce for inline scripts                     | LOW        | `crypto.randomUUID()` in middleware              |
| Allow Supabase, Stripe, Google Maps, Sentry domains | External scripts/connections must be whitelisted                            | LOW        | Know all external domains used                   |
| Allow Framer Motion/GSAP inline styles              | Animation libraries set inline styles; `style-src 'unsafe-inline'` or nonce | LOW        | App Router requires `'unsafe-inline'` for styles |
| Report-only mode first                              | Deploy CSP in report-only to catch violations before enforcing              | LOW        | `Content-Security-Policy-Report-Only` header     |

**Required CSP directives for this app:**

```
default-src 'self';
script-src 'self' 'nonce-{nonce}' 'strict-dynamic' https://js.stripe.com https://maps.googleapis.com;
style-src 'self' 'unsafe-inline';  // Required for App Router + animation libs
img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com https://drive.google.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com https://*.sentry.io https://vitals.vercel-insights.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Confidence:** HIGH -- verified via Next.js official CSP guide; `style-src 'unsafe-inline'` is required for App Router.

### 3. Supabase RLS Audit

| Feature                                         | Why Expected                                                                                                                                                    | Complexity | Depends On                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| Audit all tables for RLS enabled                | Some newer tables may lack RLS                                                                                                                                  | MEDIUM     | SQL query against pg_tables + pg_policies |
| Verify driver can only see own routes/stops     | `get_my_driver_id()` function used correctly                                                                                                                    | LOW        | Existing function in migrations           |
| Verify customer can only see own orders         | Existing policies look correct; need testing                                                                                                                    | LOW        | Test with different user sessions         |
| Verify admin bypass works for all tables        | `is_admin()` function checked                                                                                                                                   | LOW        | Existing function                         |
| Add RLS for tables added after 002_rls_policies | Tables from migrations 008-020: featured_sections, customer_settings, driver_invites, webhook_events, driver_ratings, order_audit_log, email_logs, app_settings | MEDIUM     | Individual migration files                |
| Index columns used in RLS policies              | `user_id`, `driver_id`, `route_id` used in WHERE clauses of policies                                                                                            | LOW        | CREATE INDEX IF NOT EXISTS                |

**Tables needing RLS audit (codebase-verified):**

| Table               | RLS Enabled? | Policies Exist?     | Notes                                         |
| ------------------- | ------------ | ------------------- | --------------------------------------------- |
| profiles            | YES          | YES (002)           | Select own + admin, update own                |
| addresses           | YES          | YES (002)           | Full CRUD for own, admin select               |
| menu_categories     | YES          | YES (002)           | Public read, admin write                      |
| menu_items          | YES          | YES (002)           | Public read, admin write                      |
| orders              | YES          | YES (002)           | Own read, admin update                        |
| order_items         | YES          | YES (002)           | Join-based own read                           |
| drivers             | YES          | YES (002)           | Own read/update, admin insert/delete          |
| routes              | YES          | YES (002)           | Driver-own + admin                            |
| route_stops         | YES          | YES (002)           | Route-owner + order-owner + admin             |
| location_updates    | YES          | YES (002)           | Driver-own insert, tracking read              |
| delivery_exceptions | YES          | YES (002)           | Route-owner + admin                           |
| driver_ratings      | YES          | YES (002)           | Order-owner insert, driver-own read           |
| featured_sections   | NEEDS CHECK  | Likely from 008/009 | May need admin-only write policy              |
| customer_settings   | NEEDS CHECK  | Likely from 019     | Own-only read/write                           |
| driver_invites      | YES          | YES (012-018)       | Multiple fix migrations -- verify final state |
| webhook_events      | NEEDS CHECK  | Unknown             | Should be service-role only                   |
| order_audit_log     | NEEDS CHECK  | Likely from 011     | Admin read, system insert                     |
| app_settings        | NEEDS CHECK  | Likely from 010     | Admin read/write                              |
| email_logs          | NEEDS CHECK  | Likely from 020     | Admin read                                    |

**Confidence:** HIGH -- verified from migration files in codebase.

### 4. Rate Limiting Upgrade

| Feature                                      | Why Expected                                                                                | Complexity | Depends On                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- |
| Replace in-memory Map with distributed store | Current rate limiter resets on each serverless cold start; useless on Vercel                | MEDIUM     | Upstash Redis or Vercel KV         |
| Sliding window algorithm                     | Current implementation is basic fixed-window; upgrade to sliding window for smoother limits | LOW        | `@upstash/ratelimit` provides this |
| Rate limit auth endpoints                    | signIn: 5/min, signUp: 3/hr, resetPassword: 3/hr (current config is good)                   | LOW        | Preserve existing config values    |
| Rate limit API routes                        | Add rate limiting to driver location updates, order creation, admin bulk operations         | LOW        | Apply to high-traffic endpoints    |
| Edge middleware rate limiting                | Block abusive IPs before they hit API routes                                                | MEDIUM     | Middleware + Upstash Redis         |

**Recommended approach: Upstash Redis + @upstash/ratelimit**

- Vercel KV is also Upstash-backed but Upstash direct is cheaper and has better rate limit SDK
- `@upstash/ratelimit` provides sliding window, token bucket, fixed window algorithms
- Caches data in edge function memory when "hot"; only calls Redis on cold start
- Cost: Upstash free tier gives 10K commands/day (sufficient for this app)

**Confidence:** HIGH -- verified via Upstash docs and Vercel rate limiting template.

### 5. Driver Earnings Dashboard

| Feature                           | Why Expected                                           | Complexity | Depends On                                             |
| --------------------------------- | ------------------------------------------------------ | ---------- | ------------------------------------------------------ |
| Weekly earnings summary card      | Drivers need to see what they earned this week         | MEDIUM     | Earnings computation logic; no `earnings` table exists |
| Per-route earnings breakdown      | Show earnings per completed route                      | LOW        | Computed from deliveries_count + route stats           |
| Earnings history (weekly/monthly) | Drivers want to see trends over time                   | MEDIUM     | Aggregate from completed routes                        |
| Earnings chart (bar/line)         | Visual earnings trend; Recharts already in the project | LOW        | Recharts (already installed, lazy-loaded)              |

**Schema consideration:**
The app has no `earnings` or `payments` table. Earnings must be derived from existing data or a new table.

Option A: **Compute from config** -- Admin sets per-delivery rate in app_settings; earnings = rate x deliveries. Simple but inflexible.

Option B: **New `driver_earnings` table** -- Track per-route earnings with columns: driver_id, route_id, delivery_date, base_pay_cents, bonus_cents, tip_cents, total_cents. More flexible, supports future features (bonuses, tips).

**Recommendation:** Option A for v1.8 (compute from config). The app is a small weekly delivery service with a fixed per-delivery rate. A dedicated earnings table is over-engineering for the current scale. Add it later if tip/bonus features are needed.

**Confidence:** MEDIUM -- earnings model depends on business rules not fully specified.

### 6. Driver Route History & Stats

| Feature                                 | Why Expected                                                  | Complexity | Depends On                  |
| --------------------------------------- | ------------------------------------------------------------- | ---------- | --------------------------- |
| Past routes list with completion stats  | Already exists at `/driver/history` with DriverHistoryContent | LOW        | Already built; enhance only |
| On-time percentage (computed from data) | Already showing real on-time percentage                       | DONE       | Already in v1.6             |
| Total deliveries count                  | Already on dashboard (deliveriesCount)                        | DONE       | DriversRow.deliveries_count |
| Average rating display                  | Already on dashboard (ratingAvg)                              | DONE       | DriversRow.rating_avg       |
| Route detail view with map              | Already exists at `/driver/route/[stopId]`                    | DONE       | Existing pages              |

**What's actually missing (codebase-verified):**

- No lifetime/monthly stats aggregation beyond the 3 stat cards
- No date-range filtering on history
- History shows recent routes but no pagination
- No "best week" or performance milestones

**Recommendation:** The history/stats feature is largely built. Focus v1.8 enhancement on: (1) date-range filtering, (2) pagination for history, (3) monthly summary view. Keep scope small.

**Confidence:** HIGH -- verified from existing DriverHistoryContent.tsx and history page.

### 7. Planned/Assigned Route Visibility

| Feature                                              | Why Expected                                                 | Complexity | Depends On                                               |
| ---------------------------------------------------- | ------------------------------------------------------------ | ---------- | -------------------------------------------------------- |
| See upcoming assigned routes (not just today's)      | Drivers currently only see today's planned/in_progress route | MEDIUM     | Query routes table for future dates                      |
| Weekly schedule view                                 | Show all routes assigned for the coming week                 | LOW        | Simple date-range query on routes table                  |
| Route preview with stop count and estimated duration | Before delivery day, driver sees what's coming               | LOW        | stats_json already has stop counts and duration          |
| Push notification for new route assignment           | Alert driver when admin assigns them a route                 | HIGH       | Requires push notification infrastructure (not in scope) |

**Implementation:**

- API: Add `/api/driver/routes/upcoming` endpoint querying `routes` where `driver_id = mine AND delivery_date > today AND status = 'planned'`
- UI: New section on driver home page showing upcoming routes, or a separate `/driver/schedule` page
- RLS: Existing `routes_select` policy already allows drivers to see their own routes (any date)

**Confidence:** HIGH -- routes table already has delivery_date and driver_id; just needs a new query endpoint.

### 8. Driver Availability Scheduling

| Feature                                 | Why Expected                                                   | Complexity | Depends On                       |
| --------------------------------------- | -------------------------------------------------------------- | ---------- | -------------------------------- |
| Mark available/unavailable days         | Admin needs to know which drivers are available for assignment | MEDIUM     | New `driver_availability` table  |
| Weekly availability calendar            | Visual day-of-week picker for recurring availability           | LOW        | Client-side calendar component   |
| One-off unavailability (vacation, sick) | Driver can block specific dates                                | LOW        | Date picker + availability table |
| Admin view of driver availability       | Admin sees who's available when creating routes                | MEDIUM     | Admin drivers page enhancement   |

**Schema recommendation:**

```sql
CREATE TABLE driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) NOT NULL,
  day_of_week INT,            -- 0=Sun..6=Sat (recurring weekly)
  specific_date DATE,          -- For one-off overrides
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- `day_of_week` for recurring (e.g., "I'm available every Saturday")
- `specific_date` for overrides (e.g., "Not available Feb 22")
- Specific date overrides recurring availability
- RLS: Driver can read/write own, admin can read all

**Context:** This is a weekly Saturday delivery service. Availability is primarily "am I available this Saturday?" Simple toggle per week is sufficient MVP.

**Confidence:** MEDIUM -- schema design is straightforward but business rules for availability need confirmation.

### 9. Driver Profile Setup & Edit

| Feature                                         | Why Expected                                                  | Complexity | Depends On                                                              |
| ----------------------------------------------- | ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Profile edit page (name, phone, vehicle, plate) | Onboarding collects these but driver can't change them        | LOW        | Update drivers/profiles tables                                          |
| Profile photo upload                            | `profile_image_url` field exists but no upload UI for drivers | MEDIUM     | Supabase Storage (menu-photos bucket exists; need driver-photos bucket) |
| Vehicle info display on dashboard               | Show vehicle type badge on driver home                        | LOW        | Already in DriversRow.vehicle_type                                      |
| Profile completeness indicator                  | Show what's missing from profile                              | LOW        | Check null fields                                                       |

**Existing onboarding flow (codebase-verified):**

- Admin invites driver via email magic link
- Driver clicks link -> auth callback sets role metadata -> redirect to /driver/onboard
- Onboard form collects: fullName, phone, vehicleType, licensePlate, password
- Creates profile + drivers record, marks invite accepted
- No profile photo upload in onboarding

**What to add:**

- `/driver/profile` page with edit form
- Photo upload component (reuse pattern from admin MenuItemPhotoSection)
- New Supabase Storage bucket: `driver-photos`
- Update to drivers table via PATCH endpoint

**Confidence:** HIGH -- existing onboard flow is well-understood; profile edit is straightforward extension.

### 10. Guided First Delivery Walkthrough

| Feature                                                | Why Expected                                       | Complexity | Depends On                                          |
| ------------------------------------------------------ | -------------------------------------------------- | ---------- | --------------------------------------------------- |
| Step-by-step tooltip walkthrough on first login        | New drivers need to understand the delivery flow   | MEDIUM     | Onboarding state tracking (onboarding_completed_at) |
| Interactive tour of dashboard, route view, stop detail | Walk through each major screen with action prompts | MEDIUM     | Tooltip/highlight overlay system                    |
| Test delivery mode                                     | Practice delivery flow without real orders         | HIGH       | Mock data system for test routes                    |
| Checklist showing completed onboarding steps           | Progress indicator for what's been learned         | LOW        | Local storage or driver record flags                |

**Recommendation:** Skip the full interactive tour and test delivery mode for v1.8. Instead:

1. **Onboarding checklist** on dashboard for new drivers (profile complete? first route viewed? first delivery done?)
2. **Contextual tooltips** on first visit to route/stop pages (use `onboarding_completed_at` as gate)
3. **Test page for delivery flow** -- a dedicated `/driver/test-delivery` with mock data (specified in project scope)

**Confidence:** MEDIUM -- walkthrough UX is well-documented in industry but implementation complexity varies.

---

## Differentiators (Competitive Advantage)

Features that elevate the driver experience beyond basic functionality.

| Feature                           | Value Proposition                                                                                                    | Complexity | Notes                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| Earnings streak/badges            | Gamification motivates consistent availability; DriverDashboard already has `badges` and `streakDays` props (unused) | LOW        | Wire up existing UI props with computed data      |
| Performance milestones            | "100 deliveries" badge, "5-star streak" -- driver retention tool                                                     | LOW        | Computed from existing driver stats fields        |
| Offline-first availability toggle | Driver can mark available/unavailable even without connection; sync via existing IndexedDB queue                     | MEDIUM     | Extend existing offline sync system               |
| Animated earnings counter         | Earnings number animates up as deliveries complete; AnimatedValue component already exists                           | LOW        | Reuse existing AnimatedValue from admin dashboard |
| Route preview with Google Maps    | Show upcoming route on map before delivery day; Google Maps already integrated                                       | LOW        | Reuse existing route map components               |
| Driver-to-admin messaging         | Quick message to admin about route issues without phone call                                                         | HIGH       | Requires new messaging infrastructure             |
| Weather-aware route alerts        | Show weather warnings for delivery day                                                                               | MEDIUM     | External weather API integration                  |

---

## Anti-Features (Do NOT Build for v1.8)

| Feature                             | Why It Seems Needed                | Why Problematic                                                                                              | Alternative                                                           |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Real-time earnings tracking         | "Drivers want instant updates"     | This is a weekly Saturday delivery, not gig economy; real-time adds complexity with no value                 | Show earnings on route completion                                     |
| Driver-side route optimization      | "Let drivers reorder stops"        | Admin assigns optimized routes; driver reordering undermines admin control and optimization                  | Admin optimizes, driver follows                                       |
| Tip tracking from customers         | "Drivers want to see tips"         | No tip infrastructure exists; Stripe checkout doesn't include tips; adding is a major feature                | Defer to v2 if tips are desired                                       |
| In-app navigation (turn-by-turn)    | "Drivers need directions"          | Google Maps/Waze deep links already provide this; building in-app nav is enormous scope                      | Keep existing "Navigate" button that opens native maps                |
| Driver chat/messaging               | "Drivers need to communicate"      | Phone call to admin is sufficient for small team; chat requires infrastructure (websockets, message storage) | Phone number on dashboard                                             |
| Multi-language driver interface     | "Burmese drivers need Burmese UI"  | Internationalization is a large cross-cutting concern; driver UI is small and action-oriented                | Keep English; add Burmese labels for key actions only if needed       |
| Automated route assignment          | "System should auto-assign routes" | Weekly delivery with 2-3 drivers doesn't need automation; admin manual assignment works                      | Keep admin manual assignment                                          |
| Driver payments/payroll integration | "Pay drivers through the app"      | Payroll is a regulated, complex domain; Morning Star pays drivers outside the app                            | Track earnings for visibility; actual payment stays external          |
| Push notifications                  | "Notify drivers of new routes"     | Requires service worker push subscription, backend push service, permission flow                             | Use email notifications for route assignments (Resend already set up) |

---

## Feature Dependencies

```
Role-Based Redirects
    requires -> Next.js middleware.ts (new file)
    requires -> Supabase session refresh in middleware
    enhances -> All role-specific landing pages (already built)

CSP Headers
    requires -> Next.js middleware.ts (same file as auth redirects)
    requires -> Nonce generation per request
    requires -> Audit all external scripts/styles/connections
    conflicts with -> Nothing (additive security)

RLS Audit
    requires -> Access to Supabase SQL editor or migration files
    independent of -> All other features
    blocks -> Nothing (but should complete before adding new tables)

Rate Limiting Upgrade
    requires -> Upstash Redis account + API keys
    requires -> @upstash/ratelimit package install
    replaces -> src/lib/utils/rate-limit.ts (in-memory Map)
    independent of -> Other features

Driver Earnings Dashboard
    requires -> Earnings computation logic (per-delivery rate from app_settings)
    requires -> Completed routes/deliveries data (already exists)
    enhances -> Driver dashboard home page
    independent of -> Availability scheduling

Driver Route History Enhancement
    requires -> Existing history page (already built)
    independent of -> Other features
    enhances -> Driver history page with filtering/pagination

Planned Route Visibility
    requires -> New API endpoint for upcoming routes
    requires -> Existing routes table and RLS policies
    enhances -> Driver home page
    independent of -> Availability scheduling (but complementary)

Driver Availability Scheduling
    requires -> New driver_availability table
    requires -> RLS policies for new table
    enhances -> Admin route assignment workflow
    complements -> Planned route visibility

Driver Profile Setup
    requires -> Supabase Storage bucket for photos
    requires -> New /driver/profile page
    enhances -> Driver onboarding flow
    independent of -> Other features

Guided First Delivery
    requires -> Driver profile setup (needs completed profile first)
    requires -> Test route data or mock system
    enhances -> Driver onboarding experience
    should follow -> Profile setup and planned routes
```

### Critical Path

```
Middleware.ts (shared foundation)
    ├── Role-based redirects (add auth redirect logic)
    └── CSP headers (add CSP nonce generation)

Security (can run in parallel)
    ├── RLS audit (SQL work, independent)
    └── Rate limiting upgrade (package install + refactor)

Driver Experience (sequential within, parallel to security)
    ├── Driver profile setup (foundation for others)
    ├── Earnings dashboard (independent of profile)
    ├── Planned route visibility (independent)
    ├── Availability scheduling (needs new table)
    ├── History enhancement (existing page polish)
    └── First delivery walkthrough (last -- needs other features working)
```

---

## Milestone Phase Recommendation

### Phase 1: Security Foundation

- Middleware.ts with role-based redirects + CSP headers
- RLS audit for all tables
- Rate limiting upgrade to Upstash

### Phase 2: Driver Profile & Earnings

- Driver profile edit page with photo upload
- Earnings dashboard (computed from app_settings rate)
- Driver home page enhancements

### Phase 3: Route Visibility & Scheduling

- Planned/upcoming route view
- Availability scheduling (new table + UI)
- History page enhancements (filtering, pagination)

### Phase 4: Onboarding & Polish

- Guided first delivery walkthrough
- Test delivery page
- Driver UI polish (layout, mobile usability, visual consistency)

**Phase ordering rationale:**

1. Security first because it's foundational and doesn't depend on feature work
2. Profile + earnings next because they're the most visible driver improvements
3. Routes + scheduling require new schema (driver_availability) -- keep schema changes together
4. Onboarding walkthrough last because it needs the other features working to walk through

---

## Feature Prioritization Matrix

| Feature                  | User Value | Implementation Cost | Priority | Phase |
| ------------------------ | ---------- | ------------------- | -------- | ----- |
| Role-based redirects     | HIGH       | MEDIUM              | P0       | 1     |
| CSP headers              | HIGH       | MEDIUM              | P0       | 1     |
| RLS audit                | HIGH       | MEDIUM              | P0       | 1     |
| Rate limiting upgrade    | MEDIUM     | MEDIUM              | P1       | 1     |
| Driver profile edit      | HIGH       | LOW                 | P1       | 2     |
| Earnings dashboard       | HIGH       | MEDIUM              | P1       | 2     |
| Planned route visibility | HIGH       | LOW                 | P1       | 3     |
| Availability scheduling  | MEDIUM     | MEDIUM              | P1       | 3     |
| History enhancements     | LOW        | LOW                 | P2       | 3     |
| Guided walkthrough       | MEDIUM     | MEDIUM              | P2       | 4     |
| Test delivery page       | MEDIUM     | HIGH                | P2       | 4     |
| Driver UI polish         | MEDIUM     | LOW                 | P2       | 4     |
| Earnings badges/streaks  | LOW        | LOW                 | P3       | 4     |

**Priority key:**

- P0: Security requirements -- must ship before other features
- P1: Core driver experience improvements
- P2: Polish and onboarding enhancements
- P3: Nice to have, wire up existing unused UI props

---

## Competitor Feature Analysis

| Feature            | DoorDash Dasher                                | Uber Eats Driver                        | Morning Star (v1.8)                        |
| ------------------ | ---------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Earnings dashboard | Real-time per-delivery + weekly summary + tips | Real-time with fare breakdown           | Weekly summary computed from delivery rate |
| Route assignment   | On-demand offers                               | On-demand offers                        | Admin-assigned weekly routes               |
| Availability       | Set hours per day/week                         | Toggle online/offline                   | Weekly availability toggle                 |
| Profile setup      | Photo, vehicle, documents, background check    | Photo, vehicle, documents               | Photo, vehicle, license plate              |
| Navigation         | Built-in turn-by-turn                          | Built-in with Uber nav                  | External maps deep link                    |
| Performance stats  | Acceptance rate, completion rate, on-time      | Rating, satisfaction, cancellation rate | Rating, on-time %, delivery count          |
| Onboarding         | Multi-day orientation + test deliveries        | Video tutorials + shadow delivery       | Guided walkthrough + test page             |

**Key insight:** Morning Star is NOT a gig platform. It's a small weekly delivery service with 2-3 regular drivers. Features like on-demand offers, real-time earnings, and built-in navigation are over-engineering. Focus on clarity, simplicity, and reliability over feature parity with DoorDash/Uber.

---

## Feature Complexity Estimates

| Feature                 | Frontend                 | Backend                   | Schema                  | Total             |
| ----------------------- | ------------------------ | ------------------------- | ----------------------- | ----------------- |
| Role-based redirects    | None                     | Middleware.ts             | None                    | MEDIUM (1 day)    |
| CSP headers             | None                     | Middleware.ts (same file) | None                    | MEDIUM (0.5 day)  |
| RLS audit               | None                     | SQL migration             | None                    | MEDIUM (1 day)    |
| Rate limiting upgrade   | None                     | Refactor rate-limit.ts    | None                    | MEDIUM (0.5 day)  |
| Driver profile edit     | New page + form          | PATCH endpoint            | None                    | LOW (1 day)       |
| Profile photo upload    | Upload component         | Storage bucket            | None                    | MEDIUM (0.5 day)  |
| Earnings dashboard      | Dashboard UI + chart     | Earnings API endpoint     | None (use app_settings) | MEDIUM (1-2 days) |
| Planned route view      | Route list component     | GET upcoming routes API   | None                    | LOW (0.5 day)     |
| Availability scheduling | Calendar UI              | CRUD API                  | New table               | MEDIUM (1-2 days) |
| History enhancements    | Date filter + pagination | Existing API tweaks       | None                    | LOW (0.5 day)     |
| Guided walkthrough      | Tooltip overlay system   | None                      | None                    | MEDIUM (1-2 days) |
| Test delivery page      | Mock route view          | Mock data endpoint        | None                    | MEDIUM (1 day)    |
| Driver UI polish        | Layout/style updates     | None                      | None                    | LOW (1 day)       |

**Total estimated effort:** 10-14 days across 4 phases

---

## Sources

### Role-Based Redirects

- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- HIGH confidence
- [Supabase: Use Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) -- HIGH confidence

### Content Security Policy

- [Next.js: Content Security Policy Guide](https://nextjs.org/docs/pages/guides/content-security-policy) -- HIGH confidence
- [Next.js: next.config.js headers](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers) -- HIGH confidence
- [Adding Security Headers to a Next.js Application](https://alvinwanjala.com/blog/adding-security-headers-nextjs/) -- MEDIUM confidence

### Supabase RLS

- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- HIGH confidence
- [Supabase: Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors) -- HIGH confidence
- [Supabase RLS Best Practices: Production Patterns](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- MEDIUM confidence
- [Supabase RLS Complete Guide 2026](https://vibeappscanner.com/supabase-row-level-security) -- MEDIUM confidence

### Rate Limiting

- [Vercel: Ratelimit with Upstash Redis Template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis) -- HIGH confidence
- [Upstash: Rate Limiting Next.js API Routes](https://upstash.com/blog/nextjs-ratelimiting) -- HIGH confidence
- [Upstash: Edge Rate Limiting](https://upstash.com/blog/edge-rate-limiting) -- HIGH confidence
- [@upstash/ratelimit-js GitHub](https://github.com/upstash/ratelimit-js) -- HIGH confidence

### Driver Experience / Delivery Apps

- [Delivery Driver Statistics 2026 (Upper)](https://www.upperinc.com/blog/delivery-driver-statistics/) -- MEDIUM confidence
- [10 Best Delivery Driver Apps (8ration)](https://www.8ration.com/blogs/apps-for-delivery-drivers/) -- MEDIUM confidence
- [Dashboard Design Principles 2026 (DesignRush)](https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-design-principles) -- MEDIUM confidence

### Onboarding UX

- [19 Onboarding UX Examples (UserPilot)](https://userpilot.com/blog/onboarding-ux-examples/) -- MEDIUM confidence
- [In-App Onboarding Guide (Userflow)](https://www.userflow.com/blog/the-ultimate-guide-to-in-app-onboarding-boost-user-retention-and-engagement) -- MEDIUM confidence
- [Product Tour UI/UX Patterns (Appcues)](https://www.appcues.com/blog/product-tours-ui-patterns) -- MEDIUM confidence

---

_Feature research for: v1.8 Post-Launch Hardening & Driver Experience_
_Researched: 2026-02-16_
