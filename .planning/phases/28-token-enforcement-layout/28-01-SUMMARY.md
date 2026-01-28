---
phase: 28-token-enforcement-layout
plan: 01
subsystem: ui
tags: [eslint, tailwind, typography, spacing, design-tokens]

# Dependency graph
requires:
  - phase: 27-token-enforcement-colors
    provides: ESLint token enforcement infrastructure
provides:
  - text-2xs typography token (10px with line-height 1.4)
  - ESLint rules for arbitrary font sizes (text-[Npx])
  - ESLint rules for arbitrary spacing (m-[Npx], p-[Npx], gap-[Npx])
  - ESLint rules for inline fontSize/fontWeight
affects: [28-02, 28-03, typography-migration, spacing-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [typography-tokens, spacing-token-enforcement]

key-files:
  created: []
  modified:
    - src/styles/tokens.css
    - tailwind.config.ts
    - eslint.config.mjs

key-decisions:
  - "text-2xs token set at 0.625rem (10px) with line-height 1.4 and letter-spacing 0.01em"
  - "ESLint rules catch arbitrary px values but allow CSS variable arbitrary values"

patterns-established:
  - "Typography scale: text-2xs (10px), text-xs (12px), text-sm (14px), text-base (16px), etc."
  - "ESLint enforces semantic spacing over arbitrary pixel values"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 28 Plan 01: Token Foundation and Layout Enforcement Summary

**text-2xs token (10px) and ESLint rules enforcing semantic typography/spacing over arbitrary pixel values**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28T10:00:00Z
- **Completed:** 2026-01-28T10:05:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added text-2xs token to tokens.css (0.625rem / 10px with appropriate line-height)
- Mapped text-2xs utility in tailwind.config.ts with CSS variable references
- Added ESLint rules catching arbitrary font sizes (text-[Npx])
- Added ESLint rules catching arbitrary margin/padding/gap values (m-[Npx], p-[Npx], gap-[Npx])
- Added ESLint rules for inline fontSize and fontWeight in style objects

## Task Commits

Each task was committed atomically:

1. **Task 1: Add text-2xs typography token** - `ebea6bd` (feat)
2. **Task 2: Add ESLint rules for layout token enforcement** - `85fb3ad` (feat)

## Files Created/Modified

- `src/styles/tokens.css` - Added --text-2xs, --text-2xs--line-height, --text-2xs--letter-spacing tokens
- `tailwind.config.ts` - Added 2xs fontSize mapping with CSS variable references
- `eslint.config.mjs` - Added 12 no-restricted-syntax rules for typography and spacing enforcement

## Decisions Made

1. **text-2xs specifications**: Set at 0.625rem (10px) with line-height 1.4 and letter-spacing 0.01em - balances small size readability
2. **ESLint rule scope**: Rules catch pixel-based arbitrary values but allow CSS variable arbitrary values (e.g., `top-[var(--header-height)]` is OK)
3. **Position utilities excluded**: Rules don't catch position utilities like `top-[72px]` as position is semantically different from spacing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both tasks completed without issues. Verification confirmed:
- Typecheck passes
- ESLint runs and correctly identifies violations (existing violations in codebase expected)
- Build passes

## Next Phase Readiness

- Infrastructure ready for 28-02 (typography migration)
- ESLint will flag all text-[Npx] violations for migration
- text-2xs token available for 10px use cases (badges, cart indicators, etc.)

---
*Phase: 28-token-enforcement-layout*
*Completed: 2026-01-28*
