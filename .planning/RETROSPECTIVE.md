# Project Retrospectives

## Milestone: v2.1 — Route Operations & Admin Mobile

**Shipped:** 2026-03-17
**Phases:** 5 | **Plans:** 22 | **Requirements:** 18/18

### What Was Built
- Role-based auth redirect with error-indicating paths (admin/driver/customer → correct dashboard)
- Order detail completeness: items/modifiers, contact (click-to-call/SMS), payment, tip, delivery notes on one screen
- Full route editing suite: drag-reorder (desktop DnD + mobile move buttons), split, merge, driver reassignment
- Driver accept/decline flow: 5-status lifecycle, decline with reason, email alert, admin auto-transition
- Admin mobile UX: drawer navigation, 6 table-to-card conversions, 44px touch targets, route progress widget
- Phase 103 gap closure: 19 structural gaps closed (error handling, barrel exports, dead code, tests, Nyquist)

### What Worked
- **Wave-based parallel execution** — 3 gap closure plans (Phase 103) ran in parallel, completing in ~20 minutes vs ~60 sequential
- **@dnd-kit as generic DragReorderList** — built once in Phase 100, reused in Phase 101 ActiveRouteView with zero modifications
- **Strategy B (dual render) for mobile/desktop** — md:hidden/hidden md:block is zero-JS, instant, no layout shift
- **Audit → gap closure → re-audit cycle** — first audit (tech_debt, 5 items) → Phase 103 fix → second audit (passed) provided clean completion
- **3-day execution** — 5 phases, 22 plans, 43 tasks in 3 days with clear dependency ordering
- **Nyquist validation** — catching test stubs early (Wave 0 scaffolds) and filling them in Phase 103 ensured test quality

### What Was Inefficient
- **Phase 103 needed for tech debt** — 19 gaps found after 4 feature phases. Still ~25% overhead for cleanup (1 gap closure phase per 4 feature phases), but improved from v1.9's 50%
- **SUMMARY frontmatter extraction still fragile** — `summary-extract` returned empty for `one_liner` and `task_count` fields; had to grep frontmatter directly
- **area_description wiring missed until audit** — driver page query didn't include it; AcceptDeclineCard accepted it as prop but never received it. Integration checker caught this
- **OrderDetailPanel composed wrapper orphaned** — P99 SUMMARY stated "for Phase 100 route detail embedding" but P100 never embedded it. Subcomponents used directly instead

### Patterns Established
- 5-status route lifecycle (planned→assigned→accepted→in_progress→completed) with admin auto-transition
- after() for fire-and-forget email in API routes (decline email, consistent with v1.9)
- Drawer with useRouteChangeClose for mobile navigation auto-dismiss
- useRouteProgressPolling with 5s setInterval + isMountedRef guard for safe unmount
- shouldAnimate guard pattern for reduced-motion across all Framer Motion animations
- Two-param handleReorder pattern: (reorderedStops, previousStops) for correct optimistic revert

### Key Lessons
1. **Integration checker is the highest-value audit agent** — caught orphaned exports and unwired props that phase-level verification missed
2. **Barrel exports without consumers are dead code** — Phase 103 added orders barrel, but OrderDetailPanel wrapper is still uncalled. Barrels must have imports.
3. **Mobile-first responsive is cheaper upfront** — Phase 102's card conversions (6 tables) would have been simpler if built mobile-first in the original phases
4. **Wave 0 test scaffolds (test.skip stubs) work** — they create placeholders that Nyquist validation catches; filling them in Phase 103 ensures nothing is forgotten
5. **Gap closure phases are fast** — Phase 103 (19 gaps, 6 files per plan) executed in ~45 minutes because code existed; just needed fixes and wiring

### Cost Observations
- Model mix: ~75% opus, ~25% sonnet (sonnet for verifier, integration checker, and test runner agents)
- Sessions: ~4 sessions across 3 days
- Notable: Phase 103 parallel execution (3 agents) was the most cost-efficient pattern — each agent had fresh context, zero coordination overhead

---

## Milestone: v1.9 — Launch-Ready MVP

**Shipped:** 2026-03-03
**Phases:** 12 | **Plans:** 38 | **Requirements:** 49/49

### What Was Built
- Critical bug fixes (TOCTOU, cutoff, cart race, modifiers, refunds)
- Configurable business rules via admin settings (no deploy needed)
- Saturday Ops Dashboard with bulk operations and countdown timers
- Route & Driver Assignment with Leaflet map and geographic clustering
- Customer delivery gate (dynamic hero, menu banner, cart countdown, cutoff modal)
- Email reliability (webhook verification, retry, admin dashboard)
- Driver simple mode (2-tab nav, SimpleStopView, offline overlay)
- Production hardening (5 indexes, rate limits, N+1 fix, pagination)
- 4 gap closure phases (verification + integration + code fixes)

### What Worked
- **Zero new npm packages** — entire milestone used existing dependencies, keeping bundle stable
- **Dependency-driven phase ordering** — bugs → rules → ops → routes → gate → email/driver → hardening created clean build-up
- **Gap closure via audit** — 4 additional phases (85-88) caught verification gaps, integration holes, and code-level issues that core phases missed
- **Server-side simple_mode** — DB column over localStorage was the right call for cross-device persistence
- **Sequential PATCH with 100ms delay** — simple approach to bulk ops that avoided rate limiting without complexity
- **3-day execution** — 12 phases in 3 days, enabled by clear requirements and parallel-capable phases

### What Was Inefficient
- **Core 8 phases needed 4 gap closure phases** — 50% overhead for verification and integration fixes
- **SUMMARY frontmatter inconsistencies** — several phases had missing `one_liner` and `requirements-completed` fields, requiring cleanup in Phase 86
- **Phase 82 had duplicate directory naming** — `82-email-reliability` appeared in different session contexts, leading to duplicate decisions in STATE.md
- **ROADMAP.md progress table had formatting drift** — columns shifted, milestone labels inconsistent across rows
- **Audit status remained `gaps_found` after gap closure** — no mechanism to update audit status post-remediation

### Patterns Established
- Trigger-based computed columns (refund_status) for data integrity
- unstable_cache + revalidateTag pattern for admin-configurable settings
- Pure function + hook separation pattern for testability (computeDeliveryGate, computeCountdown)
- Client wrapper pattern (DriverHomeSwitch, DriverRouteSwitch) for server-to-client mode branching
- Sequential PATCH with delay for bulk operations (avoids rate limiting)
- DB-backed boolean column for UI mode switching (simple_mode)

### Key Lessons
1. **Plan for verification phases upfront** — 8 core phases → 4 gap closure is predictable; budget 30-50% overhead for verification and integration
2. **Audit before completing, not after** — the v1.9 audit caught gaps early enough to fix; running it post-ship would have left gaps in production
3. **SUMMARY frontmatter discipline matters** — missing fields compound into cleanup work; enforce at write time
4. **Integration checks are more valuable than existence checks** — "is this wired?" beats "does this file exist?" every time
5. **Zero-dep discipline pays off** — no new packages means no new bundle bloat, no new vulnerability surface, no new API to learn

### Cost Observations
- Model mix: ~80% opus, ~20% sonnet (sonnet for verification/checker agents)
- Sessions: ~6 sessions across 3 days
- Notable: Gap closure phases were fast (5-10 min each) because code existed — just needed verification and wiring

---

## v1.8 Gap Closure (2026-02-26)

### What Was Built

- 2 gap closure phases (75-76), 2 plans
- Phase 75: Wired test-delivery href in OnboardingWalkthroughCard (DPROF-05), confirmed SEC-02 CSP unsafe-eval is intentional for Google Maps
- Phase 76: Wired BlockedDateChips into driver schedule page (DDASH-07), fixed stale closure bug in availability state

### What Worked

- **Milestone audit correctly identified gaps** — the audit found 3 requirements (SEC-02, DPROF-05, DDASH-07) that passed phase-level verification but had integration-level issues
- **Pre-built components just needed wiring** — BlockedDateChips and the test-delivery page were fully built and tested; they just needed to be connected to their consuming pages
- **Fast closure** — both phases completed in <1 day because the components existed; only wiring was needed

### What Was Inefficient

- **Original phases should have caught these wiring gaps** — Phases 73 and 74 built BlockedDateChips and the test-delivery page but never verified they were actually rendered/reachable from the UI
- **Phase verification checked existence, not integration** — the VERIFICATION.md process confirmed components existed and exported correctly, but did not check that they were imported and rendered somewhere
- **3/8 phases had no VERIFICATION.md** — Phases 67, 71, and 74 skipped verification entirely

### Patterns

- Pre-built components need integration testing, not just unit verification
- Barrel exports (index.tsx) can create false confidence — a component exported from a barrel but never imported elsewhere is dead code
- href: null in configuration objects is a silent failure mode — should be caught by lint or integration check
- E2E flow testing (not just per-component testing) is the only way to catch navigation gaps

### Key Lessons

- **Milestone audit is essential** — caught 3 gaps that per-phase verification missed
- **Integration checking > existence checking** — "does this component exist?" is necessary but insufficient; "is this component reachable by users?" is the real question
- **Silent failures accumulate** — try/catch with silent fallback (like the increment_driver_deliveries RPC) and href: null both hide problems until an audit surfaces them
- **Gap closure is cheap when components are pre-built** — the 2 phases took <1 day vs 3 days for the original 8 phases
