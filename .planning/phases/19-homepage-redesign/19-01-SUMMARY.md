---
phase: 19-homepage-redesign
plan: 01
subsystem: ui
tags: [framer-motion, scroll-animation, video-player, intersection-observer, react-hooks]

# Dependency graph
requires:
  - phase: 16-3d-hero
    provides: useAnimationPreference hook for motion preferences
  - phase: 15-z-index
    provides: zClass token system for layering
provides:
  - HeroVideo component with IntersectionObserver pause/play
  - AnimatedSection wrapper with always-replay scroll animation
  - SectionNavDots side navigation component
  - Enhanced useScrollSpy hook with IntersectionObserver
  - itemVariants export for staggered child animations
affects: [19-02, 19-03, 19-04, 19-05, homepage-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IntersectionObserver-based scroll spy (replaces scroll listener)
    - useInView from framer-motion for visibility detection
    - Polymorphic component with motion support (as prop)

key-files:
  created:
    - src/components/homepage/HeroVideo.tsx
    - src/components/scroll/AnimatedSection.tsx
    - src/components/scroll/SectionNavDots.tsx
  modified:
    - src/lib/hooks/useScrollSpy.ts

key-decisions:
  - "useScrollSpy returns index instead of id for simpler integration"
  - "AnimatedSection uses viewport.once: false for always-replay behavior"
  - "SectionNavDots hidden on mobile, visible on md+ breakpoint"
  - "HeroVideo uses useInView with 30% threshold for pause/play"

patterns-established:
  - "IntersectionObserver scroll spy: rootMargin -50% 0px -50% 0px for viewport center detection"
  - "Scroll section wrapper: AnimatedSection with itemVariants export for children"
  - "Video pause-on-exit: useInView(ref, { amount: 0.3 }) + play()/pause() in useEffect"

# Metrics
duration: 8min
completed: 2026-01-25
---

# Phase 19 Plan 01: Video Hero & Scroll Infrastructure Summary

**Video hero with IntersectionObserver pause-on-exit and scroll choreography components (AnimatedSection, SectionNavDots, enhanced useScrollSpy)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-25T06:27:45Z
- **Completed:** 2026-01-25T06:35:17Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- HeroVideo component with responsive video sources and automatic pause when <30% visible
- AnimatedSection wrapper with 50% trigger, 250ms duration, 50ms stagger, always-replay
- SectionNavDots with hover labels, click-to-scroll, and IntersectionObserver-based active tracking
- Enhanced useScrollSpy hook using IntersectionObserver instead of scroll listener

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HeroVideo Component** - `ea349b6` (feat)
2. **Task 2: Create AnimatedSection Wrapper** - `7e3ffb4` (feat)
3. **Task 3: Enhance useScrollSpy and Create SectionNavDots** - `1601f04` (feat)

## Files Created/Modified

- `src/components/homepage/HeroVideo.tsx` - Video player with IntersectionObserver pause, responsive sources, reduced motion support
- `src/components/scroll/AnimatedSection.tsx` - Scroll-triggered wrapper with staggerChildren and always-replay
- `src/components/scroll/SectionNavDots.tsx` - Side navigation dots with hover labels and click-to-jump
- `src/lib/hooks/useScrollSpy.ts` - Enhanced with IntersectionObserver, returns activeIndex

## Decisions Made

- **useScrollSpy returns index:** Simpler for SectionNavDots integration than returning id string
- **AnimatedSection always replays:** viewport.once: false per CONTEXT decision for engaging scroll experience
- **SectionNavDots mobile hidden:** Side dots clutter small screens; hidden md:flex pattern
- **Video 30% visibility threshold:** Balance between responsiveness and avoiding flicker during fast scroll

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components implemented without blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Video hero component ready for Plan 03 (Remotion video generation)
- AnimatedSection and itemVariants ready for all homepage sections in Plan 05
- SectionNavDots can be added to HomePageClient in Plan 05 integration
- useScrollSpy available for any component needing section tracking

---

*Phase: 19-homepage-redesign*
*Completed: 2026-01-25*
