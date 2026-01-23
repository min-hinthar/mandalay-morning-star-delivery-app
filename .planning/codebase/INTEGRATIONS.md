# External Integrations

**Analysis Date:** 2026-01-21

## APIs & External Services

**Payment Processing:**
- Stripe - Payment collection and order management
  - SDK/Client: `stripe` (20.1.2) server-side, `@stripe/stripe-js` (8.6.1) client-side
  - Auth: `STRIPE_SECRET_KEY` (server), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (public)
  - Webhook: `STRIPE_WEBHOOK_SECRET` for webhook signature verification
  - Endpoint: `src/app/api/webhooks/stripe/route.ts` - Handles checkout.session.completed, checkout.session.expired, payment_intent.payment_failed, charge.refunded
  - Customer management: `src/lib/stripe/server.ts` - getOrCreateStripeCustomer function
  - Checkout creation: `src/app/api/checkout/session/route.ts`
  - Integrates with order lifecycle: order status updated from "pending" → "confirmed" on successful payment

**Location & Maps:**
- Google Maps - Geocoding, coverage area calculation, route optimization
  - SDK/Client: `@react-google-maps/api` (2.20.8) for client-side map rendering
  - Auth: `GOOGLE_MAPS_API_KEY` (server-side only, not exposed to client)
  - Services:
    - Geocoding API: `src/lib/services/geocoding.ts` - geocodeAddress function
      - Used for address verification on checkout
      - Validates street-level specificity
      - Returns lat/lng and formatted address
    - Routes Optimization API: `src/lib/services/route-optimization.ts`
      - Optimizes delivery routes from kitchen to customer destinations
      - Uses kitchen location: 750 Terrado Plaza, Suite 33, Covina, CA 91723 (34.0894, -117.8897)
      - Validates stops for valid coordinates
      - Falls back to nearest-neighbor algorithm if API unavailable
    - Distance Matrix API: Used in route optimization
  - Client components:
    - `src/components/map/CoverageMap.tsx` - Coverage area visualization with custom map styles
    - `src/components/tracking/DeliveryMap.tsx` - Live driver location and delivery tracking
    - useJsApiLoader hook for lazy-loading Google Maps JS library

**Email Delivery:**
- Resend - Transactional email service for order confirmations
  - SDK/Client: Not directly imported in app; called via Supabase Edge Function
  - Auth: `RESEND_API_KEY` (server-side in Edge Functions)
  - Endpoint: `supabase/functions/send-order-confirmation/index.ts`
    - Triggered by Stripe webhook: `src/app/api/webhooks/stripe/route.ts` calls `sendOrderConfirmationEmail`
    - Called via `${SUPABASE_URL}/functions/v1/send-order-confirmation` HTTP POST
    - Sends HTML email with order summary, items, pricing, delivery window
    - Email sender: `FROM_EMAIL` env var or default "orders@mandalaymorningstar.com"
  - Flow: Stripe webhook → Supabase Edge Function → Resend API

## Data Storage

**Databases:**
- Supabase PostgreSQL - Primary data store
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side)
  - Server-side: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service role for webhooks/admin)
  - Client: `@supabase/supabase-js` (2.90.1), `@supabase/ssr` (0.8.0) for server-side auth
  - ORM: None - direct SQL queries via Supabase client
  - Schemas: `supabase/migrations/`
    - `000_initial_schema.sql` - Tables: profiles, addresses, menu_categories, menu_items, modifier_groups, modifier_options, orders, order_items, order_item_modifiers, delivery_routes, stops, drivers
    - `001_functions_triggers.sql` - Functions and triggers
    - `002_rls_policies.sql` - Row-level security policies
    - `003_analytics.sql` - Analytics queries
    - `004_storage.sql` - Storage buckets
    - `005_testing.sql` - Test utilities
    - `006_menu_seed.sql` - Menu data seeding
  - Authentication: Supabase Auth (email/password via `src/app/(auth)/` routes)
  - Real-time: Supabase real-time subscriptions (e.g., delivery tracking in `src/lib/hooks/useTrackingSubscription.ts`)
  - RLS: Enabled for multi-tenant data isolation (users can only see their own orders/addresses)
  - Service role usage: Stripe webhook handler uses service client to update orders (no user context)

**File Storage:**
- Supabase Storage (not actively used in codebase - configuration present in migrations)
- Local filesystem: Menu images referenced in database

**Caching:**
- None externally (TanStack React Query handles client-side caching with 5-minute stale time)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Custom implementation
  - Implementation: Email/password authentication
  - Session management: Cookie-based via `@supabase/ssr`
  - Client: `src/lib/supabase/client.ts` - createClient function
  - Server: `src/lib/supabase/server.ts` - createClient (with cookie management), createServiceClient (service role)
  - Middleware: `src/proxy.ts` - Auth middleware using `createServerClient`
  - Protected routes: `/cart`, `/checkout`, `/orders`, `/admin`, `/driver` redirect to login
  - Auth UI: `src/app/(auth)/` routes with forms (login, signup, forgot-password, reset-password)
  - Role-based access control: `src/lib/auth/driver.ts`, `src/lib/auth/admin.ts`

## Monitoring & Observability

**Error Tracking:**
- Sentry - Error tracking and performance monitoring
  - SDK: `@sentry/nextjs` (10.34.0)
  - DSN: `NEXT_PUBLIC_SENTRY_DSN`
  - Configs:
    - `sentry.server.config.ts` - Server-side initialization
      - Traces sample rate: 100% in development, 10% in production
      - Debug mode: Enabled in development or when `SENTRY_DEBUG=true`
      - V7 rollout monitoring with feature flag tagging
      - Filters common non-critical errors (network, browser navigation, AbortError)
    - `sentry.edge.config.ts` - Edge runtime configuration
  - Integration: Wrapped in `next.config.ts` with `withSentryConfig`
  - Source maps: Upload via `SENTRY_AUTH_TOKEN` (CI/CD only)
  - Tunnel route: `/monitoring` for ad-blocker bypass
  - Debug page: `src/app/(customer)/debug/sentry/page.tsx`

**Logs:**
- Custom logger: `src/lib/utils/logger.ts`
  - Methods: info, warn, error, exception
  - Tagged with context: api, flowId, orderId, eventType, eventId, etc.
  - Production: Console output (captured by Sentry)
  - Development: Console output

**Web Vitals:**
- Web Vitals 5.1.0 - Core Web Vitals reporting
  - Component: `src/components/WebVitalsReporter.tsx`
  - Reports FCP, LCP, CLS, FID, TTFB to Sentry

## CI/CD & Deployment

**Hosting:**
- Vercel (implied by Next.js 16 and Sentry integration)

**CI Pipeline:**
- Not explicitly configured in codebase (use Vercel's built-in CI)
- Build command: `pnpm build` (uses `next build`)
- Sentry env vars: Set in CI/CD secrets
  - `SENTRY_AUTH_TOKEN` - For source map upload
  - `SENTRY_RELEASE` - Set by CI

**Build Analysis:**
- Bundle analyzer available via `ANALYZE=true` env var
  - `npm run analyze` - Browser bundle analysis
  - `npm run analyze:server` - Server bundle analysis
  - Enabled in `next.config.ts`

## Environment Configuration

**Required env vars:**

Development:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (for webhook testing)
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `NEXT_PUBLIC_SENTRY_DSN`

Production:
- All of the above, plus:
- `SENTRY_AUTH_TOKEN` (for source map upload in CI)
- `NEXT_PUBLIC_APP_URL` (set to production domain)

**Secrets location:**
- Local development: `.env.local` (not committed)
- Production: Vercel environment variables dashboard
- Edge Functions: Set in Supabase project settings

**Testing env vars:**
- `GOOGLE_MAPS_API_KEY` - Mocked in tests as "test-google-maps-api-key"
- Stripe test keys: sk_test_, pk_test_ (provided in .env.example)

## Webhooks & Callbacks

**Incoming:**
- Stripe webhooks: `src/app/api/webhooks/stripe/route.ts`
  - Listens on `/api/webhooks/stripe`
  - Events handled:
    - `checkout.session.completed` - Updates order to "confirmed", triggers email
    - `checkout.session.expired` - Updates order to "cancelled"
    - `payment_intent.payment_failed` - Logs failure
    - `charge.refunded` - Updates order to "cancelled" (full refund), logs partial refunds
  - Signature verification: Stripe-Signature header validation
  - Idempotent: Uses order status checks to prevent duplicate processing

**Outgoing:**
- Supabase Edge Functions: `supabase/functions/send-order-confirmation/index.ts`
  - Called from webhook via HTTP POST to `${SUPABASE_URL}/functions/v1/send-order-confirmation`
  - Payload: `{ orderId: string }`
  - Response: Email sent confirmation
  - Error handling: Non-blocking (webhook doesn't fail if email fails)

**Real-time:**
- Supabase real-time subscriptions: `src/lib/hooks/useTrackingSubscription.ts`
  - Subscribes to driver location updates during delivery
  - Used in `src/app/(customer)/orders/[id]/tracking/page.tsx`

## Data Flows

**Order Creation:**
1. Customer adds items to cart (Zustand state)
2. POST `/api/checkout/session` with cart data, address ID
3. Server validates address, items, pricing
4. Creates Stripe checkout session with `order_id` in metadata
5. Returns session ID to client
6. Client redirects to Stripe Checkout (`@stripe/stripe-js`)
7. Stripe Checkout handles payment

**Order Confirmation (Webhook):**
1. Stripe sends webhook to `/api/webhooks/stripe` with event type `checkout.session.completed`
2. Webhook handler validates signature
3. Updates order status to "confirmed" in Supabase
4. Calls Supabase Edge Function to send confirmation email via Resend
5. Edge Function queries order + customer details, formats HTML email, calls Resend API
6. Email sent to customer

**Delivery Tracking:**
1. Admin assigns order to driver route
2. Driver app subscribes to real-time updates via Supabase
3. Driver location updates pushed to orders table
4. Customer page subscribes via `useTrackingSubscription` hook
5. Map updates with real-time driver location via `DeliveryMap` component

**Address Verification:**
1. Customer enters delivery address on checkout
2. POST `/api/addresses` with address data
3. Server calls Google Geocoding API to verify address
4. Validates street-level specificity
5. Stores lat/lng in addresses table
6. Checks coverage (kitchen location + max distance)
7. Sets `is_verified = true` if within coverage area

**Route Optimization:**
1. Admin submits delivery orders for a route
2. POST `/api/admin/routes/[id]/optimize` with stops
3. Server calls Google Routes API to optimize stop order
4. Falls back to nearest-neighbor algorithm if API fails
5. Updates delivery_routes table with optimized polyline and ETAs
6. Driver app uses optimized order for navigation

---

*Integration audit: 2026-01-21*
