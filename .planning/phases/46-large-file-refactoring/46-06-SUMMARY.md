---
phase: 46-large-file-refactoring
plan: 06
subsystem: ui
tags: [refactoring, barrel-exports, motion-tokens, swipe-gestures, micro-interactions, analytics, offline-store, route-optimization]

# Dependency graph
requires:
  - phase: 46-03
    provides: "Subfolder pattern established for shared UI components"
  - phase: 46-04
    provides: "Admin page sub-component extraction"
  - phase: 46-05
    provides: "API route extraction"
provides:
  - "7 lib files split into subfolders with barrel re-exports"
  - "motion-tokens.ts (highest-risk, 116 importers) split cleanly into 7 sub-files"
  - "All lib files under 400 lines"
affects: [46-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subfolder + barrel re-export for high-import lib files"
    - "Core tokens in separate file, consumer modules import from core"
    - "Domain-grouped splits (hooks per file, types/constants/utils separation)"

key-files:
  created:
    - "src/lib/motion-tokens/index.ts"
    - "src/lib/motion-tokens/core.ts"
    - "src/lib/motion-tokens/variants.ts"
    - "src/lib/motion-tokens/stagger.ts"
    - "src/lib/motion-tokens/effects.ts"
    - "src/lib/motion-tokens/scroll.ts"
    - "src/lib/motion-tokens/cards.ts"
    - "src/lib/motion-tokens/utilities.ts"
    - "src/lib/swipe-gestures/index.ts"
    - "src/lib/utils/analytics-helpers/index.ts"
    - "src/lib/micro-interactions/index.ts"
    - "src/lib/services/offline-store/index.ts"
    - "src/lib/services/route-optimization/index.ts"
    - "src/lib/hooks/useSafeEffects/index.ts"
  modified: []

key-decisions:
  - "motion-tokens core.ts holds duration/easing/spring/transition; all other sub-files import from core (no circular deps)"
  - "route-optimization.ts (401 lines) split despite being barely over threshold - clean types/optimizer separation"
  - "micro-interactions re-exports triggerHaptic from swipe-gestures barrel (maintains existing public API)"

patterns-established:
  - "Barrel re-export: export * from './sub-file' for each sub-module in index.ts"
  - "Core-dependency pattern: foundation tokens in core.ts, consumers import from core (one-directional)"
  - "Hook-per-file: each custom hook gets its own file in subfolder"

# Metrics
duration: 17min
completed: 2026-02-06
---

# Phase 46 Plan 06: Lib File Subfolder Splits Summary

**7 lib files (3,293 total lines) split into 39 sub-files with complete barrel re-exports; motion-tokens (116 importers, 33 exports) split with zero breakage**

## Performance

- **Duration:** 17 min
- **Started:** 2026-02-06T15:37:52Z
- **Completed:** 2026-02-06T15:55:15Z
- **Tasks:** 2
- **Files modified:** 44 (7 deleted, 39 created, minus git rename detections)

## Accomplishments
- Split motion-tokens.ts (937 lines, 116 importers, 33 exports) into 7 sub-files with zero import breakage
- Split 6 additional lib files (swipe-gestures, analytics-helpers, micro-interactions, offline-store, route-optimization, useSafeEffects)
- All 39 sub-files under 400 lines (max: 331 lines in optimizer.ts)
- Zero TypeScript errors, zero lint errors, zero circular dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Split motion-tokens.ts** - `da333e6` (refactor)
2. **Task 2: Split remaining 6 lib/utility files** - `0792ead` (refactor)

## Files Created/Modified

### motion-tokens/ (33 exports across 7 sub-files)
- `src/lib/motion-tokens/index.ts` - Barrel re-exporting all 33 exports
- `src/lib/motion-tokens/core.ts` - duration, easing, spring, transition (182 lines)
- `src/lib/motion-tokens/variants.ts` - variants, hover, inputFocus, tap, overlay, badgeVariants, cartBarBounce, cartBarSlideUp (321 lines)
- `src/lib/motion-tokens/stagger.ts` - staggerContainer, staggerItem, staggerDelay, STAGGER_GAP, MAX_STAGGER_DELAY (104 lines)
- `src/lib/motion-tokens/effects.ts` - celebration, float, floatGentle, morph, priceTicker, routeDraw (173 lines)
- `src/lib/motion-tokens/scroll.ts` - scrollReveal, parallaxLayer, parallaxPresets, VIEWPORT_AMOUNT, viewport (93 lines)
- `src/lib/motion-tokens/cards.ts` - flipCard, expandingCard (68 lines)
- `src/lib/motion-tokens/utilities.ts` - triggerHaptic (18 lines)

### swipe-gestures/ (21 exports across 6 sub-files)
- `src/lib/swipe-gestures/index.ts` - Barrel
- `src/lib/swipe-gestures/types.ts` - All type definitions
- `src/lib/swipe-gestures/constants.ts` - SWIPE_THRESHOLDS, VELOCITY_THRESHOLDS, HAPTIC_DURATIONS
- `src/lib/swipe-gestures/utils.ts` - triggerHaptic, isTouchDevice, prefersReducedMotion, scroll prevention, math utils
- `src/lib/swipe-gestures/useSwipeToDelete.ts` - useSwipeToDelete hook
- `src/lib/swipe-gestures/useSwipeToClose.ts` - useSwipeToClose hook
- `src/lib/swipe-gestures/useSwipeNavigation.ts` - useSwipeNavigation hook

### analytics-helpers/ (19 exports across 4 sub-files)
- `src/lib/utils/analytics-helpers/index.ts` - Barrel
- `src/lib/utils/analytics-helpers/transformations.ts` - transformDriverStats, transformDeliveryMetrics
- `src/lib/utils/analytics-helpers/trends.ts` - calculateTrendPercentage, getTrendDirection, getDateRangeForPeriod, getPreviousPeriodRange
- `src/lib/utils/analytics-helpers/aggregation.ts` - calculateMetricsSummary, generateLeaderboard, calculateDriverScore, calculatePeakHours, metricsToDataPoints, getRatingPercentages, getTotalExceptions
- `src/lib/utils/analytics-helpers/formatting.ts` - formatHourLabel, formatCurrency, formatPercent, formatDuration, formatNumber, formatRating

### micro-interactions/ (32 exports across 6 sub-files)
- `src/lib/micro-interactions/index.ts` - Barrel + triggerHaptic re-export
- `src/lib/micro-interactions/timing.ts` - timing, easing constants
- `src/lib/micro-interactions/buttons.ts` - buttonHover, buttonTap, buttonVariants, primaryButtonVariants, iconButtonVariants, rotatingIconVariants
- `src/lib/micro-interactions/cards.ts` - cardHover, cardTap, cardVariants
- `src/lib/micro-interactions/controls.ts` - toggleKnobVariants, toggleTrackVariants, checkboxVariants, checkmarkVariants, heartVariants, heartTap, quantityFlipVariants, stepperButtonVariants
- `src/lib/micro-interactions/feedback.ts` - badgePopVariants, rippleVariants, shakeVariants, pulseVariants, progressSpring, snappySpring, bouncySpring
- `src/lib/micro-interactions/stagger.ts` - variableStagger, createVariableStaggerContainer, staggerChildren, listItemVariants, staggerContainerVariants

### offline-store/ (6 exports across 3 sub-files)
- `src/lib/services/offline-store/index.ts` - Barrel
- `src/lib/services/offline-store/db.ts` - Database core (openDB, generic CRUD)
- `src/lib/services/offline-store/stores.ts` - routeCache, pendingStatus, pendingPhotos, pendingLocations
- `src/lib/services/offline-store/sync.ts` - syncPendingItems, getPendingCounts

### route-optimization/ (6 exports across 2 sub-files)
- `src/lib/services/route-optimization/index.ts` - Barrel
- `src/lib/services/route-optimization/types.ts` - Types, KITCHEN_ORIGIN, validateStopsForOptimization
- `src/lib/services/route-optimization/optimizer.ts` - optimizeRoute, optimizeRouteStops

### useSafeEffects/ (7 exports across 4 sub-files)
- `src/lib/hooks/useSafeEffects/index.ts` - Barrel
- `src/lib/hooks/useSafeEffects/useMountedRef.ts` - useMountedRef hook
- `src/lib/hooks/useSafeEffects/useSafeTimeout.ts` - useSafeTimeout hook + SafeTimeoutControls type
- `src/lib/hooks/useSafeEffects/useSafeInterval.ts` - useSafeInterval hook + SafeIntervalControls type
- `src/lib/hooks/useSafeEffects/useSafeAsync.ts` - useSafeAsync hook + SafeAsyncControls type

## Decisions Made
- motion-tokens core.ts holds all foundation tokens (duration, easing, spring, transition); all other sub-files import from core -- ensures one-directional dependencies with zero circular risk
- route-optimization.ts split despite being only 1 line over 400 -- clean types/optimizer separation justified
- micro-interactions barrel re-exports triggerHaptic from swipe-gestures to maintain existing public API for the 1 importer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused React imports in swipe-gestures/utils.ts**
- **Found during:** Task 2 (swipe-gestures split)
- **Issue:** useState, useCallback, useRef were imported but only useEffect was used (the hook functions moved to separate files)
- **Fix:** Removed unused imports, kept only useEffect
- **Files modified:** src/lib/swipe-gestures/utils.ts
- **Verification:** pnpm typecheck passes
- **Committed in:** 0792ead (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial unused import cleanup. No scope creep.

## Issues Encountered
- `pnpm build` fails due to Google Fonts fetch failure (network issue in CI environment) -- confirmed pre-existing, unrelated to changes. Typecheck and lint both pass clean.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 lib files successfully split into subfolders
- Codebase ready for 46-07 (final verification/cleanup plan)
- No blockers or concerns

---
*Phase: 46-large-file-refactoring*
*Completed: 2026-02-06*
