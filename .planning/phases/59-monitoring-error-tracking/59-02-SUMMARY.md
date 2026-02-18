---
phase: 59-monitoring-error-tracking
plan: 02
subsystem: infra
tags: [vercel, speed-insights, web-vitals, core-web-vitals, analytics]

# Dependency graph
requires:
  - phase: 59-monitoring-error-tracking (plan 01)
    provides: "Sentry SDK with browserTracingIntegration for CWV capture"
provides:
  - "@vercel/speed-insights in root layout at 50% sample rate"
  - "Simplified web-vitals.tsx with dev-only console reporting"
affects: [65-lighthouse-ci, 66-performance-optimization]

# Tech tracking
tech-stack:
  added: ["@vercel/speed-insights@1.3.1"]
  patterns: ["Vercel Speed Insights + Sentry dual CWV reporting pipeline"]

key-files:
  created: []
  modified:
    - "src/app/layout.tsx"
    - "src/lib/web-vitals.tsx"
    - "package.json"
    - "pnpm-lock.yaml"

key-decisions:
  - "50% sample rate to balance Hobby plan quota (10k data points/month) with statistical significance"
  - "Removed manual window.Sentry global access -- anti-pattern replaced by SDK browserTracingIntegration"
  - "Removed dead sendBeacon to non-existent /api/analytics/vitals endpoint"

patterns-established:
  - "Production CWV dual-reporting: @vercel/speed-insights (Vercel dashboard) + @sentry/nextjs (Sentry dashboard)"
  - "Dev-only web-vitals console output for local debugging"

# Metrics
duration: 9min
completed: 2026-02-14
---

# Phase 59 Plan 02: Speed Insights & Web Vitals Cleanup Summary

**@vercel/speed-insights added at 50% sample rate with web-vitals.tsx simplified to dev-only console reporter**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-14T07:36:33Z
- **Completed:** 2026-02-14T07:45:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Installed @vercel/speed-insights v1.3.1 for automatic Core Web Vitals reporting to Vercel dashboard
- Added SpeedInsights component to root layout at 50% sample rate (balances free tier quota)
- Removed redundant production CWV reporting code (window.Sentry global access, sendBeacon to dead endpoint)
- Preserved all existing exports for backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @vercel/speed-insights and add to layout** - `9e21a41` (feat)
2. **Task 2: Simplify web-vitals.tsx for dev-only reporting** - `2a31c51` (refactor)

## Files Created/Modified

- `src/app/layout.tsx` - Added SpeedInsights import and component before Analytics
- `src/lib/web-vitals.tsx` - Removed 45 lines of redundant production reporting code
- `package.json` - Added @vercel/speed-insights dependency
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- **50% sample rate:** Hobby plan allows 10,000 data points/month. Each page view generates multiple CWV data points. 50% balances quota with statistical significance.
- **Removed window.Sentry access:** The Sentry SDK (initialized in instrumentation-client.ts) automatically captures web vitals via browserTracingIntegration. Accessing window.Sentry is an untyped global anti-pattern.
- **Removed sendBeacon:** The /api/analytics/vitals endpoint does not exist -- this was dead code that would silently fail in production.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Stale .next/lock file from previous build blocked `pnpm build` verification -- removed manually and build succeeded
- Lint-staged stash/restore cycle picked up previously staged files from plan 59-01 (sentry config changes and instrumentation-client.ts) -- committed alongside task changes. No functional impact.

## User Setup Required

None - SpeedInsights reports automatically once deployed to Vercel. No dashboard configuration needed (data appears in Vercel project > Speed Insights tab).

## Next Phase Readiness

- CWV data will be visible in Vercel Speed Insights dashboard after next deploy
- Web Analytics already active via existing Analytics component
- Sentry CWV tracking active via browserTracingIntegration (plan 01)
- Ready for Lighthouse CI (phase 65) to set performance budgets based on real CWV data

---

_Phase: 59-monitoring-error-tracking_
_Completed: 2026-02-14_
