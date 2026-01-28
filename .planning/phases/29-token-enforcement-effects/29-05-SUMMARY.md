---
phase: 29-token-enforcement-effects
plan: 05
subsystem: ui
tags: [blur, motion, eslint, tokens, audit]

requires:
  - phase: 29-01
    provides: Blur token infrastructure (--blur-2xl)
  - phase: 29-04
    provides: Shadow migration completion
provides:
  - AppHeader using blur(var(--blur-2xl)) token
  - ESLint rules for motion timing enforcement
  - Enhanced audit-tokens.js with motion timing detection
affects: [29-06, future motion timing migration]

tech-stack:
  added: []
  patterns:
    - "ESLint no-restricted-syntax for motion timing"
    - "Audit script pattern detection for durations"

key-files:
  created: []
  modified:
    - src/components/ui/layout/AppHeader/AppHeader.tsx
    - eslint.config.mjs
    - scripts/audit-tokens.js

key-decisions:
  - "duration-[Nms] upgraded from info to warning severity for Phase 29 enforcement"
  - "Framer Motion spring physics numeric values explicitly allowed in ESLint messages"
  - "ease-[...] detection at info level (not blocking)"

patterns-established:
  - "Glass styles use blur(var(--blur-2xl)) token"
  - "Motion timing via var(--duration-*) CSS variables"

duration: 8min
completed: 2026-01-28
---

# Phase 29 Plan 05: Motion Timing Gap Closure Summary

**AppHeader blur tokenized to --blur-2xl, ESLint motion timing rules added, audit script enhanced with duration/delay detection**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T00:00:00Z
- **Completed:** 2026-01-28T00:08:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Fixed AppHeader blur inconsistency: blur(30px) replaced with blur(var(--blur-2xl))
- Added 4 ESLint rules detecting hardcoded transitionDuration, transition ms values, duration-[Nms], delay-[Nms]
- Enhanced audit-tokens.js with 6 new motion timing patterns and fix suggestions
- duration-[Nms] upgraded from info to warning severity for enforcement

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix AppHeader blur token usage** - `88e212f` (fix)
2. **Task 2: Add motion timing ESLint rules** - `70db424` (chore)
3. **Task 3: Enhance audit-tokens.js with motion timing detection** - `8dac91b` (feat)

## Files Created/Modified
- `src/components/ui/layout/AppHeader/AppHeader.tsx` - Replaced blur(30px) with blur(var(--blur-2xl)) in glass styles
- `eslint.config.mjs` - Added 4 motion timing detection rules
- `scripts/audit-tokens.js` - Added 6 motion timing patterns with fix suggestions

## Decisions Made
- **duration-[Nms] severity upgrade:** Changed from info to warning to enforce motion token usage during Phase 29
- **Framer Motion exception:** ESLint messages explicitly note that spring physics require numeric values
- **ease-[...] at info level:** Easing arbitrary values detected but not blocking (lower priority than duration)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Motion timing infrastructure ready for migration work in 29-06
- ESLint catches new violations at lint time
- Audit script reports motion timing in effects category
- Baseline improved: 30 violations fixed from previous run

---
*Phase: 29-token-enforcement-effects*
*Completed: 2026-01-28*
