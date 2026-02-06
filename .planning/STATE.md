# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** v1.5 Performance & Repo Health

## Current Position

Phase: 46 of 46 (Large File Refactoring)
Plan: 3 of 7 complete
Status: In progress
Last activity: 2026-02-06 — Completed 46-05-PLAN.md (4 API route type/schema extractions)

Progress: [#########################                                         ] v1.5 25/52 (48%)

## Milestones

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |
| v1.3 Full Codebase Consolidation | 25-34 | 53 | 2026-01-28 |
| v1.4 Mobile Excellence | 35-39 | 39 | 2026-02-05 |
| **v1.5 Performance & Repo Health** | 40-46 | 52 | In Progress |

**Total completed:** 42 phases, 192 plans, 214 requirements

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
| 282 'use client' files is optimal | +7 from baseline due to error boundaries; no further reduction recommended |
| Phase 42+ focus: LCP/TBT | Not 'use client' reduction; still 9-11s LCP, 2-3s TBT |
| importWithRetry is pure async, not a hook | Used inside next/dynamic factory; hooks not callable there |
| Error cards co-located per domain | ChartErrorCard in analytics/, MapErrorCard in maps/ for clean ownership |
| LazyX pattern for all chart wrappers | importWithRetry + LoadingWithTimeout + ChartSkeleton per chart |
| Server components import client lazy wrappers directly | "use client" boundary at LazyCharts.tsx, not at page level |
| 15s map timeout (vs 10s charts) | Mobile networks need more time for Google Maps SDK (~120KB) |
| Route detail map viewport-triggered | Below-fold admin content; defers heavy bundle until scrolled into view |
| Tracking page map eager lazy-loaded | Map IS primary content; code-split but no viewport gate |
| CartOverlays wrapper for route-group scoping | DRY Fragment rendering CartBar + CartDrawer + FlyToCart |
| CartIndicator pathname-aware fallback | Opens drawer on cart routes, navigates to /cart elsewhere |
| useNavigationGuard: browser-level only | popstate + beforeunload; Link interception via page-level onNavigate |
| Cart page guard nudges to checkout | onStay navigates to /checkout, not just close modal |
| Empty checkout redirect with toast | router.replace to /menu avoids history pollution |
| React Compiler enabled globally, no opt-outs | All 282 client components compile cleanly; reactCompiler: true top-level |
| SplitText, Flip, Observer removed from GSAP | Zero consumer files; only useGSAP + ScrollTrigger actively used |
| LazyMotion domMax + strict at root | drag + layoutId require domMax; strict prevents motion.* regression |
| All motion.* migrated to m.* (174 files) | Per-component bundle ~34kb to ~4.6kb; features loaded once at root |
| Lighthouse CI: warn-only, PR-only, 4 customer routes | Regression gate without blocking PRs; server mode for App Router |
| API route co-location: types.ts/schemas.ts/helpers.ts siblings | Keep route.ts focused on HTTP handlers; types/schemas/helpers co-located |
| Supabase client typing via Awaited<ReturnType<typeof createClient>> | Avoids direct @supabase/supabase-js import in helpers |

### Tech Debt (v1.5 Focus)

| Item | Status | Notes |
|------|--------|-------|
| LCP 11.4s (homepage), 9.8s (menu) | **Active** | Reduced from 19.9s/18.2s; target: <2.5s |
| 29 files >400 lines | **Active** | Refactoring in v1.5 |
| Legacy docs (V0-V8) | **Done** | 94 files deleted in 45-01 |
| storybook-static in git | **Done** | Untracked in 45-01 (89 files) |

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 46-05-PLAN.md (4 API route type/schema extractions)
Resume file: None
Next action: Execute 46-06-PLAN.md

---

*Updated: 2026-02-06 — Plan 46-05: Extract types/schemas/helpers from 4 API routes*
