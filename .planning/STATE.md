# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** v1.5 Performance & Repo Health (complete)

## Current Position

Phase: 47 of 47 (Final LCP Measurement & Gap Closure)
Plan: 5 of 6 complete (47-01, 47-02, 47-03, 47-04, 47-05)
Status: In progress - 1 gap closure plan remaining (47-06)
Last activity: 2026-02-07 — Completed 47-05 (E2E Cart Selector Refinement)

Progress: [##########################################################..........] v1.5 Phase 47 gap closure (5/6 plans)

## Milestones

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |
| v1.3 Full Codebase Consolidation | 25-34 | 53 | 2026-01-28 |
| v1.4 Mobile Excellence | 35-39 | 39 | 2026-02-05 |
| **v1.5 Performance & Repo Health** | 40-47 | 61 | In Progress |

**Total completed:** 46 phases, 199 plans, 214 requirements

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
| Cart scoping: static verification (vs bundle analyzer) | @next/bundle-analyzer incompatible with Turbopack; source analysis proves scoping |
| Cart E2E selectors: aria-label based | Components use accessible labels; data-testid not present in components |
| addItemToCart helper handles modal flow | Items with required modifiers open ItemDetailSheet; helper selects radiogroups and force-clicks |
| evaluate(el => el.click()) for viewport-clipped elements | Playwright force:true still enforces viewport; native DOM click bypasses completely |
| Drawer selector scoping via data-testid="drawer" | Prevents matching elements behind drawer overlay (e.g., CartBar checkout button) |
| SplitText, Flip, Observer removed from GSAP | Zero consumer files; only useGSAP + ScrollTrigger actively used |
| LazyMotion domMax + strict at root | drag + layoutId require domMax; strict prevents motion.* regression |
| All motion.* migrated to m.* (174 files) | Per-component bundle ~34kb to ~4.6kb; features loaded once at root |
| Lighthouse CI: warn-only, PR-only, 4 customer routes | Regression gate without blocking PRs; server mode for App Router |
| API route co-location: types.ts/schemas.ts/helpers.ts siblings | Keep route.ts focused on HTTP handlers; types/schemas/helpers co-located |
| Supabase client typing via Awaited<ReturnType<typeof createClient>> | Avoids direct @supabase/supabase-js import in helpers |
| Admin page sibling co-location for extracted components | PascalCase .tsx files alongside page.tsx; safe in App Router |
| State stays in page.tsx, extracted components get props | Thin orchestrator pattern: page manages state + handlers |
| Hero.tsx split into subfolder pattern | Sub-components don't share state/refs; clean separation into 4 sub-files |
| UnifiedMenuItemCard.tsx irreducible at 540 lines | Tightly coupled tilt physics, cart, touch handling through shared refs/state |
| High-export barrels: subfolder pattern | FormValidation (20), Modal (10), skeleton (11) split with complete barrel re-exports |
| Constants extraction for oversized components | Animation variants and config objects to constants.ts when component exceeds 400 lines |
| motion-tokens core.ts as foundation | duration/easing/spring/transition in core.ts; all sub-files import from core (one-directional) |
| Lib subfolder barrel pattern | 7 lib files split into subfolders with complete barrel re-exports preserving all import paths |
| ESLint max-lines expanded to all src/**/*.{ts,tsx} | Warning-only, exempts types/tests/stories; prevents regression |
| 4 file-splitting patterns documented in CLAUDE.md | Component subfolder, lib subfolder, admin sibling, API route sibling |
| Phase 47 LCP measurement: 8-11s on all routes | Target <4s missed; v1.6 optimization needed for JS execution, network latency, DOM size |
| Lighthouse CI startServerReadyPattern fixed | Next.js 16 outputs "Starting" not "started server" |
| v1.5 milestone: follow-up verification requested | User wants to verify updates are wired and working before closing |
| Desktop Lighthouse profile via LIGHTHOUSE_PROFILE env var | Single config file, env var toggle; desktop settings match Lighthouse built-in preset |
| E2E job reuses build artifacts | Download .next from build job; avoids rebuild in E2E job |
| Lighthouse report persistence already solved | uploadArtifacts + temporaryPublicStorage in ci.yml already persist reports |

### Tech Debt (v1.5 Focus)

| Item | Status | Notes |
|------|--------|-------|
| LCP 10.9s (homepage), 11.0s (menu) | **FAIL** | Phase 47 measurement: 8-11s, target <4s missed; v1.6 optimization needed |
| 29 files >400 lines | **Done** | Refactored in Phase 46; ESLint max-lines enforces going forward |
| Legacy docs (V0-V8) | **Done** | 94 files deleted in 45-01 |
| storybook-static in git | **Done** | Untracked in 45-01 (89 files) |

### Blockers/Concerns

**v1.5 Follow-up Verification Required** (before milestone closure):
- [x] Cart E2E tests (19 tests) integrated in CI pipeline (47-04: E2E job added)
- [x] Cart E2E selectors refined: 18-19/19 passing reliably (47-05: selector fixes)
- [ ] Lighthouse CI workflow triggering on PRs
- [ ] LazyMotion + React Compiler active in production build
- [ ] Documentation accurately reflects deployed state

## Session Continuity

Last session: 2026-02-07
Stopped at: Completed 47-05 (E2E Cart Selector Refinement). Gap closure in progress.
Resume file: None
Next action: Execute 47-06 (build verification)

---

*Updated: 2026-02-07 — Completed 47-05 (E2E Cart Selector Refinement). 1 gap closure plan remaining (47-06).*
