# Codebase Concerns

**Analysis Date:** 2026-04-04

## Tech Debt

**`customer_feedback` table missing from generated database types:**
- Issue: Migration `supabase/migrations/20260314_customer_feedback.sql` was never followed by a `supabase gen types` run. The `customer_feedback` table does not appear in `src/types/database.ts`, forcing every query to use `as any` casts.
- Files: `src/app/(admin)/admin/feedback/page.tsx:110`, `src/app/api/admin/feedback/route.ts:45`, `src/app/api/admin/feedback/[id]/route.ts:75`, `src/app/api/feedback/route.ts:112,159,249`
- Impact: No compile-time safety on feedback table queries. Column renames or type changes fail silently at runtime.
- Fix approach: Run `pnpm supabase gen types typescript --local > src/types/database.ts`, then remove all `as any` casts on `customer_feedback`.

**`arriving_soon` email type declared but never implemented:**
- Issue: `arriving_soon` is a member of `CustomerEmailType` in `src/lib/email/types.ts:14` and is present in the DB notification enum, but has no template in `src/emails/`, no case in `src/lib/email/build.ts`, and no trigger anywhere in API routes. The switch in `build.ts` would throw `Error: Unknown email type: arriving_soon` if ever called.
- Files: `src/lib/email/types.ts`, `src/lib/email/build.ts`
- Impact: If any code path reaches `buildEmailElement("arriving_soon", ...)` the function throws; currently safe only because no caller does so.
- Fix approach: Either add an `ArrivingSoon` template and a trigger in the driver stop-update route, or remove the type from the enum and DB if the feature is not planned.

**`buildEmailElement` uses `any` for order data:**
- Issue: `src/lib/email/build.ts:17` declares `orderData: any`. All callers pass untyped objects; missing fields are silently undefined.
- Files: `src/lib/email/build.ts`, `src/app/api/admin/emails/send/route.ts:199`, `src/app/api/admin/emails/[id]/resend/route.ts:178`, `src/app/api/admin/orders/[id]/status/route.ts:328`
- Impact: Refactoring email templates risks silent property mismatches that only appear in sent email content.
- Fix approach: Create a discriminated union `EmailPayload` per type, replace `any` with that union, and add a type assertion at each call site.

**`mapApiResponse` in settings accepts `any`:**
- Issue: `src/components/ui/admin/settings/SettingsClient/settings-defaults.ts:55` takes `data: any` and manually maps fields. No compile-time check that the API response matches `AllSettings`.
- Files: `src/components/ui/admin/settings/SettingsClient/settings-defaults.ts`, `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx:87`
- Impact: API response schema changes break settings silently.
- Fix approach: Type the API response via Zod or a typed interface and remove the `any` param.

**`revalidatePath("/api/menu")` does not work for Route Handler cache:**
- Issue: Next.js `revalidatePath` does not clear the cache of Route Handlers configured with `export const revalidate = 300` (segment config). Only `revalidateTag` with a matching tag clears that cache. The `GET /api/menu` route has `revalidate = 300` but no tag; admin menu edits call `revalidatePath("/api/menu")` which is a no-op.
- Files: `src/app/api/admin/menu/[id]/route.ts:124,176`, `src/app/api/menu/route.ts:7`
- Impact: After an admin edits a menu item, the public `/api/menu` endpoint may serve stale data for up to 5 minutes even if the admin expects immediate propagation.
- Fix approach: Add `export const tags = ["menu"]` or use `unstable_cache` with a `"menu"` tag in the menu route handler, and replace `revalidatePath("/api/menu")` calls with `revalidateTag("menu")`.

**`getRoleDashboard` catch block redirects to `/` not `/login?error=role_lookup_failed`:**
- Issue: A known bug is documented in `src/lib/auth/__tests__/role-redirect.test.ts:146-158` — the test asserts that a DB error should redirect to `/login?error=role_lookup_failed`, but the implementation now returns that path (per the current code). However, the test comment still says "BUG: currently returns `{ path: '/', role: 'unknown' }`", which is stale. The test is passing against the fixed code but the comment creates confusion about current state.
- Files: `src/lib/auth/__tests__/role-redirect.test.ts:146`, `src/lib/auth/role-redirect.ts:161-168`
- Impact: Low — the fix is in place, but the stale BUG comment misleads future readers into thinking the bug is still open.
- Fix approach: Update the test comment to reflect the current (fixed) behavior.

**`payment_method` field is cast rather than typed from DB:**
- Issue: Multiple files cast `order.payment_method` with `as "stripe" | "cod"` rather than having it typed from `database.ts`. Signals the DB type for this column is `string` (or untyped).
- Files: `src/app/(admin)/admin/orders/page.tsx:96`, `src/app/api/admin/orders/[id]/details/route.ts:332`, `src/app/(customer)/orders/[id]/confirmation/page.tsx:162`, `src/app/(customer)/orders/[id]/page.tsx:207`
- Impact: Adding a new payment method requires finding all cast sites manually.
- Fix approach: Ensure `payment_method` is typed as an enum in `database.ts` and propagate the type, removing all casts.

## Known Bugs

**Role redirect on DB error sends to "unknown" with `role_lookup_failed` query param, but callers may not handle that param:**
- Symptoms: Auth callback and confirm routes call `getRoleDashboard`, which on DB error returns `{ path: "/login?error=role_lookup_failed", role: "unknown" }`. The login page must read and display this error param, else users see a blank login with no explanation.
- Files: `src/lib/auth/role-redirect.ts:167`, `src/app/auth/callback/route.ts:164`, `src/app/auth/confirm/route.ts:114`, `src/app/(auth)/login/LoginPageClient.tsx`
- Trigger: Supabase DB timeout or connection error during auth flow.
- Workaround: The error is logged to Sentry; user can retry.

**`auth.admin.listUsers()` loads all users to find one by email (in resend-invite):**
- Symptoms: `src/app/api/admin/drivers/[id]/resend-invite/route.ts:92` fetches all auth users then does an in-memory `find` by email. This is a known anti-pattern documented in `supabase-auth.md`.
- Files: `src/app/api/admin/drivers/[id]/resend-invite/route.ts:92-94`
- Trigger: Any admin resending a driver invite. Gets worse as user count grows.
- Workaround: None currently; the lookup succeeds but is O(n) in auth users.

## Security Considerations

**Service client used in non-admin server components:**
- Risk: `createServiceClient()` (bypasses RLS, uses `SUPABASE_SERVICE_ROLE_KEY`) is called in customer-facing server components and public pages. If business logic in those paths has a flaw, RLS is not a safety net.
- Files: `src/app/(customer)/orders/[id]/page.tsx:143`, `src/app/(public)/orders/[id]/share/page.tsx:67`, `src/app/api/addresses/route.ts:121`, `src/app/api/checkout/session/route.ts:194,396`
- Current mitigation: Auth checks (`requireAdmin`, `requireAuth`) are performed before service client queries; the service client is used only for specific sub-queries (joins that timeout with user client). Documented in code comments.
- Recommendations: Audit each usage to confirm the service client is scoped to the minimum required columns. Consider adding a `createLimitedServiceClient()` wrapper that enforces column-level allowlists for non-admin usage.

**Rate limiting falls back to in-memory (non-distributed) when Redis is unconfigured:**
- Risk: In-memory buckets in `src/lib/rate-limit/check.ts` are per-serverless-instance. On Vercel, multiple instances run concurrently — the 15 req/min limit is per instance, not global. A distributed attacker can exceed rate limits by hitting different instances.
- Files: `src/lib/rate-limit/check.ts:14-39`, `src/lib/rate-limit/client.ts:18-24`
- Current mitigation: Upstash Redis env vars configured in production (per MEMORY.md). Fallback is only active if those vars are missing.
- Recommendations: Add a health check alert if `UPSTASH_REDIS_REST_URL` is absent in production; treat missing Redis as a deployment error, not a silent fallback.

**`authSignUpLimiter`, `globalLimiter`, and `adminBulkLimiter` are created but never wired to any route:**
- Risk: Three rate limiters exist in `src/lib/rate-limit/client.ts:48,55,58` with comments noting they are "Unwired" or "Reserved." Any route that was intended to use them is currently unprotected.
- Files: `src/lib/rate-limit/client.ts:48,55,58`
- Current mitigation: `authSignUpLimiter` is moot (OTP flow, no discrete signup endpoint). `globalLimiter` is a placeholder.
- Recommendations: Remove or wire up. Dead exports create confusion about what is protected.

## Performance Bottlenecks

**`auth.admin.listUsers()` to find one user by email:**
- Problem: O(n) auth user scan in resend-invite path.
- Files: `src/app/api/admin/drivers/[id]/resend-invite/route.ts:92`
- Cause: Supabase admin API does not expose `getUserByEmail` directly; the workaround is `listUsers()`.
- Improvement path: Use `supabase.auth.admin.listUsers({ filter: 'email=eq.' + email })` if supported by the Supabase version, or query the `profiles` table by email and use `getUserById()` as documented in `supabase-auth.md`.

**`/api/menu` route handler has `revalidate = 300` but no cache tag — cannot be selectively invalidated:**
- Problem: Menu updates by admin are not reflected until the 5-minute TTL expires. No early invalidation path exists.
- Files: `src/app/api/menu/route.ts:7`, `src/app/api/admin/menu/[id]/route.ts:124,176`
- Cause: `revalidatePath` does not clear segment-config caches; no `revalidateTag` wired.
- Improvement path: Switch to `unstable_cache` with tag `"menu"` in the route handler; call `revalidateTag("menu")` on admin mutations.

## Fragile Areas

**`src/lib/email/build.ts` — switch must be updated for every new email type:**
- Files: `src/lib/email/build.ts`
- Why fragile: `EmailType` union grows in `types.ts`, but `build.ts` switch is separate. A new type added to the union with no case in the switch throws at runtime (documented in `email-system.md` learning: "missing status case silently skips send").
- Safe modification: After adding a new `EmailType`, immediately add a case to the `build.ts` switch and a corresponding template in `src/emails/`. TypeScript's `default: throw` pattern already guards against this if the switch is exhaustive, but `arriving_soon` is evidence this is not always done.
- Test coverage: No unit test exercises `buildEmailElement` for all EmailType members.

**`src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx` — settings sync is a 5-file thread:**
- Files: `src/app/(admin)/admin/layout.tsx`, `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx`, `src/lib/stores/` (settings store)
- Why fragile: Documented in `state-management.md`: "settings sync pipeline requires full 5-file thread." Adding a new setting requires changes across layout, shell, sync component, store, and defaults — any broken link silently leaves the setting at its default value.
- Safe modification: Follow the full 5-file thread checklist when adding settings. Do not shortcut by only updating the store.

**Driver route FK hint requirement — any new FK to `drivers` breaks all existing joins:**
- Files: `supabase/migrations/20260316_route_rpc_status_update.sql` and related, all routes querying `drivers` via `routes`
- Why fragile: Documented in `data-schema.md`: "PostgREST FK hints: 2nd FK breaks ALL existing unqualified `drivers (` joins with PGRST201." Adding any new FK from `routes` → `drivers` requires updating every PostgREST query that joins drivers without an explicit `!fk_name` hint.
- Safe modification: Use `!fk_name` hints on all existing `drivers (` joins before adding a new FK. Run `pnpm rls:test` after any schema change.
- Test coverage: No automated test catches PGRST201 errors; they surface as runtime 500s.

**`src/lib/rate-limit/check.ts` — `setInterval` for cache cleanup runs in serverless module scope:**
- Files: `src/lib/rate-limit/check.ts:31-39`
- Why fragile: The `setInterval` for `inMemoryBuckets` cleanup runs at module load time. In serverless (Vercel), function instances are cold-started frequently; the interval may never fire before the instance is recycled, causing unbounded `Map` growth within a single invocation window (bounded by instance lifetime, typically seconds to minutes).
- Safe modification: The issue is self-limiting due to short serverless lifetimes, but under sustained load a single hot instance could accumulate entries. The cleanup interval is defensive but not guaranteed to run.

**`src/components/ui/checkout/ContactInfoSection.tsx` — suppressed exhaustive-deps:**
- Files: `src/components/ui/checkout/ContactInfoSection.tsx:63,75`
- Why fragile: Two `useEffect` hooks have `// eslint-disable-next-line react-hooks/exhaustive-deps` with empty dep arrays to enforce mount-only execution. With React Compiler enabled (which auto-memoizes), these suppressions interact with the compiler's dependency inference. Incorrect dependencies here could cause stale closures in the phone pre-fill logic.
- Safe modification: Do not add dependencies to these effects without verifying the phone pre-fill logic in full checkout flow.

## Scaling Limits

**`inMemoryBuckets` rate limiter (fallback) is per-instance:**
- Current capacity: 15 req/min per serverless instance.
- Limit: With N concurrent Vercel instances, effective limit is N × 15 req/min globally. Not a real DDoS defense.
- Scaling path: Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are always set in production; the distributed Upstash limiter handles cross-instance coordination.

**`src/app/api/menu/route.ts` — 5-minute CDN TTL, no push invalidation:**
- Current capacity: Menu served fresh to all clients within 5 minutes of an admin change.
- Limit: During a flash sale or item removal for safety, the 5-minute lag could serve invalid items to customers who proceed to checkout (caught at checkout validation, but causes friction).
- Scaling path: Wire `revalidateTag("menu")` on admin mutations (see Performance Bottlenecks above).

## Dependencies at Risk

**`@upstash/ratelimit` + `@upstash/redis` — incompatible with a standard Redis Cloud instance:**
- Risk: MEMORY.md records that "Production is Redis Cloud (`redis://` URL), NOT Upstash REST. `@upstash/redis` incompatible." The rate limit clients are null in production if standard Redis Cloud is used.
- Impact: All rate limiters fall back to the in-memory 15 req/min per-instance fallback in production.
- Migration plan: Either provision Upstash REST (separate service, different URL scheme), or swap the rate limit layer to `ioredis` + a custom sliding window implementation.

## Missing Critical Features

**`arriving_soon` email — no trigger exists:**
- Problem: The email type is defined and has a DB enum value, but nothing sends it. Customers are not notified when the driver is ~10 minutes away.
- Blocks: Real-time driver proximity notifications for customers.

**`adminBulkLimiter` and `globalLimiter` — documented as unimplemented:**
- Problem: Comments in `src/lib/rate-limit/client.ts:55,58` note these as "Reserved: per-IP safety net for future use" and "Unwired: no bulk admin endpoints exist." No per-IP global rate limit is applied to the app.
- Blocks: Protection against distributed brute-force or scraping at the IP level.

## Test Coverage Gaps

**Admin authenticated E2E flows — all skipped:**
- What's not tested: 56 E2E tests across `e2e/admin-operations.spec.ts` and `e2e/admin-analytics.spec.ts` are marked `test.skip` or `describe.skip` because they require admin auth state in Playwright.
- Files: `e2e/admin-operations.spec.ts:34-345`, `e2e/admin-analytics.spec.ts:43`
- Risk: Admin order management, menu CRUD, driver assignment, and analytics views have no E2E coverage. Regressions in admin flows go undetected.
- Priority: High — admin is the operational core of the business.

**`buildEmailElement` switch — no exhaustiveness test:**
- What's not tested: No test calls `buildEmailElement` for all values of `EmailType`. The `arriving_soon` gap (template missing, type exists) would not be caught by current tests.
- Files: `src/lib/email/build.ts`, `src/lib/email/types.ts`
- Risk: New email types added to the union without a build.ts case throw at runtime in production.
- Priority: Medium — add a test that iterates all `EmailType` values with fixture data.

**Rate limiter behavior with null limiter (Redis unconfigured) — no integration test:**
- What's not tested: The in-memory fallback path (`limiter: null`) in `checkRateLimit` is not exercised in any test.
- Files: `src/lib/rate-limit/check.ts`, `src/lib/rate-limit/__tests__/`
- Risk: Silent regression if fallback logic changes.
- Priority: Low — the fallback is simple and well-isolated.

---

*Concerns audit: 2026-04-04*
