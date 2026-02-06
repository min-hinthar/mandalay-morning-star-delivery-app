---
phase: 31-hero-redesign
plan: 05
subsystem: ui
tags: [hero, tagline, scroll-indicator, accessibility, chevron, polish]

# Dependency graph
requires:
  - phase: 31-03
    provides: "Floating emojis and gradient orbs, hero layer structure"
  - phase: 31-04
    provides: "Shimmer animation, theme transitions, CTA polish"
provides:
  - Tagline subtitle below headline with fade animation
  - Scroll indicator using ChevronDown with bounce animation
  - Smooth scroll to how-it-works section on click
  - Accessibility attributes on scroll indicator (role, aria-label)
  - Legacy gradient token cleanup verified
affects: [phase-31-complete, hero-finalization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ChevronDown icon for scroll indicators"
    - "Scroll to anchor via getElementById + scrollIntoView"

key-files:
  created: []
  modified:
    - "src/components/ui/homepage/Hero.tsx"

key-decisions:
  - "Tagline default: 'Authentic Burmese delivered' - concise brand statement"
  - "Scroll indicator gap reduced from gap-2 to gap-1 for tighter visual"
  - "ChevronDown icon replaces custom SVG arrow for consistency with lucide-react"

patterns-established:
  - "tagline prop: Optional subtitle below main headline"
  - "Scroll indicator: ChevronDown + bounce + smooth scroll + a11y"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 31 Plan 05: Final Polish Summary

**Tagline subtitle, ChevronDown scroll indicator with smooth scroll-to-anchor, and legacy gradient cleanup verified complete**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28T13:55:44Z
- **Completed:** 2026-01-28T14:06:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Tagline "Authentic Burmese delivered" renders below headline with 0.5s delay fade animation
- Scroll indicator uses ChevronDown icon with 2s infinite bounce animation
- Clicking scroll indicator smooth scrolls to how-it-works section
- Scroll indicator has role="button" and aria-label for accessibility
- Zero legacy --hero-gradient-* tokens in Hero.tsx (verified via grep)
- All hero gradients use semantic --hero-bg-* tokens
- Hero content properly centered with justify-center

## Task Commits

Code changes for this plan were incorporated into the prior session's working tree and committed as part of plan 31-04 commits:

1. **Task 1: Add tagline and update scroll indicator** - Included in `f01e911` (31-04)
2. **Task 2: Remove legacy gradient references** - Already clean, verified via grep
3. **Task 3: Ensure full viewport visibility** - Already correct, verified via code review

**Note:** The tagline and ChevronDown changes were saved to the working tree before 31-04 execution began and were committed alongside 31-04 changes. This plan verifies completeness and creates documentation.

## Files Created/Modified
- `src/components/ui/homepage/Hero.tsx` - Added tagline prop, ChevronDown import, scroll indicator with onClick/a11y

## Decisions Made
- **Tagline text:** "Authentic Burmese delivered" - concise, memorable brand tagline
- **Scroll indicator gap:** Reduced from gap-2 to gap-1 for tighter vertical spacing
- **Icon choice:** ChevronDown from lucide-react for consistency with existing icon imports

## Deviations from Plan
None - all requirements already met in codebase. Plan execution was verification-focused.

## Issues Encountered
- Build verification blocked by locked .next cache from running dev server - typecheck confirmed code validity
- Pre-existing ESLint violations (not from this plan) - 83 errors from prior phases

## Next Phase Readiness
- Hero redesign phase (31) complete with all 5 plans executed
- All HERO-01 through HERO-07 requirements satisfied:
  - HERO-01: Hero section visible without cutoff (100svh/100dvh units)
  - HERO-02: Warm gradient tokens (--hero-bg-start/mid/end)
  - HERO-03: Floating emojis with depth effects
  - HERO-04: Gradient orbs with parallax
  - HERO-05: Tagline positioned below headline
  - HERO-06: Scroll indicator with bounce animation
  - HERO-07: Legacy gradient code removed
- Ready to mark Phase 31 as complete

---
*Phase: 31-hero-redesign*
*Completed: 2026-01-28*
