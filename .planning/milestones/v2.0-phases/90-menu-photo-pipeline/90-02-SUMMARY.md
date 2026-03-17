---
phase: 90-menu-photo-pipeline
plan: 02
subsystem: api
tags: [allergens, seed-yaml, admin-form, data-cleanup]

requires:
  - phase: none
    provides: existing menu_items table and seed YAML
provides:
  - Clean allergen data in seed YAML (no duplicate contains_* tags)
  - Allergen validation in seed script
  - Admin form with canonical allergen enum display
affects: [menu-display, admin-menu-edit]

tech-stack:
  added: []
  patterns: [canonical allergen enum, {value, label} option objects]

key-files:
  created: []
  modified:
    - data/menul.seed.yaml
    - scripts/seed-menu.ts
    - src/app/(admin)/admin/menu/[id]/MenuItemFormFields.tsx

key-decisions:
  - "Removed contains_* tags entirely rather than mapping to allergens (already in allergens field)"
  - "Used {value, label} objects for ALLERGEN_OPTIONS instead of plain strings"
  - "is_active filtering already present on customer endpoints - no code changes needed for MENU-06"

patterns-established:
  - "Allergen enum: peanuts, tree_nuts, dairy, eggs, gluten, shellfish, soy, fish, sesame"
  - "Form option pattern: {value: string, label: string} for enum-backed fields"

requirements-completed: [MENU-05, MENU-06]

duration: 15min
completed: 2026-03-03
---

# Plan 02: Allergen Dedup & Inactive Items Summary

**Removed 23 redundant contains_* tags from seed YAML and aligned admin allergen form with canonical enum**

## Performance

- **Duration:** 15 min
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Cleaned all 53 menu items in seed YAML, removing redundant contains_* tags
- Added allergen validation in seed script (rejects unknown values)
- Updated admin form allergen badges to use {value, label} objects
- Confirmed is_active filtering already present on customer API endpoints

## Task Commits

1. **Task 1: Clean seed YAML** - `9ee35eaa` (feat)
2. **Task 2: Add allergen validation to seed script** - `9ee35eaa` (feat)
3. **Task 3: Update admin form** - `9ee35eaa` (feat)

## Files Created/Modified

- `data/menul.seed.yaml` - Removed all contains_* tags from 53 items
- `scripts/seed-menu.ts` - Added validateAllergens() before seeding
- `src/app/(admin)/admin/menu/[id]/MenuItemFormFields.tsx` - ALLERGEN_OPTIONS as {value, label}

## Decisions Made

- No code changes needed for MENU-06 (is_active already filtered on /api/menu and /api/menu/search)
- Used Node.js script instead of Python for tag cleanup (Python not available on Windows)

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- Python3 not available on Windows - used Node.js regex-based script instead
- First Node.js script failed on Windows CRLF line endings - rewrote with content.replace() approach

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Allergen data clean and validated
- Admin form aligned with canonical enum

---
*Phase: 90-menu-photo-pipeline*
*Completed: 2026-03-03*
