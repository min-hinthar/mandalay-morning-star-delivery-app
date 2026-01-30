# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Next.js App Router with Server/Client Component Split

**Key Characteristics:**
- Server-first architecture with selective client hydration
- API routes handle backend logic and database access
- Client state managed via Zustand stores
- Server state fetched via direct Supabase queries or API routes
- Route groups organize pages by role (admin, customer, driver, public, auth)

## Layers

**Presentation Layer (Client Components):**
- Purpose: Interactive UI with animations, state, and event handlers
- Location: `src/components/ui/**/*`
- Contains: React client components with "use client" directive
- Depends on: Stores, hooks, design tokens, GSAP/Framer Motion
- Used by: Pages (both server and client components)

**Presentation Layer (Server Components):**
- Purpose: Static, SEO-friendly rendering with direct data fetching
- Location: `src/app/**/page.tsx`, `src/app/**/layout.tsx`
- Contains: React server components (no "use client")
- Depends on: Query functions, Supabase server client
- Used by: Next.js App Router

**API Layer:**
- Purpose: RESTful endpoints for CRUD operations, webhooks, and server actions
- Location: `src/app/api/**/*`
- Contains: Next.js Route Handlers (GET, POST, PATCH, DELETE)
- Depends on: Supabase server/service clients, Stripe SDK, validation schemas
- Used by: Client components via fetch/React Query

**Data Access Layer:**
- Purpose: Encapsulate database queries and external service calls
- Location: `src/lib/queries/*`, `src/lib/supabase/*`, `src/lib/stripe/*`
- Contains: Query functions, Supabase client factories, Stripe utilities
- Depends on: Supabase SDK, Stripe SDK, database types
- Used by: API routes, server components, server actions

**State Management Layer:**
- Purpose: Client-side global state with persistence
- Location: `src/lib/stores/*`
- Contains: Zustand stores (cart, checkout, driver, animations)
- Depends on: Types, constants
- Used by: Client components

**Business Logic Layer:**
- Purpose: Core business rules, calculations, and validations
- Location: `src/lib/services/*`, `src/lib/utils/*`, `src/lib/validations/*`
- Contains: Service modules, utility functions, Zod schemas
- Depends on: Types, constants
- Used by: API routes, components, stores

## Data Flow

**Server-Side Rendering (SSR):**

1. User requests page → Next.js App Router invokes server component
2. Server component calls query function (`src/lib/queries/*`)
3. Query function uses Supabase server client (`src/lib/supabase/server.ts`)
4. Data returned to component, rendered to HTML
5. HTML sent to browser (no JavaScript needed for static content)

**Client-Side Interaction:**

1. User interacts with UI → Client component event handler fires
2. Event handler updates Zustand store (`src/lib/stores/*`) or calls API
3. If API call: fetch → API route → Supabase → response → update UI
4. If store update: Zustand triggers re-render + localStorage persistence

**Checkout Flow (Critical Path):**

1. User adds items to cart → `useCartStore.addItem()` → localStorage
2. User proceeds to checkout → `src/app/(customer)/checkout/page.tsx`
3. Submit form → POST `/api/checkout/session` → validate cart server-side
4. Create order in database → Create Stripe session → redirect to Stripe
5. Payment success → Stripe webhook → `/api/webhooks/stripe` → update order status
6. Redirect to confirmation page → `src/app/(customer)/orders/[id]/confirmation/page.tsx`

**State Management:**
- Client state: Zustand with localStorage persistence (cart, checkout, driver location)
- Server state: React Query for API data caching (not yet fully adopted)
- URL state: Next.js searchParams for filters, pagination
- Form state: React Hook Form with Zod validation

## Key Abstractions

**Supabase Client Factory:**
- Purpose: Provide authenticated database access in different contexts
- Examples: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Pattern: Three client types (server w/ cookies, public, service role)

**API Route Handlers:**
- Purpose: Standardized request/response handling with auth and validation
- Examples: `src/app/api/menu/route.ts`, `src/app/api/checkout/session/route.ts`
- Pattern: Validate input → authenticate → authorize → query → respond with typed errors

**Zustand Stores:**
- Purpose: Global state with computed selectors and persistence
- Examples: `src/lib/stores/cart-store.ts`, `src/lib/stores/checkout-store.ts`
- Pattern: Create store with persist middleware, export typed hooks

**Server Query Functions:**
- Purpose: Reusable data fetching for server components
- Examples: `src/lib/queries/menu.ts`
- Pattern: Async function → Supabase query → transform to domain types

**Validation Schemas:**
- Purpose: Type-safe runtime validation for API inputs and forms
- Examples: `src/lib/validations/checkout.ts`
- Pattern: Zod schema → infer TypeScript type → use in API/forms

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All page requests
- Responsibilities: Load fonts, inject providers (Query, Theme, Toast), render header

**Homepage:**
- Location: `src/app/(public)/page.tsx`
- Triggers: User navigates to `/`
- Responsibilities: Server-fetch menu, render hero + menu sections

**API Middleware:**
- Location: Implicit in Next.js Route Handlers
- Triggers: API requests to `/api/*`
- Responsibilities: Parse request, route to handler, serialize response

**Stripe Webhook:**
- Location: `src/app/api/webhooks/stripe/route.ts`
- Triggers: Stripe events (checkout.session.completed, payment_intent.succeeded)
- Responsibilities: Verify signature, update order status, trigger notifications

## Error Handling

**Strategy:** Layered error handling with typed error codes

**Patterns:**
- API routes: Try/catch → typed error response with status code
- Server components: Error boundaries + error.tsx files
- Client components: Try/catch in event handlers → toast notifications
- Validation: Zod schemas return typed validation errors
- Database: Supabase errors logged to Sentry, generic message to user

**Error Types:**
- Validation errors: 400 with field-level details
- Auth errors: 401/403 with redirect to login
- Not found: 404 with custom UI
- Server errors: 500 with generic message (details logged to Sentry)

## Cross-Cutting Concerns

**Logging:** Structured logging via `src/lib/utils/logger.ts` → Sentry integration

**Validation:** Zod schemas in `src/lib/validations/*` → shared by API and forms

**Authentication:**
- Supabase Auth with cookie-based sessions
- Server-side auth checks via `src/lib/supabase/server.ts`
- Role-based access control via `src/lib/auth/admin.ts` and `src/lib/auth/driver.ts`

**Authorization:**
- Row-Level Security (RLS) in Supabase
- Server-side role checks in API routes
- Client-side route protection via middleware (implicit in Next.js)

**Performance Monitoring:**
- Web Vitals via `src/lib/web-vitals.tsx` → Vercel Analytics
- Sentry performance monitoring
- Lighthouse CI in GitHub Actions

**Animation:**
- GSAP for physics-based animations (`src/lib/gsap/*`)
- Framer Motion for declarative animations
- Cleanup pattern for RAF/timers to prevent memory leaks

---

*Architecture analysis: 2026-01-30*
