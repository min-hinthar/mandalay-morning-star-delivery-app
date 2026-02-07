# Roadmap: Morning Star V8 UI Rewrite

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-23)
- v1.1 Tech Debt Cleanup - Phases 9-14 (shipped 2026-01-23)
- v1.2 Playful UI Overhaul - Phases 15-24 (shipped 2026-01-27)
- v1.3 Full Codebase Consolidation - Phases 25-34 (shipped 2026-01-28)
- v1.4 Mobile Excellence - Phases 35-39 (shipped 2026-02-05)
- **v1.5 Performance & Repo Health - Phases 40-47 (active)**

## Current Status

**Current milestone:** v1.5 Performance & Repo Health
**Primary Goal:** LCP < 4s (revised from 2.5s based on realistic assessment)
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
- [x] Phase 42: Dynamic Import Heavy Libraries (code-split Recharts + Google Maps) - **3 plans**
  - [x] 42-01-PLAN.md — Shared hooks (viewport trigger, import retry) + skeleton/error components
  - [x] 42-02-PLAN.md — Enhanced LazyCharts + admin dashboard RevenueChart wiring
  - [x] 42-03-PLAN.md — LazyMaps + route detail (viewport) and tracking (eager) wiring
- [x] Phase 43: Provider & Route Layout Refactoring (scope cart to customer/public routes, ~60KB savings) - **2 plans**
  - [x] 43-01-PLAN.md — Cart scoping to route-group layouts (CartOverlays + layouts + providers cleanup)
  - [x] 43-02-PLAN.md — Navigation guards + bundle verification
- [x] Phase 44: Animation Optimization & Monitoring (lock in <2.5s) - **3 plans**
  - [x] 44-01-PLAN.md — React Compiler enable + GSAP dead plugin removal
  - [x] 44-02-PLAN.md — LazyMotion provider + full motion.* to m.* migration
  - [x] 44-03-PLAN.md — Lighthouse CI performance gate setup
- [x] Phase 45: Repo Cleanup & Hygiene - **3 plans**
  - [x] 45-01-PLAN.md — Delete legacy docs (V0-V8) + untrack build artifacts
  - [x] 45-02-PLAN.md — .gitignore audit + planning files archival + STATE/ROADMAP trim
  - [x] 45-03-PLAN.md — README update + PERFORMANCE.md creation
- [x] Phase 46: Large File Refactoring (split 47 files >400 lines into sub-modules) - **7 plans**
  - [x] 46-01-PLAN.md — Leaf UI components split (10 files: OrderDetailExpanded, HowItWorksSection, AddressesTab, BrandMascot, DriverDashboard, PendingInvitesTab, PaymentSuccess, ProfileTab, MorphingMenu, CartItem)
  - [x] 46-02-PLAN.md — Admin components split (9 files: DriverDetailClient, RouteDetailClient, AdminDashboard, DriverListTable, RouteListTable, CreateRouteModal, SettingsClient, CoverageRouteMap, OrdersTab)
  - [x] 46-03-PLAN.md — Shared UI components split (8-10 files: FormValidation, Modal, skeleton, ExpandableTableRow, AddressInput, TimeSlotPicker, DeliveryMap, StatusTimeline + Hero/UnifiedMenuItemCard evaluation)
  - [x] 46-04-PLAN.md — Admin pages split (7 files: menu/[id], sections, categories, menu, photos, routes, drivers)
  - [x] 46-05-PLAN.md — API routes split (4 files: sections/[id], routes/[id]/stops, routes/[id], tracking/[orderId])
  - [x] 46-06-PLAN.md — Lib/utility files split (7 files: motion-tokens, swipe-gestures, analytics-helpers, micro-interactions, offline-store, route-optimization, useSafeEffects)
  - [x] 46-07-PLAN.md — ESLint max-lines expansion + CLAUDE.md documentation
- [ ] Phase 47: Final LCP Measurement & Gap Closure - **3 plans**
  - [ ] 47-01-PLAN.md — Build verification + Lighthouse measurements (4 routes)
  - [ ] 47-02-PLAN.md — Bundle analysis + Cart E2E tests (closes REQ-43.4/43.8/43.9)
  - [ ] 47-03-PLAN.md — PERFORMANCE.md update + phase verification + milestone decision

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
<summary>v1.0-v1.3 (Phases 1-34) - SHIPPED</summary>

See archived milestone files in `.planning/archive/`

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
| **v1.5 Performance** | 40-47 | 31 | Active | - |

**Total shipped:** 46 phases, 197 plans

---

*Updated: 2026-02-06 - Phase 47 planned (3 plans in 2 waves).*
