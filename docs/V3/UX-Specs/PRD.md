# V3 PRD — World-Class UX Redesign

> **Version**: 1.0 (Draft)
> **Generated**: 2026-01-15
> **Scope**: Complete UI/UX reinvention for customer, driver, and admin experiences

---

## 1. One-Sentence Problem

> **Customers, drivers, and admins** struggle to **accomplish their tasks with delight and efficiency** because **the current V2 interface, while functional, lacks the polish, intuition, and memorable character** of world-class food ordering experiences, resulting in **longer task completion times, cognitive friction, and a forgettable brand impression**.

---

## 2. Demo Goal (What Success Looks Like)

### Success Criteria

A successful V3 demo must demonstrate:

1. **Customer Flow**: A first-time user can browse the menu, customize an item, and complete checkout in under 90 seconds — with a "wow, that was smooth" reaction
2. **Driver Flow**: A driver can start their route, complete a delivery with photo proof, and move to the next stop without ever feeling lost or frustrated
3. **Admin Flow**: An admin can view today's delivery status, identify exceptions, and drill into driver performance within 3 clicks

### Key Outcomes

| Stakeholder | Outcome |
|-------------|---------|
| Customer | "This feels premium and fast — like Sweetgreen meets Panda Express" |
| Driver | "Everything I need is right here, even when I lose signal" |
| Admin | "I can see exactly what's happening without hunting for data" |

### Non-Goals (Out of Scope)

- New backend features (V3 is UX-only; existing V2 APIs remain)
- Payment method additions (Stripe Checkout continues)
- New menu taxonomy or modifier structures
- Native mobile apps (PWA continues)

---

## 3. Target User (Role-Based)

### Primary: Customer (Ordering)

| Attribute | Value |
|-----------|-------|
| **Role** | Busy professional or family organizer planning Saturday meals |
| **Skill Level** | Comfortable with modern food delivery apps (DoorDash, Uber Eats) |
| **Key Constraint** | Limited patience; expects sub-2-minute ordering; abandons at friction |
| **Context** | Ordering during weekday evenings or early Saturday; often on mobile |

### Secondary: Driver (Delivery)

| Attribute | Value |
|-----------|-------|
| **Role** | Part-time delivery driver with multiple Saturday stops |
| **Skill Level** | Smartphone-proficient; may not be tech-savvy |
| **Key Constraint** | Driving context; needs glanceable info; offline resilience |
| **Context** | Moving between stops; harsh sunlight; one-handed operation |

### Tertiary: Admin (Operations)

| Attribute | Value |
|-----------|-------|
| **Role** | Kitchen manager coordinating Saturday fulfillment |
| **Skill Level** | Basic dashboard familiarity; not a power user |
| **Key Constraint** | High-stress environment; needs at-a-glance status; exception alerts |
| **Context** | Desktop in kitchen; checking between food prep; Saturday operations |

---

## 4. Core Use Case (Happy Path)

### 4.1 Customer: Saturday Meal Order

**Start Condition**: Customer lands on homepage, hungry and curious about Burmese food.

**Flow**:
1. Customer sees hero with appetizing imagery and "Order for Saturday" CTA
2. Customer taps CTA → lands on menu page with sticky category tabs
3. Customer scrolls/taps "Curries" category
4. Customer taps "Mohinga" card → item modal opens with stunning photo
5. Customer selects spice level (mild), adds extra fish cake (+$2)
6. Customer taps "Add to Cart" → cart drawer slides in with running total
7. Customer adds 2 more items following same pattern
8. Customer taps "Checkout" → checkout stepper begins
9. Customer confirms saved address (coverage validated) → next step
10. Customer selects "2-3 PM" delivery window → next step
11. Customer reviews order summary → taps "Pay $87.00"
12. Stripe Checkout completes → success page with tracking link

**End Condition**: Order placed, confirmation email received, customer delighted.

---

### 4.2 Driver: Saturday Delivery Route

**Start Condition**: Driver opens app Saturday morning, route assigned.

**Flow**:
1. Driver sees home screen with route card: "12 stops · Est. 4h · Start 11:00 AM"
2. Driver taps "Start Route" → active route view loads
3. Driver sees current stop card: address, items, time window, customer notes
4. Driver taps "Navigate" → Google Maps opens with destination
5. Driver arrives → taps "Arrived" button
6. Driver delivers → takes photo of food at door
7. Driver taps "Complete Delivery" → photo uploads, next stop loads
8. *Exception*: Customer not home → driver taps "Issue" → selects reason → logs exception
9. Driver completes remaining stops following same pattern
10. Final stop completed → route summary screen with stats

**End Condition**: All deliveries complete (or exceptions logged), driver done for the day.

---

### 4.3 Admin: Saturday Operations Monitoring

**Start Condition**: Admin logs in Saturday 11 AM as deliveries begin.

**Flow**:
1. Admin lands on dashboard → sees today's overview: 45 orders, 4 drivers, 0 exceptions
2. Admin glances at driver cards showing real-time progress
3. Admin notices one driver is behind schedule (yellow indicator)
4. Admin clicks driver card → sees route detail with map
5. Admin identifies the delay: traffic near stop #5
6. Admin receives exception alert → customer not home for order #234
7. Admin clicks alert → sees exception details and customer contact
8. Admin calls customer → reschedules → marks exception resolved
9. Admin returns to dashboard → monitors until all deliveries complete

**End Condition**: All orders delivered, exceptions resolved, admin has clear end-of-day stats.

---

## 5. Functional Decisions (What It Must Do)

### 5.1 Customer Experience

| ID | Function | Notes |
|----|----------|-------|
| C1 | Display categorized menu with stunning food photography | Hero images, lazy-loaded gallery |
| C2 | Enable item customization with real-time price updates | Modifier groups, quantity, notes |
| C3 | Show cart with running total and delivery fee status | "$13 more for free delivery" messaging |
| C4 | Validate address coverage before checkout proceeds | Clear error if out of range |
| C5 | Display available Saturday time windows | This/next Saturday logic |
| C6 | Complete payment via Stripe Checkout | Redirect flow, success/failure handling |
| C7 | Show order confirmation with tracking link | Email + in-app confirmation |
| C8 | Display real-time order status and driver location | When out for delivery |

### 5.2 Driver Experience

| ID | Function | Notes |
|----|----------|-------|
| D1 | Show assigned route with stop count and estimated duration | Morning briefing view |
| D2 | Display current stop with full delivery context | Address, items, notes, time window |
| D3 | Launch navigation to current stop | Deep link to Google Maps |
| D4 | Record delivery completion with photo proof | Camera capture, upload |
| D5 | Log delivery exceptions with reason codes | Can't deliver, customer absent, etc. |
| D6 | Work offline with sync when reconnected | Queue updates, retry logic |
| D7 | Show route progress and completion stats | Stops done, time elapsed |

### 5.3 Admin Experience

| ID | Function | Notes |
|----|----------|-------|
| A1 | Display today's delivery overview at a glance | Total orders, drivers, progress |
| A2 | Show real-time driver locations on map | Live GPS pins |
| A3 | Surface exceptions with alerts | Push to top, require attention |
| A4 | Enable drill-down into driver and route details | Click-through hierarchy |
| A5 | Display delivery analytics and trends | Charts, KPIs, comparisons |
| A6 | Manage menu items and availability | Toggle sold out, edit details |
| A7 | View and manage customer orders | Status updates, refunds |

---

## 6. UX Decisions (What the Experience Is Like)

### 6.1 Entry Points

| User | Entry Point | First View |
|------|-------------|------------|
| **Customer** | Homepage URL or "Order Now" link | Hero image with CTA, coverage checker |
| **Driver** | PWA bookmark or app icon | Route summary or "No route today" |
| **Admin** | `/admin` URL with auth | Operations dashboard |

### 6.2 Inputs

| User | Inputs |
|------|--------|
| **Customer** | Address (new or saved), time window selection, item customizations, payment via Stripe |
| **Driver** | Location permissions, delivery status taps, photo capture, exception selections |
| **Admin** | Filter selections, search queries, status updates, exception resolutions |

### 6.3 Outputs

| User | Outputs |
|------|---------|
| **Customer** | Menu display, cart totals, order confirmation, tracking updates, delivery notifications |
| **Driver** | Route stops list, navigation links, completion confirmations, route summary |
| **Admin** | Dashboard metrics, driver locations, exception alerts, analytics charts |

### 6.4 Feedback & States

| State | Customer | Driver | Admin |
|-------|----------|--------|-------|
| **Loading** | Skeleton cards with shimmer | Spinner with "Loading route..." | Skeleton dashboard |
| **Success** | Green toast, confetti on order | Check animation, next stop auto-loads | Green badge updates |
| **Error** | Red inline message, retry CTA | Red banner, offline indicator | Red alert card |
| **Empty** | "No items yet" with CTA | "No route assigned" message | "No orders today" |
| **Partial** | Cart with some items | Route with some stops complete | Dashboard with partial data |

### 6.5 Error Handling (Minimum Viable)

| Error | Customer | Driver | Admin |
|-------|----------|--------|-------|
| **Network offline** | "You're offline" banner, cached menu | Queue actions, sync indicator | "Connection lost" banner |
| **Address invalid** | Inline error, suggest corrections | N/A | N/A |
| **Payment failed** | Redirect back with error, retry | N/A | N/A |
| **Photo upload failed** | N/A | Retry button, keep in queue | N/A |
| **No data** | Empty state with browse CTA | "Check back later" message | "No data for this period" |

---

## 7. Data & Logic (At a Glance)

### 7.1 Inputs (Data Sources)

| Source | Data |
|--------|------|
| **Supabase** | Menu items, categories, modifiers, orders, addresses, drivers, routes |
| **Google Maps API** | Geocoding, coverage validation, route polylines, ETA calculations |
| **Stripe** | Payment sessions, checkout completion webhooks |
| **Device** | Driver GPS location, camera for photo capture |
| **User** | Selections, inputs, preferences |

### 7.2 Processing (High-Level Logic)

```
Customer Order:
  Browse menu (cached) → Select items → Validate modifiers →
  Check coverage (server) → Calculate totals (server) →
  Create Stripe session → Complete payment → Confirm order

Driver Delivery:
  Load route → Start route → Update location (periodic) →
  Navigate to stop → Mark arrived → Complete delivery (photo) →
  Upload proof → Load next stop → Repeat until done

Admin Monitoring:
  Load dashboard → Subscribe to real-time updates →
  Display metrics → Surface exceptions → Enable drill-down →
  Update statuses as needed
```

### 7.3 Outputs (Where Results Go)

| Output | Destination |
|--------|-------------|
| Order created | Supabase `orders` table, Stripe, customer email |
| Delivery completed | Supabase `route_stops` update, customer notification |
| Location update | Supabase `driver_locations`, customer tracking page |
| Photo proof | Supabase Storage, linked to route stop |
| Analytics data | Materialized views, admin dashboard |

---

## Assumptions (Labeled)

1. **[ASSUMPTION]** Existing V2 APIs are stable and don't need modification
2. **[ASSUMPTION]** Current database schema supports all V3 UX requirements
3. **[ASSUMPTION]** Users have modern browsers with JavaScript enabled
4. **[ASSUMPTION]** Driver phones have GPS and camera capabilities
5. **[ASSUMPTION]** Admin uses desktop browser for dashboard (not mobile)
6. **[ASSUMPTION]** Design system tokens (colors, fonts, motion) remain unchanged

---

## References

- Business context: [docs/00-context-pack.md](../../00-context-pack.md)
- V1 features: [docs/v1-spec.md](../../v1-spec.md)
- V2 features: [docs/v2-spec.md](../../v2-spec.md)
- Design system: [docs/frontend-design-system.md](../../frontend-design-system.md)
- Component guide: [docs/component-guide.md](../../component-guide.md)
