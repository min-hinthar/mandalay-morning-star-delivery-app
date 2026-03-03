---
phase: 90-menu-photo-pipeline
plan: 03
subsystem: infra
tags: [seed-script, supabase-storage, cli, slug-matching]

requires:
  - phase: none
    provides: existing menu_items table with slug field and Supabase Storage bucket
provides:
  - Photo seed CLI script (pnpm seed:photos)
  - Slug-based filename-to-menu-item matching
  - Fallback photo upload pipeline
affects: [menu-display, deployment]

tech-stack:
  added: []
  patterns: [slug-based photo matching, CLI with --dry-run and --force flags]

key-files:
  created:
    - scripts/seed-photos.ts
  modified:
    - package.json

key-decisions:
  - "Match photos by slug (filename minus extension) for zero-config matching"
  - "Only update image_url if null or contains 'fallback' (preserve manually uploaded photos)"
  - "Upload to {itemId}/fallback.{ext} path in Supabase Storage"

patterns-established:
  - "Photo seeding: filename = slug convention for automatic matching"
  - "CLI pattern: --dry-run for preview, --force for overwrite"

requirements-completed: [MENU-07]

duration: 10min
completed: 2026-03-03
---

# Plan 03: Photo Seed Script Summary

**CLI script seeds fallback photos from data/menu-photos/ to Supabase Storage with slug-based auto-matching**

## Performance

- **Duration:** 10 min
- **Tasks:** 1
- **Files modified:** 1
- **Files created:** 1

## Accomplishments

- Created scripts/seed-photos.ts with slug-based file-to-menu-item matching
- Supports --dry-run (preview) and --force (overwrite existing) flags
- Reports matched, unmatched, and skipped items with clear summary
- Uploads to Supabase Storage and updates menu_items.image_url

## Task Commits

1. **Task 1: Create seed-photos script** - `570cd870` (feat)

## Files Created/Modified

- `scripts/seed-photos.ts` - Photo seed CLI tool
- `package.json` - Added seed:photos script

## Decisions Made

- Slug matching via filename minus extension (e.g., beef-curry.jpg matches slug "beef-curry")
- Storage path: {itemId}/fallback.{ext} with upsert for idempotent re-runs
- Conditional update: only sets image_url when null or existing URL contains "fallback"

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## User Setup Required

None - script uses existing SUPABASE_SERVICE_ROLE_KEY from environment.

## Next Phase Readiness

- Script ready for deployment use
- Photo files in data/menu-photos/ ready for seeding

---
*Phase: 90-menu-photo-pipeline*
*Completed: 2026-03-03*
