# External Integrations

**Analysis Date:** 2026-04-04

## APIs & External Services

**Payment Processing:**
- Stripe - Checkout sessions, promo codes, refunds, customer management
  - SDK: `stripe` v20 (Node SDK)
  - Client: lazy singleton proxy in `src/lib/stripe/server.ts`
  - Auth: `STRIPE_SECRET_KEY` (server), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
  - Webhook secret: `STRIPE_WEBHOOK_SECRET`
  - Features used: `stripe.balance`, `stripe.promotionCodes`, `stripe.customers`, `stripe.webhooks.constructEvent`

**Email Delivery:**
- Resend - All transactional emails (order confirmation, delivery reminders, admin alerts, driver invites)
  - SDK: `resend` v6.9
  - Client: singleton in `src/lib/email/client.ts`
  - Auth: `RESEND_API_KEY`
  - Webhook secret: `RESEND_WEBHOOK_SECRET` (verified via `svix`)
  - From: `admin@mandalaymorningstar.com`; CC: `min@mandalaymorningstar.com` on every email
  - Templates: 10 React Email templates in `src/emails/` (OrderConfirmation, OrderDelivered, OrderCancellation, DeliveryReminder, DriverInvite, FeedbackConfirmation, AdminNewOrderAlert, AdminDailyDigest, AdminFeedbackAlert + components)
  - Retry: up to 3 attempts with exponential backoff (10s base delay)

**Maps & Geocoding:**
- Google Maps Platform - Address autocomplete, geocoding, distance/routing
  - SDK: `@react-google-maps/api` v2.20 (client-side, always `ssr: false`)
  - Auth: `GOOGLE_MAPS_API_KEY` (server), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client)
  - APIs required: Geocoding API, Routes API (or Distance Matrix API), Places API
  - Hook: `src/lib/hooks/usePlacesAutocomplete.ts` - uses new `AutocompleteSuggestion` API with legacy fallback
  - Libraries loaded: `places`, `geometry`, `marker`

**Error Tracking & Observability:**
- Sentry - Error tracking, session replay, CSP violation reporting
  - SDK: `@sentry/nextjs` v10
  - Config: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  - Auth: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (CI source maps upload)
  - Traces sample rate: 1.0 dev / 0.2 prod; session replay: 0.1 sample / 1.0 on error
  - Tunneled through `/monitoring` to bypass ad blockers
  - Org: `mandalay-morning-star`, project: `mandalay-morning-star-delivery-app`

**Analytics:**
- Vercel Analytics - Page view tracking
  - SDK: `@vercel/analytics` v1.6
- Vercel Speed Insights - Core Web Vitals
  - SDK: `@vercel/speed-insights` v1.3
- Google Search Console - Site verification
  - Auth: `GOOGLE_SITE_VERIFICATION` env var (config-only check in `/api/health`)

**Visual Testing:**
- Chromatic - Storybook visual regression snapshots
  - Auth: `CHROMATIC_PROJECT_TOKEN`
  - Config: `chromatic.config.js`

**Performance Testing:**
- Lighthouse CI (`@lhci/cli`) - Automated performance budgets
  - Config: `lighthouserc.js` (implied by `pnpm lighthouse`)

## Data Storage

**Databases:**
- Supabase (hosted Postgres 15 + RLS + Auth + Storage)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Three client variants in `src/lib/supabase/`:
    - `client.ts` (`createBrowserClient`) - Browser/client components
    - `server.ts` (`createServerClient`) - Server components/actions; auto-reads cookies
    - `server.ts` (`createServiceClient`) - Webhooks/cron; bypasses RLS; no session persistence
    - `server.ts` (`createPublicClient`) - Health checks; no auth context
  - 65 migration files in `supabase/migrations/` (initial schema through 2026-03-21)
  - DB extensions: `plpgsql_check` 1.2.3, `pgtap` 1.3.1 (local dev/testing)
  - Key tables (inferred from usage): `profiles`, `drivers`, `orders`, `app_settings`, `customer_settings`, `notification_logs`, `webhook_audit_logs`, `delivery_days`, `delivery_zones`, `routes`

**File Storage:**
- Supabase Storage - Menu photos in `menu-photos` bucket
  - Upload: via server-side processing at `/api/admin/photos/process` (WebP conversion, 4:3 crop, `sharp`)
  - Client: `src/lib/supabase/storage.ts` + `src/lib/supabase/driver-storage.ts`
  - Accepted: JPEG, PNG, WebP; max 10MB input; processed to WebP, max 800px width, 85% quality
  - Google Drive URLs also supported as image source (parsed client-side, verified server-side)

**Caching/Rate Limiting:**
- Upstash Redis REST - Sliding window rate limiting
  - SDK: `@upstash/ratelimit` v2 + `@upstash/redis` v1.36
  - Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - 13 rate limiters in `src/lib/rate-limit/client.ts`: auth-signin, auth-signup, api-write, public-read, driver-location, driver-action, customer, admin, global, checkout, refund, admin-bulk, webhook
  - Fallback: in-memory 15 req/min when Redis unconfigured (dev/missing env)
  - Note: Production infrastructure memory indicates Redis Cloud (`redis://` URL) was used before; current config requires Upstash REST

**Offline Storage:**
- Browser IndexedDB via `idb-keyval` v6 - Cart persistence for PWA offline support

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - OTP magic link (primary), Google OAuth (secondary)
  - Implementation: `@supabase/ssr` cookie-based sessions; middleware in `src/lib/supabase/middleware.ts`
  - Callback: `/auth/callback` route
  - Roles: `customer` (default), `driver`, `admin` — stored in `profiles.role`
  - Role routing: `src/lib/auth/role-redirect.ts` → `/menu` (customer), `/admin` (admin), `/driver` (driver)
  - Driver sub-states: `active`, `inactive`, `no_record` → routes to `/driver`, `/driver/deactivated`, `/driver/onboard`
  - Self-healing: auto-creates missing `profiles` row on first login
  - Service role client used for admin user lookup (`auth.admin.getUserById`) — never `auth.getUser()` on service client

## Monitoring & Observability

**Error Tracking:**
- Sentry (see APIs section)

**Health Check:**
- `/api/health` - Deep health check endpoint in `src/lib/health/checks.ts`
  - Checks: Supabase connectivity, Stripe balance, Resend domain list, Google OAuth config, Redis ping, Search Console config
  - 30-second in-memory cache; secret redaction on all error messages
  - Route reachability checks: `/auth/callback`, `/api/webhooks/stripe`

**Logs:**
- Structured logger in `src/lib/utils/logger.ts` - wraps `console.*` + Sentry breadcrumbs/exceptions
  - Methods: `debug`, `info`, `warn`, `error`, `exception`
  - Context fields: `userId`, `flowId`, `orderId`, `sessionId`, `api`
  - Production: `console.*` removed except `error`/`warn` (Next.js `compiler.removeConsole`)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `@vercel/analytics`, `vercel.json`, Sentry `NEXT_PUBLIC_VERCEL_ENV`)
  - Image optimization: AVIF + WebP, 30-day CDN cache
  - Server Actions body limit: 2MB

**Cron Jobs (Vercel):**
- `/api/cron/delivery-reminders` - Daily 8:00 AM PT (`0 15 * * *` UTC) - sends DeliveryReminder emails
- `/api/cron/admin-daily-digest?period=morning` - Daily 6:00 AM PT (`0 14 * * *` UTC)
- `/api/cron/admin-daily-digest?period=evening` - Daily 10:00 PM PT (`0 6 * * *` UTC)
- All cron routes: auth via `CRON_SECRET` header, rate limited via `webhookLimiter`

**CI Pipeline:**
- Not detected (no `.github/workflows/` or similar found); Sentry uses `SENTRY_AUTH_TOKEN` suggesting CI integration for source maps

## Webhooks & Callbacks

**Incoming Webhooks:**
- `POST /api/webhooks/stripe` - Stripe payment events
  - Events handled: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
  - Verification: `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`
  - Idempotency: atomic event claim via Postgres UNIQUE constraint before processing
  - Error handling: returns 500 on DB errors (triggers Stripe retry); returns 200 only on success or duplicate
- `POST /api/webhooks/resend` - Resend email delivery events
  - Events handled: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
  - Verification: Svix HMAC via `svix` package with `RESEND_WEBHOOK_SECRET`
  - Deduplication: by `svix-id` header; logged to `webhook_audit_logs`
  - Status priority: pending→sent→delivered→opened→clicked→bounced (never downgrade)
  - Returns 200 always after verification to prevent Resend retries

**Outgoing Webhooks/Callbacks:**
- Supabase Realtime subscriptions (driver location tracking) - `src/lib/hooks/useTrackingSubscription.ts`
- Sentry CSP violation reports - `report-uri` configured in CSP headers

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only, bypasses RLS)
- `GOOGLE_MAPS_API_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps (see `.env.example` — only `GOOGLE_MAPS_API_KEY` shown but hook uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- `STRIPE_SECRET_KEY` - Stripe server key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook HMAC secret
- `RESEND_API_KEY` - Resend transactional email key
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN

**Optional env vars:**
- `RESEND_WEBHOOK_SECRET` - Resend webhook Svix secret
- `CRON_SECRET` - Secures cron endpoints
- `SENTRY_AUTH_TOKEN` - CI source maps upload
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` - Rate limiting (falls back to in-memory)
- `NEXT_PUBLIC_APP_URL` - Defaults to `https://mandalaymorningstar.com`
- `NEXT_PUBLIC_OPERATOR_PHONE` - Driver "Call for Help" button
- `GOOGLE_SITE_VERIFICATION` - Search Console verification
- Rate limit overrides: `RATE_LIMIT_*_MAX` / `RATE_LIMIT_*_WINDOW` (13 configurable tiers)

**Secrets location:**
- `.env.local` (local dev, gitignored)
- Vercel Dashboard environment variables (production)

---

*Integration audit: 2026-04-04*
