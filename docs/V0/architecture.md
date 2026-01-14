# Architecture Overview — Mandalay Morning Star

> **Last Updated**: 2026-01-12 | **Version**: 1.0

## System Context Diagram

```
                                    ┌─────────────────┐
                                    │    Customer     │
                                    │  (Mobile PWA)   │
                                    └────────┬────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          VERCEL EDGE NETWORK                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Static Files │  │  SSR/RSC     │  │  API Routes  │  │  Webhooks  │  │
│  │ (images,     │  │  (menu,      │  │  (checkout,  │  │  (stripe)  │  │
│  │  assets)     │  │   orders)    │  │   orders)    │  │            │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
         │                    │                │               │
         │                    ▼                ▼               │
         │         ┌─────────────────────────────────┐         │
         │         │         SUPABASE                │         │
         │         │  ┌───────────┐  ┌───────────┐   │         │
         │         │  │ Postgres  │  │   Auth    │   │         │
         │         │  │  + RLS    │  │ (JWT/SSO) │   │         │
         │         │  └───────────┘  └───────────┘   │         │
         │         │  ┌───────────┐  ┌───────────┐   │         │
         │         │  │ Realtime  │  │  Storage  │   │         │
         │         │  │(locations)│  │ (images)  │   │         │
         │         │  └───────────┘  └───────────┘   │         │
         │         └─────────────────────────────────┘         │
         │                                                     │
         │    ┌─────────────────┐    ┌─────────────────┐       │
         │    │     STRIPE      │    │  GOOGLE MAPS    │       │
         └────│  • Checkout     │    │  • Geocoding    │───────┘
              │  • Payments     │    │  • Distance     │
              │  • Refunds      │    │  • Directions   │
              └─────────────────┘    └─────────────────┘
```

## Request Flow: Place Order

```
Customer                 Vercel                Supabase              Stripe
   │                        │                      │                    │
   │─── Browse Menu ───────>│                      │                    │
   │                        │─── Query menu_* ────>│                    │
   │<── Render Categories ──│<── Return items ─────│                    │
   │                        │                      │                    │
   │─── Add to Cart ───────>│                      │                    │
   │    (client-side)       │                      │                    │
   │                        │                      │                    │
   │─── Checkout ──────────>│                      │                    │
   │                        │─── Validate cart ───>│                    │
   │                        │─── Create draft ────>│                    │
   │                        │<── order_id ─────────│                    │
   │                        │                      │                    │
   │                        │─── Create Session ──────────────────────>│
   │                        │<── checkout_url ─────────────────────────│
   │<── Redirect ───────────│                      │                    │
   │                        │                      │                    │
   │─── Complete Payment ─────────────────────────────────────────────>│
   │                        │                      │                    │
   │                        │<── Webhook: session.completed ───────────│
   │                        │─── Update order ────>│                    │
   │                        │    status='paid'     │                    │
   │                        │                      │                    │
   │<── Redirect to /order/{id} ──────────────────────────────────────│
```

## Data Flow: Coverage Check

```
Customer                 API Route            Google Maps           Supabase
   │                        │                      │                    │
   │─── Enter Address ─────>│                      │                    │
   │                        │─── Geocode ─────────>│                    │
   │                        │<── lat/lng ──────────│                    │
   │                        │                      │                    │
   │                        │─── Distance Matrix ─>│                    │
   │                        │<── miles/minutes ────│                    │
   │                        │                      │                    │
   │                        │─── Save address ────────────────────────>│
   │                        │    (if logged in)    │                    │
   │                        │                      │                    │
   │<── Coverage Result ────│                      │                    │
   │    (valid/invalid)     │                      │                    │
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PAGE COMPONENTS                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │
│  │  MenuPage   │  │ CartDrawer  │  │CheckoutPage │  │ OrderPage │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘   │
└─────────┼────────────────┼────────────────┼───────────────┼─────────┘
          │                │                │               │
┌─────────┼────────────────┼────────────────┼───────────────┼─────────┐
│         ▼                ▼                ▼               ▼         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │
│  │CategoryTabs │  │  CartItem   │  │AddressPicker│  │ Timeline  │   │
│  │  ItemCard   │  │  CartTotal  │  │TimeSelector │  │ LiveMap   │   │
│  │ ItemModal   │  │  FeeNotice  │  │PaymentForm  │  │   ETA     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘   │
│                       FEATURE COMPONENTS                            │
└─────────────────────────────────────────────────────────────────────┘
          │                │                │               │
┌─────────┼────────────────┼────────────────┼───────────────┼─────────┐
│         ▼                ▼                ▼               ▼         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        UI COMPONENTS                         │   │
│  │  Button │ Card │ Modal │ Drawer │ Input │ Select │ Badge     │   │
│  │                     (shadcn/ui base)                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────────────────┐
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                         STATE LAYER                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ Cart Store │  │ Auth State │  │ React Query / SWR      │  │   │
│  │  │ (Zustand)  │  │ (Supabase) │  │ (server state cache)   │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  menu_categories│     │   menu_items    │     │ modifier_groups │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (pk)         │     │ id (pk)         │     │ id (pk)         │
│ slug            │◄────│ category_id (fk)│     │ slug            │
│ name            │     │ slug            │     │ name            │
│ sort_order      │     │ name_en/name_my │     │ selection_type  │
│ is_active       │     │ base_price_cents│     │ min/max_select  │
└─────────────────┘     │ is_active       │     └────────┬────────┘
                        │ is_sold_out     │              │
                        └────────┬────────┘              │
                                 │                       │
                        ┌────────┴────────┐     ┌────────┴────────┐
                        │menu_item_modifier│     │modifier_options │
                        │    _groups       │     ├─────────────────┤
                        ├─────────────────┤     │ id (pk)         │
                        │ menu_item_id    │     │ group_id (fk)   │
                        │ group_id        │     │ slug            │
                        └─────────────────┘     │ name            │
                                                │ price_delta_cents│
                                                └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │     │    addresses    │     │     orders      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (pk)         │◄────│ user_id (fk)    │     │ id (pk)         │
│ role            │     │ label           │     │ user_id (fk)    │◄─┐
│ full_name       │     │ line1/line2     │     │ address_id (fk) │──┘
│ phone           │     │ city/state/zip  │     │ scheduled_date  │
│ stripe_customer │     │ lat/lng         │     │ time_window     │
└─────────────────┘     │ coverage_valid  │     │ status          │
                        └─────────────────┘     │ *_cents fields  │
                                                │ stripe_* fields │
                                                └────────┬────────┘
                                                         │
                                                ┌────────┴────────┐
                                                │   order_items   │
                                                ├─────────────────┤
                                                │ id (pk)         │
                                                │ order_id (fk)   │
                                                │ menu_item_id    │
                                                │ name_snapshot   │
                                                │ price_snapshot  │
                                                │ quantity        │
                                                └────────┬────────┘
                                                         │
                                                ┌────────┴────────┐
                                                │order_item_mods  │
                                                ├─────────────────┤
                                                │ order_item_id   │
                                                │ name_snapshot   │
                                                │ delta_snapshot  │
                                                └─────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER (Vercel)                         │
│  • Rate limiting (Edge Middleware)                                  │
│  • DDoS protection (automatic)                                      │
│  • SSL/TLS termination                                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER (Next.js)                   │
│  • Session validation (Supabase JWT)                                │
│  • CSRF protection (SameSite cookies)                               │
│  • Input validation (Zod schemas)                                   │
│  • Webhook signature verification (Stripe)                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (Supabase)                     │
│  • Row Level Security (RLS) policies                                │
│  • Role-based access (customer/admin/driver)                        │
│  • Encrypted connections (SSL required)                             │
│  • Audit logging (pg_audit extension)                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GITHUB REPOSITORY                          │
│  main ────────────────────────────────────────────────> Production  │
│    └─ PR (preview) ─────────────────────────────────> Staging       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │   Vercel Prod   │           │ Vercel Preview  │
          │ (Edge Network)  │           │  (PR branches)  │
          └────────┬────────┘           └────────┬────────┘
                   │                             │
          ┌────────┴────────┐           ┌────────┴────────┐
          │  Supabase Prod  │           │ Supabase Staging│
          │   (us-west-1)   │           │  (isolated DB)  │
          └─────────────────┘           └─────────────────┘
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js App Router | RSC for performance; API routes co-located |
| State Management | Zustand (cart) | Simple, persistent, no boilerplate |
| Server State | TanStack Query | Caching, background refresh, mutations |
| Database | Supabase Postgres | Managed, real-time, built-in auth |
| Payments | Stripe Checkout | PCI compliant, fast to implement |
| Maps | Google Maps Platform | Best geocoding accuracy, familiar API |
| Styling | Tailwind + shadcn | Rapid iteration, consistent design |
| Animations | Framer Motion | Declarative, performant, React-native |

---

*See PROJECT_SPEC.md for full implementation details.*
