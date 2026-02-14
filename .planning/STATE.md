# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 60 - LCP Optimization

## Current Position

Phase: 60 of 66 (LCP Optimization)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-14 -- Completed 60-02-PLAN.md (LayoutId-to-CSS migration)

Progress: [############################........] 90% (60/66 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 259 (across v1.0-v1.7)
- Average duration: ~15 min
- Total execution time: ~65 hours

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 | 8 | 32 | 2 days |
| v1.1 | 6 | 21 | 1 day |
| v1.2 | 9 | 29 | 4 days |
| v1.3 | 10 | 53 | 2 days |
| v1.4 | 8 | 39 | 6 days |
| v1.5 | 8 | 34 | 3 days |
| v1.6 | 10 | 47 | 6 days |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.7:

- DEPL-01 already complete (app live at delivery.mandalaymorningstar.com)
- LCP target revised from <2.5s to <4s (original unrealistic without architecture changes)
- Lighthouse CI warn-only until LCP baseline improves (Phase 65 enables blocking)
- Health checks use dynamic imports to avoid build-time crashes when env vars missing
- Promise.allSettled for parallel deep checks with graceful fallback
- 30-second in-memory cache prevents repeated deep checks on rapid requests
- CORS for /api/health via next.config.ts headers() (wildcard origin for monitoring dashboards)
- Config-only health check assumes healthy if env vars present (fast default path)
- Sentry captures ALL errors (ignoreErrors removed entirely per user decision)
- Error-only session replay (replaysSessionSampleRate: 0) with full privacy masking
- 20% production tracing, 100% dev tracing across all Sentry configs
- Sentry environment from NEXT_PUBLIC_VERCEL_ENV with NODE_ENV fallback
- Speed Insights at 50% sample rate to balance Hobby plan quota with statistical significance
- Removed manual window.Sentry global access and dead sendBeacon endpoint from web-vitals.tsx
- Async domAnimation instead of sync domMax removes ~25kb from critical path
- CSS fade-in-up at opacity 0.85 start (near-visible before animation) for LCP-critical content
- Pre-existing layoutId->CSS migration completed (Tabs, BottomNav, callers)
- All 7 layoutId indicator components migrated to CSS transitions (CategoryTabs, NavDots, SearchCategoryTabs, TestimonialsCarousel dots, CarouselControls dots)
- Removed layoutId prop from Tabs and NavDots interfaces entirely (TS errors guide consumers)
- CSS indicator pattern: single positioned div + tabRefs Map + ResizeObserver

### Pending Todos

None yet.

### Blockers/Concerns

- LCP 8-11s: Root cause partially addressed (async provider + server-visible hero + layoutId removal). Plan 03 completes optimization.
- OAuth redirect URLs: Must configure Google Cloud Console + Apple Developer Portal for production domain
- Resend domain: SPF/DKIM/DMARC DNS records needed at Hostinger for production email delivery
- Service worker scope: Currently `/driver` only, needs expansion to `/`
- Build environment: Turbopack ENOENT on OneDrive-synced directory (pre-existing, not blocking deploys)

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed 60-02-PLAN.md, ready for 60-03-PLAN.md
Resume file: None
