# Architecture

**Analysis Date:** 2026-01-21

## Pattern Overview

**Overall:** Next.js App Router with layered architecture (Pages/UI → API Routes → Services → Data Access)

**Key Characteristics:**
- Role-based multi-tenant system (Customer, Driver, Admin)
- Server-first approach with selective client components
- Stripe payment integration for transactions
- Supabase for database and authentication
- Real-time order tracking and delivery management

## Layers

**Page/Route Layer:**
- Purpose: Request entry points, server-side rendering, data fetching
- Location: `src/app/` (subdirectories per route)
- Contains: Next.js page components, layouts, error boundaries
- Depends on: API routes, services, queries, components
- Used by: End users through HTTP requests

**API Route Layer:**
- Purpose: Server-side HTTP endpoints for client requests
- Location: `src/app/api/`
- Contains: Request handlers, validation schemas, authentication checks, business logic
- Depends on: Auth helpers, Supabase clients, service utilities, type validation
- Used by: Client-side fetch calls, webhook handlers, admin dashboards

**Service/Business Logic Layer:**
- Purpose: Reusable domain logic, calculations, external service integrations
- Location: `src/lib/services/`, `src/lib/utils/`
- Contains: Order calculations, geocoding, route optimization, analytics helpers, logging
- Depends on: Database types, validation schemas, Supabase clients
- Used by: API routes, queries, client components

**Query/Data Access Layer:**
- Purpose: Structured server-side data fetching from database
- Location: `src/lib/queries/` (e.g., `menu.ts`)
- Contains: Supabase select queries with joins, type-safe result handling
- Depends on: Supabase server client, database types
- Used by: Page components via Suspense, not called from client

**Component Layer:**
- Purpose: UI rendering with interactivity
- Location: `src/components/`
- Contains: Feature components (cart, menu, checkout), UI primitives (button, dialog), layout shells
- Depends on: Hooks, stores, utilities, TailwindCSS
- Used by: Page components, other components

**State Management Layer:**
- Purpose: Client-side state persistence and sharing
- Location: `src/lib/stores/`, `src/hooks/`
- Contains: Zustand stores (cart store), custom hooks
- Depends on: Zustand, localStorage wrapper
- Used by: Client components, provider wrappers

**Utility/Helper Layer:**
- Purpose: Cross-cutting concerns and pure functions
- Location: `src/lib/utils/`, `src/lib/constants/`
- Contains: Currency formatting, price calculations, order validation, logger, rate limiting
- Depends on: Sentry, standard libraries
- Used by: Services, routes, components

## Data Flow

**Customer Order Flow:**

1. User browses menu (`GET /menu`) → `MenuPage` → `getMenuWithCategories()` query → fetches from Supabase
2. User adds items to cart → `useCartStore` updates Zustand state → persisted to localStorage
3. User proceeds to checkout → `CartPage` renders checkout form
4. User submits checkout → `POST /api/checkout/session` route handler:
   - Validates request with Zod schema
   - Authenticates user via Supabase auth
   - Validates address ownership and delivery coverage
   - Fetches menu items and modifier options from database
   - Calls `validateCartItems()` (service layer) to verify items and prices
   - Calls `calculateOrderTotals()` to compute subtotal, delivery fee, tax, total
   - Creates order in database with status "pending"
   - Calls `getOrCreateStripeCustomer()` to link customer
   - Calls `createStripeLineItems()` to format for Stripe
   - Creates Stripe checkout session via stripe SDK
   - Returns session URL and order ID to client
5. Client redirects to Stripe Checkout → User pays
6. Stripe webhook posts to `POST /api/webhooks/stripe` → Updates order status to "confirmed" → Sends notification

**Admin Analytics Flow:**

1. Admin navigates to `/admin/analytics/delivery` → `AdminLayout` (layout component) checks auth and role via `requireAdmin()`
2. Layout redirects to login if not authenticated or not admin role
3. Page component renders `DeliveryMetricsDashboard` ("use client")
4. Dashboard calls `GET /api/admin/analytics/delivery` via React Query
5. API route checks `requireAdmin()` again, fetches metrics from `delivery_metrics_mv` materialized view
6. Returns aggregated data (on-time rate, avg delivery time, total orders, revenue)
7. Dashboard renders charts using Recharts library

**Driver Delivery Flow:**

1. Driver logs in → `DriverLayout` checks Supabase auth and driver status from `drivers` table
2. Driver navigates to `/driver` → Shows assigned route with stops
3. Driver taps stop → Shows order details, map, delivery address
4. Driver completes delivery → PUT to `/api/driver/route/[stopId]` with status update
5. API route updates stop status and recalculates ETA for remaining stops
6. Order status propagates to customer tracking page in near real-time

**State Management:**

- **Cart state:** Client-only Zustand store persisted to localStorage
  - Why: Cart must survive page refreshes and be available during checkout
  - Location: `src/lib/stores/cart-store.ts`

- **Auth state:** Server-side via Supabase cookies + JWT
  - Why: Auth credentials are sensitive, must not leak to client JS
  - Stored in: Secure httpOnly cookies (managed by Next.js middleware)

- **UI state (theme, etc.):** Next-themes context + localStorage
  - Why: Theme preference is user preference, needs to load before paint
  - Location: `src/components/theme-provider.tsx`

- **Order/delivery data:** Server-rendered at fetch time, React Query caching for re-fetches
  - Why: Order data changes frequently, needs real-time consistency
  - Fetched via: Queries (`src/lib/queries/`) and API routes with React Query

## Key Abstractions

**Role-Based Access Control:**
- Purpose: Enforce authorization at multiple layers
- Examples: `src/lib/auth/admin.ts`, `src/lib/auth/driver.ts`
- Pattern: Utility functions (`requireAdmin()`, `requireDriver()`) that return typed results with success/failure state, not throw errors
- Usage: Called in layouts and API routes to gate access

**Order Validation & Calculation:**
- Purpose: Ensure prices match database, prevent tampering, ensure consistency
- Examples: `src/lib/utils/order.ts` (validateCartItems, calculateOrderTotals, createStripeLineItems)
- Pattern: Pure functions that accept lookup maps (not queries) for testability
- Usage: Isolated in API route handlers for server-side trust

**Menu Query:**
- Purpose: Fetch complete menu with nested categories and modifiers
- Location: `src/lib/queries/menu.ts` (getMenuWithCategories)
- Pattern: Server component query with Supabase select, joins, and array mappings
- Usage: Called from menu page during server-side render via Suspense

**Logger:**
- Purpose: Structured logging with Sentry integration
- Location: `src/lib/utils/logger.ts`
- Pattern: Facade over Sentry SDK with breadcrumbs, context, and tags
- Usage: All API routes and error boundaries use `logger.exception()` and `logger.error()`

**Stripe Integration:**
- Purpose: Payment processing with metadata linking
- Location: `src/lib/stripe/server.ts`
- Pattern: Service client with helper functions (getOrCreateStripeCustomer, createLineItems)
- Usage: Called from checkout API route to create sessions and handle webhooks

## Entry Points

**Web Pages (Server Routes):**
- Location: `src/app/(public)/`, `src/app/(customer)/`, `src/app/(admin)/`, `src/app/(driver)/`
- Triggers: HTTP GET/POST from browser
- Responsibilities: Server-side data fetching, role checks (for protected routes), rendering UI

**API Endpoints:**
- Location: `src/app/api/`
- Triggers: Fetch calls from client, webhook deliveries from external services
- Responsibilities: Request validation, authentication, business logic, database mutations, error handling

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: On every page load
- Responsibilities: Font loading, metadata, provider setup (theme, query client, cart drawer), Web Vitals monitoring

**Providers:**
- Location: `src/app/providers.tsx`
- Triggers: During layout hydration
- Responsibilities: Wrapping app with QueryProvider, ThemeProvider, CartDrawer/CartBar conditional rendering based on route

## Error Handling

**Strategy:** Typed error responses with retry logic at API layer, error boundaries at component layer, Sentry tracking globally

**Patterns:**

- **API Routes:** Return typed error objects with code + message + status (not throw exceptions)
  ```typescript
  // src/app/api/checkout/session/route.ts
  function errorResponse(code: CheckoutErrorCode, message: string, status: number, details?: unknown) {
    const error: CheckoutError = { code, message, details };
    return NextResponse.json({ error }, { status });
  }
  ```

- **Auth Failures:** Use discriminated union (success: false) instead of throwing
  ```typescript
  // src/lib/auth/admin.ts
  export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;
  // Usage: if (!auth.success) { return NextResponse.json(...) }
  ```

- **Logging:** All errors go through Sentry with flowId context
  ```typescript
  logger.exception(error, { userId, orderId, api: "checkout-session", flowId: "checkout" });
  ```

- **Client-Side:** Error boundary components redirect to error pages (e.g., `src/app/(customer)/orders/error.tsx`)

## Cross-Cutting Concerns

**Logging:**
- Tool: Sentry SDK with custom logger wrapper (`src/lib/utils/logger.ts`)
- Usage: Import `logger` in services/routes, call `logger.exception()` on catch, `logger.info()` for flow tracking
- Tags: `flowId` (checkout, order-status), `api` (endpoint name), `userId`

**Validation:**
- Tool: Zod schemas (`src/lib/validations/`)
- Pattern: Define schema near where it's used (e.g., checkout schema in `checkout.ts`), call `.safeParse()` in route handlers
- Usage: Protects API routes from invalid input, enables typed error feedback to client

**Authentication:**
- Tool: Supabase Auth with JWT in httpOnly cookies
- Pattern: Server-side `createClient()` reads cookies, client-side middleware validates on protected routes
- Usage: Checked in layouts (`src/app/(admin)/admin/layout.tsx`) and API routes (`requireAdmin()`)

**Performance:**
- Server-side rendering: Menu data fetched at request time, cached via query
- Suspense: Long-running queries wrapped in Suspense with skeleton fallback (e.g., MenuSkeleton)
- React Query: 5-minute stale time for API responses to reduce refetches
- Image optimization: Centralized in `src/lib/utils/image-optimization.ts`

---

*Architecture analysis: 2026-01-21*
