# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** v1.5 Performance & Repo Health

## Current Position

Phase: 41 of 46 (Server Component Conversions)
Plan: 6 of 7 complete
Status: In progress
Last activity: 2026-02-06 — Completed 41-05 (home page server conversion)

Progress: [##########                                                        ] v1.5 10/52 (19%)

## Milestones

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |
| v1.3 Full Codebase Consolidation | 25-34 | 53 | 2026-01-28 |
| v1.4 Mobile Excellence | 35-39 | 39 | 2026-02-05 |
| **v1.5 Performance & Repo Health** | 40-46 | 52 | In Progress |

**Total completed:** 40 phases, 178 plans, 214 requirements

## Accumulated Context

### Key Decisions (v1.5)

| Decision | Rationale |
|----------|-----------|
| LCP element: emoji (homepage), CardImage (menu) | Lighthouse analysis confirmed LCP targets |
| Font loading already optimized | REQ-40.4 satisfied - display: swap in place |
| Primary optimization: CardImage to Next.js Image | 2.6s resource load delay is main bottleneck |
| CardImage converted: 43-46% LCP reduction | Homepage 19.9s→11.4s, Menu 18.2s→9.8s |
| JS bundle is primary remaining bottleneck | TBT still 2-3s; Server Component conversion needed |
| RouteLoading/RouteError infrastructure | Reusable components for route segments |
| Hydration smoke test foundation | Parameterized tests detect hydration mismatches |
| 275 use client files audited | 184 KEEP, 37 CONVERT, 54 LEAF; 13 quick wins identified |
| TrackingPageClient kept as-is | Realtime subscriptions require client boundary; animation coherence preserved |
| MenuContent kept as client component | React Query + offline IndexedDB too deeply integrated; MenuContentClient created for future enhancement |
| Hero kept as client component | 519 lines tightly coupled with framer-motion parallax; splitting would cause hydration issues |
| HomePageWrapper pattern | Minimal client wrapper for scroll spy; section composition at server level |

### Key Decisions (v1.4)

| Decision | Rationale |
|----------|-----------|
| Two-tier animation system (low/high) | Simplified from three tiers per CONTEXT.md |
| Custom SW build script | @serwist/next doesn't support Turbopack |
| flyingCount for concurrency | Allows multiple simultaneous fly animations |
| cartPop sound 1200Hz→800Hz | Satisfying descending pop effect |

### Tech Debt (v1.5 Focus)

| Item | Status | Notes |
|------|--------|-------|
| LCP 11.4s (homepage), 9.8s (menu) | **Active** | Reduced from 19.9s/18.2s; target: <2.5s |
| 29 files >400 lines | **Active** | Refactoring in v1.5 |
| Legacy docs (V0-V7) | **Active** | Archive in v1.5 |
| storybook-static in git | **Active** | Untrack in v1.5 |

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 41-05-PLAN.md
Resume file: None
Next action: Execute Phase 41 Plan 07 (driver routes) - final plan in phase

---

*Updated: 2026-02-06 — Completed 41-05 (home page: HomePageWrapper + server composition)*
