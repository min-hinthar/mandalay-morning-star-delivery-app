---
phase: 46-large-file-refactoring
plan: 04
subsystem: ui
tags: [next.js, react, admin, refactoring, co-location]

# Dependency graph
requires:
  - phase: 46-01
    provides: Leaf component splitting patterns
  - phase: 46-02
    provides: Admin/account component splitting patterns
provides:
  - 7 admin page.tsx files reduced to thin orchestrators under 400 lines
  - 12 co-located extracted sub-component files
  - Sibling co-location pattern for Next.js App Router pages
affects: [46-06, 46-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sibling co-location for admin pages: PascalCase .tsx files alongside page.tsx"
    - "Thin orchestrator pattern: page.tsx keeps state + handlers, delegates rendering to extracted components"
    - "Self-contained dialog pattern: AddCategoryDialog manages own open state + form + API call"

key-files:
  created:
    - src/app/(admin)/admin/menu/[id]/MenuItemFormFields.tsx
    - src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx
    - src/app/(admin)/admin/sections/SectionsToolbar.tsx
    - src/app/(admin)/admin/sections/SectionsList.tsx
    - src/app/(admin)/admin/categories/AddCategoryDialog.tsx
    - src/app/(admin)/admin/categories/CategoriesTable.tsx
    - src/app/(admin)/admin/menu/MenuFilterBar.tsx
    - src/app/(admin)/admin/menu/MenuItemsTable.tsx
    - src/app/(admin)/admin/photos/PhotosStatsCards.tsx
    - src/app/(admin)/admin/photos/PhotosFilters.tsx
    - src/app/(admin)/admin/routes/RoutesStatsCards.tsx
    - src/app/(admin)/admin/drivers/DriversStatsCards.tsx
  modified:
    - src/app/(admin)/admin/menu/[id]/page.tsx
    - src/app/(admin)/admin/sections/page.tsx
    - src/app/(admin)/admin/categories/page.tsx
    - src/app/(admin)/admin/menu/page.tsx
    - src/app/(admin)/admin/photos/page.tsx
    - src/app/(admin)/admin/routes/page.tsx
    - src/app/(admin)/admin/drivers/page.tsx

key-decisions:
  - "Sibling co-location over subfolders for page-specific components"
  - "State management stays in page.tsx; extracted components receive data + callbacks as props"
  - "Self-contained components (AddCategoryDialog) manage own internal state when logically independent"

patterns-established:
  - "Admin page co-location: PascalCase sibling files alongside page.tsx (safe in App Router)"
  - "StatsCards extraction: reusable pattern for stat card grids across admin pages"
  - "Filter bar extraction: search + badge filters as standalone components"

# Metrics
duration: 35min
completed: 2026-02-06
---

# Phase 46 Plan 04: Admin Page Sub-Component Extraction Summary

**Extracted 12 sub-components from 7 admin pages as co-located siblings, reducing total from 3685 to 2274 lines (38% reduction)**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-02-06T14:50:00Z
- **Completed:** 2026-02-06T15:25:00Z
- **Tasks:** 2
- **Files modified:** 19 (7 modified + 12 created)

## Accomplishments

- 7 admin page.tsx files reduced to thin orchestrators (all under 400 lines)
- 12 co-located sub-component files extracted (all under 250 lines)
- Zero TypeScript errors, zero lint errors throughout
- Total line reduction: 3685 -> 2274 (38% reduction across all 7 pages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract sub-components from 4 largest admin pages** - `c832125` (feat)
2. **Task 2: Extract sub-components from 3 remaining admin pages** - `5c79711` (feat)

## Files Created/Modified

### Created (12 files)

| File | Lines | Extracts |
|------|-------|----------|
| `admin/menu/[id]/MenuItemFormFields.tsx` | 229 | Form fields, allergens, status toggles |
| `admin/menu/[id]/MenuItemPhotoSection.tsx` | 231 | Photo upload, Drive URL verify, history |
| `admin/sections/SectionsToolbar.tsx` | 131 | Draft banner, header, stats cards |
| `admin/sections/SectionsList.tsx` | 201 | Reorder group, section cards, item selector |
| `admin/categories/AddCategoryDialog.tsx` | 161 | Self-contained dialog with form + API call |
| `admin/categories/CategoriesTable.tsx` | 182 | Table with ordering, toggle, delete |
| `admin/menu/MenuFilterBar.tsx` | 77 | Search input + category badges |
| `admin/menu/MenuItemsTable.tsx` | 243 | Items table with dropdown actions |
| `admin/photos/PhotosStatsCards.tsx` | 71 | 3 stat cards: total, assigned, unassigned |
| `admin/photos/PhotosFilters.tsx` | 102 | Search + filter badges + bulk actions |
| `admin/routes/RoutesStatsCards.tsx` | 93 | 4 stat cards: total, planned, in-progress, completed |
| `admin/drivers/DriversStatsCards.tsx` | 96 | 4 stat cards: total, active, rating, deliveries |

### Modified (7 page.tsx files)

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `admin/menu/[id]/page.tsx` | 646 | 261 | 60% |
| `admin/sections/page.tsx` | 588 | 369 | 37% |
| `admin/categories/page.tsx` | 577 | 296 | 49% |
| `admin/menu/page.tsx` | 527 | 293 | 44% |
| `admin/photos/page.tsx` | 482 | 364 | 24% |
| `admin/routes/page.tsx` | 448 | 365 | 19% |
| `admin/drivers/page.tsx` | 417 | 326 | 22% |

## Decisions Made

- **Sibling co-location over subfolders:** Admin page components are page-specific, not shared. Co-locating as siblings (e.g., `SectionsToolbar.tsx` next to `page.tsx`) keeps them discoverable without subfolder overhead. Safe in App Router since only special filenames (`page`, `layout`, etc.) are recognized.
- **State stays in page.tsx:** All `useState`, `useEffect`, `useCallback`, and handler functions remain in the page orchestrator. Extracted components receive data and callbacks via props.
- **Self-contained dialogs:** `AddCategoryDialog` manages its own open/close state and form state since it's logically independent (user clicks button, fills form, submits). Only communicates back via `onCategoryCreated` callback.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Build failure (Google Fonts):** `pnpm build` failed with "Failed to fetch Playfair Display from Google Fonts" - network connectivity issue in the environment, not code-related. `pnpm typecheck` and `pnpm lint` both pass cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 7 admin pages now under 400 lines, unblocking 46-06/46-07 plans
- Co-location pattern established for any future admin page extractions
- No blockers or concerns

---
*Phase: 46-large-file-refactoring*
*Completed: 2026-02-06*
