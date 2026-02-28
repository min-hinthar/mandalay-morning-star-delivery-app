---
phase: 40-lcp-element-quick-wins
plan: 02
subsystem: performance
tags: [next-image, lcp, image-optimization, loading-priority]

# Dependency graph
requires:
  - "40-01 baseline metrics (LCP element identification)"
provides:
  - "CardImage converted to Next.js Image with conditional loading strategy"
  - "Priority images load eagerly with high fetch priority"
  - "Below-fold images lazy load automatically"
affects: [40-03, performance-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js Image with fill + conditional loading/fetchPriority based on priority prop"

key-files:
  created: []
  modified:
    - src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx

key-decisions:
  - "Used fill prop with existing motion.div absolute positioning for parallax compatibility"
  - "Responsive sizes: 100vw mobile, 50vw tablet, 33vw desktop"
  - "No unoptimized prop needed — remotePatterns in next.config.ts covers all image sources"

patterns-established:
  - "Next.js Image loading strategy: loading='eager' + fetchPriority='high' for priority, lazy for rest"

# Metrics
duration: 5min
completed: 2026-02-06
---

# Phase 40 Plan 02: CardImage to Next.js Image Summary

**Converted raw img to Next.js Image with conditional eager/lazy loading based on priority prop**

## Performance

- **Duration:** 5 min
- **Completed:** 2026-02-06
- **Tasks:** 1 (code change; verification deferred to 40-03)
- **Files modified:** 1

## Accomplishments

- Replaced raw `<img>` tag with Next.js `Image` component in CardImage
- Added conditional `loading="eager"` + `fetchPriority="high"` for priority images (above-fold)
- Added `loading="lazy"` for non-priority images (below-fold)
- Added responsive `sizes` attribute for proper srcset generation
- Maintained parallax effect via `fill` positioning inside `motion.div`
- Kept emoji fallback on image error

## Task Commits

1. **Task 1: Convert CardImage to Next.js Image** - `05153db` (perf)

## Files Modified

- `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - Raw img replaced with Next.js Image, conditional loading strategy added

## Decisions Made

- **fill prop for layout**: Uses `fill` with existing `motion.div` absolute positioning — parallax continues to work without layout changes
- **sizes attribute**: `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw` matches the responsive grid layout
- **No unoptimized prop**: remotePatterns in next.config.ts already covers Supabase and Google Drive URLs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- CardImage optimization complete, ready for LCP re-measurement in Plan 03
- All images now served through Next.js optimization pipeline (AVIF/WebP conversion, responsive sizing)

## Self-Check: PASSED

---

_Phase: 40-lcp-element-quick-wins_
_Completed: 2026-02-06_
