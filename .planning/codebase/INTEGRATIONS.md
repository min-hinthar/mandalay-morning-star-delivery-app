# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**Payment Processing:**
- Stripe - Payment processing, checkout sessions, webhooks
  - SDK/Client: `stripe@20.1.2` (server), `@stripe/stripe-js@8.6.1` (client)
  - Auth: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Implementation: `src/lib/stripe/server.ts`, webhook at `src/app/api/webhooks/stripe/route.ts`
  - Features: Checkout sessions, payment intents, refunds, customer management

**Mapping & Geolocation:**
- Google Maps Platform - Geocoding, route optimization, delivery tracking
  - SDK/Client: `@react-google-maps/api@2.20.8`
  - Auth: `GOOGLE_MAPS_API_KEY`
  - APIs Used: Geocoding API, Routes API (or Distance Matrix API)
  - Implementation: `src/lib/hooks/usePlacesAutocomplete.ts`, coverage checks at `src/app/api/coverage/check/route.ts`

**Email Delivery:**
- Resend - Transactional email service
  - Auth: `RESEND_API_KEY`, `FROM_EMAIL`
  - Implementation: Supabase Edge Functions (`supabase/functions/send-order-confirmation/`, `supabase/functions/send-delivery-notification/`)
  - Triggered via: Stripe webhooks and database events

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js@2.90.1`, `@supabase/ssr@0.8.0`
  - Implementation: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (SSR)
  - Features: Row Level Security (RLS), real-time subscriptions, Edge Functions
  - Schema: `supabase/migrations/` (8 migrations: schema, functions/triggers, RLS, analytics, storage, testing, menu seed)

**File Storage:**
- Supabase Storage
  - Implementation: Storage policies in `supabase/migrations/004_storage.sql`
  - Usage: Delivery proof photos at `src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts`

**Caching:**
- Next.js built-in caching (no external cache service detected)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: `src/lib/auth/admin.ts`, `src/lib/auth/driver.ts`, `src/lib/hooks/useAuth.ts`
  - Features: Email/password auth, JWT tokens via cookies, role-based access (customer, driver, admin)
  - User management: `src/components/ui/auth/UserMenu.tsx`

## Monitoring & Observability

**Error Tracking:**
- Sentry
  - Auth: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
  - Implementation: `@sentry/nextjs@10.34.0`
  - Configuration: `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.ts` (source maps, tunnel route)
  - Debug endpoints: `src/app/api/debug/sentry/route.ts`, `src/app/(customer)/debug/sentry/page.tsx`

**Analytics:**
- Vercel Analytics
  - SDK: `@vercel/analytics@1.6.1`
  - Implementation: Injected in `src/app/layout.tsx`

**Performance:**
- Web Vitals
  - SDK: `web-vitals@5.1.0`
  - Implementation: Custom vitals endpoint at `src/app/api/analytics/vitals/route.ts`

**Logs:**
- Custom structured logging via `src/lib/utils/logger.ts`
- Integration with Sentry for exception tracking

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from @vercel/analytics, Next.js config optimizations)

**CI Pipeline:**
- GitHub Actions (directory exists: `.github/`)
- Husky pre-commit hooks (`.husky/`)
- Pre-commit: ESLint, Stylelint via lint-staged

**Build Tools:**
- Next.js Bundle Analyzer - Performance analysis
  - Config: `next.config.ts` with `@next/bundle-analyzer`
  - Trigger: `ANALYZE=true pnpm build`

**Visual Regression:**
- Chromatic
  - Config: `chromatic.config.js`
  - Integration with Storybook for component visual testing

**Performance Monitoring:**
- Lighthouse CI
  - Config: `lighthouserc.js`
  - Run: `pnpm lighthouse`

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-only)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `STRIPE_SECRET_KEY` - Stripe secret key (server-only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification
- `RESEND_API_KEY` - Resend email API key (used in Edge Functions)
- `FROM_EMAIL` - Email sender address
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry project DSN
- `SENTRY_AUTH_TOKEN` - Sentry auth token (CI/CD only)

**Optional env vars:**
- `NEXT_PUBLIC_APP_URL` - Application URL (defaults to localhost:3000)
- `SENTRY_DEBUG` - Enable Sentry debug mode

**Secrets location:**
- `.env.local` for local development (not committed)
- `.env.example` template with documentation
- Vercel environment variables for production

## Webhooks & Callbacks

**Incoming:**
- Stripe Webhooks - `src/app/api/webhooks/stripe/route.ts`
  - Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
  - Signature verification with `STRIPE_WEBHOOK_SECRET`
  - Triggers order status updates and email notifications

**Outgoing:**
- Supabase Edge Functions - HTTP requests to Edge Functions
  - `send-order-confirmation` - Triggered from Stripe webhook
  - `send-delivery-notification` - Triggered from delivery events
  - Endpoint pattern: `{SUPABASE_URL}/functions/v1/{function-name}`

**Database Triggers:**
- Real-time subscriptions via `src/lib/hooks/useTrackingSubscription.ts`
- Order tracking updates pushed to client

## Development Tools

**Code Quality:**
- Knip 5.82.1 - Dead code detection
  - Config: `knip.json`

**Browser Testing:**
- Playwright MCP - Test automation
  - Config: `.playwright-mcp/`

---

*Integration audit: 2026-01-30*
