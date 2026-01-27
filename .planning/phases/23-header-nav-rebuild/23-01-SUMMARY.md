---
phase: 23-header-nav-rebuild
plan: 01
subsystem: ui
tags: [framer-motion, cmdk, scroll-velocity, header, command-palette]

# Dependency graph
requires:
  - phase: 22-customer-page-polish
    provides: Motion tokens (spring.snappy), animation patterns
provides:
  - useScrollDirectionWithVelocity hook with velocity-aware scroll detection
  - useHeaderVisibility hook combining scroll state with overlay pinning
  - useCommandPalette hook with Cmd/Ctrl+K keyboard shortcut
  - getHeaderTransition helper for velocity-based animation timing
  - cmdk library for command palette UI
affects: [23-02, 23-03, header-components, command-palette]

# Tech tracking
tech-stack:
  added: [cmdk@1.1.1]
  patterns: [velocity-aware-scroll, overlay-pinning, keyboard-shortcuts]

key-files:
  created:
    - src/lib/hooks/useScrollDirectionWithVelocity.ts
    - src/lib/hooks/useHeaderVisibility.ts
    - src/lib/hooks/useCommandPalette.ts
  modified:
    - src/lib/hooks/index.ts
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Use framer-motion useVelocity for scroll velocity detection (integrates with springs)"
  - "Velocity threshold 300px/s distinguishes fast vs slow scrolling"
  - "Overlay open pins header visible and resets isCollapsed to false"
  - "Cmd/Ctrl+K shortcut uses capture phase to fire before browser handlers"

patterns-established:
  - "Velocity-aware scroll: useVelocity(scrollY) from framer-motion for physics-based velocity"
  - "getHeaderTransition helper: isFastScroll ? { duration: 0.1 } : spring.snappy"
  - "Overlay pinning: When overlayOpen=true, header always visible, isCollapsed=false"
  - "Keyboard shortcut capture: addEventListener with { capture: true } for priority"

# Metrics
duration: 8min
completed: 2026-01-26
---

# Phase 23 Plan 01: Infrastructure Hooks Summary

**Velocity-aware scroll hooks using framer-motion useVelocity, header visibility with overlay pinning, and Cmd/Ctrl+K command palette trigger**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-26T~10:00Z
- **Completed:** 2026-01-26T~10:08Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments
- Velocity-aware scroll detection distinguishing fast (>300px/s) vs slow scrolling
- Header visibility hook that pins header when overlays are open
- Command palette keyboard shortcut (Cmd/Ctrl+K) with browser conflict prevention
- All hooks exported with TypeScript types from hooks/index.ts
- cmdk library installed for command palette UI (used in later plans)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install cmdk and create velocity-aware scroll hook** - `1c52305` (feat)
2. **Task 2: Create header visibility and command palette hooks** - `dce6149` (feat)

## Files Created/Modified

- `src/lib/hooks/useScrollDirectionWithVelocity.ts` - Velocity-aware scroll detection using framer-motion useVelocity
- `src/lib/hooks/useHeaderVisibility.ts` - Combined scroll state + overlay pinning logic
- `src/lib/hooks/useCommandPalette.ts` - Cmd/Ctrl+K keyboard shortcut handler
- `src/lib/hooks/index.ts` - Barrel exports for new hooks and types
- `package.json` - Added cmdk@1.1.1 dependency
- `pnpm-lock.yaml` - Lockfile updated

## Decisions Made

1. **Velocity via framer-motion** - Used useVelocity from framer-motion rather than manual calculation; integrates seamlessly with existing spring tokens and provides optimized physics-based velocity
2. **300px/s threshold** - Chose 300px/s as velocity threshold based on research; feels responsive without triggering on casual scrolling
3. **Capture phase for keyboard** - Used { capture: true } on keydown listener to catch Cmd+K before browser default handlers (some browsers use for search bar)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Minor unused import (`useCallback`) in initial velocity hook - removed before commit

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Infrastructure hooks complete and exported
- Ready for 23-02 (Header Components) to consume these hooks
- cmdk installed and ready for CommandPalette component implementation
- Hooks provide all necessary state for velocity-aware hide/show animations

---
*Phase: 23-header-nav-rebuild*
*Completed: 2026-01-26*
