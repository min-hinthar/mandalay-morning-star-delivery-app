# Roadmap: Morning Star V8 UI Rewrite

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-23)
- v1.1 Tech Debt Cleanup - Phases 9-14 (shipped 2026-01-23)
- v1.2 Playful UI Overhaul - Phases 15-24 (shipped 2026-01-27)
- v1.3 Full Codebase Consolidation - Phases 25-34 (shipped 2026-01-28)
- v1.4 Mobile Excellence - Phases 35-39 (shipped 2026-02-05)
- **v1.5 Performance & Repo Health - Phases 40-46 (active)**

## Current Status

**Current milestone:** v1.5 Performance & Repo Health
**Primary Goal:** LCP < 2.5s (from current 8.1s)
**Secondary Goals:** Repo cleanup, large file refactoring

**See full details:** `.planning/milestones/v1.5-ROADMAP.md`

**Phases:**
- [x] Phase 40: LCP Element Quick Wins (43-46% LCP reduction) - **3 plans**
  - [x] 40-01-PLAN.md - Baseline measurement and LCP identification
  - [x] 40-02-PLAN.md - CardImage conversion to Next.js Image
  - [x] 40-03-PLAN.md - Final measurement and verification
- [x] Phase 41: Server Component Conversions (infrastructure + audit + pragmatic conversions) - **7 plans**
  - [x] 41-01-PLAN.md — Loading/error infrastructure + hydration test setup
  - [x] 41-02-PLAN.md — Full 'use client' audit (275 files)
  - [x] 41-03-PLAN.md — Analytics page loading/error files
  - [x] 41-04-PLAN.md — Menu page server component conversion
  - [x] 41-05-PLAN.md — Home page server component conversion
  - [x] 41-06-PLAN.md — Order tracking page optimization
  - [x] 41-07-PLAN.md — Final hydration health check + results
- [ ] Phase 42: Dynamic Import Heavy Libraries (code-split Recharts + Google Maps) - **3 plans**
  - [ ] 42-01-PLAN.md — Shared hooks (viewport trigger, import retry) + skeleton/error components
  - [ ] 42-02-PLAN.md — Enhanced LazyCharts + admin dashboard RevenueChart wiring
  - [ ] 42-03-PLAN.md — LazyMaps + route detail (viewport) and tracking (eager) wiring
- [ ] Phase 43: Provider & Route Layout Refactoring (refinement to <2.5s)
- [ ] Phase 44: Animation Optimization & Monitoring (lock in <2.5s)
- [ ] Phase 45: Repo Cleanup & Hygiene
- [ ] Phase 46: Large File Refactoring (optional/stretch)

---

<details>
<summary>v1.4 Mobile Excellence (Phases 35-39) - SHIPPED 2026-02-05</summary>

**See full details:** `.planning/milestones/v1.4-ROADMAP.md`

**Summary:**
- 8 phases (including 3 decimal insertions), 39 plans
- 49/49 requirements satisfied
- Zero mobile crashes, CLS: 0, offline support, device-adaptive animations

**Phases:**
- [x] Phase 35: Mobile Crash Prevention (3/3 plans)
- [x] Phase 35.1: Admin Photo Upload & Featured (5/5 plans)
- [x] Phase 36: Image Optimization & LCP (3/3 plans)
- [x] Phase 36.1: Routes & Driver Features (11/11 plans)
- [x] Phase 36.2: Feature Finalization & Polish (9/9 plans)
- [x] Phase 37: Codebase Cleanup (2/2 plans)
- [x] Phase 38: Customer Offline Support (3/3 plans)
- [x] Phase 39: Animation Optimization (3/3 plans)

</details>

<details>
<summary>v1.3 Full Codebase Consolidation (Phases 25-34) - SHIPPED 2026-01-28</summary>

See `.planning/milestones/v1.3-ROADMAP.md` or MILESTONES.md for details.

</details>

<details>
<summary>v1.2 Playful UI Overhaul (Phases 15-24) - SHIPPED 2026-01-27</summary>

See MILESTONES.md for details.

</details>

<details>
<summary>v1.1 Tech Debt Cleanup (Phases 9-14) - SHIPPED 2026-01-23</summary>

See MILESTONES.md for details.

</details>

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-23</summary>

See MILESTONES.md for details.

</details>

---

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-8 | 32 | Complete | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | Complete | 2026-01-23 |
| v1.2 Playful UI | 15-24 | 29 | Complete | 2026-01-27 |
| v1.3 Consolidation | 25-34 | 53 | Complete | 2026-01-28 |
| v1.4 Mobile Excellence | 35-39 | 39 | Complete | 2026-02-05 |
| **v1.5 Performance** | 40-46 | 13+ | Active | - |

**Total shipped:** 40 phases, 178 plans

---

*Updated: 2026-02-06 - Phase 42 planned (3 plans in 2 waves)*
