---
phase: 01-foundation-token-system
plan: 03
subsystem: ui
tags: [eslint, stylelint, z-index, linting, design-system, documentation]

# Dependency graph
requires:
  - phase: 01-01
    provides: Z-index tokens in CSS and TypeScript
provides:
  - ESLint rules catching hardcoded z-index in JSX at error severity
  - Stylelint rules catching hardcoded z-index in CSS
  - Stacking context documentation with usage patterns
affects: [ui-components, modal-system, toast-system, dropdown-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESLint no-restricted-syntax for design token enforcement"
    - "Stylelint declaration-property-value-disallowed-list for CSS variable enforcement"

key-files:
  created:
    - docs/STACKING-CONTEXT.md
  modified:
    - eslint.config.mjs
    - .stylelintrc.json

key-decisions:
  - "Upgrade ESLint z-index rules from warn to error severity (fails build)"
  - "Use built-in Stylelint rules instead of incompatible plugin"
  - "Allow z-index values -1 and 1 as valid exceptions for internal stacking"

patterns-established:
  - "ESLint error messages reference documentation files"
  - "Stylelint enforces CSS variable usage for design tokens"

# Metrics
duration: 8min
completed: 2026-01-22
---

# Phase 01 Plan 03: Z-Index Linting Enforcement Summary

**ESLint and Stylelint rules that error on hardcoded z-index values with comprehensive stacking context documentation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-22T08:46:00Z
- **Completed:** 2026-01-22T08:54:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- ESLint catches z-[number], z-0 through z-100, and inline zIndex at error severity
- Stylelint catches hardcoded z-index values in CSS files
- Comprehensive stacking context documentation with usage patterns and troubleshooting

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance ESLint z-index rules** - `612c249` (feat)
2. **Task 2: Add Stylelint z-index enforcement** - `dcd87f4` (feat)
3. **Task 3: Document stacking context rules** - `c037f03` (docs)

## Files Created/Modified

- `eslint.config.mjs` - Comprehensive z-index rules at error severity, added .claude/hooks to ignores
- `.stylelintrc.json` - declaration-property-value-disallowed-list rule for z-index
- `docs/STACKING-CONTEXT.md` - 160-line documentation with token table, usage patterns, isolation boundaries

## Decisions Made

- **Upgraded ESLint severity from warn to error:** Build now fails on hardcoded z-index values
- **Used built-in Stylelint rule:** stylelint-declaration-use-variable plugin incompatible with Stylelint 17, used declaration-property-value-disallowed-list instead
- **Allowed -1 and 1 exceptions:** Per plan, these are valid for internal component stacking
- **Added .claude/hooks to ESLint ignores:** CommonJS config files were causing unrelated errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced incompatible Stylelint plugin**
- **Found during:** Task 2 (Stylelint configuration)
- **Issue:** stylelint-declaration-use-variable plugin has peer dependency on Stylelint 13, incompatible with project's Stylelint 17
- **Fix:** Used built-in declaration-property-value-disallowed-list rule instead
- **Files modified:** .stylelintrc.json, package.json
- **Verification:** lint:css catches z-index: 50; allows var(--z-modal)
- **Committed in:** dcd87f4

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Alternative approach achieves same result. No scope creep.

## Issues Encountered

- Pre-existing z-index violations in legacy codebase detected by new rules - expected behavior, legacy code will need migration

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Z-index token system complete: tokens (01-01), GSAP integration (01-02), linting enforcement (01-03)
- Build now fails on hardcoded z-index values
- Documentation provides clear guidance for developers
- Phase 1 Foundation & Token System complete

---
*Phase: 01-foundation-token-system*
*Completed: 2026-01-22*
