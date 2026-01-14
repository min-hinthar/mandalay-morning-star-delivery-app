# Mandalay Morning Star

A Burmese food ordering PWA with Saturday-only delivery in Southern California.

## Overview

Mandalay Morning Star is a Progressive Web App for ordering authentic Burmese cuisine. Customers browse a categorized menu, place orders, and receive Saturday delivery within the coverage area (50 miles / 90 minutes from Covina, CA).

## Features

### Completed (V0 - Skeleton)

- **Authentication**: Email signup/login with Supabase Auth
- **Coverage Checker**: Address validation with Google Maps (distance + drive time)
- **Menu Browse**: 47 items across 8 categories with bilingual support (English/Burmese)
- **Mobile-First UI**: Responsive design with sticky category tabs
- **Security**: Row Level Security on all database tables

### Planned (V1 - Ordering)

- Shopping cart with modifiers
- Stripe Checkout integration
- Order confirmation and history

### Planned (V2 - Operations)

- Admin dashboard
- Driver mobile app
- Real-time delivery tracking

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Auth & DB | Supabase (Auth + Postgres + RLS) |
| Payments | Stripe Checkout |
| Maps | Google Maps API |
| Hosting | Vercel |

## Business Rules

| Rule | Value |
|------|-------|
| Delivery Day | Saturday only, 11am-7pm PT |
| Order Cutoff | Friday 3:00 PM PT |
| Delivery Fee | $15 (free for orders $100+) |
| Coverage | 50 miles AND 90 minutes drive time |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project
- Google Maps API key
- Stripe account (test mode)

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Kitchen Location (default: Covina, CA)
KITCHEN_LAT=34.0900
KITCHEN_LNG=-117.8903

# Stripe (V1)
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Seed menu data (requires Supabase connection)
npm run seed:menu

# Verify seeded data
npm run verify:menu
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (public)/          # Public pages (home, menu)
│   ├── api/               # API routes
│   └── auth/              # Auth callbacks
├── components/            # React components
│   ├── auth/              # Auth forms
│   ├── coverage/          # Coverage checker
│   ├── menu/              # Menu components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── supabase/          # Supabase clients
│   ├── queries/           # Database queries
│   └── validators/        # Zod schemas
└── middleware.ts          # Auth middleware

supabase/
└── migrations/            # Database migrations

scripts/
├── seed-menu.ts           # Menu seeding script
└── verify-menu.ts         # Data verification

docs/
├── PROJECT_SPEC.md        # Full requirements
├── architecture.md        # System diagrams
├── project_status.md      # Progress tracking
└── change_log.md          # Version history
```

## Documentation

- [Project Spec](docs/PROJECT_SPEC.md) - Full requirements and engineering design
- [Architecture](docs/architecture.md) - System diagrams and component architecture
- [Project Status](docs/project_status.md) - Current progress and milestones
- [Change Log](docs/change_log.md) - Version history

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler |
| `npm run seed:menu` | Seed menu data to Supabase |
| `npm run verify:menu` | Verify seeded menu data |

## License

Private - All rights reserved.
