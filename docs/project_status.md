# docs/project_status.md — Milestone Tracking (v1.0)

> **Last Updated**: 2026-01-13
> **Current Phase**: V1 Development

---

## 📊 Milestone Overview

| Version | Status | Target | Focus |
|---------|--------|--------|-------|
| **V0** | ✅ Complete | - | Scaffold + Foundation |
| **V1** | 🔄 In Progress | Week 4 | Full Ordering Flow |
| **V2** | 📋 Planned | Week 8 | Driver Ops + Tracking |
| **V3** | 💭 Future | TBD | Scale + Polish |

---

## ✅ V0: Foundation (Complete)

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

## 🔄 V1: Core Ordering Flow (In Progress)

### Sprint 1: Menu Browse (Week 1-2)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Category tabs component | ⬜ | Codex | Sticky, horizontal scroll |
| Menu search component | ⬜ | Codex | Debounced, fuzzy match |
| Item card grid | ⬜ | Codex | Responsive, image + price |
| Item detail modal | ⬜ | Codex | Modifiers, qty, notes |
| Menu data hooks | ⬜ | Codex | React Query setup |
| Menu API routes | ⬜ | Codex | Public, cached |
| Menu seeding script | ⬜ | Codex | YAML → DB import |

**Task Files**: `docs/V1/tasks/V1-S1-*.md`

### Sprint 2: Cart + Checkout (Week 2-3)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Cart drawer component | ⬜ | Codex | Slide-over, mobile-first |
| Cart state (Zustand) | ⬜ | Codex | Add/update/remove/clear |
| Cart summary component | ⬜ | Codex | Subtotal + fee display |
| Address management | ⬜ | Codex | CRUD + validation |
| Coverage checker | ⬜ | Codex | Google Maps integration |
| Time slot picker | ⬜ | Codex | Saturday hourly windows |
| Checkout stepper | ⬜ | Codex | Address → Time → Pay |

### Sprint 3: Payment + Confirmation (Week 3-4)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Stripe integration | ⬜ | Codex | Checkout Sessions |
| Webhook handler | ⬜ | Codex | Signature verification |
| Order creation flow | ⬜ | Codex | Server-side totals |
| Confirmation page | ⬜ | Codex | Order details display |
| Order status page | ⬜ | Codex | Timeline component |
| Order history page | ⬜ | Codex | Customer's orders list |
| Email notifications | ⬜ | Codex | Confirmation email |

### Sprint 4: Admin Basics (Week 4)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Admin layout + nav | ⬜ | Codex | Role-gated shell |
| Menu item CRUD | ⬜ | Codex | Add/edit/delete items |
| Category management | ⬜ | Codex | Reorder, activate |
| Orders list view | ⬜ | Codex | Filter, status update |
| Basic analytics | ⬜ | Codex | Order count, revenue |

### V1 Acceptance Criteria
- [ ] Customer can browse full menu by category
- [ ] Customer can search menu items
- [ ] Customer can view item details + modifiers
- [ ] Customer can add items to cart with modifiers
- [ ] Customer can manage cart (update qty, remove)
- [ ] Customer can save/select delivery address
- [ ] Coverage validation blocks out-of-range addresses
- [ ] Customer can select Saturday time window
- [ ] Cutoff logic prevents late orders for current Saturday
- [ ] Stripe Checkout completes payment
- [ ] Webhook updates order to paid/confirmed
- [ ] Order confirmation displays correctly
- [ ] Customer can view order history
- [ ] Admin can CRUD menu items
- [ ] Admin can view/manage orders
- [ ] Mobile-responsive across all flows
- [ ] E2E test covers happy path

### V1 Test Coverage Requirements
- [ ] Unit: Subtotal calculation with modifiers
- [ ] Unit: Delivery fee threshold ($100)
- [ ] Unit: Cutoff date calculation
- [ ] Unit: Coverage validation logic
- [ ] Integration: Checkout session creation
- [ ] Integration: Webhook processing
- [ ] E2E: Browse → Cart → Checkout → Confirm

---

## 📋 V2: Driver Ops + Tracking (Planned)

### Features
| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Driver mobile interface | P0 | Medium | Route view, status updates |
| Route optimization | P0 | High | Google Routes API |
| Real-time location updates | P0 | Medium | Driver GPS → customer map |
| Customer order tracking | P0 | Medium | Live map + timeline |
| Admin route management | P1 | Medium | Assign orders to routes |
| Delivery proof (photo) | P1 | Medium | Driver captures photo |
| SMS notifications | P1 | Low | Twilio integration |
| Driver earnings dashboard | P2 | Low | Track deliveries + tips |

### V2 Acceptance Criteria
- [ ] Admin can create delivery routes for Saturday
- [ ] Admin can assign orders to routes
- [ ] Driver can view assigned route + stops
- [ ] Driver can update stop status (enroute/arrived/delivered)
- [ ] Driver location updates every 5 minutes
- [ ] Customer sees live map when order is out_for_delivery
- [ ] Customer sees ETA band on tracking page
- [ ] Driver can capture delivery photo
- [ ] Customer receives SMS when order is dispatched
- [ ] Route optimization suggests stop order

---

## 💭 V3: Scale + Polish (Future)

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

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| None yet | - | - | V0 just completed |

---

## 📝 Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-01-13 | Stripe Checkout Sessions over custom forms | Lower PCI scope, faster to ship | Active |
| 2026-01-13 | Zustand for cart state | Lightweight, no context boilerplate | Active |
| 2026-01-13 | React Query for server state | Caching, optimistic updates, refetch | Active |
| 2026-01-13 | Saturday-only delivery (V1) | Simplify scheduling, match kitchen ops | Active |
| 2026-01-13 | Single kitchen origin | No multi-location complexity in V1 | Active |

---

## 🔮 Open Questions

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
| V1 S1 | - | - | Starting |
| V1 S2 | - | - | - |
| V1 S3 | - | - | - |
| V1 S4 | - | - | - |
