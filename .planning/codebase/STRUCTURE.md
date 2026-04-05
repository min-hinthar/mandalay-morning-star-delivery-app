# Codebase Structure

**Analysis Date:** 2026-04-04

## Directory Layout

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/admin/      # Admin dashboard (auth-gated)
│   │   ├── (auth)/login/       # Login page
│   │   ├── (customer)/         # Authenticated customer pages
│   │   ├── (driver)/driver/    # Driver mobile interface (auth-gated)
│   │   ├── (public)/           # Public-facing pages (no auth required)
│   │   ├── api/                # API routes (REST)
│   │   │   ├── admin/          # Admin-only endpoints
│   │   │   ├── driver/         # Driver-only endpoints
│   │   │   ├── checkout/       # Checkout session + promo validation
│   │   │   ├── orders/         # Customer order management
│   │   │   ├── tracking/       # Order tracking with live ETA
│   │   │   ├── webhooks/       # Stripe + Resend webhooks
│   │   │   ├── cron/           # Cron job endpoints
│   │   │   ├── coverage/       # Delivery coverage check
│   │   │   ├── menu/           # Public menu + search
│   │   │   ├── sections/       # Featured sections
│   │   │   ├── addresses/      # Customer address management
│   │   │   ├── feedback/       # Customer feedback submission
│   │   │   ├── analytics/      # Web vitals reporting
│   │   │   ├── account/        # Account profile + settings
│   │   │   └── health/         # Health check endpoint
│   │   ├── auth/               # Supabase auth callbacks + confirm + expired
│   │   ├── contexts/           # App-level React contexts
│   │   ├── offline/            # Offline fallback page
│   │   ├── layout.tsx          # Root layout (fonts, providers, PWA)
│   │   ├── providers.tsx       # Client provider tree
│   │   ├── globals.css         # Tailwind v4 base styles + CSS tokens
│   │   ├── error.tsx           # Root error boundary
│   │   ├── global-error.tsx    # Unrecoverable error boundary
│   │   ├── not-found.tsx       # 404 page
│   │   ├── robots.ts           # robots.txt generation
│   │   └── sitemap.ts          # Sitemap generation
│   ├── components/
│   │   ├── ui/                 # All React components
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── account/        # Account page tabs
│   │   │   ├── auth/           # Auth form components
│   │   │   ├── brand/          # Brand mascot, logos
│   │   │   ├── cart/           # Cart drawer + cart items
│   │   │   ├── checkout/       # Address input, time slot, payment success
│   │   │   ├── coverage/       # Coverage map
│   │   │   ├── customer/       # Customer-specific components
│   │   │   ├── delivery/       # Delivery info components
│   │   │   ├── driver/         # Driver dashboard components
│   │   │   ├── error-pages/    # Error state displays
│   │   │   ├── feedback/       # Feedback form components
│   │   │   ├── homepage/       # Hero, HowItWorks sections
│   │   │   ├── icons/          # Custom SVG icons
│   │   │   ├── layout/         # AppHeader, MobileDrawer
│   │   │   ├── maps/           # Google Maps wrappers
│   │   │   ├── menu/           # Menu cards, featured carousel, item detail sheet
│   │   │   ├── offline/        # OfflineIndicator, UpdatePrompt, SW registration
│   │   │   ├── orders/         # Order tracking + status timeline
│   │   │   ├── scroll/         # Scroll utility components
│   │   │   ├── search/         # Command palette
│   │   │   ├── skeleton/       # Loading skeleton components
│   │   │   ├── theme/          # ThemeProvider, DynamicThemeProvider
│   │   │   ├── transitions/    # Page/component transition components
│   │   │   └── [primitives]    # button, badge, dialog, input, etc. (shadcn/ui)
│   │   └── providers/          # DomMaxProvider
│   ├── emails/                 # React Email templates
│   ├── lib/
│   │   ├── auth/               # requireAdmin(), requireDriver(), role-redirect
│   │   ├── badges/             # Badge utilities
│   │   ├── constants/          # App-wide constants (kitchen coords, etc.)
│   │   ├── design-system/      # Design tokens (motion, z-index)
│   │   │   └── tokens/
│   │   ├── driver/             # Driver utility logic
│   │   ├── earnings/           # Earnings calculation
│   │   ├── email/              # Resend client + sendEmail service
│   │   ├── gsap/               # GSAP animation helpers
│   │   ├── health/             # Health check logic
│   │   ├── hooks/              # 45+ custom React hooks
│   │   ├── micro-interactions/ # UI micro-interaction utilities
│   │   ├── motion-tokens/      # Framer Motion animation tokens
│   │   ├── providers/          # QueryProvider, AnimationProvider
│   │   ├── queries/            # Server-side Supabase queries (sections, delivery-stats)
│   │   ├── rate-limit/         # Rate limiter clients + check helpers
│   │   ├── search/             # Menu search logic
│   │   ├── services/           # Business service modules
│   │   │   ├── cart-idb-storage.ts    # IndexedDB cart persistence
│   │   │   ├── cod-order.ts           # COD order creation
│   │   │   ├── coverage.ts            # Delivery coverage logic
│   │   │   ├── geocoding.ts           # Address geocoding
│   │   │   ├── offline-store/         # Customer offline sync
│   │   │   └── route-optimization/    # Google Routes API integration
│   │   ├── settings/           # Business rules + app settings loader
│   │   ├── stores/             # Zustand stores (cart, checkout, driver, animation)
│   │   ├── stripe/             # Stripe SDK client + promo validation
│   │   ├── supabase/           # Supabase clients (client, server, middleware, storage)
│   │   ├── swipe-gestures/     # Touch gesture utilities
│   │   ├── utils/              # Pure utility functions
│   │   ├── validations/        # Zod schemas for API request bodies
│   │   ├── validators/         # Domain validators
│   │   └── webgl/              # WebGL/canvas utilities
│   ├── proxy.ts                # Next.js middleware entry (re-exports updateSession)
│   ├── stories/                # Storybook stories
│   ├── styles/                 # Additional CSS (if any)
│   ├── test/                   # Vitest test setup + shared test utilities
│   └── types/                  # TypeScript type definitions
│       ├── database.ts         # Supabase generated + extended DB types
│       ├── cart.ts             # Cart types + constants
│       ├── checkout.ts         # Checkout flow types
│       ├── delivery.ts         # Delivery schedule types
│       ├── driver.ts           # Driver + route types
│       ├── menu.ts             # Menu item types
│       ├── order.ts            # Order types
│       ├── tracking.ts         # Tracking API response types
│       ├── address.ts          # Address types
│       ├── analytics.ts        # Analytics types
│       ├── featured-sections.ts
│       ├── feedback.ts
│       └── layout.ts
├── supabase/
│   └── migrations/             # 65 SQL migration files
├── e2e/                        # Playwright end-to-end tests
│   ├── factories/              # Test data factories
│   ├── mocks/                  # MSW mocks for E2E
│   └── *.spec.ts               # Test files (20+ spec files)
├── data/                       # YAML seed files for menu
├── docs/                       # Architecture guides
├── scripts/                    # Build scripts (build-sw.mjs for Serwist)
├── public/                     # Static assets, icons, manifest, sw.js
├── .claude/                    # Claude AI context and learnings
├── .planning/                  # GSD planning artifacts
├── .husky/                     # Git hooks
├── next.config.ts              # Next.js + Sentry + bundle analyzer config
├── tsconfig.json               # TypeScript config (strict mode)
├── vitest.config.ts            # Vitest unit test config
├── playwright.config.ts        # Playwright E2E config
├── package.json                # Dependencies + scripts
└── middleware.ts               # (does not exist — entry is src/proxy.ts)
```

## Directory Purposes

**`src/app/(admin)/admin/`:**
- Purpose: Admin dashboard — orders, drivers, routes, menu, analytics, settings
- Contains: Server Components (data fetching layouts), Client Components (interactive pages), co-located siblings
- Key files: `layout.tsx` (auth guard), `page.tsx` (dashboard), `orders/page.tsx`, `routes/page.tsx`

**`src/app/(customer)/`:**
- Purpose: Authenticated customer flows — cart, checkout, order history, account
- Contains: Pages and client components for the shopping/order lifecycle
- Key files: `layout.tsx`, `cart/page.tsx`, `checkout/page.tsx`, `orders/[id]/tracking/page.tsx`

**`src/app/(driver)/driver/`:**
- Purpose: Driver mobile PWA — active route, stop navigation, earnings, schedule
- Contains: Mobile-optimized pages with touch interactions
- Key files: `page.tsx` (home/dashboard), `route/page.tsx` (active route), `route/[stopId]/page.tsx`

**`src/app/(public)/`:**
- Purpose: Unauthenticated pages — homepage, public menu, order share, driver onboarding
- Contains: Server-rendered marketing and browsing pages
- Key files: `page.tsx` (homepage), `menu/page.tsx`, `orders/[id]/share/page.tsx`

**`src/app/api/`:**
- Purpose: All API endpoints — organized by domain, all under `/api/` prefix
- Contains: `route.ts` + optional `validation.ts`, `helpers.ts`, `types.ts`, `__tests__/` per route
- Key files: `checkout/session/route.ts`, `webhooks/stripe/route.ts`, `tracking/[orderId]/route.ts`

**`src/components/ui/`:**
- Purpose: All React components — domain features and shadcn/ui primitives
- Contains: Domain components in subdirectories, shadcn primitives as flat files (`button.tsx`, `badge.tsx`, etc.)
- Key files: `admin/AdminNav.tsx`, `menu/UnifiedMenuItemCard/`, `cart/CartPage/`, `layout/AppHeader/`

**`src/lib/`:**
- Purpose: All shared non-UI code — services, hooks, stores, utilities, clients
- Contains: Organized by concern (see directory layout above)
- Key files: `supabase/server.ts`, `auth/admin.ts`, `stores/cart-store.ts`, `email/send.ts`, `rate-limit/index.ts`

**`src/types/`:**
- Purpose: TypeScript type definitions shared across the app
- Contains: Domain types, Supabase DB types, API response shapes
- Exempt from 400-line rule

**`supabase/migrations/`:**
- Purpose: Database schema evolution — sequential SQL migrations
- Generated: No (hand-authored)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout — fonts, global providers, PWA infrastructure
- `src/app/providers.tsx`: Client provider tree (Theme, Query, Motion)
- `src/proxy.ts`: Next.js middleware — delegates to `src/lib/supabase/middleware.ts`

**Supabase Clients:**
- `src/lib/supabase/server.ts`: `createClient()` (auth-aware), `createPublicClient()` (no cookies), `createServiceClient()` (service role for webhooks/crons)
- `src/lib/supabase/client.ts`: Browser client for Client Components
- `src/lib/supabase/middleware.ts`: Session refresh + auth redirect logic

**Auth Guards:**
- `src/lib/auth/admin.ts`: `requireAdmin()` — use in all admin API routes
- `src/lib/auth/driver.ts`: `requireDriver()` — use in all driver API routes

**Business Rules:**
- `src/lib/settings/index.ts`: `getBusinessRules()` — loads from `app_settings` DB table
- `src/lib/constants/kitchen.ts`: Restaurant location coords (Covina CA)

**State Stores:**
- `src/lib/stores/cart-store.ts`: Cart (Zustand + IDB persist)
- `src/lib/stores/checkout-store.ts`: Checkout session state
- `src/lib/stores/driver-store.ts`: Driver active route state

**Email Service:**
- `src/lib/email/send.ts`: `sendEmail()` — main email dispatch with idempotency
- `src/emails/OrderConfirmation.tsx`, `OutForDelivery.tsx`, `OrderDelivered.tsx`: Key transactional templates

**Rate Limiting:**
- `src/lib/rate-limit/index.ts`: Exports all named limiters + `checkRateLimit()`

**Design Tokens:**
- `src/app/globals.css`: Tailwind v4 `@theme inline` block — source of truth for all CSS tokens (62+ tokens)
- `src/lib/design-system/tokens/z-index.ts`: z-index constants
- `src/lib/design-system/tokens/motion.ts`: Animation duration/easing constants

**Configuration:**
- `next.config.ts`: Next.js + Sentry + bundle analyzer + CSP headers
- `tsconfig.json`: TypeScript strict mode, `@/*` path alias → `./src/*`

**Testing:**
- `src/test/`: Vitest setup files and shared test helpers
- `e2e/`: Playwright specs + factories + mocks

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` or `PascalCase/index.tsx` (subfolder barrel)
- Hooks: `useCamelCase.ts`
- Utilities/services: `camelCase.ts`
- API routes: always `route.ts`
- API co-located files: `validation.ts`, `helpers.ts`, `types.ts`
- Test files: `*.test.ts` / `*.spec.ts` (E2E) inside `__tests__/` subdirectories or in `e2e/`

**Directories:**
- Route groups: `(kebab-case)` (Next.js convention)
- Component subfolders: `PascalCase/` (matches component name)
- Feature subdirs in `components/ui/`: `kebab-case/` (e.g., `error-pages/`, `admin/`)

## Where to Add New Code

**New Customer-Facing Page:**
- Page: `src/app/(customer)/[page-name]/page.tsx`
- Layout shared by customer routes: `src/app/(customer)/layout.tsx` (already exists)

**New Admin Page:**
- Page: `src/app/(admin)/admin/[feature]/page.tsx`
- Co-located Client Components: `src/app/(admin)/admin/[feature]/FeatureClient.tsx`

**New API Endpoint:**
- Handler: `src/app/api/[domain]/[resource]/route.ts`
- Validation: `src/app/api/[domain]/[resource]/validation.ts`
- Tests: `src/app/api/[domain]/[resource]/__tests__/route.test.ts`

**New UI Component (complex):**
- Subfolder: `src/components/ui/[domain]/ComponentName/index.tsx`
- Sub-files: `src/components/ui/[domain]/ComponentName/SubPart.tsx`, `useHook.ts`

**New UI Component (simple):**
- Single file: `src/components/ui/[domain]/ComponentName.tsx`

**New Custom Hook:**
- Location: `src/lib/hooks/useFeatureName.ts`

**New Utility Function:**
- Location: `src/lib/utils/[topic].ts`

**New Zod Validation Schema:**
- Location: `src/lib/validations/[domain].ts`

**New TypeScript Types:**
- Shared domain types: `src/types/[domain].ts`
- Route-specific types: co-located `types.ts` next to `route.ts`

**New Email Template:**
- Template: `src/emails/TemplateName.tsx`
- Add type to `src/lib/email/types.ts` → wire up in `src/lib/email/send.ts`

**New Database Migration:**
- File: `supabase/migrations/[YYYYMMDD]_[description].sql`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning artifacts — phases, milestones, codebase docs, debug notes
- Generated: Partially (agent-history.json)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude AI context, learnings, hooks, session logs
- Generated: Partially
- Committed: Yes

**`public/sw.js`:**
- Purpose: Compiled Serwist service worker
- Generated: Yes (via `scripts/build-sw.mjs`)
- Committed: Yes (must be committed for production)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`supabase/migrations/`:**
- Purpose: Sequential DB migrations applied via Supabase CLI
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-04*
