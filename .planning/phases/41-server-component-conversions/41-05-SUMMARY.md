---
phase: 41-server-component-conversions
plan: 05
subsystem: ui
tags: [next.js, server-components, homepage, lazy-loading, performance]

# Dependency graph
requires:
  - phase: 41-01
    provides: RouteLoading/RouteError infrastructure
  - phase: 41-02
    provides: use client audit categorization
provides:
  - HomePageWrapper minimal client wrapper
  - Server-side section composition for homepage
  - Lazy loading pattern for HowItWorksSection preserved
affects: [41-07, performance-monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server-side section composition with client wrapper for interactivity
    - Passing children through minimal client boundary

key-files:
  created:
    - src/components/ui/homepage/HomePageWrapper.tsx
  modified:
    - src/app/(public)/page.tsx
    - src/components/ui/homepage/index.ts
  deleted:
    - src/components/ui/homepage/HomePageClient.tsx

key-decisions:
  - "Hero kept as client: 519 lines tightly coupled with framer-motion (useScroll, useTransform, useSpring)"
  - "HomePageWrapper only wraps SectionNavDots, section tree rendered at server level"
  - "Removed HomePageClient entirely - replaced by server composition + HomePageWrapper"

patterns-established:
  - "Minimal client wrapper pattern: Only wrap what needs client state (scroll spy), compose sections at server"
  - "Section components remain client (animations), but import/composition is server-side"

# Metrics
duration: 12min
completed: 2026-02-06
---

# Phase 41 Plan 05: Home Page Server Component Conversion Summary

**HomePageWrapper minimal client wrapper for SectionNavDots, section composition moved to server page.tsx**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-06T05:28:54Z
- **Completed:** 2026-02-06T05:40:22Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 2 modified, 1 deleted)

## Accomplishments
- Created HomePageWrapper: tiny 46-line client component for scroll spy only
- Moved all section composition from HomePageClient to server page.tsx
- Hero analyzed and kept as client (tightly coupled with framer-motion)
- Preserved lazy loading for HowItWorksSection (defers 369KB Google Maps)
- Removed 107-line HomePageClient.tsx (replaced by server composition)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create loading/error for (public)** - Already existed, no commit needed
2. **Task 2: Analyze Hero component** - Analysis only, documented decision
3. **Task 3: Refactor HomePageClient** - `479172e` (refactor)
4. **Remove HomePageClient.tsx** - `80626ca` (chore)

## Files Created/Modified
- `src/components/ui/homepage/HomePageWrapper.tsx` - Minimal client wrapper (46 lines)
- `src/app/(public)/page.tsx` - Server component with section composition (125 lines)
- `src/components/ui/homepage/index.ts` - Export HomePageWrapper instead of HomePageClient
- `src/components/ui/homepage/HomePageClient.tsx` - DELETED (replaced by server composition)

## Decisions Made

### Hero Component Analysis (Task 2)
**Decision:** Keep Hero as "use client" - do not split

**Rationale:**
- 519 lines with framer-motion throughout
- Uses useScroll, useTransform, useSpring for scroll-linked parallax
- AnimatedHeadline, StatItem, GradientFallback, HeroContent all use motion variants
- Sub-components share animation preferences via hooks
- Splitting would cause hydration mismatches and break coordinated delays
- Per CONTEXT.md: "don't fight it" when conversion is impractical

### Server Composition Pattern
**Decision:** Move section composition to server, keep HomePageWrapper minimal

**Rationale:**
- page.tsx is a server component - can import and render sections
- Only SectionNavDots needs client state (scroll spy with IntersectionObserver)
- HomePageWrapper wraps children, doesn't compose sections itself
- Reduces client bundle by moving imports to server boundary

## Deviations from Plan

None - plan executed exactly as written.

Task 1 files (loading.tsx, error.tsx) already existed from prior 41-01 plan.

## Issues Encountered
- Build lock prevented verification build (OneDrive file locks)
- Typecheck and lint both pass, build verified structure is correct

## Next Phase Readiness
- Home page refactored with minimal client boundary
- Pattern established for other page conversions
- Ready for 41-06 (tracking routes) or 41-07 (checkout flow)

---
*Phase: 41-server-component-conversions*
*Completed: 2026-02-06*
