# Codebase Structure

**Analysis Date:** 2026-03-14

## Directory Layout

```
mandalay-morning-star-delivery-app/
├── .claude/                  # Claude configuration, learnings, hooks, skills
├── .github/workflows/        # CI/CD GitHub Actions
├── .husky/                   # Git hooks (pre-commit)
├── .planning/                # GSD planning docs, phase archives, codebase analysis
│   ├── archive/              # Completed phases (v1.0 through v1.8, 69+ phases)
│   └── codebase/             # Codebase analysis documents
├── data/                     # Menu seed YAML, photo assets, SQL seed scripts
├── e2e/                      # Playwright E2E tests (19 spec files)
├── public/                   # Static assets (icons, manifest.json, sw.js)
├── scripts/                  # Operational scripts (seed, build-sw, audit, load-test)
├── src/                      # Application source code
│   ├── app/                  # Next.js App Router pages and API routes
│   ├── components/           # React components
│   ├── data/                 # Static data imports
│   ├── emails/               # React Email templates
│   ├── lib/                  # Business logic, utilities, hooks, stores, services
│   ├── stories/              # Storybook stories
│   ├── styles/               # Global CSS
│   ├── test/                 # Test utilities, factories, mocks
│   └── types/                # TypeScript type definitions
├── supabase/                 # Supabase config and migrations
│   └── migrations/           # 59 SQL migration files
├── next.config.ts            # Next.js configuration (CSP, images, compiler, Sentry)
├── vercel.json               # Vercel deployment config (cron schedules)
├── tsconfig.json             # TypeScript config (strict, @/* path alias)
├── eslint.config.mjs         # ESLint flat config
├── vitest.config.ts          # Vitest test runner config
├── playwright.config.ts      # Playwright E2E config
├── instrumentation.ts        # Sentry server/edge init
├── instrumentation-client.ts # Sentry client init
├── sentry.client.config.ts   # Sentry client SDK config
├── sentry.server.config.ts   # Sentry server SDK config
├── sentry.edge.config.ts     # Sentry edge SDK config
├── postcss.config.mjs        # PostCSS (Tailwind v4)
├── tailwind.config.ts        # Tailwind config (dead code -- theme lives in CSS)
├── components.json           # shadcn/ui component config
├── knip.json                 # Dead code detection config
├── lighthouserc.js           # Lighthouse CI config
├── chromatic.config.js       # Chromatic visual testing config
└── package.json              # Dependencies, scripts
```

## Directory Purposes

**`src/app/` -- App Router Pages + API Routes:**
- Purpose: All route segments, layouts, pages, loading states, error boundaries
- Contains: 5 route groups, API routes, auth routes, contexts
- Key files:
  - `src/app/layout.tsx` -- Root layout (providers, fonts, global shell)
  - `src/app/providers.tsx` -- Client provider tree (Theme, Query, Motion, Animation)
  - `src/app/error.tsx` -- Global error boundary
  - `src/app/not-found.tsx` -- Global 404 page
  - `src/app/globals.css` -- Global styles (Tailwind v4 `@theme inline`)
  - `src/app/offline/page.tsx` -- Offline fallback page

**`src/app/(admin)/admin/` -- Admin Dashboard:**
- Purpose: Admin-only pages for order/menu/driver/route/settings management
- Contains: 16 page routes with co-located loading.tsx and error.tsx
- Key files:
  - `layout.tsx` -- Auth guard (admin role), AdminNav sidebar
  - `page.tsx` -- Dashboard with KPIs, revenue chart, recent orders
  - `orders/page.tsx` -- Order list with filtering/status updates
  - `orders/[id]/page.tsx` -- Order detail with status management
  - `menu/page.tsx` -- Menu item CRUD
  - `routes/page.tsx` -- Delivery route builder
  - `routes/[id]/page.tsx` -- Route detail with stop management
  - `settings/page.tsx` -- Business rules admin
  - `drivers/page.tsx` -- Driver management
  - `photos/page.tsx` -- Photo upload/management
  - `sections/page.tsx` -- Featured sections management
  - `ops/page.tsx` -- Operations dashboard
  - `analytics/page.tsx` -- Analytics dashboards
  - `emails/page.tsx` -- Email history and compose
  - `feedback/page.tsx` -- Customer feedback review
  - `ratings/page.tsx` -- Driver ratings

**`src/app/(customer)/` -- Customer Pages:**
- Purpose: Authenticated customer flows (cart, checkout, orders, account)
- Contains: 9 page routes
- Key files:
  - `layout.tsx` -- Auth guard (any authenticated user), CustomerShell with business rules
  - `cart/page.tsx` -- Cart review page
  - `checkout/page.tsx` -- Multi-step checkout (server passes time windows + rules)
  - `checkout/CheckoutClient.tsx` -- Client checkout wizard
  - `orders/page.tsx` -- Order history
  - `orders/[id]/page.tsx` -- Order detail
  - `orders/[id]/confirmation/page.tsx` -- Post-checkout confirmation
  - `orders/[id]/tracking/page.tsx` -- Live delivery tracking
  - `orders/[id]/feedback/page.tsx` -- Post-delivery feedback form
  - `account/page.tsx` -- Account settings (profile, addresses, settings tabs)

**`src/app/(driver)/driver/` -- Driver Interface:**
- Purpose: Mobile-optimized driver delivery interface
- Contains: 7 page routes
- Key files:
  - `layout.tsx` -- Auth guard (driver role + active status), DriverNav bottom bar, avatar/simple-mode providers
  - `page.tsx` -- Driver dashboard
  - `route/page.tsx` -- Active route with stop list
  - `route/[stopId]/page.tsx` -- Individual stop detail
  - `schedule/page.tsx` -- Upcoming route schedule
  - `earnings/page.tsx` -- Earnings history
  - `history/page.tsx` -- Delivery history
  - `profile/page.tsx` -- Driver profile settings
  - `test-delivery/page.tsx` -- Test delivery simulation

**`src/app/(public)/` -- Public Pages:**
- Purpose: Unauthenticated pages visible to all visitors
- Contains: Homepage, public menu, order sharing, legal pages, driver onboarding
- Key files:
  - `layout.tsx` -- PublicShell with business rules (no auth required)
  - `page.tsx` -- Homepage with Hero, HowItWorks, featured menu, testimonials, CTA
  - `menu/page.tsx` -- Full public menu browser
  - `orders/[id]/share/page.tsx` -- Shareable order tracking (token-based)
  - `privacy/page.tsx` -- Privacy policy
  - `terms/page.tsx` -- Terms of service
  - `driver/onboard/page.tsx` -- Driver onboarding flow
  - `driver/deactivated/page.tsx` -- Deactivated driver notice

**`src/app/(auth)/` -- Auth Pages:**
- Purpose: Login/authentication UI
- Contains: Login page
- Key files:
  - `layout.tsx` -- Minimal wrapper (DomMaxProvider only)
  - `login/page.tsx` -- Login form (magic link + Google OAuth)

**`src/app/auth/` -- Auth Route Handlers (not in a route group):**
- Purpose: Server-side auth processing
- Key files:
  - `callback/route.ts` -- OAuth/magic link callback handler
  - `confirm/route.ts` -- Email confirmation handler
  - `expired/page.tsx` -- Expired link page with resend option

**`src/app/api/` -- API Routes:**
- Purpose: All backend API endpoints
- Organization: Mirrors domain model: `/api/admin/*`, `/api/driver/*`, `/api/checkout/*`, `/api/orders/*`, `/api/menu/*`, `/api/addresses/*`, `/api/feedback/*`, `/api/tracking/*`, `/api/webhooks/*`, `/api/cron/*`, `/api/health`
- Key sub-trees:
  - `api/admin/orders/[id]/` -- 9 sub-routes (status, cancel, refund, driver, items, details, contact, priority, approve-cod)
  - `api/admin/routes/[id]/` -- stops, stops/[stopId], stops/reassign, exceptions, exceptions/[exceptionId]
  - `api/driver/routes/[routeId]/` -- start, complete, stops, stops/[stopId], stops/[stopId]/exception, stops/[stopId]/photo
  - `api/checkout/session/` -- main checkout endpoint with co-located `helpers.ts`, `validation.ts`, `__tests__/`
  - `api/webhooks/stripe/` -- webhook handler with co-located `handlers.ts`, `__tests__/`

**`src/components/ui/` -- UI Components (74 items):**
- Purpose: All reusable React components
- Organization: Mix of single files (shadcn/ui primitives) and domain subfolders
- Key domains:
  - `admin/` -- AdminNav, AdminDashboard, drivers/, orders/, routes/, settings/, photos/, sections/, ops/, analytics/, profile/
  - `cart/` -- CartItem/, CartPage/
  - `checkout/` -- AddressInput/, PaymentSuccess/, TimeSlotPicker/
  - `driver/` -- DriverDashboard/, DriverNav, DriverShell, AvailabilityPicker/
  - `homepage/` -- Hero/, HowItWorksSection/, HomepageMenuSection, CTABanner, TestimonialsCarousel
  - `layout/` -- AppHeader/ (barrel with 7 sub-components), MobileDrawer/, HeaderWrapper
  - `menu/` -- FeaturedCarousel/, ItemDetailSheet/, UnifiedMenuItemCard/
  - `orders/` -- tracking/ (DeliveryMap/, StatusTimeline/)
  - `search/` -- CommandPalette/
  - `feedback/` -- Feedback form components
  - `brand/` -- BrandMascot/, Logo components
  - `icons/` -- Custom icon components
  - `offline/` -- OfflineIndicator, ServiceWorkerRegistration, UpdatePrompt
  - `error-pages/` -- Branded error pages
  - `skeleton/` -- Loading skeleton components
  - `theme/` -- ThemeProvider, DynamicThemeProvider, ThemeToggle
  - `transitions/` -- Page transition components
  - Primitives: `button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `avatar.tsx`, `checkbox.tsx`, `label.tsx`, `progress.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `textarea.tsx`, `alert.tsx`, `alert-dialog.tsx`, `dropdown-menu.tsx`

**`src/lib/` -- Business Logic & Utilities:**
- Purpose: All non-UI code: auth, services, hooks, stores, utilities, validations
- Sub-directories:
  - `auth/` -- Role guards, role redirect, OAuth email resolution
  - `hooks/` -- 40+ custom React hooks (useAuth, useCart, useMenu, useCoverageCheck, useDeliveryGate, useFavorites, useLocationTracking, useOfflineSync, usePlacesAutocomplete, useTrackingSubscription, etc.)
  - `stores/` -- 4 Zustand stores (cart, checkout, driver, cart-animation)
  - `services/` -- Domain services (coverage, geocoding, cod-order, cart-idb-storage, offline-store/, route-optimization/, customer-offline-store)
  - `utils/` -- Pure utilities (cn, currency, format, logger, api-error, api-client, delivery-dates, delivery-zones, delivery-timezone, order, origin-check, clustering, eta, image-optimization, price, route-transformers, analytics-helpers/)
  - `validations/` -- 11 Zod schema files
  - `validators/` -- Additional validation helpers
  - `supabase/` -- Client factories (server, client, middleware), storage helpers
  - `stripe/` -- Stripe server client, promo code validation
  - `email/` -- Email sending infrastructure (client, send, build, constants, types, admin-recipients, suggestions)
  - `settings/` -- Business rules reader with caching
  - `queries/` -- Server-side query functions (sections, delivery-stats)
  - `rate-limit/` -- Rate limiting configuration and check functions
  - `health/` -- Health check service status
  - `providers/` -- React context providers (query-provider, animation-provider)
  - `constants/` -- Application constants
  - `design-system/tokens/` -- Design token definitions
  - `motion-tokens/` -- Animation motion tokens
  - `gsap/` -- GSAP animation utilities
  - `micro-interactions/` -- Micro-interaction helpers
  - `swipe-gestures/` -- Touch gesture utilities
  - `webgl/` -- WebGL utilities
  - `search/` -- Search functionality
  - `badges/` -- Driver badge logic
  - `earnings/` -- Driver earnings calculations
  - `driver/` -- Driver-specific utilities
  - `web-vitals.tsx` -- Web Vitals reporter component

**`src/types/` -- TypeScript Definitions:**
- Purpose: Shared type definitions
- Key files:
  - `database.ts` -- Auto-generated Supabase Database type (2346 lines, 30+ tables)
  - `cart.ts` -- Cart item, store, modifier types
  - `checkout.ts` -- Checkout state, step types
  - `order.ts` -- Order types
  - `menu.ts` -- Menu item, category types
  - `delivery.ts` -- Delivery day config, zone config, direction types
  - `address.ts` -- Address, coverage types
  - `driver.ts` -- Driver row, status types
  - `tracking.ts` -- Order tracking types
  - `feedback.ts` -- Feedback types
  - `analytics.ts` -- Analytics data types
  - `featured-sections.ts` -- Featured section types
  - `layout.ts` -- Layout types

**`src/emails/` -- Email Templates:**
- Purpose: React Email templates for transactional emails
- Contains: 9 email templates + shared components
- Key files:
  - `OrderConfirmation.tsx`, `OrderCancellation.tsx`, `RefundNotification.tsx`
  - `DeliveryReminder.tsx`
  - `DriverInvite.tsx`
  - `FeedbackConfirmation.tsx`
  - `AdminNewOrderAlert.tsx`, `AdminDailyDigest.tsx`, `AdminFeedbackAlert.tsx`
  - `components/` -- Shared email components (header, footer, etc.)
  - `fixtures.ts` -- Test data for email previews
  - `helpers.ts` -- Email formatting helpers

**`src/test/` -- Test Utilities:**
- Purpose: Shared test infrastructure
- Key files:
  - `factories/` -- Test data factories
  - `mocks/` -- Mock implementations

**`src/stories/` -- Storybook Stories:**
- Purpose: Component documentation and visual testing
- Contains: Story files, design system stories

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (provider tree, global shell)
- `src/app/providers.tsx`: Client-side provider composition
- `next.config.ts`: Build configuration, security headers, image optimization
- `instrumentation.ts`: Sentry server/edge initialization
- `instrumentation-client.ts`: Sentry client initialization

**Configuration:**
- `tsconfig.json`: TypeScript strict mode, `@/*` path alias
- `eslint.config.mjs`: ESLint flat config with custom rules
- `vitest.config.ts`: Unit test runner
- `playwright.config.ts`: E2E test runner
- `postcss.config.mjs`: PostCSS with Tailwind v4
- `tailwind.config.ts`: Legacy (theme source of truth is `@theme inline` in `globals.css`)
- `components.json`: shadcn/ui configuration
- `knip.json`: Dead code detection
- `vercel.json`: Cron job schedules

**Core Logic:**
- `src/lib/settings/business-rules.ts`: Central business configuration reader
- `src/lib/auth/role-redirect.ts`: Role-based routing logic
- `src/lib/auth/admin.ts`: Admin auth guard
- `src/lib/auth/driver.ts`: Driver auth guard
- `src/lib/supabase/server.ts`: 3 Supabase client factories
- `src/lib/supabase/client.ts`: Browser Supabase client
- `src/lib/supabase/middleware.ts`: Session refresh middleware
- `src/lib/stores/cart-store.ts`: Cart state management
- `src/lib/stores/checkout-store.ts`: Checkout flow state
- `src/lib/stores/driver-store.ts`: Driver session state
- `src/lib/utils/logger.ts`: Structured Sentry logger
- `src/lib/utils/api-error.ts`: API error response factory
- `src/lib/rate-limit/index.ts`: Rate limiting exports
- `src/lib/email/send.ts`: Email sending with retry
- `src/lib/services/coverage.ts`: Delivery coverage checking
- `src/lib/services/cod-order.ts`: COD order creation
- `src/lib/services/geocoding.ts`: Address geocoding

**Testing:**
- `e2e/*.spec.ts`: 19 Playwright E2E test files
- `src/**/__tests__/`: Co-located unit tests
- `src/test/factories/`: Test data factories
- `src/test/mocks/`: Mock implementations

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `AdminNav.tsx`, `CartItem.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAuth.ts`, `useCart.ts`)
- Utilities/services: `kebab-case.ts` (e.g., `api-error.ts`, `cart-store.ts`, `business-rules.ts`)
- Types: `kebab-case.ts` (e.g., `database.ts`, `delivery.ts`)
- Validations: `kebab-case.ts` matching domain (e.g., `checkout.ts`, `address.ts`)
- Test files: `*.test.ts` or `*.test.tsx` in `__tests__/` subdirectory
- E2E tests: `kebab-case.spec.ts` (e.g., `checkout-flow.spec.ts`)
- Email templates: `PascalCase.tsx` (e.g., `OrderConfirmation.tsx`)
- API route files: `route.ts` (Next.js convention), co-located `helpers.ts`, `validation.ts`, `schemas.ts`, `types.ts`

**Directories:**
- Component subfolders: `PascalCase/` with `index.tsx` barrel (e.g., `AppHeader/index.ts`)
- Lib subfolders: `kebab-case/` with `index.ts` barrel (e.g., `rate-limit/index.ts`)
- Route groups: `(groupName)/` (e.g., `(admin)/`, `(customer)/`)
- Dynamic routes: `[paramName]/` (e.g., `[id]/`, `[stopId]/`, `[routeId]/`)
- Test directories: `__tests__/` co-located with source

**Exports:**
- Component barrels re-export all public APIs including types
- Lib barrels use named exports (no default exports in barrels)
- Email templates export default function component

## Where to Add New Code

**New Customer Page:**
- Page: `src/app/(customer)/[pageName]/page.tsx` (Server Component)
- Client component: `src/app/(customer)/[pageName]/[PageName]Client.tsx`
- Loading state: `src/app/(customer)/[pageName]/loading.tsx`
- Error boundary: `src/app/(customer)/[pageName]/error.tsx`
- Auth: Handled by `(customer)/layout.tsx` (requires authenticated user)

**New Admin Page:**
- Page: `src/app/(admin)/admin/[pageName]/page.tsx` (Server Component)
- Client component: `src/components/ui/admin/[pageName]/` subfolder with barrel
- Loading state: `src/app/(admin)/admin/[pageName]/loading.tsx`
- Error boundary: `src/app/(admin)/admin/[pageName]/error.tsx`
- Auth: Handled by `(admin)/admin/layout.tsx` (requires admin role)

**New API Route:**
- Route handler: `src/app/api/[domain]/route.ts`
- With params: `src/app/api/[domain]/[id]/route.ts`
- Co-located files: `helpers.ts`, `validation.ts`, `types.ts` in same directory
- Auth: Use `requireAdmin()` or `requireDriver()` from `src/lib/auth/`
- Validation: Create Zod schema in `src/lib/validations/[domain].ts`
- Rate limiting: Use appropriate limiter from `src/lib/rate-limit/`
- Errors: Use `apiError()` from `src/lib/utils/api-error.ts`
- Tests: `__tests__/route.test.ts` co-located

**New UI Component:**
- Small/single file: `src/components/ui/ComponentName.tsx`
- Complex/multi-file: `src/components/ui/ComponentName/index.tsx` (barrel) + sub-components
- Domain-specific: `src/components/ui/[domain]/ComponentName.tsx` (e.g., `admin/`, `cart/`, `driver/`)
- Every extracted file using hooks/events needs `'use client'`
- Barrel `index.tsx` must re-export ALL original exports

**New Hook:**
- File: `src/lib/hooks/useHookName.ts`
- Must include `'use client'` directive
- Tests: `src/lib/hooks/__tests__/useHookName.test.ts`

**New Zustand Store:**
- File: `src/lib/stores/[domain]-store.ts`
- Use `persist` middleware with appropriate storage (IndexedDB for cart, sessionStorage for checkout, localStorage for driver)
- Tests: `src/lib/stores/__tests__/[domain]-store.test.ts`

**New Service/Utility:**
- Service: `src/lib/services/[name].ts` (for external integrations, complex operations)
- Utility: `src/lib/utils/[name].ts` (for pure functions)
- Tests: `src/lib/services/__tests__/[name].test.ts` or `src/lib/utils/__tests__/[name].test.ts`

**New Validation Schema:**
- File: `src/lib/validations/[domain].ts`
- Export schema + inferred type: `export type FooInput = z.infer<typeof fooSchema>`
- Tests: `src/lib/validations/__tests__/[domain].test.ts`

**New Email Template:**
- Template: `src/emails/TemplateName.tsx` (React Email component)
- Add fixtures: Update `src/emails/fixtures.ts` for preview data
- Integration: Call via `sendEmail()` from `src/lib/email/send.ts`

**New Type Definition:**
- File: `src/types/[domain].ts`
- Database types: Auto-generated in `src/types/database.ts` via Supabase CLI

**New Database Migration:**
- File: `supabase/migrations/[NNN]_[description].sql` (sequential numbering)

**New E2E Test:**
- File: `e2e/[feature-name].spec.ts`

## Special Directories

**`supabase/migrations/`:**
- Purpose: PostgreSQL migrations for Supabase
- Generated: Manually authored SQL
- Committed: Yes
- Count: 59 migration files

**`.planning/`:**
- Purpose: GSD planning system docs and phase archives
- Generated: By GSD tools
- Committed: Yes
- Contains: 69+ completed phase plans (v1.0 through v1.8)

**`.claude/`:**
- Purpose: Claude Code configuration, learnings, hooks, skills
- Generated: Mix (learnings auto-captured, hooks/skills manual)
- Committed: Yes

**`public/`:**
- Purpose: Static assets served directly
- Contains: PWA manifest, icons, service worker output
- Note: `sw.js` is generated by `scripts/build-sw.mjs`, not manually edited

**`scripts/`:**
- Purpose: Operational scripts run outside of Next.js
- Key scripts:
  - `build-sw.mjs` -- Build Serwist service worker
  - `seed-menu.ts` -- Seed menu data from YAML
  - `rls-isolation-test.mjs` -- Test RLS policy isolation
  - `launch-check.ts` -- Pre-launch verification
  - `audit-tokens.js` -- Design token audit
  - `load-test.js` -- Load testing

**`src/data/`:**
- Purpose: Static data imports used by components
- Generated: No
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `next build` / `next dev`)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-03-14*
