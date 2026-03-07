# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Next.js App Router with role-based route groups, server-first rendering, and Supabase as the data layer

**Key Characteristics:**
- Server Components fetch data; Client Components handle interactivity
- Route groups segment by user role: `(admin)`, `(customer)`, `(driver)`, `(public)`, `(auth)`
- API routes in `src/app/api/` serve as the backend; no separate backend service
- Supabase handles auth, database (Postgres), storage, and RLS enforcement
- Stripe handles payments via Checkout Sessions + webhook reconciliation
- Zustand stores for client-side state; TanStack Query for server-state caching
- Zod schemas validate all API input; server-authoritative pricing

## Layers

**Presentation (Pages & Components):**
- Purpose: Render UI, handle user interactions
- Location: `src/app/` (pages), `src/components/ui/` (components)
- Contains: Server Components (pages, layouts), Client Components (interactive UI)
- Depends on: Hooks, Stores, API routes (via fetch), Queries
- Used by: End users via browser

**API Layer (Route Handlers):**
- Purpose: RESTful endpoints for all data mutations and authenticated reads
- Location: `src/app/api/`
- Contains: Next.js Route Handlers (`route.ts`) with Zod validation
- Depends on: Supabase clients, Stripe SDK, auth guards, rate limiting, validations
- Used by: Client Components (via fetch/TanStack Query), Stripe webhooks, external services

**Auth Guards:**
- Purpose: Protect routes and API endpoints by role
- Location: `src/lib/auth/`
- Contains: `requireAdmin()` (`src/lib/auth/admin.ts`), `requireDriver()` (`src/lib/auth/driver.ts`), `ensureProfile()` and `getRoleDashboard()` (`src/lib/auth/role-redirect.ts`)
- Depends on: Supabase server client
- Used by: API routes, Server Component layouts

**Middleware (Session Refresh + Route Gating):**
- Purpose: Refresh Supabase auth cookies on every request; redirect unauthenticated users from protected routes
- Location: `proxy.ts` (root), `src/lib/supabase/middleware.ts`
- Contains: `updateSession()` — creates Supabase server client, calls `getUser()`, gates `/admin` and `/driver`
- Depends on: Supabase SSR client
- Used by: Next.js middleware system (named `proxy.ts` for Next.js 16 compatibility)

**Data Access (Supabase Clients):**
- Purpose: Typed Supabase client creation for browser, server, and service contexts
- Location: `src/lib/supabase/`
- Contains:
  - `client.ts` — browser client (anon key, cookie-based auth)
  - `server.ts` — server client (cookie-based), public client (no auth), service client (bypasses RLS)
  - `actions.ts` — server actions
  - `storage.ts`, `delivery-photos.ts`, `driver-storage.ts` — Supabase Storage wrappers
- Depends on: `@supabase/ssr`, `@supabase/supabase-js`, `src/types/database.ts`
- Used by: API routes, Server Components, auth guards

**Validation Layer:**
- Purpose: Zod schemas for API request/response validation
- Location: `src/lib/validations/`
- Contains: Per-domain schemas — `checkout.ts`, `order.ts`, `address.ts`, `driver.ts`, `route.ts`, `tracking.ts`, `analytics.ts`, `account.ts`, `customer-settings.ts`, `settings.ts`
- Depends on: Zod
- Used by: API route handlers (`.safeParse()`)

**State Management (Client):**
- Purpose: Client-side state for cart, checkout, driver workflows
- Location: `src/lib/stores/`
- Contains:
  - `cart-store.ts` — cart items, delivery settings, cutoff config (persisted to IndexedDB via `cart-idb-storage.ts`)
  - `checkout-store.ts` — checkout flow state
  - `driver-store.ts` — driver dashboard state
  - `cart-animation-store.ts` — cart animation coordination
- Depends on: Zustand, zustand/middleware (persist)
- Used by: Client Components via hooks

**Hooks Layer:**
- Purpose: Reusable client-side logic (40+ hooks)
- Location: `src/lib/hooks/`
- Contains: Auth (`useAuth`), data fetching (`useMenu`, `useCart`, `useAddresses`), UI (`useScrollSpy`, `useBodyScrollLock`, `useMediaQuery`), domain logic (`useDeliveryGate`, `useCoverageCheck`, `useLocationTracking`)
- Depends on: Stores, TanStack Query, Supabase client
- Used by: Client Components

**Business Rules:**
- Purpose: Centralized configurable business logic (delivery fees, cutoffs, time windows)
- Location: `src/lib/settings/`
- Contains: `business-rules.ts` (cached fetch from `app_settings` table), `generate-time-windows.ts`
- Depends on: Supabase public client, `unstable_cache`
- Used by: Layouts, API routes, Server Components

**Services:**
- Purpose: Complex business operations that span multiple concerns
- Location: `src/lib/services/`
- Contains:
  - `route-optimization/` — delivery route optimization with Google Maps integration
  - `offline-store/` — IndexedDB-based offline sync (db, stores, sync, retry)
  - `cart-idb-storage.ts` — IndexedDB adapter for cart persistence
  - `customer-offline-store.ts` — customer-side offline support
  - `geocoding.ts` — address geocoding
  - `coverage.ts` — delivery coverage calculation
- Depends on: Supabase, Google Maps APIs
- Used by: API routes, hooks, stores

**Email:**
- Purpose: Transactional email templates and sending
- Location: `src/emails/` (React Email templates), `src/lib/email/` (sending infrastructure)
- Contains: `OrderConfirmation.tsx`, `DeliveryReminder.tsx`, `DriverInvite.tsx`, `OrderCancellation.tsx`, `RefundNotification.tsx`
- Depends on: React Email, Resend
- Used by: API routes, webhooks

**Rate Limiting:**
- Purpose: Distributed rate limiting for all API routes
- Location: `src/lib/rate-limit/`
- Contains: Per-tier limiters (checkout, webhook, admin, driver, customer, public), `checkRateLimit()`, IP extraction
- Depends on: `@upstash/ratelimit`, `@upstash/redis`
- Used by: All API route handlers

**Types:**
- Purpose: TypeScript type definitions for database, domain models, cart
- Location: `src/types/`
- Contains: `database.ts` (Supabase-generated types with manual Row exports), `cart.ts`, `checkout.ts`, `delivery.ts`, `driver.ts`, `featured-sections.ts`, `layout.ts`, `menu.ts`, `order.ts`, `tracking.ts`, `analytics.ts`, `address.ts`
- Used by: Everything

## Data Flow

**Customer Order Flow:**

1. Customer browses menu (`/menu` — Server Component fetches via Supabase public client)
2. Adds items to cart (Zustand store persisted to IndexedDB)
3. Proceeds to checkout (`/checkout` — customer layout auth-gated)
4. Frontend POSTs to `src/app/api/checkout/session/route.ts`
5. API validates (Zod schema + business rules + address + promo + cart items from DB)
6. API creates order atomically via Supabase RPC `create_order_with_items`
7. API creates Stripe Checkout Session with order metadata
8. Customer redirected to Stripe Checkout
9. Stripe webhook (`src/app/api/webhooks/stripe/route.ts`) fires `checkout.session.completed`
10. Webhook handler updates order status, sends confirmation email via Resend

**Driver Delivery Flow:**

1. Admin creates delivery routes via `src/app/api/admin/routes/`
2. Route optimization service (`src/lib/services/route-optimization/`) orders stops
3. Driver views assigned route (`/driver/route`)
4. Driver updates stop status via `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts`
5. Driver uploads delivery photos via `src/app/api/driver/routes/[routeId]/stops/[stopId]/photo/route.ts`
6. Location tracked via `src/app/api/driver/location/route.ts`
7. Customers see real-time tracking via `src/app/api/tracking/[orderId]/route.ts`

**Auth Flow:**

1. User clicks login → Google OAuth via Supabase Auth
2. Callback hits `src/app/auth/callback/route.ts`
3. Exchanges code for session, checks driver invite flow
4. `getRoleDashboard()` determines redirect by role (admin/driver/customer)
5. Every request: `proxy.ts` → `updateSession()` refreshes session cookies
6. Protected layouts (`(admin)/admin/layout.tsx`, `(customer)/layout.tsx`) verify role server-side

**State Management:**
- Server state: TanStack Query with 5-minute stale time, no refetch on window focus
- Client state: Zustand stores (cart persisted to IndexedDB, checkout ephemeral)
- Server caching: `unstable_cache` for business rules (300s TTL, tag-based revalidation)

## Key Abstractions

**Auth Guards (`requireAdmin`, `requireDriver`):**
- Purpose: Discriminated union result pattern for API route auth
- Examples: `src/lib/auth/admin.ts`, `src/lib/auth/driver.ts`
- Pattern: Returns `{ success: true, supabase, userId }` or `{ success: false, error, status }` — callers check `.success` before proceeding

**API Error Responses:**
- Purpose: Consistent error shape across all API routes
- Examples: `src/lib/utils/api-error.ts`
- Pattern: `{ error: { code: ApiErrorCode, message: string, details?: unknown } }` with typed error codes

**Supabase Client Trio:**
- Purpose: Context-appropriate database access
- Examples: `src/lib/supabase/server.ts`
- Pattern: `createClient()` for authenticated server requests (cookie-based), `createPublicClient()` for unauthenticated reads, `createServiceClient()` for RLS bypass (webhooks, admin operations)

**Business Rules:**
- Purpose: Database-configurable business parameters with safe defaults
- Examples: `src/lib/settings/business-rules.ts`
- Pattern: Fetch from `app_settings` table, map DB keys to TypeScript interface, fallback to `BUSINESS_RULES_DEFAULTS` on error. Cached 300s via `unstable_cache`.

**Rate Limiting:**
- Purpose: Per-role, per-route rate limiting with fail-open
- Examples: `src/lib/rate-limit/`
- Pattern: `checkRateLimit({ limiter, identifier, role, route })` returns `{ limited: boolean, response? }`. Each API route picks appropriate limiter tier.

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Font loading, Providers wrapper (Theme → Query → LazyMotion → Animation), Header, Toast, ServiceWorker, offline indicators, Vercel Analytics/SpeedInsights

**Middleware (proxy.ts):**
- Location: `proxy.ts` (project root)
- Triggers: Every non-static request
- Responsibilities: Supabase session refresh, unauthenticated user gating for `/admin` and `/driver`

**Auth Callback:**
- Location: `src/app/auth/callback/route.ts`
- Triggers: OAuth redirect from Supabase/Google
- Responsibilities: Code exchange, driver invite processing, role-based redirect

**Stripe Webhook:**
- Location: `src/app/api/webhooks/stripe/route.ts`
- Triggers: Stripe events (checkout.session.completed, payment_intent.payment_failed, charge.refunded, checkout.session.expired)
- Responsibilities: Idempotent event processing, order status updates, email notifications

**Resend Webhook:**
- Location: `src/app/api/webhooks/resend/route.ts`
- Triggers: Email delivery status updates
- Responsibilities: Email delivery tracking

## Error Handling

**Strategy:** Structured error responses with typed codes; Sentry for observability

**Patterns:**
- API routes return `{ error: { code, message, details? } }` via `apiError()` or `errorResponse()` helpers
- Auth failures return discriminated unions (not exceptions)
- Supabase errors checked via `if (error)` pattern on every query
- Stripe webhook uses idempotent event processing (INSERT ON CONFLICT DO NOTHING)
- Try-catch at API route boundaries with `logger.exception()` for Sentry capture
- Graceful degradation: business rules fall back to defaults, featured sections degrade to empty

## Cross-Cutting Concerns

**Logging:** `src/lib/utils/logger.ts` — structured logger wrapping Sentry. Use `logger.info/warn/error/exception()` with context objects containing `userId`, `flowId`, `api`, `orderId`.

**Validation:** Zod schemas in `src/lib/validations/` for all API inputs. Pattern: `schema.safeParse(body)` at top of route handler, return 400 on failure.

**Authentication:** Three-tier: (1) Middleware refreshes session + gates routes, (2) Layouts verify role server-side, (3) API routes use `requireAdmin()`/`requireDriver()` guards. No client-side role checks for security.

**Rate Limiting:** Every API route calls `checkRateLimit()` with role-appropriate limiter. Uses Upstash Redis sliding window. Fails open on Redis timeout.

**Caching:** Server-side via `unstable_cache` (business rules: 300s, tag `business-rules`). Client-side via TanStack Query (5min stale time). Cart persisted to IndexedDB.

---

*Architecture analysis: 2026-03-06*
