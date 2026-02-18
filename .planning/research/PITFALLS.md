# Pitfalls Research: v1.8 Post-Launch Hardening & Driver Experience

**Domain:** CSP headers, Supabase RLS hardening, distributed rate limiting, driver features, role-based auth redirects for existing Next.js 16 + Supabase + Vercel app
**Researched:** 2026-02-16
**Confidence:** HIGH (codebase audit + official docs + WebSearch verified)

---

## Critical Pitfalls

### Pitfall 1: CSP Breaks GSAP and Framer Motion Inline Styles

**What goes wrong:**
Adding a Content Security Policy with strict `style-src` (no `'unsafe-inline'`) breaks the entire app. GSAP animations freeze, Framer Motion transitions stop working, and 315+ components with inline `style=` attributes render incorrectly. The app looks broken with no console errors visible to users -- only CSP violation reports in the browser console.

**Why it happens:**
This project has 700+ inline style usages across 315 files. CSP `style-src` treats different style application methods differently:

| Method                                     | Blocked by CSP?                  | Used in this project?                                                  |
| ------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------- |
| `element.style.opacity = 1` (DOM property) | NO                               | Yes -- GSAP and Framer Motion primarily use this                       |
| `element.style.cssText = "..."`            | YES                              | Yes -- `FlyToCart.tsx` line 145, `CustomMarkers.tsx` lines 11/36/52/70 |
| `element.setAttribute("style", "...")`     | YES                              | Potentially by libraries                                               |
| `<style dangerouslySetInnerHTML>`          | YES (needs nonce)                | Yes -- `AppHeader.tsx` line 170 (dark mode glassmorphism)              |
| JSX `style={{ }}` prop                     | YES (via React's `setAttribute`) | Yes -- 700+ occurrences across codebase                                |

The critical nuance: React renders JSX `style={{ }}` props via `setAttribute`, which IS blocked by strict CSP. But GSAP's `gsap.to()` and Framer Motion's `animate` use individual DOM property assignments, which are NOT blocked. However, GSAP's `SplitText` and some internal methods use `cssText`, which IS blocked.

**How to avoid:**

- Use `'unsafe-inline'` for `style-src` initially. This is the pragmatic choice for animation-heavy apps
- Strict CSP for `script-src` (nonce-based) provides the real security value; `style-src: 'unsafe-inline'` is an acceptable tradeoff
- Refactor the 5 `cssText` usages in `CustomMarkers.tsx` and `FlyToCart.tsx` to use individual property assignments
- Add `nonce` to the `<style dangerouslySetInnerHTML>` in `AppHeader.tsx` via the `x-nonce` header
- Pass nonce to Framer Motion's `<MotionConfig nonce={nonce}>` for any internal `<style>` blocks it generates
- Do NOT attempt strict `style-src` with nonces for the entire app -- JSX `style={}` props cannot receive nonces

**Warning signs:**

- Animations freeze or elements appear unstyled after CSP deployment
- Browser console floods with `Refused to apply inline style` violations
- Cart fly-to-cart animation breaks (uses `cssText`)
- Google Maps custom markers disappear (use `cssText`)
- AppHeader dark mode glassmorphism stops working

**Phase to address:** CSP Headers phase (early -- validates whether strict or relaxed approach needed)

**Source confidence:** HIGH -- verified via [MDN style-src documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src), [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy), [Framer Motion CSP issue #1727](https://github.com/framer/motion/issues/1727), [GSAP SplitText CSP thread](https://gsap.com/community/forums/topic/34053-splittext-inline-style-content-security-policy-violation/)

---

### Pitfall 2: CSP Third-Party Domain Whitelist Is Incomplete, Breaks Google Maps / Stripe / Sentry

**What goes wrong:**
CSP with `default-src 'self'` blocks all external resource loading. Google Maps tiles don't render, Stripe Elements iframe won't load, Sentry events can't be sent, and Supabase auth calls fail. Each third-party service needs specific CSP directives across multiple categories (`script-src`, `connect-src`, `frame-src`, `img-src`, `font-src`, `worker-src`).

**Why it happens:**
This project integrates 6+ external services, each requiring its own CSP whitelist entries. Missing even one domain for one directive breaks that service silently. The full matrix:

| Service          | script-src                      | connect-src                                        | frame-src                                        | img-src                                                                     | font-src            | worker-src |
| ---------------- | ------------------------------- | -------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------- | ---------- |
| Google Maps      | `*.googleapis.com`              | `*.googleapis.com *.google.com *.gstatic.com`      | `*.google.com`                                   | `*.googleapis.com *.gstatic.com *.google.com *.googleusercontent.com data:` | `fonts.gstatic.com` | `blob:`    |
| Stripe Elements  | `js.stripe.com *.js.stripe.com` | `api.stripe.com`                                   | `js.stripe.com *.js.stripe.com hooks.stripe.com` | `*.stripe.com`                                                              | --                  | `blob:`    |
| Sentry           | --                              | `*.ingest.sentry.io` (or tunnel via `/monitoring`) | --                                               | --                                                                          | --                  | --         |
| Supabase         | --                              | `*.supabase.co`                                    | --                                               | `*.supabase.co`                                                             | --                  | --         |
| Vercel Analytics | --                              | `vitals.vercel-insights.com`                       | --                                               | --                                                                          | --                  | --         |
| Google Fonts     | --                              | `fonts.googleapis.com`                             | --                                               | --                                                                          | `fonts.gstatic.com` | --         |

**How to avoid:**

- Build the CSP incrementally: start with `Content-Security-Policy-Report-Only` header that logs violations without blocking
- Run `Content-Security-Policy-Report-Only` in production for 1-2 weeks to catch ALL violation domains
- Use Sentry CSP violation reporting (`report-uri` directive) to aggregate violations
- Add domains to the policy one service at a time, verifying each works
- Use the Sentry tunnel route (`/monitoring`) to avoid needing `*.ingest.sentry.io` in `connect-src`
- Test every user flow after enabling enforcing CSP: checkout (Stripe), tracking (Maps), login (Supabase), error reporting (Sentry)

**Warning signs:**

- Google Maps shows gray tiles or "This page can't load Google Maps correctly"
- Stripe checkout shows blank white iframe
- Sentry dashboard stops receiving events
- Supabase auth calls fail with CORS-like errors (actually CSP blocks)
- Console shows `Refused to load the script` or `Refused to connect` violations

**Phase to address:** CSP Headers phase (must be comprehensive from day one)

**Source confidence:** HIGH -- verified via [Google Maps CSP guide](https://developers.google.com/maps/documentation/javascript/content-security-policy), [Stripe CSP requirements](https://docs.stripe.com/security/guide), [Sentry CSP reporting](https://docs.sentry.io/platforms/javascript/guides/nextjs/security-policy-reporting/)

---

### Pitfall 3: CSP Nonces Force All Pages to Dynamic Rendering, Killing Performance

**What goes wrong:**
Adding nonce-based CSP requires every page to be dynamically rendered (no static generation, no ISR, no CDN caching). For an app with 60K+ lines and animation-heavy pages, this means: (a) every page request hits the server, (b) TTFB increases significantly, (c) LCP regresses from <4s (already hard-won in v1.5-v1.7) back to 6-8s, (d) Vercel costs increase due to more serverless function invocations.

**Why it happens:**
CSP nonces must be unique per request. Static pages are generated at build time with no request context, so nonces can't be injected. The [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) explicitly states: "When you use nonces in your CSP, all pages must be dynamically rendered... Static optimization and Incremental Static Regeneration (ISR) are disabled." Additionally, Partial Prerendering (PPR) is incompatible with nonce-based CSP since static shell scripts won't have access to the nonce.

This project already optimized LCP from 19.9s to <4s through Server Components, lazy loading, and code splitting. Forcing dynamic rendering undoes much of that work.

**How to avoid:**

- Use nonces ONLY for `script-src`, which provides the real XSS protection
- Use `'unsafe-inline'` for `style-src` (safe for this animation-heavy app; style injection is low-risk compared to script injection)
- Consider Next.js experimental SRI (Subresource Integrity) as an alternative to nonces: hash-based CSP that preserves static generation. But note: SRI is experimental and webpack-only (not Turbopack)
- If nonces are required, use `await connection()` in pages that need dynamic rendering, and accept the performance cost
- Monitor LCP impact with Vercel Analytics after CSP deployment; have a rollback plan

**Warning signs:**

- LCP regresses after CSP deployment (check Vercel Analytics)
- Build output shows all pages as dynamic (lambda) instead of static
- Vercel serverless function invocation count spikes
- Pages that were previously fast (menu, homepage) become noticeably slower

**Phase to address:** CSP Headers phase (architecture decision: nonce vs non-nonce)

**Source confidence:** HIGH -- verified via [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) (explicitly documents dynamic rendering requirement and PPR incompatibility)

---

### Pitfall 4: Enabling RLS on Existing Tables Locks Out All Users

**What goes wrong:**
Running `ALTER TABLE orders ENABLE ROW LEVEL SECURITY` on a table that already has RLS enabled but with policies that need changes drops all existing policies during the migration, leaving a window where RLS is enabled with no policies. During this window, all authenticated user queries return empty results. No errors -- just empty data. Customers see no orders, drivers see no routes, admin sees no data.

**Why it happens:**
This project already has RLS enabled on all tables (migration `002_rls_policies.sql`). The v1.8 RLS audit will modify existing policies. The danger is the migration pattern:

```sql
-- DANGEROUS: Gap between DROP and CREATE
DROP POLICY IF EXISTS "orders_select" ON orders;
-- If migration fails HERE, table has RLS but no select policy
CREATE POLICY "orders_select_v2" ON orders FOR SELECT USING (...);
```

The project has already experienced this exact pattern with driver invites -- 5 consecutive migration files (014 through 018) fixing RLS policies that broke in production. The root cause each time: policy logic assumed access patterns that didn't match reality.

Additionally, the existing `is_admin()` function uses `SECURITY DEFINER` which means it runs as the function owner (postgres), not the calling user. If this function is modified during the RLS audit, all policies that depend on it break simultaneously across every table.

**How to avoid:**

- NEVER drop a policy without immediately creating its replacement in the same transaction
- Use `CREATE OR REPLACE POLICY` when available, or wrap DROP + CREATE in a transaction:
  ```sql
  BEGIN;
  DROP POLICY IF EXISTS "old_policy" ON table;
  CREATE POLICY "new_policy" ON table ...;
  COMMIT;
  ```
- Test ALL policy changes against the Supabase local development database first (`supabase db reset && supabase db push`)
- Test with the Supabase client SDK (not SQL Editor, which bypasses RLS as superuser)
- Add a new policy BEFORE dropping the old one (overlap is safe; multiple permissive policies OR together)
- Never modify `is_admin()` or `get_my_driver_id()` functions without testing every table's policies
- Write RLS tests (the project already has `supabase/tests/00_rls_policies.test.sql` -- extend it)

**Warning signs:**

- Users report "no data" after a deployment (not errors, just empty results)
- Admin dashboard shows 0 orders, 0 drivers, 0 categories
- Driver sees "No routes assigned" when they have an active route
- SQL Editor shows data (superuser bypasses RLS) but client SDK returns empty

**Phase to address:** RLS Audit phase (must have rollback plan for every policy change)

**Source confidence:** HIGH -- verified via [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase RLS performance guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv), and project migration history (014-018 driver invite RLS fixes)

---

### Pitfall 5: RLS Policies Using user_metadata for Role Checks Are Insecure

**What goes wrong:**
New driver-related RLS policies check `auth.jwt() -> 'user_metadata' ->> 'role'` to determine if a user is a driver. But `user_metadata` can be modified by authenticated end users via the Supabase client SDK. Any authenticated user could set their role to "driver" or "admin" and bypass RLS.

**Why it happens:**
The auth callback (`src/app/auth/callback/route.ts` line 80-88) sets `user_metadata.role = "driver"` via the service role client. This is fine for the initial role assignment. But if RLS policies rely on `user_metadata` claims, any user can call `supabase.auth.updateUser({ data: { role: 'admin' } })` from the browser and gain unauthorized access.

The project already handles this correctly for admin checks -- `is_admin()` queries the `profiles.role` column (database truth), not JWT metadata. But new driver policies might be tempted to use the faster JWT check instead.

**How to avoid:**

- ALWAYS use database-backed role checks (`is_admin()`, `is_driver()`, `get_my_driver_id()`) in RLS policies
- NEVER use `auth.jwt() -> 'user_metadata' ->> 'role'` in RLS policies
- The existing `is_driver()` and `get_my_driver_id()` functions already query the `drivers` table -- use these exclusively
- Use `user_metadata` ONLY for non-security purposes (display name, preferences)
- Add a comment to RLS migration files: `-- SECURITY: Never use user_metadata for access control`
- The one exception: `auth.jwt() ->> 'email'` is safe (email is verified by Supabase, not user-modifiable via metadata)

**Warning signs:**

- New RLS policy contains `user_metadata` or `raw_user_meta_data`
- Policy checks role from JWT claims instead of profiles/drivers table
- Security review finds policies that can be bypassed by `supabase.auth.updateUser()`

**Phase to address:** RLS Audit phase (policy review checklist)

**Source confidence:** HIGH -- verified via [Supabase RLS guide](https://designrevision.com/blog/supabase-row-level-security) ("user_metadata claim... can be modified by authenticated end users"), and existing project pattern in `is_admin()` function

---

### Pitfall 6: Middleware Auth Redirect Loop -- Supabase Token Refresh + Role Check + CSP Nonce

**What goes wrong:**
Adding role-based redirects in Next.js middleware creates infinite redirect loops. User hits `/menu`, middleware checks auth, token is expired, middleware refreshes token but redirect already fired, user bounces between `/login` and `/menu` endlessly. Browser shows "ERR_TOO_MANY_REDIRECTS."

**Why it happens:**
Three concerns converge in middleware, each with its own redirect behavior:

1. **CSP nonce generation** -- must run on every request (adds `x-nonce` header)
2. **Supabase token refresh** -- must call `supabase.auth.getUser()` to refresh cookies
3. **Role-based redirect** -- admin users redirected to `/admin`, drivers to `/driver`

The conflicts:

- Middleware runs on EVERY matching request, including redirects. If middleware redirects to `/login`, the `/login` request also runs through middleware, which may redirect again
- Supabase token refresh requires setting cookies on both request and response objects. If the middleware redirects before the cookie is set, the token stays expired
- The existing login page (line 13-14) redirects authenticated users to `/` -- if middleware also redirects authenticated users, they loop between the two redirects
- Static assets and API routes should NOT run through auth/redirect logic but DO run through CSP nonce logic
- The auth callback route (`/auth/callback`) must be excluded from ALL middleware redirect logic

**How to avoid:**

- Structure middleware as a chain with explicit ordering:
  1. CSP nonce (runs on all non-static requests)
  2. Supabase token refresh (runs on all non-static requests, no redirects)
  3. Role-based redirect (runs ONLY on specific paths, after token refresh)
- Exclude these paths from redirect logic: `/auth/callback`, `/api/*`, `/_next/*`, `/monitoring`, `/driver/onboard`, static assets
- Never redirect FROM the login page in middleware (the page component handles post-login redirect via `?next=` param)
- Use the Supabase `getClaims()` method (validates JWT cryptographically) instead of `getSession()` (trusts cookies that can be spoofed)
- Test the complete flow: unauthenticated user -> login -> magic link -> callback -> role-based redirect -> dashboard

**Warning signs:**

- Browser shows "This page redirected you too many times"
- Middleware matcher is too broad (matches `/_next/static` or `/api/` paths)
- Auth callback route goes through redirect logic
- Login page and middleware both redirect authenticated users
- Token refresh happens AFTER redirect decision (stale token used for role check)

**Phase to address:** Role-Based Redirects phase (must handle middleware chain carefully)

**Source confidence:** HIGH -- verified via [Supabase SSR Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs), [Next.js middleware redirect issues](https://github.com/vercel/next.js/issues/32739), and project's existing layout-level auth checks

---

### Pitfall 7: In-Memory Rate Limiter Silently Fails in Serverless (Already Failing in Production)

**What goes wrong:**
The current in-memory rate limiter (`src/lib/utils/rate-limit.ts`) using a `Map` does not work correctly on Vercel. Each serverless function invocation gets its own memory space. Rate limit state is never shared between invocations. An attacker can send 100 requests to `/api/auth/signIn` and each hits a different serverless instance, never triggering the 5-per-minute limit.

**Why it happens:**
Vercel serverless functions are stateless. The `rateLimitStore = new Map()` (line 11) is created fresh for each cold start. Even if the function stays "warm," Vercel may run multiple concurrent instances, each with their own Map. The `setInterval(cleanupExpiredEntries, 5 * 60 * 1000)` (line 84) is harmless but misleading -- it suggests persistence that doesn't exist.

The rate limiter also uses email as the identifier (line 45: `action:${identifier.toLowerCase()}`), which means an attacker can rotate email addresses to bypass rate limiting even if it worked correctly.

**How to avoid:**

- Migrate to Upstash Redis rate limiting (`@upstash/ratelimit`):
  - HTTP-based (connectionless) -- works in serverless and edge
  - Provides sliding window, fixed window, and token bucket algorithms
  - Built-in ephemeral cache to reduce Redis calls during hot function instances
- Create the `Ratelimit` instance OUTSIDE the handler function (module scope) to benefit from ephemeral caching between requests on the same instance
- Use IP address as primary identifier (not email): `request.headers.get('x-forwarded-for')` on Vercel
- Keep email as secondary identifier for auth endpoints (rate limit per IP AND per email)
- Add rate limiting to ALL API routes, not just auth endpoints (current limiter only covers signIn/signUp/resetPassword)
- Consider Vercel Edge middleware-level rate limiting for global protection

**Warning signs:**

- Auth brute-force attempts succeed despite rate limiter being "configured"
- Multiple concurrent API requests from same IP all succeed
- Rate limiter Map is empty on every cold start (no persistence)
- `setInterval` for cleanup runs but Map is always empty

**Phase to address:** Rate Limiting Upgrade phase (replace in-memory with Upstash Redis)

**Source confidence:** HIGH -- verified via [Upstash Rate Limiting docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/features), [Vercel + Upstash template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis), and project code audit showing `new Map()` at module scope

---

### Pitfall 8: Driver RLS Policies Missing for New Driver Feature Tables

**What goes wrong:**
New v1.8 driver features (earnings, availability scheduling, planned routes) require new database tables or columns. If these are added without RLS policies, they're publicly accessible via the Supabase anon key. If RLS is enabled without policies, drivers can't access their own data. If policies are wrong, drivers can see other drivers' earnings.

**Why it happens:**
The existing driver-related RLS is well-structured (routes, route_stops, location_updates, delivery_exceptions all have proper policies). But new tables for earnings, availability, or driver preferences may not get the same treatment. The `drivers_insert` policy only allows admin insertion (line 236: `WITH CHECK (public.is_admin())`), so drivers can't create their own availability records if the policy follows the same pattern.

New columns added to existing tables (e.g., adding `earnings_cents` to `route_stops`) inherit the existing table's RLS policies, which may not account for the new data sensitivity level.

**How to avoid:**

- For every new table: enable RLS AND add policies in the SAME migration file
- Follow the existing pattern: use `get_my_driver_id()` for driver-owned data, `is_admin()` for admin operations
- New driver self-service tables (availability, preferences) need INSERT/UPDATE policies for `user_id = auth.uid()` or `driver_id = get_my_driver_id()`
- Earnings data should be SELECT-only for drivers (computed by system, not user-editable):
  ```sql
  CREATE POLICY "drivers_view_own_earnings" ON driver_earnings
    FOR SELECT USING (driver_id = get_my_driver_id() OR is_admin());
  -- No INSERT/UPDATE policy for drivers -- only admin/system can write
  ```
- Add RLS tests for every new table to `supabase/tests/00_rls_policies.test.sql`
- Test as each role: anon, customer, driver, admin

**Warning signs:**

- New migration enables RLS without any policies
- New table allows drivers to modify their own earnings
- Policy uses `auth.uid()` directly instead of `get_my_driver_id()` for driver tables
- No RLS tests written for new tables

**Phase to address:** Driver Features phase (RLS must be part of each feature's migration, not a separate task)

**Source confidence:** HIGH -- verified via existing project RLS patterns and [Supabase RLS best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

---

### Pitfall 9: Role-Based Redirect Breaks Driver Onboarding Flow

**What goes wrong:**
Middleware detects user has `role: "driver"` in their profile/metadata and redirects them to `/driver`. But the user hasn't completed onboarding yet -- they need to reach `/driver/onboard` first. The middleware redirect sends them to `/driver`, the driver layout checks `is_active = true`, finds no active driver record, and redirects to `/?error=not_driver`. User is stuck in a loop or lands on the homepage with a confusing error.

**Why it happens:**
The driver onboarding flow has a specific lifecycle:

1. Admin sends invite -> driver gets magic link email
2. Driver clicks link -> lands on `/auth/callback?invite_id=xxx`
3. Callback sets `user_metadata.role = "driver"` (line 87)
4. User redirected to `/driver/onboard` (via `?next=/driver/onboard` param)
5. User fills out onboarding form -> creates driver record with `is_active = true`
6. THEN user can access `/driver` dashboard

If middleware sees `role: "driver"` at step 3 and redirects to `/driver`, the user never reaches step 4-5. The driver layout (line 23-34) requires `is_active = true`, which doesn't exist until after onboarding.

**How to avoid:**

- Middleware role-based redirect must check BOTH role AND active status:
  - `role = "driver"` AND `is_active = true` -> redirect to `/driver`
  - `role = "driver"` AND `is_active = false` (or no driver record) -> allow through (let them reach `/driver/onboard`)
- Whitelist `/driver/onboard` from driver redirects
- The simplest approach: don't redirect to `/driver` in middleware at all. Let the login page handle the redirect via `?next=` parameter. Use middleware only for protection (blocking access), not for convenience (redirecting to dashboards)
- If middleware redirect is required, query the drivers table or check a reliable indicator:
  - Option A: Check `profiles.role` in middleware (requires Supabase query on every request -- expensive)
  - Option B: Set a custom claim via Supabase Auth Hook (requires Supabase Pro plan)
  - Option C: Use `user_metadata.onboarding_complete` flag (set after onboarding, but user-modifiable -- use for UX only, not security)

**Warning signs:**

- New driver invited but can't complete onboarding
- Driver stuck on homepage with `?error=not_driver` after clicking magic link
- Middleware redirects before onboarding form is accessible
- Login page `?next=` parameter is overridden by middleware redirect

**Phase to address:** Role-Based Redirects phase (must account for onboarding lifecycle)

**Source confidence:** HIGH -- verified via project code: auth callback (lines 61-108), driver layout (lines 23-34), onboard page (lines 91-119)

---

## Technical Debt Patterns

| Shortcut                                             | Immediate Benefit                                         | Long-term Cost                                                                                                | When Acceptable                                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `style-src 'unsafe-inline'` in CSP                   | All existing styles work, no refactoring needed           | Lower security grade on scanners; style injection theoretically possible (low risk)                           | Acceptable for animation-heavy apps with GSAP/Framer Motion -- the alternative (strict style-src) breaks the app or forces dynamic rendering |
| Checking role in layout instead of middleware        | No middleware complexity, works with current architecture | Auth check runs AFTER page component loads; flicker on role mismatch; redundant Supabase calls per request    | Acceptable for launch; migrate to middleware when role-based redirects are stable                                                            |
| Rate limiting auth endpoints only                    | Simple, covers highest-risk endpoints                     | Other API routes unprotected (menu scraping, order enumeration, analytics abuse)                              | Only during initial migration; expand to all routes within same milestone                                                                    |
| `Content-Security-Policy-Report-Only` in production  | No risk of breaking the app; collects violation data      | No actual security enforcement; gives false sense of protection                                               | Acceptable for 2-4 weeks during CSP rollout to discover missing domains                                                                      |
| Hardcoding driver earnings calculation in API routes | Fast implementation, no new database tables               | Scattered business logic; hard to audit; no historical record of calculation changes                          | Never for production -- use database-computed values or at minimum a centralized service function                                            |
| Skipping RLS tests for simple policies               | Faster development                                        | Policy bugs discovered by users, not tests; 014-018 migration sequence proves this creates multi-fix cascades | Never -- the project's own history shows RLS bugs cascade into 5+ fix migrations                                                             |

## Integration Gotchas

| Integration                         | Common Mistake                                             | Correct Approach                                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framer Motion + CSP nonce           | Forgetting `<MotionConfig nonce={nonce}>` wrapper          | Wrap the app root with `<MotionConfig nonce={nonce}>` in layout.tsx. Pass nonce from `headers().get('x-nonce')` to client component via prop                                                        |
| GSAP + CSP                          | Assuming GSAP supports nonce for style attributes          | GSAP has NO nonce support for inline styles. Use `'unsafe-inline'` for `style-src`, or refactor GSAP animations to use CSS classes instead of inline transforms                                     |
| Upstash Redis + Vercel              | Creating `Ratelimit` instance inside handler function      | Create at module scope so ephemeral cache persists between warm invocations. Inside handler = new instance = no caching = more Redis calls = higher latency + cost                                  |
| Supabase middleware + token refresh | Using `getSession()` for auth check in middleware          | Use `getClaims()` which validates JWT signatures. `getSession()` trusts cookie data that can be spoofed                                                                                             |
| CSP + Sentry tunnel route           | Not excluding `/monitoring` from CSP enforcement           | If using `connect-src 'self'`, the tunnel works. But if middleware adds CSP to `/monitoring` responses, Sentry's internal scripts may be blocked. Exclude `/monitoring` from CSP middleware matcher |
| CSP + Service Worker                | SW not respecting CSP headers from server                  | Service worker fetch responses don't automatically inherit CSP. The SW must forward CSP headers from network responses, or the browser may strip them                                               |
| RLS + Supabase Realtime             | Adding RLS without checking Realtime channel subscriptions | Realtime subscriptions use the same RLS policies. Changing policies may silently break real-time updates for tracking/driver location features                                                      |
| Upstash + Multi-region              | Using single-region Redis for global users                 | For LA-based delivery service, single US region is fine. Don't over-engineer with `MultiRegionRatelimit`                                                                                            |
| Google Maps + CSP `worker-src`      | Missing `blob:` in `worker-src` directive                  | Google Maps uses web workers loaded from blob URLs. Add `worker-src blob:` or the map tiles won't load correctly                                                                                    |
| Stripe + CSP `worker-src`           | Missing `blob:` in `worker-src` for Stripe.js              | Stripe.js uses blob-based web workers. If `worker-src` is set without `blob:`, Stripe Elements break. If `worker-src` is absent, it falls back to `script-src` which may also be missing `blob:`    |

## Performance Traps

| Trap                                          | Symptoms                                                                                                           | Prevention                                                                                                                                     | When It Breaks                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Middleware Supabase query on every request    | TTFB increases 100-300ms per page load; serverless cold starts compound the latency                                | Cache role in JWT custom claims or use lightweight JWT-only check in middleware; full Supabase query only on protected routes                  | Immediately -- every page load pays the cost                                 |
| Upstash Redis call on every API request       | Added latency of 5-50ms per Redis call; monthly cost scales with request volume                                    | Use ephemeral cache (`new Map()` outside handler) to avoid Redis on hot instances; set reasonable rate limits that don't penalize normal users | >1000 requests/minute (unlikely for delivery app, but defense against abuse) |
| CSP nonces on static pages                    | All pages become dynamic; no CDN caching; TTFB increases 200-500ms; Vercel function count spikes                   | Use nonces only for `script-src`, use `'unsafe-inline'` for `style-src`; consider non-nonce CSP for public pages (menu, homepage)              | Immediately on deployment -- measurable LCP regression                       |
| RLS policy with unindexed column              | Queries slow down as table grows; RLS adds subquery per row                                                        | Run `EXPLAIN ANALYZE` after enabling new policies; ensure every column in a policy USING clause has an index                                   | 10K+ rows in table                                                           |
| Driver location polling without rate limiting | Driver app sends location every 5s; 10 drivers = 120 requests/minute; each hits Supabase + triggers RLS evaluation | Batch location updates (queue 3-5 updates client-side, send as batch); use Upstash rate limit on location endpoint                             | 10+ active drivers simultaneously                                            |

## Security Mistakes

| Mistake                                                   | Risk                                                                         | Prevention                                                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| RLS policy using `user_metadata` for role check           | Any authenticated user can set `role: "admin"` via client SDK and bypass RLS | Always use database-backed functions: `is_admin()`, `is_driver()`, `get_my_driver_id()`                             |
| CSP with `script-src 'unsafe-inline'`                     | XSS vulnerabilities remain exploitable; CSP provides no script protection    | Use nonce-based `script-src` with `'strict-dynamic'`; `'unsafe-inline'` is only acceptable for `style-src`          |
| Rate limiter uses email only (no IP)                      | Attacker rotates email addresses to bypass per-email rate limit              | Use IP (`x-forwarded-for`) as primary identifier; add email as secondary for auth-specific limits                   |
| Driver can see other drivers' routes via API manipulation | Data leak; drivers see delivery addresses for other routes                   | Enforce `driver_id = get_my_driver_id()` in ALL driver-facing RLS policies; test with two different driver accounts |
| Earnings data modifiable by driver via RLS                | Driver inflates their own earnings                                           | Earnings tables should have NO INSERT/UPDATE policies for the `driver` role; only admin/service role can write      |
| CSP report-uri sends violation data to third party        | Violation reports may contain page URLs with sensitive query params          | Use Sentry's CSP reporting endpoint (already trusted); don't use random third-party CSP report collectors           |

## UX Pitfalls

| Pitfall                                                           | User Impact                                                                            | Better Approach                                                                                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Role-based redirect ignores `?next=` parameter                    | User bookmarks `/admin/orders/123`, gets redirected to `/admin` instead                | Middleware should preserve the full URL path; redirect to login with `?next=/admin/orders/123`, then redirect back after auth    |
| CSP blocks third-party in Report-Only but nobody monitors reports | False security; violations accumulate; when CSP is enforced, everything breaks at once | Set up Sentry CSP violation reporting; create alert for new violation types; review weekly before switching to enforcing mode    |
| Rate limiting shows generic "Too many requests" error             | User doesn't know when they can retry; frustration; support tickets                    | Return `Retry-After` header with seconds until reset; show countdown in UI: "Try again in 45 seconds"                            |
| Driver sees empty dashboard after role migration                  | Old driver accounts may not have metadata set correctly; confusing empty state         | Add a "profile incomplete" banner for drivers missing vehicle type, phone, or profile image; link to profile setup               |
| Middleware redirect flickers on client navigation                 | User briefly sees login page before being redirected to dashboard                      | Use `loading.tsx` to show a branded loading state during auth check; middleware redirect should happen before any page rendering |

## "Looks Done But Isn't" Checklist

- [ ] **CSP Headers:** Policy is enforcing (not Report-Only). Tested on ALL routes: homepage, menu, checkout (Stripe), tracking (Maps), admin, driver, login
- [ ] **CSP Third-Party:** Google Maps renders tiles AND markers. Stripe Elements loads AND processes payment. Sentry receives error events. Supabase auth flow works end-to-end
- [ ] **RLS Audit:** Every table has RLS enabled (run `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity`). Every table with RLS has at least one SELECT policy
- [ ] **RLS Role Isolation:** Test as customer -- cannot see other customers' orders. Test as driver -- cannot see other drivers' routes. Test as anon -- cannot see any protected data
- [ ] **Rate Limiting:** Send 6 rapid requests to auth endpoint from same IP -- 6th should be blocked. Verify with Upstash dashboard that state is shared across serverless instances
- [ ] **Role-Based Redirect:** Login as admin -- lands on `/admin`. Login as driver (active) -- lands on `/driver`. Login as driver (pending onboard) -- lands on `/driver/onboard`. Login as customer -- lands on `/menu`
- [ ] **Onboarding Flow:** Send driver invite, click magic link, complete onboarding form, verify redirect to `/driver` dashboard. Repeat without completing form -- should NOT redirect to `/driver`
- [ ] **cssText Refactoring:** Search for `cssText` in src/ -- should be 0 occurrences after refactoring (currently 5). Search for `dangerouslySetInnerHTML` on `<style>` tags -- all should have `nonce` attribute
- [ ] **Middleware Excludes:** `/auth/callback`, `/api/*`, `/_next/*`, `/monitoring`, `/driver/onboard` are NOT processed by redirect logic

## Recovery Strategies

| Pitfall                                      | Recovery Cost | Recovery Steps                                                                                                                                                                                                 |
| -------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSP blocks critical functionality            | LOW           | Switch CSP header to `Content-Security-Policy-Report-Only` immediately. Add missing domains. Re-enable enforcing after testing. No data loss                                                                   |
| RLS policy locks out users                   | HIGH          | Emergency fix: run `DROP POLICY` + `CREATE POLICY` in Supabase SQL Editor as superuser. Or temporarily bypass via service role client in API routes. Then deploy proper migration                              |
| Rate limiter blocks legitimate users         | LOW           | Reduce rate limit thresholds or temporarily disable via environment variable. Upstash dashboard allows manual key deletion                                                                                     |
| Middleware redirect loop                     | LOW           | Remove middleware file entirely (app falls back to layout-level auth checks). Fix redirect logic. Re-add middleware                                                                                            |
| Driver can't complete onboarding             | MEDIUM        | Check auth callback handled invite correctly (`user_metadata.invite_id`). Verify driver_invites table has pending invite. If metadata is wrong, fix via Supabase Dashboard > Auth > Users > edit user metadata |
| Performance regression from CSP nonces       | MEDIUM        | Switch to non-nonce CSP (`'unsafe-inline'` for scripts and styles in headers config). Regain static rendering. Plan nonce approach for later with dedicated performance budget                                 |
| Upstash Redis outage blocks all API requests | LOW           | Rate limiter should fail open (allow request if Redis is unreachable). Upstash has built-in `analytics: { enabled: false }` to reduce overhead. Fallback: temporarily comment out rate limiting                |

## Pitfall-to-Phase Mapping

| Pitfall                                 | Prevention Phase                    | Verification                                                                                                                                                             |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CSP breaks animations                   | CSP Headers                         | GSAP scroll animation works. Framer Motion page transitions work. Fly-to-cart animates correctly. Google Maps custom markers visible                                     |
| CSP missing third-party domains         | CSP Headers                         | Full checkout flow with Stripe payment. Google Maps tracking page loads. Sentry receives test error. Login via Google OAuth works                                        |
| CSP nonces kill performance             | CSP Headers (architecture decision) | LCP on menu page stays <4s after CSP deployment. Check Vercel Analytics for TTFB regression                                                                              |
| RLS locks out users                     | RLS Audit                           | Run full RLS test suite. Query each table as anon/customer/driver/admin -- verify expected access. Zero empty-result regressions                                         |
| RLS user_metadata security              | RLS Audit                           | No RLS policy contains `user_metadata`. All role checks use `is_admin()` / `is_driver()` / `get_my_driver_id()`                                                          |
| Middleware redirect loop                | Role-Based Redirects                | Unauthenticated user hits `/admin` -- gets `/login?next=/admin`. After login, lands on `/admin`. No redirect loops in browser network tab                                |
| Rate limiter doesn't work in serverless | Rate Limiting Upgrade               | Send 6 rapid auth requests from different terminal sessions (simulating different serverless instances). Verify 6th is blocked. Check Upstash dashboard for shared state |
| Missing driver RLS                      | Driver Features                     | New driver tables have RLS enabled + policies. Driver A can't see Driver B's data. Test with two driver accounts                                                         |
| Onboarding flow broken by redirect      | Role-Based Redirects                | Invite new driver. Click magic link. Reach onboarding form (not redirected away). Complete form. Land on `/driver` dashboard                                             |

## Sources

### CSP Implementation (HIGH confidence)

- [Next.js CSP Guide (v16.1.6)](https://nextjs.org/docs/app/guides/content-security-policy) -- nonce implementation, dynamic rendering requirement, SRI alternative
- [MDN style-src Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src) -- critical distinction: DOM property assignment NOT blocked, cssText/setAttribute ARE blocked
- [Google Maps CSP Guide](https://developers.google.com/maps/documentation/javascript/content-security-policy) -- required domains for Maps JS API
- [Stripe CSP Requirements](https://docs.stripe.com/security/guide) -- script-src, connect-src, frame-src domains for Stripe Elements
- [Sentry CSP Reporting](https://docs.sentry.io/platforms/javascript/guides/nextjs/security-policy-reporting/) -- report-uri configuration
- [Framer Motion MotionConfig nonce](https://motion.dev/docs/react-motion-config) -- nonce prop for CSP compliance
- [Framer Motion CSP Issue #1727](https://github.com/framer/motion/issues/1727) -- inline styles incompatibility documented
- [GSAP SplitText CSP Thread](https://gsap.com/community/forums/topic/34053-splittext-inline-style-content-security-policy-violation/) -- GSAP has NO nonce support for style attributes

### Supabase RLS (HIGH confidence)

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy structure, USING vs WITH CHECK
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- index requirements, query plan verification
- [Supabase RLS Common Pitfalls](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/) -- user_metadata security warning
- [Supabase Complete RLS Guide 2026](https://designrevision.com/blog/supabase-row-level-security) -- user_metadata modification risk

### Rate Limiting (HIGH confidence)

- [Upstash Ratelimit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/features) -- ephemeral cache, module-scope instantiation
- [Vercel + Upstash Template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis) -- reference implementation
- [Upstash Rate Limiting Blog](https://upstash.com/blog/nextjs-ratelimiting) -- Next.js API route integration patterns

### Auth & Middleware (HIGH confidence)

- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) -- middleware setup, getClaims() vs getSession(), cookie management
- [Next.js Middleware Redirect Issues](https://github.com/vercel/next.js/issues/32739) -- common infinite redirect causes
- [Supabase OAuth + Next.js Middleware](https://usebasejump.com/blog/supabase-oauth-with-nextjs-middleware) -- token hash accessibility from middleware

### Project-Specific (HIGH confidence)

- `src/lib/utils/rate-limit.ts` -- in-memory Map at module scope, email-only identifier
- `src/app/auth/callback/route.ts` -- driver invite flow, user_metadata.role assignment
- `src/app/(driver)/driver/layout.tsx` -- is_active check, redirect to /?error=not_driver
- `src/app/(public)/driver/onboard/page.tsx` -- invite verification, onboarding lifecycle
- `src/app/(admin)/admin/layout.tsx` -- admin role check via profiles table
- `supabase/migrations/002_rls_policies.sql` -- existing RLS policy patterns
- `supabase/migrations/014-018_*.sql` -- driver invite RLS fix cascade (5 consecutive fixes)
- `src/components/ui/cart/FlyToCart.tsx` -- cssText usage (line 145)
- `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` -- cssText usage (lines 11/36/52/70)
- `src/components/ui/layout/AppHeader/AppHeader.tsx` -- dangerouslySetInnerHTML on <style> (line 170)
- `next.config.ts` -- Sentry tunnel route `/monitoring`, existing headers config

---

_Pitfalls research for: v1.8 Post-Launch Hardening & Driver Experience_
_Researched: 2026-02-16_
