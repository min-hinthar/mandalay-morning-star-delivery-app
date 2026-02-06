---
phase: 40-lcp-element-quick-wins
plan: 01
subsystem: performance
tags: [lighthouse, lcp, core-web-vitals, metrics, baseline]

# Dependency graph
requires: []
provides:
  - Baseline LCP metrics (homepage 19.9s, menu 18.2s)
  - LCP element identification (emoji on homepage, CardImage on menu)
  - Font loading verification (already optimized with display: swap)
  - Bundle size baseline (3.79 MB uncompressed)
affects: [40-02, 40-03, performance-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/40-lcp-element-quick-wins/BASELINE.md
    - .planning/phases/40-lcp-element-quick-wins/lighthouse-homepage-mobile.json
    - .planning/phases/40-lcp-element-quick-wins/lighthouse-menu-mobile.json
  modified: []

key-decisions:
  - "LCP element is text (emoji) on homepage, image (CardImage) on menu page"
  - "Font loading already optimized per REQ-40.4 - no changes needed"
  - "Primary optimization target: CardImage img tags to Next.js Image"

patterns-established:
  - "Lighthouse JSON captures for before/after comparison"

# Metrics
duration: 8min
completed: 2026-02-06
---

# Phase 40 Plan 01: LCP Baseline Summary

**Baseline captured: Homepage 19.9s LCP (emoji text), Menu 18.2s LCP (raw img), font loading verified optimized**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T01:53:00Z
- **Completed:** 2026-02-06T02:01:24Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Captured Lighthouse mobile metrics for homepage and menu page
- Identified LCP elements: emoji span (homepage), CardImage raw `<img>` (menu)
- Documented key bottleneck: 2.6s resource load delay on menu page
- Verified font loading already uses `display: "swap"` (REQ-40.4 satisfied)
- Bundle size baseline: 3.79 MB uncompressed JS

## Task Commits

Each task was committed atomically:

1. **Task 1: Capture Baseline Lighthouse Metrics** - `1fe8661` (perf)
2. **Task 2: Analyze LCP Element, Verify Font Config, and Document Findings** - this commit (docs)

## Files Created

- `.planning/phases/40-lcp-element-quick-wins/BASELINE.md` - Baseline metrics documentation
- `.planning/phases/40-lcp-element-quick-wins/lighthouse-homepage-mobile.json` - Raw Lighthouse data
- `.planning/phases/40-lcp-element-quick-wins/lighthouse-menu-mobile.json` - Raw Lighthouse data
- `.planning/phases/40-lcp-element-quick-wins/40-01-SUMMARY.md` - This summary

## Key Findings

### LCP Element Identification

| Page | LCP Element | Selector | Content |
|------|-------------|----------|---------|
| Homepage | `<span>` | `section#hero > div.absolute > span.absolute` | Floating emoji (text) |
| Menu | `<img>` | `div.relative > div.absolute > img.w-full` | CardImage (raw img) |

### LCP Breakdown (Menu Page)

| Subpart | Duration | Impact |
|---------|----------|--------|
| Time to first byte | 340ms | Good |
| Resource load delay | 2,604ms | **Critical** |
| Resource load duration | 528ms | Acceptable |
| Element render delay | 1,106ms | Moderate |

### Core Web Vitals

| Metric | Homepage | Menu | Target |
|--------|----------|------|--------|
| LCP | 19.9s | 18.2s | < 2.5s |
| FCP | 3.2s | 1.9s | < 1.5s |
| TBT | 5.5s | 5.6s | < 200ms |
| Performance Score | 30 | 35 | > 90 |

## Font Loading Verification (REQ-40.4)

Font configuration in `src/app/layout.tsx` already follows best practices:

- **Inter:** `display: "swap"`, `preload: true`, `subsets: ["latin"]`
- **Playfair_Display:** `display: "swap"`, `preload: true`, `subsets: ["latin"]`, `weight: ["400", "600", "700"]`

**Status:** REQ-40.4 satisfied - no changes needed.

## Decisions Made

1. **LCP element confirmed** - Research was partially correct: CardImage IS the LCP on menu page, but homepage LCP is an emoji span (not image)
2. **Font loading already optimized** - Both fonts use `display: "swap"` as required by REQ-40.4
3. **Primary optimization target** - Convert CardImage from raw `<img>` to Next.js Image with priority loading

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Bundle analyzer script failed on Windows due to environment variable syntax
- Workaround: Used `ANALYZE=true BUNDLE_ANALYZE=browser pnpm next build` directly
- Bundle size extracted from `.next/static/chunks/` directory stats

## Recommendations for Plan 02

1. **Convert CardImage to Next.js Image component** - Primary optimization
2. **Add `priority` prop to first visible menu cards** - Reduce resource load delay
3. **Add `fetchPriority="high"` for above-fold images** - Browser prioritization hint
4. **Add `loading="lazy"` for below-fold images** - Prevent competing requests

## Next Phase Readiness

- Baseline established for before/after comparison
- LCP element identified and documented
- CardImage component location known for modification
- Ready for Plan 02: Next.js Image optimization

## Self-Check: PASSED

---
*Phase: 40-lcp-element-quick-wins*
*Completed: 2026-02-06*
