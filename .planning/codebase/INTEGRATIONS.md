# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Payment Processing:**
- Stripe - Checkout sessions, customer management, refunds, promo/coupon codes
  - SDK: `stripe: ^20.1.2` (server-only)
  - Client: lazy singleton in `src/lib/stripe/server.ts`
  - Auth: `STRIPE_SECRET_KEY` env var
  - Webhook secret: `STRIPE_WEBHOOK_SECRET`
  - Checkout mode: `payment` (not subscription); `payment_method_types: ["card"]`
  - Session expires 30 min after creation
  - Idempotency key: `checkout_${order.id}` on session creation
  - Webhook events handled: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`

**Email Delivery:**
- Resend - Transactional emails (order confirmation, COD approval, reminders, daily digests)
  - SDK: `resend: ^6.9.1`
  - Client: singleton in `src/lib/email/client.ts`
  - Auth: `RESEND_API_KEY` env var
  - Templates: React Email components in `src/emails/` (12 templates: OrderConfirmation, OrderCancellation, RefundNotification, DeliveryReminder, AdminNewOrderAlert, AdminDailyDigest, AdminFeedbackAlert, DriverInvite, FeedbackConfirmation, RouteDeclineAlert)
  - Webhook verification: Svix HMAC (`svix: ^1.86.0`) via `RESEND_WEBHOOK_SECRET`

**Mapping & Geospatial:**
- Google Maps Platform - Three distinct API uses:
  1. Geocoding API (`https://maps.googleapis.com/maps/api/geocode/json`) - Address verification in `src/lib/services/geocoding.ts`; restricts to `country:US|administrative_area:CA`
  2. Routes API v2 (`https://routes.googleapis.com/directions/v2:computeRoutes`) - Coverage distance checks in `src/lib/services/coverage.ts` AND route optimization in `src/lib/services/route-optimization/optimizer.ts`
  3. Maps JS API (`@react-google-maps/api`) - Client-side map rendering; always SSR-disabled dynamic import
  - Auth: `GOOGLE_MAPS_API_KEY` (server-side) and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side)
  - Route optimization: Google Routes API with `TRAFFIC_AWARE` preference + nearest-neighbor fallback; 15s timeout; kitchen origin at Covina CA coords (`src/lib/constants/kitchen.ts`)
  - Coverage check: `TRAFFIC_UNAWARE` preference, checks ≤50mi / ≤90min from kitchen

**Error Monitoring:**
- Sentry - Full-stack error capture and performance monitoring
  - SDK: `@sentry/nextjs: ^10.38.0`
  - Config files: `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`
  - Tunnel route: `/monitoring` (bypasses ad blockers)
  - Trace sample rate: 100% dev, 20% prod
  - Auth: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

**Performance & Analytics:**
- Vercel Analytics + Speed Insights (`@vercel/analytics`, `@vercel/speed-insights`) - Zero-config page analytics
- Lighthouse CI (`@lhci/cli: ^0.15.1`) - Automated performance auditing
- Chromatic (`chromatic`) - Visual regression testing for Storybook

**Rate Limiting (currently degraded):**
- Upstash Redis + `@upstash/ratelimit` - Intended for distributed rate limiting
- **Status: ALL limiters are null in `src/lib/rate-limit/client.ts`** — in-memory fallback (15 req/min) active
- Fix requires Upstash REST API URL (NOT Redis Cloud `redis://` URL — `@upstash/redis` requires REST protocol)
- Env vars needed: Upstash REST URL and token

## Data Storage

**Databases:**
- Supabase (Postgres + RLS + Realtime)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client variants:
    - `createClient()` in `src/lib/supabase/server.ts` - SSR client with cookie auth (`@supabase/ssr`), 5s fetch timeout
    - `createPublicClient()` - Anon key, no cookie auth, 5s timeout
    - `createServiceClient()` - Service role, bypasses RLS, 8s timeout, no session/refresh/URL detection
  - Migrations: `supabase/migrations/` (numbered + dated SQL files, 37+ migrations)
  - Key tables: `orders`, `order_items`, `order_item_modifiers`, `order_audit_log`, `profiles`, `addresses`, `routes`, `route_stops`, `location_updates`, `drivers`, `menu_items`, `menu_categories`, `menu_sections`, `delivery_days`, `delivery_zones`, `app_settings`, `webhook_events`, `webhook_audit_logs`, `notification_logs`, `promo_codes`, `feedback`
  - RLS policies enforced on all tables; service client used in webhooks and admin API

**Key Database Patterns:**
- `create_order_with_items` RPC - Atomic order creation (Stripe and COD paths both use this)
- `batch_update_stop_indices` RPC - Atomic route stop reordering
- `increment_driver_deliveries` RPC - Driver stats increment on route completion
- `calculate_driver_streak` RPC - Driver streak calculation for badges
- `webhook_events` table with UNIQUE on `event_id` for Stripe webhook idempotency
- `webhook_audit_logs` with Svix ID deduplication for Resend webhook idempotency

**File Storage:**
- Supabase Storage - `menu-photos` bucket for menu item images
  - Upload: via `src/lib/supabase/storage.ts`; server-side processing via `/api/admin/photos/process`
  - Processing: `sharp` for server-side WebP conversion + 4:3 crop; Canvas API for client-side resize
  - Max 10MB raw input → 2MB processed
  - Delivery photos: separate bucket, signed URLs via `src/lib/supabase/delivery-photos.ts`

**Caching:**
- Next.js `unstable_cache` for business rules (`src/lib/settings/business-rules.ts`) — 300s TTL, `"business-rules"` cache tag
- Tag-based invalidation: `revalidateTag("business-rules", { expire: 0 })` on admin delivery-days PATCH
- IndexedDB (`idb-keyval`) - Offline cart persistence on customer mobile

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Google OAuth + email/password)
  - SSR cookie-based sessions via `@supabase/ssr`
  - Auth callback: `/auth/callback` (reachable check in health endpoint)
  - `auth.getUser()` used for server-side auth in API routes (NOT `auth.admin.getUserById()` — service client only)

**Role System:**
- Roles: `admin`, `driver`, `customer` stored in `profiles.role`
- Auth guards:
  - `requireAdmin()` in `src/lib/auth/admin.ts`
  - `requireDriver()` in `src/lib/auth/` — returns `{ supabase, driverId }` tuple
  - `ensureProfile()` in `src/lib/auth/role-redirect.ts` — upserts profile on first checkout

## Delivery Scheduling / Business Rules

**Source of Truth:**
- `app_settings` table - Numeric settings (delivery hours, fees, thresholds, minimums)
- `delivery_days` table - Per-day configs (dayOfWeek, isActive, cutoffDay, cutoffHour, deliveryFeeCents, direction)
- `delivery_zones` table - Bearing ranges for East/West/South direction determination

**Business Rules Loading:**
- `getBusinessRules()` in `src/lib/settings/business-rules.ts` - `unstable_cache`d, 300s TTL
- Fetches `app_settings` (delivery category) + `delivery_days` + `delivery_zones` in parallel
- Defaults in `BUSINESS_RULES_DEFAULTS`: cutoffDay=5, cutoffHour=15, deliveryFeeCents=1500, freeDeliveryThreshold=$100, deliveryRadius=50mi, prepBuffer=30min

**Delivery Window Generation:**
- `generateTimeWindows()` in `src/lib/settings/generate-time-windows.ts` — 1-hour slots from start to end hour, shifted by prepTimeBufferMinutes

**Cutoff Validation (checkout flow in `src/app/api/checkout/session/route.ts`):**
1. Generate valid time windows from business rules
2. Validate submitted time window exists in generated set
3. Look up dayConfig from `deliveryDays` by dayOfWeek (via `getZonedDayOfWeek()`)
4. If dayConfig found: `isPastCutoffForDay(scheduledDate, dayConfig, now)` — throws `CUTOFF_PASSED`
5. If no dayConfig but deliveryDays is non-empty: returns `VALIDATION_ERROR` (not a delivery day)
6. Legacy fallback: `isPastCutoff()` with global cutoffDay/cutoffHour

**Timezone Handling:**
- All delivery times stored as ISO with LA offset via `toISOWithTimezone()` in `src/lib/utils/delivery-timezone.ts`
- Uses `Intl.DateTimeFormat` with `America/Los_Angeles` for DST-safe offset calculation
- `getZonedDayOfWeek()` in `src/lib/utils/delivery-dates.ts` - Uses `Intl.DateTimeFormat` parts to get LA day-of-week (avoids `getUTCDay()` timezone bugs)
- `TIMEZONE` constant referenced from `@/types/delivery`

**Distance-Based Fee Tiers:**
- `longDistanceThresholdMiles` (default 25mi): ≤25mi → standard fee ($15 or free if ≥$100); >25mi → flat $20, no free delivery
- Coverage: 50mi / 90min driving from kitchen (Covina CA)

**Delivery Directions:**
- `delivery_zones` table: bearing_start, bearing_end define East/West/South zones
- `getDirectionsForCoords()` computes bearing from kitchen to address
- `delivery_days.direction` field: `east | west | south | all` — determines which days customer can order

## Payment Processing Flow

**Stripe (card) path:**
1. `POST /api/checkout/session` validates cart, delivery window, address coverage
2. `create_order_with_items` RPC creates order with `payment_method=stripe`, status=`pending`
3. Stripe customer created/retrieved via `getOrCreateStripeCustomer()`
4. `stripe.checkout.sessions.create()` with 30-min expiry, idempotency key
5. `stripe_checkout_session_id` stored on order
6. Client redirects to Stripe hosted checkout
7. Stripe fires `checkout.session.completed` webhook to `/api/webhooks/stripe`
8. Handler updates order status to `confirmed`, sends confirmation email

**COD (Cash on Delivery) path:**
1. `POST /api/checkout/session` with `paymentMethod: "cod"`, checks `rules.codEnabled`
2. `createCODOrder()` in `src/lib/services/cod-order.ts` calls `create_order_with_items` with `payment_method=cod`
3. RPC sets status to `pending_approval` automatically
4. `after()` fires `sendCODOrderEmail()` (fire-and-forget, non-blocking)
5. Admin reviews and calls `POST /api/admin/orders/[id]/approve-cod`
6. Approval updates status to `confirmed`, sets `cod_approved_at` + `cod_approved_by`
7. Optimistic lock: `.eq("status", "pending_approval")` + `.select("id")` verifies row was updated
8. `after()` fires COD approval email with OrderConfirmation component

**Webhook Idempotency (Stripe):**
- `webhook_events` table with UNIQUE on `event_id`
- Atomic upsert with `ignoreDuplicates: true` + `.select("id")` — zero rows returned = duplicate → skip
- Returns 500 on DB errors to trigger Stripe retry

## Driver Route Data Flow

**Route States:** `planned` → `assigned` → `accepted` → `in_progress` → `completed`

**Stop States:** `pending` → `enroute` → `arrived` → `delivered | skipped`

**Route Lifecycle APIs:**
- `GET /api/driver/routes/upcoming` - Driver's upcoming routes
- `GET /api/driver/routes/active` - Current active route
- `POST /api/driver/routes/[routeId]/accept` - `assigned` → `accepted`
- `POST /api/driver/routes/[routeId]/start` - `planned|accepted` → `in_progress`; sets first stop to `enroute`; batch-transitions all route orders to `out_for_delivery`
- `PATCH /api/driver/routes/[routeId]/stops/[stopId]` - Updates stop status with transition validation; on `delivered` → updates order to `delivered`; finds next pending stop → sets to `enroute`
- `POST /api/driver/routes/[routeId]/complete` - `in_progress` → `completed`; calculates stats; calls `increment_driver_deliveries` RPC; checks/awards badges

**Route Data Shape (GET /api/driver/routes/[routeId]):**
- Fetches route + route_stops (ordered by stop_index) + orders + addresses + profiles (via `profiles!orders_user_id_fkey` FK hint)
- Delivery window (`delivery_window_start`, `delivery_window_end`) passed through to driver
- Photo URLs converted to signed URLs via `getDeliveryPhotoSignedUrl()`

**Route Optimization (admin-only):**
- `POST /api/admin/routes/optimize` triggers `optimizeRouteStops()` in `src/lib/services/route-optimization/optimizer.ts`
- Primary: Google Routes API v2 (`computeRoutes`) with `TRAFFIC_AWARE`, `optimizeWaypointOrder: true`, kitchen as origin+destination (round-trip to allow all stops as intermediates)
- Fallback: Nearest-neighbor with time-window urgency scoring
- Results: stop reordering via `batch_update_stop_indices` RPC, polyline saved to `routes.optimized_polyline`
- Time window violations reported but non-blocking

**Location Tracking:**
- `POST /api/driver/location` - Inserts into `location_updates` table
- Fields: lat, lng, accuracy, heading, speed, route_id
- Rate limited (in-memory fallback when Redis disabled)

**Admin Route Management:**
- `POST /api/admin/routes` - Create route (from admin route builder)
- `GET /api/admin/routes/[id]` - Full route detail with stops, driver, exceptions
- `PATCH /api/admin/routes/[id]` - Assign driver, change status, or reorder stops
- `DELETE /api/admin/routes/[id]` - Delete planned/assigned routes only

## Monitoring & Observability

**Error Tracking:**
- Sentry - All three runtimes configured (server, client, edge)
- `logger` utility in `src/lib/utils/logger.ts` - Structured logging with `logger.info()`, `logger.warn()`, `logger.error()`, `logger.exception()`
- Sentry tunnel at `/monitoring` routes requests through Next.js to bypass ad blockers

**Logs:**
- Structured JSON context on all logger calls (api, flowId, userId, orderId)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `vercel.json`, `@vercel/analytics`, `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`)
- `VERCEL_GIT_COMMIT_SHA` used as Sentry release identifier and version in health endpoint

**CI Pipeline:**
- `pnpm test:ci` - Bail-on-first-failure mode
- Chromatic - Visual regression via `chromatic.config.js`
- Lighthouse CI - `lighthouserc.js`

**Cron Jobs (`vercel.json`):**
- `GET /api/cron/delivery-reminders` at `0 15 * * *` (15:00 UTC daily)
- `GET /api/cron/admin-daily-digest?period=morning` at `0 14 * * *`
- `GET /api/cron/admin-daily-digest?period=evening` at `0 6 * * *`

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-only, bypasses RLS)
- `STRIPE_SECRET_KEY` - Stripe server key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `RESEND_API_KEY` - Resend email API key
- `RESEND_WEBHOOK_SECRET` - Resend webhook Svix secret
- `GOOGLE_MAPS_API_KEY` - Server-side Maps/Routes/Geocoding API key
- `NEXT_PUBLIC_APP_URL` - Full app URL for Stripe redirect URLs

**Optional env vars:**
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (disables Sentry if absent)
- `SENTRY_AUTH_TOKEN` - Source map upload during build
- `SENTRY_RELEASE` / `VERCEL_GIT_COMMIT_SHA` - Release identifier
- `GOOGLE_SITE_VERIFICATION` - Search Console verification
- `CHROMATIC_PROJECT_TOKEN` - Visual regression testing

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/stripe` - Stripe payment events; verified via `stripe.webhooks.constructEvent()`; idempotent via `webhook_events` table
- `POST /api/webhooks/resend` - Email delivery events; verified via Svix HMAC; deduplicates on `svix_id`; updates `notification_logs`; always returns 200

**Outgoing:**
- Stripe hosted checkout: customer redirected to `session.url`, returns to `/orders/[id]/confirmation?session_id=...`
- Cancel URL: `/checkout?cancelled=true`

---

*Integration audit: 2026-03-19*
