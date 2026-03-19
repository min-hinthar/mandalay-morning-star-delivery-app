# Codebase Concerns

**Analysis Date:** 2026-03-18

---

## Rate Limiting

**Redis Disabled — All Limiters Are In-Memory No-Ops:**
- Issue: `src/lib/rate-limit/client.ts` exports every limiter as `null`. The `checkRateLimit()` in `src/lib/rate-limit/check.ts` falls back to a single in-memory `Map` capped at 15 req/min per identifier. This state is NOT shared across Vercel serverless function instances, so distributed abuse is not throttled at all.
- Files: `src/lib/rate-limit/client.ts`, `src/lib/rate-limit/check.ts`
- Impact: Checkout (`checkoutLimiter`), auth (`authSignInLimiter`, `authSignUpLimiter`), and refund (`refundLimiter`) endpoints have no effective distributed rate limiting. A bot can hit `/api/checkout/session` from many IPs simultaneously.
- Fix approach: Provision Upstash Redis REST (not `ioredis`/`@upstash/redis` — incompatible with Vercel serverless). Restore `Ratelimit` constructors in `client.ts`. The `RATE_LIMITS` config and `checkRateLimit()` wrapper are already wired up correctly.

**Health Endpoint Hardcoded as Redis-Healthy:**
- Issue: `src/app/api/health/route.ts` line 55: `const redisConfigured = true;` — always reports Redis healthy regardless of actual state.
- Files: `src/app/api/health/route.ts`
- Impact: Health checks cannot detect Redis misconfiguration.
- Fix approach: Return `false` when `getRedisClient()` returns `null` or when all limiters are null.

---

## Security

**CSP Uses `unsafe-inline` and `unsafe-eval`:**
- Issue: `next.config.ts` `script-src` directive (line 46) includes both `'unsafe-inline'` and `'unsafe-eval'`. These effectively disable XSS protection for scripts.
- Files: `next.config.ts`
- Impact: Any XSS vector can execute arbitrary JavaScript. The entire CSP header provides false confidence.
- Current mitigation: Google Maps JS API requires `unsafe-eval`. Nonces or hash-based CSP would require significant App Router effort.
- Fix approach: Evaluate replacing `@react-google-maps/api` with Leaflet (already in use) or the Maps Embed API to eliminate the `unsafe-eval` requirement. Explore nonce-based CSP via `next/headers`.

**`feedback-attachments` Storage Bucket — Unauthenticated Upload:**
- Issue: `supabase/migrations/20260314_customer_feedback.sql` policy `feedback_attachments_upload` has `WITH CHECK (bucket_id = 'feedback-attachments')` with no `auth.uid()` check. Anyone, including unauthenticated users, can upload files to this public bucket.
- Files: `supabase/migrations/20260314_customer_feedback.sql` (lines 95–98)
- Impact: Unrestricted storage writes. Potential for storage abuse, cost explosion, or malicious file uploads.
- Fix approach: Add `WITH CHECK (bucket_id = 'feedback-attachments' AND auth.uid() IS NOT NULL)`.

**`feedback-attachments` Storage — Fully Public Read:**
- Issue: `feedback_attachments_read` policy: `USING (bucket_id = 'feedback-attachments')` — no restriction. Any user can read all feedback attachments from any customer. The bucket is also `public: true`.
- Files: `supabase/migrations/20260314_customer_feedback.sql` (lines 100–103)
- Impact: Customer images (potentially personal photos) are publicly readable by anyone with the URL.
- Fix approach: Restrict to `auth.uid() IS NOT NULL AND (public.is_admin() OR ...)` or generate signed URLs for display rather than using a public bucket.

**`ManualEmailDialog` Uses `dangerouslySetInnerHTML` on Tiptap Output:**
- Issue: `src/components/ui/admin/orders/OrderDetailPage/ManualEmailDialog.tsx` line 208 renders `htmlBody + footerHtml` with `dangerouslySetInnerHTML`. `htmlBody` originates from a `tiptap` rich-text editor. Tiptap does not sanitize HTML output by default.
- Files: `src/components/ui/admin/orders/OrderDetailPage/ManualEmailDialog.tsx`
- Impact: Admin-only surface, but a compromised admin session could inject scripts into the preview panel.
- Fix approach: Sanitize with DOMPurify before rendering, or use an iframe sandbox for the preview.

**CSRF Origin Check Applied to Only 3 of ~80 Mutation Endpoints:**
- Issue: `checkOrigin()` is applied only to: `/api/checkout/session`, `/api/account/orders/[id]/cancel`, `/api/admin/orders/[id]/refund`. All other mutation endpoints (addresses, profile, menu CRUD, driver status, order status changes, route management) lack CSRF origin validation.
- Files: `src/lib/utils/origin-check.ts` — only called from 3 route files
- Impact: Auth is cookie-based (Supabase SSR), making CSRF attacks viable if the user is logged in and visits a malicious page.
- Fix approach: Apply `checkOrigin` to all POST/PATCH/PUT/DELETE routes, or add middleware-level CSRF token enforcement.

**Health Endpoint Leaks Environment Configuration to Unauthenticated Callers:**
- Issue: `GET /api/health` has `Access-Control-Allow-Origin: *` and returns which env vars are present/absent and whether services are configured.
- Files: `src/app/api/health/route.ts`
- Impact: External callers learn which payment, email, and auth providers are configured, aiding reconnaissance.
- Fix approach: Require `Authorization: Bearer <HEALTH_SECRET>` for the `env` and `services` sub-objects; return only top-level `status` and `timestamp` to unauthenticated callers.

**Google Maps API Key Exposed in Client HTML:**
- Issue: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is included in rendered HTML and used in a Static Maps URL embedded in `CustomerInfoCard.tsx` and in the `@react-google-maps/api` loader.
- Files: `src/components/ui/admin/orders/OrderDetailPage/CustomerInfoCard.tsx`, `src/components/ui/admin/routes/RouteMap/RouteMap.tsx`
- Impact: Without HTTP referrer restrictions configured in Google Cloud Console, the key can be abused.
- Fix approach: Verify referrer restrictions are set to the production domain in GCP. Consider proxying Static Maps requests through an API route.

---

## Admin Route Auth Inconsistency

**Two Competing Auth Patterns in Admin Routes:**
- Issue: Admin API routes use two different authorization patterns:
  1. `requireAdmin()` helper (from `src/lib/auth`) — centralized, clean.
  2. Manual `supabase.auth.getUser()` + `profiles.select("role")` inline — copy-paste pattern in 15+ routes.
- Files using inline pattern: `src/app/api/admin/analytics/delivery/route.ts`, `src/app/api/admin/analytics/drivers/route.ts`, `src/app/api/admin/analytics/drivers/[driverId]/route.ts`, `src/app/api/admin/drivers/[id]/archive/route.ts`, `src/app/api/admin/drivers/[id]/ratings/route.ts`, `src/app/api/admin/drivers/[id]/route.ts`, `src/app/api/admin/drivers/[id]/routes/route.ts`, `src/app/api/admin/feedback/route.ts`, `src/app/api/admin/feedback/[id]/route.ts`, `src/app/api/admin/routes/[id]/exceptions/[exceptionId]/route.ts`, `src/app/api/admin/routes/[id]/stops/reassign/route.ts`, `src/app/api/admin/routes/[id]/stops/route.ts`, `src/app/api/admin/routes/[id]/stops/[stopId]/route.ts`, `src/app/api/admin/settings/restore/route.ts`, `src/app/api/admin/settings/route.ts`
- Impact: All 15 routes currently check auth, but the inconsistency increases maintenance risk of a copy-paste error missing the role check.
- Fix approach: Migrate all admin routes to `requireAdmin()`.

**`delivery_zones` RLS Policy Does Not Use `public.is_admin()` Init-Plan Optimization:**
- Issue: `supabase/migrations/20260312_delivery_direction_zones.sql` policy `delivery_zones_admin_all` uses `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` instead of `public.is_admin()`. This re-evaluates per row.
- Files: `supabase/migrations/20260312_delivery_direction_zones.sql`
- Fix approach: Replace with `public.is_admin()`.

---

## Known Bugs (Documented in Code)

**`getRoleDashboard` Silently Swallows DB Errors:**
- Symptoms: When the DB throws during `getRoleDashboard()`, the function returns `{ path: "/", role: "unknown" }` instead of an error path.
- Files: `src/lib/auth/role-redirect.ts` (implementation), `src/lib/auth/__tests__/role-redirect.test.ts` (line 146 — documented as known-wrong behavior)
- Trigger: DB connection failure during admin layout render.
- Workaround: None — user silently lands on homepage.
- Fix approach: Return `{ path: "/login?error=role_lookup_failed", role: "unknown" }` on DB error and update the test assertion.

**Stripe Refund Is Audit-Trail-Only — No Money Returned:**
- Symptoms: Admin triggers a refund, the audit record is created and items marked refunded, but customers receive no Stripe refund.
- Files: `src/app/api/admin/orders/[id]/refund/route.ts` (comment at line 32 documents this explicitly)
- Trigger: Any admin-initiated item refund on a Stripe-paid order.
- Workaround: Manual refund via Stripe Dashboard.
- Fix approach: Integrate `stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id, amount: totalRefundCents })` using the PI already stored on the order. The DB-side RPC in `supabase/migrations/20260305_atomic_refund.sql` is complete — the Stripe API call is the missing piece.

---

## Performance

**Per-Stop Signed URL Generation (N+1 Supabase Storage Calls):**
- Problem: `getDeliveryPhotoSignedUrl()` is called inside `Promise.all(stops.map(...))`, generating one independent HTTP request to Supabase Storage per stop.
- Files: `src/lib/supabase/delivery-photos.ts` (implementation), `src/app/api/admin/routes/[id]/route.ts` (line 154), `src/app/api/driver/routes/active/route.ts` (line 191), `src/app/api/driver/routes/[routeId]/route.ts` (line 191), `src/app/(customer)/orders/[id]/tracking/fetchTrackingData.ts` (line 139)
- Cause: No batch signing API in use.
- Improvement path: Use `supabase.storage.from('delivery-photos').createSignedUrls([...paths], expiry)` for batch signing. Alternatively, generate signed URLs lazily on demand when a stop is expanded.

**Cron Digest Accumulates Rows in `app_settings` Indefinitely:**
- Problem: `src/app/api/cron/admin-daily-digest/route.ts` inserts a dedupe marker (key `cron_digest_sent_YYYY-MM-DD-period`) into `app_settings` after every successful send. No cleanup runs.
- Files: `src/app/api/cron/admin-daily-digest/route.ts` (lines 148+)
- Cause: Using `app_settings` as a KV store without TTL.
- Improvement path: Add a cleanup step in the cron or use `notification_logs` which is already designed for per-order deduplication. Alternatively, add a `category = 'cron'` cleanup job.

**`src/app/api/webhooks/stripe/handlers.ts` — 529 Lines, ESLint `max-lines` Disabled:**
- Problem: Four webhook handlers in one file. `/* eslint-disable max-lines */` suppresses the 400-line warning.
- Files: `src/app/api/webhooks/stripe/handlers.ts`
- Improvement path: Split into `handlers/checkout-completed.ts`, `handlers/payment-failed.ts`, `handlers/charge-refunded.ts`, re-exported from `handlers/index.ts`.

**`src/lib/services/route-optimization/optimizer.ts` — 485 Lines, Complex Algorithm:**
- Problem: Single-class implementation of Nearest Neighbor + 2-opt TSP optimization with deeply nested loops.
- Files: `src/lib/services/route-optimization/optimizer.ts`
- Improvement path: Extract `nearestNeighbor.ts`, `twoOpt.ts`, and scoring helpers as separate functions with isolated unit tests.

---

## Tech Debt

**33 `as unknown as` / `as any` Type Casts in API Routes:**
- Issue: PostgREST returns `Json` for JSONB columns, and tables not yet in the generated type (`customer_feedback`, `delivery_zones`, `delivery_days`) require `as any` casts throughout API routes.
- Files: `src/app/api/account/settings/route.ts`, `src/app/api/admin/delivery-zones/route.ts`, `src/app/api/admin/feedback/route.ts`, `src/app/api/admin/feedback/[id]/route.ts`, `src/app/api/feedback/route.ts`, `src/app/api/cron/admin-daily-digest/route.ts`, `src/app/api/cron/delivery-reminders/route.ts`
- Impact: Schema changes to these tables are not caught by `tsc`.
- Fix approach: Regenerate `src/types/database.ts` with `supabase gen types typescript` after all migrations. Add a `pnpm db:types` script and run after migrations.

**`src/types/database.ts` is 2,373 Lines and Manually Maintained:**
- Issue: The generated database type file is not auto-regenerated in CI. New tables (`customer_feedback`, `delivery_zones`, `delivery_days`, `driver_badges`, `webhook_audit_logs`) are absent, causing the `as any` proliferation.
- Files: `src/types/database.ts`
- Fix approach: Add `supabase gen types typescript --project-id <id> > src/types/database.ts` as `pnpm db:types` and run it as part of migration tooling.

**Migration Naming Inconsistency:**
- Issue: Migrations mix two naming conventions: sequential numbered (`001_` through `037_`) and date-prefixed (`20260214_` through `20260316_`). Lexicographic sort of filenames determines migration order in the Supabase CLI.
- Files: `supabase/migrations/` directory
- Impact: Ambiguous ordering if two conventions overlap numerically. Manual tracking is error-prone.
- Fix approach: Standardize new migrations on `YYYYMMDDHHMMSS_description.sql`. Document the convention in the repository.

**`checkServerActionRateLimit` Has No In-Memory Fallback:**
- Issue: `src/lib/rate-limit/check.ts` `checkServerActionRateLimit()` returns `{ limited: false }` when the limiter is null — bypassing the in-memory fallback used by `checkRateLimit()`.
- Files: `src/lib/rate-limit/check.ts` (lines ~146–166)
- Impact: Server Actions have zero rate limiting (not even the in-memory fallback) until Redis is provisioned.
- Fix approach: Apply the same in-memory fallback branch used in `checkRateLimit`.

**Cron Date Calculation Uses UTC Instead of Pacific Time:**
- Issue: `src/app/api/cron/delivery-reminders/route.ts` and `src/app/api/cron/admin-daily-digest/route.ts` use `new Date().toISOString().split("T")[0]` to get "today's date". This returns the UTC date, not LA time.
- Files: `src/app/api/cron/delivery-reminders/route.ts` (~line 70), `src/app/api/cron/admin-daily-digest/route.ts`
- Impact: After 4pm PT (midnight UTC), "today" resolves to tomorrow. Delivery reminders for the current day could be skipped or doubled.
- Fix approach: Use `new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())` for date strings in cron endpoints.

---

## Test Coverage Gaps

**No Coverage Thresholds Enforced:**
- Issue: `vitest.config.ts` has no `coverage` block with `thresholds`. Coverage can silently drop without failing CI.
- Files: `vitest.config.ts`
- Fix approach: Add `coverage: { provider: 'v8', thresholds: { branches: 70, functions: 75, lines: 75 } }`.

**API Routes — Only 6 of 112 Have Unit Tests:**
- What's not tested: 106 API routes have no `__tests__/` directory. Untested routes include all of: `admin/orders/[id]/status`, `admin/orders/[id]/approve-cod`, `admin/orders/[id]/cancel`, `admin/routes/route.ts`, `admin/drivers/invite/route.ts`, `cron/admin-daily-digest/route.ts`, `cron/delivery-reminders/route.ts`, `webhooks/resend/route.ts`.
- Files: `src/app/api/` (all routes without `__tests__/` sibling directories)
- Risk: Admin mutation and financial flow regressions would not be caught before deployment.
- Priority: High for checkout, refund, COD approval, and cron endpoints.

**E2E Tests Not in CI Pipeline:**
- Issue: `.github/workflows/ci.yml` does not run `pnpm test:e2e`. The 20 Playwright spec files run only locally.
- Files: `.github/workflows/ci.yml`, `e2e/*.spec.ts`
- Risk: Cart, checkout, COD approval, and driver flow regressions are only caught manually.
- Priority: High — especially the happy-path and checkout-flow specs.

**`role-redirect.ts` Has a Documented Failing Assertion in Tests:**
- What's not tested correctly: `src/lib/auth/__tests__/role-redirect.test.ts` line 146 comment: "BUG: currently returns `{ path: '/', role: 'unknown' }`" — the test assertion accepts wrong behavior instead of enforcing correct behavior.
- Files: `src/lib/auth/__tests__/role-redirect.test.ts`, `src/lib/auth/role-redirect.ts`
- Risk: DB error during auth silently redirects home with no error state.
- Priority: Medium.

---

## Fragile Areas

**PostgREST FK Hint Fragility — Schema Evolution Risk:**
- Files: Any Supabase query joining `drivers`, `profiles`, or `orders` tables with multiple FKs
- Why fragile: Adding a second FK to the same target table (as done for `declined_by` in `routes → drivers` in `supabase/migrations/20260316_route_status_backfill.sql`) breaks all existing unqualified `drivers (` joins with PGRST201. This is documented in CLAUDE.md but no automated guard exists.
- Safe modification: Always add `!fk_name` hints to all existing join queries when adding a new FK to a table that is already joined elsewhere. Run a `grep -rn "drivers (\|profiles (\|orders ("` audit before adding FKs.
- Test coverage: None — PGRST201 only surfaces at runtime.

**`StopDetail.tsx` — 406 Lines with Mixed Concerns:**
- Files: `src/components/ui/driver/StopDetail.tsx`
- Why fragile: Handles stop confirmation, photo upload, exception reporting, and notes in one component. State changes for one flow can affect others.
- Safe modification: Extract into `StopConfirmation.tsx`, `StopPhotoUpload.tsx`, `StopException.tsx` subcomponents with a shared `useStopActions` hook.
- Test coverage: None.

**`ItemDetailSheet.tsx` — 495 Lines (Exceeds 400-Line Limit):**
- Files: `src/components/ui/menu/ItemDetailSheet.tsx`
- Why fragile: Modifier group rendering, quantity management, add-to-cart logic, and price calculation all co-located. The `BUG-02` modifier constraint validation is embedded inline.
- Safe modification: Extract `ModifierGroupSection.tsx` and `useItemDetailForm.ts` hook.
- Test coverage: None.

---

## Accessibility Gaps

**Raw `<img>` Tags Without `next/image` (Non-Leaflet Usages):**
- Issue: 3 `<img>` elements in non-Leaflet contexts bypass Next.js image optimization:
  - `src/components/ui/account/FeedbackTab.tsx` — attachment preview
  - `src/components/ui/admin/photos/BulkUploadMatcher.tsx` — upload preview
  - `src/components/ui/feedback/FeedbackForm.tsx` — attachment preview
- Files: Listed above
- Impact: No lazy loading, no AVIF/WebP format conversion, no responsive srcset.
- Fix approach: Use `next/image` with `unoptimized` prop for blob/data URL previews, or `next/image` with a hosted URL where applicable.

**`loading="lazy"` on Static Map Image in Admin Panel:**
- Issue: `src/components/ui/admin/orders/OrderDetailPage/CustomerInfoCard.tsx` line 90 uses `loading="lazy"` on the Google Static Maps `<img>`. Per documented gotcha: `lazy` + animated containers (opacity 0) can prevent images from loading.
- Files: `src/components/ui/admin/orders/OrderDetailPage/CustomerInfoCard.tsx`
- Fix approach: Use `loading="eager"` since the map is immediately visible when the admin order detail panel opens.

---

## Dependencies at Risk

**`@react-google-maps/api` — SSR Crash Risk and CSP Blocker:**
- Risk: Crashes SSR without `ssr: false` dynamic import. Requires `unsafe-eval` in CSP. Package has limited maintenance activity.
- Impact: Any new file that imports this package without the dynamic import guard crashes production build.
- Migration plan: Replace admin route map with `react-leaflet` (already used in customer tracking). Use Maps Static API (server-side proxy) for the customer info address preview. Eliminates `unsafe-eval` requirement.

**`eslint-config-next: 15.5.9` Mismatches `next: 16.1.2`:**
- Risk: ESLint config may miss rules specific to Next.js 16 features.
- Files: `package.json`
- Migration plan: Update `eslint-config-next` to `^16.x` to match the Next.js version.

**Dual Animation Libraries (Framer Motion + GSAP) — Bundle Cost:**
- Risk: Both are runtime dependencies. Framer Motion v12 + GSAP 3 contribute ~80–120KB gzipped. 331 component files import one or both.
- Files: 331 files across `src/components/` and `src/app/`
- Migration plan: Audit GSAP-specific usages (ScrollTrigger, morphSVG, etc.). If GSAP is only used for timeline animations achievable in Framer Motion, drop it to reduce bundle size.

---

*Concerns audit: 2026-03-18*
