# Codebase Concerns

**Analysis Date:** 2026-03-06

## Tech Debt

**Duplicate Address API Routes:**
- Issue: Two parallel address API surfaces exist — `src/app/api/addresses/` and `src/app/api/account/addresses/` — with overlapping but different implementations (196 vs 162 lines). The `addresses/` version includes geocoding and coverage check; `account/addresses/` uses a different validation schema.
- Files: `src/app/api/addresses/route.ts`, `src/app/api/account/addresses/route.ts`, `src/app/api/addresses/[id]/route.ts`, `src/app/api/account/addresses/[id]/route.ts`
- Impact: Two codepaths to maintain, inconsistent validation. `useAddresses` hook uses `/api/addresses`, `AddressesTab` component uses `/api/account/addresses`. Bug fixes must be applied to both.
- Fix approach: Consolidate into one route group. The `/api/addresses` version is more complete (has geocoding, coverage). Migrate `AddressesTab` to use `useAddresses` hook, then delete `src/app/api/account/addresses/`.

**Database Types Out of Sync:**
- Issue: `src/types/database.ts` is a manually maintained file (987 lines) that does not reflect columns added in migrations 030+. Fields like `needs_contact`, `contacted_at`, `contacted_by`, and `audit_logs` table are missing from types.
- Files: `src/types/database.ts`, `src/app/api/admin/orders/[id]/contact/route.ts`
- Impact: Forces `as Record<string, unknown>` and `as unknown as Promise<...>` casts throughout API routes. 9+ instances of `as unknown as` in API layer. No compile-time safety for these columns.
- Fix approach: Run `supabase gen types typescript` to regenerate types from live schema. Set up a CI check or pre-commit hook to detect drift.

**16 Raw `<img>` Tags Bypassing `next/image`:**
- Issue: 16 `eslint-disable @next/next/no-img-element` suppressions. Only 10 of 16 have `referrerPolicy="no-referrer"`. Per ERROR_HISTORY, raw `<img>` in a PWA causes opaque response caching issues with the service worker.
- Files: `src/app/(admin)/admin/menu/MenuItemsTable.tsx`, `src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx`, `src/components/ui/admin/photos/BulkUploadMatcher.tsx`, `src/components/ui/admin/photos/PhotoUploadZone.tsx`, `src/components/ui/admin/routes/RouteBuilder/DriverSelector.tsx`, `src/components/ui/orders/tracking/DriverCard.tsx`, `src/components/ui/orders/tracking/DeliveredScreen.tsx`
- Impact: Missing `referrerPolicy` on 6 `<img>` tags can cause blank images on Google-hosted avatars/photos. All raw `<img>` tags risk stale opaque caching in the PWA service worker.
- Fix approach: Replace all raw `<img>` with `next/image` (proxies same-origin, avoids opaque responses). For unavoidable cases, always add `referrerPolicy="no-referrer"`.

**`supabase: any` in Status Email Helper:**
- Issue: `sendStatusEmail` function takes `supabase: any` parameter with eslint-disable.
- Files: `src/app/api/admin/orders/[id]/status/route.ts` (line 185-186)
- Impact: No type checking on all Supabase queries within this function. Could silently pass wrong column names.
- Fix approach: Type the parameter as `SupabaseClient<Database>` from `@supabase/supabase-js`.

**49 Migration Files with Mixed Naming Conventions:**
- Issue: Migrations use two naming schemes: numbered (`001_schema.sql` through `037_checkout_session_id.sql`) and timestamped (`20260214_add_orders_is_priority.sql` through `20260305_atomic_refund.sql`). No clear boundary or reason for the switch.
- Files: `supabase/migrations/`
- Impact: Ordering ambiguity. Numbered migrations sort lexically before timestamped ones, but timestamped ones may have been created between numbered ones chronologically.
- Fix approach: Adopt timestamped naming going forward. Document the transition point.

## Known Bugs

**Yelp Link Placeholder:**
- Symptoms: Footer contains a TODO comment for Yelp business page URL.
- Files: `src/components/ui/homepage/SiteFooter.tsx` (line 56)
- Trigger: User clicks Yelp link in footer.
- Workaround: None specified in code.

## Security Considerations

**No CSRF Protection on API Routes:**
- Risk: No CSRF token validation detected across all 101 API route handlers. State-mutating POST/PATCH/DELETE endpoints rely solely on Supabase session cookies for authentication.
- Files: All `src/app/api/**/route.ts` files
- Current mitigation: Supabase auth cookies use `SameSite=Lax` by default. Rate limiting on most endpoints.
- Recommendations: For same-origin API routes, `SameSite=Lax` is sufficient for GET-triggered CSRF. POST mutations are protected if cookies are `SameSite=Strict` or requests require a custom header. Verify cookie `SameSite` configuration. Consider adding `Origin` header validation for critical mutations (checkout, order cancel, refund).

**Debug Pages Accessible in Production:**
- Risk: Sentry test page at `/debug/sentry` is under the `(customer)` route group with no auth gate. Anyone can trigger Sentry test errors, polluting error tracking.
- Files: `src/app/(customer)/debug/sentry/page.tsx`
- Current mitigation: None.
- Recommendations: Gate behind `NODE_ENV === "development"` check or `requireAdmin()`, or remove entirely. The API route `/api/debug/sentry` (referenced but directory not found) may already be removed.

**Rate Limiting Gaps — 10 Unprotected Routes:**
- Risk: 10 API routes have no rate limiting: `src/app/api/account/addresses/route.ts`, `src/app/api/account/addresses/[id]/route.ts`, `src/app/api/account/orders/[id]/cancel/route.ts`, `src/app/api/addresses/[id]/default/route.ts`, `src/app/api/checkout/validate-promo/route.ts`, `src/app/api/cron/delivery-reminders/route.ts`, `src/app/api/emails/test/route.ts`, `src/app/api/health/route.ts`, `src/app/api/orders/[id]/share-token/route.ts`, `src/app/api/webhooks/resend/route.ts`
- Files: Listed above
- Current mitigation: Auth-gated routes still require valid session. Cron route has `CRON_SECRET` bearer token check. Health and public menu routes are read-only.
- Recommendations: Add rate limiting to all write endpoints (cancel, address mutations, promo validation). `emails/test` should be admin-only and rate-limited. Webhook routes should use the `webhook` rate limit tier.

**Non-Null Assertions on Environment Variables:**
- Risk: 5 instances of `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` with TypeScript non-null assertion. If env vars are missing, runtime crash with unhelpful error.
- Files: `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/server.ts`
- Current mitigation: `createServiceClient()` properly validates `SUPABASE_SERVICE_ROLE_KEY` with a thrown error message. The public/anon clients do not.
- Recommendations: Add validation with descriptive error messages for all env vars, or use a centralized env validation (e.g., `@t3-oss/env-nextjs` or a Zod schema at startup).

**10 Public API Routes Without Auth:**
- Risk: Routes at `src/app/api/analytics/vitals/route.ts`, `src/app/api/checkout/validate-promo/route.ts`, `src/app/api/coverage/check/route.ts`, `src/app/api/menu/route.ts`, `src/app/api/menu/search/route.ts`, `src/app/api/sections/route.ts` are intentionally public. However, `src/app/api/webhooks/resend/route.ts` and `src/app/api/webhooks/stripe/route.ts` use webhook signature verification instead of user auth.
- Files: Listed above
- Current mitigation: Webhook routes verify signatures. Menu/sections/coverage are read-only. Vitals is write-only telemetry.
- Recommendations: Ensure `validate-promo` cannot be abused for promo code enumeration. Add rate limiting to `coverage/check` (calls Google Maps API, has cost implications).

## Performance Bottlenecks

**No Sentry Client Config (Missing `sentry.client.config.ts`):**
- Problem: `sentry.server.config.ts` and `sentry.edge.config.ts` exist, but `sentry.client.config.ts` is missing. Client-side errors may not be captured in Sentry.
- Files: Root directory — `sentry.server.config.ts`, `sentry.edge.config.ts` present; `sentry.client.config.ts` absent
- Cause: Possibly deleted or never created. The `instrumentation.ts` file may handle server-side init only.
- Improvement path: Create `sentry.client.config.ts` with appropriate DSN, sample rates, and replay config. Verify client errors appear in Sentry dashboard.

**Console.log Statements in Production Code:**
- Problem: 25+ `console.log`/`console.error`/`console.warn` calls outside the logger utility, primarily in service worker, cache, and hook code.
- Files: `src/components/ui/menu/useMenuCache.ts`, `src/components/ui/offline/ServiceWorkerRegistration.tsx`, `src/lib/hooks/useServiceWorker.ts`, `src/lib/hooks/useUpdateBanner.ts`, `src/lib/services/cart-idb-storage.ts`, `src/lib/web-vitals.tsx`
- Cause: Client-side code where the Sentry-integrated logger may not be appropriate (service worker context) or was overlooked.
- Improvement path: For service worker code, keep console (no Sentry in SW). For other client code, route through logger or remove.

## Fragile Areas

**PostgREST FK Hint Requirements:**
- Files: Any query joining `orders` to `profiles` across all API routes
- Why fragile: The `orders` table has two FKs to `profiles` (`user_id` and `contacted_by`). Every query joining these tables MUST use `profiles!orders_user_id_fkey` hint. Missing hints cause silent failures or PostgREST ambiguous FK errors. This has already caused two production bugs (ERROR_HISTORY).
- Safe modification: Always include FK hint when joining orders to profiles. After adding any new FK to a table, grep all queries joining that table and add hints.
- Test coverage: No automated test validates FK hints. The `src/lib/__tests__/rls-edge-cases.test.ts` tests RLS policies but not FK hint correctness.

**Service Worker Cache Versioning:**
- Files: `src/app/sw.ts`
- Why fragile: Cache versioning, opaque response handling, and CacheFirst vs NetworkFirst strategy have caused 4 separate production issues (ERROR_HISTORY). Each fix required bumping `CACHE_VERSION`.
- Safe modification: Never use `CacheFirst` for cross-origin resources. Never cache opaque responses (`statuses: [200]` only). Bump `CACHE_VERSION` after any caching strategy change.
- Test coverage: No unit tests for service worker logic.

**Type Casts in Webhook/Cron Handlers:**
- Files: `src/app/api/webhooks/stripe/handlers.ts`, `src/app/api/cron/delivery-reminders/route.ts`
- Why fragile: These critical payment/notification paths use `as unknown as` casts for Supabase join results. If the DB schema changes, TypeScript won't catch mismatches.
- Safe modification: Regenerate database types to eliminate casts. Add runtime validation (Zod) on query results in critical paths.
- Test coverage: Stripe webhook has tests (`src/app/api/webhooks/stripe/__tests__/route.test.ts`). Cron endpoint has no tests.

## Scaling Limits

**In-Memory Rate Limiting Fallback:**
- Current capacity: Rate limiter uses Upstash Redis when `UPSTASH_REDIS_REST_URL` is configured; falls back to no enforcement when Redis is unavailable.
- Limit: Without Redis, rate limiting is effectively disabled. With Redis, standard Upstash free tier limits apply.
- Scaling path: Ensure Redis is always configured in production. Consider edge-level rate limiting (Vercel WAF) as a secondary layer.

## Test Coverage Gaps

**99 of 101 API Routes Untested:**
- What's not tested: Only 2 API route directories have `__tests__/` folders out of 101 total route files. Tested: `src/app/api/checkout/session/`, `src/app/api/tracking/`, `src/app/api/webhooks/stripe/`. All admin, account, driver, cron, menu, and address routes lack unit tests.
- Files: All `src/app/api/` subdirectories without `__tests__/`
- Risk: Regressions in auth guards, data validation, FK hints, and error handling go undetected. The FK hint bug that broke admin dashboard and cron endpoint would have been caught by tests.
- Priority: High — Focus on: checkout flow, webhook handlers, cron jobs, and admin order management routes first.

**Zero Component Tests:**
- What's not tested: Only 2 component test files exist (`src/components/ui/admin/ops/__tests__/helpers.test.ts`, `src/components/ui/admin/ops/__tests__/useCountdown.test.ts`). 70+ UI components in `src/components/ui/` have no tests.
- Files: `src/components/ui/`
- Risk: UI regressions (cart, checkout, menu, tracking) are only caught by E2E tests, which are slower and more brittle.
- Priority: Medium — E2E tests (20 spec files in `e2e/`) provide some coverage. Prioritize testing complex stateful components: `CartDrawerParts`, `ItemDetailSheet`, `CheckoutClient`, `DeliveryMap`.

**No Tests for Service Worker:**
- What's not tested: Service worker caching logic, cache versioning, offline behavior.
- Files: `src/app/sw.ts`
- Risk: Service worker bugs have caused 4 separate production incidents per ERROR_HISTORY. Each required manual investigation.
- Priority: High — The SW is a recurring source of production issues.

**No Tests for Cron Endpoint:**
- What's not tested: Delivery reminder logic, deduplication, email triggering, error handling.
- Files: `src/app/api/cron/delivery-reminders/route.ts`
- Risk: Cron runs unattended on schedule. A silent failure (like the FK hint bug) means customers get no delivery reminders with no alert.
- Priority: High — Critical customer-facing notification path.

**No Tests for Rate Limiting:**
- What's not tested: Rate limit enforcement, tier configuration, IP extraction, Redis fallback behavior.
- Files: `src/lib/rate-limit/`
- Risk: Rate limiting could silently fail (e.g., Redis connection issue) without detection.
- Priority: Medium — Rate limiting is defense-in-depth; auth is the primary security layer.

---

*Concerns audit: 2026-03-06*
