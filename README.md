# Mandalay Morning Star

A Progressive Web App for ordering authentic Burmese cuisine with multi-day delivery across Southern California.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)]()
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4)]()
[![License](https://img.shields.io/badge/license-private-red)]()

## Overview

Mandalay Morning Star is a full-featured food delivery platform serving the Southern California Burmese community. Customers browse a bilingual menu (English/Burmese), place orders via Stripe or Cash on Delivery, and receive delivery on configurable days (Mon/Wed/Thu/Sat) with direction-based routing (East/West/South) and distance-tiered fees. The app includes admin dashboards, a delivery ops command center, driver management with GPS tracking, real-time order tracking, a Burmese-gem loyalty & referral program, lifecycle marketing automation, and full offline PWA support.

**Current version:** v1.9 (Launch-Ready MVP)
**Status:** 86 phases, 335+ plans across 10 milestones (v1.0-v1.9) — 9 milestones shipped
**Post-launch:** Growth & retention layer (loyalty, referrals, lifecycle email/push) — see [Loyalty & Growth](#loyalty--growth).

## Features

### Customer Experience

- Categorized menu with search, filters, and bilingual support (47 items, 8 categories)
- Unified menu cards with glassmorphism, 3D tilt, and shine effects
- Cart with Zustand persistence, swipe-to-delete, fly-to-cart animations
- Multi-step checkout: Address -> Time Slot -> Payment (Stripe or Cash on Delivery)
- Pre-checkout delivery gate: dynamic hero CTA, cutoff countdown, multi-day scheduling
- **Direction-based delivery routing**: East (Mon), West (Wed), South (Thu), All (Sat)
- **Distance-tiered delivery fees**: $15 standard (free over $100), $20 flat for 25+ miles
- **Interactive coverage checker**: enter address to see direction, eligible days, and fee tier
- Real-time order tracking with live driver map, ETA, and polling indicators
- Shareable order tracking links (token-based, no auth required)
- Order history, reorder, feedback/ratings (1-5 stars), address management
- **Morning Star Rewards**: Stars (1/order), Burmese-gem tiers, coupon wallet, in-app celebration — see [Loyalty & Growth](#loyalty--growth)
- **Refer-a-friend**: share link, give $10 / get $10, WhatsApp/Viber/native share, attribution stats
- Customer settings: dietary preferences, notification opt-outs, display preferences
- PWA: installable, offline menu browsing, push notifications

### Loyalty & Growth

A retention layer that turns one-time buyers into regulars, built on Stripe promotion codes (so every reward is natively single-use, minimum-gated, and expiring) and lifecycle email + web push.

- **Morning Star Rewards** — earn 1 Star per completed order; every 5th order auto-issues a **"Kyay-Zu-Par!"** thank-you coupon, sized by tier
- **Burmese-gem tiers** — New Friend ⭐ → Kyauk Sein 💚 (Jade, 10 orders) → Padamya ❤️ (Ruby, 25) → Shwe 💛 (Gold, 50); milestone reward scales $5 → $8 → $10 → $12
- **Rewards hub** (`/account?tab=rewards`) — animated Stars ring, tier badge + climb, coupon wallet with one-tap copy and "Use →" checkout deep-link, expiry countdowns
- **In-app celebration** — confetti + banner when a reward unlocks (fires once), plus web push; push click-through lands on the rewards hub
- **Refer-a-friend** — give $10 / get $10, one-time code per referee, attribution + reward stats, share to WhatsApp/Viber/native
- **First-order auto-discount** — $10 for referred customers, $5 welcome otherwise (server-gated, no shareable code)
- **Lifecycle automation (cron)** — one-time loyalty thank-you blast, milestone rewards, 1-year anniversary gift, "reward expiring soon" nudges, win-back (lapsed 30–90 days), abandoned-cart recovery
- **Reward lifecycle** — 60-day expiry (Stripe-enforced), redemption tracking, "expiring soon" wallet flags
- **Admin insight** (`/admin/referrals`) — referral funnel + reward $, loyalty rewards issued/redeemed (count + %), and a tier-distribution strip (customers + orders per gem tier)
- Bilingual reward emails (English + Burmese), all CC'd to admin

### Admin Dashboard

- Menu item CRUD with photo uploads (Supabase Storage), category management
- Order management with status updates, refunds, refund status tracking, priority flagging
- **Cash on Delivery (COD) approval workflow**: `pending_approval` -> admin approve/reject via `/approve-cod`
- **Saturday Ops Center**: live order counts, bulk status changes, countdown timers, driver availability
- **Route & Driver Assignment**: visual route builder with maps, driver selector, stop reassignment
- **Direction-based delivery zones**: admin-configurable bearing ranges per direction
- **Multi-day delivery schedule**: admin-configurable delivery days, cutoffs, and fees per day
- **Configurable Business Rules**: delivery fee, cutoff time, delivery hours, radius, long-distance threshold — all admin-editable, no deploy needed
- Driver management, invite system (magic link onboarding), archive/restore
- Route creation and optimization (Google Routes API with nearest-neighbor fallback)
- Featured sections management with draft/publish workflow
- Analytics: driver performance, delivery metrics, customer feedback
- Email management: delivery log, resend failures, manual triggers, kill switch, retry with failure tracking
- Admin daily digest cron (morning + evening summaries)
- Photo pipeline: upload, process, verify from Google Drive

### Driver Mobile Interface

- Active route view with stop list and Google Maps
- GPS location tracking (adaptive intervals)
- Delivery photo capture with proof of delivery
- Offline support (IndexedDB + Service Worker sync)
- Route optimization with before/after comparison
- Earnings dashboard with pay rate tracking
- Availability scheduling and route visibility controls
- Guided walkthrough for first-time setup
- Exception reporting per stop (customer not home, wrong address, etc.)
- Route start/complete lifecycle with status tracking

### Transactional & Lifecycle Email System

- 18 branded email templates across two tracks:
  - **Transactional:** order confirmation, cancellation, refund, delivery reminder, admin new-order alert
  - **Lifecycle / marketing:** welcome offer, referral reward, loyalty reward (milestone / anniversary / expiring variants), win-back, abandoned-cart
- React Email + Resend for rendering and delivery
- Stripe webhook idempotency (prevents duplicate sends on retries)
- Customer notification preferences (opt-out per email type)
- Admin kill switch to disable all emails instantly
- Delivery reminder cron (morning-of with staggered sends)
- Admin daily digest cron (morning + evening)
- Resend webhook tracking with signature verification: delivered, opened, clicked, bounced status
- Admin email log with search, filter, resend, retry, and manual trigger
- Admin compose: send custom emails to customers
- Failure tracking: flagged for manual contact after 3 failed attempts

### Security & Infrastructure

- Sentry error tracking with source map uploads
- Content Security Policy (CSP) headers
- Rate limiting with 10 configurable tiers (in-memory fallback when Redis unavailable)
- RLS audit and hardening across all tables
- Role-based auth redirects (customer/admin/driver)
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — two blocking jobs: `verify` (lint, lint:css, format, typecheck, test, build) and `db-drift` (spins up a local Supabase stack, applies the baseline, fails if `database.generated.ts` doesn't match the schema)
- **Generated DB types + schema-drift guard** — `pnpm gen:types` regenerates `src/types/database.generated.ts` from the local stack; CI enforces it stays in sync
- Husky + lint-staged pre-commit hooks
- Health check endpoint (`/api/health`)

### Platform Capabilities

- Animation-first design: GSAP timelines + Framer Motion components
- Device-adaptive animations (low-power/high-power tiers)
- OLED dark mode with circular reveal theme switching
- 62+ design tokens enforced via ESLint (z-index, colors, spacing, shadows, blur)
- Service worker with CacheFirst (images) / NetworkFirst (API) strategies
- Zero CLS, shimmer placeholders, hero preloading
- WCAG AAA contrast compliance (38 tests)
- React Compiler enabled — auto-memoizes client components
- Tailwind CSS v4 with `@theme inline` as source of truth

### Performance (v1.5 + v1.7)

| Metric               | Before          | After            | Improvement |
| -------------------- | --------------- | ---------------- | ----------- |
| LCP (Homepage)       | 19.9s           | 11.4s            | 43% faster  |
| LCP (Menu)           | 18.2s           | 9.8s             | 46% faster  |
| Framer Motion bundle | ~34KB/component | ~4.6KB/component | 86% smaller |

Key optimizations: CardImage to Next.js Image, LazyMotion with domMax, React Compiler enabled, LCP optimization (v1.7), Lighthouse CI regression gate. See [PERFORMANCE.md](./PERFORMANCE.md) for full optimization journey.

## Tech Stack

| Layer           | Technology                                 | Version                 |
| --------------- | ------------------------------------------ | ----------------------- |
| Framework       | Next.js (App Router)                       | 16.1.2                  |
| UI              | React                                      | 19.2.3                  |
| Language        | TypeScript (strict mode)                   | 5.x                     |
| Styling         | Tailwind CSS + shadcn/ui + Radix UI        | 4.x                     |
| Animation       | Framer Motion + GSAP                       | 12.26.1 + 3.14.2        |
| Client State    | Zustand                                    | 5.0.10                  |
| Server State    | TanStack React Query                       | 5.90.1                  |
| Forms           | React Hook Form + Conform + Zod            | 7.71.1 + 1.15.1 + 4.3.5 |
| Auth & DB       | Supabase (Auth + Postgres + RLS + Storage) | 2.90.1                  |
| Payments        | Stripe                                     | 20.1.2                  |
| Email           | Resend + React Email                       | 6.9.1                   |
| Maps            | Google Maps API (@react-google-maps/api)   | 2.20.8                  |
| Maps (Admin)    | Leaflet + React Leaflet                    | 1.9.4                   |
| Rich Text       | TipTap                                     | 3.19.0                  |
| Rate Limiting   | Upstash Redis (@upstash/ratelimit)         | 2.0.8                   |
| PWA             | Serwist (Service Worker)                   | 9.5.4                   |
| Error Tracking  | Sentry                                     | 10.38.0                 |
| Analytics       | Vercel Analytics + Speed Insights          | 1.6.1                   |
| Image Process   | Sharp                                      | 0.34.5                  |
| Testing (Unit)  | Vitest                                     | 4.0.17                  |
| Testing (E2E)   | Playwright                                 | 1.57.0                  |
| Testing (A11y)  | Axe-core                                   | 4.11.0                  |
| Component Dev   | Storybook                                  | 10.1.11                 |
| Visual Testing  | Chromatic                                  | 5.0.0                   |
| Performance     | Lighthouse CI                              | 0.15.1                  |
| Linting         | ESLint 9 + Stylelint 17 + Prettier 3.7     | -                       |
| Git Hooks       | Husky + lint-staged                        | 9.1.7                   |
| Package Manager | pnpm                                       | -                       |
| Hosting         | Vercel                                     | -                       |

## Business Rules

| Rule                  | Value                                                             |
| --------------------- | ----------------------------------------------------------------- |
| Delivery Days         | Monday (East), Wednesday (West), Thursday (South), Saturday (All) |
| Order Cutoff          | Per-day configurable (e.g., Friday 3 PM PT for Saturday)          |
| Standard Delivery Fee | $15 (free for orders $100+)                                       |
| Extended Delivery Fee | $20 flat (addresses >25 miles, no free delivery threshold)        |
| Coverage Area         | 50 miles AND 90 minutes drive time from kitchen                   |
| Direction Zones       | East (350-80 deg), West (230-320 deg), South (140-220 deg)        |
| Kitchen Location      | 750 Terrado Plaza, Suite 33, Covina, CA 91723                     |
| Payment Methods       | Stripe (card) + Cash on Delivery (admin approval required)        |
| Minimum Order         | $25                                                               |

All business rules are admin-configurable from Settings — changes take effect on the next page load without a deploy.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Google Maps API key (Geocoding + Routes API + Maps JavaScript API enabled)
- Stripe account (test mode for development)
- Resend account (for transactional emails)
- Upstash Redis (optional, for distributed rate limiting — falls back to in-memory)

### Installation

```bash
git clone https://github.com/min-hinthar/mandalay-morning-star-delivery-app.git
cd mandalay-morning-star-delivery-app
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Required

| Variable                             | Description                                                | Where to Get                                                              |
| ------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL                                       | [Supabase Dashboard](https://app.supabase.com) > Project Settings > API   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase anonymous key                                     | Same as above                                                             |
| `SUPABASE_SERVICE_ROLE_KEY`          | Supabase service role key (server-side only, bypasses RLS) | Same as above                                                             |
| `GOOGLE_MAPS_API_KEY`                | Server-side Google Maps key (Geocoding + Routes APIs)      | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`    | Client-side Google Maps key (Maps JavaScript API)          | Same as above (can be same key with browser restriction)                  |
| `STRIPE_SECRET_KEY`                  | Stripe secret key (`sk_test_...` or `sk_live_...`)         | [Stripe Dashboard](https://dashboard.stripe.com/apikeys)                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...` or `pk_live_...`)    | Same as above                                                             |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret (`whsec_...`)                | Stripe Dashboard > Developers > Webhooks                                  |
| `RESEND_API_KEY`                     | Resend API key for transactional emails (`re_...`)         | [Resend Dashboard](https://resend.com/api-keys)                           |
| `NEXT_PUBLIC_SENTRY_DSN`             | Sentry DSN for error tracking                              | [Sentry](https://sentry.io) > Project Settings > Client Keys              |

### Optional

| Variable                         | Description                                                      | Default                 |
| -------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL`            | Application URL                                                  | `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Google Maps Map ID (for custom styling/AdvancedMarkerElement)    | None                    |
| `NEXT_PUBLIC_OPERATOR_PHONE`     | Operator phone for driver "Call for Help" button                 | None                    |
| `RESEND_WEBHOOK_SECRET`          | Resend webhook signing secret (for open/click/bounce tracking)   | None                    |
| `CRON_SECRET`                    | Secret to secure `/api/cron/*` endpoints                         | None                    |
| `STRIPE_WELCOME_COUPON_ID`       | Stripe coupon for the $5 first-order welcome discount            | Mints on demand         |
| `STRIPE_REFERRAL_COUPON_ID`      | Stripe coupon for the $10 referral / referred first-order reward | Mints on demand         |
| `STRIPE_LOYALTY_COUPON_ID`       | $5 loyalty coupon (New Friend milestone + thank-you blast)       | Mints on demand         |
| `STRIPE_LOYALTY_COUPON_ID_800`   | $8 loyalty coupon (Jade tier milestone)                          | Mints on demand         |
| `STRIPE_LOYALTY_COUPON_ID_1000`  | $10 loyalty coupon (Ruby tier milestone + anniversary)           | Mints on demand         |
| `STRIPE_LOYALTY_COUPON_ID_1200`  | $12 loyalty coupon (Gold tier milestone)                         | Mints on demand         |
| `SENTRY_AUTH_TOKEN`              | Sentry auth token for source map uploads (CI only)               | None                    |
| `SENTRY_DEBUG`                   | Enable Sentry debug mode                                         | `false`                 |
| `UPSTASH_REDIS_REST_URL`         | Upstash Redis REST URL (for distributed rate limiting)           | Falls back to in-memory |
| `UPSTASH_REDIS_REST_TOKEN`       | Upstash Redis REST token                                         | Falls back to in-memory |

### Rate Limiting (Optional Overrides)

All rate limit tiers have sensible defaults. Override to tune without redeploy:

| Variable                            | Default | Description                        |
| ----------------------------------- | ------- | ---------------------------------- |
| `RATE_LIMIT_AUTH_SIGNIN_MAX`        | 5       | Sign-in attempts per window        |
| `RATE_LIMIT_AUTH_SIGNIN_WINDOW`     | `1 m`   | Sign-in rate window                |
| `RATE_LIMIT_AUTH_SIGNUP_MAX`        | 3       | Sign-up attempts per window        |
| `RATE_LIMIT_AUTH_SIGNUP_WINDOW`     | `1 h`   | Sign-up rate window                |
| `RATE_LIMIT_API_WRITE_MAX`          | 10      | API write requests per window      |
| `RATE_LIMIT_API_WRITE_WINDOW`       | `1 m`   | API write rate window              |
| `RATE_LIMIT_PUBLIC_READ_MAX`        | 60      | Public read requests per window    |
| `RATE_LIMIT_PUBLIC_READ_WINDOW`     | `1 m`   | Public read rate window            |
| `RATE_LIMIT_DRIVER_LOCATION_MAX`    | 2       | Driver location updates per window |
| `RATE_LIMIT_DRIVER_LOCATION_WINDOW` | `1 m`   | Driver location rate window        |
| `RATE_LIMIT_DRIVER_ACTION_MAX`      | 10      | Driver actions per window          |
| `RATE_LIMIT_DRIVER_ACTION_WINDOW`   | `1 m`   | Driver action rate window          |
| `RATE_LIMIT_CUSTOMER_MAX`           | 30      | Customer requests per window       |
| `RATE_LIMIT_CUSTOMER_WINDOW`        | `1 m`   | Customer rate window               |
| `RATE_LIMIT_ADMIN_MAX`              | 120     | Admin requests per window          |
| `RATE_LIMIT_ADMIN_WINDOW`           | `1 m`   | Admin rate window                  |
| `RATE_LIMIT_GLOBAL_IP_MAX`          | 120     | Global per-IP requests per window  |
| `RATE_LIMIT_GLOBAL_IP_WINDOW`       | `1 m`   | Global IP rate window              |

## Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Passwordless login (magic link + OAuth)
│   ├── (public)/                # Home, public menu, terms, privacy, driver onboarding
│   ├── (customer)/              # Menu, cart, checkout, orders, tracking, account
│   ├── (admin)/                 # Admin dashboard (menu, orders, drivers, routes, emails, ops center)
│   ├── (driver)/                # Driver mobile (routes, stops, location, photos, earnings)
│   ├── api/                     # 125 API route handlers
│   ├── auth/                    # Auth callback handlers
│   └── contexts/                # React context providers
├── emails/                      # 18 React Email templates + shared components
│   ├── components/              # EmailLayout, BrandHeader, BrandFooter, etc.
│   ├── OrderConfirmation.tsx    # + cancellation, refund, delivery reminder
│   ├── WelcomeOffer.tsx         # + ReferralReward, LoyaltyReward (loyalty/growth)
│   ├── WinBack.tsx              # + AbandonedCart (lifecycle)
│   └── AdminNewOrderAlert.tsx
├── components/ui/               # 529 React components
│   ├── admin/                   # Admin: orders, drivers, routes, analytics, ops center
│   ├── auth/                    # Login/signup forms
│   ├── cart/                    # Cart drawer, items, summary
│   ├── checkout/                # Checkout stepper, address, time, payment
│   ├── coverage/                # Coverage route map, checker
│   ├── menu/                    # Menu grid, tabs, search, featured carousel
│   ├── driver/                  # Driver mobile UI, earnings, availability
│   ├── orders/                  # Order tracking, history, feedback
│   ├── homepage/                # Hero, HowItWorks, testimonials, CTAs, footer
│   ├── layout/                  # Headers, navigation, drawers, app shell
│   ├── brand/                   # Logo, branding
│   ├── delivery/                # Delivery countdown, banners
│   └── theme/                   # Theme switching
├── lib/                         # Shared utilities
│   ├── auth/                    # Supabase auth helpers
│   ├── constants/               # Kitchen coordinates, config
│   ├── email/                   # Email service (Resend client, sendEmail, types)
│   ├── design-system/           # Design tokens, animations
│   ├── hooks/                   # 78 custom React hooks
│   ├── loyalty/                 # Stars/tiers, reward minting, milestone/anniversary/expiring, redemption
│   ├── referrals/               # Referral codes, first-order discount, reward issuance
│   ├── queries/                 # React Query definitions
│   ├── services/                # Business logic (coverage, geocoding, route optimization)
│   ├── settings/                # Business rules (cached, admin-configurable)
│   ├── stores/                  # Zustand stores (cart)
│   ├── supabase/                # Supabase client setup
│   ├── utils/                   # Helper functions (delivery-zones, clustering, ETA, etc.)
│   └── validators/              # Input validators
├── types/                       # 12 TypeScript type definition files
└── test/                        # Test fixtures and mocks

supabase/
├── migrations/                  # 77 database migrations
└── functions/                   # Edge functions (legacy)

docs/                            # Documentation
scripts/                         # Build and utility scripts
e2e/                             # Playwright E2E tests
data/                            # Menu seed YAML
public/                          # Static assets (logos, icons, images)
.planning/                       # GSD project tracking (phases, milestones)
.storybook/                      # Storybook configuration
.github/                         # CI/CD workflows
```

## API Routes (125 endpoints)

| Domain           | Endpoints                                                        | Purpose                                            |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Menu             | `/api/menu`, `/api/menu/search`                                  | Menu browsing, search                              |
| Sections         | `/api/sections`                                                  | Featured sections                                  |
| Addresses        | `/api/addresses[/id][/default]`                                  | Address CRUD, geocoding, default selection         |
| Checkout         | `/api/checkout/session`, `/validate-promo`                       | Stripe session creation, promo validation          |
| Rewards          | `/api/rewards[/summary\|/acknowledge]`                           | Stars/tier/wallet, header pill, celebration ack    |
| Referrals        | `/api/referrals[/claim]`                                         | Referral code + stats, attribution claim           |
| Coverage         | `/api/coverage/check`                                            | Delivery area validation with direction/fee info   |
| Orders           | `/api/orders/[id]/[cancel\|rating\|notes\|status]`               | Order management, feedback, share tokens           |
| Orders           | `/api/orders/[id]/[retry-payment\|verify-payment]`               | Payment retry and verification                     |
| Orders           | `/api/orders/[id]/share-token`                                   | Shareable tracking links                           |
| Tracking         | `/api/tracking/[orderId]`                                        | Real-time order tracking (auth or share token)     |
| Health           | `/api/health`                                                    | Service health check                               |
| Analytics        | `/api/analytics/vitals`                                          | Web Vitals reporting                               |
| Webhooks         | `/api/webhooks/stripe`                                           | Payment + email triggers (idempotent)              |
| Webhooks         | `/api/webhooks/resend`                                           | Email delivery status (signature-verified)         |
| Cron             | `/api/cron/delivery-reminders`                                   | Morning-of delivery reminder emails                |
| Cron             | `/api/cron/admin-daily-digest`                                   | Admin morning/evening digest emails                |
| Cron             | `/api/cron/[abandoned-cart\|win-back]`                           | Cart recovery, lapsed-customer re-engagement       |
| Cron             | `/api/cron/loyalty-[thankyou\|anniversary\|expiring]`            | Loyalty thank-you blast, anniversary, expiry nudge |
| Account          | `/api/account/[profile\|settings]`                               | Customer profile and preferences                   |
| Account          | `/api/account/orders/[id]/[cancel\|reorder]`                     | Customer order actions                             |
| Admin Menu       | `/api/admin/menu[/id][/photo]`                                   | Menu item management with photos                   |
| Admin Categories | `/api/admin/categories[/id]`                                     | Category CRUD                                      |
| Admin Orders     | `/api/admin/orders[/id]/[status\|cancel\|refund]`                | Order management                                   |
| Admin Orders     | `/api/admin/orders/[id]/[approve-cod\|priority]`                 | COD approval, priority flagging                    |
| Admin Orders     | `/api/admin/orders/[id]/[contact\|details\|items]`               | Order details, contact info, line items            |
| Admin Orders     | `/api/admin/orders/[id]/driver`                                  | Driver assignment per order                        |
| Admin Drivers    | `/api/admin/drivers[/id][/routes][/ratings]`                     | Driver CRUD, route history, ratings                |
| Admin Drivers    | `/api/admin/drivers/[id]/[archive\|resend-invite]`               | Archive/restore, re-invite                         |
| Admin Drivers    | `/api/admin/drivers/invite[s]`                                   | Driver invite system                               |
| Admin Routes     | `/api/admin/routes[/id]`                                         | Route CRUD                                         |
| Admin Routes     | `/api/admin/routes/[id]/stops[/stopId][/reassign]`               | Stop management, reassignment                      |
| Admin Routes     | `/api/admin/routes/[id]/exceptions/[exceptionId]`                | Exception management                               |
| Admin Routes     | `/api/admin/routes/[optimize\|builder-orders]`                   | Route optimization, order selection                |
| Admin Sections   | `/api/admin/sections[/id][/items]`                               | Featured section management                        |
| Admin Sections   | `/api/admin/sections/[publish\|reorder]`                         | Publish/reorder workflow                           |
| Admin Sections   | `/api/admin/sections/most-popular/suggest`                       | Auto-suggest popular items                         |
| Admin Analytics  | `/api/admin/analytics/[delivery\|drivers]`                       | Dashboard analytics                                |
| Admin Referrals  | `/admin/referrals` (page)                                        | Referral funnel, loyalty issued/redeemed, tiers    |
| Admin Settings   | `/api/admin/settings[/restore]`                                  | Business rules, app settings, restore defaults     |
| Admin Profile    | `/api/admin/profile[/notifications\|stats]`                      | Admin profile, notification prefs                  |
| Admin Delivery   | `/api/admin/delivery-days`, `/delivery-zones`                    | Multi-day schedule and zone config                 |
| Admin Emails     | `/api/admin/emails[/id][/resend]`                                | Email log, resend                                  |
| Admin Emails     | `/api/admin/emails/[send\|compose\|stats]`                       | Send, compose, delivery stats                      |
| Admin Photos     | `/api/admin/photos[/id][/process][/verify-drive]`                | Photo pipeline management                          |
| Driver           | `/api/driver/[me\|location\|availability\|earnings]`             | Driver profile, GPS, scheduling                    |
| Driver           | `/api/driver/[onboard\|profile][/photo]`                         | Onboarding, profile photo                          |
| Driver Routes    | `/api/driver/routes/[active\|upcoming\|history]`                 | Route lists                                        |
| Driver Routes    | `/api/driver/routes/[routeId]/[start\|complete]`                 | Route lifecycle                                    |
| Driver Routes    | `/api/driver/routes/[routeId]/stops/[stopId]`                    | Stop updates                                       |
| Driver Routes    | `/api/driver/routes/[routeId]/stops/[stopId]/[photo\|exception]` | Delivery proof, exceptions                         |
| Test Email       | `/api/emails/test`                                               | Send test emails from admin settings               |

## Database

Migration history is squashed to a **single live-schema baseline**
(`supabase/migrations/00000000000000_baseline.sql`); superseded historical
migrations are preserved in `supabase/migrations_archive/`. New schema changes
are added as `<timestamp>_name.sql` on top of the baseline, after which
`pnpm gen:types` must be run so the blocking `db-drift` CI job passes.

Row-Level Security on all tables:

| Table                    | Purpose                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `profiles`               | User profiles (customer/admin/driver roles)                                  |
| `addresses`              | Customer delivery addresses (geocoded, with distance)                        |
| `menu_categories`        | Menu categories with sort order                                              |
| `menu_items`             | Menu items with modifiers, pricing, Burmese names                            |
| `orders` / `order_items` | Orders and line items (COD + Stripe, priority flag)                          |
| `drivers`                | Driver profiles, vehicle info                                                |
| `driver_invites`         | Magic link driver onboarding                                                 |
| `routes` / `route_stops` | Delivery routes and stops                                                    |
| `route_exceptions`       | Route-level exception tracking                                               |
| `delivery_photos`        | Proof of delivery photos                                                     |
| `delivery_exceptions`    | Delivery issue tracking                                                      |
| `driver_ratings`         | Customer feedback (1-5 stars)                                                |
| `driver_pay_rate`        | Driver compensation rates                                                    |
| `driver_availability`    | Driver scheduling and availability                                           |
| `delivery_days`          | Multi-day delivery schedule (day, cutoff, fee, direction)                    |
| `delivery_zones`         | Direction-based zone configs (bearing ranges, ref cities)                    |
| `notification_logs`      | Email notification tracking (status, delivery events)                        |
| `webhook_events`         | Stripe webhook idempotency (prevents duplicate processing)                   |
| `customer_settings`      | Dietary, notification (marketing/order/reminders), display prefs             |
| `app_settings`           | Admin-configurable settings (email kill switch, fees, etc.)                  |
| `featured_sections`      | Dynamic homepage sections with draft/publish                                 |
| `order_audit_log`        | Order status change audit trail                                              |
| `referrals`              | Referral attribution + issued reward codes                                   |
| `carts`                  | Server-synced carts (abandoned-cart targeting)                               |
| `loyalty_rewards`        | Issued loyalty rewards (milestone/thank-you/anniversary), expiry, redemption |

**Security:** RLS enabled on all tables, `is_admin()` / `is_driver()` / `get_my_driver_id()` SECURITY DEFINER functions, all FK columns indexed. Full RLS audit completed in v1.8. Cron/marketing reader functions (`get_lapsed_customers`, `get_loyalty_thankyou_candidates`, `get_anniversary_customers`, `get_expiring_loyalty_rewards`, `get_loyalty_tier_distribution`) are `SECURITY DEFINER` with pinned `search_path` and granted to `service_role` only (they return customer PII for cron use).

> **Note:** marketing opt-in lives in `customer_settings.notification_prefs` (not `profiles`). Migration 019 moved it; reader functions and consumers all read from `customer_settings` (a v1.9 fix corrected lingering `profiles.notification_prefs` references).

## Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `pnpm dev`             | Start development server                          |
| `pnpm build`           | Production build (Next.js + service worker)       |
| `pnpm start`           | Start production server                           |
| `pnpm lint`            | Run ESLint                                        |
| `pnpm lint:css`        | Run Stylelint                                     |
| `pnpm typecheck`       | TypeScript type checking                          |
| `pnpm format:check`    | Prettier format check                             |
| `pnpm test`            | Unit tests (Vitest, 1125 tests)                   |
| `pnpm gen:types`       | Regenerate DB types from the local Supabase stack |
| `pnpm gen:types:check` | Fail if committed DB types drift from the schema  |
| `pnpm test:ci`         | CI tests (bail on first failure)                  |
| `pnpm test:e2e`        | E2E tests (Playwright)                            |
| `pnpm test:a11y`       | Accessibility tests                               |
| `pnpm test:animations` | Animation tests                                   |
| `pnpm audit:tokens`    | Design token audit                                |
| `pnpm storybook`       | Storybook dev server (port 6006)                  |
| `pnpm build-storybook` | Build static Storybook                            |
| `pnpm chromatic`       | Visual regression testing                         |
| `pnpm analyze`         | Bundle analysis                                   |
| `pnpm lighthouse`      | Lighthouse CI audit                               |
| `pnpm seed:menu`       | Seed menu data from YAML                          |
| `pnpm verify:menu`     | Verify menu data integrity                        |
| `pnpm rls:test`        | Test RLS policy isolation                         |
| `pnpm launch:check`    | Pre-launch readiness check                        |
| `pnpm dry-run`         | Dry run validation                                |

**Verification command (run before committing):**

```bash
pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

## Milestones

| Version  | Name                              | Phases | Plans | Shipped     |
| -------- | --------------------------------- | ------ | ----- | ----------- |
| v1.0     | MVP                               | 1-8    | 32    | 2026-01-23  |
| v1.1     | Tech Debt Cleanup                 | 9-14   | 21    | 2026-01-23  |
| v1.2     | Playful UI Overhaul               | 15-24  | 29    | 2026-01-27  |
| v1.3     | Full Codebase Consolidation       | 25-34  | 53    | 2026-01-28  |
| v1.4     | Mobile Excellence                 | 35-39  | 39    | 2026-02-05  |
| v1.5     | Performance & Repo Health         | 40-47  | 34    | 2026-02-07  |
| v1.6     | Production Polish                 | 48-57  | 47    | 2026-02-13  |
| v1.7     | Production Deployment & Readiness | 58-66  | 32    | 2026-02-16  |
| v1.8     | Post-Launch Hardening             | 67-76  | 25    | 2026-02-26  |
| **v1.9** | **Launch-Ready MVP**              | 77-86  | 23+   | In Progress |

### Post-launch growth layer (shipped after v1.9)

| Area                 | What                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Referrals + welcome  | Give $10 / get $10, $5 welcome auto-discount, admin funnel                                                                   |
| Morning Star Rewards | Stars, Burmese-gem tiers, tiered Kyay-Zu-Par! coupons, wallet, tier ladder, in-app celebration                               |
| Lifecycle marketing  | Win-back, abandoned-cart, loyalty thank-you, anniversary, expiry-nudge crons                                                 |
| Reward integrity     | Stripe `promotion_code` enforcement (single-use / minimum / expiry), per-user code binding, redemption tracking              |
| Loyalty fairness     | Tiers by lifetime **net spend** (subtotal − discount − refunds); unpaid-COD excluded; milestone back-fill; COD earns rewards |
| Tier status + a11y   | `<TierBadge>` everywhere, early-access flag, bilingual EN/Burmese, WCAG-AA rewards UI                                        |
| Platform foundation  | First CI pipeline + generated DB types + schema-drift guard; migration history squashed to one baseline                      |

## Roadmap & Potential Improvements

### Next up — Driver Portal overhaul

The driver portal (`src/app/(driver)/`) has features that are partially working
or unreliable and is the next focus area. Scope to be confirmed at kickoff, but
candidates: route/stop lifecycle correctness, live GPS + ETA reliability, proof-
of-delivery photo capture, offline sync (IndexedDB + SW), earnings accuracy,
availability scheduling, and the onboarding/invite flow. See the kickoff prompt
in `docs/driver-overhaul-kickoff.md`.

### Other follow-ups (by leverage)

- **Loyalty analytics** — issued → redeemed → reorder conversion per reward kind/tier; redemption rate + incremental revenue in the admin dashboard.
- **Tier perks beyond coupons** — free delivery or priority windows for Ruby/Gold (touches the distance-fee logic; intentionally deferred — conservative scope chosen).
- **Notification preference granularity** — opt into transactional but out of loyalty/marketing push separately (today push respects marketing opt-in broadly).
- **E2E coverage for rewards** — Playwright flows for earn → unlock → wallet → checkout redemption.
- **Storybook stories** for the rewards components (deferred from the UI/UX pass).
- **Coupon stacking** — Stripe allows one discount per session today; evaluate whether loyalty + referral should ever combine.
- **A/B testing hooks** — experiment on reward size, milestone cadence, and email copy.
- **Arm `verify`/`db-drift` as required checks** in branch protection now that both are green and blocking.

### Recently shipped (was on this list)

- ✅ Reward-integrity hardening — per-user promo-code binding at checkout.
- ✅ Generated DB types + schema-drift CI guard (replaced the hand-maintained `database.ts`).

## Deployment

### Vercel

1. Import repo at [vercel.com/new](https://vercel.com/new), select `main` branch
2. Set all required environment variables (see table above)
3. Build command: `pnpm build` (auto-detected)
4. Configure Supabase auth callback: `https://your-app.vercel.app/auth/callback`
5. Push to `main` — Vercel auto-deploys

### Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

The schema is a **single squashed baseline** (`00000000000000_baseline.sql`,
dumped from the live schema), plus any newer `<timestamp>_name.sql` migrations
on top. Production's `supabase_migrations.schema_migrations` is reconciled to the
baseline, so `db push` applies only post-baseline migrations. Historical
migrations are kept (read-only) in `supabase/migrations_archive/`.

The baseline covers: extensions, 9 enums, 33 tables, FKs, materialized views,
34 functions, triggers, RLS + policies (public + storage), grants, and storage
buckets. After any schema change, run `pnpm gen:types` and commit
`database.generated.ts` (the blocking `db-drift` CI job enforces this).

### Stripe Webhook

Configure webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`

Required events:

- `checkout.session.completed` — order creation + confirmation email
- `checkout.session.expired` — cleanup abandoned carts
- `payment_intent.succeeded` — payment confirmation
- `charge.refunded` — refund notification email
- `charge.dispute.created` — dispute tracking

### Google Maps API

Enable these APIs in [Google Cloud Console](https://console.cloud.google.com/apis/library):

- **Geocoding API** — address validation and lat/lng lookup
- **Routes API** — delivery route optimization and duration/distance estimates
- **Maps JavaScript API** — interactive maps (coverage checker, delivery map, route builder, driver views)
- **Places API** — address autocomplete in checkout

Create two API keys:

1. **Server-side** (`GOOGLE_MAPS_API_KEY`): restrict to Geocoding + Routes APIs, server IP restriction
2. **Client-side** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`): restrict to Maps JavaScript + Places APIs, HTTP referrer restriction to your domain

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
   - Copy signing secret -> set `RESEND_WEBHOOK_SECRET` in Vercel

### Upstash Redis Setup (Optional)

Rate limiting works with in-memory fallback (15 req/min per identifier) when Redis is unavailable. For distributed rate limiting:

1. Provision via Vercel Dashboard > Storage > Create Database > Upstash Redis
2. **Important:** Must be Upstash REST Redis (not standard Redis). The app uses `@upstash/redis` which requires the HTTPS REST API.
3. Env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are auto-populated when provisioned through Vercel Marketplace

### Cron Jobs

Configured in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/delivery-reminders", "schedule": "0 15 * * *" },
    { "path": "/api/cron/admin-daily-digest?period=morning", "schedule": "0 14 * * *" },
    { "path": "/api/cron/admin-daily-digest?period=evening", "schedule": "0 6 * * *" },
    { "path": "/api/cron/abandoned-cart", "schedule": "0 23 * * *" },
    { "path": "/api/cron/win-back", "schedule": "0 17 * * 1" },
    { "path": "/api/cron/loyalty-thankyou", "schedule": "30 17 * * *" },
    { "path": "/api/cron/loyalty-anniversary", "schedule": "0 16 * * *" },
    { "path": "/api/cron/loyalty-expiring", "schedule": "0 18 * * *" }
  ]
}
```

| Cron                 | Schedule (UTC) | Purpose                                                 |
| -------------------- | -------------- | ------------------------------------------------------- |
| Delivery reminders   | Daily 15:00    | Morning-of delivery reminder emails                     |
| Admin morning digest | Daily 14:00    | Morning order summary for admin                         |
| Admin evening digest | Daily 06:00    | Evening wrap-up for admin                               |
| Abandoned cart       | Daily 23:00    | Recover carts left 2–72h, marketing opted-in            |
| Win-back             | Mondays 17:00  | Re-engage customers lapsed 30–90 days                   |
| Loyalty thank-you    | Daily 17:30    | One-time thank-you blast to existing customers (drains) |
| Loyalty anniversary  | Daily 16:00    | 1-year first-order anniversary gift (LA-time, once/yr)  |
| Loyalty expiring     | Daily 18:00    | "Reward expires soon" nudge (≤7 days, once per reward)  |

Set `CRON_SECRET` in Vercel env vars to secure these endpoints. The loyalty thank-you and win-back crons are self-draining (eligibility + dedupe live in SQL + stamp columns), so re-runs are safe and naturally taper off.

### Production Checklist

- [ ] All required environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set (client-side maps)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` set (optional, for custom map styling)
- [ ] Supabase auth callback URL configured (`https://your-domain/auth/callback`)
- [ ] Supabase schema applied — baseline + post-baseline migrations (`supabase db push`); `schema_migrations` reconciled to the baseline
- [ ] Stripe using LIVE keys (not test keys)
- [ ] Stripe loyalty/referral/welcome coupons created and IDs set (`STRIPE_*_COUPON_ID*`) — live-mode coupons require live `STRIPE_SECRET_KEY`
- [ ] Stripe webhook endpoint verified with all required events
- [ ] Google Maps API keys restricted to production domain
- [ ] Google Maps APIs enabled: Geocoding, Routes, Maps JavaScript, Places
- [ ] Resend domain verified (`mandalaymorningstar.com`)
- [ ] `RESEND_API_KEY` set in Vercel
- [ ] Resend webhook configured (optional, for open/click tracking)
- [ ] Upstash Redis provisioned (optional, falls back to in-memory)
- [ ] `CRON_SECRET` set and cron jobs configured in `vercel.json`
- [ ] Sentry DSN configured (`NEXT_PUBLIC_SENTRY_DSN`)
- [ ] Sentry auth token set in CI (`SENTRY_AUTH_TOKEN`) for source map uploads
- [ ] Business rules configured in Admin > Settings
- [ ] Delivery days configured in Admin > Delivery Days
- [ ] Delivery zones configured in Admin > Delivery Zones
- [ ] At least one admin user created (set role in `profiles` table)
- [ ] Menu items seeded (`pnpm seed:menu`) or created via admin
- [ ] Custom domain configured (optional)

## Documentation

| Document               | Path                             |
| ---------------------- | -------------------------------- |
| Architecture           | `docs/architecture.md`           |
| Data Model             | `docs/04-data-model.md`          |
| Menu System            | `docs/05-menu.md`                |
| Stripe Integration     | `docs/06-stripe.md`              |
| Frontend Design System | `docs/frontend-design-system.md` |
| Component Guide        | `docs/component-guide.md`        |
| Deployment             | `docs/DEPLOYMENT.md`             |
| Z-Index Strategy       | `docs/STACKING-CONTEXT.md`       |
| Performance Guide      | `PERFORMANCE.md`                 |
| Change Log             | `docs/change_log.md`             |
| Project Status         | `docs/project_status.md`         |
| Business Context       | `docs/00-context-pack.md`        |

## Troubleshooting

### Auth Callback 303 Error

1. Verify `NEXT_PUBLIC_APP_URL` in Vercel env vars
2. Add production callback URL in Supabase Dashboard > Auth > URL Configuration
3. Check browser console for CORS/redirect errors

### Build Failures

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Common causes: missing env vars, TypeScript errors, ESLint violations

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
6. Check retry status: failed emails are retried up to 3 times automatically

### Database Connection

1. Verify Supabase URL and keys
2. Check Supabase Dashboard > Project Settings > API
3. Confirm RLS policies: `SELECT * FROM testing.check_rls_enabled()`

### Rate Limiting

1. If using Upstash: verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. If not using Upstash: in-memory fallback is active (15 req/min per identifier) — works but not distributed across serverless instances
3. Rate limit tiers can be tuned via `RATE_LIMIT_*` env vars without redeploy

### Coverage Check Not Working

1. Verify `GOOGLE_MAPS_API_KEY` is set (server-side)
2. Ensure Geocoding API and Routes API are enabled in Google Cloud Console
3. Check API key restrictions — server key must allow these APIs

### Maps Not Rendering

1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set (client-side)
2. Ensure Maps JavaScript API is enabled
3. Check API key HTTP referrer restrictions match your domain
4. Optional: set `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` for AdvancedMarkerElement support

## Contributing

1. Branch: `git checkout -b feat/feature-name` (never push to `main`)
2. Develop with the full check suite: `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
3. If you changed the schema: add a `<timestamp>_name.sql` migration, then `pnpm gen:types` and commit `database.generated.ts`
4. Commit: conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
5. Push and open a PR — merge only when both CI jobs (`verify`, `db-drift`) are green

### Collaborative AI-session workflow (standard)

This project is developed collaboratively across Claude Code sessions, and that
review-driven loop is the quality bar — **new sessions pick this up automatically
from `.claude/CLAUDE.md`**. The pattern:

- **Branch + PR per task**, never direct-to-`main`; full verification before every PR.
- **Adversarial self-review** on non-trivial work (auth / payments / RLS / money /
  migrations): a subagent audits the area before building and reviews the diff
  before pushing (or run the `security-review` / `code-review` skills). This has
  caught real bugs (cross-account coupon use, schema drift, a COD loophole) pre-merge.
- **Cross-session handoff**: when blocked on an external dependency or spanning
  sessions, write the plan to `docs/<task>-plan.md`, leave the branch + open PR,
  and have the next session continue — **reviewing each other's PRs**: pull CI
  logs, diagnose, post a root-cause + fix as a PR comment, and finish it if able.
- **CI failures are the task, not noise** — kick → diagnose from job logs → re-kick.

Full details live in [`.claude/CLAUDE.md`](./.claude/CLAUDE.md) (Workflow section).

## License

Private - All rights reserved.
