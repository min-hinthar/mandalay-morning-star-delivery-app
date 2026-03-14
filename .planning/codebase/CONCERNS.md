# Codebase Concerns

**Analysis Date:** 2026-03-14

## Tech Debt

**Deprecated Single-Day Delivery API Still Active:**
- Issue: Legacy Saturday-only delivery fields (`cutoffDay`, `cutoffHour`, `deliveryFeeCents`) remain in `BusinessRules` interface and are populated via backward-compat shim from first active multi-day config. ~10 component prop interfaces still accept deprecated `cutoffDay`/`cutoffHour` props.
- Files:
  - `src/lib/settings/business-rules.ts` (lines 10-15, 175-181 backward compat shim)
  - `src/lib/hooks/useDeliveryGate.ts` (lines 63-84 deprecated `computeDeliveryGate`, line 158 deprecated `useDeliveryGate`)
  - `src/components/ui/cart/CartDrawerParts.tsx` (lines 299-301 deprecated props)
  - `src/components/ui/delivery/DeliveryBanner.tsx` (lines 14-16 deprecated props)
  - `src/components/ui/menu/MenuContent.tsx` (lines 52-54 deprecated props)
  - `src/components/ui/homepage/Hero/types.ts` (lines 24-26 deprecated props)
  - `src/lib/utils/delivery-dates.ts` (line 111 `getNextSaturday` still exported)
- Impact: Confusing dual API. New code might use deprecated path and get wrong results for non-Saturday delivery days.
- Fix approach: Remove all deprecated props/functions. Ensure all consumers use `deliveryDays[]` array config. Delete `getNextSaturday`, `getCutoffForSaturday`, `computeDeliveryGate`, `useDeliveryGate` (non-multi-day versions).

**`as any` Type Casts for New Tables Not in Generated Types:**
- Issue: `customer_feedback` and `delivery_zones` tables are not in `src/types/database.ts` (Supabase-generated types). All queries use `.from("table_name" as any)` with manual `eslint-disable` comments. This bypasses all Supabase type checking.
- Files:
  - `src/lib/settings/business-rules.ts:125` (`delivery_zones as any`)
  - `src/app/(admin)/admin/feedback/page.tsx:104` (`customer_feedback as any`)
  - `src/app/api/admin/delivery-zones/route.ts:59,68,103` (3 casts)
  - `src/app/api/admin/feedback/route.ts:45`
  - `src/app/api/admin/feedback/[id]/route.ts:75`
  - `src/app/api/feedback/route.ts:112,159,249` (3 casts)
- Impact: No type safety on query shapes, column names, or return types. Errors only caught at runtime. 10 instances across 6 files.
- Fix approach: Regenerate `database.ts` via `supabase gen types typescript`. Once tables appear in types, remove all `as any` casts and eslint-disable comments.

**Dead `tailwind.config.ts` File (489 lines):**
- Issue: Tailwind v4 uses `@theme inline` in `globals.css` as sole source of truth. The 489-line `tailwind.config.ts` is dead code -- its content sections, theme extensions, and plugin configs have no effect.
- Files: `tailwind.config.ts` (root)
- Impact: Misleading for developers. Changes to this file have no effect. Wastes cognitive load.
- Fix approach: Reduce to minimal config or delete entirely. Keep only if Storybook or tooling requires it.

**Deprecated `setIsAnimating` in Cart Animation Store:**
- Issue: Legacy `setIsAnimating` method kept for backward compatibility alongside new `incrementFlying`/`decrementFlying` counter pattern. Both mutation paths exist.
- Files: `src/lib/stores/cart-animation-store.ts` (lines 26-27, 54-55)
- Impact: Low risk -- clearly marked deprecated. Risk of inconsistent state if both APIs used simultaneously.
- Fix approach: Grep for `setIsAnimating` usage. If none, remove the method.

**Deprecated `isSyncing` in Offline Sync Hook:**
- Issue: `isSyncing: boolean` kept alongside `syncState: SyncState` for backward compat.
- Files: `src/lib/hooks/useOfflineSync.ts` (line 36)
- Impact: Minimal -- clearly deprecated.
- Fix approach: Search for `isSyncing` consumers and migrate to `syncState`.

**Deprecated `uploadMenuPhoto` Storage Function:**
- Issue: Client-side upload function deprecated in favor of server-side WebP processing via `uploadMenuPhotoViaServer`.
- Files: `src/lib/supabase/storage.ts:158`
- Impact: Dead code. New code might use it instead of the server route.
- Fix approach: Remove the deprecated function after confirming no active callers.

**Deprecated `BottomSheet` Component:**
- Issue: `BottomSheet` export from `Drawer.tsx` is deprecated in favor of `Drawer` with `position="bottom"`.
- Files: `src/components/ui/Drawer.tsx:395`
- Impact: Dead code alias.
- Fix approach: Find callers, migrate to `Drawer position="bottom"`, remove export.

**Dual Map Library Dependencies:**
- Issue: Both `@react-google-maps/api` (Google Maps) and `react-leaflet`/`leaflet` are installed and used. Google Maps is used in 12 files (customer tracking, admin routes, homepage). Leaflet is used in 1 file only: `RouteBuilderMap`.
- Files:
  - `src/components/ui/admin/routes/RouteBuilderMap/RouteBuilderMap.tsx` (Leaflet)
  - 12 files using `@react-google-maps/api`
- Impact: Bundle bloat from shipping two map SDKs. Leaflet CSS imported directly. Inconsistent map UX across admin pages.
- Fix approach: Migrate `RouteBuilderMap` to Google Maps API. Remove `leaflet`, `react-leaflet`, `@types/leaflet` dependencies.

**DynamicThemeProvider Disabled Features:**
- Issue: `defaultDynamicEnabled` and `weatherApiUrl` props are marked `@deprecated` -- dynamic theming and weather API integration were disabled for performance.
- Files: `src/components/ui/theme/DynamicThemeProvider.tsx` (lines 155-158)
- Impact: Dead code paths. Adds complexity to the theme system.
- Fix approach: Remove deprecated props and related code. Strip weather-related logic.

## Known Bugs

**`getUTCDay()` Used Directly in Business Logic (Timezone Bug Risk):**
- Symptoms: Three files use `getUTCDay()` directly instead of the timezone-safe `getZonedDayOfWeek()`. This was already fixed once in `TimeStepV8.tsx` (see ERROR_HISTORY). The remaining usage in `availability.ts` and `earnings/compute.ts` works safely because inputs are ISO date strings parsed at noon UTC, not live `Date` objects. However, this is fragile -- any refactor passing a real Date would reintroduce the bug.
- Files:
  - `src/lib/availability.ts:67` -- safe (uses `"T12:00:00Z"` anchor)
  - `src/lib/earnings/compute.ts:96` -- safe (uses `"T12:00:00Z"` anchor)
  - `src/lib/utils/delivery-dates.ts:108,114,210` -- safe (internal to zoned utility)
- Trigger: Pass a raw `new Date()` instead of an ISO date string to these functions.
- Workaround: Current code is safe due to noon UTC anchoring. Add JSDoc comments clarifying this constraint.

**`getUTCHours()` in Cron Daily Digest (DST Edge Case):**
- Symptoms: `detectPeriod()` uses `new Date().getUTCHours()` to classify morning vs evening. The comment says "14:00 UTC = 6 AM PT" -- but this is only true during PST. During PDT (Mar-Nov), 14:00 UTC = 7 AM PT. The morning/evening classification shifts by 1 hour during DST transitions.
- Files: `src/app/api/cron/admin-daily-digest/route.ts:84-86`
- Trigger: DST transition weeks, the digest may be classified as wrong period.
- Workaround: Impact is cosmetic (wrong label on digest email). Fix with `date-fns-tz` or the existing `getZonedParts` utility.

**Cron Dedupe Keys Never Cleaned Up:**
- Symptoms: Each daily digest run inserts a `cron_digest_sent_admin-digest-YYYY-MM-DD-{period}` row into `app_settings`. These rows accumulate indefinitely (2 per day = ~730 per year).
- Files: `src/app/api/cron/admin-daily-digest/route.ts:122,258`
- Trigger: Time -- table grows linearly.
- Workaround: Manual cleanup query or add TTL/cleanup job.

## Security Considerations

**Admin Feedback Routes Missing Rate Limiting:**
- Risk: Admin feedback endpoints (`GET /api/admin/feedback`, `PATCH /api/admin/feedback/[id]`) have auth checks but no `checkRateLimit()` calls. An authenticated admin (or compromised admin token) can make unlimited requests.
- Files:
  - `src/app/api/admin/feedback/route.ts` (no rate limit import)
  - `src/app/api/admin/feedback/[id]/route.ts` (no rate limit import)
- Current mitigation: Admin auth check required. In-memory fallback rate limiting only applies to routes that call `checkRateLimit()`.
- Recommendations: Add `checkRateLimit({ limiter: adminLimiter, ... })` to both routes. Follow the pattern from `src/app/api/admin/settings/route.ts`.

**Admin Feedback Routes Not Using `requireAdmin()` Helper:**
- Risk: These routes implement manual auth checking (duplicate `supabase.auth.getUser()` + profile role query) instead of using the centralized `requireAdmin()` helper from `src/lib/auth/admin.ts`. Manual implementations may diverge from security fixes applied to the helper.
- Files:
  - `src/app/api/admin/feedback/route.ts:14-35`
  - `src/app/api/admin/feedback/[id]/route.ts:31-52`
- Current mitigation: The manual implementation is functionally equivalent.
- Recommendations: Replace with `requireAdmin()` for consistency and single-point-of-fix.

**Redis Rate Limiting Fully Disabled:**
- Risk: All 13 rate limiters in `src/lib/rate-limit/client.ts` are `null`. The in-memory fallback (`src/lib/rate-limit/check.ts`) uses a single `Map` per serverless instance -- shared across all routes, reset on cold starts, not distributed across instances. Under multi-instance deployment, each instance has independent counters. A determined attacker could spread requests across instances to bypass limits.
- Files:
  - `src/lib/rate-limit/client.ts` (all limiters null)
  - `src/lib/rate-limit/check.ts:14-39` (in-memory fallback)
- Current mitigation: Conservative 15 req/min fallback per identifier per instance. Vercel's edge rate limiting may provide some protection.
- Recommendations: Provision an Upstash REST Redis instance, or replace `@upstash/redis` with `ioredis` + custom sliding window limiter compatible with standard Redis.

**CSRF Origin Check Only on 3 Mutation Endpoints:**
- Risk: `checkOrigin()` is only called in checkout session, customer cancel, and admin refund routes. Other mutation endpoints (address CRUD, settings updates, order status changes, driver updates) lack CSRF protection.
- Files with protection:
  - `src/app/api/checkout/session/route.ts`
  - `src/app/api/account/orders/[id]/cancel/route.ts`
  - `src/app/api/admin/orders/[id]/refund/route.ts`
- Files without:
  - All other mutation routes in `src/app/api/` (50+ routes)
- Current mitigation: Supabase auth tokens provide user-scoped access. Same-site cookie policy provides some browser-level CSRF protection.
- Recommendations: Either add `checkOrigin()` to all state-changing routes or implement CSRF protection via middleware for all non-GET API routes.

**50 API Routes Without Input Validation (Zod):**
- Risk: Of 106 API route files, 50 do not use Zod schema validation on request bodies or query params. Some accept `request.json()` without any validation (6 mutation routes confirmed).
- Files (mutation routes without validation):
  - `src/app/api/admin/photos/route.ts`
  - `src/app/api/driver/availability/route.ts`
  - `src/app/api/orders/[id]/notes/route.ts`
  - `src/app/api/orders/[id]/verify-payment/route.ts`
  - `src/app/api/emails/test/route.ts`
  - `src/app/api/analytics/vitals/route.ts`
- Current mitigation: Some routes only accept specific fields via destructuring. Admin routes are auth-gated.
- Recommendations: Add Zod schemas to all routes accepting JSON bodies. Priority: customer-facing mutation routes.

**Sentry Debug Page Accessible in Production (Conditional):**
- Risk: `src/app/(customer)/debug/sentry/page.tsx` calls `notFound()` when `NODE_ENV !== "development"`, which is correct. But the page component still ships in the production bundle. The `notFound()` is a client-side check -- the route and React component are bundled and deployed.
- Files: `src/app/(customer)/debug/sentry/page.tsx`
- Current mitigation: `notFound()` call blocks rendering.
- Recommendations: Move to a route that isn't included in production builds, or add server-side redirect in a `page.tsx` wrapper.

## Performance Bottlenecks

**In-Memory Rate Limit Map Never Bounded:**
- Problem: `inMemoryBuckets` Map grows unbounded between 5-minute cleanup intervals. High-traffic routes accumulate entries for every unique identifier.
- Files: `src/lib/rate-limit/check.ts:14-38`
- Cause: Cleanup runs every 5 minutes by timestamp but does not cap total entries. Under sustained traffic with diverse IPs, map could grow large.
- Improvement path: Add a max-size check (e.g., evict oldest if >10k entries) or use LRU cache.

**`toLocaleDateString()` / `toLocaleString()` in Server-Side Code:**
- Problem: `toLocaleDateString("en-US", { timeZone: ... })` is used in cron routes and server-side code without explicit timezone, relying on server locale which may differ between environments.
- Files:
  - `src/app/api/cron/admin-daily-digest/route.ts:60,74` (no timezone specified)
  - `src/app/api/driver/earnings/route.ts:16` (timezone parsing via `toLocaleString`)
- Cause: Locale-dependent date formatting on server. Different Node.js environments may have different ICU data.
- Improvement path: Use `date-fns` or explicit Intl formatters with timezone pinned to `America/Los_Angeles`.

**WebGL Gradient Module Loaded Unconditionally:**
- Problem: `src/lib/webgl/gradients.ts` exports a gradient animation system with time-of-day awareness. If imported in a server component path, it bloats the bundle.
- Files: `src/lib/webgl/gradients.ts`
- Cause: The module imports `getAnimationPreference` from hooks at module level.
- Improvement path: Ensure this module is only dynamically imported in client components that need it.

## Fragile Areas

**Stripe Webhook Handler (529 lines, max-lines disabled):**
- Files: `src/app/api/webhooks/stripe/handlers.ts`
- Why fragile: At 529 lines with an eslint-disable for max-lines, this is the largest non-type source file. Handles `checkout.session.completed`, `checkout.session.expired`, payment failures, and refunds. Multiple email sends with try/catch blocks. Complex order state transitions with audit logging.
- Safe modification: Each handler function is relatively self-contained. Add new webhook event types as new functions. Always preserve the `return 500 on DB error` pattern (returning 200 on error prevents Stripe retries -- documented in ERROR_HISTORY).
- Test coverage: Tests exist at `src/app/api/webhooks/stripe/__tests__/route.test.ts` (609 lines). Coverage is moderate.

**Delivery Date Calculation System:**
- Files:
  - `src/lib/utils/delivery-dates.ts` (core logic)
  - `src/lib/hooks/useDeliveryGate.ts` (both deprecated + multi-day versions)
  - `src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx`
  - `src/lib/utils/delivery-zones.ts` (direction routing)
- Why fragile: Multi-day delivery with direction-based routing, per-day cutoffs, and timezone-aware date math. Previous bugs include off-by-one-week errors (ERROR_HISTORY), `getUTCDay()` vs zoned day mismatches. The deprecated single-day path coexists with the multi-day path.
- Safe modification: Always use `getZonedDayOfWeek()` and `getZonedParts()` for date math. Never use raw `getUTCDay()`. Test with the current day matching an active delivery day + past cutoff.
- Test coverage: 3 test files covering dates, multi-day, and schedule formatting (494, 450, and more lines).

**Google Maps Integration Across 12 Files:**
- Files: 12 files across `src/components/ui/` using `@react-google-maps/api`
- Why fragile: `useJsApiLoader` must complete before any `google.maps.*` access. Hooks run before early returns, so useMemo/useCallback referencing `google.maps.*` crash if not guarded. Documented crash in ERROR_HISTORY (`RouteMap` useMemo crash, `DeliveryMapCard` race conditions).
- Safe modification: Always add `if (!isLoaded) return null` inside hooks that reference `google.maps.*`. Always use `dynamic(..., { ssr: false })` for components importing `@react-google-maps/api`. Always use callback refs (not `useRef`) for elements that change across conditional renders.
- Test coverage: No unit tests for map components. E2E coverage only.

**OAuth Email Resolution Chain:**
- Files:
  - `src/app/auth/callback/route.ts`
  - `src/lib/auth/role-redirect.ts` (`ensureProfile`)
  - `src/lib/auth/resolve-oauth-email.ts`
  - DB trigger `handle_new_user()`
- Why fragile: Google OAuth email appears in 3+ locations (`user.email`, `user_metadata.email`, `identities[0].identity_data.email`). Four separate layers attempt to sync email to profiles table. Two bugs in this chain are documented in ERROR_HISTORY.
- Safe modification: Always use `resolveOAuthEmail()` helper. Never rely on a single email source. Any changes to profile creation must test Google OAuth flow end-to-end.
- Test coverage: No unit tests for OAuth callback. Manual E2E testing only.

## Scaling Limits

**In-Memory Rate Limiting (Serverless):**
- Current capacity: 15 req/min per identifier per serverless instance.
- Limit: Each Vercel function instance has its own Map. Auto-scaling creates new instances with empty maps. Coordinated attacks across instances bypass limits.
- Scaling path: Provision Upstash REST Redis or swap to `ioredis` with standard Redis.

**Admin Menu API Pagination Default (25 items):**
- Current capacity: Works for current menu (~53 items with explicit `?limit=500`).
- Limit: If menu grows beyond 500 items, bulk operations will silently miss items. The default `limit=25` has already caused bugs (ERROR_HISTORY).
- Scaling path: Implement cursor-based pagination or auto-paginate in client helpers that need full lists.

**Cron Dedupe via `app_settings` Table:**
- Current capacity: ~730 rows/year (2 digest entries per day).
- Limit: No cleanup mechanism. Table grows indefinitely. Not a hard scaling limit but unnecessary bloat.
- Scaling path: Add cleanup cron or use TTL-based dedupe (e.g., check `placed_at > now() - interval '12 hours'` instead of insert/check pattern).

## Dependencies at Risk

**`@upstash/redis` + `@upstash/ratelimit` (Unused but Installed):**
- Risk: These packages are in `package.json` but completely disabled. They add to install time and dependency surface. The `@upstash/redis` package requires Upstash REST API -- standard Redis URLs are incompatible.
- Impact: Bundle includes type imports only. No runtime impact since all limiters are `null`.
- Migration plan: Either provision Upstash REST Redis, or remove both packages and use `ioredis` + custom sliding window implementation.

**`gsap` (License Concerns):**
- Risk: GSAP has a custom license (not MIT/Apache). The standard npm package is free for general use but has restrictions on certain business uses. Used in 7 files for scroll animations and fly-to-cart.
- Impact: License compliance depends on use case.
- Migration plan: Evaluate if Framer Motion (already a dependency) can replace GSAP usage. GSAP is used for `ScrollTrigger`, `Flip`, and custom timelines.

**`eslint-config-next@15.5.9` with Next.js 16:**
- Risk: ESLint config is pinned to Next.js 15.x while the app runs Next.js 16. Potential rule mismatches or missing new rules.
- Impact: Linting may miss Next.js 16-specific patterns.
- Migration plan: Update to `eslint-config-next@16.x` when available.

## Missing Critical Features

**No Automated Cleanup for Cron Dedupe Rows:**
- Problem: `app_settings` table accumulates `cron_digest_sent_*` rows with no expiry.
- Blocks: Nothing critical -- just data hygiene.

**No E2E Tests for Payment Flows:**
- Problem: Stripe checkout, COD approval, verify-payment, and refund flows have unit tests but no E2E coverage. These are the most critical user paths and have had the most bugs (5 entries in ERROR_HISTORY).
- Blocks: Confidence in deploying payment-related changes.

**No Integration Tests for OAuth Flow:**
- Problem: Google OAuth email resolution chain has had 2 critical bugs. No automated tests cover the callback -> profile creation -> email sync pipeline.
- Blocks: Safe iteration on auth flow changes.

## Test Coverage Gaps

**API Routes (106 routes, 5 test files):**
- What's not tested: Of 106 API route files, only 5 have co-located `__tests__` directories. Coverage is concentrated on checkout, webhooks, tracking, and addresses. Zero test coverage for: admin settings, admin feedback, admin drivers, admin emails, admin orders, admin routes, admin analytics, driver routes, cron jobs, coverage check, menu search.
- Files: All routes under `src/app/api/admin/`, `src/app/api/driver/`, `src/app/api/cron/`
- Risk: Admin and driver APIs have had multiple bugs (FK hints, audit log columns, pagination defaults -- all in ERROR_HISTORY). Changes to these routes are deployed with no automated verification.
- Priority: High -- admin order management and driver routes handle money and deliveries.

**UI Components (70+ components, 0 unit test files):**
- What's not tested: No React component unit tests. Components are only tested via E2E (Playwright). Storybook exists but no visual regression testing is integrated.
- Files: All files under `src/components/ui/`
- Risk: Component behavior changes (conditional rendering, event handlers, animation states) are only caught by manual testing or E2E.
- Priority: Medium -- E2E provides some coverage, and React Compiler reduces memoization bugs.

**Driver Offline Sync Pipeline:**
- What's not tested: The `useOfflineSync` hook, `offline-store` service, and retry logic have no integration tests. These handle offline status updates, photo uploads, and location tracking for drivers in the field.
- Files:
  - `src/lib/hooks/useOfflineSync.ts`
  - `src/lib/services/offline-store/` (multiple files)
  - `src/lib/services/offline-store/retry.ts`
- Risk: Offline sync failures could lose delivery status updates or photos. Drivers operate in areas with poor connectivity.
- Priority: High -- data loss risk for core delivery operations.

**Email Send Pipeline:**
- What's not tested: `src/lib/email/send.ts` (the central email dispatch function) has no dedicated tests. Email delivery failures have caused 4+ bugs documented in ERROR_HISTORY.
- Files:
  - `src/lib/email/send.ts`
  - `src/lib/email/build.ts`
  - `src/lib/email/admin-recipients.ts`
- Risk: Email failures are silent (logged but no user feedback). Idempotency key logic and notification_logs interaction are untested.
- Priority: Medium -- emails are important but not data-critical.

---

*Concerns audit: 2026-03-14*
