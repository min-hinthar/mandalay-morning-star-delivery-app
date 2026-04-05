# Architecture

**Analysis Date:** 2026-04-04

## Pattern Overview

**Overall:** Feature-segmented Next.js App Router monolith with role-based route groups

**Key Characteristics:**
- Four distinct user roles with isolated route groups: `(admin)`, `(customer)`, `(driver)`, `(public)`
- API layer is flat REST under `src/app/api/` mirroring the domain model
- Client state via Zustand stores; server state via TanStack Query; no shared state layer between roles
- Supabase RLS enforces data isolation at the DB layer — API routes perform role checks on top
- React Compiler enabled — no manual `useMemo`/`useCallback` needed on client components

## Layers

**Route Groups (UI):**
- Purpose: Render pages, enforce auth, compose feature components
- Location: `src/app/(admin)/`, `src/app/(customer)/`, `src/app/(driver)/`, `src/app/(public)/`
- Contains: Server Components for data fetching, Client Components for interaction, route-level layouts with auth guards
- Depends on: `src/components/ui/`, `src/lib/hooks/`, `src/lib/stores/`
- Used by: Browser/PWA clients

**API Routes:**
- Purpose: REST endpoints — auth-gated, rate-limited, validated
- Location: `src/app/api/`
- Contains: `route.ts` (handler), `validation.ts` (Zod schemas), `helpers.ts` (shared logic), `types.ts` (route-specific types)
- Depends on: `src/lib/auth/`, `src/lib/supabase/server.ts`, `src/lib/rate-limit/`, `src/lib/validations/`
- Used by: Client pages (fetch calls), webhook handlers (Stripe, Resend), cron jobs

**UI Components:**
- Purpose: Reusable domain and primitive components
- Location: `src/components/ui/`
- Contains: Domain components organized by role/feature (`admin/`, `cart/`, `checkout/`, `driver/`, `menu/`, `orders/`), plus shared primitives (`button`, `badge`, `dialog`, etc.)
- Depends on: `src/lib/hooks/`, `src/lib/stores/`, `src/lib/utils/`
- Used by: Route group pages

**Library / Services:**
- Purpose: Shared business logic, clients, utilities, and third-party wrappers
- Location: `src/lib/`
- Contains: Supabase clients (`supabase/`), auth guards (`auth/`), rate limiting (`rate-limit/`), email service (`email/`), Stripe client (`stripe/`), settings/business rules (`settings/`), Zustand stores (`stores/`), React Query hooks (`hooks/`), Zod validators (`validations/`), utility functions (`utils/`)
- Depends on: External SDKs, Supabase types from `src/types/database.ts`
- Used by: API routes, components, other lib modules

**Database (Supabase/Postgres):**
- Purpose: Persistent store with RLS policies for row-level isolation
- Location: `supabase/migrations/` (65 migration files)
- Contains: Schema, RLS policies, functions/triggers, seed data, indexes
- Key tables: `orders`, `order_items`, `profiles`, `drivers`, `routes`, `route_stops`, `featured_sections`, `menu_items`, `menu_categories`, `app_settings`, `notification_logs`, `webhook_events`, `location_updates`

**Emails:**
- Purpose: Transactional email templates (React Email)
- Location: `src/emails/`
- Contains: Template components (`OrderConfirmation.tsx`, `OutForDelivery.tsx`, `OrderDelivered.tsx`, `DriverInvite.tsx`, etc.), `helpers.ts`, `fixtures.ts`
- Depends on: `src/lib/email/` service (Resend SDK wrapper)

## Data Flow

**Customer Order Flow:**

1. Customer browses menu via `src/app/(public)/menu/page.tsx` (Server Component, fetches via `src/lib/queries/sections.ts`)
2. Cart state managed by `src/lib/stores/cart-store.ts` (Zustand, persisted to IndexedDB via `src/lib/services/cart-idb-storage.ts`)
3. Checkout POSTs to `src/app/api/checkout/session/route.ts` — validates cart, resolves address distance, creates Stripe session or COD order
4. Stripe redirects back; `src/app/api/webhooks/stripe/route.ts` handles `checkout.session.completed`, creates order record
5. Admin sees order at `src/app/(admin)/admin/orders/page.tsx`; updates status via `src/app/api/admin/orders/[id]/status/route.ts`
6. Status update triggers email via `src/lib/email/send.ts` (Resend)

**Driver Delivery Flow:**

1. Admin creates route at `src/app/(admin)/admin/routes/new/` → `src/app/api/admin/routes/route.ts`
2. Route optimization via `src/lib/services/route-optimization/` (Google Routes API)
3. Driver sees assigned route at `src/app/(driver)/driver/route/page.tsx`; accepts via `src/app/api/driver/routes/[routeId]/accept/route.ts`
4. Driver POSTs location updates to `src/app/api/driver/location/route.ts` (stored in `location_updates` table)
5. Customer polls `src/app/api/tracking/[orderId]/route.ts` for live ETA
6. Driver marks stop complete → order status transitions to `delivered` → email sent

**Admin Auth Flow:**

1. Middleware (`src/lib/supabase/middleware.ts`) refreshes Supabase session on every request; redirects unauthenticated to `/login` for `/admin` and `/driver` paths
2. Layout server component at `src/app/(admin)/admin/layout.tsx` re-validates role from `profiles.role`
3. API routes call `requireAdmin()` from `src/lib/auth/admin.ts` — checks JWT `app_metadata.role` first, falls back to DB query

**State Management:**

- Cart: `src/lib/stores/cart-store.ts` (Zustand + IndexedDB persist)
- Checkout: `src/lib/stores/checkout-store.ts` (Zustand, session-scoped)
- Driver: `src/lib/stores/driver-store.ts` (Zustand)
- Cart animation: `src/lib/stores/cart-animation-store.ts` (Zustand, ephemeral)
- Server state: TanStack Query via hooks in `src/lib/hooks/` (e.g., `useMenu.ts`, `useAddresses.ts`)

## Key Abstractions

**Supabase Client Factory:**
- Purpose: Three client types for different trust levels
- Location: `src/lib/supabase/server.ts`
- Pattern: `createClient()` (anon+session, Server Components/API), `createPublicClient()` (no cookies, public data), `createServiceClient()` (service role, bypasses RLS — for webhooks and crons only)

**Auth Guards:**
- Purpose: Typed auth result pattern for API routes
- Location: `src/lib/auth/admin.ts`, `src/lib/auth/driver.ts`
- Pattern: `requireAdmin()` / `requireDriver()` return `{ success: true, supabase, userId }` or `{ success: false, error, status }` — callers pattern-match on `auth.success`

**Rate Limiter:**
- Purpose: Distributed sliding-window rate limits per endpoint type
- Location: `src/lib/rate-limit/`
- Pattern: `checkRateLimit({ limiter, identifier, role, route })` returns `{ limited, response }` — callers do `if (rl.limited) return rl.response`

**Email Service:**
- Purpose: Resend API wrapper with idempotency, CC, and notification preference checks
- Location: `src/lib/email/`
- Pattern: `sendEmail({ to, subject, react, type, orderId, userId, mandatory, idempotencyKey })` — `mandatory: true` bypasses notification preferences

**Validation Layer:**
- Purpose: Zod schemas for all API request bodies
- Location: `src/lib/validations/`
- Pattern: Schema defined per domain (`checkout.ts`, `address.ts`, `order.ts`), imported into route handlers and validated with `.safeParse()`

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Responsibilities: Font loading, PWA manifest, global providers (`Providers` wrapper — ThemeProvider, QueryProvider, LazyMotion), ServiceWorkerRegistration, OfflineIndicator, ToastProvider

**Providers:**
- Location: `src/app/providers.tsx`
- Triggers: Mounted once at root
- Responsibilities: ThemeProvider → DynamicThemeProvider → QueryProvider → LazyMotion → AnimationProvider

**Middleware:**
- Location: `src/lib/supabase/middleware.ts` (exported via `src/proxy.ts`)
- Triggers: Every request (except static assets, images)
- Responsibilities: Refresh Supabase auth session, redirect unauthenticated users from `/admin` and `/driver` to `/login`

**Webhook Handlers:**
- Location: `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/resend/route.ts`
- Triggers: Stripe payment events, Resend delivery events
- Responsibilities: Signature verification, idempotency via `webhook_events` table, event dispatch to handlers

**Cron Jobs:**
- Location: `src/app/api/cron/admin-daily-digest/route.ts`, `src/app/api/cron/delivery-reminders/route.ts`
- Triggers: Vercel Cron (Bearer token auth)
- Responsibilities: Daily digest email to admins, delivery reminder emails to customers

## Error Handling

**Strategy:** Structured error responses at API boundaries; Sentry for server exceptions; toast notifications for user-facing errors

**Patterns:**
- API routes return `{ error: { code, message } }` with appropriate HTTP status; `src/lib/utils/api-error.ts` provides `apiError()` helper
- `logger.exception(err, context)` in catch blocks — routes to Sentry in production
- Webhook handlers return `500` on DB errors to trigger Stripe retry (not swallowed into `200`)
- Client components catch fetch errors and set local error state; display via `InlineErrorCard` or `toast()`
- Route-level `error.tsx` files in each route group for unhandled React errors
- Global fallback at `src/app/global-error.tsx`

## Cross-Cutting Concerns

**Logging:** `src/lib/utils/logger.ts` — structured JSON logger routing to Sentry in production; `console.*` in development. `console.log` stripped in production build by React Compiler config.

**Validation:** Zod schemas in `src/lib/validations/` (API request bodies) and `src/lib/validators/` (domain validators). All API mutations validate request body with `.safeParse()` before touching DB.

**Authentication:** Three-layer — middleware session refresh → layout server component role check → API route `requireAdmin()`/`requireDriver()`. Supabase JWT `app_metadata.role` used as fast path; DB profile query as fallback.

**Rate Limiting:** `src/lib/rate-limit/` — Upstash Redis sliding window (in-memory fallback when Redis unavailable). Named limiters per endpoint category: `checkoutLimiter`, `adminLimiter`, `webhookLimiter`, `customerLimiter`, `publicReadLimiter`, etc.

**Offline Support:** Serwist PWA service worker (`public/sw.js`, built via `scripts/build-sw.mjs`). Cart persists to IndexedDB. `OfflineIndicator` component and `useCustomerOfflineSync` hook manage sync state.

---

*Architecture analysis: 2026-04-04*
