# Codebase Structure

**Analysis Date:** 2026-01-21

## Directory Layout

```
mandalay-morning-star-delivery-app/
├── src/
│   ├── app/                           # Next.js App Router (pages, routes, layouts)
│   │   ├── (admin)/                   # Protected admin routes (route group)
│   │   │   └── admin/                 # Admin dashboard
│   │   │       ├── layout.tsx         # Admin auth check + role validation
│   │   │       ├── analytics/         # Delivery & driver analytics dashboards
│   │   │       ├── drivers/           # Driver management
│   │   │       ├── menu/              # Menu item management
│   │   │       ├── orders/            # Order management
│   │   │       ├── categories/        # Category management
│   │   │       ├── routes/            # Delivery route management
│   │   │       └── page.tsx           # Admin home
│   │   ├── (auth)/                    # Auth route group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (customer)/                # Customer route group
│   │   │   ├── cart/                  # Cart page
│   │   │   ├── checkout/              # Checkout flow
│   │   │   ├── orders/                # Order history & details
│   │   │   │   └── [id]/              # Single order details
│   │   │   │       ├── confirmation/
│   │   │   │       ├── tracking/
│   │   │   │       └── feedback/
│   │   │   └── debug/                 # Debug utilities (Sentry test)
│   │   ├── (driver)/                  # Driver route group
│   │   │   └── driver/
│   │   │       ├── layout.tsx         # Driver auth check + status validation
│   │   │       ├── page.tsx           # Active route display
│   │   │       ├── route/             # Delivery route with stops
│   │   │       │   └── [stopId]/
│   │   │       └── history/           # Past deliveries
│   │   ├── (public)/                  # Public route group
│   │   │   ├── page.tsx               # Homepage
│   │   │   └── menu/                  # Public menu browse
│   │   ├── api/                       # HTTP API endpoints
│   │   │   ├── addresses/             # Address CRUD
│   │   │   ├── admin/                 # Admin-only APIs
│   │   │   │   ├── analytics/
│   │   │   │   ├── categories/
│   │   │   │   ├── drivers/
│   │   │   │   ├── menu/
│   │   │   │   ├── orders/
│   │   │   │   └── routes/
│   │   │   ├── checkout/
│   │   │   │   └── session/           # Stripe checkout creation
│   │   │   ├── driver/                # Driver-specific APIs
│   │   │   ├── orders/                # Order state APIs
│   │   │   ├── webhooks/              # External service webhooks
│   │   │   └── ...
│   │   ├── layout.tsx                 # Root layout (fonts, providers, metadata)
│   │   ├── providers.tsx              # Client providers (Query, Theme, Cart)
│   │   └── globals.css                # Global styles
│   ├── components/                    # React components organized by feature
│   │   ├── admin/                     # Admin dashboard components
│   │   │   ├── AdminNav.tsx           # Sidebar navigation
│   │   │   ├── analytics/
│   │   │   ├── drivers/
│   │   │   └── routes/
│   │   ├── auth/                      # Authentication forms
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── __tests__/
│   │   ├── cart/                      # Shopping cart UI
│   │   │   ├── v7-index.tsx           # Latest cart drawer version
│   │   │   ├── CartBar.tsx            # Fixed bottom bar
│   │   │   └── ...
│   │   ├── checkout/                  # Checkout flow components
│   │   │   ├── AddressForm.tsx
│   │   │   ├── DeliveryWindow.tsx
│   │   │   └── ...
│   │   ├── driver/                    # Driver-facing components
│   │   │   ├── DriverNav.tsx          # Bottom navigation
│   │   │   ├── DriverShell.tsx        # Layout wrapper
│   │   │   └── ...
│   │   ├── homepage/                  # Home page components
│   │   │   ├── HomePageClient.tsx
│   │   │   └── HomepageMenuSection.tsx
│   │   ├── layout/                    # Header, nav, footers
│   │   │   ├── HeaderServer.tsx       # Top navigation (server-rendered)
│   │   │   └── ...
│   │   ├── menu/                      # Menu display components
│   │   │   ├── MenuContent.tsx
│   │   │   ├── menu-skeleton.tsx
│   │   │   └── __tests__/
│   │   ├── map/                       # Map integration (Google Maps)
│   │   ├── orders/                    # Order display components
│   │   │   ├── OrderCard.tsx
│   │   │   └── ...
│   │   ├── tracking/                  # Real-time order tracking
│   │   ├── ui/                        # UI primitives (button, dialog, etc.)
│   │   │   ├── button.tsx             # shadcn/ui components
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── theme/                     # Theme management
│   │   │   ├── DynamicThemeProvider.tsx
│   │   │   └── ...
│   │   └── theme-provider.tsx         # Next-themes wrapper
│   ├── lib/                           # Reusable logic and utilities
│   │   ├── auth/                      # Authentication helpers
│   │   │   ├── admin.ts               # requireAdmin() function
│   │   │   ├── driver.ts              # requireDriver() function
│   │   │   └── index.ts
│   │   ├── constants/                 # Application constants
│   │   │   └── *.ts
│   │   ├── hooks/                     # Custom React hooks
│   │   │   └── use-cart.ts            # Cart store hook
│   │   ├── providers/                 # Provider components
│   │   │   └── query-provider.tsx     # React Query setup
│   │   ├── queries/                   # Server-side data fetching
│   │   │   └── menu.ts                # getMenuWithCategories()
│   │   ├── schemas/                   # Zod validation schemas
│   │   │   └── *.ts
│   │   ├── services/                  # Business logic services
│   │   │   ├── coverage.ts            # Delivery area validation
│   │   │   ├── geocoding.ts           # Address geocoding
│   │   │   ├── offline-store.ts       # Offline store data
│   │   │   ├── route-optimization.ts  # Delivery route optimization
│   │   │   └── __tests__/
│   │   ├── stores/                    # Client state (Zustand)
│   │   │   └── cart-store.ts          # useCartStore (persist, calc helpers)
│   │   ├── stripe/                    # Stripe integration
│   │   │   └── server.ts              # Stripe client, customer creation
│   │   ├── supabase/                  # Supabase clients and utilities
│   │   │   ├── server.ts              # createClient, createServiceClient
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── actions.ts
│   │   ├── utils/                     # Utility functions
│   │   │   ├── analytics-helpers.ts   # Metric calculations
│   │   │   ├── currency.ts            # formatPrice()
│   │   │   ├── delivery-dates.ts      # Date utilities
│   │   │   ├── eta.ts                 # ETA calculations
│   │   │   ├── logger.ts              # Structured logging
│   │   │   ├── order.ts               # Order calc & validation
│   │   │   ├── price.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── __tests__/
│   │   ├── validations/               # Zod schemas for API input
│   │   │   ├── checkout.ts
│   │   │   └── *.ts
│   │   └── validators/
│   ├── types/                         # TypeScript type definitions
│   │   ├── database.ts                # Supabase table row types
│   │   ├── address.ts
│   │   ├── analytics.ts
│   │   ├── api.ts
│   │   ├── cart.ts
│   │   ├── checkout.ts
│   │   ├── delivery.ts
│   │   ├── driver.ts
│   │   ├── menu.ts
│   │   ├── order.ts
│   │   └── tracking.ts
│   ├── hooks/                         # Deprecated: Use src/lib/hooks instead
│   ├── stores/                        # Deprecated: Re-exports from lib/stores
│   ├── contexts/                      # Context providers (unused in current architecture)
│   ├── proxy.ts                       # Legacy - may be unused
│   └── styles/                        # Static CSS modules (mostly replaced by TailwindCSS)
├── public/                            # Static assets
│   ├── icons/                         # App icons
│   ├── images/                        # Static images
│   └── manifest.json                  # PWA manifest
├── e2e/                               # Playwright E2E tests
│   ├── accessibility.spec.ts
│   ├── animations/
│   └── *.spec.ts
├── .storybook/                        # Storybook config for component dev
├── .planning/                         # GSD planning documents
│   └── codebase/                      # This analysis
├── .env                               # Local environment (git-ignored)
├── .env.example                       # Example env vars
├── package.json                       # Dependencies, scripts
├── tsconfig.json                      # TypeScript config
├── tailwind.config.ts                 # Tailwind theming
├── next.config.js                     # Next.js build config
├── eslint.config.mjs                  # ESLint rules
├── .stylelintrc.json                  # CSS linting
└── vitest.config.ts                   # Unit test runner config
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router entry points for pages and API routes
- Contains: Route groups (wrapped in `(parentheses)`), layouts, error boundaries, page components
- Key files: `layout.tsx` (root), `providers.tsx` (client wrappers), individual route `page.tsx` files

**`src/components/`:**
- Purpose: Reusable UI components organized by feature domain
- Contains: React components (TSX), Storybook stories, unit tests
- Pattern: One feature per subdirectory, co-locate tests as `__tests__/` subdirectory
- Notable: `ui/` contains shadcn/ui primitives; other folders are feature-specific

**`src/lib/`:**
- Purpose: Core application logic, services, and utilities shared across pages and components
- Contains: Auth checks, Supabase clients, validation schemas, business logic, logging
- Pattern: Organized by concern (auth/, services/, utils/, stores/), not by page

**`src/types/`:**
- Purpose: TypeScript definitions for domain models and database rows
- Contains: Interfaces generated from Supabase (ProfilesRow, OrdersRow, etc.), custom types (Address, MenuItem)
- Usage: Imported throughout app for type safety on database operations

**`src/styles/`:**
- Purpose: Global and component-scoped CSS (deprecated in favor of TailwindCSS)
- Contains: Mostly unused; new styling uses Tailwind utility classes in JSX

**`public/`:**
- Purpose: Static assets served as-is by Next.js
- Contains: Favicon, app icons, manifest.json for PWA, static images

**`e2e/`:**
- Purpose: Playwright end-to-end test scenarios
- Contains: Accessibility tests, animation tests, user flow tests
- Scripts: `pnpm test:e2e`, `pnpm test:a11y`, `pnpm test:animations`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout (fonts, providers, metadata)
- `src/app/(public)/page.tsx` - Homepage
- `src/app/(public)/menu/page.tsx` - Menu browse
- `src/app/(customer)/checkout/page.tsx` - Checkout flow
- `src/app/(admin)/admin/page.tsx` - Admin dashboard
- `src/app/(driver)/driver/page.tsx` - Driver active route

**Configuration:**
- `src/app/providers.tsx` - Client-side provider setup (Query, Theme, Cart)
- `src/lib/supabase/server.ts` - Supabase client factories
- `src/lib/stripe/server.ts` - Stripe SDK setup
- `src/lib/auth/admin.ts` - Role-based auth helpers
- `package.json` - Dependencies and scripts

**Core Logic:**
- `src/lib/utils/order.ts` - Order validation and calculation (calculateOrderTotals, validateCartItems)
- `src/lib/utils/logger.ts` - Structured logging with Sentry integration
- `src/lib/services/route-optimization.ts` - Delivery route optimization
- `src/lib/queries/menu.ts` - Menu fetching with categories and modifiers
- `src/lib/stores/cart-store.ts` - Zustand cart state with persistence

**API Routes:**
- `src/app/api/checkout/session/route.ts` - Stripe checkout session creation (critical flow)
- `src/app/api/admin/menu/route.ts` - Menu CRUD with admin auth
- `src/app/api/admin/analytics/delivery/route.ts` - Delivery metrics endpoint
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler (payment confirmation)

**Authentication & Authorization:**
- `src/lib/auth/admin.ts` - `requireAdmin()` function for API routes
- `src/lib/auth/driver.ts` - `requireDriver()` function for API routes
- `src/app/(admin)/admin/layout.tsx` - Admin route protection
- `src/app/(driver)/driver/layout.tsx` - Driver route protection

**Testing:**
- `src/components/menu/__tests__/menu-content.test.tsx` - Menu component test
- `src/lib/utils/__tests__/` - Utility function tests
- `src/lib/services/__tests__/` - Service layer tests
- `e2e/accessibility.spec.ts` - Accessibility test suite
- `vitest.config.ts` - Test runner configuration

## Naming Conventions

**Files:**
- Page components: `page.tsx` (required for Next.js routing)
- Layout components: `layout.tsx` (required for Next.js nesting)
- Error boundaries: `error.tsx` (caught by Next.js error boundary)
- Components: `PascalCase.tsx` (React convention) - e.g., `MenuContent.tsx`, `CartBar.tsx`
- Utilities/hooks: `camelCase.ts` - e.g., `cn.ts`, `use-cart.ts`, `order.ts`
- Schemas/types: `camelCase.ts` - e.g., `checkout.ts`, `menu.ts`
- Tests: `*.test.ts` or `*.spec.ts` (run by vitest)

**Directories:**
- Route groups: `(parenthesized)` - e.g., `(admin)`, `(customer)`, `(public)` - don't affect URL
- Dynamic routes: `[bracketed]` - e.g., `[id]`, `[stopId]` - create URL parameters
- Feature domains: `camelCase` or `kebab-case` - e.g., `admin/`, `checkout/`, `driver/`
- Shared: `lib/` for logic, `types/` for types, `public/` for assets

## Where to Add New Code

**New Feature (e.g., "Delivery Feedback"):**
- Page component: `src/app/(customer)/orders/[id]/feedback/page.tsx`
- API route (if needed): `src/app/api/orders/[id]/feedback/route.ts`
- Form component: `src/components/orders/FeedbackForm.tsx`
- Type: Add to `src/types/order.ts`
- Validation: Add schema to `src/lib/validations/feedback.ts`
- Test: `src/components/orders/__tests__/FeedbackForm.test.tsx`
- E2E: `e2e/feedback.spec.ts`

**New Component/Module:**
- UI component: `src/components/{feature}/{ComponentName}.tsx`
- Business logic: `src/lib/services/{domain}.ts`
- Utilities: `src/lib/utils/{utility}.ts`
- Hooks: `src/lib/hooks/{use-name}.ts`
- Tests: Co-locate in `__tests__/` subdirectory

**Utilities:**
- Shared helpers: `src/lib/utils/{concern}.ts` (e.g., `currency.ts`, `date.ts`)
- Constants: `src/lib/constants/{domain}.ts`
- Validation: `src/lib/validations/{domain}.ts`

**API Endpoints:**
- User-facing APIs: `src/app/api/{resource}/route.ts`
- Admin APIs: `src/app/api/admin/{resource}/route.ts`
- Webhooks: `src/app/api/webhooks/{service}/route.ts`
- All routes use `requireAdmin()` or `requireDriver()` for auth

## Special Directories

**`src/app/api/admin/`:**
- Purpose: Admin-only endpoints
- Protected by: `requireAdmin()` call at start of every handler
- Pattern: All handlers verify auth, return typed error responses
- Example: `src/app/api/admin/menu/route.ts` fetches menu items with role check

**`src/components/ui/`:**
- Purpose: Reusable UI primitives (not feature-specific)
- Origin: shadcn/ui component library
- Pattern: Exported from centralized index, composed into feature components
- Do not edit: These are scaffolded from shadcn; regenerate via `pnpm dlx shadcn-ui@latest add {component}`

**`src/lib/stores/`:**
- Purpose: Client-side state management using Zustand
- Current: Only `cart-store.ts` (shopping cart with localStorage persistence)
- Pattern: Create/persist middleware, export hook (useCartStore)
- Usage: Called from client components via hooks, never from server routes

**`src/lib/queries/`:**
- Purpose: Server-side data fetching with Suspense support
- Current: `menu.ts` (fetches all menu data with categories/modifiers)
- Pattern: Async functions that fetch from Supabase, return typed data
- Usage: Called from page components wrapped in `<Suspense>`, not from client

**`.planning/codebase/`:**
- Purpose: GSD-generated documentation (this file and siblings)
- Generated: By `/gsd:map-codebase` command
- Consumed: By `/gsd:plan-phase` and `/gsd:execute-phase` commands
- Do not edit: Regenerate via GSD when architecture changes

---

*Structure analysis: 2026-01-21*
