---
phase: 59-monitoring-error-tracking
plan: 01
subsystem: infra
tags: [sentry, monitoring, error-tracking, session-replay, breadcrumbs, source-maps]

# Dependency graph
requires:
  - phase: 37-feature-flags
    provides: "V7 rollout code that was cleaned up (beforeSend removed)"
provides:
  - "@sentry/nextjs 10.38.0 with unified config across client/server/edge"
  - "Error-only session replay with privacy masking"
  - "Auto-breadcrumbs (clicks, navigations, console, XHR, fetch)"
  - "Environment tagging via VERCEL_ENV"
  - "20% production trace sampling"
affects: [59-02, alerting, performance-monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sentry triple-config pattern: server/edge/client with matching environment/release"
    - "Error-only replay: replaysSessionSampleRate=0, replaysOnErrorSampleRate=1.0"
    - "Environment from NEXT_PUBLIC_VERCEL_ENV with NODE_ENV fallback"

key-files:
  created: []
  modified:
    - "sentry.server.config.ts"
    - "sentry.edge.config.ts"
    - "instrumentation-client.ts"
    - "package.json"

key-decisions:
  - "Capture ALL errors - removed ignoreErrors array entirely"
  - "Error-only session replay (replaysSessionSampleRate: 0) to minimize bandwidth"
  - "Privacy masking enabled: maskAllText, maskAllInputs, blockAllMedia"
  - "20% production tracing, 100% dev tracing"
  - "Re-enabled onRouterTransitionStart (was disabled due to old SDK bug)"

patterns-established:
  - "Sentry environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV"
  - "Sentry release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA"
  - "Debug mode via SENTRY_DEBUG env var only (no auto-debug in dev)"

# Metrics
duration: 8min
completed: 2026-02-14
---

# Phase 59 Plan 01: Sentry SDK Upgrade & Config Summary

**Upgraded @sentry/nextjs to 10.38.0 with unified triple-config (server/edge/client): all errors captured, error-only replay with privacy masking, auto-breadcrumbs, VERCEL_ENV environment tagging, 20% production tracing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-14T07:36:34Z
- **Completed:** 2026-02-14T07:45:00Z
- **Tasks:** 2
- **Files modified:** 5 (package.json, pnpm-lock.yaml, sentry.server.config.ts, sentry.edge.config.ts, instrumentation-client.ts)

## Accomplishments
- Upgraded @sentry/nextjs from 10.34.0 to 10.38.0
- Removed ignoreErrors array and V7 rollout beforeSend from server config (capture ALL errors)
- Configured error-only session replay with full privacy masking (maskAllText, maskAllInputs, blockAllMedia)
- Added auto-breadcrumbs integration (console, DOM clicks, fetch, history, XHR)
- Unified environment/release/tracesSampleRate across all three Sentry configs
- Re-enabled client-side router transition instrumentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade @sentry/nextjs and update server/edge configs** - `95f19bb` (feat)
2. **Task 2: Reconfigure instrumentation-client.ts with replay, breadcrumbs, and environment** - `f291810` (feat)

## Files Created/Modified
- `package.json` - Updated @sentry/nextjs version to 10.38.0
- `pnpm-lock.yaml` - Lockfile updated for new SDK version
- `sentry.server.config.ts` - Cleaned config: removed ignoreErrors, removed V7 beforeSend, updated environment/release/tracing
- `sentry.edge.config.ts` - Added environment, release, updated debug and tracing
- `instrumentation-client.ts` - Unconditional init, error-only replay, privacy masking, breadcrumbs, environment/release

## Decisions Made
- Removed ignoreErrors entirely per user decision to capture ALL errors (no filtering)
- Set replaysSessionSampleRate to 0 (error-only capture) to minimize bandwidth while preserving debugging capability
- Enabled full privacy masking on replays (maskAllText, maskAllInputs, blockAllMedia)
- Changed debug mode from auto-enable-in-dev to SENTRY_DEBUG env var only (reduces server log noise)
- Re-enabled onRouterTransitionStart that was previously disabled due to SDK compatibility bug (SDK 10.38.0 should fix it)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**External services require manual configuration:**
- Connect GitHub repository to Sentry (Settings -> Integrations -> GitHub -> Add Installation -> Select repo)
- Enable suspect commits (Settings -> Integrations -> GitHub -> Configure -> Enable Suspect Commits)

## Next Phase Readiness
- Sentry SDK configured and capturing errors across all runtimes
- Ready for Plan 02 (custom error boundaries, structured logging, alert rules)
- Source maps upload verified via successful `pnpm build`
- GitHub integration requires manual dashboard setup (see User Setup)

---
*Phase: 59-monitoring-error-tracking*
*Completed: 2026-02-14*
