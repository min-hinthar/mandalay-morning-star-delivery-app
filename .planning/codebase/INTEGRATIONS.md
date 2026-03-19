# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Supabase:**
- Database (Postgres 15), Auth, Storage, Realtime
- SDK: `@supabase/supabase-js ^2.90.1` (direct), `@supabase/ssr ^0.8.0` (SSR/cookie)
- Three client types in `src/lib/supabase/server.ts`:
  - `createClient()` - server component client (cookie-based, 5s fetch timeout)
  - `createPublicClient()` - non-SSR public client
  - `createServiceClient()` - service role client (bypasses RLS, no session persistence, 8s timeout)
- Browser client in `src/lib/supabase/client.ts`: `createBrowserClient` from `@supabase/ssr`
- Auth refresh in `src/lib/supabase/middleware.ts` (`updateSession` - every request)
- Local dev: Supabase CLI, port 54321 (API), 54322 (DB), 54323 (Studio)

**Stripe:**
- Payment processing, customer management, promo codes, refunds, checkout sessions
- SDK: `stripe ^20.1.2`
- Client: `src/lib/stripe/server.ts` (lazy singleton, Proxy pattern for build-time safety)
- Promo codes: `src/lib/stripe/promo.ts` (`validatePromoCode`)
- Checkout flow: `src/app/api/checkout/session/route.ts` (Stripe Checkout Sessions)
- Customer management: `getOrCreateStripeCustomer()` in `src/lib/stripe/server.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts` (signature verification via `stripe.webhooks.constructEvent`)
- Events handled: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
- Idempotency: atomic event claim via Supabase UNIQUE constraint

**Resend:**
- Transactional email delivery
- SDK: `resend ^6.9.1`
- Client: `src/lib/email/client.ts` (lazy singleton)
- Templates (React Email): `src/emails/` - 10+ templates (OrderConfirmation, DeliveryReminder, AdminNewOrderAlert, AdminDailyDigest, DriverInvite, OrderCancellation, RefundNotification, RouteDeclineAlert, FeedbackConfirmation, AdminFeedbackAlert)
- Email builder: `src/lib/email/build.ts`, sender: `src/lib/email/send.ts`
- Webhook handler: `src/app/api/webhooks/resend/route.ts` (Svix HMAC signature verification)
- Events tracked: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
- Deduplication: by `svix-id`, logs to `webhook_audit_logs` + `notification_logs` tables

**Google Maps:**
- Geocoding, address autocomplete, route display, delivery zone maps
- APIs used: Geocoding API, Places API (autocomplete), Maps JavaScript API
- React wrapper: `@react-google-maps/api ^2.20.8` (always `dynamic(() => ..., { ssr: false })` - crashes SSR)
- Server-side geocoding: `src/lib/services/geocoding.ts` (Geocoding REST API, California-scoped)
- Coverage check: `src/lib/services/coverage.ts` (geocode → distance check → zone bearing)
- Places autocomplete hook: `src/lib/hooks/usePlacesAutocomplete.ts`
- Route optimization uses Google Maps distance matrix: `src/lib/services/route-optimization/optimizer.ts`
- CSP allows: `*.googleapis.com`, `*.gstatic.com`, `*.google.com`, `*.googleusercontent.com`
- Image remote patterns: `drive.google.com`, `**.googleusercontent.com` (admin menu photos sourced from Google Drive)

**Google Search Console:**
- Site verification token only
- Env var: `GOOGLE_SITE_VERIFICATION`

**Sentry:**
- Error tracking, performance monitoring, session replay
- SDK: `@sentry/nextjs ^10.38.0`
- Configs: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Instrumentation: `instrumentation.ts` (loads per runtime: nodejs/edge)
- Client: session replay (10% sessions, 100% on error), trace sample 20% prod / 100% dev
- Server: extra error data (depth 5), no `ignoreErrors`
- Tunnel route: `/monitoring` (bypasses ad blockers)
- CSP report-uri points to Sentry ingest endpoint
- Release tracking via `VERCEL_GIT_COMMIT_SHA`
- Org: `mandalay-morning-star`, Project: `mandalay-morning-star-delivery-app`

**Vercel Analytics:**
- Page view and Web Vitals tracking (Vercel dashboard)
- SDK: `@vercel/analytics ^1.6.1`
- Speed Insights: `@vercel/speed-insights ^1.3.1` (Core Web Vitals in Vercel dashboard)
- Web Vitals also tracked internally via `src/lib/web-vitals.tsx` (LCP, INP, CLS, FCP, TTFB)

**Chromatic:**
- Visual regression testing against Storybook
- Config: `chromatic.config.js`
- Env var: `CHROMATIC_PROJECT_TOKEN`
- TurboSnap enabled (only snapshots changed stories)
- 5 breakpoints: 375, 640, 768, 1024, 1280

## Data Storage

**Primary Database:**
- Supabase / Postgres 15
- Connection: `NEXT_PUBLIC_SUPABASE_URL` (anon), `SUPABASE_SERVICE_ROLE_KEY` (service)
- Client packages: `@supabase/supabase-js`, `@supabase/ssr`
- Migrations: `supabase/migrations/` (file-based, applied via Supabase CLI)
- DB tests: `supabase/tests/` (pgTAP: `00_rls_policies.test.sql`, `01_function_security.test.sql`, `02_materialized_views.test.sql`)
- Run: `pnpm rls:test` (via `scripts/rls-isolation-test.mjs`)

**File Storage:**
- Supabase Storage
- Buckets: `menu-photos` (menu item images, auto-organized by `{menuItemId}/`)
- Photo pipeline: client upload → `src/app/api/admin/photos/process` (sharp: WebP, 4:3 crop) → Supabase Storage
- Storage utilities: `src/lib/supabase/storage.ts` (upload, delete, move, getPublicUrl)
- Driver delivery photos: `src/lib/supabase/delivery-photos.ts`, `src/lib/supabase/driver-storage.ts`
- Remote patterns in `next.config.ts`: `**.supabase.co/storage/v1/object/public/**`

**Offline / Client-Side Storage:**
- IndexedDB via `idb-keyval ^6.2.2`
- Cart persistence: `src/lib/services/cart-idb-storage.ts`
- Offline store: `src/lib/services/customer-offline-store.ts`, `src/lib/services/offline-store/`

**Caching:**
- Redis: intended via `@upstash/redis ^1.36.2` + `@upstash/ratelimit ^2.0.8`
- Current state: all limiters are `null` (see `src/lib/rate-limit/client.ts`), in-memory fallback at 15 req/min per identifier
- To re-enable: provision Upstash REST endpoint, restore `Ratelimit` constructors in `src/lib/rate-limit/client.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password + Google OAuth)
- Implementation: cookie-based sessions via `@supabase/ssr`
- Session refresh: middleware (`src/lib/supabase/middleware.ts`) runs `updateSession()` on every request
- Protected routes: `/admin/*` and `/driver/*` redirect to `/login?next=<path>` if unauthenticated
- Role checks: in layout guards (not middleware), using DB profile `role` column
- Auth callback: `/auth/callback` route
- Service role: `createServiceClient()` for webhooks/crons (bypasses RLS, no browser auth)
- Google OAuth configured through Supabase Auth dashboard (not direct Google OAuth SDK)

## Monitoring & Observability

**Error Tracking:**
- Sentry (`@sentry/nextjs ^10.38.0`) - all environments
- Client replay, server extra error data, edge runtime support
- Request error capture: `onRequestError = Sentry.captureRequestError` in `instrumentation.ts`

**Performance:**
- Sentry browser tracing
- `@vercel/speed-insights` - Vercel dashboard CWV
- `web-vitals ^5.1.0` - local dev logging via `src/lib/web-vitals.tsx`
- Lighthouse CI in GitHub Actions (PR gate: LCP < 10s, CLS < 0.15, performance > 0.3, accessibility > 0.9)

**Logs:**
- Custom structured logger: `src/lib/utils/logger.ts`
- Pattern: `logger.info/error/warn/exception(message, context)` with `{ api, flowId }` fields
- console logs removed in production builds (except `error`, `warn`) via Next.js compiler

**Health Check:**
- `GET /api/health` - two-tier (env-only default, live connectivity via `?deep=true`)
- Checks: supabase, stripe, resend, google_oauth, search_console, redis
- Reports: `production_ready` boolean, missing env vars (names only, never values)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `vercel.json`, VERCEL_* env vars, `@vercel/analytics`)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Jobs: detect-changes → lint → typecheck → test → build → lighthouse (PR only)

**Cron Jobs (Vercel Crons via `vercel.json`):**
- `GET /api/cron/delivery-reminders` - daily at 15:00 UTC
- `GET /api/cron/admin-daily-digest?period=morning` - daily at 14:00 UTC
- `GET /api/cron/admin-daily-digest?period=evening` - daily at 06:00 UTC
- All cron routes protected by `CRON_SECRET` env var

## Webhooks & Callbacks

**Incoming Webhooks:**
- `POST /api/webhooks/stripe` - Stripe payment events
  - Verification: `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
  - Idempotent: atomic DB INSERT ON CONFLICT to prevent duplicate processing
  - Rate limited: `webhookLimiter` (30 req/min)
- `POST /api/webhooks/resend` - Resend email delivery events
  - Verification: Svix HMAC (`svix ^1.86.0`)
  - Deduplication: by `svix-id` header
  - Always returns 200 after verification (prevents Resend retries)
  - Logs to `webhook_audit_logs` + updates `notification_logs`

**Auth Callback:**
- `GET /auth/callback` - Supabase OAuth/magic-link callback handler

**Rate Limit Tiers (configured via env vars, in-memory fallback):**
| Tier | Default Limit |
|------|--------------|
| auth-signin | 5/min |
| auth-signup | 3/hour |
| api-write | 10/min |
| public-read | 60/min |
| driver-location | 2/min |
| driver-action | 10/min |
| customer | 30/min |
| admin | 120/min |
| global | 120/min |
| checkout | 3/min |
| refund | 5/min |
| admin-bulk | 10/min |
| webhook | 30/min |

## Environment Configuration

**Critical vars (block `production_ready` if missing):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (must start `pk_`)
- `RESEND_API_KEY` - Resend API key (must start `re_`)
- `NEXT_PUBLIC_APP_URL` - Canonical app URL

**Important vars (warn but don't block):**
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (webhooks, crons, admin)
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (must start `whsec_`)
- `RESEND_WEBHOOK_SECRET` - Resend webhook secret (Svix HMAC)
- `CRON_SECRET` - Vercel cron job authentication
- `GOOGLE_MAPS_API_KEY` - Google Maps Geocoding + Places + JS API
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (public)
- `SENTRY_AUTH_TOKEN` - Sentry source maps upload
- `GOOGLE_SITE_VERIFICATION` - Google Search Console verification

**Rate limit overrides (all optional, env-configurable):**
- `RATE_LIMIT_{TIER}_MAX` and `RATE_LIMIT_{TIER}_WINDOW` for each tier

**Build-time injected:**
- `NEXT_PUBLIC_APP_VERSION` - injected from `package.json` version in `next.config.ts`

**Secrets location:**
- `.env.local` (gitignored) for local development
- Vercel environment variables dashboard for production

---

*Integration audit: 2026-03-18*
