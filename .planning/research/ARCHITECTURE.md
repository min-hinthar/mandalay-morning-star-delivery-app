# Architecture Research: v1.8 Post-Launch Hardening & Driver Experience

**Domain:** Security hardening, driver feature expansion, role-based auth for existing Next.js 16 delivery app
**Researched:** 2026-02-16
**Confidence:** HIGH (verified against codebase + official Next.js 16/Supabase/Upstash docs)

---

## Current Architecture Inventory

### Relevant Existing Components

| Component               | Location                                                                 | Current State                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth guards**         | `src/app/(admin)/admin/layout.tsx`, `src/app/(driver)/driver/layout.tsx` | Server Component layouts do `supabase.auth.getUser()` + role check, redirect on failure                                                  |
| **Auth helpers**        | `src/lib/auth/{admin,driver}.ts`                                         | `requireAdmin()` / `requireDriver()` for API route protection                                                                            |
| **Login page**          | `src/app/(auth)/login/page.tsx`                                          | Server Component checks user, redirects to `/` if logged in. No role-based redirect.                                                     |
| **Auth callback**       | `src/app/auth/callback/route.ts`                                         | Exchanges code for session, handles driver invite flow, redirects to `?next=` param or `/`                                               |
| **Rate limiting**       | `src/lib/utils/rate-limit.ts`                                            | In-memory `Map<string, RateLimitEntry>` with cleanup interval. Used by `signInWithMagicLink`. Auth-only (signIn, signUp, resetPassword). |
| **Location rate limit** | `src/app/api/driver/location/route.ts`                                   | DB-query-based 1 req/min limit, queries `location_updates` table for last entry                                                          |
| **Proxy/Middleware**    | Does not exist                                                           | No `proxy.ts` or `middleware.ts` in project                                                                                              |
| **CSP headers**         | `next.config.ts` only                                                    | Image CSP for SVG (`contentSecurityPolicy` in images config). No global CSP headers.                                                     |
| **Security headers**    | `next.config.ts` `headers()`                                             | Only CORS on `/api/health` and cache headers on fonts/icons. No X-Frame-Options, no HSTS, no CSP.                                        |
| **Driver pages**        | `src/app/(driver)/driver/`                                               | Home (dashboard), Route (active + stop detail), History. 3 nav tabs.                                                                     |
| **Driver components**   | `src/components/ui/driver/`                                              | 19 files: Dashboard, Nav, Shell, StopCard, StopDetail, LocationTracker, PhotoCapture, OnboardingForm, etc.                               |
| **Driver API routes**   | `src/app/api/driver/`                                                    | `/me`, `/onboard`, `/location`, `/routes/{routeId}/*` (complete, start, stops)                                                           |
| **Driver types**        | `src/types/driver.ts`                                                    | DriversRow, RoutesRow, RouteStopsRow, LocationUpdatesRow, DeliveryExceptionsRow                                                          |
| **Supabase clients**    | `src/lib/supabase/server.ts`                                             | `createClient()` (cookie-based), `createPublicClient()`, `createServiceClient()` (service role)                                          |
| **Database roles**      | `src/types/database.ts`                                                  | `ProfileRole = "customer" \| "admin" \| "driver"` in profiles table                                                                      |
| **RLS test script**     | `scripts/rls-isolation-test.mjs`                                         | Tests address isolation between two users. Basic cross-user visibility test only.                                                        |

### Key Architecture Fact: Next.js 16 Uses proxy.ts, Not middleware.ts

Next.js 16 **deprecated `middleware.ts`** and renamed it to `proxy.ts`. The exported function is `proxy()` not `middleware()`. A codemod exists (`npx @next/codemod@canary middleware-to-proxy .`). Since this project has no existing middleware, we create `proxy.ts` directly.

**Source:** [Next.js 16 proxy.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- "The `middleware` file convention is deprecated and has been renamed to `proxy`."

---

## System Overview: v1.8 Integration Points

```
                        Request Flow (v1.8 additions in [brackets])

Browser Request
    |
    v
+--[proxy.ts]--+  <-- NEW: CSP headers + auth token refresh + role redirect
|              |
| 1. Generate CSP nonce
| 2. Refresh Supabase auth tokens (cookie)
| 3. Role-based redirect on /login success
| 4. Pass response with security headers
+------+-------+
       |
       v
+------+-------+           +---[Vercel KV]---+
| Next.js App  |           |                  |
| Router       |           | Rate limit store |  <-- NEW: replaces in-memory Map
|              |           | (Upstash Redis)  |
| Route Groups:|           +--------+---------+
|  (public)    |                    |
|  (customer)  |                    |
|  (admin)     |            API routes check
|  (driver) ---+--- NEW pages:     rate limit
|  (auth)      |    /driver/earnings         before processing
+--------------+    /driver/routes-history
                    /driver/availability
                    /driver/profile-setup
                    /driver/test-delivery

                    +---[Supabase]---+
                    |                |
                    | RLS policies   |  <-- AUDITED: all tables verified
                    | profiles.role  |
                    | drivers.*      |
                    +----------------+
```

---

## Integration 1: Content Security Policy Headers

### Approach: CSP Without Nonces (via next.config.ts headers)

**Decision: Use `next.config.ts` headers, NOT `proxy.ts` nonces.**

**Rationale:**

1. Nonce-based CSP forces ALL pages to dynamic rendering. This project has static public pages (menu, homepage) that benefit from CDN caching.
2. The project uses `dangerouslySetInnerHTML` in header styles (documented in key decisions). Nonces would require refactoring that pattern.
3. Framer Motion, GSAP, and React all inject inline styles/scripts. Full nonce-based CSP requires `'unsafe-inline'` for styles anyway.
4. PPR (Partial Prerendering) -- noted as experimental in `next.config.ts` -- is incompatible with nonce CSP.
5. The SRI experimental feature (hash-based CSP) is webpack-only, not available with Turbopack.

**Confidence:** HIGH -- verified from [Next.js 16 CSP guide](https://nextjs.org/docs/app/guides/content-security-policy), which states "PPR is incompatible with nonce-based CSP" and "SRI is webpack only."

### Implementation Pattern

Add CSP and security headers in `next.config.ts` `headers()`:

```typescript
// In next.config.ts headers()
{
  source: '/(.*)',
  headers: [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval for dev only
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com https://drive.google.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.google-analytics.com https://maps.googleapis.com wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join('; '),
    },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  ],
},
```

### CSP Allowlist Requirements (Domain-Specific)

| Directive         | Domains                                                    | Why                                                                           |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `script-src`      | `'self' 'unsafe-inline'`                                   | Framer Motion + GSAP inject inline scripts, React hydration, Sentry tunnel    |
| `style-src`       | `'self' 'unsafe-inline' fonts.googleapis.com`              | Tailwind inline styles, `dangerouslySetInnerHTML` header styles, Google Fonts |
| `img-src`         | `*.supabase.co lh3.googleusercontent.com drive.google.com` | Supabase Storage menu photos, Google OAuth avatars, Drive images              |
| `connect-src`     | `*.supabase.co *.sentry.io maps.googleapis.com`            | Supabase API/realtime, Sentry ingest (backup to tunnel), Google Maps tiles    |
| `font-src`        | `fonts.gstatic.com`                                        | Inter + Playfair Display from Google Fonts                                    |
| `frame-ancestors` | `'none'`                                                   | Prevent clickjacking                                                          |

### Modified Files

| File             | Change                                             |
| ---------------- | -------------------------------------------------- |
| `next.config.ts` | Add CSP + security headers to `headers()` function |

### New Files

None. CSP is configuration-only.

### Gotcha: Dev vs Production CSP

`'unsafe-eval'` is required in development (React uses `eval` for error stack reconstruction). Use environment check:

```typescript
const isDev = process.env.NODE_ENV === "development";
// script-src includes 'unsafe-eval' only in dev
```

**Confidence:** HIGH -- Next.js docs explicitly state this requirement.

---

## Integration 2: Supabase RLS Audit

### Current RLS State

The `scripts/rls-isolation-test.mjs` only tests address cross-user isolation. No systematic audit of all tables.

### Tables Requiring RLS Policies

Based on codebase analysis of all Supabase queries:

| Table                 | Current Access Pattern                               | Required RLS                                               | Risk Level            |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------- | --------------------- |
| `profiles`            | Queried by `id = user.id` in layouts, API routes     | Users read own profile; admins read all                    | HIGH -- personal data |
| `drivers`             | Queried by `user_id = user.id` in driver layout/APIs | Drivers read own; admins read all                          | HIGH -- PII           |
| `driver_invites`      | Queried by `id` in callback; admin creates           | Admins CRUD; invited user reads own                        | MEDIUM                |
| `orders`              | Customer queries own; admin queries all              | Customer reads own; admin reads all; driver reads assigned | HIGH -- financial     |
| `addresses`           | Customer queries own                                 | Users CRUD own addresses only                              | HIGH -- location data |
| `routes`              | Driver queries own; admin queries all                | Driver reads assigned; admin CRUD all                      | MEDIUM                |
| `route_stops`         | Driver updates own route's stops; admin manages      | Inherit route access                                       | MEDIUM                |
| `location_updates`    | Driver inserts own; tracking reads latest for order  | Driver inserts own; customer reads for their order         | LOW                   |
| `delivery_exceptions` | Driver creates; admin resolves                       | Driver creates on own stops; admin manages all             | LOW                   |
| `menu_items`          | Public read; admin write                             | Anon/authenticated read; admin write                       | LOW                   |
| `categories`          | Public read; admin write                             | Anon/authenticated read; admin write                       | LOW                   |
| `sections`            | Public read; admin write                             | Anon/authenticated read; admin write                       | LOW                   |
| `settings`            | Admin read/write                                     | Admin only                                                 | MEDIUM                |

### RLS Policy Pattern

All policies should follow this pattern for role-based access:

```sql
-- Example: profiles table
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Performance note:** Index `profiles.role` column. RLS policies execute on every query; missing indexes cause full table scans.

### Audit Approach: Expand Existing Test Script

Extend `scripts/rls-isolation-test.mjs` to cover all tables:

| Test                                           | What It Verifies    |
| ---------------------------------------------- | ------------------- |
| Customer A cannot read Customer B's orders     | Order isolation     |
| Customer cannot read driver data               | Role boundary       |
| Driver cannot read other driver's routes       | Driver isolation    |
| Driver cannot read customer addresses directly | Cross-role boundary |
| Anon can read menu items                       | Public access       |
| Anon cannot read orders/profiles               | Auth boundary       |
| Admin can read all profiles                    | Admin access        |

### Modified Files

| File                             | Change                             |
| -------------------------------- | ---------------------------------- |
| `scripts/rls-isolation-test.mjs` | Expand test coverage to all tables |

### New Files

| File                      | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| Supabase migrations (SQL) | RLS policies for any tables missing them |

**Note:** RLS policies are Supabase-side (SQL migrations or dashboard). No TypeScript code changes needed for RLS itself -- the existing `createClient()` (anon key) automatically respects RLS.

**Confidence:** MEDIUM -- cannot verify current RLS state without Supabase dashboard access. The audit script + migration approach handles this.

---

## Integration 3: Rate Limiting Upgrade (In-Memory to Vercel KV)

### Problem

Current `src/lib/utils/rate-limit.ts` uses `new Map<string, RateLimitEntry>()`. On Vercel Serverless Functions, each invocation may run in a different container. The in-memory Map is not shared across invocations, making rate limiting per-container rather than global. A user could exceed limits simply by hitting different containers.

### Solution: @upstash/ratelimit with Vercel KV

Vercel KV is a managed Upstash Redis instance. The `@upstash/ratelimit` SDK provides battle-tested rate limiting algorithms.

**Source:** [Upstash Rate Limiting with Vercel KV](https://upstash.com/blog/nextjs-ratelimiting), [Vercel KV template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis)

### New Dependencies

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

### Environment Variables

| Variable            | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| `KV_REST_API_URL`   | Vercel KV (Upstash) REST URL -- auto-set by Vercel KV integration   |
| `KV_REST_API_TOKEN` | Vercel KV (Upstash) REST token -- auto-set by Vercel KV integration |

### Implementation Pattern

Replace `src/lib/utils/rate-limit.ts` entirely:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client from Vercel KV env vars
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Auth rate limits
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 per minute
  prefix: "ratelimit:auth",
});

// API rate limits (general)
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 per minute
  prefix: "ratelimit:api",
});

// Driver location updates
export const locationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, "60 s"), // 1 per minute
  prefix: "ratelimit:location",
});
```

### Rate Limit Tiers

| Endpoint Category              | Limit    | Algorithm      | Identifier         |
| ------------------------------ | -------- | -------------- | ------------------ |
| Auth (magic link, OAuth)       | 5/min    | Sliding window | Email address      |
| Public API (menu, sections)    | 60/min   | Sliding window | IP address         |
| Customer API (orders, account) | 30/min   | Sliding window | User ID            |
| Admin API                      | 120/min  | Sliding window | User ID            |
| Driver location                | 1/min    | Fixed window   | Driver ID          |
| Webhook endpoints              | No limit | N/A            | Verified by secret |

### Modified Files

| File                                   | Change                                                               |
| -------------------------------------- | -------------------------------------------------------------------- |
| `src/lib/utils/rate-limit.ts`          | Complete rewrite: Map-based to Upstash-based                         |
| `src/lib/supabase/actions.ts`          | Update `checkRateLimit` call to use new async API                    |
| `src/app/api/driver/location/route.ts` | Replace DB-query rate limit with `locationRateLimit.limit(driverId)` |

### Data Flow Change

```
BEFORE:
  Request -> API Route -> In-memory Map check -> Process
  (Map resets on cold start, not shared across containers)

AFTER:
  Request -> API Route -> Upstash Redis check (1 HTTP call) -> Process
  (Shared state, survives cold starts, globally consistent)
```

### Fallback Strategy

If Vercel KV is unavailable (cold start, network issue), fail open:

```typescript
try {
  const { success } = await authRateLimit.limit(identifier);
  if (!success) return rateLimitResponse();
} catch {
  // Fail open -- allow request if rate limit check fails
  // Log to Sentry for visibility
}
```

**Confidence:** HIGH -- Upstash/Vercel KV is a well-documented first-party integration.

---

## Integration 4: Driver Feature Pages (New Routes)

### Current Driver Route Structure

```
src/app/(driver)/driver/
  layout.tsx          -- Auth + driver check, DriverShell + DriverNav
  page.tsx            -- Dashboard (today's route, stats)
  loading.tsx         -- Skeleton
  error.tsx           -- Error boundary
  not-found.tsx       -- 404
  route/
    page.tsx          -- Active route view
    loading.tsx
    error.tsx
    [stopId]/
      page.tsx        -- Stop detail
  history/
    page.tsx          -- Delivery history list
    DriverHistoryContent.tsx
    loading.tsx
```

### New Pages to Add

```
src/app/(driver)/driver/
  earnings/
    page.tsx            -- Earnings dashboard (weekly/monthly/yearly)
    EarningsContent.tsx -- Client component with charts
    loading.tsx         -- Skeleton
  routes-history/
    page.tsx            -- Route history with stats (distinct from delivery history)
    RoutesHistoryContent.tsx
    loading.tsx
  availability/
    page.tsx            -- Weekly availability scheduling
    AvailabilityContent.tsx
    loading.tsx
  profile/
    page.tsx            -- Profile setup (vehicle, photo, preferences)
    DriverProfileContent.tsx
    loading.tsx
  test-delivery/
    page.tsx            -- Guided test delivery walkthrough
    TestDeliveryContent.tsx
    loading.tsx
```

### Navigation Impact

Current `DriverNav` has 3 tabs: Home, Route, History. Adding 5 new pages means the nav needs restructuring.

**Recommended approach:** Keep 3-4 bottom nav tabs + overflow via profile/settings icon.

| Tab      | Page               | Rationale                                        |
| -------- | ------------------ | ------------------------------------------------ |
| Home     | `/driver`          | Dashboard with today's route + quick stats       |
| Route    | `/driver/route`    | Active delivery route                            |
| Earnings | `/driver/earnings` | Key motivational page for drivers                |
| Profile  | `/driver/profile`  | Links to: availability, routes-history, settings |

Test delivery and first-delivery walkthrough are NOT nav items -- they are entry-point flows accessed from onboarding or admin action.

### Modified Files

| File                                                | Change                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/components/ui/driver/DriverNav.tsx`            | Add Earnings tab, replace History with Profile tab                            |
| `src/components/ui/driver/DriverDashboard/types.ts` | Add `weeklyEarningsCents`, `streakDays` to props (already stubbed but unused) |

### New API Routes

| Route                          | Method | Purpose                                          | Auth              |
| ------------------------------ | ------ | ------------------------------------------------ | ----------------- |
| `GET /api/driver/earnings`     | GET    | Weekly/monthly earnings data                     | `requireDriver()` |
| `GET /api/driver/availability` | GET    | Current availability schedule                    | `requireDriver()` |
| `PUT /api/driver/availability` | PUT    | Update availability                              | `requireDriver()` |
| `GET /api/driver/profile`      | GET    | Full driver profile + preferences                | `requireDriver()` |
| `PUT /api/driver/profile`      | PUT    | Update profile (vehicle, photo, preferences)     | `requireDriver()` |
| `GET /api/driver/routes/stats` | GET    | Aggregated route stats (on-time %, avg duration) | `requireDriver()` |

### Component Architecture per Page

Each new driver page follows the existing pattern:

```
page.tsx (Server Component)
  |-- Auth check via layout (inherited from driver/layout.tsx)
  |-- Fetch data server-side
  |-- Suspense boundary
  |-- Client component for interactivity
```

```typescript
// Example: src/app/(driver)/driver/earnings/page.tsx
export default async function EarningsPage() {
  return (
    <Suspense fallback={<EarningsSkeleton />}>
      <EarningsContent />
    </Suspense>
  );
}

async function EarningsContent() {
  // Server-side data fetch, pass to client component
  const data = await getEarningsData();
  return <EarningsDashboard {...data} />;
}
```

### Data Dependencies

```
Earnings page:
  routes table (completed, driver_id=me) -> aggregate by week/month
  route_stops table -> delivery count

Route history/stats:
  routes table (completed, driver_id=me) -> list with stats_json
  delivery_exceptions table -> exception count per route

Availability:
  NEW: driver_availability table OR JSON column on drivers table
  Decision: JSON column on drivers table (simpler, no new table needed)

Profile setup:
  drivers table -> vehicle_type, license_plate, phone, profile_image_url
  profiles table -> full_name, email
  Supabase Storage -> profile photo upload (existing menu-photos bucket pattern)

Test delivery:
  Reads from existing route/stop structure
  Creates a test route with synthetic stops
  Uses existing stop update APIs
```

### Earnings Data: No New Tables Needed

Earnings can be computed from existing data:

```sql
-- Weekly earnings = sum of order totals for completed deliveries
SELECT
  date_trunc('week', r.delivery_date::date) as week,
  SUM(rs.order_total_cents) as total_cents,
  COUNT(DISTINCT r.id) as routes_completed,
  COUNT(rs.id) as deliveries_made
FROM routes r
JOIN route_stops rs ON rs.route_id = r.id
WHERE r.driver_id = $driverId
  AND r.status = 'completed'
  AND rs.status = 'delivered'
GROUP BY week
ORDER BY week DESC;
```

**Note:** `route_stops` does not currently have `order_total_cents`. This would need to be joined through `orders.total_cents`. The existing `OrderWithAddress` type already includes `total_cents`.

### Availability: Extend Drivers Table

Add a JSONB column rather than a new table:

```sql
ALTER TABLE drivers ADD COLUMN availability_json JSONB DEFAULT '{}';
-- Structure: { "monday": true, "tuesday": false, ... "saturday": true }
```

This is simpler than a separate table and matches the app's once-weekly delivery model.

**Confidence:** HIGH for page structure (follows existing patterns), MEDIUM for earnings computation (depends on order data relationships not fully verified).

---

## Integration 5: Driver Profile Setup

### Current Onboarding vs Profile Setup

The existing `/api/driver/onboard` route handles initial registration (invite-based). Profile setup is distinct: it allows drivers to update their info after onboarding.

### Data Model

Existing `DriversRow` already has all needed fields:

```typescript
interface DriversRow {
  id: string;
  user_id: string;
  vehicle_type: VehicleType | null; // editable
  license_plate: string | null; // editable
  phone: string | null; // editable
  profile_image_url: string | null; // editable (photo upload)
  is_active: boolean;
  onboarding_completed_at: string | null;
  rating_avg: number; // read-only
  deliveries_count: number; // read-only
}
```

### Photo Upload Pattern

Reuse the existing Supabase Storage pattern from admin photo uploads:

| Component        | Existing                                     | New                                               |
| ---------------- | -------------------------------------------- | ------------------------------------------------- |
| Storage bucket   | `menu-photos`                                | `driver-photos` (new bucket)                      |
| Upload API       | `src/app/api/admin/menu/[id]/photo/route.ts` | `src/app/api/driver/profile/photo/route.ts` (new) |
| Client component | Admin photo upload UI                        | Driver profile photo upload UI (new)              |

### Modified Files

| File                  | Change                                              |
| --------------------- | --------------------------------------------------- |
| `src/types/driver.ts` | Add `availability_json` to DriversRow/Insert/Update |

### New Files

| File                                                       | Purpose                |
| ---------------------------------------------------------- | ---------------------- |
| `src/app/(driver)/driver/profile/page.tsx`                 | Profile setup page     |
| `src/app/(driver)/driver/profile/DriverProfileContent.tsx` | Client component       |
| `src/app/(driver)/driver/profile/loading.tsx`              | Skeleton               |
| `src/app/api/driver/profile/route.ts`                      | GET/PUT driver profile |
| `src/app/api/driver/profile/photo/route.ts`                | POST photo upload      |
| `src/components/ui/driver/DriverProfileForm.tsx`           | Form component         |

---

## Integration 6: Guided First Delivery & Test Flow

### Concept

A walkthrough that guides new drivers through the delivery flow using a synthetic (test) route.

### Architecture Decision: Client-Side Guide, Real API

The test delivery uses the same APIs as real deliveries but with a test route flagged in the database.

```
Test Delivery Flow:
  1. Admin or system creates test route (is_test = true)
  2. Driver opens /driver/test-delivery
  3. UI shows step-by-step instructions overlay
  4. Driver performs real actions (start route, navigate, mark delivered)
  5. Actions hit real APIs but route is flagged as test
  6. Completion triggers onboarding_completed flag
```

### Database Change

```sql
ALTER TABLE routes ADD COLUMN is_test BOOLEAN DEFAULT false;
```

This flag ensures test routes are excluded from earnings calculations and history stats.

### Implementation Pattern

Use a client-side "coach marks" overlay pattern:

```typescript
// Step definitions
const WALKTHROUGH_STEPS = [
  { target: '[data-step="start-route"]', content: "Tap here to start your route" },
  { target: '[data-step="navigate"]', content: "Follow directions to the first stop" },
  { target: '[data-step="mark-arrived"]', content: "Tap when you arrive" },
  { target: '[data-step="take-photo"]', content: "Take a delivery photo" },
  { target: '[data-step="mark-delivered"]', content: "Confirm delivery" },
];
```

### New Files

| File                                                            | Purpose                            |
| --------------------------------------------------------------- | ---------------------------------- |
| `src/app/(driver)/driver/test-delivery/page.tsx`                | Test delivery entry page           |
| `src/app/(driver)/driver/test-delivery/TestDeliveryContent.tsx` | Client component with walkthrough  |
| `src/components/ui/driver/WalkthroughOverlay.tsx`               | Reusable coach marks overlay       |
| `src/app/api/driver/routes/test/route.ts`                       | POST: create test route for driver |

---

## Integration 7: Role-Based Login Redirects

### Current Login Flow

```
User visits /login
  -> If already logged in: redirect to / (homepage)
  -> After successful auth: redirect to /auth/callback?next=/login
    -> Auth callback: redirect to `next` param (defaults to /)
```

**Problem:** All users land on `/` regardless of role. Admins must manually navigate to `/admin`, drivers to `/driver`.

### Solution: Post-Auth Redirect in Auth Callback

The redirect logic belongs in `src/app/auth/callback/route.ts`, NOT in proxy.ts.

**Rationale:**

1. The auth callback already has the session (just exchanged code for token).
2. Proxy (edge) cannot call `supabase.auth.getUser()` reliably -- it can only read cookies, which may be spoofed.
3. The callback already does role-based logic for driver invites.
4. The profiles table role is the authoritative source. Auth callback already queries Supabase.

### Implementation in Auth Callback

```typescript
// In src/app/auth/callback/route.ts, after successful code exchange:

// If no explicit next param (or next is /login), redirect by role
if (!next || next === "/" || next === "/login") {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sessionData.session.user.id)
    .single();

  const roleRedirects: Record<string, string> = {
    admin: "/admin",
    driver: "/driver",
    customer: "/menu",
  };

  const redirectPath = roleRedirects[profile?.role ?? ""] ?? "/menu";
  return NextResponse.redirect(`${origin}${redirectPath}`, { status: 302 });
}
```

### Also Update Login Page

The login page currently redirects logged-in users to `/`. Update to redirect by role:

```typescript
// In src/app/(auth)/login/page.tsx
if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const roleRedirects = { admin: "/admin", driver: "/driver", customer: "/menu" };
  redirect(roleRedirects[profile?.role ?? ""] ?? "/menu");
}
```

### Modified Files

| File                             | Change                                               |
| -------------------------------- | ---------------------------------------------------- |
| `src/app/auth/callback/route.ts` | Add role-based redirect when `next` param is generic |
| `src/app/(auth)/login/page.tsx`  | Redirect logged-in users to role-appropriate page    |

### New Files

None. This is modification of existing auth flow only.

### Edge Case: New Users Without Profile

New users (first magic link) may not have a profiles row yet. Default to `/menu` (customer). The profile row is created on first Supabase auth (via trigger or on first API call).

**Confidence:** HIGH -- straightforward modification of existing callback flow.

---

## Integration 8: proxy.ts (Combining CSP + Auth Refresh)

### Decision: Use proxy.ts for Auth Token Refresh Only

Although CSP headers are handled in `next.config.ts`, the project needs `proxy.ts` for **Supabase auth token refresh** -- a critical requirement documented in [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs):

> "Server Components can't write cookies, so you need middleware to refresh expired Auth tokens and store them."

### proxy.ts Responsibilities

| Responsibility     | How                                                                 |
| ------------------ | ------------------------------------------------------------------- |
| Auth token refresh | Call `supabase.auth.getUser()` to refresh expired tokens via cookie |
| Cookie passthrough | Set refreshed cookies on response                                   |

### What proxy.ts Does NOT Do

| Excluded             | Why                                                |
| -------------------- | -------------------------------------------------- |
| CSP headers          | Handled in `next.config.ts` (no nonces needed)     |
| Role-based redirects | Handled in auth callback (has session context)     |
| Rate limiting        | Handled in API route handlers (need user identity) |
| Auth guard redirects | Handled in route group layouts (server components) |

### Implementation Pattern

```typescript
// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token (this writes cookies if token was expired)
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|fonts|sw.js|manifest.json|monitoring|api/health|api/webhooks).*)",
  ],
};
```

### New Files

| File           | Purpose                     |
| -------------- | --------------------------- |
| `src/proxy.ts` | Supabase auth token refresh |

### Matcher Exclusions

| Excluded Path                   | Why                                           |
| ------------------------------- | --------------------------------------------- |
| `_next/static`, `_next/image`   | Static assets, no auth needed                 |
| `favicon.ico`, `icons`, `fonts` | Static files                                  |
| `sw.js`, `manifest.json`        | Service worker files                          |
| `monitoring`                    | Sentry tunnel route (must not be intercepted) |
| `api/health`                    | Health check (public, no auth)                |
| `api/webhooks`                  | Stripe/Resend webhooks (use their own auth)   |

---

## Complete New/Modified File Inventory

### New Files (14)

| File                                                            | Category | Purpose                       |
| --------------------------------------------------------------- | -------- | ----------------------------- |
| `src/proxy.ts`                                                  | Security | Auth token refresh            |
| `src/app/(driver)/driver/earnings/page.tsx`                     | Driver   | Earnings dashboard            |
| `src/app/(driver)/driver/earnings/EarningsContent.tsx`          | Driver   | Earnings client component     |
| `src/app/(driver)/driver/earnings/loading.tsx`                  | Driver   | Skeleton                      |
| `src/app/(driver)/driver/availability/page.tsx`                 | Driver   | Availability scheduling       |
| `src/app/(driver)/driver/availability/AvailabilityContent.tsx`  | Driver   | Availability client component |
| `src/app/(driver)/driver/availability/loading.tsx`              | Driver   | Skeleton                      |
| `src/app/(driver)/driver/profile/page.tsx`                      | Driver   | Profile setup                 |
| `src/app/(driver)/driver/profile/DriverProfileContent.tsx`      | Driver   | Profile client component      |
| `src/app/(driver)/driver/profile/loading.tsx`                   | Driver   | Skeleton                      |
| `src/app/(driver)/driver/test-delivery/page.tsx`                | Driver   | Test delivery walkthrough     |
| `src/app/(driver)/driver/test-delivery/TestDeliveryContent.tsx` | Driver   | Test flow client component    |
| `src/app/api/driver/earnings/route.ts`                          | API      | Earnings data endpoint        |
| `src/app/api/driver/profile/route.ts`                           | API      | Profile CRUD                  |

### Modified Files (9)

| File                                     | Change                                   | Category |
| ---------------------------------------- | ---------------------------------------- | -------- |
| `next.config.ts`                         | Add CSP + security headers               | Security |
| `src/lib/utils/rate-limit.ts`            | Rewrite: Map to Upstash                  | Security |
| `src/lib/supabase/actions.ts`            | Update rate limit call (async)           | Security |
| `src/app/api/driver/location/route.ts`   | Use Upstash rate limit                   | Security |
| `src/app/auth/callback/route.ts`         | Add role-based redirect                  | Auth     |
| `src/app/(auth)/login/page.tsx`          | Role-based redirect for logged-in users  | Auth     |
| `src/components/ui/driver/DriverNav.tsx` | Restructure tabs (add Earnings, Profile) | Driver   |
| `src/types/driver.ts`                    | Add availability_json, is_test fields    | Types    |
| `scripts/rls-isolation-test.mjs`         | Expand to all tables                     | Security |

---

## Data Flow Changes

### New: Rate Limiting Flow

```
API Request
    |
    v
API Route Handler
    |
    v
@upstash/ratelimit.limit(identifier)
    |
    +-- HTTP call to Vercel KV (Upstash Redis)
    |   ~5ms latency
    |
    +-- { success: true, remaining: N } -> continue
    +-- { success: false, reset: T } -> 429 response with Retry-After header
```

### New: Role-Based Auth Flow

```
User completes login (magic link or OAuth)
    |
    v
/auth/callback (exchanges code for session)
    |
    v
Check: explicit `next` param?
    |
    +-- YES: redirect to `next` (existing behavior)
    |
    +-- NO: query profiles.role
        |
        +-- admin  -> /admin
        +-- driver -> /driver
        +-- customer (or null) -> /menu
```

### New: Driver Page Data Flow

```
Driver visits /driver/earnings
    |
    v
driver/layout.tsx (inherited auth check)
    |
    v
earnings/page.tsx (Server Component)
    |
    v
Supabase query: routes + stops for driver, grouped by week
    |
    v
<EarningsContent data={earnings} />  (Client Component)
    |
    v
Recharts line/bar chart (existing Recharts dependency)
```

---

## Build Order (Dependency-Driven)

### Phase 1: Security Foundation (CSP + proxy.ts)

**Files:** `next.config.ts` (CSP headers), `src/proxy.ts` (auth refresh)
**Rationale:** CSP and proxy are foundational -- all subsequent features run through them.
**Dependency:** None
**Risk:** LOW -- CSP is additive headers; proxy is standard Supabase pattern
**Validation:** Check security headers in browser DevTools, verify auth still works

### Phase 2: Rate Limiting Upgrade

**Files:** `src/lib/utils/rate-limit.ts` (rewrite), `src/lib/supabase/actions.ts`, `src/app/api/driver/location/route.ts`
**Rationale:** Depends on Vercel KV being provisioned (environment setup)
**Dependency:** Vercel KV provisioned
**Risk:** LOW -- drop-in replacement with same interface
**Validation:** Rate limit test: send 6 requests in 60s, verify 6th is rejected

### Phase 3: RLS Audit

**Files:** SQL migrations, `scripts/rls-isolation-test.mjs`
**Rationale:** Security audit before adding new driver features that query more data
**Dependency:** None (can parallelize with Phase 2)
**Risk:** MEDIUM -- incorrect RLS can lock out users or expose data
**Validation:** Run expanded `pnpm rls:test`

### Phase 4: Role-Based Redirects

**Files:** `src/app/auth/callback/route.ts`, `src/app/(auth)/login/page.tsx`
**Rationale:** Small change, high user impact. Do before driver pages so drivers land correctly.
**Dependency:** Phase 1 (proxy must be working for auth refresh)
**Risk:** LOW -- 2 file modifications
**Validation:** Login as each role, verify redirect destination

### Phase 5: Driver Profile Setup

**Files:** Profile page, API route, photo upload
**Rationale:** Foundation for other driver features (availability, earnings display profile info)
**Dependency:** Phase 3 (RLS must cover drivers/profiles tables)
**Risk:** LOW -- follows existing patterns
**Validation:** Update driver profile, verify persistence

### Phase 6: Driver Earnings Dashboard

**Files:** Earnings page, API route, nav update
**Rationale:** Key motivational feature for drivers
**Dependency:** Phase 5 (nav restructure)
**Risk:** LOW -- read-only aggregation of existing data
**Validation:** View earnings, verify totals match admin dashboard

### Phase 7: Driver Availability & Route History

**Files:** Availability page, route stats API
**Rationale:** Operational features, lower priority than earnings
**Dependency:** Phase 5 (drivers table schema change for availability_json)
**Risk:** LOW
**Validation:** Set availability, verify persisted; view route stats

### Phase 8: Test Delivery Walkthrough

**Files:** Test delivery page, walkthrough overlay, test route API
**Rationale:** Depends on all driver flows working correctly (it exercises them)
**Dependency:** Phases 5-7 (all driver features must work)
**Risk:** MEDIUM -- walkthrough UI is new pattern, needs design
**Validation:** Complete full test delivery flow as new driver

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Role Checks in proxy.ts

**What people do:** Query the database for user role in proxy/middleware and redirect based on role.

**Why wrong:** Proxy runs on EVERY request (including static assets). Database queries in proxy add latency to every page load. Also, proxy runs in edge runtime by default -- Supabase client initialization may behave differently.

**Do this instead:** Role checks in route group layouts (server components) for page protection. Role-based redirects in auth callback (runs once, after login).

### Anti-Pattern 2: Nonce-Based CSP with Static Pages

**What people do:** Implement full nonce-based CSP, forcing all pages to dynamic rendering.

**Why wrong:** This project has static public pages (menu, homepage) that benefit from CDN caching. Nonce CSP kills static optimization. PPR is also incompatible.

**Do this instead:** Use `'unsafe-inline'` CSP via `next.config.ts` headers. Less strict but preserves performance. Add SRI when Turbopack support lands.

### Anti-Pattern 3: Rate Limiting in proxy.ts

**What people do:** Put rate limiting logic in proxy/middleware for all routes.

**Why wrong:** Rate limiting should be contextual -- different limits for auth vs API vs public. Proxy doesn't have user identity (only cookies). Rate limiting in proxy adds latency to every request including static assets.

**Do this instead:** Rate limit in API route handlers where user identity and endpoint context are available.

### Anti-Pattern 4: Separate Availability Table for Weekly Delivery

**What people do:** Create a `driver_availability` table with day-of-week columns.

**Why wrong:** Morning Star delivers once per week (Saturday only). A full availability table is over-engineering. Adding a table means new RLS policies, new types, new API surface area.

**Do this instead:** JSONB column on drivers table. Simple, no new table, no new RLS. Can always migrate to a table later if scheduling becomes complex.

### Anti-Pattern 5: Test Delivery with Mock APIs

**What people do:** Create separate mock API endpoints for test deliveries.

**Why wrong:** Mock APIs diverge from real behavior. If the real API changes, the test flow breaks silently. Drivers learn a flow that doesn't match reality.

**Do this instead:** Use real APIs with a `is_test` flag on the route. Same code path, flagged data. Exclude test routes from earnings/stats calculations.

---

## Sources

**Next.js 16 (HIGH confidence):**

- [proxy.ts API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- middleware renamed to proxy in v16
- [CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- nonce vs non-nonce approaches, PPR incompatibility
- [Content Security Policy (v16.1.6)](https://nextjs.org/docs/app/guides/content-security-policy) -- verified 2026-02-11

**Supabase (HIGH confidence):**

- [Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- updateSession utility, getClaims()
- [RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy patterns
- [RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- index columns in policies

**Upstash / Vercel KV (HIGH confidence):**

- [Rate Limiting Next.js with Upstash](https://upstash.com/blog/nextjs-ratelimiting) -- @upstash/ratelimit setup
- [Vercel KV Template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis) -- first-party integration
- [Ratelimit with Vercel KV](https://upstash.com/examples/ratelimitingwithvercelkv) -- algorithm options

**Existing Codebase (HIGH confidence -- directly examined):**

- `next.config.ts` -- current headers, image CSP, Sentry wrapper
- `src/app/(driver)/driver/layout.tsx` -- driver auth guard pattern
- `src/app/(admin)/admin/layout.tsx` -- admin auth guard pattern
- `src/app/auth/callback/route.ts` -- auth callback with driver invite handling
- `src/app/(auth)/login/page.tsx` -- login page redirect logic
- `src/lib/utils/rate-limit.ts` -- current in-memory rate limiter
- `src/lib/auth/{admin,driver}.ts` -- API route auth helpers
- `src/lib/supabase/server.ts` -- Supabase client creation
- `src/types/driver.ts` -- driver data model
- `src/components/ui/driver/DriverNav.tsx` -- current 3-tab nav
- `src/app/api/driver/routes/history/route.ts` -- route history API
- `scripts/rls-isolation-test.mjs` -- existing RLS test

---

_Architecture research for: v1.8 Post-Launch Hardening & Driver Experience_
_Researched: 2026-02-16_
