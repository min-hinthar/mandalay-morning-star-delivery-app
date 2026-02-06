---
phase: 19-homepage-redesign
plan: 03
subsystem: ui
tags: [framer-motion, scroll-animation, cta-banner, footer, staggered-reveal]

# Dependency graph
requires:
  - phase: 19-01
    provides: AnimatedSection wrapper, useAnimationPreference hook
provides:
  - CTABanner component with floating entrance and pulsing glow
  - Enhanced FooterCTA with staggered column reveals
affects: [19-04, homepage-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Custom column variants with indexed delay for stagger effect
    - Infinite pulsing glow animation with conditional rendering
    - whileInView with viewport.once: false for always-replay

key-files:
  created:
    - src/components/homepage/CTABanner.tsx
  modified:
    - src/components/homepage/FooterCTA.tsx

key-decisions:
  - "CTABanner uses isFullMotion check to conditionally render pulsing glow"
  - "Footer columns use custom prop with indexed delay (0, 100ms, 200ms)"
  - "Copyright fades in last with 400ms delay after columns"
  - "All scroll animations replay on re-entry (viewport.once: false)"

patterns-established:
  - "Pulsing glow: infinite boxShadow animation with 3-keyframe array"
  - "Indexed stagger: custom={index} with columnVariants for per-column delay"
  - "Staggered container: staggerContainer(0.08, 0.1) from motion-tokens"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 19 Plan 03: CTA Banner & Footer Animation Summary

**Promotional CTA banner with floating entrance animation and pulsing glow border, plus enhanced footer with staggered column reveals**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T06:39:37Z
- **Completed:** 2026-01-25T06:42:47Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- CTABanner component with floating up entrance animation (y: 40 -> 0) and shadow increase
- Pulsing gold glow border on CTABanner (infinite 2s cycle, disabled on reduced motion)
- FooterCTA top section: staggered badge -> headline -> subtext -> buttons reveal
- FooterCTA columns: Contact (0ms) -> Hours (100ms) -> Social (200ms) staggered reveal
- Copyright line fades in last (400ms delay)
- Replaced all v6 motion imports with motion-tokens equivalents

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CTABanner Component** - `04ff1b4` (feat)
2. **Task 2: Enhance FooterCTA with Staggered Animations** - `680d640` (feat)

## Files Created/Modified

- `src/components/homepage/CTABanner.tsx` - New promotional banner with floating entrance, pulsing glow, promo badge, headline, CTA button to /menu
- `src/components/homepage/FooterCTA.tsx` - Enhanced with staggered column reveals, replaced v6 imports with motion-tokens

## Decisions Made

- **Pulsing glow conditional:** Only render glow animation when `isFullMotion` is true (respects reduced motion)
- **Column stagger pattern:** Use `custom={index}` with columnVariants instead of staggerContainer for independent column animations
- **CTA button approach:** Used Link + motion.a instead of Button component (no custom Button exists in codebase)
- **All animations replay:** viewport.once: false per CONTEXT decision for engaging scroll experience

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components implemented without blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CTABanner ready for homepage integration in Plan 04
- FooterCTA enhanced and ready for homepage integration
- Both components follow established motion patterns from 19-01

---

*Phase: 19-homepage-redesign*
*Completed: 2026-01-25*
