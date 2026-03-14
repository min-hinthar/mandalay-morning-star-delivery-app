# External Integrations

**Analysis Date:** 2026-03-14

## APIs & External Services

### Supabase (Database + Auth + Storage + Realtime)

**Purpose:** Primary backend -- Postgres database, authentication, file storage, real-time subscriptions.

**SDKs:**
- `@supabase/supabase-js` 2.90.1 - Core client
- `@supabase/ssr` 0.8.0 - Server-side rendering integration (cookie-based sessions)

**Client Factories (3 patterns):**

| Pattern | File | Use Case |
|---------|------|----------|
| Browser client | `src/lib/supabase/client.ts` | Client components, hooks |
| Server client | `src/lib/supabase/server.ts` → `createClient()` | Server Components, API routes (respects RLS) |
| Public client | `src/lib/supabase/server.ts` → `createPublicClient()` | Unauthenticated server reads (health checks) |
| Service client | `src/lib/supabase/server.ts` → `createServiceClient()` | Webhooks, cron jobs, admin ops (bypasses RLS) |

**Auth Configuration:**
- `src/lib/supabase/middleware.ts` - Session refresh on every request, gates `/admin` and `/driver` routes
- `src/lib/supabase/actions.ts` - Server Actions for sign-in (magic link OTP), sign-out, driver invite resend
- `src/components/ui/auth/SocialLoginButtons.tsx` - Google OAuth via `signInWithOAuth`
- Auth callback: `src/app/auth/callback/route.ts`
- Auth confirm: `src/app/auth/confirm/route.ts`

**Auth Methods:**
- Magic link (email OTP) via Supabase Auth
- Google OAuth via Supabase Auth (configured in Supabase dashboard)

**Database:**
- Hosted PostgreSQL via Supabase
- 58+ migration files in `supabase/migrations/`
- Row Level Security (RLS) policies defined in migrations
- Type-safe queries via generated `src/types/database.ts`
- Atomic operations: `create_order_atomic()` PL/pgSQL function, `atomic_refund()` function

**Storage Buckets:**
- `menu-photos` - Menu item images (JPEG/PNG/WebP, max 10MB input, server-processed to WebP)
  - Client: `src/lib/supabase/storage.ts`
  - Server processing: `src/app/api/admin/photos/process/route.ts`
- `driver-photos` - Driver profile photos and delivery proof photos
  - Client: `src/lib/supabase/driver-storage.ts`

**Realtime:**
- `src/lib/hooks/useTrackingSubscription.ts` - Customer order tracking
  - Subscribes to: `orders` table (status changes), `route_stops` table (ETA/status), `location_updates` table (driver GPS)
  - Falls back to 30s polling if Realtime connection fails

**Required Env Vars:**
- `NEXT_PUBLIC_SUPABASE_URL` (critical)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (critical)
- `SUPABASE_SERVICE_ROLE_KEY` (important -- for service client)

---

### Stripe (Payments)

**Purpose:** Payment processing -- checkout sessions, customer management, promo codes, refunds, webhook events.

**SDK:**
- `stripe` 20.1.2 (server-side only)
- Client: `src/lib/stripe/server.ts` - Lazy-initialized singleton via Proxy

**Features Used:**
- **Checkout Sessions** - `src/app/api/checkout/session/route.ts` (create), `src/app/api/checkout/session/helpers.ts`, `src/app/api/checkout/session/validation.ts`
- **Customer Management** - `getOrCreateStripeCustomer()` in `src/lib/stripe/server.ts`
- **Promotion Codes** - `validatePromoCode()` in `src/lib/stripe/promo.ts` (amount_off and percent_off coupons)
- **Refunds** - `src/app/api/admin/orders/[id]/refund/route.ts`
- **Payment Verification** - `src/app/api/orders/[id]/verify-payment/route.ts`
- **Payment Retry** - `src/app/api/orders/[id]/retry-payment/route.ts`
- **Balance Retrieval** - Health check connectivity test in `src/lib/health/checks.ts`

**Webhook:**
- Endpoint: `src/app/api/webhooks/stripe/route.ts`
- Events handled:
  - `checkout.session.completed` - Order confirmation
  - `checkout.session.expired` - Session cleanup
  - `payment_intent.payment_failed` - Payment failure handling
  - `charge.refunded` - Refund processing
- Idempotency: `webhook_events` table with UNIQUE constraint on `event_id`
- Signature verification via `stripe.webhooks.constructEvent()`
- Handlers: `src/app/api/webhooks/stripe/handlers.ts`

**COD (Cash on Delivery):**
- `pending_approval` status for COD orders
- Admin approval: `src/app/api/admin/orders/[id]/approve-cod/route.ts`

**Required Env Vars:**
- `STRIPE_SECRET_KEY` (critical -- validated via health check, not Zod)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (critical)
- `STRIPE_WEBHOOK_SECRET` (important)

---

### Resend (Email)

**Purpose:** Transactional email delivery with React Email templates, webhook-based delivery tracking.

**SDK:**
- `resend` 6.9.1
- Client: `src/lib/email/client.ts` - Singleton `getResendClient()`

**Email Infrastructure:**
- Send function: `src/lib/email/send.ts` - Full pipeline:
  1. Admin kill switch check (`app_settings.email_sending_enabled`)
  2. User notification preference check (`customer_settings.notification_prefs`)
  3. React-to-HTML rendering via `@react-email/render`
  4. Retry with exponential backoff (3 attempts, 10s base delay)
  5. Notification log insert to `notification_logs` table
  6. On failure: flags order with `needs_contact: true`
- Constants: `src/lib/email/constants.ts`
  - From: `admin@mandalaymorningstar.com`
  - Domain: `mail.mandalaymorningstar.com`

**Email Templates** (`src/emails/`):
- `OrderConfirmation.tsx` - Customer order confirmation
- `OrderCancellation.tsx` - Order cancellation notice
- `DeliveryReminder.tsx` - Day-of delivery reminder (includes static Google Maps image)
- `RefundNotification.tsx` - Refund processed notice
- `DriverInvite.tsx` - Driver invitation email
- `AdminNewOrderAlert.tsx` - Admin new order notification
- `AdminDailyDigest.tsx` - Admin daily summary
- `AdminFeedbackAlert.tsx` - Customer feedback alert
- `FeedbackConfirmation.tsx` - Feedback receipt confirmation

**Webhook:**
- Endpoint: `src/app/api/webhooks/resend/route.ts`
- Events tracked: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
- Signature verification via Svix HMAC (`svix` 1.86.0)
- Idempotency via `svix-id` deduplication in `webhook_audit_logs` table
- Status priority protection (won't downgrade e.g. `opened` back to `delivered`)

**Required Env Vars:**
- `RESEND_API_KEY` (critical)
- `RESEND_WEBHOOK_SECRET` (optional -- skips verification if missing)

---

### Google Maps Platform

**Purpose:** Geocoding, route optimization, address autocomplete, map rendering, static map images in emails.

**APIs Used:**
- Geocoding API - `src/lib/services/geocoding.ts` (address to lat/lng)
- Routes API - `src/lib/services/coverage.ts`, `src/lib/services/route-optimization/optimizer.ts` (distance/duration calculations)
- Places API (Autocomplete) - `src/lib/hooks/usePlacesAutocomplete.ts` (address search)
- Maps JavaScript API - `@react-google-maps/api` for interactive maps
- Static Maps API - Email templates (`DeliveryReminder.tsx`)

**Map Components:**
- Admin route maps: `src/components/ui/admin/routes/RouteMap/`
- Customer delivery tracking: `src/components/ui/orders/tracking/DeliveryMap/`
- Coverage area map: `src/components/ui/coverage/CoverageRouteMap/`
- Homepage hero map: `src/components/ui/homepage/Hero/DeliveryMapCard/`

**Business Logic:**
- Coverage check: 50mi / 90min from Covina, CA
- Direction-based zones (East/West/South/All) with bearings in `delivery_zones` table
- Distance-tiered delivery fees: >25mi flat $20; <=25mi $15 or free if subtotal >= $100

**Required Env Vars:**
- `GOOGLE_MAPS_API_KEY` (server-side -- important)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side -- for Places Autocomplete and static maps)

---

### Sentry (Error Tracking & Performance)

**Purpose:** Error tracking, performance monitoring, session replay, CSP violation reporting.

**SDK:**
- `@sentry/nextjs` 10.38.0

**Configuration (3 files):**
- `sentry.client.config.ts` - Browser: 20% trace sampling, session replay (10% sessions, 100% on error), text masking, media blocking
- `sentry.server.config.ts` - Server: 20% trace sampling, `extraErrorDataIntegration` (depth: 5)
- `sentry.edge.config.ts` - Edge runtime: 20% trace sampling

**Build Integration:**
- Source maps uploaded via `@sentry/nextjs` build plugin
- Org: `mandalay-morning-star`, Project: `mandalay-morning-star-delivery-app`
- Tunnel route: `/monitoring` (bypasses ad blockers)
- Console logs stripped in production (except `error` and `warn`)

**Structured Logger:**
- `src/lib/utils/logger.ts` - Wraps Sentry breadcrumbs and captureMessage/captureException
- All `warn` and `error` level logs are sent to Sentry
- `logger.exception()` for caught errors with context tags

**CSP Reporting:**
- `next.config.ts` parses Sentry DSN to build CSP `report-uri` and `Report-To` headers

**Required Env Vars:**
- `NEXT_PUBLIC_SENTRY_DSN` (important)
- `SENTRY_AUTH_TOKEN` (important -- for source map upload)

---

### Vercel (Hosting & Analytics)

**Purpose:** Deployment platform, analytics, speed insights, cron jobs.

**SDKs:**
- `@vercel/analytics` 1.6.1 - Page view analytics
- `@vercel/speed-insights` 1.3.1 - Core Web Vitals reporting to Vercel dashboard

**Cron Jobs** (`vercel.json`):
| Schedule (UTC) | Endpoint | Purpose |
|----------------|----------|---------|
| `0 15 * * *` (8 AM PT) | `/api/cron/delivery-reminders` | Send delivery day reminder emails |
| `0 14 * * *` (7 AM PT) | `/api/cron/admin-daily-digest?period=morning` | Morning admin digest |
| `0 6 * * *` (11 PM PT prev day) | `/api/cron/admin-daily-digest?period=evening` | Evening admin digest |

**Cron Security:**
- `CRON_SECRET` env var required
- Bearer token auth: `Authorization: Bearer {CRON_SECRET}`
- Fails CLOSED if secret not configured

**Environment:**
- `VERCEL_ENV` - Environment name (production/preview/development)
- `VERCEL_GIT_COMMIT_SHA` - Git commit for release tagging

---

## Data Storage

**Primary Database:**
- PostgreSQL via Supabase Cloud
- Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role: `SUPABASE_SERVICE_ROLE_KEY`
- ORM/Client: `@supabase/supabase-js` with generated TypeScript types

**File Storage:**
- Supabase Storage (S3-compatible)
- Buckets: `menu-photos`, `driver-photos`
- Public URLs: `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`

**Caching:**
- In-memory rate limit buckets (`src/lib/rate-limit/check.ts`) - 1min window, 15 req/min
- Serwist service worker caches (browser-side):
  - `navigations-v4` - NetworkFirst, 3s timeout
  - `external-images-v4` - NetworkFirst, 5s timeout, 200 entries, 30 days
  - `images-cache-v4` - CacheFirst, 250 entries, 30 days
  - `menu-api-cache-v4` - NetworkFirst, 5s timeout, 15 min TTL
  - `static-assets-v4` - StaleWhileRevalidate, 100 entries, 7 days
- Health check deep results cached 30s in-memory (`src/lib/health/checks.ts`)

**Offline Storage:**
- IndexedDB via `idb-keyval` - `src/lib/services/offline-store/`
  - Driver offline queue for stop updates, location updates
  - Customer offline cart persistence
  - Retry mechanism with sync queue

---

## Authentication & Identity

**Auth Provider:** Supabase Auth

**Methods:**
1. **Magic Link (Email OTP)** - Primary sign-in method
   - `src/lib/supabase/actions.ts` → `signInWithMagicLink()`
   - Supabase sends OTP email, user clicks link
   - Callback: `src/app/auth/callback/route.ts`
2. **Google OAuth** - Social sign-in
   - `src/components/ui/auth/SocialLoginButtons.tsx`
   - Configured in Supabase dashboard (Google Cloud OAuth client)
   - Scopes: `openid email profile`

**Session Management:**
- Cookie-based sessions via `@supabase/ssr`
- Session refresh on every request via middleware (`src/lib/supabase/middleware.ts`)
- 5s fetch timeout on server client, 8s on service client

**Role System:**
- Roles stored in Supabase database (profiles table)
- Admin guard: `src/lib/auth/admin.ts`
- Driver guard: `src/lib/auth/driver.ts`
- Middleware gates `/admin` and `/driver` routes for unauthenticated users
- Layout-level role checks (not middleware) for authorization

---

## Rate Limiting

**Framework:** `@upstash/ratelimit` + `@upstash/redis` (currently DISABLED -- in-memory fallback)

**Status:** Redis-based rate limiting disabled. Production Redis is Redis Cloud (standard `redis://` URL), incompatible with `@upstash/redis` (requires Upstash HTTPS REST API). All limiters set to `null`.

**In-Memory Fallback:** `src/lib/rate-limit/check.ts`
- 1-minute sliding window, 15 requests/identifier max
- Periodic cleanup every 5 minutes
- Applied to all API routes

**Limiter Tiers** (defined but set to null): `src/lib/rate-limit/index.ts`
- `authSignInLimiter`, `authSignUpLimiter` - Auth endpoints
- `apiWriteLimiter` - Write operations
- `publicReadLimiter` - Public reads
- `driverLocationLimiter`, `driverActionLimiter` - Driver endpoints
- `customerLimiter`, `adminLimiter` - Role-based limits
- `globalLimiter` - IP-based global limit
- `checkoutLimiter`, `refundLimiter` - Payment operations
- `webhookLimiter` - Webhook endpoints
- `adminBulkLimiter` - Admin bulk operations

**IP Extraction:** `src/lib/rate-limit/identifiers.ts`
- `x-forwarded-for` header (primary)
- `x-real-ip` header (fallback)
- Server Action variant via `next/headers`

---

## Monitoring & Observability

**Error Tracking:**
- Sentry (`@sentry/nextjs`) - Client, server, and edge runtime
- Structured logger: `src/lib/utils/logger.ts`

**Performance:**
- Vercel Speed Insights - CWV reporting to Vercel dashboard
- `web-vitals` library - LCP, INP, CLS, FCP, TTFB tracking (`src/lib/web-vitals.tsx`)
- Lighthouse CI - PR-gated performance regression testing

**Health Check:**
- Endpoint: `GET /api/health` (shallow) or `GET /api/health?deep=true` (connectivity tests)
- Checks: Supabase, Stripe, Resend, Google OAuth, Search Console, Redis
- Route reachability: `/auth/callback`, `/api/webhooks/stripe`
- Env var validation: critical vs. important var categorization
- Response includes: `production_ready` boolean, `version`, `environment`
- Implementation: `src/lib/health/` (index, checks, env, types)

**Logs:**
- Structured via `logger` utility (debug/info/warn/error levels)
- Development: console output with `[LEVEL]` prefix
- Production: Sentry breadcrumbs (all levels), messages (warn/error), exceptions

**Web Vitals API:**
- `POST /api/analytics/vitals` - Server-side CWV collection endpoint

---

## PWA (Progressive Web App)

**Framework:** Serwist 9.5.4 (`@serwist/next`, `serwist`)

**Service Worker:**
- Source: `src/app/sw.ts`
- Build: `scripts/build-sw.mjs` (esbuild + `@serwist/build` manifest)
- Output: `public/sw.js`
- Built separately from Next.js to avoid Turbopack compatibility issues

**Caching Strategy:**
- Precache: Public assets (images, fonts, icons) + key pages (/, /menu, /cart, /offline)
- Runtime caching with versioned cache names (currently `v4`)
- Manual update control: `skipWaiting: false`, user prompt for updates
- Denylist: `/auth/`, `/monitoring`, `/api/` excluded from SW navigation

**Offline Support:**
- Offline fallback page: `/offline`
- Menu API cached 15 minutes
- Images cached 30 days
- IndexedDB queue for driver operations (`src/lib/services/offline-store/`)

---

## Webhooks & Callbacks

**Incoming:**
| Endpoint | Source | Verification |
|----------|--------|-------------|
| `POST /api/webhooks/stripe` | Stripe | HMAC via `stripe.webhooks.constructEvent()` |
| `POST /api/webhooks/resend` | Resend | Svix HMAC signature verification |
| `GET /api/cron/delivery-reminders` | Vercel Cron | Bearer token (`CRON_SECRET`) |
| `GET /api/cron/admin-daily-digest` | Vercel Cron | Bearer token (`CRON_SECRET`) |

**Outgoing:**
- None (no outgoing webhook dispatching)

**Auth Callbacks:**
- `GET /auth/callback` - OAuth/magic link redirect handler
- `GET /auth/confirm` - Email confirmation handler

---

## Environment Configuration

**Required Env Vars (Critical -- blocks production_ready):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_*)
- `RESEND_API_KEY` - Resend API key (re_*)
- `NEXT_PUBLIC_APP_URL` - Application URL

**Required Env Vars (Important -- warns but doesn't block):**
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_*)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_*)
- `CRON_SECRET` - Cron job authorization token
- `GOOGLE_MAPS_API_KEY` - Google Maps server-side key
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN URL
- `SENTRY_AUTH_TOKEN` - Sentry auth token for source maps
- `GOOGLE_SITE_VERIFICATION` - Google Search Console verification

**Optional:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps client-side key (Places Autocomplete)
- `NEXT_PUBLIC_OPERATOR_PHONE` - Operator phone for driver help button
- `UPSTASH_REST_REDIS_URL` - Redis URL (disabled)
- `RESEND_WEBHOOK_SECRET` - Resend webhook verification
- `CHROMATIC_PROJECT_TOKEN` - Chromatic visual testing
- Rate limit overrides (`RATE_LIMIT_*` vars)

**Secrets Location:**
- Vercel Environment Variables (production/preview)
- `.env.local` (local development, git-ignored)
- `.env.example` documents all vars with placeholder values

---

## Security Headers

**Configured in** `next.config.ts`:
- `Content-Security-Policy` - Full CSP with directives for Google Maps, Supabase, Sentry, Vercel
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Report-To` / `Reporting-Endpoints` - CSP violations to Sentry

---

*Integration audit: 2026-03-14*
