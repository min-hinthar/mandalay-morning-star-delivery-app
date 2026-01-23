---
phase: 13-legacy-removal-stricter-rules
plan: 06
subsystem: tooling
tags: [eslint, z-index, design-tokens, barrel-files, cleanup]

# Dependency graph
requires:
  - phase: 13-05
    provides: TypeScript strict flags enabled
  - phase: 11
    provides: Direct V8 imports (v7-index barrels unused)
provides:
  - ESLint z-index rule at error severity
  - 10 legacy v7-index.ts barrel files deleted
  - Hardcoded z-index now build errors
affects: [future-z-index-work, design-tokens]

# Tech tracking
tech-stack:
  added: []
  patterns: [z-index-tokens-enforced, direct-imports-only]

key-files:
  modified:
    - eslint.config.mjs
    - src/components/ui-v8/Modal.tsx
    - src/components/homepage/FloatingFood.tsx
    - src/components/homepage/Hero.tsx
  deleted:
    - src/components/admin/v7-index.ts
    - src/components/cart/v7-index.ts
    - src/components/checkout/v7-index.ts
    - src/components/driver/v7-index.ts
    - src/components/homepage/v7-index.ts
    - src/components/layout/v7-index.ts
    - src/components/layouts/v7-index.ts
    - src/components/menu/v7-index.ts
    - src/components/tracking/v7-index.ts
    - src/components/ui/v7-index.ts

key-decisions:
  - "ESLint z-index at error severity prevents regression"
  - "Local stacking contexts (isolate) exempt from z-index rule"
  - "v7-index.ts files safe to delete (zero imports verified)"

patterns-established:
  - "z-index: Use tokens (z-modal, z-dropdown) or document local stacking"
  - "Barrel files: Direct imports only, no legacy barrels"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 13 Plan 06: ESLint Z-Index Upgrade & Legacy Barrel Cleanup Summary

**ESLint z-index rule upgraded to error severity with local stacking exemptions; 10 orphaned v7-index.ts barrel files deleted (366 lines removed)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-23T13:08:30Z
- **Completed:** 2026-01-23T13:16:25Z
- **Tasks:** 2
- **Files modified:** 4 files modified, 10 files deleted

## Accomplishments

- ESLint z-index rule upgraded from "warn" to "error" - hardcoded z-index now fails build
- Fixed real violation in Modal.tsx: z-10 -> z-dropdown
- Added ESLint disable comments for legitimate local stacking contexts (FloatingFood, Hero)
- Deleted 10 orphaned v7-index.ts barrel files (366 lines of dead code)

## Task Commits

1. **Task 1: Fix z-index violations and upgrade ESLint rule** - `d3c61ac` (feat)
2. **Task 2: Delete v7-index.ts files and final verification** - `1fdefd7` (chore)

## Files Created/Modified

**Modified:**
- `eslint.config.mjs` - z-index rule upgraded to error severity
- `src/components/ui-v8/Modal.tsx` - z-10 -> z-dropdown
- `src/components/homepage/FloatingFood.tsx` - ESLint disable for local stacking (zIndex 1-4)
- `src/components/homepage/Hero.tsx` - ESLint disable for isolate local stacking (zIndex 1-4)

**Deleted:**
- `src/components/admin/v7-index.ts`
- `src/components/cart/v7-index.ts`
- `src/components/checkout/v7-index.ts`
- `src/components/driver/v7-index.ts`
- `src/components/homepage/v7-index.ts`
- `src/components/layout/v7-index.ts`
- `src/components/layouts/v7-index.ts`
- `src/components/menu/v7-index.ts`
- `src/components/tracking/v7-index.ts`
- `src/components/ui/v7-index.ts`

## Decisions Made

- **Local stacking exempt from rule:** Components using `isolate` class create local stacking contexts where zIndex 1-4 are appropriate. Added ESLint disable with documentation rather than forcing token usage.
- **Hero.tsx uses block disable:** JSX eslint-disable-next-line doesn't apply to attributes on separate lines; used block disable with enable after opening tag.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Build verification:** Google Fonts fetch failure in sandboxed environment (documented infrastructure issue in STATE.md). Lint and typecheck both pass, confirming code changes are correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 13 Complete:**
- All 6 plans executed
- TypeScript strict flags enabled (noUnusedLocals, noUnusedParameters)
- ESLint z-index rule at error severity
- 10 legacy barrel files deleted
- Codebase ready for Phase 14: Testing & Documentation

**Verification status:**
- pnpm lint: 0 errors, 2 warnings (unrelated to z-index)
- pnpm typecheck: Pass
- pnpm build: Network issue (Google Fonts), not code issue

---
*Phase: 13-legacy-removal-stricter-rules*
*Completed: 2026-01-23*
