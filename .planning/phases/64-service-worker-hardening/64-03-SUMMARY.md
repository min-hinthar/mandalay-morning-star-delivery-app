---
phase: 64-service-worker-hardening
plan: 03
subsystem: ui
tags: [offline-indicator, offline-page, banner-priority, cached-content, reconnection, pwa]

# Dependency graph
requires:
  - phase: 64-01
    provides: "Offline fallback page at /offline, NavigationRoute with denylist"
provides:
  - "Enhanced OfflineIndicator with 'showing cached content' messaging"
  - "Manual refresh button on reconnection banner"
  - "offline-state-change custom event for banner priority coordination"
  - "document.documentElement.dataset.offline for disabling non-queueable actions"
  - "Reusable OfflinePage client component with branded offline experience"
affects: [64-04, 64-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      "custom event dispatch for cross-component coordination",
      "document data attribute for progressive enhancement",
    ]

key-files:
  created:
    - "src/components/ui/offline/OfflinePage.tsx"
  modified:
    - "src/components/ui/offline/OfflineIndicator.tsx"
    - "src/components/ui/offline/index.ts"
    - "src/app/offline/page.tsx"

key-decisions:
  - "Use bg-surface-primary/20 instead of bg-white/20 per project semantic token lint rule"
  - "OfflinePage is a self-contained 'use client' component with inline Try Again button (no separate OfflineTryAgainButton)"
  - "Offline route page delegates entirely to OfflinePage component, keeping only metadata and force-static export"

patterns-established:
  - "Custom event coordination: OfflineIndicator emits 'offline-state-change', consumers listen and react"
  - "Document data attribute signaling: dataset.offline='true' for CSS/JS progressive enhancement"

# Metrics
duration: 13min
completed: 2026-02-15
---

# Phase 64 Plan 03: Offline UX Enhancement Summary

**Enhanced OfflineIndicator with 'showing cached content' messaging, manual refresh on reconnection, banner priority via custom events, and reusable OfflinePage component**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-15T06:57:00Z
- **Completed:** 2026-02-15T07:10:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Enhanced offline banner text from "You're offline" to "You're offline -- showing cached content"
- Added manual "Refresh" button to "Back online!" reconnection banner (user chooses when to refresh)
- Implemented `offline-state-change` custom event dispatch for banner priority coordination with useUpdateBanner
- Set `document.documentElement.dataset.offline` attribute for disabling non-queueable actions via CSS/JS
- Created reusable `OfflinePage` client component with branded design, cached page links, and Try Again button
- Updated offline route to import OfflinePage from barrel export

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance OfflineIndicator with cached content messaging and banner priority** - `f0955ad` (feat)
2. **Task 2: Create OfflinePage component and update offline route page** - `ecde60a` (feat, included in 64-04 commit)

**Note:** Task 2 files were picked up by a concurrent 64-04 executor and committed in `ecde60a` (which notes "Include orphaned OfflinePage component from prior plan execution"). The work was authored by this plan's execution.

## Files Created/Modified

- `src/components/ui/offline/OfflineIndicator.tsx` - Enhanced with cached content messaging, refresh button, custom event dispatch, and data attribute signaling
- `src/components/ui/offline/OfflinePage.tsx` - New branded offline page component with logo, cached page links, and Try Again button
- `src/components/ui/offline/index.ts` - Added OfflinePage export to barrel
- `src/app/offline/page.tsx` - Simplified to import and render OfflinePage component

## Decisions Made

- Used `bg-surface-primary/20` instead of `bg-white/20` for refresh button background per project semantic token lint rule
- OfflinePage component is self-contained with inline Try Again button (replaced separate OfflineTryAgainButton pattern from Plan 01)
- Kept OfflinePage lightweight (no ErrorPageShell import) since offline page must work without network; uses inline gradient background instead
- RefreshCw icon from lucide-react for the manual refresh button (consistent with existing icon library usage)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed bg-white lint violation in refresh button**

- **Found during:** Task 1 (OfflineIndicator enhancement)
- **Issue:** ESLint `no-restricted-syntax` rule requires semantic tokens instead of `bg-white`
- **Fix:** Replaced `bg-white/20` and `bg-white/30` with `bg-surface-primary/20` and `bg-surface-primary/30`
- **Files modified:** src/components/ui/offline/OfflineIndicator.tsx
- **Verification:** `pnpm lint` passes with 0 errors
- **Committed in:** f0955ad (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Lint compliance fix, no scope creep.

## Issues Encountered

- Task 2 files were committed by a concurrent 64-04 plan executor that detected the uncommitted files in the working tree. The work was correctly authored and verified, just attributed to a different commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- OfflineIndicator dispatches `offline-state-change` event ready for useUpdateBanner to listen (Plan 02 coordination)
- Document data attribute `dataset.offline` available for checkout/action button disabling
- OfflinePage component exported from barrel, ready for reuse
- All verification passes: typecheck, lint, build (static /offline page confirmed)

---

_Phase: 64-service-worker-hardening_
_Completed: 2026-02-15_
