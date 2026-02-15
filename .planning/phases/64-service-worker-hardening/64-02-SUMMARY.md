---
phase: 64-service-worker-hardening
plan: 02
subsystem: ui
tags: [service-worker, update-banner, countdown, progress-bar, interaction-pause, dismissal-tracking]

# Dependency graph
requires:
  - phase: 64-01
    provides: "NEXT_PUBLIC_APP_VERSION env var, service worker foundation with SKIP_WAITING support"
  - phase: 45-offline-pwa
    provides: "Base UpdatePrompt component and offline infrastructure"
provides:
  - "useUpdateBanner hook with interaction-aware 10s countdown"
  - "Rewritten UpdatePrompt with progress bar, version display, and info color"
  - "Page deferral for /cart and /checkout paths"
  - "Dismissal tracking with force-reload after 3 dismissals"
  - "Post-update success toast via sessionStorage flag"
affects: [64-03, 64-04, 65-lighthouse-ci]

# Tech tracking
tech-stack:
  added: []
  patterns: ["interaction-aware countdown with debounced idle resume", "sessionStorage-persisted dismissal tracking", "presentational component + hook separation for SW update UX"]

key-files:
  created:
    - "src/lib/hooks/useUpdateBanner.ts"
  modified:
    - "src/components/ui/offline/UpdatePrompt.tsx"
    - "src/lib/hooks/index.ts"

key-decisions:
  - "Used CSS transition width (not Radix Progress) for update banner progress bar - simpler, no extra component overhead"
  - "Info color (bg-info) for update banner to distinguish from offline warning banner (bg-primary)"
  - "sessionStorage for dismiss count persistence (not localStorage) - resets per session, appropriate for update prompts"
  - "Passive event listeners for interaction detection (scroll, keydown, touchstart, mousedown)"
  - "3-second idle debounce before resuming countdown after user interaction"

patterns-established:
  - "Hook+presentational split: useUpdateBanner owns all state/logic, UpdatePrompt is pure render"
  - "sessionStorage flag pattern: set before reload, check on mount, show toast, clear flag"
  - "Page deferral: suppress banner on critical paths (/cart, /checkout), re-show on navigation away"

# Metrics
duration: 6min
completed: 2026-02-15
---

# Phase 64 Plan 02: Update Banner with Interaction-Aware Countdown Summary

**useUpdateBanner hook with 10s interaction-pausing countdown, progress bar, 3-dismissal force-reload, page deferral, mobile vibration, and post-update toast**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-15T06:57:30Z
- **Completed:** 2026-02-15T07:03:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created useUpdateBanner hook extracting all SW update state management from UpdatePrompt
- 10-second countdown with interaction pause (scroll/keydown/touchstart/mousedown) and 3s idle resume
- Progress bar shrinks from 100% to 0% with CSS transition, pauses visually when countdown pauses
- Dismissal tracking in sessionStorage with force-reload after 3 dismissals (no dismiss button)
- Page deferral for /cart and /checkout (banner suppressed, re-shows on navigation away)
- Mobile vibration (100ms) on first banner appearance
- Post-update success toast via sessionStorage flag ("Updated to latest version!")

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useUpdateBanner hook with interaction-aware countdown** - `54092ca` (feat)
2. **Task 2: Rewrite UpdatePrompt with progress bar, version, and new UX** - `58999e1` (feat)

## Files Created/Modified
- `src/lib/hooks/useUpdateBanner.ts` - New hook with countdown, interaction pause, dismissal tracking, page deferral, vibration, toast
- `src/components/ui/offline/UpdatePrompt.tsx` - Rewritten as presentational component consuming useUpdateBanner
- `src/lib/hooks/index.ts` - Added useUpdateBanner and UseUpdateBannerReturn exports

## Decisions Made
- Used simple CSS div with transition-width for progress bar instead of Radix Progress component (lighter, no spring physics needed for linear countdown)
- Info color scheme (bg-info/95 with backdrop-blur) distinguishes update banner from offline warning (bg-primary)
- sessionStorage chosen over localStorage for dismiss count (resets each session, appropriate for update prompts)
- Passive event listeners for all interaction detection events (no scroll jank)
- Version displayed as "v{version} is ready!" alongside countdown text

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Update banner fully functional with all locked decision requirements
- useUpdateBanner hook available for any future components needing SW update state
- Post-update toast pattern established for future SW lifecycle events
- Pre-existing typecheck errors in cart-store.ts unrelated to this plan (not introduced here)

---
*Phase: 64-service-worker-hardening*
*Completed: 2026-02-15*
