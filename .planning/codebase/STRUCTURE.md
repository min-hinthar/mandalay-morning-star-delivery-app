# Codebase Structure

**Analysis Date:** 2026-03-06

## Directory Layout

```
mandalay-morning-star-delivery-app/
├── .claude/                # Claude Code config + learnings
├── .github/workflows/      # CI/CD workflows
├── .husky/                 # Git hooks (pre-commit)
├── .planning/              # GSD planning documents
├── .storybook/             # Storybook configuration
├── data/                   # Seed data (menu YAML, photos)
├── docs/                   # Architecture guides
├── e2e/                    # Playwright E2E tests
│   └── animations/         # Animation-specific E2E tests
├── public/                 # Static assets
│   ├── icons/              # PWA icons
│   ├── images/             # Static images
│   ├── leaflet/            # Leaflet map assets
│   └── videos/             # Video assets
├── scripts/                # Build & maintenance scripts
├── src/                    # Application source
│   ├── app/                # Next.js App Router
│   │   ├── (admin)/        # Admin dashboard route group
│   │   ├── (auth)/         # Auth pages (login)
│   │   ├── (customer)/     # Authenticated customer routes
│   │   ├── (driver)/       # Driver interface route group
│   │   ├── (public)/       # Public pages (homepage, menu, terms)
│   │   ├── api/            # API route handlers
│   │   ├── auth/           # Auth callback handler
│   │   ├── contexts/       # React contexts
│   │   └── offline/        # Offline fallback page
│   ├── components/         # Shared components
│   │   ├── providers/      # Client-side providers (DomMax)
│   │   └── ui/             # 70+ UI components
│   ├── emails/             # React Email templates
│   ├── lib/                # Shared utilities & logic
│   │   ├── auth/           # Auth guard functions
│   │   ├── badges/         # Driver badge system
│   │   ├── constants/      # App constants (allergens)
│   │   ├── design-system/  # Design system utilities
│   │   ├── driver/         # Driver-specific logic
│   │   ├── earnings/       # Driver earnings calculations
│   │   ├── email/          # Email sending infrastructure
│   │   ├── gsap/           # GSAP animation utilities
│   │   ├── health/         # Health check utilities
│   │   ├── hooks/          # 40+ custom React hooks
│   │   ├── micro-interactions/ # UI micro-interaction helpers
│   │   ├── motion-tokens/  # Animation token system
│   │   ├── providers/      # Query + Animation providers
│   │   ├── queries/        # TanStack Query fetch functions
│   │   ├── rate-limit/     # Distributed rate limiting
│   │   ├── search/         # Fuzzy search engine
│   │   ├── services/       # Business services
│   │   ├── settings/       # Business rules (configurable)
│   │   ├── stores/         # Zustand state stores
│   │   ├── stripe/         # Stripe server SDK + promo codes
│   │   ├── supabase/       # Supabase client factories
│   │   ├── swipe-gestures/ # Touch gesture handling
│   │   ├── utils/          # General utilities
│   │   ├── validations/    # Zod validation schemas
│   │   ├── validators/     # Domain validators (coverage)
│   │   └── webgl/          # WebGL effects
│   └── types/              # TypeScript type definitions
└── supabase/               # Supabase config & migrations
    └── migrations/         # SQL migration files
```

## Directory Purposes

**`src/app/(admin)/admin/`:**
- Purpose: Admin dashboard for managing orders, menu, drivers, routes, analytics, settings
- Contains: Server Component pages with co-located client components
- Key files: `layout.tsx` (auth + role guard), `admin/orders/page.tsx`, `admin/routes/page.tsx`, `admin/menu/page.tsx`, `admin/drivers/page.tsx`, `admin/settings/page.tsx`

**`src/app/(customer)/`:**
- Purpose: Authenticated customer experience (account, cart, checkout, order tracking)
- Contains: Auth-gated pages, `CustomerShell` wrapper
- Key files: `layout.tsx` (auth guard + business rules injection), `cart/page.tsx`, `checkout/page.tsx`, `orders/[id]/tracking/page.tsx`

**`src/app/(driver)/driver/`:**
- Purpose: Driver mobile interface for route management, deliveries, earnings
- Contains: Driver-optimized mobile pages
- Key files: `route/page.tsx`, `route/[stopId]/page.tsx`, `earnings/page.tsx`, `schedule/page.tsx`

**`src/app/(public)/`:**
- Purpose: Public-facing pages accessible without authentication
- Contains: Homepage, public menu, order sharing, driver onboarding, legal pages
- Key files: `page.tsx` (homepage), `menu/page.tsx`, `orders/[id]/share/page.tsx`, `driver/onboard/page.tsx`

**`src/app/api/`:**
- Purpose: All backend API endpoints organized by domain
- Contains: Route handlers (`route.ts`) with co-located helpers, types, schemas
- Key subdirectories:
  - `api/checkout/` — checkout session creation, promo validation
  - `api/orders/` — order CRUD, cancel, rating, payment verification
  - `api/admin/` — admin-only endpoints (menu, drivers, routes, analytics, emails, ops)
  - `api/driver/` — driver endpoints (routes, stops, location, earnings, profile)
  - `api/tracking/` — real-time order tracking
  - `api/webhooks/` — Stripe and Resend webhook handlers
  - `api/menu/` — public menu read, search
  - `api/addresses/` — address CRUD
  - `api/account/` — customer account management
  - `api/sections/` — featured sections
  - `api/health/` — health check
  - `api/emails/` — email testing

**`src/components/ui/`:**
- Purpose: Shared UI component library (70+ components)
- Contains: Primitives (button, input, dialog), domain components (cart, checkout, menu, orders), layout components
- Key subdirectories: `admin/`, `auth/`, `brand/`, `cart/`, `checkout/`, `customer/`, `delivery/`, `driver/`, `homepage/`, `layout/`, `maps/`, `menu/`, `offline/`, `orders/`, `search/`, `skeleton/`, `theme/`, `transitions/`

**`src/lib/`:**
- Purpose: All shared non-component code
- Contains: Auth, hooks, stores, services, utilities, validation, clients

**`src/types/`:**
- Purpose: TypeScript type definitions shared across the codebase
- Contains: `database.ts` (Supabase-generated + manual Row exports), domain types per feature
- Key files: `database.ts`, `cart.ts`, `checkout.ts`, `order.ts`, `menu.ts`, `driver.ts`, `tracking.ts`, `delivery.ts`, `featured-sections.ts`, `analytics.ts`, `address.ts`, `layout.ts`

**`src/emails/`:**
- Purpose: React Email templates for transactional emails
- Contains: Email components + shared helpers/fixtures
- Key files: `OrderConfirmation.tsx`, `DeliveryReminder.tsx`, `DriverInvite.tsx`, `OrderCancellation.tsx`, `RefundNotification.tsx`

**`supabase/migrations/`:**
- Purpose: Database schema migrations (Postgres)
- Contains: SQL files for schema, functions, RLS policies, indexes, seeds

**`scripts/`:**
- Purpose: Build and maintenance scripts
- Key files: `build-sw.mjs` (service worker build), `seed-menu.ts`, `seed-photos.ts`, `rls-isolation-test.mjs`, `launch-check.ts`, `audit-tokens.js`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (fonts, providers, header, toast, analytics)
- `proxy.ts`: Next.js middleware (session refresh, route gating)
- `src/app/auth/callback/route.ts`: OAuth callback handler
- `src/app/api/webhooks/stripe/route.ts`: Stripe webhook entry
- `next.config.ts`: Next.js configuration

**Configuration:**
- `tsconfig.json`: TypeScript config (strict mode, `@/` path alias)
- `eslint.config.mjs`: ESLint flat config
- `vitest.config.ts`: Vitest test runner config
- `playwright.config.ts`: Playwright E2E config
- `postcss.config.mjs`: PostCSS (Tailwind v4)
- `sentry.server.config.ts`, `sentry.edge.config.ts`: Sentry config
- `.storybook/`: Storybook configuration

**Core Logic:**
- `src/lib/supabase/server.ts`: Supabase client factories (server, public, service)
- `src/lib/supabase/client.ts`: Supabase browser client
- `src/lib/auth/admin.ts`: Admin auth guard (`requireAdmin`)
- `src/lib/auth/driver.ts`: Driver auth guard (`requireDriver`)
- `src/lib/auth/role-redirect.ts`: Role-based routing (`getRoleDashboard`, `ensureProfile`)
- `src/lib/settings/business-rules.ts`: Configurable business rules with defaults
- `src/lib/stripe/server.ts`: Stripe SDK initialization + customer management
- `src/lib/utils/api-error.ts`: Standardized API error responses
- `src/lib/utils/logger.ts`: Structured logger (Sentry integration)
- `src/lib/rate-limit/`: Rate limiting infrastructure
- `src/lib/services/route-optimization/`: Delivery route optimizer

**State Management:**
- `src/lib/stores/cart-store.ts`: Cart state (Zustand + IndexedDB persistence)
- `src/lib/stores/checkout-store.ts`: Checkout flow state
- `src/lib/stores/driver-store.ts`: Driver dashboard state
- `src/lib/providers/query-provider.tsx`: TanStack Query client setup

**Testing:**
- `vitest.config.ts`: Unit test configuration
- `playwright.config.ts`: E2E test configuration
- `e2e/`: Playwright E2E tests
- `src/lib/**/__tests__/`: Co-located unit tests

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `AdminNav.tsx`, `CustomerShell.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAuth.ts`, `useCart.ts`)
- Utilities: `kebab-case.ts` (e.g., `api-error.ts`, `delivery-dates.ts`)
- Stores: `kebab-case.ts` suffixed with `-store` (e.g., `cart-store.ts`)
- Validations: `kebab-case.ts` matching domain (e.g., `checkout.ts`, `order.ts`)
- Types: `kebab-case.ts` matching domain (e.g., `database.ts`, `cart.ts`)
- Route handlers: always `route.ts`
- Pages: always `page.tsx`
- Layouts: always `layout.tsx`

**Directories:**
- Route groups: `(groupName)` with parentheses (e.g., `(admin)`, `(customer)`)
- Dynamic segments: `[paramName]` with brackets (e.g., `[id]`, `[stopId]`, `[routeId]`)
- Component subfolders: `PascalCase/` with `index.tsx` barrel
- Lib subfolders: `kebab-case/` with `index.ts` barrel

**Exports:**
- Components: Named exports (`export function ComponentName`)
- Hooks: Named exports (`export function useHookName`)
- Stores: Named exports (`export const useStoreName = create<...>()`)
- Types: Named type exports (`export type TypeName`, `export interface InterfaceName`)

## Where to Add New Code

**New Customer Page:**
- Page: `src/app/(customer)/[feature]/page.tsx`
- Components: `src/components/ui/customer/[Feature].tsx` or `src/components/ui/[feature]/`
- Automatically auth-gated by `src/app/(customer)/layout.tsx`

**New Admin Page:**
- Page: `src/app/(admin)/admin/[feature]/page.tsx`
- Components: `src/components/ui/admin/[Feature].tsx`
- Automatically auth + admin-role gated by `src/app/(admin)/admin/layout.tsx`

**New Driver Page:**
- Page: `src/app/(driver)/driver/[feature]/page.tsx`
- Components: `src/components/ui/driver/[Feature].tsx`

**New Public Page:**
- Page: `src/app/(public)/[feature]/page.tsx`
- No auth required

**New API Endpoint:**
- Route: `src/app/api/[domain]/[action]/route.ts`
- Co-locate helpers: `src/app/api/[domain]/[action]/helpers.ts`, `types.ts`, `schemas.ts`
- Add Zod schema: `src/lib/validations/[domain].ts`
- Use `requireAdmin()` or `requireDriver()` for protected endpoints
- Add rate limiting via `checkRateLimit()`

**New Shared Component:**
- Simple: `src/components/ui/[ComponentName].tsx`
- Complex (>400 lines): `src/components/ui/[ComponentName]/index.tsx` + subcomponents

**New Hook:**
- Location: `src/lib/hooks/use[HookName].ts`
- Export from: `src/lib/hooks/index.ts` (barrel file)

**New Zustand Store:**
- Location: `src/lib/stores/[feature]-store.ts`
- Pattern: Follow `cart-store.ts` as reference

**New Type:**
- Location: `src/types/[domain].ts`
- Database types: `src/types/database.ts` (extend manually or regenerate)

**New Validation Schema:**
- Location: `src/lib/validations/[domain].ts`
- Pattern: `export const [name]Schema = z.object({ ... })`

**New Email Template:**
- Location: `src/emails/[TemplateName].tsx`
- Pattern: React Email component, follow `OrderConfirmation.tsx`

**New Utility:**
- Location: `src/lib/utils/[utility-name].ts`
- Shared helpers that don't fit a specific domain

**New Service:**
- Simple: `src/lib/services/[service-name].ts`
- Complex: `src/lib/services/[service-name]/index.ts` + submodules

## Special Directories

**`supabase/migrations/`:**
- Purpose: Postgres schema migrations (schema, functions, RLS, indexes, seeds)
- Generated: Manual SQL files
- Committed: Yes

**`public/`:**
- Purpose: Static assets served at root URL
- Generated: No
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `pnpm build`)
- Committed: No

**`data/`:**
- Purpose: Menu seed data (YAML files + photos)
- Generated: No (manually authored)
- Committed: Yes

**`e2e/`:**
- Purpose: Playwright end-to-end tests
- Generated: No
- Committed: Yes

**`scripts/`:**
- Purpose: Build scripts, seed scripts, maintenance tools
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-06*
