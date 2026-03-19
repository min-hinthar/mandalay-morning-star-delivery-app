# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/admin/      # Admin dashboard (role-gated)
│   │   ├── (auth)/login/       # Login page
│   │   ├── (customer)/         # Customer UX (auth required)
│   │   ├── (driver)/driver/    # Driver mobile interface (auth + driver record)
│   │   ├── (public)/           # Homepage, menu, public pages
│   │   ├── api/                # API Route Handlers
│   │   ├── providers.tsx        # Root client providers
│   │   ├── layout.tsx           # Root layout (fonts, PWA, analytics)
│   │   └── globals.css          # Tailwind v4 global styles + @theme tokens
│   ├── components/
│   │   ├── providers/          # DomMaxProvider (viewport utility)
│   │   └── ui/                 # All React components (70+)
│   ├── emails/                 # React Email templates
│   ├── lib/
│   │   ├── auth/               # requireAdmin, requireDriver, getRoleDashboard
│   │   ├── design-system/      # Design tokens (z-index, motion)
│   │   ├── email/              # Email send/build utilities
│   │   ├── gsap/               # GSAP animation presets
│   │   ├── health/             # /api/health checks
│   │   ├── hooks/              # 30+ custom React hooks
│   │   ├── micro-interactions/ # Button/card animation patterns
│   │   ├── motion-tokens/      # Framer Motion token library
│   │   ├── providers/          # QueryProvider, AnimationProvider
│   │   ├── queries/            # Supabase direct query helpers
│   │   ├── rate-limit/         # Upstash rate limiter wrappers
│   │   ├── search/             # Fuzzy search utilities
│   │   ├── services/           # External integrations, offline store
│   │   ├── settings/           # Business rules cache + time windows
│   │   ├── stores/             # Zustand stores
│   │   ├── stripe/             # Stripe server + promo utilities
│   │   ├── supabase/           # Supabase client factory + Server Actions
│   │   ├── swipe-gestures/     # Touch gesture hooks
│   │   ├── utils/              # Pure utility functions
│   │   ├── validations/        # Zod schemas
│   │   └── validators/         # Coverage validator
│   └── types/                  # TypeScript definitions (DB + domain)
├── supabase/
│   └── migrations/             # SQL migration files
├── e2e/                        # Playwright tests
├── data/                       # Menu seed YAML
├── docs/                       # Architecture guides
├── scripts/                    # Build scripts (build-sw.mjs)
├── public/                     # Static assets, icons, manifest.json
├── middleware.ts                # Next.js middleware (session refresh)
└── .planning/                  # GSD planning artifacts
```

## Directory Purposes

**`src/app/(admin)/admin/`:**
- Purpose: Admin dashboard pages and co-located sibling components
- Key files: `layout.tsx` (auth guard), `page.tsx` (dashboard), per-section subdirs
- Pattern: `page.tsx` + sibling `SectionNameComponent.tsx` files (NOT barrel exports)

**`src/app/(customer)/`:**
- Purpose: Authenticated customer UX — cart, checkout, orders, account
- Key files: `layout.tsx` (auth + business rules), `CustomerShell.tsx` (Zustand seed)
- Pages: `cart/`, `checkout/`, `orders/[id]/`, `account/`

**`src/app/(driver)/driver/`:**
- Purpose: Driver mobile-first interface
- Key files: `layout.tsx` (driver auth + active check), `DriverHomeSwitch.tsx`
- Pages: `route/`, `route/[stopId]/`, `schedule/`, `earnings/`, `history/`, `profile/`

**`src/app/(public)/`:**
- Purpose: Unauthenticated pages
- Key files: `page.tsx` (homepage), `menu/page.tsx`, `PublicShell.tsx`

**`src/app/api/`:**
- Purpose: All API Route Handlers
- Structure mirrors URL path: `api/admin/routes/[id]/stops/route.ts`
- Co-located files: `route.ts`, `types.ts`, `schemas.ts`, `helpers.ts`, `validation.ts`

**`src/components/ui/`:**
- Purpose: All React UI components organized by domain
- Subdirs: `admin/`, `account/`, `auth/`, `cart/`, `checkout/`, `driver/`, `layout/`, `menu/`, `orders/`, `offline/`, `search/`, `theme/`, etc.
- Complex components use subfolder pattern with barrel

**`src/emails/`:**
- Purpose: React Email templates rendered server-side and sent via Resend
- Templates: `OrderConfirmation`, `AdminNewOrderAlert`, `DriverInvite`, `RefundNotification`, `OrderCancellation`, `DeliveryReminder`, `AdminDailyDigest`, `AdminFeedbackAlert`, `FeedbackConfirmation`, `RouteDeclineAlert`
- Shared components in `src/emails/components/`

**`src/lib/hooks/`:**
- Purpose: 30+ custom hooks for all business logic in client components
- Examples: `useMenu.ts`, `useCart.ts`, `useDeliveryGate.ts`, `useTrackingSubscription.ts`, `useAcceptRoute.ts`, `useMergeRoutes.ts`, `useReorderStops.ts`
- Tests co-located in `__tests__/`

**`src/lib/services/`:**
- Purpose: Server-side external service integrations
- `coverage.ts` — Google Routes API v2 coverage check
- `geocoding.ts` — Google Geocoding API
- `route-optimization/` — TSP optimizer (Google + nearest-neighbor fallback)
- `offline-store/` — Driver IndexedDB (db.ts, stores.ts, sync.ts, retry.ts)
- `cart-idb-storage.ts` — Cart IndexedDB adapter

**`src/lib/stores/`:**
- Purpose: Zustand global state stores
- `cart-store.ts` — cart items + delivery fee settings (IDB persist)
- `checkout-store.ts` — multi-step checkout state (sessionStorage persist)
- `driver-store.ts` — driver route/location state (localStorage persist)
- `cart-animation-store.ts` — add-to-cart animation trigger state

**`src/lib/utils/`:**
- Purpose: Pure utility functions (no React, no Supabase)
- Key: `delivery-dates.ts` (timezone-safe date math), `delivery-zones.ts` (bearing/zone logic), `order.ts` (price calculations), `format.ts`, `currency.ts`, `price.ts`, `eta.ts`

**`src/lib/validations/`:**
- Purpose: Zod schemas used in both client forms and server API parsing
- Files: `checkout.ts`, `order.ts`, `address.ts`, `route.ts`, `driver.ts`, `driver-api.ts`, `account.ts`, `settings.ts`, `analytics.ts`, `tracking.ts`

**`src/types/`:**
- Purpose: TypeScript type definitions — exempt from 400-line rule
- `database.ts` — auto-generated Supabase types (Row, Insert, Update for every table + enums)
- `order.ts` — `Order`, `OrderStatus`, `ORDER_STATUS_LABELS`, `ORDER_STATUS_COLORS`
- `delivery.ts` — `DeliveryDayConfig`, `DeliveryZoneConfig`, `DeliveryDirection`, `TIMEZONE`
- `cart.ts` — `CartItem`, `CartStore`, `SelectedModifier`
- `checkout.ts` — `CheckoutState`, `CheckoutStep`
- `driver.ts` — `DriversRow` and driver-specific types
- `tracking.ts` — Realtime tracking types

**`supabase/migrations/`:**
- Purpose: SQL migrations in chronological order
- Naming: `YYYYMMDD_description.sql`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — root layout, providers, fonts
- `middleware.ts` — session refresh middleware
- `src/app/providers.tsx` — client-side provider tree

**Auth:**
- `src/lib/supabase/middleware.ts` — session refresh + route gating
- `src/lib/auth/admin.ts` — `requireAdmin()` for API routes
- `src/lib/auth/driver.ts` — `requireDriver()` for API routes
- `src/lib/auth/role-redirect.ts` — `getRoleDashboard()`, `ensureProfile()`
- `src/lib/supabase/actions.ts` — `signInWithMagicLink()`, `signInWithGoogle()` Server Actions

**Supabase Clients:**
- `src/lib/supabase/server.ts` — `createClient()` (cookie), `createServiceClient()` (service role), `createPublicClient()`
- `src/lib/supabase/client.ts` — `createClient()` browser

**Business Logic:**
- `src/lib/settings/business-rules.ts` — `getBusinessRules()` cached 5 min
- `src/lib/utils/delivery-dates.ts` — cutoff/date math, `getZonedDayOfWeek()`
- `src/lib/utils/delivery-zones.ts` — bearing calculation, zone matching
- `src/lib/services/coverage.ts` — address coverage check
- `src/lib/utils/order.ts` — `calculateOrderTotals()`, `calculateDeliveryFee()`, `validateCartItems()`
- `src/lib/services/route-optimization/optimizer.ts` — `optimizeRoute()`

**Webhooks:**
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook receiver
- `src/app/api/webhooks/stripe/handlers.ts` — event handler functions

**Types:**
- `src/types/database.ts` — all DB types (generated)
- `src/types/order.ts` — `OrderStatus` enum, `ORDER_STATUS_LABELS`

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `CartItem.tsx`, `AdminNav.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useCart.ts`, `useDeliveryGate.ts`)
- Utilities: `kebab-case.ts` (e.g., `delivery-dates.ts`, `api-error.ts`)
- API routes: always `route.ts`
- Type files: `kebab-case.ts` (e.g., `database.ts`, `delivery.ts`)
- Test files: `*.test.ts` or `*.test.tsx`

**Directories:**
- Route groups: lowercase in parens `(admin)`, `(customer)`, `(driver)`, `(public)`, `(auth)`
- Component subfolders: `PascalCase/` matching component name
- Feature subfolders: `kebab-case/` (e.g., `route-optimization/`, `offline-store/`)

## File Organization

**400-line rule:** ESLint `max-lines` warning. Exempt: `src/types/**`, test files, Storybook stories.

**When splitting a UI component:**
```
ComponentName/
  index.tsx        # Barrel — re-exports ALL original exports
  SubPart.tsx      # PascalCase sub-components
  useHook.ts       # camelCase hooks
  helpers.ts       # camelCase utilities
```
Every extracted file using hooks/events needs `"use client"`. Barrel must re-export ALL original exports.

**Admin page pattern:**
```
admin/feature/
  page.tsx                  # RSC shell
  FeatureList.tsx           # Client component
  FeatureDetailPanel.tsx    # Client component
  loading.tsx               # Suspense fallback
  error.tsx                 # Error boundary
```

**API route pattern:**
```
api/feature/[id]/
  route.ts          # Handler (GET/POST/PATCH/DELETE)
  types.ts          # Local types
  schemas.ts        # Zod schemas (if complex)
  helpers.ts        # Extracted logic
```

## Where to Add New Code

**New API endpoint:**
- Create `src/app/api/<feature>/route.ts`
- Add Zod schema to `src/lib/validations/<feature>.ts`
- Auth guard: call `requireAdmin()` or `requireDriver()` at top of handler

**New customer page:**
- `src/app/(customer)/<page>/page.tsx` — RSC
- Extract client parts into `<PageName>Client.tsx`
- Add `loading.tsx` and `error.tsx` siblings

**New admin page:**
- `src/app/(admin)/admin/<feature>/page.tsx` — RSC
- Co-locate `FeatureComponent.tsx` siblings

**New UI component:**
- Under 400 lines: `src/components/ui/<domain>/ComponentName.tsx`
- Over 400 lines or complex: `src/components/ui/<domain>/ComponentName/index.tsx` + subfiles

**New hook:**
- `src/lib/hooks/useFeatureName.ts`
- Export from `src/lib/hooks/index.ts` barrel

**New utility function:**
- Pure logic (no React): `src/lib/utils/<domain>.ts`
- Business rule: `src/lib/settings/`

**New Zustand store:**
- `src/lib/stores/<domain>-store.ts`
- Decide persist strategy: IDB (cart), sessionStorage (checkout), localStorage (driver), no persist (animation)

**New type:**
- Domain type: `src/types/<domain>.ts`
- DB-derived type: add to `src/types/database.ts` (only for manual additions; Row/Insert/Update come from Supabase CLI)

**New migration:**
- `supabase/migrations/YYYYMMDD_description.sql`

**New email template:**
- `src/emails/TemplateName.tsx`
- Register send type in `src/lib/email/types.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning artifacts (phases, codebase docs, retros)
- Generated: No
- Committed: Yes

**`supabase/migrations/`:**
- Purpose: Schema history
- Generated: Partial (Supabase CLI can generate, but hand-edited)
- Committed: Yes

**`e2e/`:**
- Purpose: Playwright end-to-end tests
- Generated: No
- Committed: Yes

**`public/`:**
- Purpose: Static assets — icons, manifest, service worker placeholder
- `public/icons/` — PWA icons (icon-192.png, etc.)
- Committed: Yes

---

*Structure analysis: 2026-03-18*
