# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Multi-tenant Next.js App Router application with a layered service architecture. Three distinct user portals (customer, admin, driver) share a Supabase Postgres backend. Business logic is enforced server-side in API routes using RLS + RPC. Client state is managed with Zustand stores and TanStack Query.

**Key Characteristics:**
- Server Components fetch initial data; Client Components handle interactivity
- API routes enforce auth via `requireAdmin()` / `requireDriver()` guards before any DB access
- All order creation goes through Supabase RPC (`create_order_with_items`) — never bare INSERT
- Delivery window timestamps are stored as full ISO strings with LA timezone offset
- Route optimization happens at creation time (auto) and on-demand via admin trigger
- Settings (`app_settings`, `delivery_days`, `delivery_zones`) are cached with `unstable_cache` (5-min TTL)

## Layers

**Route Layer (App Router):**
- Purpose: Page rendering and request entry
- Location: `src/app/(admin)/`, `src/app/(customer)/`, `src/app/(driver)/`, `src/app/(public)/`
- Contains: Server pages that fetch initial data, Client components for interactivity, `loading.tsx` / `error.tsx` per route
- Depends on: API layer (via fetch), lib utilities, Supabase client
- Used by: Browser / Vercel edge

**API Layer:**
- Purpose: Authenticated, validated HTTP handlers
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts`), co-located `helpers.ts`, `schemas.ts`, `types.ts`, `validation.ts`
- Depends on: Auth guards (`requireAdmin`, `requireDriver`), Supabase service client, lib/services, lib/utils
- Used by: Client Components (fetch), webhooks (Stripe/Resend), cron jobs

**Service Layer:**
- Purpose: Reusable business logic
- Location: `src/lib/services/`
- Contains: `cod-order.ts`, `coverage.ts`, `route-optimization/`, `cart-idb-storage.ts`
- Depends on: Supabase client, external APIs (Google Routes)
- Used by: API routes, some hooks

**Settings Layer:**
- Purpose: Cached business rules loaded from DB
- Location: `src/lib/settings/`
- Contains: `business-rules.ts` (fetches `app_settings`, `delivery_days`, `delivery_zones` in parallel, cached 5 min), `generate-time-windows.ts`
- Depends on: `createPublicClient` (anon key, no auth)
- Used by: Checkout page (SSR), checkout API route, any place needing delivery rules

**Client State Layer:**
- Purpose: In-memory UI state
- Location: `src/lib/stores/`
- Contains: `cart-store.ts` (cart items + fees), `checkout-store.ts` (multi-step form state), `driver-store.ts`, `cart-animation-store.ts`
- Depends on: Zustand + persist middleware
- Used by: Client Components across the app

**Hooks Layer:**
- Purpose: Data fetching + UI behavior encapsulation
- Location: `src/lib/hooks/`
- Contains: 30+ hooks (TanStack Query wrappers, delivery gate logic, driver route actions, etc.)
- Depends on: API layer (via fetch), stores, utility functions
- Used by: Client Components

**Utility Layer:**
- Purpose: Pure functions — no side effects, no DB
- Location: `src/lib/utils/`
- Contains: `delivery-dates.ts`, `delivery-zones.ts`, `delivery-timezone.ts`, `eta.ts`, `order.ts`, `route-transformers.ts`, `logger.ts`
- Depends on: Types only
- Used by: API routes, hooks, services, components

**Type Layer:**
- Purpose: Shared TypeScript definitions
- Location: `src/types/`
- Contains: `database.ts` (generated Supabase types), `delivery.ts`, `driver.ts`, `order.ts`, `tracking.ts`, `checkout.ts`
- Exempt from 400-line rule

## Data Flow

**Checkout → Order Creation (Stripe):**

1. `src/app/(customer)/checkout/page.tsx` (Server) — fetches `BusinessRules` from cache, passes `timeWindows`, `deliveryDays`, `deliveryZones` as props to `CheckoutClient`
2. `src/app/(customer)/checkout/CheckoutClient.tsx` — 3-step form: address → time → payment. State held in `useCheckoutStore` (Zustand, persisted)
3. `POST /api/checkout/session` — validates: time window, delivery day, cutoff, direction match, address coverage, cart items, promo code; calls `create_order_with_items` RPC; creates Stripe Checkout session; returns `sessionUrl`
4. Customer redirected to Stripe hosted page
5. `POST /api/webhooks/stripe` → `handleCheckoutSessionCompleted` — updates order `status = 'confirmed'`, triggers confirmation emails via `after()`
6. Customer lands on `/orders/[id]/confirmation`

**Checkout → Order Creation (COD):**

1-3. Same as above through validation
4. `createCODOrder()` in `src/lib/services/cod-order.ts` — calls same `create_order_with_items` RPC with `payment_method='cod'`; RPC sets `status = 'pending_approval'`
5. Admin must approve at `POST /api/admin/orders/[id]/approve-cod`
6. Confirmation + admin alert emails sent via `after()`

**Order → Route Assignment → Delivery:**

1. Admin creates route via `POST /api/admin/routes` — validates orders are `confirmed`/`preparing`, creates `routes` row with `status='planned'`, creates `route_stops` rows, auto-optimizes stop order via Google Routes API (with nearest-neighbor fallback)
2. Admin assigns driver (or route creation includes `driverId`)
3. Driver sees route in `/driver/route` — page SSR queries `routes` for today's date matching driver's `driver_id`
4. Driver accepts: `POST /api/driver/routes/[routeId]/accept`
5. Driver starts: `POST /api/driver/routes/[routeId]/start` — sets `routes.status='in_progress'`, first stop becomes `enroute`, all orders batch-updated to `out_for_delivery`
6. For each stop: `PATCH /api/driver/routes/[routeId]/stops/[stopId]` — transitions `pending→enroute→arrived→delivered`; on `delivered`, order `status='delivered'`, `delivered_at` timestamp set, next stop set to `enroute`
7. Driver completes: `POST /api/driver/routes/[routeId]/complete` — sets `routes.status='completed'`, calculates final stats, awards badges

**Delivery Window: Checkout to Driver View:**

1. Customer selects `scheduledDate` (YYYY-MM-DD) + `timeWindowStart`/`timeWindowEnd` (HH:MM strings from `generateTimeWindows`)
2. Checkout API converts via `toISOWithTimezone(scheduledDate, time)` → `"2026-03-19T14:00:00-07:00"` format
3. Stored in `orders.delivery_window_start` / `orders.delivery_window_end` as timezone-aware ISO strings
4. Route optimizer reads `delivery_window_start`/`delivery_window_end` from orders to detect time window violations
5. Driver route view (`/driver/route/page.tsx`) fetches `delivery_window_start`/`delivery_window_end` directly from `orders` joined through `route_stops`
6. Tracking API (`/api/tracking/[orderId]`) returns `deliveryWindowStart`/`deliveryWindowEnd` from `orders` directly to customer

**Customer Tracking:**

1. `GET /api/tracking/[orderId]` — returns order + route stop + driver info + live location
2. Driver location comes from `location_updates` table (latest row by `recorded_at` for the route's `route_id`)
3. ETA calculated client-side from haversine distance + `remainingStops` count (`src/lib/utils/eta.ts`)
4. `useTrackingSubscription` hook handles Supabase realtime subscriptions for live updates

**State Management:**
- Cart: Zustand `cart-store.ts` — persisted to localStorage and IndexedDB (`cart-idb-storage.ts`)
- Checkout: Zustand `checkout-store.ts` — persisted to sessionStorage; cleared on order success
- Driver: Zustand `driver-store.ts` — ephemeral, route progress state
- Server state: TanStack Query with API route fetching

## Key Abstractions

**BusinessRules:**
- Purpose: All configurable delivery settings in one object
- Examples: `src/lib/settings/business-rules.ts`, consumed by `src/app/(customer)/checkout/page.tsx`, `src/app/api/checkout/session/route.ts`
- Pattern: `unstable_cache` wraps `fetchBusinessRules()` (5-min TTL, tag: `business-rules`). Admin settings changes must call `revalidateTag('business-rules')`.

**DeliveryDayConfig:**
- Purpose: Per-day delivery schedule with direction, cutoff, and fee
- Examples: `src/types/delivery.ts`, populated from `delivery_days` table
- Pattern: Each active delivery day has `dayOfWeek`, `cutoffDay`, `cutoffHour`, `deliveryFeeCents`, `direction` (`east`|`west`|`south`|`all`)

**Route State Machine:**
- Purpose: Controls route lifecycle
- Examples: `src/types/driver.ts`
- Pattern: `planned → assigned → accepted → in_progress → completed`. Driver can only start from `planned` or `accepted`. Stops follow: `pending → enroute → arrived → delivered` (or `skipped`).

**Order Status Machine:**
- Purpose: Controls order lifecycle across both payment methods
- Pattern: COD: `pending_approval → confirmed → preparing → out_for_delivery → delivered`. Stripe: `pending → confirmed → preparing → out_for_delivery → delivered`. Cancellation possible from pre-delivery states.

**Auth Guards:**
- Purpose: Typed role-based access on every API route
- Examples: `src/lib/auth/admin.ts`, `src/lib/auth/driver.ts`
- Pattern: `const auth = await requireAdmin(); if (!auth.success) return error; const { supabase, userId } = auth;`

**Route Optimization:**
- Purpose: Reorder stops by travel efficiency, with time window awareness
- Examples: `src/lib/services/route-optimization/optimizer.ts`, called from `POST /api/admin/routes` and `POST /api/admin/routes/optimize`
- Pattern: Google Routes API primary; nearest-neighbor fallback. Reports `timeWindowViolations` but does not block route creation.

## Entry Points

**Customer Checkout:**
- Location: `src/app/(customer)/checkout/page.tsx` + `CheckoutClient.tsx`
- Triggers: Customer navigates to `/checkout` after filling cart
- Responsibilities: Server fetches business rules; client manages 3-step form; submits to `/api/checkout/session`

**Admin Route Builder:**
- Location: `src/app/(admin)/admin/routes/new/page.tsx` + `POST /api/admin/routes`
- Triggers: Admin creates a new delivery route
- Responsibilities: Select orders and driver → create route + stops → auto-optimize

**Driver Route Execution:**
- Location: `src/app/(driver)/driver/route/page.tsx` + `DriverRouteSwitch.tsx`
- Triggers: Driver navigates to `/driver/route`
- Responsibilities: SSR loads today's route; client handles start/stop progression

**Stripe Webhook:**
- Location: `src/app/api/webhooks/stripe/route.ts`
- Triggers: Stripe events (payment complete, expired, refund)
- Responsibilities: Update order status, trigger confirmation emails

**Cron:**
- Location: `src/app/api/cron/delivery-reminders/route.ts`, `src/app/api/cron/admin-daily-digest/route.ts`
- Triggers: Vercel Cron
- Responsibilities: Send pre-delivery reminder emails, admin digest

## Error Handling

**Strategy:** API routes use structured error responses `{ code, message }`. Errors thrown to Sentry via `logger.exception()`. UI uses React error boundaries per route (`error.tsx`).

**Patterns:**
- `logger.exception(error, context)` — captures to Sentry + structured log
- `logger.warn()` — non-fatal issues (race conditions, missing optional data)
- Webhook handlers: throw on DB errors so Stripe retries; never swallow into 200
- Order cleanup: independent try/catch per table so partial cleanup doesn't cascade

## Cross-Cutting Concerns

**Logging:** `src/lib/utils/logger.ts` — Sentry + structured console, all API routes use `logger.exception/error/warn/info`

**Validation:** Zod schemas in `src/lib/validations/` (e.g., `checkout.ts`, `route.ts`, `driver-api.ts`). All API route input parsed with `.safeParse()` before use.

**Authentication:**
- Customer: Supabase Auth cookie session, `createClient()` from `src/lib/supabase/server.ts`
- Admin: `requireAdmin()` — checks profile role = `'admin'`
- Driver: `requireDriver()` — checks `drivers` table for active driver record
- Service operations: `createServiceClient()` (service role key, bypasses RLS)

**Rate Limiting:** `src/lib/rate-limit/` — in-memory limiter (Redis Cloud not connected; null fallback at 15 req/min). Separate limiters per role: `adminLimiter`, `customerLimiter`, `driverActionLimiter`, `checkoutLimiter`.

**Delivery Window Consistency:** The window is stored once in `orders` as ISO strings with timezone offset. All reads (driver view, tracking API, emails, admin order detail) query directly from `orders` — no derived/re-calculated values. The only gap is time window display formatting: each consumer is responsible for parsing the ISO string for display.

---

*Architecture analysis: 2026-03-19*
