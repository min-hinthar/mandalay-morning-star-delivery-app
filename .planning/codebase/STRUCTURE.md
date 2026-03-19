# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
project-root/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (admin)/admin/           # Admin dashboard portal
│   │   ├── (auth)/login/            # Shared login page
│   │   ├── (customer)/              # Customer-facing pages
│   │   ├── (driver)/driver/         # Driver mobile interface
│   │   ├── (public)/                # Public pages + driver onboard
│   │   ├── api/                     # API route handlers
│   │   ├── layout.tsx               # Root layout (fonts, providers)
│   │   ├── providers.tsx            # Client providers (Query, Motion, Theme)
│   │   └── globals.css              # Global styles + Tailwind v4 @theme
│   ├── components/
│   │   └── ui/                      # 70+ UI components
│   ├── emails/                      # React Email templates
│   ├── lib/
│   │   ├── auth/                    # Role-based auth guards
│   │   ├── constants/               # Kitchen coords, etc.
│   │   ├── hooks/                   # 30+ custom React hooks
│   │   ├── providers/               # QueryProvider, AnimationProvider
│   │   ├── queries/                 # TanStack Query definitions
│   │   ├── rate-limit/              # Rate limiter instances
│   │   ├── services/                # Business logic services
│   │   ├── settings/                # BusinessRules cache
│   │   ├── stores/                  # Zustand state stores
│   │   ├── stripe/                  # Stripe client + promo
│   │   ├── supabase/                # Supabase client factories
│   │   ├── utils/                   # Pure utility functions
│   │   └── validations/             # Zod schemas
│   └── types/                       # Shared TypeScript types
├── supabase/
│   └── migrations/                  # 50+ SQL migration files
├── e2e/                             # Playwright tests
├── data/                            # Menu seed YAML
├── docs/                            # Architecture guides
├── scripts/                         # build-sw.mjs (PWA service worker)
└── .planning/                       # GSD planning files
```

## Directory Purposes

**`src/app/(admin)/admin/`:**
- Purpose: Admin dashboard for managing orders, routes, drivers, menu, settings
- Contains: Server pages + co-located Client components per section
- Key files: `admin/routes/new/page.tsx`, `admin/ops/OpsCenter.tsx`, `admin/orders/[id]/page.tsx`, `admin/settings/page.tsx`

**`src/app/(customer)/`:**
- Purpose: Customer shopping experience
- Contains: Menu browsing, cart, checkout flow, order history, order tracking
- Key files: `checkout/page.tsx`, `checkout/CheckoutClient.tsx`, `orders/[id]/tracking/page.tsx`, `CustomerShell.tsx`

**`src/app/(driver)/driver/`:**
- Purpose: Driver mobile PWA interface
- Contains: Route execution, stop management, earnings, schedule, profile
- Key files: `route/page.tsx`, `route/DriverRouteSwitch.tsx`, `route/[stopId]/page.tsx`, `schedule/SchedulePageClient.tsx`

**`src/app/api/`:**
- Purpose: All backend API endpoints
- Contains: Route handlers, co-located types/schemas/helpers
- Key subtrees: `api/checkout/session/`, `api/admin/routes/`, `api/driver/routes/`, `api/tracking/`, `api/webhooks/stripe/`, `api/cron/`

**`src/lib/auth/`:**
- Purpose: Role-based auth guards for API routes
- Contains: `admin.ts`, `driver.ts`, `role-redirect.ts`
- Key files: `src/lib/auth/admin.ts` — `requireAdmin()`, `src/lib/auth/driver.ts` — `requireDriver()`

**`src/lib/services/`:**
- Purpose: Reusable server-side business logic
- Contains: `cod-order.ts`, `coverage.ts`, `geocoding.ts`, `route-optimization/`
- Key files: `src/lib/services/cod-order.ts` — COD order creation, `src/lib/services/route-optimization/optimizer.ts` — Google Routes API + fallback

**`src/lib/settings/`:**
- Purpose: Cached business rules from DB
- Contains: `business-rules.ts`, `generate-time-windows.ts`, `index.ts`
- Key files: `src/lib/settings/business-rules.ts` — `getBusinessRules()` with 5-min unstable_cache

**`src/lib/stores/`:**
- Purpose: Client-side Zustand state
- Contains: `cart-store.ts`, `checkout-store.ts`, `driver-store.ts`, `cart-animation-store.ts`

**`src/lib/utils/`:**
- Purpose: Pure functions with no side effects
- Contains: `delivery-dates.ts`, `delivery-zones.ts`, `delivery-timezone.ts`, `eta.ts`, `order.ts`, `route-transformers.ts`, `logger.ts`, `origin-check.ts`

**`src/lib/validations/`:**
- Purpose: Zod schemas for API input validation
- Key files: `checkout.ts` (`createCheckoutSessionSchema`), `route.ts` (`createRouteSchema`, `addStopsSchema`), `driver-api.ts` (`updateStopStatusSchema`, `isValidStatusTransition`)

**`src/types/`:**
- Purpose: Shared TypeScript definitions — exempt from 400-line limit
- Key files: `database.ts` (Supabase-generated), `delivery.ts` (`DeliveryDayConfig`, `DeliveryZoneConfig`, `TimeWindow`), `driver.ts` (`RouteStatus`, `RouteStopStatus`), `order.ts` (`OrderStatus`, `Order`), `tracking.ts`

**`src/emails/`:**
- Purpose: React Email templates for transactional emails
- Key files: `OrderConfirmation.tsx`, `AdminNewOrderAlert.tsx`, `RefundNotification.tsx`

**`supabase/migrations/`:**
- Purpose: Versioned SQL migrations for schema, RLS, and RPC functions
- Pattern: Numeric prefix + descriptive name. Recent: `20260316_route_status_enum_extend.sql`, `20260315_route_editing_rpcs.sql`, `20260312_delivery_direction_zones.sql`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — Root layout, fonts, global providers
- `src/app/providers.tsx` — Client provider tree (ThemeProvider, QueryProvider, LazyMotion)
- `src/app/(customer)/checkout/page.tsx` — Checkout SSR entry, loads `BusinessRules`
- `src/app/(driver)/driver/route/page.tsx` — Driver route SSR entry, loads today's route
- `src/app/api/checkout/session/route.ts` — Order creation API (both Stripe and COD)
- `src/app/api/webhooks/stripe/route.ts` + `handlers.ts` — Stripe webhook processing

**Configuration:**
- `src/app/globals.css` — Tailwind v4 `@theme inline` source of truth for all design tokens
- `src/lib/settings/business-rules.ts` — Delivery rules cache, DB key → interface mapping
- `src/types/delivery.ts` — `TIMEZONE` constant (`process.env.DELIVERY_TIMEZONE || "America/Los_Angeles"`)
- `src/lib/constants/kitchen.ts` — `KITCHEN_COORDS` (Covina CA origin for all distance/bearing calculations)

**Core Logic:**
- `src/app/api/checkout/session/route.ts` — Full checkout validation + order creation flow
- `src/app/api/checkout/session/helpers.ts` — `resolveAddressDistance()`, `sendCODOrderEmail()`
- `src/app/api/checkout/session/validation.ts` — `fetchAndValidateCart()`, `buildRpcPayload()`
- `src/app/api/driver/routes/[routeId]/start/route.ts` — Route start + batch order status update
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` — Stop status transitions + order delivered update
- `src/lib/utils/delivery-dates.ts` — All cutoff and available-date calculations (LA timezone-aware)
- `src/lib/utils/delivery-zones.ts` — Bearing-based zone matching (`getDirectionsForCoords`)
- `src/lib/utils/delivery-timezone.ts` — `toISOWithTimezone()` — converts date+time string to LA-offset ISO
- `src/lib/services/route-optimization/optimizer.ts` — Google Routes API + nearest-neighbor
- `src/app/api/tracking/[orderId]/route.ts` — Customer tracking: order + route stop + driver + ETA

**Testing:**
- `e2e/` — Playwright tests
- `src/app/api/**/__tests__/` — Vitest unit tests co-located with route handlers
- `src/lib/**/__tests__/` — Vitest unit tests co-located with utilities

## Naming Conventions

**Files:**
- `PascalCase.tsx` — React components
- `camelCase.ts` — Utilities, hooks, services
- `route.ts` — Next.js API route handler
- `page.tsx` — Next.js page component
- `layout.tsx` — Next.js layout
- `__tests__/` — Test directory co-located with implementation

**Directories:**
- `kebab-case/` — All directories (route segments, lib subdirs)
- `[param]/` — Dynamic route segments
- `(group)/` — Route groups (no URL segment)
- `ComponentName/` — Component subfolders with barrel `index.tsx`

**API Responses:**
- Success: `{ data: ... }` or `{ success: true, ... }`
- Error: `{ error: string }` or `{ error: { code, message } }`
- Paginated: `{ data: [...], pagination: { page, limit, total, totalPages } }`

## Where to Add New Code

**New Customer Page:**
- Implementation: `src/app/(customer)/[route-name]/page.tsx`
- Client parts: `src/app/(customer)/[route-name]/ComponentName.tsx`
- Tests: `src/app/(customer)/[route-name]/__tests__/`

**New Admin Page:**
- Implementation: `src/app/(admin)/admin/[route-name]/page.tsx` + co-located sibling components
- Pattern: page.tsx (RSC) + SiblingComponent.tsx (client)

**New Driver Page:**
- Implementation: `src/app/(driver)/driver/[route-name]/page.tsx` + `[PageName]Client.tsx`
- Pattern: SSR page loads data, hands off to Client component

**New API Route:**
- Implementation: `src/app/api/[domain]/[resource]/route.ts`
- Co-locate: `types.ts`, `schemas.ts`, `helpers.ts` in same directory
- Always start with auth guard: `requireAdmin()` or `requireDriver()`

**New Business Logic Service:**
- Implementation: `src/lib/services/[service-name].ts` or `src/lib/services/[service-name]/index.ts`

**New Utility Function:**
- Implementation: `src/lib/utils/[domain].ts`
- Must be pure — no DB calls, no imports from `@/lib/supabase`

**New Zod Schema:**
- Implementation: `src/lib/validations/[domain].ts`

**New Custom Hook:**
- Implementation: `src/lib/hooks/use[HookName].ts`
- Add export to `src/lib/hooks/index.ts`

**New UI Component (<400 lines):**
- Implementation: `src/components/ui/[ComponentName].tsx`

**New UI Component (>400 lines or needs subfolder):**
- Implementation: `src/components/ui/ComponentName/index.tsx` (barrel) + `SubComponent.tsx` + `useHook.ts` + `helpers.ts`
- Every extracted file with hooks/events needs `'use client'`

**New Database Migration:**
- Implementation: `supabase/migrations/[YYYYMMDD]_[description].sql`
- Follow existing pattern for RLS policies and RPC functions

**New Email Template:**
- Implementation: `src/emails/[TemplateName].tsx`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning docs, phase plans, codebase maps
- Generated: Partially (by GSD commands)
- Committed: Yes

**`.claude/`:**
- Purpose: Project-specific Claude instructions, learnings, session logs
- Generated: Partially
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (`.gitignore`)

**`supabase/migrations/`:**
- Purpose: Source-of-truth for DB schema history
- Generated: No (manually written)
- Committed: Yes

**`e2e/`:**
- Purpose: Playwright end-to-end tests
- Committed: Yes
- Run: `pnpm test:e2e`

---

*Structure analysis: 2026-03-19*
