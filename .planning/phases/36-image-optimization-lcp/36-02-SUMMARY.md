---
phase: 36-image-optimization-lcp
plan: 02
subsystem: ui
tags: [next.js, image-optimization, lcp, cls, performance]

# Dependency graph
requires:
  - phase: 36-01
    provides: Image quality config (70 default, 85 hero)
provides:
  - Hero image with preload prop for LCP optimization
  - CardImage with shimmer placeholder, sizes, error handling
  - Priority loading for first 6 grid cards, first 3 carousel cards
affects: [menu-page, homepage, image-loading]

# Tech tracking
tech-stack:
  added: []
  patterns: [preload-hero, shimmer-placeholder, responsive-sizes, eager-first-n]

key-files:
  created: []
  modified:
    - src/components/ui/homepage/HowItWorksSection.tsx
    - src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx

key-decisions:
  - "preload prop for hero images (Next.js 16 naming over priority)"
  - "Shimmer placeholder during image load for better UX"
  - "Responsive sizes attribute for srcset optimization"
  - "Error fallback to emoji when image fails to load"

patterns-established:
  - "Preload hero: Use preload={true} quality={85} for LCP images"
  - "Shimmer placeholder: Show animate-pulse skeleton while loading"
  - "Responsive sizes: (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  - "Priority loading: First 6 grid cards, first 3 carousel cards use eager loading"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 36 Plan 02: Hero Image LCP Summary

**Hero image uses preload prop with quality 85, CardImage has shimmer placeholder and responsive sizes attribute**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01
- **Completed:** 2026-02-01
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Hero image in HowItWorksSection uses preload={true} and quality={85} for LCP optimization
- CardImage has shimmer placeholder (animate-pulse) during image load
- CardImage has responsive sizes attribute for srcset optimization
- CardImage has fade-in transition and error fallback to emoji
- Verified FeaturedSections passes priority={index < 6}, SectionCarousel passes priority={index < 3}

## Task Commits

1. **Task 1: Update HowItWorksSection hero image** - `a64f052` (feat)
2. **Task 2: Add responsive sizes and shimmer to CardImage** - `67030bf` (feat)
3. **Task 3: Verify priority prop on FeaturedSections/SectionCarousel** - No commit (verification only - already correct)

## Files Created/Modified

- `src/components/ui/homepage/HowItWorksSection.tsx` - Hero image uses preload={true} and quality={85}
- `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - Shimmer placeholder, responsive sizes, error handling

## Decisions Made

- Used `preload` instead of `priority` for Next.js 16 semantic clarity
- Quality 85 for hero (higher quality for LCP element)
- Shimmer uses `bg-surface-tertiary animate-pulse` for consistency with design system
- Responsive sizes: 50vw mobile, 33vw tablet, 25vw desktop

## Deviations from Plan

None - plan executed exactly as written. Task 3 was verification-only as the priority props were already correctly implemented.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Image optimization config and component updates complete
- Ready for Phase 37 (Touch Gestures)

---

_Phase: 36-image-optimization-lcp_
_Completed: 2026-02-01_
