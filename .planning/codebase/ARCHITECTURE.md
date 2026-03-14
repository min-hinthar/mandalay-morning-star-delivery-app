# Architecture

**Analysis Date:** 2026-03-14

## Pattern Overview

**Overall:** Next.js 16 App Router with role-based route groups, server-first rendering, and a layered separation between UI components, business logic services, and data access via Supabase.

**Key Characteristics:**
- Server Components by default; `'use client'` only for interactive UI
- Role-gated route groups: `(admin)`, `(customer)`, `(driver)`, `(public)`, `(auth)`
- API routes co-located under `src/app/api/` mirroring domain resources
- Zustand stores for client-side state (cart, checkout, driver); TanStack React Query for server cache
- Supabase as the sole database with RLS enforcing row-level security; service client bypasses RLS for server-only operations
- Zod schemas for request validation; structured error responses via `apiError()`
- Sentry for error tracking and structured logging via `logger`

## Layers

**Presentation Layer (Pages + Components):**
- Purpose: Server-rendered pages and client-interactive components
- Location: `src/app/` (pages), `src/components/ui/` (70+ reusable components)
- Contains: Server Components (page.tsx), Client Components (with `'use client'`), error boundaries (error.tsx), loading states (loading.tsx)
- Depends on: Hooks, Stores, Lib utilities, Supabase server client
- Used by: End users via browser

**API Layer (Route Handlers):**
- Purpose: RESTful API endpoints for data mutations, webhooks, cron jobs
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts`), co-located validation schemas, helper functions
- Depends on: Auth guards (`src/lib/auth/`), Validations (`src/lib/validations/`), Services (`src/lib/services/`), Supabase clients
- Used by: Client components via fetch, webhooks (Stripe, Resend), cron jobs (Vercel)

**Auth Layer:**
- Purpose: Authentication, authorization, and role-based access control
- Location: `src/lib/auth/` (guards), `src/lib/supabase/middleware.ts` (session refresh), `src/app/auth/` (callback routes)
- Contains: `requireAdmin()`, `requireDriver()` guard functions, `getRoleDashboard()` role resolver, `ensureProfile()` self-healing profile creation
- Depends on: Supabase Auth, profiles table
- Used by: API routes, layout guards, auth callback

**Business Logic Layer:**
- Purpose: Domain logic for delivery scheduling, coverage checking, order calculations, route optimization
- Location: `src/lib/services/`, `src/lib/settings/`, `src/lib/utils/`
- Contains: Coverage service, COD order service, geocoding, route optimization, delivery date/zone calculations, business rules
- Depends on: Supabase, Google Maps API, Stripe
- Used by: API routes, Server Components

**State Management Layer:**
- Purpose: Client-side state for cart, checkout flow, and driver session
- Location: `src/lib/stores/` (Zustand), `src/lib/hooks/` (30+ custom hooks)
- Contains: `cart-store.ts` (persisted to IndexedDB), `checkout-store.ts` (sessionStorage), `driver-store.ts` (localStorage), `cart-animation-store.ts`
- Depends on: Zustand, zustand/middleware (persist)
- Used by: Client components

**Data Access Layer:**
- Purpose: Supabase client creation with typed Database interface
- Location: `src/lib/supabase/`
- Contains: `server.ts` (SSR cookie-based client, public client, service role client), `client.ts` (browser client), `middleware.ts` (session refresh), `storage.ts` / `driver-storage.ts` / `delivery-photos.ts` (Storage bucket access)
- Depends on: `@supabase/ssr`, `@supabase/supabase-js`, `src/types/database.ts`
- Used by: All layers that need data

**Validation Layer:**
- Purpose: Request/input validation with Zod schemas
- Location: `src/lib/validations/`
- Contains: Schema files per domain: `checkout.ts`, `address.ts`, `driver.ts`, `route.ts`, `settings.ts`, `order.ts`, `account.ts`, `analytics.ts`, `tracking.ts`, `customer-settings.ts`, `driver-api.ts`
- Depends on: Zod
- Used by: API routes

**Email Layer:**
- Purpose: Transactional email composition and sending
- Location: `src/lib/email/` (sending infrastructure), `src/emails/` (React Email templates)
- Contains: `send.ts` (Resend client with retry), template components (OrderConfirmation, DeliveryReminder, DriverInvite, AdminDailyDigest, etc.)
- Depends on: Resend, React Email, `@react-email/render`
- Used by: API routes, cron jobs, webhook handlers

## Data Flow

**Customer Order Flow:**

1. Customer browses menu (Server Component fetches `menu_items` + `featured_sections` from Supabase)
2. Customer adds items to cart (Zustand `cart-store` persisted to IndexedDB via `cart-idb-storage`)
3. Customer enters checkout (Server Component passes business rules; client Zustand `checkout-store` tracks step progression: address -> time -> payment)
4. Address validated via `POST /api/coverage/check` (Google Routes API for distance/duration, bearing-based zone matching)
5. Checkout submitted via `POST /api/checkout/session`:
   - Zod validates request body
   - Rate limited per user
   - Cart items re-validated against DB (price/availability)
   - Cutoff time checked per delivery day config
   - For Stripe: order created via `create_order_with_items` RPC, Stripe Checkout Session created, user redirected
   - For COD: order created with `pending_approval` status, admin notified via email
6. Stripe webhook (`POST /api/webhooks/stripe`) processes `checkout.session.completed` -- updates order status to `confirmed`, sends confirmation email
7. Admin assigns order to delivery route; driver receives assignment

**Auth Flow:**

1. User visits protected route -> middleware refreshes Supabase session cookies
2. If unauthenticated: middleware redirects `/admin` and `/driver` to `/login?next=...`
3. Login page offers: Magic link (OTP via email) or Google OAuth
4. Auth callback (`GET /auth/callback`):
   - Exchanges code for session
   - Handles driver invite flow (invite_id param)
   - Calls `ensureProfile()` to guarantee profile row exists
   - Calls `getRoleDashboard()` to determine redirect target based on role
   - admin -> `/admin`, driver -> `/driver` (or `/driver/onboard` / `/driver/deactivated`), customer -> `/menu`
5. Layout guards provide second layer of protection:
   - `(admin)/admin/layout.tsx`: checks profile.role === 'admin', redirects if not
   - `(driver)/driver/layout.tsx`: checks driver record existence and is_active status
   - `(customer)/layout.tsx`: requires authenticated user (any role)

**State Management:**

- **Cart:** Zustand store with IndexedDB persistence (`cart-idb-storage.ts`). Offline support: items flagged `pendingSync`, cleared when online event fires. Business rules (delivery fee, cutoffs, delivery days) injected from server via layout props.
- **Checkout:** Zustand store with sessionStorage persistence. Multi-step wizard: address -> time -> payment. Tracks address, delivery selection, tip, promo, payment method, customer info.
- **Driver:** Zustand store with localStorage persistence. Tracks current route, stop index, GPS location, online status.
- **Server Cache:** TanStack React Query with 5-minute staleTime, refetchOnWindowFocus disabled. Provider at `src/lib/providers/query-provider.tsx`.

**Admin Operations Flow:**

1. Admin dashboard (`(admin)/admin/page.tsx`) is a Server Component -- fetches KPIs, recent orders, popular items directly from Supabase
2. Admin API routes (`/api/admin/*`) protected by `requireAdmin()` auth guard
3. Route builder: admin creates delivery routes, adds stops (orders), optimizes via `/api/admin/routes/optimize`
4. Order management: status transitions, driver assignment, COD approval, refunds via dedicated API endpoints
5. Settings management: business rules stored in `app_settings` table, cached 5 minutes via `unstable_cache`

## Key Abstractions

**Supabase Client Variants:**
- Purpose: Different auth contexts for different execution environments
- Examples: `src/lib/supabase/server.ts` (`createClient`, `createPublicClient`, `createServiceClient`), `src/lib/supabase/client.ts` (`createClient`)
- Pattern: `createClient()` - SSR with cookies (for page/API route auth context); `createPublicClient()` - no cookies, anon key only (for cached data fetching); `createServiceClient()` - service role key, bypasses RLS (for webhooks, cron, admin operations that need cross-user access)

**Auth Guards:**
- Purpose: Protect API routes by role with consistent error responses
- Examples: `src/lib/auth/admin.ts` (`requireAdmin`), `src/lib/auth/driver.ts` (`requireDriver`)
- Pattern: Returns discriminated union `{ success: true, supabase, userId }` or `{ success: false, error, status }`. Callers destructure and return early on failure.

**Business Rules:**
- Purpose: Centralized, DB-driven configuration for delivery logic
- Examples: `src/lib/settings/business-rules.ts`
- Pattern: `getBusinessRules()` fetches from `app_settings`, `delivery_days`, `delivery_zones` tables in parallel. Cached 5 minutes via `unstable_cache` with `"business-rules"` tag. Returns typed `BusinessRules` object with defaults fallback.

**Rate Limiting:**
- Purpose: Per-route, per-role rate limiting
- Examples: `src/lib/rate-limit/` (index, config, check, client, identifiers)
- Pattern: Pre-configured limiters per endpoint type (checkoutLimiter, webhookLimiter, publicReadLimiter, etc.). `checkRateLimit()` returns `{ limited: boolean, response? }`. Currently in-memory fallback (Redis disabled).

**Structured Errors:**
- Purpose: Consistent API error format across all routes
- Examples: `src/lib/utils/api-error.ts`
- Pattern: `apiError(code, message, status, details?)` returns `NextResponse.json({ error: { code, message, details } }, { status })`. Error codes are typed: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`, `STRIPE_ERROR`, `CONFLICT`, `BAD_REQUEST`.

**Structured Logger:**
- Purpose: Sentry-integrated logging with context
- Examples: `src/lib/utils/logger.ts`
- Pattern: `logger.info/warn/error(message, context)` adds Sentry breadcrumbs; warn/error also capture as Sentry messages. `logger.exception(error, context)` captures exceptions. Context includes `userId`, `flowId`, `orderId`, `api` tags.

## Entry Points

**Root Layout (`src/app/layout.tsx`):**
- Triggers: Every page render
- Responsibilities: Font loading (Inter + Playfair Display), global CSS, provider tree (ThemeProvider -> DynamicThemeProvider -> QueryProvider -> LazyMotion -> AnimationProvider), ServiceWorkerRegistration, ToastProvider, OfflineIndicator, HeaderWrapper, UpdatePrompt, WebVitalsReporter, Vercel Analytics + SpeedInsights

**Route Group Layouts:**
- `src/app/(admin)/admin/layout.tsx`: Auth check, admin role verification, AdminNav sidebar, DomMaxProvider
- `src/app/(customer)/layout.tsx`: Auth check, business rules fetch, CustomerShell with delivery settings
- `src/app/(driver)/driver/layout.tsx`: Auth check, driver record/status verification, DriverNav bottom bar, DriverAvatarProvider, SimpleModeProvider, DriverShell, DomMaxProvider
- `src/app/(public)/layout.tsx`: No auth, business rules fetch, PublicShell with delivery settings
- `src/app/(auth)/layout.tsx`: No auth, DomMaxProvider wrapper only

**Auth Callback (`src/app/auth/callback/route.ts`):**
- Triggers: OAuth redirect, magic link click
- Responsibilities: Code exchange, session creation, profile sync, driver invite processing, role-based redirect

**Auth Confirm (`src/app/auth/confirm/route.ts`):**
- Triggers: Email confirmation links
- Responsibilities: Token verification, session creation

**Stripe Webhook (`src/app/api/webhooks/stripe/route.ts`):**
- Triggers: Stripe events (checkout.session.completed, expired, payment_failed, charge.refunded)
- Responsibilities: Signature verification, idempotent processing via `webhook_events` table, order status updates, email notifications

**Resend Webhook (`src/app/api/webhooks/resend/route.ts`):**
- Triggers: Email delivery events from Resend
- Responsibilities: Webhook signature verification, delivery status logging

**Cron Jobs:**
- `src/app/api/cron/delivery-reminders/route.ts`: Daily 8:00 AM PT, sends delivery day reminders
- `src/app/api/cron/admin-daily-digest/route.ts`: Twice daily (morning + evening), admin order summary email
- Configured in `vercel.json`

**Instrumentation (`instrumentation.ts`):**
- Triggers: Server/edge runtime startup
- Responsibilities: Sentry SDK initialization for Node.js and Edge runtimes

## Error Handling

**Strategy:** Layered error boundaries + structured API errors + Sentry integration

**Patterns:**
- **Page-level error boundaries:** Every route segment has an `error.tsx` (34 files). All delegate to `<RouteError>` component at `src/components/ui/RouteError.tsx` with context-specific messaging.
- **Not-found pages:** Custom `not-found.tsx` at root, admin, admin orders, and driver levels.
- **Loading states:** Every route segment has a `loading.tsx` (33 files) for Suspense boundaries.
- **API error responses:** `apiError(code, message, status)` returns typed JSON. Checkout route uses `errorResponse()` with additional error codes (`ITEM_UNAVAILABLE`, `CUTOFF_PASSED`, `OUT_OF_COVERAGE`, `COD_DISABLED`).
- **Try/catch + logger:** API routes wrap handlers in try/catch, call `logger.exception()` for Sentry capture, return 500 with generic message.
- **Webhook idempotency:** Stripe webhook uses `webhook_events` table with UNIQUE constraint to prevent duplicate processing.
- **Self-healing profiles:** `ensureProfile()` auto-creates missing profile rows with retry logic and unique constraint handling.

## Cross-Cutting Concerns

**Logging:** Sentry-integrated structured logger (`src/lib/utils/logger.ts`). All warn/error messages captured as Sentry events. Console output in development only. Context tags: `flowId`, `api`, `userId`, `orderId`.

**Validation:** Zod schemas in `src/lib/validations/` for all API request bodies. Schema + `safeParse()` at top of route handlers. Business rules validation (cutoffs, coverage) performed after schema validation.

**Authentication:** Two-layer auth: (1) Supabase middleware refreshes session cookies on every request and redirects unauthenticated users from `/admin` and `/driver` to `/login`. (2) Layout guards verify role via DB query and redirect unauthorized users to their correct dashboard.

**Rate Limiting:** In-memory sliding window rate limiting (Redis disabled). Pre-configured limiters per endpoint category. Applied at top of API route handlers via `checkRateLimit()`. Server Actions use `checkServerActionRateLimit()`.

**Security Headers:** CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy configured in `next.config.ts`. CSP violations reported to Sentry.

**Caching:** `unstable_cache` for business rules (5-minute TTL). TanStack React Query for client-side server state (5-minute staleTime). Static asset caching (fonts, icons: 1-year immutable). Next.js image optimization with 30-day cache TTL.

**PWA/Offline:** Service worker built separately via `scripts/build-sw.mjs` (Serwist). Registration via `src/lib/hooks/useServiceWorker.ts`. Offline indicator, update prompt, and customer offline sync store for cart persistence.

---

*Architecture analysis: 2026-03-14*
