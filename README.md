# Mandalay Morning Star

A Burmese food ordering PWA with Saturday-only delivery in Southern California.

## Overview

Mandalay Morning Star is a Progressive Web App for ordering authentic Burmese cuisine. Customers browse a categorized menu, place orders, and receive Saturday delivery within the coverage area (50 miles / 90 minutes from Covina, CA).

## Features

### V0 - Foundation (Complete)

- **Authentication**: Email signup/login with Supabase Auth (magic links)
- **Database**: Supabase Postgres with Row Level Security
- **Menu Seed**: 47 items across 8 categories with bilingual support (English/Burmese)
- **CI/CD**: GitHub Actions with lint, typecheck, and build checks

### V1 - Ordering (Complete)

#### Sprint 1: Menu Browse
- Category tabs with horizontal scroll and scroll-spy
- Item cards with images, prices, and sold-out badges
- Search with debounced fuzzy matching
- Item detail modal with modifiers, quantity selector, and notes

#### Sprint 2: Cart + Checkout
- Cart state with Zustand (localStorage persistence)
- Cart drawer with item list, quantity controls, and summary
- Address management (CRUD + geocoding)
- Coverage validation (50 mi / 90 min from kitchen)
- Time slot picker (Saturday hourly windows, 11 AM - 7 PM)
- Checkout stepper (Address → Time → Payment)

#### Sprint 3: Payment + Confirmation
- Stripe Checkout integration
- Order creation with server-side price calculation
- Webhook handling for order confirmation
- Order confirmation page
- Email notifications (Resend)

#### Sprint 4: Admin Basics
- Admin layout with role-based access
- Menu item CRUD operations
- Category management
- Orders list with status updates
- Basic analytics dashboard

### V2 - Driver Operations (Complete)

#### Sprint 1: Admin Route Management
- Driver management (CRUD + activate/deactivate)
- Route creation and optimization (Google Routes API)
- Stop management and assignment

#### Sprint 2: Driver Mobile Interface
- Driver PWA with bottom navigation
- Active route view with stop list
- GPS location tracking (adaptive intervals)
- Delivery photo capture
- Offline support (IndexedDB + Service Worker)

#### Sprint 3: Customer Tracking
- Real-time order tracking page
- Live map with driver location
- ETA calculation and display
- Status timeline component
- Supabase Realtime subscriptions

#### Sprint 4: Analytics & Notifications
- Email notifications (out for delivery, arriving soon, delivered)
- Driver performance analytics dashboard
- Delivery metrics dashboard with charts
- Customer feedback/rating system (1-5 stars)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| State | Zustand (cart) + React Query (server) |
| Auth & DB | Supabase (Auth + Postgres + RLS) |
| Payments | Stripe Checkout |
| Maps | Google Maps API (Geocoding + Routes) |
| Hosting | Vercel |

## Business Rules

| Rule | Value |
|------|-------|
| Delivery Day | Saturday only, 11 AM - 7 PM PT |
| Order Cutoff | Friday 3:00 PM PT |
| Delivery Fee | $15 (free for orders $100+) |
| Coverage | 50 miles AND 90 minutes drive time |
| Kitchen | 750 Terrado Plaza, Suite 33, Covina, CA 91723 |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase project
- Google Maps API key (Geocoding + Routes API enabled)
- Stripe account (test mode for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/min-hinthar/mandalay-morning-star-delivery-app.git
cd mandalay-morning-star-delivery-app

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase - Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Maps - Required for coverage checking
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Stripe - Required for payments (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL - Optional (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (customer)/        # Customer pages (menu, cart, checkout)
│   ├── (public)/          # Public pages (home)
│   ├── (admin)/           # Admin pages (menu, orders)
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/              # Auth forms
│   ├── cart/              # Cart drawer, items, summary
│   ├── checkout/          # Checkout stepper, steps
│   ├── menu/              # Menu components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
│   ├── supabase/          # Supabase clients
│   ├── utils/             # Helper functions
│   └── validations/       # Zod schemas
├── types/                 # TypeScript types
└── proxy.ts               # Auth proxy (Next.js 16)

supabase/
└── migrations/            # Database migrations (ordered)
    ├── 000_initial_schema.sql      # Tables, enums, indexes
    ├── 001_functions_triggers.sql  # Helper functions, triggers
    ├── 002_rls_policies.sql        # Row-level security
    ├── 003_analytics.sql           # Materialized views
    ├── 004_storage.sql             # Storage buckets
    └── 005_testing.sql             # pgTAP + linting

docs/
├── 00-context-pack.md     # Business context
├── 04-data-model.md       # Database schema
├── 05-menu.md             # Menu system
├── 06-stripe.md           # Payment flow
├── project_status.md      # Progress tracking
├── change_log.md          # Change history
├── v1-spec.md             # V1 specifications
└── V1/tasks/              # Task specifications
```

## Database Security

The database migrations implement Supabase security best practices:

| Feature | Implementation |
|---------|----------------|
| Row-Level Security | Enabled on all tables with consolidated policies |
| Auth Optimization | `(select auth.uid())` pattern for query performance |
| Role Checks | `is_admin()`, `is_driver()` SECURITY DEFINER functions |
| FK Indexes | All foreign key columns indexed for JOIN performance |
| Function Security | All functions have immutable `search_path` |

Run `SELECT * FROM testing.check_rls_enabled()` to verify RLS status.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript compiler |
| `pnpm test` | Run tests |

## Documentation

- [Project Status](docs/project_status.md) - Current progress and milestones
- [V1 Specification](docs/v1-spec.md) - Feature specifications
- [Data Model](docs/04-data-model.md) - Database schema and RLS
- [Frontend Design](docs/frontend-design-system.md) - UI/UX patterns

## Contributing

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make your changes
3. Run checks: `pnpm lint && pnpm typecheck && pnpm build`
4. Commit with conventional commits: `git commit -m "feat: add feature"`
5. Push and create a PR

## License

Private - All rights reserved.
