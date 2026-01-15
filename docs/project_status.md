# docs/project_status.md — Milestone Tracking (v2.1)

> **Last Updated**: 2026-01-15
> **Current Phase**: V2 Sprint 2 Complete (Ready for Sprint 3)

---

## ðŸ“Š Milestone Overview

| Version | Status | Target | Focus |
|---------|--------|--------|-------|
| **V0** | ✅ Complete | - | Scaffold + Foundation |
| **V1** | ✅ Complete | Week 4 | Full Ordering Flow |
| **V2** | 🚧 In Progress | Week 8 | Driver Ops + Tracking |
| **V3** | 💭 Future | TBD | Scale + Polish |

---

## âœ… V0: Foundation (Complete)

### Deliverables
- [x] Project scaffold (Next.js 15 + TypeScript)
- [x] Tailwind + shadcn/ui setup
- [x] Supabase project + connection
- [x] Database schema (core tables)
- [x] RLS policies (baseline)
- [x] Supabase Auth (email + profile creation)
- [x] Environment configuration
- [x] CI pipeline (lint + typecheck + build)
- [x] Documentation foundation

### Acceptance Criteria (Met)
- [x] `pnpm dev` starts without errors
- [x] User can register + login
- [x] Profile created on signup (trigger)
- [x] Menu seed YAML validated
- [x] TypeScript strict mode enabled
- [x] All docs up to date

---

## ✅ V1: Core Ordering Flow (Complete)

### Sprint 1: Menu Browse (Week 1-2)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Menu data layer (V1-S1-001) | ✅ | Codex | Types, API routes, React Query hooks |
| Category tabs (V1-S1-002) | ✅ | Codex | Sticky, horizontal scroll, scroll-spy |
| Item card (V1-S1-003) | ✅ | Codex | Responsive card with image + price |
| Menu grid (V1-S1-004) | ✅ | Codex | Responsive grid layout |
| Menu search (V1-S1-005) | ✅ | Codex | Debounced, fuzzy match |
| Item detail modal (V1-S1-006) | ✅ | Codex | Modifiers, qty, notes |

**Task Files**: `docs/V1/tasks/V1-S1-*.md`

**Sprint 1 completion**: 6/6 (100%)

### Sprint 2: Cart + Checkout (Week 2-3)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Cart state (V1-S2-001) | ✅ | Codex | Zustand store: add/update/remove/clear |
| Cart drawer (V1-S2-002) | ✅ | Codex | Slide-over, mobile-first |
| Cart summary (V1-S2-003) | ✅ | Codex | Subtotal + fee display |
| Address management (V1-S2-004) | ✅ | Codex | CRUD + geocoding + validation |
| Coverage checker (V1-S2-005) | ✅ | Codex | Google Maps Routes API + UI status |
| Time slot picker (V1-S2-006) | ✅ | Codex | Saturday hourly windows + cutoff logic |
| Checkout stepper (V1-S2-007) | ✅ | Codex | Address → Time → Pay stepper UI |

**Task Files**: `docs/V1/tasks/V1-S2-*.md`

**Sprint 2 completion**: 7/7 (100%)

### Sprint 3: Payment + Confirmation (Week 3-4) - COMPLETE
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Stripe integration (V1-S3-001) | ✅ | Claude | Checkout Sessions API + order creation |
| Webhook handler (V1-S3-002) | ✅ | Claude | Signature verification + status updates |
| Order creation flow (V1-S3-003) | ✅ | Claude | Server-side totals + DB insertion |
| Confirmation page (V1-S3-004) | ✅ | Claude | Order details + cart clear |
| Order status page (V1-S3-005) | ✅ | Claude | Timeline component + order details |
| Order history page (V1-S3-006) | ✅ | Claude | Customer's orders list with cards |
| Email notifications (V1-S3-007) | ✅ | Claude | Supabase Edge Function + Resend |

**Sprint 3 completion**: 7/7 (100%)

### Sprint 4: Admin Basics (Week 4) - COMPLETE
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Admin layout + nav (V1-S4-001) | ✅ | Claude | Role-gated shell + collapsible nav |
| Menu item CRUD (V1-S4-002) | ✅ | Claude | List, toggle active/sold-out, delete |
| Category management (V1-S4-003) | ✅ | Claude | Reorder, activate, add/delete |
| Orders list view (V1-S4-004) | ✅ | Claude | Filter, sort, status update |
| Basic analytics (V1-S4-005) | ✅ | Claude | Stats cards, revenue chart, popular items |

**Sprint 4 completion**: 5/5 (100%)

### V1 Acceptance Criteria
- [x] Customer can browse full menu by category
- [x] Customer can search menu items
- [x] Customer can view item details + modifiers
- [x] Customer can add items to cart with modifiers
- [x] Customer can manage cart (update qty, remove)
- [x] Customer can save/select delivery address
- [x] Coverage validation blocks out-of-range addresses
- [x] Customer can select Saturday time window
- [x] Cutoff logic prevents late orders for current Saturday
- [x] Stripe Checkout completes payment
- [x] Webhook updates order to paid/confirmed
- [x] Order confirmation displays correctly
- [x] Customer can view order history
- [x] Admin can CRUD menu items
- [x] Admin can manage categories (reorder, activate)
- [x] Admin can view/manage orders
- [x] Admin has analytics dashboard
- [x] Mobile-responsive across all flows
- [x] E2E test covers happy path

### V1 Test Coverage Requirements
- [x] Unit: Subtotal calculation with modifiers (`src/lib/utils/__tests__/order.test.ts`)
- [x] Unit: Delivery fee threshold ($100) (`src/lib/utils/__tests__/order.test.ts`)
- [x] Unit: Cutoff date calculation (`src/lib/utils/__tests__/delivery-dates.test.ts`)
- [x] Unit: Coverage validation logic (`src/lib/services/__tests__/coverage.test.ts`)
- [x] Integration: Checkout session validation (`src/app/api/checkout/session/__tests__/route.test.ts`)
- [x] Integration: Webhook processing (`src/app/api/webhooks/stripe/__tests__/route.test.ts`)
- [x] E2E: Browse → Cart → Checkout → Confirm (`e2e/happy-path.spec.ts`)

---

## 🚧 V2: Driver Ops + Tracking (In Progress)

### Sprint 1: Admin Route Management (Complete)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| V2 Database migration | ✅ | Claude | drivers, routes, route_stops, location_updates, delivery_exceptions |
| V2 Type definitions | ✅ | Claude | Driver, Route, RouteStop, LocationUpdate, DeliveryException types |
| Driver management API | ✅ | Claude | CRUD + activate/deactivate endpoints |
| Driver management UI | ✅ | Claude | Premium table with search, filter, modal |
| Route management API | ✅ | Claude | CRUD + stop management endpoints |
| Route management UI | ✅ | Claude | Route list, create modal, date filtering |
| Route optimization service | ✅ | Claude | Google Routes API + nearest-neighbor fallback |
| Sprint 1 tests | ✅ | Claude | 137 tests passing |

**Sprint 1 completion**: 8/8 (100%)

### Sprint 2: Driver Mobile Interface (Complete)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Driver auth + layout | ✅ | Claude | Driver role check, protected routes, bottom nav |
| Driver mobile API | ✅ | Claude | Route view, stop status, location updates, photo upload, exceptions |
| Driver mobile UI | ✅ | Claude | PWA route view, stop cards, delivery actions, photo capture |
| GPS tracking service | ✅ | Claude | Background location with adaptive intervals |
| Offline support | ✅ | Claude | IndexedDB queue, service worker, offline sync |
| History page | ✅ | Claude | Past routes with delivery stats |

**Sprint 2 completion**: 6/6 (100%)

### Sprint 3: Customer Tracking (Planned)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Tracking API | 📋 | - | Order tracking endpoint |
| Real-time subscriptions | 📋 | - | Supabase Realtime |
| Tracking page UI | 📋 | - | Live map, ETA, timeline |

### Sprint 4: Polish (Planned)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Delivery exceptions | 📋 | - | Can't deliver flow |
| SMS notifications | 📋 | - | Twilio integration |
| Analytics enhancements | 📋 | - | Driver performance, delivery metrics |

### V2 Acceptance Criteria
- [x] Admin can create delivery routes for Saturday
- [x] Admin can assign orders to routes
- [x] Driver can view assigned route + stops
- [x] Driver can update stop status (enroute/arrived/delivered)
- [x] Driver location updates (adaptive intervals: 2-10 min)
- [ ] Customer sees live map when order is out_for_delivery
- [ ] Customer sees ETA band on tracking page
- [x] Driver can capture delivery photo
- [ ] Customer receives SMS when order is dispatched
- [x] Route optimization suggests stop order

---

## ðŸ’­ V3: Scale + Polish (Future)

### Potential Features
- Multiple payment methods (saved cards)
- Subscription/recurring orders
- Loyalty program / rewards
- Referral system
- Multi-language support (full Burmese UI)
- Gift cards
- Catering / bulk orders
- Kitchen display system (KDS)
- Inventory management
- Advanced analytics dashboard
- A/B testing framework

---

## ðŸš§ Known Issues / Tech Debt

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| None yet | - | - | V0 just completed |

---

## ðŸ“ Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-01-13 | Stripe Checkout Sessions over custom forms | Lower PCI scope, faster to ship | Active |
| 2026-01-13 | Zustand for cart state | Lightweight, no context boilerplate | Active |
| 2026-01-13 | React Query for server state | Caching, optimistic updates, refetch | Active |
| 2026-01-13 | Saturday-only delivery (V1) | Simplify scheduling, match kitchen ops | Active |
| 2026-01-13 | Single kitchen origin | No multi-location complexity in V1 | Active |

---

## ðŸ”® Open Questions

| Question | Context | Status |
|----------|---------|--------|
| Tax calculation approach? | Fixed rate vs Stripe Tax vs external service | Defer to V1.1 |
| Tip handling in UI? | Before or after payment? Editable? | Defer to V1.1 |
| Refund policy details? | Cutoff rules, partial refunds | Needs business input |
| Image hosting? | Supabase Storage vs CDN (Cloudinary) | Decide in Sprint 1 |

---

## 📈 Velocity Tracking

| Sprint | Planned | Completed | Notes |
|--------|---------|-----------|-------|
| V0 | 15 tasks | 15 tasks | Foundation complete |
| V1 S1 | 6 tasks | 6 tasks | Menu data layer + category tabs + item card + menu grid + menu search + item detail modal |
| V1 S2 | 7 tasks | 7 tasks | Cart state + drawer + summary + address management + coverage checker + time slot picker + checkout stepper |
| V1 S3 | 7 tasks | 7 tasks | Stripe integration + webhook handler + order creation + confirmation page + order status + order history + email notifications |
| V1 S4 | 5 tasks | 5 tasks | Admin layout + menu CRUD + category management + orders list + analytics dashboard |
| V2 S1 | 8 tasks | 8 tasks | Driver/route management APIs + UIs, route optimization (137 tests) |
| V2 S2 | 6 tasks | 6 tasks | Driver mobile PWA, GPS tracking, photo upload, offline sync (145+ tests) |

## 🧪 Test Coverage Summary

| Area | Tests | Status |
|------|-------|--------|
| V1 Unit Tests | 128 | ✅ Passing |
| V2 S1 Tests | 137 | ✅ Passing |
| V2 S2 Tests | 145+ | ✅ Passing |
| E2E Tests (Playwright) | 3+ | ✅ Passing |
| **Total** | **410+** | ✅ All Passing |

