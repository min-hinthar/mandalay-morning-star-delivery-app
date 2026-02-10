# Mandalay Morning Star

A Progressive Web App for ordering authentic Burmese cuisine with Saturday-only delivery in Southern California.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)]()
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4)]()
[![License](https://img.shields.io/badge/license-private-red)]()

## Overview

Mandalay Morning Star is a full-featured food delivery platform serving the Southern California Burmese community. Customers browse a categorized bilingual menu (English/Burmese), place orders with Stripe payment, and receive Saturday delivery within the coverage area (50 miles / 90 minutes from Covina, CA). The app includes admin dashboards, driver management with GPS tracking, real-time order tracking, and full offline support as a PWA.

**Current version:** v1.6 (Production Polish) — in progress
**Status:** 54 phases, 245 plans, 297 requirements completed across 7 milestones

## Features

### Customer Experience
- Categorized menu with search, filters, and bilingual support (47 items, 8 categories)
- Unified menu cards with glassmorphism, 3D tilt, and shine effects
- Cart with Zustand persistence, swipe-to-delete, fly-to-cart animations
- Multi-step checkout: Address → Time Slot → Stripe Payment
- Real-time order tracking with live driver map and ETA
- Order history, feedback/ratings (1-5 stars), address management
- PWA: installable, offline menu browsing, push notifications

### Admin Dashboard
- Menu item CRUD with photo uploads (Supabase Storage)
- Order management with status updates, refunds
- Driver management, invite system (magic link onboarding)
- Route creation and optimization (Google Routes API)
- Featured sections management
- Analytics: driver performance, delivery metrics, customer feedback
- Email management: delivery log, resend failures, manual triggers, kill switch

### Driver Mobile Interface
- Active route view with stop list and Google Maps
- GPS location tracking (adaptive intervals)
- Delivery photo capture with proof of delivery
- Offline support (IndexedDB + Service Worker sync)
- Route optimization with before/after comparison

### Transactional Email System
- 4 branded email templates: order confirmation, cancellation, refund, delivery reminder
- React Email + Resend for rendering and delivery
- Stripe webhook idempotency (prevents duplicate sends on retries)
- Customer notification preferences (opt-out per email type)
- Admin kill switch to disable all emails instantly
- Delivery reminder cron (morning-of with staggered sends)
- Resend webhook tracking: delivered, opened, clicked, bounced status
- Admin email log with search, filter, resend, and manual trigger

### Platform Capabilities
- Animation-first design: GSAP timelines + Framer Motion components
- Device-adaptive animations (low-power/high-power tiers)
- OLED dark mode with circular reveal theme switching
- 62+ design tokens enforced via ESLint (z-index, colors, spacing, shadows, blur)
- Service worker with CacheFirst (images) / NetworkFirst (API) strategies
- Zero CLS, shimmer placeholders, hero preloading
- WCAG AAA contrast compliance (38 tests)

### Performance (v1.5)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP (Homepage) | 19.9s | 11.4s | 43% faster |
| LCP (Menu) | 18.2s | 9.8s | 46% faster |
| Framer Motion bundle | ~34KB/component | ~4.6KB/component | 86% smaller |

Key optimizations: CardImage to Next.js Image, LazyMotion with domMax, React Compiler enabled, Lighthouse CI regression gate. See [PERFORMANCE.md](./PERFORMANCE.md) for full optimization journey.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.2 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict mode) | 5.x |
| Styling | Tailwind CSS + shadcn/ui + Radix UI | 4.x |
| Animation | Framer Motion + GSAP | 12.26.1 + 3.14.2 |
| Client State | Zustand | 5.0.10 |
| Server State | TanStack React Query | 5.90.1 |
| Forms | React Hook Form + Conform + Zod | 7.71.1 + 1.15.1 + 4.3.5 |
| Auth & DB | Supabase (Auth + Postgres + RLS + Storage) | 2.90.1 |
| Payments | Stripe | 20.1.2 |
| Email | Resend + React Email | - |
| Maps | Google Maps API (@react-google-maps/api) | 2.20.8 |
| PWA | Serwist (Service Worker) | 9.5.4 |
| Error Tracking | Sentry | 10.34.0 |
| Analytics | Vercel Analytics | 1.6.1 |
| Testing (Unit) | Vitest | 4.0.17 |
| Testing (E2E) | Playwright | 1.57.0 |
| Testing (A11y) | Axe-core | 4.11.0 |
| Component Dev | Storybook | 10.1.11 |
| Visual Testing | Chromatic | 5.0.0 |
| Performance | Lighthouse CI | - |
| Linting | ESLint 9 + Stylelint 17 + Prettier 3.7 | - |
| Git Hooks | Husky + lint-staged | 9.1.7 |
| Package Manager | pnpm | - |
| Hosting | Vercel | - |

## Business Rules

| Rule | Value |
|------|-------|
| Delivery Day | Saturday only, 11 AM - 7 PM PT |
| Order Cutoff | Friday 3:00 PM PT |
| Delivery Fee | $15 (free for orders $100+) |
| Coverage Area | 50 miles AND 90 minutes drive time from kitchen |
| Kitchen Location | 750 Terrado Plaza, Suite 33, Covina, CA 91723 |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Google Maps API key (Geocoding + Routes API enabled)
- Stripe account (test mode for development)
- Resend account (for transactional emails)

### Installation

```bash
git clone https://github.com/min-hinthar/mandalay-morning-star-delivery-app.git
cd mandalay-morning-star-delivery-app
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Stripe (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend (transactional emails)
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...   # optional, for delivery tracking

# Cron (delivery reminders)
CRON_SECRET=your_cron_secret      # optional, secures /api/cron/* endpoints

# App URL (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry (optional)
SENTRY_DSN=https://...@sentry.io/...
```

## Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Passwordless login (magic link + OAuth)
│   ├── (public)/                # Home, public menu, driver onboarding
│   ├── (customer)/              # Menu, cart, checkout, orders, tracking, account
│   ├── (admin)/                 # Admin dashboard (menu, orders, drivers, routes, emails)
│   ├── (driver)/                # Driver mobile (routes, stops, location, photos)
│   ├── api/                     # 100+ API routes (see API section)
│   ├── auth/                    # Auth callback handlers
│   └── contexts/                # React context providers
├── emails/                      # React Email templates + shared components
│   ├── components/              # EmailLayout, BrandHeader, BrandFooter, etc.
│   ├── OrderConfirmation.tsx    # MAIL-01
│   ├── OrderCancellation.tsx    # MAIL-02
│   ├── RefundNotification.tsx   # MAIL-03
│   └── DeliveryReminder.tsx     # MAIL-04
├── components/ui/               # 70+ React components
│   ├── admin/                   # Admin: orders, drivers, routes, analytics
│   ├── auth/                    # Login/signup forms
│   ├── cart/                    # Cart drawer, items, summary
│   ├── checkout/                # Checkout stepper, address, time, payment
│   ├── menu/                    # Menu grid, tabs, search, featured carousel
│   ├── driver/                  # Driver mobile UI
│   ├── orders/                  # Order tracking, history, feedback
│   ├── layout/                  # Headers, navigation, drawers, app shell
│   ├── brand/                   # Logo, branding
│   └── theme/                   # Theme switching
├── lib/                         # Shared utilities
│   ├── auth/                    # Supabase auth helpers
│   ├── constants/               # Business rules, config
│   ├── email/                   # Email service (Resend client, sendEmail, types)
│   ├── design-system/           # Design tokens, animations
│   ├── hooks/                   # 30+ custom React hooks
│   ├── queries/                 # React Query definitions
│   ├── services/                # Business logic services
│   ├── stores/                  # Zustand stores (cart)
│   ├── supabase/                # Supabase client setup
│   ├── utils/                   # Helper functions
│   └── validators/              # Input validators
├── types/                       # TypeScript type definitions (12 files)
└── test/                        # Test fixtures and mocks

supabase/
├── migrations/                  # Database migrations (000-020)
│   ├── 000_initial_schema.sql   # Tables, enums, indexes
│   ├── 001_functions_triggers.sql
│   ├── 002_rls_policies.sql     # Row-level security
│   ├── 003_analytics.sql        # Materialized views
│   ├── 004_storage.sql          # Storage buckets
│   ├── 005_testing.sql          # pgTAP + linting
│   ├── 019_customer_settings.sql # Customer + admin settings
│   └── 020_email_system.sql     # Webhook events + enum expansions
└── functions/                   # Edge functions (legacy)

docs/                            # Documentation (see docs/README)
scripts/                         # Build and utility scripts
e2e/                             # Playwright E2E tests
data/                            # Menu seed YAML
public/                          # Static assets (logos, icons, images)
.planning/                       # GSD project tracking (phases, milestones)
.storybook/                      # Storybook configuration
.github/                         # CI/CD workflows
```

## API Routes

| Domain | Endpoints | Purpose |
|--------|-----------|---------|
| Menu | `/api/menu`, `/api/menu/search` | Menu browsing, search |
| Sections | `/api/sections` | Featured sections |
| Addresses | `/api/addresses[/id][/default]` | Address CRUD, geocoding |
| Checkout | `/api/checkout/session` | Stripe session creation |
| Coverage | `/api/coverage/check` | Delivery area validation |
| Orders | `/api/orders[/id][/cancel][/rating]` | Order CRUD, feedback |
| Tracking | `/api/tracking/[orderId]` | Real-time order tracking |
| Webhooks | `/api/webhooks/stripe` | Payment + email triggers (idempotent) |
| Webhooks | `/api/webhooks/resend` | Email delivery status tracking |
| Cron | `/api/cron/delivery-reminders` | Morning-of delivery reminder emails |
| Admin Menu | `/api/admin/menu[/id][/photo]` | Menu item management |
| Admin Orders | `/api/admin/orders[/id][/...actions]` | Order management, refunds |
| Admin Drivers | `/api/admin/drivers[/id][/routes][/ratings]` | Driver CRUD |
| Admin Routes | `/api/admin/routes[/id][/optimize][/stops]` | Route management |
| Admin Analytics | `/api/admin/analytics/[drivers\|delivery]` | Dashboard data |
| Driver | `/api/driver/[me\|routes\|location]` | Driver operations |
| Admin Emails | `/api/admin/emails[/id][/resend][/send]` | Email log, resend, manual trigger |
| Test Email | `/api/emails/test` | Send test emails from admin settings |
| Account | `/api/account/[profile\|orders\|addresses]` | Customer account |

## Database

20+ tables with Row-Level Security on all tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (customer/admin/driver roles) |
| `addresses` | Customer delivery addresses (geocoded) |
| `menu_categories` | Menu categories with sort order |
| `menu_items` | Menu items with modifiers, pricing |
| `orders` / `order_items` | Orders and line items |
| `drivers` | Driver profiles, vehicle info |
| `routes` / `route_stops` | Delivery routes and stops |
| `delivery_photos` | Proof of delivery photos |
| `delivery_exceptions` | Delivery issue tracking |
| `driver_ratings` | Customer feedback (1-5 stars) |
| `notification_logs` | Email notification tracking (status, delivery events) |
| `webhook_events` | Stripe webhook idempotency (prevents duplicate processing) |
| `customer_settings` | Dietary, notification, display preferences |
| `app_settings` | Admin-configurable settings (email kill switch, etc.) |
| `featured_sections` | Dynamic homepage sections |

**Security:** RLS enabled on all tables, `is_admin()` / `is_driver()` / `get_my_driver_id()` SECURITY DEFINER functions, all FK columns indexed.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (Next.js + service worker) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:css` | Run Stylelint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm test:a11y` | Accessibility tests |
| `pnpm test:animations` | Animation tests |
| `pnpm audit:tokens` | Design token audit |
| `pnpm format:check` | Prettier format check |
| `pnpm storybook` | Storybook dev server (port 6006) |
| `pnpm build-storybook` | Build static Storybook |
| `pnpm analyze` | Bundle analysis |
| `pnpm lighthouse` | Lighthouse CI audit |
| `pnpm seed:menu` | Seed menu data from YAML |
| `pnpm verify:menu` | Verify menu data integrity |
| `pnpm rls:test` | Test RLS policy isolation |

**Verification command (run before committing):**
```bash
pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm build
```

## Milestones

| Version | Name | Phases | Plans | Shipped |
|---------|------|--------|-------|---------|
| v1.0 | MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 | Tech Debt Cleanup | 9-14 | 21 | 2026-01-23 |
| v1.2 | Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |
| v1.3 | Full Codebase Consolidation | 25-34 | 53 | 2026-01-28 |
| v1.4 | Mobile Excellence | 35-39 | 39 | 2026-02-05 |
| v1.5 | Performance & Repo Health | 40-47 | 34 | 2026-02-07 |
| **v1.6** | **Production Polish** | 48-57 | 30+ | In Progress |

## Deployment

### Vercel

1. Import repo at [vercel.com/new](https://vercel.com/new), select `main` branch
2. Set environment variables (see `.env.example`)
3. Configure Supabase auth callback: `https://your-app.vercel.app/auth/callback`
4. Configure Stripe webhook: `https://your-app.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`
5. Push to `main` — Vercel auto-deploys

### Database Migration

Run migration `020_email_system.sql` on your Supabase project. This creates:
- `webhook_events` table (Stripe idempotency)
- New enum values: `cancellation`, `refund`, `delivery_reminder` (notification_type); `opened`, `clicked` (notification_status)
- `email_sending_enabled` app setting (admin kill switch)

```bash
# Via Supabase CLI
supabase db push

# Or manually via Supabase Dashboard > SQL Editor
# Copy and run supabase/migrations/020_email_system.sql
```

### Resend Setup

1. Create account at [resend.com](https://resend.com)
2. **Verify sending domain:** Add `mandalaymorningstar.com` in Resend Dashboard > Domains
   - Add the DNS records (MX, TXT, DKIM) to your domain registrar
   - Wait for verification (usually < 5 minutes)
3. **Create API key:** Resend Dashboard > API Keys > Create API Key
   - Set `RESEND_API_KEY` in Vercel environment variables
4. **Configure webhook (optional, for delivery tracking):**
   - Resend Dashboard > Webhooks > Add Webhook
   - URL: `https://your-app.vercel.app/api/webhooks/resend`
   - Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
   - Copy signing secret → set `RESEND_WEBHOOK_SECRET` in Vercel

### Delivery Reminder Cron

The delivery reminder emails fire via `/api/cron/delivery-reminders`. Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/delivery-reminders",
      "schedule": "0 16 * * 5"
    }
  ]
}
```

This runs every Friday at 4 PM UTC (8 AM PT) — morning of Saturday delivery.

Set `CRON_SECRET` in Vercel env vars, then Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header.

### Production Checklist

- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain
- [ ] Supabase callback URL configured
- [ ] Supabase migration `020_email_system.sql` applied
- [ ] Stripe using LIVE keys
- [ ] Stripe webhook endpoint verified (including `charge.refunded` event)
- [ ] Google Maps API key restricted to production domain
- [ ] Resend domain verified (`mandalaymorningstar.com`)
- [ ] `RESEND_API_KEY` set in Vercel
- [ ] Resend webhook configured (optional, for open/click tracking)
- [ ] `CRON_SECRET` set and cron job configured in `vercel.json`
- [ ] Sentry DSN configured
- [ ] Custom domain configured (optional)

## Documentation

| Document | Path |
|----------|------|
| Architecture | `docs/architecture.md` |
| Data Model | `docs/04-data-model.md` |
| Menu System | `docs/05-menu.md` |
| Stripe Integration | `docs/06-stripe.md` |
| Frontend Design System | `docs/frontend-design-system.md` |
| Component Guide | `docs/component-guide.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| Z-Index Strategy | `docs/STACKING-CONTEXT.md` |
| Performance Guide | `PERFORMANCE.md` |
| Change Log | `docs/change_log.md` |
| Project Status | `docs/project_status.md` |
| Business Context | `docs/00-context-pack.md` |

## Troubleshooting

### Auth Callback 303 Error
1. Verify `NEXT_PUBLIC_APP_URL` in Vercel env vars
2. Add production callback URL in Supabase Dashboard > Auth > URL Configuration
3. Check browser console for CORS/redirect errors

### Build Failures
```bash
pnpm lint && pnpm typecheck && pnpm build
```
Common: missing env vars, TypeScript errors, ESLint violations

### Stripe Webhook Issues
1. Verify webhook secret matches `STRIPE_WEBHOOK_SECRET`
2. Check Stripe Dashboard > Developers > Webhooks for delivery logs
3. Confirm endpoint URL: `/api/webhooks/stripe`
4. Required events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`

### Emails Not Sending
1. Verify `RESEND_API_KEY` is set and valid
2. Check admin kill switch: Admin > Settings > Email > Email Sending toggle must be ON
3. Verify domain `mandalaymorningstar.com` is verified in Resend Dashboard
4. Check customer notification preferences (Settings > Notifications)
5. View email log: Admin > Emails for delivery status and errors

### Database Connection
1. Verify Supabase URL and keys
2. Check Supabase Dashboard > Project Settings > API
3. Confirm RLS policies: `SELECT * FROM testing.check_rls_enabled()`

## Contributing

1. Branch: `git checkout -b feat/feature-name`
2. Develop with checks: `pnpm lint && pnpm typecheck && pnpm build`
3. Commit: conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
4. Push and create PR

## License

Private - All rights reserved.
