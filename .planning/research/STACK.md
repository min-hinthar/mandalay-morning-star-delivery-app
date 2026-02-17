# Stack Research: v1.8 Post-Launch Hardening & Driver Experience

**Domain:** Security hardening (CSP, RLS, rate limiting) + driver dashboard features
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

v1.8 requires **two new npm packages** (`@upstash/redis`, `@upstash/ratelimit`) and **one new file convention** (`proxy.ts`). Everything else uses existing installed packages or Supabase-side SQL changes. The CSP implementation uses Next.js 16's `proxy.ts` (renamed from `middleware.ts`) with a non-nonce approach to preserve static rendering. Rate limiting upgrades from the in-memory Map to Upstash Redis via the Vercel Marketplace integration. Driver dashboards use already-installed Recharts 3.6.0 and date-fns 4.1.0. RLS audit is pure SQL work requiring no new dependencies. Role-based redirects are implemented in the auth callback route and proxy.ts with zero additional libraries.

---

## New Dependencies (Install These)

### Rate Limiting Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @upstash/redis | ^1.36.2 | Serverless Redis client for Vercel | HTTP-based (no persistent connections), works in serverless/edge. Vercel KV is deprecated -- Upstash Redis is the official Vercel Marketplace replacement. Free tier: 500K commands/month, sufficient for this app's scale. |
| @upstash/ratelimit | ^2.0.8 | Rate limiting library built on Upstash Redis | Purpose-built for serverless. Sliding window algorithm prevents burst abuse at window boundaries. Caches "hot" function data to minimize Redis calls. Drop-in replacement for existing in-memory `checkRateLimit()`. |

**Installation:**
```bash
pnpm add @upstash/redis @upstash/ratelimit
```

**Environment variables (set via Vercel Marketplace integration):**
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

**Integration pattern:**
```typescript
// src/lib/utils/rate-limit.ts (replaces existing in-memory implementation)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),  // 5 per minute
  prefix: "rl:auth",
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),  // 30 per minute
  prefix: "rl:api",
});

// Usage: const { success, remaining } = await authLimiter.limit(identifier);
```

**Algorithms available:**
- `fixedWindow(tokens, window)` -- simple, lowest Redis cost
- `slidingWindow(tokens, window)` -- prevents burst at boundaries, recommended
- `tokenBucket(refillRate, interval, maxTokens)` -- smooths bursts, regional only

**Recommendation:** Use `slidingWindow` for auth endpoints (existing pattern), `fixedWindow` for general API rate limiting (cheaper).

---

## New File Conventions (No Package Install)

### Content Security Policy via proxy.ts

Next.js 16 renamed `middleware.ts` to `proxy.ts`. This project has no middleware/proxy file yet. CSP headers go here.

**File location:** `src/proxy.ts` (same level as `app/`)

**Approach: Non-nonce CSP (preserving static rendering)**

Nonce-based CSP forces ALL pages to dynamic rendering, killing CDN caching and increasing server load. This app has many statically-rendered pages (menu, home, legal pages). Use `'unsafe-inline'` for scripts/styles with strict domain allowlisting instead.

**Why not nonces:**
- App has 20+ static/ISR pages that would lose caching
- LCP already optimized to <4s -- dynamic rendering would regress this
- Sentry tunnel route (`/monitoring`) bypasses CSP connect-src for error reporting
- `'unsafe-inline'` + strict domain allowlist is standard for apps with many third-party integrations

**Why not SRI (experimental):**
- Webpack-only, project uses Turbopack dev mode
- Experimental feature, may change
- Does not cover inline styles/scripts from third parties

**CSP domains needed:**

| Directive | Domains | Why |
|-----------|---------|-----|
| `default-src` | `'self'` | Baseline restriction |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` (dev only for eval) | Next.js inline scripts, Stripe.js |
| `script-src` | `https://js.stripe.com` | Stripe checkout |
| `script-src` | `https://maps.googleapis.com` | Google Maps |
| `style-src` | `'self' 'unsafe-inline'` | TailwindCSS, Framer Motion inline styles |
| `style-src` | `https://fonts.googleapis.com` | Google Fonts |
| `img-src` | `'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com` | Supabase Storage, Google avatars |
| `font-src` | `'self' https://fonts.gstatic.com` | Google Fonts |
| `connect-src` | `'self' https://*.supabase.co https://api.stripe.com https://*.ingest.us.sentry.io https://maps.googleapis.com` | API calls to services |
| `frame-src` | `https://js.stripe.com https://hooks.stripe.com` | Stripe 3D Secure iframe |
| `object-src` | `'none'` | Block plugins |
| `base-uri` | `'self'` | Prevent base tag injection |
| `form-action` | `'self'` | Restrict form targets |
| `frame-ancestors` | `'none'` | Prevent clickjacking |

**Additional security headers to add alongside CSP:**

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking (legacy browsers) |
| `X-XSS-Protection` | `0` | Disable buggy browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | Restrict device APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |

**Implementation sketch:**
```typescript
// src/proxy.ts
import { NextResponse, NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://maps.googleapis.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com https://drive.google.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.ingest.us.sentry.io https://maps.googleapis.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", cspDirectives);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icons|fonts|monitoring|sw.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
```

**Note:** The Sentry tunnel route (`/monitoring`) is excluded from the matcher so CSP does not interfere with error reporting. The `/sw.js` service worker file is also excluded.

---

## Existing Dependencies (Already Installed, No Changes)

### Driver Dashboards & Scheduling

| Technology | Installed Version | v1.8 Usage | Notes |
|------------|-------------------|------------|-------|
| recharts | 3.6.0 | Earnings charts (BarChart, LineChart, AreaChart), route stats | Already used for admin analytics. Extend to driver earnings dashboard. ResponsiveContainer for mobile. |
| date-fns | 4.1.0 | Availability scheduling date math, route date formatting | Already used across the app. `format`, `startOfWeek`, `eachDayOfInterval`, `isSameDay` for scheduling UI. |
| @radix-ui/react-select | 2.2.6 | Vehicle type, time slot, availability day pickers | Already installed. Use for driver profile setup selects. |
| @radix-ui/react-checkbox | 1.3.2 | Availability day toggles | Already installed. |
| @radix-ui/react-dialog | 1.1.15 | Profile setup, earnings detail modals | Already installed. |
| react-hook-form + zod | 7.71.1 / 4.3.5 | Driver profile form, availability form validation | Already installed. Add driver-specific schemas to `src/lib/validations/`. |
| framer-motion | 12.26.1 | Dashboard card animations, earnings chart entry animations | Already installed. Use `m.*` components (LazyMotion strict mode). |
| @react-google-maps/api | 2.20.8 | Route history map visualization, planned route preview | Already installed. Used in tracking page. Extend to driver route history view. |
| lucide-react | 0.562.0 | Dashboard icons (DollarSign, Clock, MapPin, Star, Calendar, Truck) | Already installed. |
| @supabase/supabase-js | 2.90.1 | All database queries for driver data | Already installed. No version change needed. |

### Supabase RLS Audit

| Technology | Version | v1.8 Usage | Notes |
|------------|---------|------------|-------|
| @supabase/supabase-js | 2.90.1 | RLS policy testing via client SDK (not SQL Editor, which bypasses RLS) | Already installed. |
| Existing `rls-isolation-test.mjs` | n/a | Extend existing test script to cover all 24 tables | Script exists at `scripts/rls-isolation-test.mjs`. Expand test cases. |

### Role-Based Redirects

No new dependencies. Implementation in:
1. `src/proxy.ts` -- check auth session, redirect based on `user_metadata.role`
2. `src/app/auth/callback/route.ts` -- already handles driver invite flow, extend with role-based `next` parameter

---

## Supabase RLS Audit Scope

**All tables with RLS enabled (24 total):**

| Table | RLS Status | Policy Quality | Audit Priority |
|-------|-----------|---------------|----------------|
| profiles | Enabled | Good -- uses `(select auth.uid())` initplan | LOW |
| addresses | Enabled | Good -- user_id scoped | LOW |
| menu_categories | Enabled | Good -- public read, admin write | LOW |
| menu_items | Enabled | Good -- public read, admin write | LOW |
| modifier_groups | Enabled | Good -- public read, admin write | LOW |
| modifier_options | Enabled | Good -- public read, admin write | LOW |
| item_modifier_groups | Enabled | Good -- public read, admin write | LOW |
| orders | Enabled | Check -- no driver SELECT policy (drivers need to see assigned orders) | HIGH |
| order_items | Enabled | Good -- JOIN-based access | LOW |
| order_item_modifiers | Enabled | Good -- nested JOIN access | LOW |
| drivers | Enabled | Good -- user_id + admin scoped | LOW |
| routes | Enabled | Good -- uses `get_my_driver_id()` | LOW |
| route_stops | Enabled | Good -- complex multi-role access | LOW |
| location_updates | Enabled | Good -- driver + customer access via routes | LOW |
| delivery_exceptions | Enabled | Good -- driver via route, admin access | LOW |
| notification_logs | Enabled | Good -- user_id + admin | LOW |
| driver_ratings | Enabled | Good -- multi-role with delivered check | LOW |
| featured_sections | Enabled | Check policy patterns | MEDIUM |
| featured_section_items | Enabled | Check policy patterns | MEDIUM |
| app_settings | Enabled | Check -- should be admin-only read/write | MEDIUM |
| order_audit_log | Enabled | Check -- uses `profiles.role = 'admin'` instead of `is_admin()` function | HIGH |
| driver_invites | Enabled | Check -- multiple RLS fix migrations (014, 016, 017, 018) suggest fragility | HIGH |
| customer_settings | Enabled | Good -- user_id scoped, uses `(SELECT auth.uid())` | LOW |
| webhook_events | Enabled | Good -- no policies = service_role only | LOW |

**Key findings:**
- `order_audit_log` uses raw `profiles.role = 'admin'` instead of the `is_admin()` security function -- inconsistent with other tables
- `driver_invites` has had 4 RLS fix migrations, suggesting the policies are fragile and need consolidation
- `orders` table lacks driver SELECT access -- drivers currently use API routes with service role, but direct access would be cleaner
- All original tables (002_rls_policies.sql) use proper `(select auth.uid())` initplan optimization

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @upstash/redis + @upstash/ratelimit | Redis Cloud / self-hosted Redis | If you need >500K commands/month free tier; or if you want connection pooling for non-serverless environments |
| Non-nonce CSP via proxy.ts | Nonce-based CSP via proxy.ts | If app moves to 100% dynamic rendering; if `'unsafe-inline'` is unacceptable for compliance |
| proxy.ts for security headers | next.config.ts `headers()` only | For simpler CSP without request-time logic; current `headers()` approach works but proxy.ts enables future middleware logic (auth redirects) |
| Sliding window rate limit | Token bucket | If you need to allow short bursts while enforcing average rate; token bucket is regional-only in Upstash |
| Recharts (existing) for earnings | Victory, Nivo, Tremor | Only if Recharts proves insufficient for specific chart types; Recharts is already installed and used for admin analytics, consistency matters |
| date-fns (existing) for scheduling | Temporal API, Day.js | date-fns already pervasive in codebase; Temporal is not yet stable in all runtimes; Day.js adds unnecessary second date library |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@vercel/kv` | Deprecated December 2024, replaced by Upstash Redis via Marketplace | `@upstash/redis` directly |
| `middleware.ts` | Deprecated in Next.js 16, renamed to `proxy.ts` | `proxy.ts` with `export function proxy()` |
| Nonce-based CSP | Forces dynamic rendering on ALL pages, kills CDN caching, regresses LCP | Non-nonce CSP with domain allowlisting |
| `next-safe` / `@next-safe/middleware` | Third-party wrapper around CSP headers, adds dependency for what's 20 lines of code | Direct CSP header string in proxy.ts |
| `express-rate-limit` / `rate-limiter-flexible` | Designed for persistent servers, not serverless. In-memory stores reset on cold starts. | @upstash/ratelimit (serverless-native) |
| `ioredis` / `redis` (node-redis) | Require persistent TCP connections, incompatible with Vercel serverless | @upstash/redis (HTTP-based, connectionless) |
| pgTAP for RLS testing | Requires Supabase CLI local dev setup (Docker), adds complexity for what can be tested via SDK | Extend existing `rls-isolation-test.mjs` script + Vitest tests hitting Supabase with different auth contexts |
| Separate scheduling library (react-big-calendar, @fullcalendar) | Overkill for simple weekly availability toggling | Custom UI with Radix checkboxes + date-fns for day-of-week logic |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @upstash/ratelimit@2.0.8 | @upstash/redis@1.36.2 | ratelimit requires redis as peer dependency |
| @upstash/redis@1.36.2 | Next.js 16.1.2 (Node.js runtime) | HTTP-based, works in serverless and proxy.ts |
| proxy.ts | Next.js >= 16.0.0 | Renamed from middleware.ts; uses Node.js runtime (not Edge) |
| Recharts 3.6.0 | React 19.2.3 | Already working in production for admin analytics |

---

## Infrastructure Setup

### Upstash Redis via Vercel Marketplace

1. Go to Vercel Dashboard > project > Storage > Browse Marketplace
2. Select "Upstash Redis"
3. Create database (select US region for LA-based service)
4. Link to project -- auto-sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
5. For local dev: copy env vars to `.env.local`

**Free tier limits (sufficient for Morning Star):**
- 500K commands/month
- 100GB storage
- 200GB bandwidth/month
- Single region (US)

**Estimated usage:** Auth rate limiting + API rate limiting for ~100 users = <10K commands/month. Well within free tier.

---

## Sources

- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- official docs, last updated 2026-02-11, verified proxy.ts approach (HIGH confidence)
- [Next.js proxy.ts File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- official docs for middleware-to-proxy migration (HIGH confidence)
- [Upstash Ratelimit Getting Started](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted) -- official docs, sliding window usage pattern (HIGH confidence)
- [Upstash Ratelimit Algorithms](https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms) -- fixed window, sliding window, token bucket details (HIGH confidence)
- [Upstash Pricing](https://upstash.com/pricing/redis) -- free tier 500K commands/month confirmed (HIGH confidence)
- [Vercel Redis Marketplace](https://vercel.com/docs/redis) -- Vercel KV deprecated, Upstash is official replacement (HIGH confidence)
- [Sentry CSP Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/security-policy-reporting/) -- connect-src domain for `*.ingest.us.sentry.io` (HIGH confidence)
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- index columns in RLS policies, test via SDK not SQL Editor (HIGH confidence)
- [@upstash/ratelimit npm](https://www.npmjs.com/package/@upstash/ratelimit) -- version 2.0.8 (MEDIUM confidence, npm page 403'd, version from search results)
- [@upstash/redis npm](https://www.npmjs.com/package/@upstash/redis) -- version 1.36.2 (MEDIUM confidence, from search results)

---
*Stack research for: v1.8 Post-Launch Hardening & Driver Experience*
*Researched: 2026-02-16*
