# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Multi-tenant role-based SaaS with PWA delivery-ops layer

**Key Characteristics:**
- Next.js App Router with parallel route groups per user role: `(admin)`, `(customer)`, `(driver)`, `(public)`, `(auth)`
- Server Components as default; `"use client"` only where needed
- React Compiler enabled — no manual `useMemo`/`useCallback` needed
- Supabase as single backend: Auth, Postgres (RLS), Storage, Realtime
- Stripe for card payments; COD (cash-on-delivery) as alternative payment path

## Route Groups (App Router)

**`(admin)` — `/admin/*`:**
- Layout: `src/app/(admin)/admin/layout.tsx` — Server Component, auth guard (must be `role=admin`), redirects non-admins via `getRoleDashboard()`
- Shell: sidebar `AdminNav` (desktop) + `AdminMobileHeader` (mobile), main area scrollable
- Pages: dashboard, orders, routes, drivers, menu, categories, sections, photos, analytics, settings, ops, emails, feedback, ratings

**`(customer)` — `/account`, `/cart`, `/checkout`, `/orders`:**
- Layout: `src/app/(customer)/layout.tsx` — Server Component, requires auth, calls `getBusinessRules()`, passes delivery config into `CustomerShell`
- `CustomerShell` is a client component that seeds Zustand stores (cart settings, delivery days)
- Pages: account, cart, checkout (multi-step), order confirmation, order tracking

**`(driver)` — `/driver/*`:**
- Layout: `src/app/(driver)/driver/layout.tsx` — Server Component, verifies driver record + `is_active`, redirects to `/driver/onboard` or `/driver/deactivated` as needed
- Shell: `DriverShell` with `DriverNav` (bottom tabs), `SimpleModeProvider` (accessibility toggle), `DriverAvatarProvider`
- Pages: home (dashboard), route detail, stop detail, schedule, earnings, history, profile

**`(public)` — `/`, `/menu`, `/privacy`, `/terms`, `/driver/onboard`, `/driver/deactivated`:**
- Layout: `src/app/(public)/layout.tsx` — unauthenticated access allowed
- Wraps `PublicShell`
- Menu page is publicly accessible (read-only browsing); ordering requires auth

**`(auth)` — `/login`:**
- Magic link + Google OAuth via Supabase Auth
- `src/app/(auth)/login/LoginPageClient.tsx` handles auth state transitions: idle → magic-link form → confirmation → OAuth loading → success ceremony
- After auth, redirect via `getRoleDashboard()` to role-appropriate dashboard

## Layers

**Auth / Session Layer:**
- Purpose: Refresh sessions, gate protected routes
- Location: `src/lib/supabase/middleware.ts` — `updateSession()` called by Next.js middleware at project root
- Behavior: Unauthenticated requests to `/admin/*` or `/driver/*` redirect to `/login?next=<path>`. No role checks at this layer.
- Depends on: `@supabase/ssr`, cookie store on request

**Layout Guards (role enforcement):**
- Purpose: DB-level role check, deeper than middleware
- Admin: `src/app/(admin)/admin/layout.tsx` — checks `profiles.role = 'admin'`
- Driver: `src/app/(driver)/driver/layout.tsx` — checks `drivers` table + `is_active`
- Customer: `src/app/(customer)/layout.tsx` — auth only, no role check

**API Route Layer:**
- Location: `src/app/api/`
- Auth: `requireAdmin()` or `requireDriver()` from `src/lib/auth/` — checks JWT `app_metadata.role` first, DB fallback
- Rate limiting: `checkRateLimit()` from `src/lib/rate-limit/` — Upstash Ratelimit, null when Redis not configured, in-memory fallback at 15 req/min
- Validation: Zod schemas from `src/lib/validations/`
- Pattern: origin check → rate limit → auth → validate → DB operations → `after()` for emails

**Service Layer (`src/lib/services/`):**
- `coverage.ts` — Google Routes API v2 call for coverage checks; uses haversine for nearby check
- `route-optimization/optimizer.ts` — Google Routes API for TSP; nearest-neighbor fallback
- `cod-order.ts` — COD order creation flow
- `geocoding.ts` — Google Geocoding API
- `offline-store/` — IndexedDB queues for driver app (pending status updates, photos, locations)
- `cart-idb-storage.ts` — IndexedDB persistence for cart store

**State Layer (client-side):**
- Zustand stores: `src/lib/stores/cart-store.ts`, `checkout-store.ts`, `driver-store.ts`, `cart-animation-store.ts`
- React Query: server data fetching with 5 min stale time, no refetch on window focus
- No Redux; no Context API for data (only for UI concerns like theme, animation preferences)

**Settings Layer:**
- `src/lib/settings/business-rules.ts` — `getBusinessRules()` uses `unstable_cache` (5 min TTL, tag `"business-rules"`)
- Fetches `app_settings`, `delivery_days`, `delivery_zones` tables in parallel on every cold read

## Data Flow

**Customer Order Flow:**

1. Customer visits `/menu` (public RSC) — menu data fetched server-side from `/api/menu`
2. Adds items — `useCartStore.addItem()` writes to IDB via `cartIDBStorage`
3. Navigates to `/checkout` — `CustomerShell` has already seeded delivery settings into Zustand from layout
4. Address step: `usePlacesAutocomplete()` for Google Places, coverage check via `POST /api/coverage/check`
5. Time step: `useDeliveryGate`/`useDeliveryGateMultiDay` computes available dates from `deliveryDays` config and customer zone direction
6. Payment step: Stripe Checkout or COD
   - **Stripe**: `POST /api/checkout/session` → creates DB order (`status: 'pending'`) + Stripe Checkout Session → customer redirected to Stripe hosted page → Stripe webhook `checkout.session.completed` → order `status: 'confirmed'` → confirmation email via `after()`
   - **COD**: `POST /api/checkout/session` (COD path) → creates DB order (`status: 'pending_approval'`) → admin manually approves via `POST /api/admin/orders/:id/approve-cod` → `status: 'confirmed'`

**Stripe Webhook Data Flow:**

1. `POST /api/webhooks/stripe/route.ts` — verifies Stripe signature
2. Dispatches to `src/app/api/webhooks/stripe/handlers.ts` per event type:
   - `checkout.session.completed` → confirm order, send customer + admin emails
   - `checkout.session.expired` → cancel order
   - `payment_intent.payment_failed` → cancel on terminal failure codes
   - `charge.refunded` → cancel pre-delivery orders; preserve post-delivery orders
3. Emails sent via `after()` (Vercel fire-and-forget)

**Admin Route Building Flow:**

1. Admin creates route via `/admin/routes/new`
2. `POST /api/admin/routes` creates route record (`status: 'planned'`)
3. Add orders as stops via `POST /api/admin/routes/:id/stops`
4. Optimize: `POST /api/admin/routes/optimize` → `src/lib/services/route-optimization/optimizer.ts` → Google Routes API (nearest-neighbor fallback)
5. Assign driver: PATCH `POST /api/admin/routes/:id`
6. Route status: `planned` → `assigned` → `accepted` → `in_progress` → `completed`

**Driver Delivery Flow:**

1. Driver sees assigned route on `/driver`
2. Accepts via `POST /api/driver/routes/:routeId/accept` → route `status: 'accepted'`
3. Starts route via `POST /api/driver/routes/:routeId/start` → `status: 'in_progress'`
4. For each stop: update stop status, optionally upload delivery photo
5. Location updates pushed to `POST /api/driver/location` periodically
6. Supabase Realtime broadcasts location + stop updates to customers tracking their order
7. Route completes when all stops done via `POST /api/driver/routes/:routeId/complete`
8. Offline: IndexedDB queues pending updates (`src/lib/services/offline-store/`), syncs on reconnect

**Real-time Tracking:**

- `src/lib/hooks/useTrackingSubscription.ts` subscribes to Supabase Realtime channels
- Channels: order status changes, route stop status/ETA changes, driver location
- Falls back to 30-second polling if Realtime connection fails

**State Management:**

- `useCartStore` (Zustand + IDB persist): cart items, delivery settings, distance-based fee. Key: `mms-cart`
- `useCheckoutStore` (Zustand + sessionStorage): multi-step checkout state (address → time → payment). Key: `checkout-store`
- `useDriverStore` (Zustand + localStorage): current route ID, stop index, location, online status. Key: `mms-driver`
- React Query manages all server data (menu, orders, routes) with `queryKey` as cache key

## Entry Points

**Web Server:**
- Location: `src/app/layout.tsx`
- Providers wrapped: `ThemeProvider`, `DynamicThemeProvider`, `QueryProvider`, `LazyMotion` (Framer), `AnimationProvider`, `ToastProvider`
- PWA shell: `ServiceWorkerRegistration`, `OfflineIndicator`, `UpdatePrompt`
- Analytics: `@vercel/analytics`, `@vercel/speed-insights`

**API:**
- All in `src/app/api/` — Next.js App Router Route Handlers
- No custom Express server

**Webhooks:**
- `src/app/api/webhooks/stripe/route.ts` — Stripe signature verification, event dispatch
- `src/app/api/webhooks/resend/route.ts` — Resend email delivery events

**Cron Jobs:**
- `src/app/api/cron/delivery-reminders/route.ts` — delivery reminder emails
- `src/app/api/cron/admin-daily-digest/route.ts` — admin daily digest email

**Middleware:**
- Location: project root `middleware.ts` (calls `updateSession` from `src/lib/supabase/middleware.ts`)
- Runs on every request to refresh Supabase auth token in cookies

## Auth Flow

1. User visits protected route → middleware reads cookie, calls `supabase.auth.getUser()`
2. If unauthenticated → redirect to `/login?next=<path>`
3. Login page: magic link OR Google OAuth (Supabase handles OAuth flow)
4. After auth callback, `getRoleDashboard()` in `src/lib/auth/role-redirect.ts` queries `profiles.role`:
   - `admin` → `/admin`
   - `driver` → `/driver` (or `/driver/onboard` / `/driver/deactivated`)
   - `customer` (default) → `/menu`
5. Profile auto-created with `role: 'customer'` if missing (self-healing via `ensureProfile()`)
6. API routes use `requireAdmin()` or `requireDriver()` from `src/lib/auth/index.ts` — discriminated union result type (`AdminAuthResult`, `DriverAuthResult`)

**Supabase Client Types:**
- `createClient()` in `src/lib/supabase/server.ts` — cookie-based, respects RLS, used in RSC + API routes
- `createServiceClient()` in `src/lib/supabase/server.ts` — service role key, bypasses RLS, used in webhooks/cron/admin APIs
- `createClient()` in `src/lib/supabase/client.ts` — browser client for client components

## Order Lifecycle States

```
COD path:
  pending_approval → confirmed → preparing → out_for_delivery → delivered
                  ↘ cancelled (admin never approves or rejects)

Stripe path:
  pending → confirmed → preparing → out_for_delivery → delivered
         ↘ cancelled (webhook: expired session, terminal payment failure, or full refund pre-delivery)
```

Full state set (DB enum `order_status`):
`pending_approval` | `pending` | `confirmed` | `preparing` | `out_for_delivery` | `delivered` | `cancelled`

Post-delivery refund does NOT change order status (preserves delivery record).

Display labels in `src/types/order.ts` (`ORDER_STATUS_LABELS`).

## Route Lifecycle States

DB enum `route_status`:
`planned` → `assigned` → `accepted` → `in_progress` → `completed`

## Delivery Routing Logic

**Zone assignment (`src/lib/utils/delivery-zones.ts`):**
1. Geocode customer address → lat/lng
2. Compute Haversine distance from kitchen (Covina, CA coordinates in `src/lib/constants/kitchen.ts`)
3. If distance ≤ 15 mi: "nearby" — eligible for all delivery days
4. If distance > 15 mi: compute bearing from kitchen using forward azimuth formula (`calculateBearing()`)
5. Match bearing against `delivery_zones` table: East (350°–80°, wraps 0°), West (230°–320°), South (140°–220°)
6. Bearing in gap between zones: assign two closest adjacent zones
7. Filter `delivery_days` by matching direction + `direction="all"` (Saturday always runs regardless of zone)

**Coverage check (`src/lib/services/coverage.ts`):**
1. Call Google Routes API v2 (`computeRoutes`) from kitchen to destination
2. Check: distance ≤ 50 mi AND duration ≤ 90 min (limits in `src/types/address.ts` `COVERAGE_LIMITS`)
3. On pass: compute fee tier (standard ≤25 mi vs extended >25 mi), eligible delivery days
4. Failure reasons: `DISTANCE_EXCEEDED`, `DURATION_EXCEEDED`, `ROUTE_FAILED`, `GEOCODE_FAILED`

**Delivery fee rules:**
- >25 mi: flat $20 (no free delivery, `longDistanceFeeCents`)
- ≤25 mi: $15 standard (`deliveryFeeCents`) OR free if subtotal ≥ $100 (`freeDeliveryThresholdCents`)
- All values DB-driven via `app_settings` table; cached 5 min via `unstable_cache`

**Cutoff enforcement (`src/lib/utils/delivery-dates.ts`):**
- Per-day cutoff: `delivery_days.cutoff_day` (day of week) + `delivery_days.cutoff_hour` (LA timezone)
- Timezone-safe via `getZonedParts()` using `Intl.DateTimeFormat` — never `getUTCDay()`
- 10-second safety buffer (`CUTOFF_SAFETY_BUFFER_MS`) before hard cutoff

## Route Optimization (`src/lib/services/route-optimization/optimizer.ts`)

- Primary: Google Routes API v2 `computeRoutes` with `optimizeWaypointOrder: true`
- Strategy: kitchen as both origin AND destination (round-trip); all delivery stops as intermediates; return leg stripped
- Fallback: nearest-neighbor algorithm with time-window awareness + 1.3x road-factor correction for Haversine distances
- Time window violations surfaced to admin after optimization

## Caching Strategy

- Business rules: `unstable_cache` 5 min, tag `"business-rules"` — invalidated by admin settings save via `revalidateTag()`
- Menu: React Query 5 min stale, `queryKey: ["menu"]`
- React Query default: `staleTime: 5 * 60 * 1000`, `refetchOnWindowFocus: false`
- Driver offline: IndexedDB stores at `src/lib/services/offline-store/`
- Cart: IndexedDB via `src/lib/services/cart-idb-storage.ts`

## Error Handling

**Strategy:** Fail explicitly; no silent swallowing

**Patterns:**
- API routes: `apiError()` helper from `src/lib/utils/api-error.ts` returns structured `{ error: { code, message } }`
- Webhook handlers: throw on DB errors (returns 500) so Stripe retries; never swallow into 200
- Server Actions: return `ActionResult` (`{ error?, success? }`) from `src/lib/supabase/actions.ts`
- Client: React Query error state surfaces to components; toast via `useToastV8`
- Next.js `error.tsx` files at each route segment for boundary error UI
- Sentry for exception capture

## Cross-Cutting Concerns

**Logging:** `src/lib/utils/logger.ts` — structured logger with `api`, `flowId`, `error` fields; Sentry integration
**Validation:** Zod schemas in `src/lib/validations/` — used on both client (React Hook Form) and server (API route parsing)
**Rate Limiting:** `src/lib/rate-limit/check.ts` — Upstash Ratelimit; null-safe in-memory fallback at 15 req/min per identifier
**Authentication:** `requireAdmin()`, `requireDriver()` from `src/lib/auth/` — discriminated union result type
**Emails:** `src/lib/email/` — Resend + React Email; all sends via `sendEmail()` with idempotency key + audit log entry
**PWA:** Serwist service worker; offline fallback for driver app via IndexedDB sync queue (`src/lib/services/offline-store/`)
**Design tokens:** `src/lib/design-system/tokens/` — 62+ tokens enforced via ESLint rules

---

*Architecture analysis: 2026-03-18*
