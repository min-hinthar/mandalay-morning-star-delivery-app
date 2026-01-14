# Mandalay Morning Star — Project Spec Doc (v1.0)

> **Status**: Planning Phase | **Last Updated**: 2026-01-12  
> **Goal**: Shipping MVP | **Target**: Real business launch

---

## Executive Summary

**What**: Mobile-first PWA for a la carte Burmese food ordering with Saturday-only delivery in Southern California.

**Who**: Existing customer base of Mandalay Morning Star restaurant (Covina, CA). Regulars already know the food; they need a convenient ordering channel.

**Why**: Replace manual ordering (phone/text) with self-service; capture orders 24/7; reduce kitchen coordination overhead; provide real-time delivery tracking.

**How**: Next.js PWA + Supabase + Stripe + Google Maps. Non-technical admin UI for kitchen staff.

---

# Part A: Product Requirements

## 1. User Personas

### 1.1 Customer
- **Who**: Burmese food enthusiast in SoCal (existing regulars + new discoverers)
- **Goals**: Order favorite dishes for Saturday delivery with minimal friction
- **Context**: Mobile-first (80%+ expected mobile traffic); may have limited English; familiar with DoorDash/UberEats UX patterns
- **Pain points solved**: No more phone tag with kitchen; clear delivery windows; real-time tracking

### 1.2 Admin (Kitchen Staff)
- **Who**: Non-technical restaurant staff
- **Goals**: See incoming orders; manage menu availability; mark items sold out
- **Context**: Shared tablet in kitchen; needs to work during busy prep
- **Pain points solved**: No more scribbled paper orders; clear dashboard of what to cook

### 1.3 Driver
- **Who**: Delivery driver (internal or contractor)
- **Goals**: See assigned route; navigate efficiently; mark deliveries complete
- **Context**: Mobile phone; driving between stops
- **Pain points solved**: Optimized route; no back-and-forth calls with kitchen

---

## 2. Core User Flows

### 2.1 Customer: Browse → Order → Pay → Track

```
┌─────────────────────────────────────────────────────────────────────┐
│  HOMEPAGE                                                           │
│  ┌─────────────────┐                                                │
│  │ 🏠 Morning Star │  [Check Delivery Coverage]                     │
│  │    MENU         │                                                │
│  └─────────────────┘                                                │
│  ↓ Enter address → validate coverage → show menu                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  MENU BROWSE (Panda Express-style)                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [All-Day] [Rice/Noodles] [Curries] [Seafood] [Salads] [Drinks]│   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                                │
│  │ Kyay-O  │ │Nan-Gyi  │ │ Mohinga │  ...                           │
│  │  $18    │ │  $13    │ │  $14    │                                │
│  └─────────┘ └─────────┘ └─────────┘                                │
│  ↓ Tap item → Item Detail Modal                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ITEM DETAIL MODAL                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Kyay-O / Si-Chat                          ကြေးအိုး/ဆီချက်    │   │
│  │ Rice vermicelli noodle soup...                               │   │
│  │                                                              │   │
│  │ Style: ○ Kyay-O (Soup)  ○ Si-Chat (Dry)                      │   │
│  │ Protein: ○ Pork (default)  ○ Chicken + egg                   │   │
│  │ Add-ons: ☐ Brains (+$2.00)                                   │   │
│  │                                                              │   │
│  │ Quantity: [-] 1 [+]                                          │   │
│  │ Special instructions: [________________]                      │   │
│  │                                                              │   │
│  │ [Add to Cart - $18.00]                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  CART DRAWER (slide from right)                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Your Order                                          [X Close]│   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Kyay-O (Soup, Pork, +Brains)               $20.00    [Edit]  │   │
│  │ Nan-Gyi Mont Ti x2                         $26.00    [Edit]  │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Subtotal:                                          $46.00    │   │
│  │ Delivery Fee:                                      $15.00    │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ 💡 Add $54 more for FREE delivery!                           │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ [Checkout →]                                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  CHECKOUT STEPPER                                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ (1) Address → (2) Time Window → (3) Payment → (4) Confirm    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Step 1: Delivery Address                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ○ 123 Main St, Pasadena (Home) ✓ In coverage                 │   │
│  │ ○ 456 Oak Ave, Irvine (Work) ✓ In coverage                   │   │
│  │ [+ Add new address]                                          │   │
│  │                                                              │   │
│  │ Delivery notes: [Gate code: #1234________________]           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Step 2: Delivery Window (Saturday only)                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Saturday, Jan 18, 2026                                       │   │
│  │ ○ 11:00 AM - 12:00 PM                                        │   │
│  │ ○ 12:00 PM - 1:00 PM                                         │   │
│  │ ● 1:00 PM - 2:00 PM  ← selected                              │   │
│  │ ○ 2:00 PM - 3:00 PM                                          │   │
│  │ ...                                                          │   │
│  │ ○ 6:00 PM - 7:00 PM                                          │   │
│  │                                                              │   │
│  │ ⚠️ Order by Friday 3:00 PM to receive this Saturday          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Step 3: Payment (Stripe Checkout)                                  │
│  → Redirects to Stripe-hosted checkout page                         │
│  → Returns to /order/{id}?status=success or back to cart            │
│                                                                     │
│  Step 4: Confirmation                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ✓ Order Confirmed!                                           │   │
│  │ Order #MMS-20260118-001                                      │   │
│  │ Delivery: Saturday, Jan 18 • 1:00 PM - 2:00 PM               │   │
│  │ Address: 123 Main St, Pasadena                               │   │
│  │                                                              │   │
│  │ [Track Order] [Back to Menu]                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ORDER STATUS PAGE                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Order #MMS-20260118-001                                      │   │
│  │                                                              │   │
│  │ Timeline:                                                    │   │
│  │ ✓ Order Placed ────────────── Jan 15, 10:32 AM               │   │
│  │ ✓ Payment Confirmed ───────── Jan 15, 10:33 AM               │   │
│  │ ✓ Order Locked ────────────── Jan 17, 3:00 PM (cutoff)       │   │
│  │ ○ Preparing ───────────────── (pending)                      │   │
│  │ ○ Out for Delivery ────────── (pending)                      │   │
│  │ ○ Delivered ───────────────── (pending)                      │   │
│  │                                                              │   │
│  │ [Map appears when "Out for Delivery"]                        │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │           🚗 ← driver location                          │   │   │
│  │ │    📍 ← your address                                    │   │   │
│  │ │    ETA: ~15 minutes                                     │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Admin: Order Management Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Orders] [Menu] [Routes] [Settings]                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Today's Orders (Saturday, Jan 18)                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Filter: [All ▼] [11-12] [12-1] [1-2] [2-3] ...               │   │
│  │                                                              │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ #MMS-001 • John D. • 1-2 PM                            │   │   │
│  │ │ Status: [Confirmed ▼]                                  │   │   │
│  │ │ Items: Kyay-O (Soup), Nan-Gyi x2                       │   │   │
│  │ │ Total: $61.00                                          │   │   │
│  │ │ [View Details] [Print]                                 │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ #MMS-002 • Sarah M. • 2-3 PM                           │   │   │
│  │ │ Status: [In Kitchen ▼]                                 │   │   │
│  │ │ ...                                                    │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Driver: Delivery Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  DRIVER MOBILE VIEW                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Today's Route (5 stops)                                      │   │
│  │                                                              │   │
│  │ 1. ✓ 123 Main St, Pasadena (delivered 1:15 PM)               │   │
│  │ 2. → 456 Oak Ave, Glendale (current - navigate)              │   │
│  │ 3. ○ 789 Pine Dr, Arcadia                                    │   │
│  │ 4. ○ 321 Elm St, Monrovia                                    │   │
│  │ 5. ○ 654 Cedar Ln, Duarte                                    │   │
│  │                                                              │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ Current Stop: 456 Oak Ave, Glendale                     │   │   │
│  │ │ Customer: Sarah M. • (626) 555-1234                     │   │   │
│  │ │ Notes: "Ring doorbell twice"                            │   │   │
│  │ │ Items: Goat Curry, Rice x2                              │   │   │
│  │ │                                                         │   │   │
│  │ │ [📍 Navigate] [📞 Call] [Mark Delivered]                 │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Business Rules (Locked)

### 3.1 Delivery Schedule
| Rule | Value | Notes |
|------|-------|-------|
| Delivery day | Saturday only | No exceptions in V1 |
| Delivery hours | 11:00 AM - 7:00 PM PT | 8 hourly windows |
| Customer selection | Single hourly window | e.g., "1:00 PM - 2:00 PM" |
| Order cutoff | Friday 3:00 PM PT | No changes after cutoff |
| Post-cutoff orders | Default to next Saturday | Clear messaging required |

### 3.2 Delivery Fee Threshold
| Subtotal | Delivery Fee | Display Message |
|----------|--------------|-----------------|
| < $100 | $15.00 | "Add $X more for FREE delivery!" |
| ≥ $100 | $0.00 | "✓ Free delivery!" |

**"Subtotal" definition**: Sum of (base_price + modifier_deltas) × quantity, pre-tax, pre-tip.

### 3.3 Coverage Rules
| Constraint | Value | Notes |
|------------|-------|-------|
| Origin | 750 Terrado Plaza #33, Covina, CA 91723 | Kitchen location |
| Max distance | 50 miles | Straight-line or driving? → **Driving** |
| Max duration | 90 minutes | Google Maps driving estimate |
| Validation | Both constraints must pass | Reject if either fails |
| Re-validation | On address save + at checkout | Prevent stale data |

### 3.4 Order Lifecycle States
```
draft → pending_payment → paid → confirmed → in_kitchen → out_for_delivery → delivered
                ↓                                                    ↓
           (payment failed)                                      (skipped)
                ↓                    ↓
           retry or abandon     canceled (pre-cutoff only)
                                    ↓
                               refunded (admin-only)
```

---

## 4. Edge Cases & Error States

### 4.1 Coverage Validation
| Scenario | Behavior |
|----------|----------|
| Address outside 50mi | Block checkout; show: "Sorry, [City] is outside our delivery area (50 miles max)" |
| Address >90min drive | Block checkout; show: "Sorry, [City] is too far for Saturday delivery (90 min max)" |
| Google Maps API error | Allow checkout with warning; flag for manual review |
| Address can't geocode | Show: "We couldn't find that address. Please check and try again." |

### 4.2 Cutoff Handling
| Scenario | Behavior |
|----------|----------|
| Order placed before Fri 3pm | Scheduled for this Saturday |
| Order placed after Fri 3pm | Scheduled for NEXT Saturday with clear message |
| User tries to edit after cutoff | Block; show: "Order locked. Contact us for changes." |
| User tries to cancel after cutoff | Block; show: "Contact us to cancel. Refunds subject to policy." |

### 4.3 Payment Failures
| Scenario | Behavior |
|----------|----------|
| Card declined | Return to cart; show error; order stays `pending_payment` |
| Stripe webhook delayed | Order shows "Processing..."; poll or wait for webhook |
| Webhook verification fails | Log error; don't update order; alert admin |
| Duplicate webhook | Idempotent handling; no duplicate charges |

### 4.4 Menu/Cart Edge Cases
| Scenario | Behavior |
|----------|----------|
| Item goes sold out while in cart | Show warning at checkout; require removal |
| Price changes while in cart | Server recalculates; show difference if >5% |
| Modifier group required but not selected | Block "Add to Cart"; highlight missing |
| Item deleted from menu | Historical orders keep snapshot; cart clears item |

### 4.5 Delivery Day Edge Cases
| Scenario | Behavior |
|----------|----------|
| Driver running late | Update ETA in real-time; notify customer |
| Customer not home | Driver marks "attempted"; follow up via admin |
| Weather/emergency cancellation | Admin batch-cancels; refund flow |
| Kitchen over capacity | Admin can disable time windows |

---

## 5. Non-Goals (Explicit Scope Exclusions)

### 5.1 Not in V0
- Payment (browse-only)
- Cart persistence across sessions
- User accounts (anonymous browse)
- Admin panel

### 5.2 Not in V1
- Multiple delivery days (Sunday, weekday)
- Subscription/recurring orders
- Tipping (defer to V2)
- SMS/push notifications
- Promo codes/coupons
- Loyalty program
- Multi-location support
- Inventory management
- Recipe/prep tracking
- POS integration

### 5.3 Not in V2
- Native mobile apps (evaluate based on V1 usage)
- Catering/bulk orders
- Gift cards
- Waitlist for out-of-coverage areas

---

## 6. Milestone Definitions

### V0 — Skeleton (Week 1-2)
**Goal**: Prove core infrastructure works; user can browse menu.

| Acceptance Criteria | Test |
|---------------------|------|
| User can create account with email | Sign up → verify email → login works |
| User can check address coverage | Enter LA address → "✓ Deliverable"; Enter SF → "✗ Out of range" |
| User can browse full menu | All categories load; items display with prices; Burmese names show |
| Menu is mobile-responsive | Test on 375px viewport; category tabs scroll horizontally |
| RLS prevents cross-user data access | User A cannot see User B's addresses |

**Done signal**: I can sign up, enter my address, and browse all menu items on my phone.

### V1 — Ordering Core (Week 3-5)
**Goal**: Complete purchase flow; real orders can be placed.

| Acceptance Criteria | Test |
|---------------------|------|
| User can add items with modifiers to cart | Add Kyay-O with Brains addon → cart shows $20 |
| Cart persists within session | Refresh page → cart still has items |
| Delivery fee threshold works | $50 cart shows $15 fee; $100 cart shows $0 |
| User can select Saturday time window | See 8 hourly slots; select one |
| Stripe Checkout completes successfully | Pay $50 test order → order status = `paid` |
| Webhook updates order status | Stripe dashboard shows payment → Supabase order = `confirmed` |
| Order confirmation page shows details | See order number, items, delivery time |
| Post-cutoff blocks editing | Try to modify order on Saturday → blocked |
| Admin can see order list | Login as admin → see all orders for Saturday |

**Done signal**: I can place a $50 test order with Stripe test mode and see it in both the customer order page and admin dashboard.

### V2 — Ops-Ready (Week 6-8)
**Goal**: Kitchen can fulfill orders; drivers can deliver; customers can track.

| Acceptance Criteria | Test |
|---------------------|------|
| Admin can update order status | Change order to "in_kitchen" → customer sees update |
| Admin can mark item sold out | Mark Kyay-O sold out → shows "Sold Out" badge |
| Admin can add/edit menu items | Add new item → appears on menu |
| Admin can issue refunds | Refund order → Stripe shows refund; order = `refunded` |
| Driver sees assigned route | Login as driver → see optimized stop list |
| Driver can mark delivered | Tap "Delivered" → order status updates; customer notified |
| Customer sees live tracking | When "out_for_delivery" → map shows driver location |
| Driver location updates every 5 min | Background ping → location updates in DB |

**Done signal**: Kitchen can fulfill a real order from dashboard; driver can complete delivery; customer can track in real-time.

---

# Part B: Engineering Design

## 7. Tech Stack (Confirmed)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | SSR/SSG flexibility; React Server Components; API routes |
| Language | TypeScript (strict) | Catch errors early; better DX |
| Styling | Tailwind CSS + shadcn/ui | Rapid iteration; consistent design system |
| Animation | Framer Motion | Micro-interactions; premium feel |
| Database | Supabase Postgres | Managed Postgres; built-in auth; real-time |
| Auth | Supabase Auth | Email/password; OAuth optional later |
| Payments | Stripe Checkout | PCI compliance; fast implementation |
| Maps | Google Maps Platform | Geocoding; distance matrix; Places API |
| Hosting | Vercel | Seamless Next.js deployment; edge functions |
| Monitoring | Vercel Analytics + Sentry | Performance + error tracking |

## 8. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER DEVICE                           │
│                        (Mobile Browser PWA)                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE NETWORK                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Static Assets  │  │   SSR Pages     │  │    API Routes       │  │
│  │  (menu images)  │  │  (menu browse)  │  │ (/api/checkout,     │  │
│  │                 │  │                 │  │  /api/webhooks)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
        ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
        │   SUPABASE    │  │    STRIPE     │  │  GOOGLE MAPS  │
        │  ┌─────────┐  │  │               │  │               │
        │  │Postgres │  │  │ • Checkout    │  │ • Geocoding   │
        │  │ + RLS   │  │  │ • Webhooks    │  │ • Distance    │
        │  └─────────┘  │  │ • Refunds     │  │ • Directions  │
        │  ┌─────────┐  │  │               │  │               │
        │  │  Auth   │  │  └───────────────┘  └───────────────┘
        │  └─────────┘  │
        │  ┌─────────┐  │
        │  │Realtime │  │  (driver location updates)
        │  └─────────┘  │
        └───────────────┘
```

## 9. Data Model (Refined from docs/04-data-model.md)

### 9.1 Core Tables

```sql
-- User profile (extends Supabase auth.users)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role enum('customer', 'admin', 'driver') DEFAULT 'customer',
  full_name text NOT NULL,
  phone text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Saved addresses (coverage pre-validated)
addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  label text DEFAULT 'Home',
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  coverage_valid boolean NOT NULL,
  distance_miles numeric,
  duration_minutes numeric,
  last_validated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Menu structure
menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_my text,
  description_en text,
  image_url text,
  base_price_cents int NOT NULL CHECK (base_price_cents >= 0),
  is_active boolean DEFAULT true,
  is_sold_out boolean DEFAULT false,
  tags text[],
  allergens text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

modifier_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  selection_type enum('single', 'multiple') NOT NULL,
  min_select int NOT NULL DEFAULT 0,
  max_select int NOT NULL DEFAULT 1,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

modifier_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES modifier_groups(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  price_delta_cents int DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, slug)
)

menu_item_modifier_groups (
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  group_id uuid REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  PRIMARY KEY (menu_item_id, group_id)
)

-- Orders (snapshot pricing)
orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  address_id uuid REFERENCES addresses(id),
  scheduled_date date NOT NULL,
  time_window_start time NOT NULL,
  time_window_end time NOT NULL,
  cutoff_at timestamptz NOT NULL,
  status enum('draft','pending_payment','paid','confirmed','in_kitchen','out_for_delivery','delivered','canceled','refunded') DEFAULT 'draft',
  items_subtotal_cents int NOT NULL DEFAULT 0,
  delivery_fee_cents int NOT NULL DEFAULT 0,
  tax_cents int DEFAULT 0,
  tip_cents int DEFAULT 0,
  discount_cents int DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,
  customer_notes text,
  internal_notes text,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  unit_price_cents_snapshot int NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  item_notes text,
  created_at timestamptz DEFAULT now()
)

order_item_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_option_id uuid REFERENCES modifier_options(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  price_delta_cents_snapshot int NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Delivery operations (V2)
drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_date date NOT NULL,
  driver_id uuid REFERENCES drivers(id),
  status enum('planned','in_progress','completed') DEFAULT 'planned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  stop_index int NOT NULL,
  eta timestamptz,
  status enum('pending','enroute','arrived','delivered','skipped') DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

driver_location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES drivers(id),
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  recorded_at timestamptz DEFAULT now()
)
```

### 9.2 RLS Policies (Summary)

| Table | Customer | Admin | Driver |
|-------|----------|-------|--------|
| profiles | Own row only | All rows | Own row only |
| addresses | Own rows only | All rows | None |
| menu_* | Read active only | Full CRUD | Read active only |
| orders | Own rows only | All rows | Assigned orders only |
| order_items | Via order ownership | All rows | Assigned orders only |
| routes | None | All rows | Assigned routes only |
| driver_location_updates | Via active order route | All rows | Own rows only |

## 10. API Boundaries

### 10.1 Public Endpoints (No Auth)

```
GET  /api/menu
     → { categories: [...], items: [...] }
     → Cached 5 min; ISR revalidation

POST /api/coverage/check
     → { address: string }
     ← { valid: boolean, distance_miles?: number, duration_minutes?: number, error?: string }
```

### 10.2 Authenticated Endpoints

```
-- Address Management
GET    /api/addresses                → list user's saved addresses
POST   /api/addresses                → create + validate coverage
PATCH  /api/addresses/:id            → update address
DELETE /api/addresses/:id            → soft delete

-- Cart/Order (client state until checkout)
POST   /api/orders/draft             → create draft order from cart
PATCH  /api/orders/:id               → update draft (pre-cutoff only)
GET    /api/orders/:id               → get order details
GET    /api/orders                   → list user's orders

-- Checkout
POST   /api/checkout/session         → create Stripe Checkout Session
     → { order_id, success_url, cancel_url }
     ← { checkout_url: string }

-- Webhooks (Stripe signature verified)
POST   /api/webhooks/stripe          → handle checkout.session.completed, etc.
```

### 10.3 Admin Endpoints

```
-- Orders
GET    /api/admin/orders             → list all orders (filters: date, status)
PATCH  /api/admin/orders/:id         → update status, internal_notes
POST   /api/admin/orders/:id/refund  → initiate Stripe refund

-- Menu
POST   /api/admin/menu/import        → import from YAML seed
PATCH  /api/admin/menu/items/:id     → update item (price, sold_out, etc.)
PATCH  /api/admin/menu/categories/:id → update category

-- Routes (V2)
POST   /api/admin/routes             → create route for date
PATCH  /api/admin/routes/:id         → assign driver, reorder stops
```

### 10.4 Driver Endpoints (V2)

```
GET    /api/driver/routes/today      → get assigned route
PATCH  /api/driver/stops/:id         → update stop status
POST   /api/driver/location          → ping current location
```

## 11. Stripe Integration Details

### 11.1 Checkout Session Creation

```typescript
// POST /api/checkout/session
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  customer: stripeCustomerId, // create if missing
  client_reference_id: order.id,
  metadata: {
    order_id: order.id,
    user_id: order.user_id,
    scheduled_date: order.scheduled_date,
    time_window: `${order.time_window_start}-${order.time_window_end}`,
  },
  line_items: [
    // Menu items
    ...orderItems.map(item => ({
      price_data: {
        currency: 'usd',
        unit_amount: item.unit_price_cents_snapshot + modifiersDelta,
        product_data: { name: item.name_snapshot },
      },
      quantity: item.quantity,
    })),
    // Delivery fee (if applicable)
    ...(order.delivery_fee_cents > 0 ? [{
      price_data: {
        currency: 'usd',
        unit_amount: order.delivery_fee_cents,
        product_data: { name: 'Delivery Fee' },
      },
      quantity: 1,
    }] : []),
  ],
  success_url: `${origin}/order/${order.id}?status=success`,
  cancel_url: `${origin}/cart?canceled=true`,
}, {
  idempotencyKey: `checkout-${order.id}`, // prevent duplicates
});
```

### 11.2 Webhook Handler

```typescript
// POST /api/webhooks/stripe
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

switch (event.type) {
  case 'checkout.session.completed':
    const session = event.data.object;
    await updateOrder(session.metadata.order_id, {
      status: 'paid',
      stripe_payment_intent_id: session.payment_intent,
    });
    // Transition to 'confirmed' (or wait for manual confirmation)
    break;
    
  case 'payment_intent.payment_failed':
    // Mark order failed; allow retry
    break;
    
  case 'charge.refunded':
    // Update order status to 'refunded'
    break;
}
```

## 12. Google Maps Integration

### 12.1 Coverage Validation

```typescript
// Server-side only (API key protected)
async function validateCoverage(address: string): Promise<CoverageResult> {
  const KITCHEN = { lat: 34.0874, lng: -117.8894 }; // Covina
  const MAX_DISTANCE_MILES = 50;
  const MAX_DURATION_MINUTES = 90;
  
  // 1. Geocode address
  const geocode = await mapsClient.geocode({ address });
  if (!geocode.results.length) {
    return { valid: false, error: 'ADDRESS_NOT_FOUND' };
  }
  const { lat, lng } = geocode.results[0].geometry.location;
  
  // 2. Get driving distance/duration
  const matrix = await mapsClient.distancematrix({
    origins: [KITCHEN],
    destinations: [{ lat, lng }],
    mode: 'driving',
    departure_time: 'now', // or specific Saturday time
  });
  
  const element = matrix.rows[0].elements[0];
  if (element.status !== 'OK') {
    return { valid: false, error: 'ROUTE_NOT_FOUND' };
  }
  
  const distanceMiles = element.distance.value / 1609.34;
  const durationMinutes = element.duration.value / 60;
  
  // 3. Check constraints
  const valid = distanceMiles <= MAX_DISTANCE_MILES && 
                durationMinutes <= MAX_DURATION_MINUTES;
  
  return {
    valid,
    distance_miles: Math.round(distanceMiles * 10) / 10,
    duration_minutes: Math.round(durationMinutes),
    lat,
    lng,
    error: valid ? undefined : 
           distanceMiles > MAX_DISTANCE_MILES ? 'TOO_FAR_DISTANCE' : 'TOO_FAR_DURATION',
  };
}
```

## 13. Auth & Security

### 13.1 Authentication Flow

```
1. User signs up with email/password (Supabase Auth)
2. Email verification sent
3. On first login, profile row created via trigger
4. Session token stored in HttpOnly cookie
5. All API routes check session; reject if missing/expired
6. Admin/driver roles checked via profiles.role
```

### 13.2 Security Checklist

| Category | Measure |
|----------|---------|
| **Auth** | Email verification required; session cookies HttpOnly + Secure |
| **RLS** | All tables have row-level security; policies tested |
| **API** | Server-side price calculation; never trust client amounts |
| **Webhooks** | Stripe signature verification required |
| **Secrets** | All keys in environment variables; never in client |
| **CORS** | Strict origin whitelist |
| **Rate limiting** | Vercel Edge rate limiting on public endpoints |
| **Input validation** | Zod schemas at all API boundaries |

## 14. Testing Strategy

### 14.1 Unit Tests (Vitest)

| Area | Tests |
|------|-------|
| Fee calculation | `calculateDeliveryFee(4999) → 1500`; `calculateDeliveryFee(10000) → 0` |
| Cutoff logic | `getNextDeliverySaturday(FriAt2pm) → thisSat`; `getNextDeliverySaturday(FriAt4pm) → nextSat` |
| Coverage validation | Mock distance matrix responses; test boundary cases |
| Order total | Items + modifiers + fee + tax = expected total |

### 14.2 Integration Tests (Playwright)

| Flow | Test |
|------|------|
| Sign up → browse → add to cart | New user can see menu and cart |
| Cart → checkout → success | Stripe test mode payment completes |
| Webhook → order status update | Mock webhook triggers status change |
| Out-of-coverage rejection | SF address blocked at checkout |
| Post-cutoff edit block | Saturday edit attempt fails |

### 14.3 E2E Tests (Playwright)

| Scenario | Test |
|----------|------|
| Happy path order | Sign up → add items → checkout → confirm |
| Admin order view | Admin sees customer order in dashboard |
| Driver delivery | Driver marks stop delivered → customer sees update |

## 15. Deployment Strategy

### 15.1 Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost:3000 |
| Preview | PR previews | *.vercel.app (auto) |
| Staging | Pre-prod testing | staging.morningstar.com |
| Production | Live | order.mandalaymorningstar.com |

### 15.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  lint:
    - pnpm lint
    - pnpm typecheck
    
  test:
    - pnpm test:unit
    - pnpm test:integration
    
  build:
    - pnpm build
    
  deploy-preview:
    if: github.event_name == 'pull_request'
    - vercel deploy --prebuilt
    
  deploy-production:
    if: github.ref == 'refs/heads/main'
    - vercel deploy --prod
```

### 15.3 Database Migrations

- Migrations via Supabase CLI (`supabase migration new`, `supabase db push`)
- All migrations must be idempotent (use `IF NOT EXISTS`, etc.)
- Migrations reviewed in PR before merge
- Staging DB reset weekly; production migrations are additive only

## 16. Observability

### 16.1 Logging

| Event | Log Level | Data |
|-------|-----------|------|
| Order created | INFO | order_id, user_id, total |
| Payment success | INFO | order_id, stripe_pi |
| Payment failure | WARN | order_id, error |
| Coverage validation | DEBUG | address, result |
| Webhook received | INFO | event_type, order_id |
| Webhook failed | ERROR | event_type, error |

### 16.2 Metrics (V2)

- Orders per day
- Average order value
- Conversion rate (cart → paid)
- Coverage check pass/fail rate
- Delivery on-time rate

### 16.3 Alerts

| Condition | Alert |
|-----------|-------|
| Webhook failures > 5/hour | PagerDuty |
| Payment success rate < 95% | Slack |
| API error rate > 1% | Sentry |

---

## 17. Design System (Brand Tokens)

Based on the uploaded logo:

```css
:root {
  /* Primary */
  --color-gold: #D4AF37;
  --color-gold-light: #E8D48A;
  --color-gold-dark: #B8960C;
  
  /* Secondary */
  --color-red: #8B1A1A;
  --color-red-light: #A83232;
  --color-red-dark: #5C1111;
  
  /* Myanmar flag accent */
  --color-green: #34A853;
  --color-white: #FFFFFF;
  
  /* Neutral */
  --color-bg: #FDF8F0;      /* Warm off-white */
  --color-text: #2D2D2D;
  --color-muted: #6B6B6B;
  
  /* Typography */
  --font-display: 'Playfair Display', serif;  /* Headings */
  --font-body: 'Inter', sans-serif;           /* Body text */
  --font-burmese: 'Padauk', sans-serif;       /* Burmese script */
}
```

### 17.1 Component Style Guide

| Component | Style |
|-----------|-------|
| Primary button | Gold background, dark text, rounded-lg, shadow |
| Secondary button | Red outline, red text, hover fills |
| Category tabs | Horizontal scroll, gold underline active, sticky |
| Item card | White bg, subtle shadow, hover lift |
| Cart drawer | Slide from right, backdrop blur |
| Price text | Gold accent color for totals |

---

## 18. File/Folder Structure (Proposed)

```
mandalay-morning-star/
├── .github/
│   └── workflows/ci.yml
├── docs/
│   ├── PROJECT_SPEC.md          # This document
│   ├── architecture.md          # System design details
│   ├── change_log.md            # Version history
│   └── project_status.md        # Current progress
├── data/
│   └── menu.seed.yaml           # Menu seed data
├── supabase/
│   ├── migrations/              # SQL migrations
│   └── seed.sql                 # Dev seed data
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (public)/            # Public pages (menu, coverage)
│   │   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── (customer)/          # Customer pages (cart, checkout, orders)
│   │   ├── (admin)/             # Admin dashboard
│   │   ├── (driver)/            # Driver app
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── menu/                # Menu-specific components
│   │   ├── cart/                # Cart components
│   │   └── order/               # Order components
│   ├── lib/
│   │   ├── supabase/            # Supabase client + helpers
│   │   ├── stripe/              # Stripe helpers
│   │   ├── maps/                # Google Maps helpers
│   │   └── utils/               # General utilities
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand stores (cart)
│   └── types/                   # TypeScript types
├── public/
│   ├── images/
│   └── manifest.json            # PWA manifest
├── tests/
│   ├── unit/
│   └── e2e/
├── CLAUDE.md                    # Project memory (concise)
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 19. Open Decisions (To Resolve)

| # | Decision | Options | Recommendation | Status |
|---|----------|---------|----------------|--------|
| 1 | Cart storage | LocalStorage vs Zustand+persist vs Server draft | **Zustand+persist** (client-side, survives refresh) | Pending |
| 2 | Tax handling | Fixed rate vs Stripe Tax vs TaxJar | **Fixed rate** (V1); Stripe Tax (V2) | Pending |
| 3 | Tip feature | V1 vs V2 | **V2** (defer complexity) | Pending |
| 4 | Image hosting | Supabase Storage vs Cloudinary vs Vercel Blob | **Supabase Storage** (simplicity) | Pending |
| 5 | Real-time updates | Polling vs Supabase Realtime | **Supabase Realtime** (driver location) | Pending |

---

## 20. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google Maps API quota exceeded | Medium | High | Set budget alerts; cache geocode results |
| Stripe webhook delays | Low | Medium | Implement polling fallback; show "Processing" |
| Kitchen overwhelmed on launch | High | High | Start with limited time windows; capacity caps |
| Driver GPS accuracy | Medium | Medium | Show ETA range, not exact time |
| Menu data entry errors | High | Medium | Validation rules; admin preview before publish |

---

*Document version: 1.0 | Created: 2026-01-12 | Author: Claude (Planning)*
