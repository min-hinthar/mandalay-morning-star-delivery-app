# External Integrations

**Analysis Date:** 2026-03-06

## APIs & External Services

**Payments (Stripe):**
- Purpose: Checkout sessions, payment processing, refunds, promo codes
- SDK: `stripe` v20.1.2 (server-side only)
- Client: `src/lib/stripe/server.ts` - Lazy-initialized singleton via Proxy pattern
- Promo validation: `src/lib/stripe/promo.ts`
- Auth: `STRIPE_SECRET_KEY` (server), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
- Webhook secret: `STRIPE_WEBHOOK_SECRET`
- Checkout flow: `src/app/api/checkout/session/route.ts` creates Stripe Checkout Sessions
- Customer management: `getOrCreateStripeCustomer()` in `src/lib/stripe/server.ts`
- Idempotency: `checkout_{orderId}` keys on session creation

**Email (Resend):**
- Purpose: Transactional email (order confirmation, cancellation, delivery reminders, refunds, driver invites)
- SDK: `resend` v6.9.1
- Client: `src/lib/email/client.ts` - Singleton `getResendClient()`
- Send logic: `src/lib/email/send.ts` - Retry with exponential backoff, notification preference checks, admin kill switch
- Auth: `RESEND_API_KEY`
- From: Configured in `src/lib/email/constants.ts`
- Templates (React Email): `src/emails/`
  - `OrderConfirmation.tsx`
  - `OrderCancellation.tsx`
  - `DeliveryReminder.tsx`
  - `RefundNotification.tsx`
  - `DriverInvite.tsx`
- Shared components: `src/emails/components/` (BrandHeader, BrandFooter, EmailLayout, OrderItemsTable, etc.)

**Google Maps Platform:**
- Purpose: Geocoding, route distance/duration, delivery coverage, map display, places autocomplete
- APIs used:
  1. Geocoding API - Address to lat/lng (`src/lib/services/geocoding.ts`)
  2. Routes API v2 - Distance/duration calculations (`src/lib/services/coverage.ts`)
  3. Maps JavaScript API - Map rendering (client-side via `@react-google-maps/api`)
  4. Places API - Address autocomplete (`src/lib/hooks/usePlacesAutocomplete.ts`)
- Auth: `GOOGLE_MAPS_API_KEY` (server-side), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side, inferred from `@react-google-maps/api` usage)
- Route optimization: `src/lib/services/route-optimization/optimizer.ts`
- Coverage check: 50 miles / 90 minutes from Covina, CA kitchen location

**Error Tracking (Sentry):**
- Purpose: Error tracking, performance monitoring, CSP reporting
- SDK: `@sentry/nextjs` v10.38.0
- Config files:
  - `sentry.server.config.ts` - Server runtime (20% trace sampling in prod)
  - `sentry.edge.config.ts` - Edge runtime (20% trace sampling in prod)
  - `next.config.ts` - Source maps upload, tunnel route `/monitoring`
- Logger integration: `src/lib/utils/logger.ts` - All `warn`/`error` calls go to Sentry as messages; `exception()` captures with full context
- Auth: `NEXT_PUBLIC_SENTRY_DSN` (client+server), `SENTRY_AUTH_TOKEN` (CI source maps)
- Org/Project: `mandalay-morning-star` / `mandalay-morning-star-delivery-app`

**Analytics (Vercel):**
- Purpose: Usage analytics + performance insights
- SDKs:
  - `@vercel/analytics` v1.6.1 - Page view / event tracking
  - `@vercel/speed-insights` v1.3.1 - Performance metrics (50% sample rate)
  - `web-vitals` v5.1.0 - Core Web Vitals via `src/lib/web-vitals/`
- Integration: `src/app/layout.tsx` renders `<Analytics />`, `<SpeedInsights />`, `<WebVitalsReporter />`
- Vitals API endpoint: `src/app/api/analytics/vitals/route.ts`

**Rate Limiting (Upstash Redis):**
- Purpose: API rate limiting across all endpoints
- SDK: `@upstash/ratelimit` v2.0.8 + `@upstash/redis` v1.36.2
- Client: `src/lib/rate-limit/client.ts` - Singleton Redis + 12 named limiters
- Check utility: `src/lib/rate-limit/check.ts`
- ID extraction: `src/lib/rate-limit/identifiers.ts`
- Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Algorithm: Sliding window with 3s fail-open timeout
- Fail-open: When Redis is unavailable, all requests pass through
- Limiters: auth-signin (5/min), auth-signup (3/hr), api-write (10/min), public-read (60/min), driver-location (2/min), driver-action (10/min), customer (30/min), admin (120/min), global (120/min), checkout (3/min), refund (5/min), admin-bulk (10/min), webhook (30/min)

## Data Storage

**Database (Supabase Postgres):**
- Provider: Supabase hosted Postgres
- Client library: `@supabase/supabase-js` v2.90.1 + `@supabase/ssr` v0.8.0
- Client files:
  - `src/lib/supabase/client.ts` - Browser client (`createBrowserClient`)
  - `src/lib/supabase/server.ts` - Server client (cookie-based), public client, service role client
  - `src/lib/supabase/middleware.ts` - Session refresh middleware
- Type generation: `src/types/database.ts` (generated from Supabase schema)
- Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role: `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS for webhooks, crons, admin ops)
- Migrations: `supabase/migrations/` (001-007 + incremental)
- RLS: Enforced; tested via `scripts/rls-isolation-test.mjs`
- RPC functions: `create_order_with_items` (atomic order creation)
- Realtime: Used for tracking subscriptions (`src/lib/hooks/useTrackingSubscription.ts`)
- Timeouts: 5s for user client, 8s for service client

**File Storage (Supabase Storage):**
- Purpose: Menu item photos, driver profile photos, delivery proof photos
- Photo upload: `src/app/api/admin/menu/[id]/photo/route.ts`, `src/app/api/driver/profile/photo/route.ts`
- Image processing: `sharp` v0.34.5 (server-side resize/optimize)
- Client compression: `browser-image-compression` v2.0.2
- Remote patterns in `next.config.ts`: `**.supabase.co/storage/v1/object/public/**`

**Offline Storage (IndexedDB):**
- Library: `idb-keyval` v6.2.2
- Purpose: Cart persistence, offline sync
- Implementation: `src/lib/services/cart-idb-storage.ts`, `src/lib/hooks/useOfflineSync.ts`, `src/lib/hooks/useCustomerOfflineSync.ts`

**Caching:**
- Upstash Redis (rate limit state only; no general caching layer)
- TanStack React Query (client-side server state caching)
- Ephemeral in-memory cache for rate limiters (`src/lib/rate-limit/client.ts`)

## Authentication & Identity

**Auth Provider: Supabase Auth**
- Implementation: `@supabase/ssr` cookie-based auth
- Session management: `src/lib/supabase/middleware.ts` - Refreshes tokens on every request
- Auth hook: `src/lib/hooks/useAuth.ts`
- Auth confirm: `src/app/auth/confirm/route.ts` (email OTP verification)
- Roles: `customer`, `driver`, `admin` (stored in `profiles` table)
- Role guards:
  - `src/lib/auth/admin.ts` - Admin role verification
  - `src/lib/auth/driver.ts` - Driver role verification
  - `src/lib/auth/role-redirect.ts` - Role-based routing + profile creation
- Route protection: Middleware redirects unauthenticated users from `/admin` and `/driver` to `/login`
- Profile auto-creation: `ensureProfile()` in `src/lib/auth/role-redirect.ts`

## Monitoring & Observability

**Error Tracking:**
- Sentry (see APIs section above)
- Custom structured logger: `src/lib/utils/logger.ts`
  - `logger.debug/info/warn/error()` - Breadcrumbs + Sentry messages for warn/error
  - `logger.exception()` - Full Sentry exception capture with tags/user/extra

**Performance Monitoring:**
- Sentry traces (20% sample rate in production)
- Vercel Speed Insights (50% sample rate)
- Web Vitals reporter: `src/lib/web-vitals/`
- Lighthouse CI: `@lhci/cli` for automated perf audits
- Vitals endpoint: `src/app/api/analytics/vitals/route.ts`

**Health Check:**
- Endpoint: `src/app/api/health/route.ts`
- Checks: `src/lib/health/checks.ts` (Supabase, Redis, Stripe connectivity)
- CORS enabled for health endpoint

**Logs:**
- Structured logger (`src/lib/utils/logger.ts`) routes to Sentry + console (dev only)
- Console logs stripped in production except `error` and `warn` (`next.config.ts` compiler option)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `@vercel/analytics`, `@vercel/speed-insights`, `vercel.json`, `NEXT_PUBLIC_VERCEL_ENV`)

**CI Pipeline:**
- Pre-commit: Husky + lint-staged (ESLint + Stylelint)
- Verification suite: `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- Visual regression: Chromatic (`chromatic.config.js`)
- Sentry source maps: Uploaded during `next build` via `SENTRY_AUTH_TOKEN`

**Cron Jobs:**
- `vercel.json`: `/api/cron/delivery-reminders` runs daily at 3 PM UTC
- Auth: `CRON_SECRET` env var for endpoint security

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-only)
- `GOOGLE_MAPS_API_KEY` - Google Maps (server-side geocoding/routes)
- `STRIPE_SECRET_KEY` - Stripe server SDK
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe client SDK
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `RESEND_API_KEY` - Email sending
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking
- `UPSTASH_REDIS_REST_URL` - Rate limiting Redis
- `UPSTASH_REDIS_REST_TOKEN` - Rate limiting Redis auth

**Optional env vars:**
- `RESEND_WEBHOOK_SECRET` - Resend webhook verification
- `CRON_SECRET` - Cron job authentication
- `SENTRY_AUTH_TOKEN` - Source maps upload (CI only)
- `NEXT_PUBLIC_APP_URL` - App base URL (defaults to `http://localhost:3000`)
- `NEXT_PUBLIC_OPERATOR_PHONE` - Driver support phone number
- `GOOGLE_SITE_VERIFICATION` - Google Search Console
- Rate limit overrides: `RATE_LIMIT_*` vars (see `.env.example`)

**Secrets location:**
- Vercel environment variables (production)
- `.env.local` (local development, gitignored)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/stripe` - Stripe payment events
  - File: `src/app/api/webhooks/stripe/route.ts`
  - Handlers: `src/app/api/webhooks/stripe/handlers.ts`
  - Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
  - Verification: `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
  - Idempotency: `webhook_events` table with UNIQUE constraint on `event_id`
  - Rate limited: `webhookLimiter` (30/min)

- `POST /api/webhooks/resend` - Resend email delivery events
  - File: `src/app/api/webhooks/resend/route.ts`
  - Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
  - Verification: Svix HMAC (`svix` v1.86.0) with `RESEND_WEBHOOK_SECRET`
  - Idempotency: Deduplication by `svix-id` in `webhook_audit_logs` table
  - Updates `notification_logs` table with delivery status (with downgrade protection)

**Outgoing:**
- None detected (no outbound webhook dispatch)

**Cron-triggered:**
- `GET /api/cron/delivery-reminders` - Daily at 3 PM UTC
  - File: `src/app/api/cron/delivery-reminders/route.ts`
  - Auth: `CRON_SECRET` header verification

## Realtime

**Supabase Realtime:**
- Purpose: Live delivery tracking updates
- Hook: `src/lib/hooks/useTrackingSubscription.ts`
- Channel: Subscribes to `RealtimeChannel` for order/driver location updates
- Protocol: WebSocket (`wss://*.supabase.co`)

---

*Integration audit: 2026-03-06*
