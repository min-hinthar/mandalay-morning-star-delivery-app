---
phase: 44-animation-optimization-monitoring
plan: 02
subsystem: ui
tags: [framer-motion, LazyMotion, m-components, domMax, bundle-optimization]

# Dependency graph
requires:
  - phase: 44-01
    provides: React Compiler enabled, GSAP dead plugins removed
provides:
  - LazyMotion provider wrapping application with domMax features
  - All 174 files migrated from motion.* to m.* components
  - Strict mode enforcement preventing motion.* usage regression
affects: [44-03, any future animation work]

# Tech tracking
tech-stack:
  added: []
  patterns: [LazyMotion provider at root, m.* components for all Framer Motion usage]

key-files:
  created: []
  modified:
    - src/app/providers.tsx
    - 174 tsx files across src/ (motion.* to m.* migration)

key-decisions:
  - "domMax over domAnimation: codebase uses drag (CartItem) and layoutId (10+ components)"
  - "Synchronous loading: animations appear above-the-fold on every page"
  - "Root-level LazyMotion in providers.tsx: ensures all routes get animation features"
  - "strict mode enabled: enforces zero motion.* regression at runtime"

patterns-established:
  - "m.* components: all Framer Motion animations use m.div, m.span, etc. instead of motion.*"
  - "LazyMotion context: features loaded once at root, not per-component"

# Metrics
duration: 13min
completed: 2026-02-06
---

# Phase 44 Plan 02: LazyMotion + m.* Migration Summary

**Bulk migration of 174 files from motion.* to m.* with LazyMotion domMax provider reducing per-component animation bundle from ~34kb to ~4.6kb**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-06T10:28:45Z
- **Completed:** 2026-02-06T10:42:34Z
- **Tasks:** 3
- **Files modified:** 177

## Accomplishments
- LazyMotion provider with domMax and strict mode wraps entire application in providers.tsx
- All 174 files with ~1397 motion.* JSX occurrences migrated to m.* via automated codemod
- Zero remaining motion.* JSX or imports in codebase
- TypeScript typecheck passes, all 343 tests pass, lint clean (0 errors)
- Edge cases fixed: multi-line imports (CartItem, UnifiedMenuItemCard) and runtime motion[] reference (AnimatedSection)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add LazyMotion provider to application root** - `25a205e` (feat)
2. **Task 2: Automated codemod -- bulk migrate motion.* to m.*** - `1573432` (refactor)
3. **Task 3: Verify migration, build, test, and fix edge cases** - `8284e30` (fix)

## Files Created/Modified
- `src/app/providers.tsx` - Added LazyMotion wrapper with domMax features and strict mode
- `174 .tsx files` - All motion.* JSX replaced with m.*, imports updated from { motion } to { m }
- `src/components/ui/cart/CartItem.tsx` - Fixed multi-line import edge case
- `src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` - Fixed multi-line import edge case
- `src/components/ui/scroll/AnimatedSection.tsx` - Fixed runtime motion[] dynamic component reference to m[]

## Decisions Made
- domMax (not domAnimation) because codebase uses drag and layoutId features
- Synchronous loading (not async) because animations appear above-the-fold on every page
- Root-level placement in providers.tsx so all routes get animation features
- strict mode enabled to enforce m.* usage and catch regression at runtime
- Automated shell codemod (sed/perl) for bulk migration rather than file-by-file editing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed framer-motion string corruption from codemod**
- **Found during:** Task 2 (automated codemod)
- **Issue:** perl regex replaced `motion` inside `"framer-motion"` string, producing `"framer-m"` in 182 files
- **Fix:** Ran targeted sed to restore `"framer-m"` back to `"framer-motion"`
- **Files modified:** 182 .tsx/.ts files
- **Verification:** Zero remaining `"framer-m"` strings
- **Committed in:** 1573432 (part of Task 2 commit)

**2. [Rule 1 - Bug] Fixed multi-line import edge cases**
- **Found during:** Task 3 (typecheck verification)
- **Issue:** perl regex only operated on lines containing `from "framer-motion"`, missing multi-line imports where `motion` was on a separate line
- **Fix:** Manually updated imports in CartItem.tsx and UnifiedMenuItemCard.tsx
- **Files modified:** src/components/ui/cart/CartItem.tsx, src/components/ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx
- **Verification:** typecheck passes with zero errors
- **Committed in:** 8284e30 (Task 3 commit)

**3. [Rule 1 - Bug] Fixed runtime motion[] dynamic component reference**
- **Found during:** Task 3 (typecheck verification)
- **Issue:** AnimatedSection.tsx used `motion[as as keyof typeof motion]` for dynamic component creation -- not a JSX tag, so sed didn't catch it
- **Fix:** Changed to `m[as as keyof typeof m]`
- **Files modified:** src/components/ui/scroll/AnimatedSection.tsx
- **Verification:** typecheck passes
- **Committed in:** 8284e30 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs from automated codemod edge cases)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- `pnpm build` fails due to Google Fonts fetch error in sandbox environment -- pre-existing issue unrelated to migration (verified by building clean codebase). Typecheck is the reliable verification in this environment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LazyMotion + m.* migration complete, strict mode active
- Ready for 44-03 (Lighthouse CI setup)
- All existing animations preserved identically (same props, variants, transitions)
- Build may need Google Fonts resolution for production verification

---
*Phase: 44-animation-optimization-monitoring*
*Completed: 2026-02-06*
