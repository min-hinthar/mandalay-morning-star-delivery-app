---
phase: 19-homepage-redesign
plan: 02
subsystem: ui
tags: [framer-motion, scroll-animation, carousel, testimonials, how-it-works]

# Dependency graph
requires:
  - phase: 19-01
    provides: AnimatedSection wrapper with itemVariants export
  - phase: 16-3d-hero
    provides: useAnimationPreference hook for reduced motion support
provides:
  - HowItWorksSection component with 4 animated steps
  - TestimonialsCarousel with auto-rotation and pause-on-hover
  - Continuous floating icon animation pattern
  - Drawing connector line animation pattern
affects: [19-04, 19-05, homepage-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Continuous floating animation with y/rotate transforms
    - Connector line drawing with scaleX/scaleY and transformOrigin
    - Auto-rotation carousel with pause-on-hover/focus
    - Staggered star rating animation

key-files:
  created:
    - src/components/homepage/HowItWorksSection.tsx
    - src/components/homepage/TestimonialsCarousel.tsx

key-decisions:
  - "Floating animation uses y: [-8, 0] and rotate: [2, 0] for subtle motion"
  - "Connector lines use scaleX/scaleY with transformOrigin for drawing effect"
  - "TestimonialsCarousel pauses on both hover and focus for accessibility"
  - "Reduced motion disables auto-rotation but keeps manual dot navigation"

patterns-established:
  - "Continuous icon float: animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }} with 4+ second duration"
  - "Drawing connector: scaleX: 0 -> 1 with transformOrigin: left on whileInView"
  - "Carousel auto-rotation: setInterval with isPaused state toggle on mouseEnter/Leave and focus/blur"
  - "Avatar initials: name.split(' ').map(p => p[0]).join('') with consistent color from charCode"

# Metrics
duration: 8min
completed: 2026-01-25
---

# Phase 19 Plan 02: How It Works Section & Testimonials Carousel Summary

**How It Works section with 4 animated floating-icon steps and auto-rotating Testimonials carousel with pause-on-hover**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-25T06:39:31Z
- **Completed:** 2026-01-25T06:47:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- HowItWorksSection with 4 steps: Check Coverage, Order, Track, Enjoy with floating icon animations
- Connector lines that draw on scroll between steps with gradient colors
- Desktop horizontal / Mobile vertical responsive layout
- TestimonialsCarousel with 5 testimonials, auto-rotation every 5s, pause on hover/focus
- Star rating with staggered animation and clickable dot navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HowItWorksSection Component** - `8909568` (feat)
2. **Task 2: Create TestimonialsCarousel Component** - `0542eda` (feat)

## Files Created/Modified

- `src/components/homepage/HowItWorksSection.tsx` - 4-step How It Works section with floating icons and drawing connectors (258 lines)
- `src/components/homepage/TestimonialsCarousel.tsx` - Auto-rotating testimonials carousel with pause-on-hover (313 lines)

## Decisions Made

- **Floating animation timing:** 4 + index * 0.5 seconds for varied motion across icons
- **Connector gradient:** Different gradient for each connector (primary->secondary, secondary->green, green->orange)
- **Testimonial auto-rotation:** 5 seconds default, configurable via prop
- **Reduced motion behavior:** Auto-rotation disabled, manual dot navigation preserved

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both components implemented without blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HowItWorksSection ready for homepage integration in Plan 04/05
- TestimonialsCarousel ready for homepage integration
- Both components use AnimatedSection wrapper from 19-01
- Components use itemVariants for staggered child reveals

---

*Phase: 19-homepage-redesign*
*Completed: 2026-01-25*
