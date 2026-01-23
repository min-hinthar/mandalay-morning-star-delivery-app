---
phase: 10-token-migration
plan: 02
subsystem: ui
tags: [tailwind, z-index, design-tokens, menu, v8]

# Dependency graph
requires:
  - phase: 10-token-migration
    provides: z-index design token system in tailwind.config.ts
provides:
  - Menu components using semantic z-index tokens
  - V8 menu components following same token patterns
  - Consistent layering hierarchy across menu UI
affects: [11-v8-migration, 12-dead-code-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - z-dropdown for overlay content, badges, floating elements
    - z-sticky for sticky headers, persistent UI elements
    - z-fixed for fixed position navigation

key-files:
  modified:
    - src/components/menu/menu-skeleton.tsx
    - src/components/menu/menu-item-card.tsx
    - src/components/menu/MenuItemCard.tsx
    - src/components/menu/item-detail-modal.tsx
    - src/components/menu/MenuLayout.tsx
    - src/components/menu/ItemDetail.tsx
    - src/components/menu/category-tabs.tsx
    - src/components/menu/CategoryCarousel.tsx
    - src/components/ui-v8/menu/MenuItemCardV8.tsx
    - src/components/ui-v8/menu/BlurImage.tsx

key-decisions:
  - "Semantic token mapping: z-10 -> z-dropdown, z-20 -> z-sticky, z-30 -> z-fixed"
  - "V8 components follow identical token patterns as legacy menu components"

patterns-established:
  - "z-dropdown (10): Badges, floating buttons, fade indicators"
  - "z-sticky (20): Sticky headers, close buttons, action bars"
  - "z-fixed (30): Fixed position navigation (CategoryCarousel)"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 10 Plan 02: Menu Components z-index Token Migration Summary

**10 menu files migrated from hardcoded z-10/z-20/z-30 to semantic z-dropdown/z-sticky/z-fixed tokens**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T09:31:18Z
- **Completed:** 2026-01-23T09:34:44Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Migrated 6 legacy menu files to z-index tokens
- Migrated 4 category/V8 menu files to z-index tokens
- Established consistent token usage patterns (z-dropdown for floating elements, z-sticky for sticky UI, z-fixed for fixed nav)
- 28 total z-index token usages in menu components

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 6 legacy menu files** - `ca8d3cd` (feat)
2. **Task 2: Migrate category navigation and V8 components** - `4f0d7a5` (feat)

## Files Modified

| File | Changes |
|------|---------|
| `menu-skeleton.tsx` | 1 location: z-10 -> z-dropdown |
| `menu-item-card.tsx` | 3 locations: z-10 -> z-dropdown |
| `MenuItemCard.tsx` | 4 locations: z-10 -> z-dropdown, z-20 -> z-sticky |
| `item-detail-modal.tsx` | 2 locations: z-10 -> z-dropdown, z-20 -> z-sticky |
| `MenuLayout.tsx` | 1 location: z-20 -> z-sticky |
| `ItemDetail.tsx` | 1 location: z-20 -> z-sticky |
| `category-tabs.tsx` | 3 locations: z-10 -> z-dropdown |
| `CategoryCarousel.tsx` | 4 locations: z-10 -> z-dropdown, z-30 -> z-fixed |
| `MenuItemCardV8.tsx` | 1 location: z-10 -> z-dropdown |
| `BlurImage.tsx` | 2 locations: z-10 -> z-dropdown |

## Decisions Made

- **Token mapping:** z-10 -> z-dropdown, z-20 -> z-sticky, z-30 -> z-fixed (per plan specification)
- **category-tabs.tsx already had z-sticky** - was migrated in prior work, only z-10 instances updated
- **Consistent V8 patterns:** V8 menu components use identical token patterns as legacy

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Additional z-10 in CategoryCarousel.tsx**
- **Found during:** Task 2
- **Issue:** Plan specified 3 z-10 locations in CategoryCarousel but there were 4 (including span text z-10)
- **Fix:** Migrated all 4 instances to z-dropdown
- **Files modified:** src/components/menu/CategoryCarousel.tsx
- **Committed in:** 4f0d7a5 (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug - additional z-10 instance)
**Impact on plan:** Minor discrepancy in count. All z-10 instances migrated correctly.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All menu z-index values now use semantic tokens
- Ready for UI component token migration (plan 10-03)
- Visual layering preserved (badges above content, sticky headers above content)

---
*Phase: 10-token-migration*
*Completed: 2026-01-23*
