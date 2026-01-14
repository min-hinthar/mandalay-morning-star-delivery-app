# docs/00-context-pack.md (v1.0) — A La Carte Saturday Delivery

## Product
Mandalay Morning Star — account-based, a la carte ordering from a full categorized menu for *upcoming Saturday delivery* in Southern California. Inspired by Panda Express-style ordering UX: fast category browsing, item detail modals, cart drawer, scheduled pickup/delivery selection, clean checkout.

## Core Business Rules

### Delivery Schedule
- Delivery day: **Saturday only**
- Delivery hours: **11:00–19:00 PT**
- Customer selects an **hourly delivery window** (e.g., 14:00–15:00).
- Cutoff: **Friday 15:00 PT**
  - If customer orders **after cutoff**, the order defaults to **next Saturday**.
  - Address/time window changes are allowed **until cutoff**.

### Delivery Fee (Threshold Pricing)
- If **items subtotal < $100**: delivery fee = **$15**
- If **items subtotal ≥ $100**: delivery fee = **$0**
- “Items subtotal” = sum of (menu item base price + modifier price deltas) * quantity (pre-tax, pre-fee).
- (Optional v1 decision) Tips: enabled by default; stored separately from delivery fee.

### Coverage
- Kitchen origin: 750 Terrado Plaza, Suite 33, Covina, CA 91723
- Coverage hard limits:
  - **max distance = 50 miles**
  - **max duration = 90 minutes**
- Enforce **both** constraints; prioritize shortest-duration route choice for evaluation.
- Public coverage check on homepage (address input + map feedback).
- If out of coverage: block checkout and clearly explain why.

### Account Requirement
- Customers must create an account to place orders.
- Support multiple saved addresses per user.
- Delivery notes allowed (customer → driver/admin).

## Menu Model (A La Carte)
- Full categorized menu (CRUD by admin).
- Items can have:
  - categories (one primary, optional secondary tags)
  - modifiers/options (e.g., protein choice, spice level, add-ons)
  - availability flags (sold out, seasonal)
  - images
- Cart supports:
  - quantity
  - modifier selections
  - item notes (optional)

Initial categories to mirror DoorDash taxonomy:
- Most Ordered
- Noodles
- Salads
- Curries
- Seafood Curries
- Carbs
- Soups
- Drinks

## Order Lifecycle (Statuses)
- draft (cart)
- pending_payment
- paid
- confirmed (scheduled + locked at cutoff)
- in_kitchen
- out_for_delivery
- delivered
- canceled (pre-cutoff only)
- refunded (admin-only, via Stripe)

## Real-Time Tracking
- Driver GPS location updates every ~5 minutes.
- Milestones + statuses (in_kitchen → out_for_delivery → arriving → delivered).
- Customer sees live map + ETA band (best-effort) and status timeline.

## Personas
- Customer: browse menu, add to cart, schedule Saturday time window, pay, track delivery, view history
- Admin: manage menu/categories/modifiers, manage orders, manage drivers/routes, refunds, exceptions
- Driver: see assigned route/stops, update status, location pings, mark delivered (+ optional photo), notes

## Tech Stack (Hard Requirements)
- Next.js App Router + TypeScript (strict)
- Tailwind + shadcn/ui + Framer Motion (branded + premium; not generic)
- Supabase Auth + Postgres + strict RLS
- Stripe (one-time payments) + webhooks
- Google Maps (geocoding + route/duration validation + routing/ETA)
- CI gates all PRs (lint/typecheck/tests/build)

## UX Bar (Panda Express-style)
- Sticky category tabs + search
- Item cards grid; tap opens item detail modal
- Cart drawer slide-over (mobile-first)
- Checkout stepper (Address → Window → Payment → Confirm)
- Order status page with timeline + live map when out_for_delivery