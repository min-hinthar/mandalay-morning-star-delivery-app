---
phase: 29-token-enforcement-effects
plan: 01
subsystem: ui
tags: [design-tokens, shadows, blur, tailwind, eslint]

# Dependency graph
requires:
  - phase: 27-token-enforcement-colors
    provides: color token infrastructure and ESLint patterns
  - phase: 28-token-enforcement-typography
    provides: typography token enforcement patterns
provides:
  - complete shadow token scale (xs through 2xl, none, inner, color, focus)
  - blur tokens (none, sm, md, lg, xl, 2xl, 3xl)
  - Tailwind utilities for all new tokens
  - ESLint rules for shadow and blur enforcement
  - enhanced audit-tokens.js detection
affects: [29-02-effects-migration, future-shadow-usage, future-blur-usage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - shadow tokens with dark mode glow variants
    - colored shadows for brand emphasis
    - blur tokens with CSS variable references

key-files:
  created: []
  modified:
    - src/styles/tokens.css
    - tailwind.config.ts
    - eslint.config.mjs
    - scripts/audit-tokens.js

key-decisions:
  - "shadow-xs uses subtle primary color tint for brand consistency"
  - "blur tokens same values in light/dark mode"
  - "ESLint boxShadow rule notes Framer Motion exception for animation interpolation"
  - "blur-[Npx] severity upgraded from info to warning"

patterns-established:
  - "Colored shadows (shadow-primary/success/warning/error) for button emphasis"
  - "Focus shadows for input states (shadow-focus, shadow-focus-success/error)"
  - "Inner shadows for pressed states (shadow-inner-sm/md)"
  - "Nav-top shadow for bottom navigation elements"

# Metrics
duration: 8min
completed: 2026-01-27
---

# Phase 29 Plan 01: Shadow and Blur Tokens Infrastructure Summary

**Complete shadow token scale with color variants, blur tokens, Tailwind mappings, and ESLint enforcement rules**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27
- **Completed:** 2026-01-27
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added 16 new shadow tokens including xs, none, inner-*, color variants, focus states, and text shadows
- Added 7 blur tokens (none through 3xl) with CSS variable references
- Mapped all new tokens to Tailwind utilities (shadow-xs, backdrop-blur-lg, etc.)
- Created ESLint rules catching inline boxShadow and backdropFilter with hardcoded values
- Enhanced audit-tokens.js to detect shadow/blur violations with appropriate severity

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shadow and blur tokens to tokens.css** - `6f8d092` (feat)
2. **Task 2: Map tokens in Tailwind and add ESLint rules** - `a514156` (feat)
3. **Task 3: Update audit-tokens.js with enhanced detection** - `56299cc` (feat)

## Files Created/Modified
- `src/styles/tokens.css` - Added 16 shadow tokens + 7 blur tokens for both light and dark mode
- `tailwind.config.ts` - Mapped all new shadow utilities + added backdropBlur section
- `eslint.config.mjs` - Added 3 ESLint rules for boxShadow/backdropFilter/filter enforcement
- `scripts/audit-tokens.js` - Enhanced effects detection with inline pattern matching and fix suggestions

## Decisions Made
- Shadow-xs uses subtle primary color tint (rgba(164, 16, 52, 0.03)) for brand consistency
- Blur tokens use same pixel values in light and dark mode (blur is not theme-dependent)
- ESLint boxShadow rule explicitly notes Framer Motion exception for animation interpolation
- Upgraded blur-[Npx] severity from info to warning for stricter enforcement

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Token infrastructure complete for shadow and blur values
- ESLint rules active and catching violations (40+ shadow-[...] patterns detected)
- Ready for 29-02 migration of existing hardcoded shadows/blur values
- Audit baseline established for tracking migration progress

---
*Phase: 29-token-enforcement-effects*
*Completed: 2026-01-27*
