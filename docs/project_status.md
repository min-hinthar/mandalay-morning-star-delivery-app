# docs/project_status.md — Milestone Tracking (v2.1)

> **Last Updated**: 2026-01-15
> **Current Phase**: V3 In Progress - UX Redesign (Sprint 1: Foundation)

---

## ðŸ“Š Milestone Overview

| Version | Status         | Target | Focus                             |
| ------- | -------------- | ------ | --------------------------------- |
| **V0**  | ✅ Complete    | -      | Scaffold + Foundation             |
| **V1**  | ✅ Complete    | Week 4 | Full Ordering Flow                |
| **V2**  | ✅ Complete    | Week 8 | Driver Ops + Tracking + Analytics |
| **V3**  | 🔄 In Progress | -      | World-Class UX Redesign           |

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

| Task                          | Status | Owner | Notes                                 |
| ----------------------------- | ------ | ----- | ------------------------------------- |
| Menu data layer (V1-S1-001)   | ✅     | Codex | Types, API routes, React Query hooks  |
| Category tabs (V1-S1-002)     | ✅     | Codex | Sticky, horizontal scroll, scroll-spy |
| Item card (V1-S1-003)         | ✅     | Codex | Responsive card with image + price    |
| Menu grid (V1-S1-004)         | ✅     | Codex | Responsive grid layout                |
| Menu search (V1-S1-005)       | ✅     | Codex | Debounced, fuzzy match                |
| Item detail modal (V1-S1-006) | ✅     | Codex | Modifiers, qty, notes                 |

**Task Files**: `docs/V1/tasks/V1-S1-*.md`

**Sprint 1 completion**: 6/6 (100%)

### Sprint 2: Cart + Checkout (Week 2-3)

| Task                           | Status | Owner | Notes                                  |
| ------------------------------ | ------ | ----- | -------------------------------------- |
| Cart state (V1-S2-001)         | ✅     | Codex | Zustand store: add/update/remove/clear |
| Cart drawer (V1-S2-002)        | ✅     | Codex | Slide-over, mobile-first               |
| Cart summary (V1-S2-003)       | ✅     | Codex | Subtotal + fee display                 |
| Address management (V1-S2-004) | ✅     | Codex | CRUD + geocoding + validation          |
| Coverage checker (V1-S2-005)   | ✅     | Codex | Google Maps Routes API + UI status     |
| Time slot picker (V1-S2-006)   | ✅     | Codex | Saturday hourly windows + cutoff logic |
| Checkout stepper (V1-S2-007)   | ✅     | Codex | Address → Time → Pay stepper UI        |

**Task Files**: `docs/V1/tasks/V1-S2-*.md`

**Sprint 2 completion**: 7/7 (100%)

### Sprint 3: Payment + Confirmation (Week 3-4) - COMPLETE

| Task                            | Status | Owner  | Notes                                   |
| ------------------------------- | ------ | ------ | --------------------------------------- |
| Stripe integration (V1-S3-001)  | ✅     | Claude | Checkout Sessions API + order creation  |
| Webhook handler (V1-S3-002)     | ✅     | Claude | Signature verification + status updates |
| Order creation flow (V1-S3-003) | ✅     | Claude | Server-side totals + DB insertion       |
| Confirmation page (V1-S3-004)   | ✅     | Claude | Order details + cart clear              |
| Order status page (V1-S3-005)   | ✅     | Claude | Timeline component + order details      |
| Order history page (V1-S3-006)  | ✅     | Claude | Customer's orders list with cards       |
| Email notifications (V1-S3-007) | ✅     | Claude | Supabase Edge Function + Resend         |

**Sprint 3 completion**: 7/7 (100%)

### Sprint 4: Admin Basics (Week 4) - COMPLETE

| Task                            | Status | Owner  | Notes                                     |
| ------------------------------- | ------ | ------ | ----------------------------------------- |
| Admin layout + nav (V1-S4-001)  | ✅     | Claude | Role-gated shell + collapsible nav        |
| Menu item CRUD (V1-S4-002)      | ✅     | Claude | List, toggle active/sold-out, delete      |
| Category management (V1-S4-003) | ✅     | Claude | Reorder, activate, add/delete             |
| Orders list view (V1-S4-004)    | ✅     | Claude | Filter, sort, status update               |
| Basic analytics (V1-S4-005)     | ✅     | Claude | Stats cards, revenue chart, popular items |

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

| Task                       | Status | Owner  | Notes                                                               |
| -------------------------- | ------ | ------ | ------------------------------------------------------------------- |
| V2 Database migration      | ✅     | Claude | drivers, routes, route_stops, location_updates, delivery_exceptions |
| V2 Type definitions        | ✅     | Claude | Driver, Route, RouteStop, LocationUpdate, DeliveryException types   |
| Driver management API      | ✅     | Claude | CRUD + activate/deactivate endpoints                                |
| Driver management UI       | ✅     | Claude | Premium table with search, filter, modal                            |
| Route management API       | ✅     | Claude | CRUD + stop management endpoints                                    |
| Route management UI        | ✅     | Claude | Route list, create modal, date filtering                            |
| Route optimization service | ✅     | Claude | Google Routes API + nearest-neighbor fallback                       |
| Sprint 1 tests             | ✅     | Claude | 137 tests passing                                                   |

**Sprint 1 completion**: 8/8 (100%)

### Sprint 2: Driver Mobile Interface (Complete)

| Task                 | Status | Owner  | Notes                                                               |
| -------------------- | ------ | ------ | ------------------------------------------------------------------- |
| Driver auth + layout | ✅     | Claude | Driver role check, protected routes, bottom nav                     |
| Driver mobile API    | ✅     | Claude | Route view, stop status, location updates, photo upload, exceptions |
| Driver mobile UI     | ✅     | Claude | PWA route view, stop cards, delivery actions, photo capture         |
| GPS tracking service | ✅     | Claude | Background location with adaptive intervals                         |
| Offline support      | ✅     | Claude | IndexedDB queue, service worker, offline sync                       |
| History page         | ✅     | Claude | Past routes with delivery stats                                     |

**Sprint 2 completion**: 6/6 (100%)

### Sprint 3: Customer Tracking (Complete)

| Task                        | Status | Owner  | Notes                                                                             |
| --------------------------- | ------ | ------ | --------------------------------------------------------------------------------- |
| Tracking types + validation | ✅     | Claude | `src/types/tracking.ts`, Zod schemas                                              |
| ETA calculation utility     | ✅     | Claude | Haversine distance + stop buffer (29 tests)                                       |
| Tracking API                | ✅     | Claude | GET `/api/tracking/{orderId}` (36 tests)                                          |
| Realtime subscription hook  | ✅     | Claude | Supabase Realtime + polling fallback (18 tests)                                   |
| Tracking UI components      | ✅     | Claude | StatusTimeline, ETADisplay, DeliveryMap, DriverCard, OrderSummary, SupportActions |
| Tracking page               | ✅     | Claude | `/orders/[id]/tracking` with live updates                                         |
| E2E tests                   | ✅     | Claude | Authentication + page structure tests                                             |

**Sprint 3 completion**: 7/7 (100%)

### Sprint 4: Analytics & Notifications (Complete)

| Task                              | Status | Owner  | Notes                                                      |
| --------------------------------- | ------ | ------ | ---------------------------------------------------------- |
| Analytics database migration      | ✅     | Claude | notification_logs, driver_ratings, materialized views      |
| Analytics type definitions        | ✅     | Claude | `src/types/analytics.ts` with DriverStats, DeliveryMetrics |
| Validation schemas + tests        | ✅     | Claude | Zod schemas with 15 unit tests                             |
| Email notifications Edge Function | ✅     | Claude | out_for_delivery, arriving_soon, delivered templates       |
| Driver analytics API              | ✅     | Claude | `/api/admin/analytics/drivers` + individual stats          |
| Delivery metrics API              | ✅     | Claude | `/api/admin/analytics/delivery` with trends                |
| Customer rating API               | ✅     | Claude | `/api/orders/[orderId]/rating`                             |
| Animated UI components            | ✅     | Claude | AnimatedCounter, MetricCard, charts (Recharts)             |
| Driver analytics dashboard        | ✅     | Claude | `/admin/analytics/drivers` with leaderboard                |
| Delivery metrics dashboard        | ✅     | Claude | `/admin/analytics/delivery` with KPIs                      |
| Customer feedback UI              | ✅     | Claude | `/orders/[id]/feedback` with star rating                   |
| E2E tests                         | ✅     | Claude | Admin analytics + customer feedback specs                  |

**Sprint 4 completion**: 12/12 (100%)

### V2 Acceptance Criteria

- [x] Admin can create delivery routes for Saturday
- [x] Admin can assign orders to routes
- [x] Driver can view assigned route + stops
- [x] Driver can update stop status (enroute/arrived/delivered)
- [x] Driver location updates (adaptive intervals: 2-10 min)
- [x] Customer sees live map when order is out_for_delivery
- [x] Customer sees ETA band on tracking page
- [x] Driver can capture delivery photo
- [x] Email notifications for delivery status (out_for_delivery, arriving_soon, delivered)
- [x] Route optimization suggests stop order
- [x] Driver performance analytics dashboard
- [x] Delivery metrics dashboard with trends
- [x] Customer can rate delivery (1-5 stars + feedback)

---

## 🎨 V3: World-Class UX Redesign (In Progress)

> **Goal**: Transform Mandalay Morning Star into a world-class food ordering experience
> **Status**: UX Pipeline Complete → Build Tasks Defined → P1-Foundation Assets Finalized

### V3 UX Pipeline (Complete)

| Phase                | Skill          | Status      | Output                                                   |
| -------------------- | -------------- | ----------- | -------------------------------------------------------- |
| 1. PRD Generation    | `/mvp-prd`     | ✅ Complete | `docs/V3/UX-Specs/PRD.md`                                |
| 2. PRD Clarification | `/prd-clarify` | ✅ Complete | `docs/V3/UX-Specs/PRD-clarification-session.md` (35 Q&A) |
| 3. UX Specification  | `/prd-ux`      | ✅ Complete | `docs/V3/UX-Specs/UX-Specs.md` (6-pass design)           |
| 4. Build Prompts     | `/ux-prompts`  | ✅ Complete | `docs/V3/UX-Specs/UX-Prompts.md` (35 prompts)            |

### V3 Build Sprints

| Sprint   | Focus                | Tasks | Status         |
| -------- | -------------------- | ----- | -------------- |
| Sprint 1 | Foundation & Layout  | 7     | 🔄 In Progress |
| Sprint 2 | Base UI Components   | 6     | ⬜ Not Started |
| Sprint 3 | Cart & Checkout      | 5     | ⬜ Not Started |
| Sprint 4 | Tracking & Driver    | 3     | ⬜ Not Started |
| Sprint 5 | Admin & Interactions | 6     | ⬜ Not Started |
| Sprint 6 | States & Polish      | 8     | ⬜ Not Started |

**Build Task Files**: `docs/V3/UX-Specs/build-tasks/Sprint-*.md`

### P1-Foundation UI Assets (Finalized)

| Asset            | Description                        | Location                                              |
| ---------------- | ---------------------------------- | ----------------------------------------------------- |
| Light Theme      | Design tokens + component showcase | `docs/V3/UI-Assets/P1-Foundation/Light-Theme.md`      |
| Dark Theme       | Dark mode color palette            | `docs/V3/UI-Assets/P1-Foundation/Dark-Theme.md`       |
| Vibrant Heritage | Alternate warm palette option      | `docs/V3/UI-Assets/P1-Foundation/Vibrant-Heritage.md` |

**Screenshots**: `.png` files alongside each design document

### V3 Design System (Finalized from UI Assets)

```css
/* Brand Colors (from finalized assets) */
--primary: #9B1B1E;           /* Bold Red from logo */
--cta: #F4D03F;               /* Bright Gold from logo */
--curry: #8B4513;             /* Warm brown accent */
--jade: #2E8B57;              /* Success green */
--cream: #FFFEF7;             /* Light background */
--charcoal: #1A1A1A;          /* Primary text */
--background-dark: #1a0505;   /* Dark mode background */

/* Typography */
Display: "Manrope" (sans-serif, bold headings)
Serif: "Playfair Display" (elegant accents)
Body: "DM Sans" (readable, geometric)
Burmese: "Padauk" (Myanmar script)
```

### V3 Acceptance Criteria (Pending)

- [ ] Customer can browse menu in under 90 seconds
- [ ] Mobile-first responsive design
- [ ] Warm, premium Burmese aesthetic (not generic AI slop)
- [ ] Dark mode with warm undertones
- [ ] WCAG 2.1 AA accessibility
- [ ] Rich animations with Framer Motion
- [ ] Driver high-contrast mode for sunlight

---

## 💭 Future Enhancements (Post-V3)

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

## 🚧 Known Issues / Tech Debt

| Issue                                  | Severity | Status   | Notes                                                                    |
| -------------------------------------- | -------- | -------- | ------------------------------------------------------------------------ |
| ~~Middleware deprecation warning~~     | Low      | ✅ Fixed | Migrated `middleware.ts` → `proxy.ts` for Next.js 16                     |
| ~~Supabase profiles policy recursion~~ | High     | ✅ Fixed | Created `public.is_admin()` SECURITY DEFINER function to avoid recursion |
| ~~Function search_path mutable~~       | High     | ✅ Fixed | All SECURITY DEFINER functions now have `SET search_path = public`       |
| ~~Materialized views public access~~   | Medium   | ✅ Fixed | Revoked public SELECT, created admin-only wrapper functions              |

## 🛡️ Database Security & Testing

### Migration Structure (Reorganized 2026-01-16)

| File                         | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `000_initial_schema.sql`     | Tables, enums, all FK indexes           |
| `001_functions_triggers.sql` | Helper functions, triggers, role checks |
| `002_rls_policies.sql`       | All RLS policies (optimized)            |
| `003_analytics.sql`          | Materialized views, admin wrappers      |
| `004_storage.sql`            | Storage buckets, upload policies        |
| `005_testing.sql`            | pgTAP, plpgsql_check, lint helpers      |

### Supabase Linter Compliance (All Fixed)

| Lint | Issue                        | Fix                             | Status |
| ---- | ---------------------------- | ------------------------------- | ------ |
| 0001 | Unindexed foreign keys       | Added 6 missing FK indexes      | ✅     |
| 0003 | Auth RLS initplan            | `(select auth.uid())` pattern   | ✅     |
| 0005 | Unused indexes               | Audited, none found             | ✅     |
| 0006 | Multiple permissive policies | Consolidated with OR conditions | ✅     |

### Security Measures (Implemented)

| Measure                                    | Status | Migration                    |
| ------------------------------------------ | ------ | ---------------------------- |
| RLS enabled on all tables                  | ✅     | `002_rls_policies.sql`       |
| Admin role checks via SECURITY DEFINER     | ✅     | `001_functions_triggers.sql` |
| Immutable search_path on all functions     | ✅     | `001_functions_triggers.sql` |
| Materialized views restricted to admin     | ✅     | `003_analytics.sql`          |
| FK columns indexed for JOIN performance    | ✅     | `000_initial_schema.sql`     |
| Auth initplan optimization in all policies | ✅     | `002_rls_policies.sql`       |

### Database Testing Infrastructure

| Tool           | Purpose                      | Status        |
| -------------- | ---------------------------- | ------------- |
| plpgsql_check  | Static analysis for PL/pgSQL | ✅ Enabled    |
| pgTAP          | Unit testing framework       | ✅ Enabled    |
| CI Integration | Automated testing on PR      | ✅ Configured |

### Testing Helper Functions (in `testing` schema)

| Function                                       | Purpose                             |
| ---------------------------------------------- | ----------------------------------- |
| `testing.lint_all_functions()`                 | Run plpgsql_check on all functions  |
| `testing.lint_function(name)`                  | Lint a specific function            |
| `testing.check_function_search_paths()`        | Audit SECURITY DEFINER functions    |
| `testing.check_rls_enabled()`                  | Verify RLS on all tables            |
| `testing.check_unindexed_foreign_keys()`       | Find missing FK indexes (lint 0001) |
| `testing.check_multiple_permissive_policies()` | Find policy conflicts (lint 0006)   |

### pgTAP Test Coverage

| Test File                        | Tests  | Focus                           |
| -------------------------------- | ------ | ------------------------------- |
| `00_rls_policies.test.sql`       | 20     | RLS enablement verification     |
| `01_function_security.test.sql`  | 15     | Function security & search_path |
| `02_materialized_views.test.sql` | 8      | Access control verification     |
| **Total**                        | **43** | Database security               |

---

## ðŸ“ Decision Log

| Date       | Decision                                   | Rationale                              | Status |
| ---------- | ------------------------------------------ | -------------------------------------- | ------ |
| 2026-01-13 | Stripe Checkout Sessions over custom forms | Lower PCI scope, faster to ship        | Active |
| 2026-01-13 | Zustand for cart state                     | Lightweight, no context boilerplate    | Active |
| 2026-01-13 | React Query for server state               | Caching, optimistic updates, refetch   | Active |
| 2026-01-13 | Saturday-only delivery (V1)                | Simplify scheduling, match kitchen ops | Active |
| 2026-01-13 | Single kitchen origin                      | No multi-location complexity in V1     | Active |

---

## ðŸ”® Open Questions

| Question                  | Context                                      | Status               |
| ------------------------- | -------------------------------------------- | -------------------- |
| Tax calculation approach? | Fixed rate vs Stripe Tax vs external service | Defer to V1.1        |
| Tip handling in UI?       | Before or after payment? Editable?           | Defer to V1.1        |
| Refund policy details?    | Cutoff rules, partial refunds                | Needs business input |
| Image hosting?            | Supabase Storage vs CDN (Cloudinary)         | Decide in Sprint 1   |

---

## 📈 Velocity Tracking

| Sprint | Planned  | Completed | Notes                                                                                                                          |
| ------ | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| V0     | 15 tasks | 15 tasks  | Foundation complete                                                                                                            |
| V1 S1  | 6 tasks  | 6 tasks   | Menu data layer + category tabs + item card + menu grid + menu search + item detail modal                                      |
| V1 S2  | 7 tasks  | 7 tasks   | Cart state + drawer + summary + address management + coverage checker + time slot picker + checkout stepper                    |
| V1 S3  | 7 tasks  | 7 tasks   | Stripe integration + webhook handler + order creation + confirmation page + order status + order history + email notifications |
| V1 S4  | 5 tasks  | 5 tasks   | Admin layout + menu CRUD + category management + orders list + analytics dashboard                                             |
| V2 S1  | 8 tasks  | 8 tasks   | Driver/route management APIs + UIs, route optimization (137 tests)                                                             |
| V2 S2  | 6 tasks  | 6 tasks   | Driver mobile PWA, GPS tracking, photo upload, offline sync (145+ tests)                                                       |
| V2 S3  | 7 tasks  | 7 tasks   | Customer tracking API, Realtime subscriptions, tracking page UI (83 tests)                                                     |
| V2 S4  | 12 tasks | 12 tasks  | Analytics dashboards, email notifications, customer ratings (86 tests)                                                         |

## 🧪 Test Coverage Summary

| Area                   | Tests                    | Status         |
| ---------------------- | ------------------------ | -------------- |
| V1 Unit Tests          | 128                      | ✅ Passing     |
| V2 S1 Tests            | 137                      | ✅ Passing     |
| V2 S2 Tests            | 145+                     | ✅ Passing     |
| V2 S3 Tests            | 83                       | ✅ Passing     |
| V2 S4 Tests            | 86                       | ✅ Passing     |
| E2E Tests (Playwright) | 6 specs                  | ✅ Passing     |
| **Total**              | **346 unit/integration** | ✅ All Passing |

### Sprint 4 Test Breakdown

- Analytics validation schemas: 15 tests
- Driver analytics API: 12 tests
- Delivery metrics API: 10 tests
- Rating API: 9 tests
- Analytics helpers: 20 tests
- Notification utilities: 20 tests
