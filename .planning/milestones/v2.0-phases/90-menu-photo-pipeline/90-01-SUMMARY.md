---
phase: 90-menu-photo-pipeline
plan: 01
subsystem: api
tags: [sharp, webp, supabase-storage, image-processing]

requires:
  - phase: none
    provides: existing menu_items table and Supabase Storage bucket
provides:
  - Server-side photo processing API endpoint (/api/admin/photos/process)
  - uploadMenuPhotoViaServer client utility
  - image_updated_at column on menu_items
  - WebP 4:3 800x600 output standard
affects: [90-04, admin-photos, menu-display]

tech-stack:
  added: [sharp]
  patterns: [server-side image processing, FormData upload to API route]

key-files:
  created:
    - src/app/api/admin/photos/process/route.ts
    - supabase/migrations/033_photo_pipeline.sql
  modified:
    - src/lib/supabase/storage.ts
    - src/lib/utils/image-optimization.ts
    - src/types/database.ts
    - src/test/factories/index.ts

key-decisions:
  - "Used sharp for server-side WebP conversion instead of client-side Canvas API"
  - "Standardized on 4:3 aspect ratio at 800x600 for all menu photos"
  - "Kept deprecated uploadMenuPhoto for backward compatibility"

patterns-established:
  - "Server-side image processing: POST FormData to /api/admin/photos/process"
  - "Photo output standard: WebP, 4:3, 800x600, quality 80"

requirements-completed: [MENU-03, MENU-04]

duration: 25min
completed: 2026-03-03
---

# Plan 01: Photo Processing Pipeline Summary

**Server-side sharp WebP processing at 4:3 800x600 via /api/admin/photos/process with image_updated_at tracking**

## Performance

- **Duration:** 25 min
- **Tasks:** 3
- **Files modified:** 6
- **Files created:** 2

## Accomplishments

- POST endpoint for server-side photo processing with sharp (validate, crop, convert to WebP)
- `uploadMenuPhotoViaServer` client utility replacing client-side Canvas-based upload
- Database migration adding `image_updated_at` column with auto-update trigger
- Updated image optimization constants to 4:3 aspect ratio

## Task Commits

1. **Task 1: DB migration + types** - `9a6faf95` (feat)
2. **Task 2: Server-side processing API** - `9a6faf95` (feat)
3. **Task 3: Client utility** - `9a6faf95` (feat)

## Files Created/Modified

- `supabase/migrations/033_photo_pipeline.sql` - image_updated_at column + trigger
- `src/app/api/admin/photos/process/route.ts` - Server-side sharp processing endpoint
- `src/lib/supabase/storage.ts` - Added uploadMenuPhotoViaServer, updated validation
- `src/lib/utils/image-optimization.ts` - menuCard 16:9 to 4:3
- `src/types/database.ts` - Added image_updated_at to MenuItemsRow/Insert/Update
- `src/test/factories/index.ts` - Added image_updated_at: null to mock factory

## Decisions Made

- sharp chosen over client-side Canvas for consistent output across devices
- 800x600 chosen as balance between quality and file size
- WebP quality 80 produces ~50-100KB files at target dimensions

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- Test factory missing image_updated_at after type update - fixed by adding field to mock
- @types/sharp deprecated (sharp 0.34.5 ships own types) - removed stale package

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Processing pipeline ready for Plan 04 (admin UI integration)
- uploadMenuPhotoViaServer available for PhotoUploadZone

---
*Phase: 90-menu-photo-pipeline*
*Completed: 2026-03-03*
