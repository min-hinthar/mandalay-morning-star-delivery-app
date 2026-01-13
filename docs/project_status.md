# Project Status - Mandalay Morning Star

> **Last Updated**: 2026-01-13
> **Current Phase**: V0 Skeleton
> **Current Milestone**: V0 (Skeleton) - 50% Complete

---

## Quick Status

| Area | Status | Notes |
|------|--------|-------|
| ?? Planning | ? Complete | Spec doc finalized |
| ??? Scaffold | ? Complete | Base scaffold in place |
| ?? Auth | Done | Supabase auth flow implemented |
| ??? Coverage | ? Pending | Google Maps API key needed |
| ?? Menu UI | ? Pending | Depends on scaffold |
| ?? Cart | ? Pending | V1 scope |
| ?? Checkout | ? Pending | V1 scope |
| ????? Admin | ? Pending | V2 scope |
| ?? Delivery | ? Pending | V2 scope |

---

## Milestone Progress

### V0 - Skeleton (50% Complete)

| Task | Status | Owner | PR |
|------|--------|-------|-----|
| Project scaffold | Done | Codex | V0-001 |
| Supabase project setup | Pending | Manual | - |
| Database migrations (base) | Done | Codex | V0-002 |
| Supabase Auth integration | Done | Codex | V0-003 |
| Profile creation trigger | Done | Codex | V0-002 |
| RLS policies (profiles, addresses) | Done | Codex | - |
| Google Maps API setup | Pending | Manual | - |
| Coverage check endpoint | Pending | Codex | - |
| Coverage UI component | Pending | Codex | - |
| Menu data model + seed import | Pending | Codex | - |
| Menu browse page | Pending | Codex | - |
| Category tabs + sticky header | Pending | Codex | - |
| Item cards grid | Pending | Codex | - |
| Mobile responsive testing | Pending | Codex | - |
| CI pipeline (lint/typecheck/build) | Done | Codex | V0-001 |

**V0 Exit Criteria**:
- [x] User can sign up with email
- [ ] User can check if address is deliverable
- [ ] User can browse full menu on mobile
- [x] RLS prevents cross-user data access
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

1. **[V0-005]** Coverage checker (requires Google Maps API key)
2. **[V0-006]** Menu data model + seed import
3. **[V0-007]** Menu browse UI
4. **[External]** Get Google Maps API key (blocking V0-005)

---

## Weekly Standup Notes

### Week 1 (2026-01-12)
- Project kickoff
- Spec document completed
- Scaffold baseline completed (V0-001)
- Database schema defined (V0-002)

### Week 2 (2026-01-13)
- Supabase auth flow integrated (V0-003)
  - Login/signup/logout pages
  - Password reset flow
  - Protected routes with middleware
  - User menu in header

---

*Updated by: Claude (Review) | Next review: After V0-005 coverage checker*


