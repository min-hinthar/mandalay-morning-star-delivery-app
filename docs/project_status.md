# Project Status - Mandalay Morning Star

> **Last Updated**: 2026-01-13  
> **Current Phase**: Scaffold  
> **Current Milestone**: V0 (Skeleton) - In Progress

---

## Quick Status

| Area | Status | Notes |
|------|--------|-------|
| ?? Planning | ? Complete | Spec doc finalized |
| ??? Scaffold | ? Complete | Base scaffold in place |
| ?? Auth | ? Pending | Supabase setup required |
| ??? Coverage | ? Pending | Google Maps API key needed |
| ?? Menu UI | ? Pending | Depends on scaffold |
| ?? Cart | ? Pending | V1 scope |
| ?? Checkout | ? Pending | V1 scope |
| ????? Admin | ? Pending | V2 scope |
| ?? Delivery | ? Pending | V2 scope |

---

## Milestone Progress

### V0 - Skeleton (30% Complete)

| Task | Status | Owner | PR |
|------|--------|-------|-----|
| Project scaffold | ? Done | Codex | - |
| Supabase project setup | ? | - | - |
| Database migrations (base) | ? Done | Codex | - |
| Supabase Auth integration | ? | Codex | - |
| Profile creation trigger | ? Done | Codex | - |
| RLS policies (profiles, addresses) | ? | Codex | - |
| Google Maps API setup | ? | - | - |
| Coverage check endpoint | ? | Codex | - |
| Coverage UI component | ? | Codex | - |
| Menu data model + seed import | ? | Codex | - |
| Menu browse page | ? | Codex | - |
| Category tabs + sticky header | ? | Codex | - |
| Item cards grid | ? | Codex | - |
| Mobile responsive testing | ? | Codex | - |
| CI pipeline (lint/typecheck/build) | ? Done | Codex | - |

**V0 Exit Criteria**:
- [ ] User can sign up with email
- [ ] User can check if address is deliverable
- [ ] User can browse full menu on mobile
- [ ] RLS prevents cross-user data access
- [ ] CI passes on all PRs

---

### V1 - Ordering Core (0% Complete)

| Task | Status | Owner | PR |
|------|--------|-------|-----|
| Cart store (Zustand) | ? | Codex | - |
| Item detail modal | ? | Codex | - |
| Modifier selection UI | ? | Codex | - |
| Cart drawer component | ? | Codex | - |
| Delivery fee threshold logic | ? | Codex | - |
| Address picker component | ? | Codex | - |
| Time window selector | ? | Codex | - |
| Checkout stepper flow | ? | Codex | - |
| Stripe Checkout integration | ? | Codex | - |
| Webhook handler | ? | Codex | - |
| Order confirmation page | ? | Codex | - |
| Order status page | ? | Codex | - |
| Order history list | ? | Codex | - |
| Cutoff enforcement | ? | Codex | - |
| Basic admin order list | ? | Codex | - |
| E2E tests (happy path) | ? | Codex | - |

**V1 Exit Criteria**:
- [ ] User can complete a paid order (Stripe test mode)
- [ ] Order appears in Supabase with correct status
- [ ] Admin can see order in dashboard
- [ ] Post-cutoff blocks editing
- [ ] Coverage validation blocks invalid addresses

---

### V2 - Ops-Ready (0% Complete)

| Task | Status | Owner | PR |
|------|--------|-------|-----|
| Admin order management | ? | Codex | - |
| Admin status updates | ? | Codex | - |
| Admin menu CRUD | ? | Codex | - |
| Admin sold-out toggle | ? | Codex | - |
| Admin refund flow | ? | Codex | - |
| Route planning UI | ? | Codex | - |
| Driver assignment | ? | Codex | - |
| Driver mobile view | ? | Codex | - |
| Driver stop status updates | ? | Codex | - |
| Driver location pings | ? | Codex | - |
| Real-time customer map | ? | Codex | - |
| ETA calculation | ? | Codex | - |
| Delivery photo capture | ? | Codex | - |

**V2 Exit Criteria**:
- [ ] Kitchen can fulfill orders from dashboard
- [ ] Driver can complete delivery route
- [ ] Customer sees real-time tracking

---

## Blockers & Risks

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| None currently | - | - | - |

---

## Decisions Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2026-01-12 | Project goal | Shipping MVP | Real business launch |
| 2026-01-12 | Mobile strategy | PWA | Faster than native; revisit V2 |
| 2026-01-12 | Tipping | V2 | Reduce V1 scope |
| 2026-01-12 | Tax handling | Fixed rate V1 | Simplicity; Stripe Tax V2 |

---

## Next Actions

1. **[Immediate]** Set up GitHub repository
2. **[Immediate]** Create Supabase project
3. **[Immediate]** Create Stripe test account
4. **[Immediate]** Get Google Maps API key

---

## Weekly Standup Notes

### Week 1 (2026-01-12)
- Project kickoff
- Spec document completed
- Scaffold baseline completed

---

*Updated by: Codex (Implementation) | Next review: After V0 scaffold*


