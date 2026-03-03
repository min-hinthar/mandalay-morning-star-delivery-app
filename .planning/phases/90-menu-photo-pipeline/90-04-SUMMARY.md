---
phase: 90-menu-photo-pipeline
plan: 04
subsystem: ui
tags: [admin, bulk-upload, drag-drop, slug-matching, photo-management]

requires:
  - phase: 90-menu-photo-pipeline
    provides: uploadMenuPhotoViaServer utility and /api/admin/photos/process endpoint
provides:
  - BulkUploadMatcher component with slug-based file matching
  - Streamlined MenuItemPhotoSection (no Google Drive)
  - Page-level bulk drop handler on admin photos page
affects: [admin-photos, admin-menu-edit]

tech-stack:
  added: []
  patterns: [multi-file drag-drop with modal preview, slug-based auto-matching]

key-files:
  created:
    - src/components/ui/admin/photos/BulkUploadMatcher.tsx
  modified:
    - src/components/ui/admin/photos/PhotoUploadZone.tsx
    - src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx
    - src/app/(admin)/admin/menu/[id]/page.tsx
    - src/app/(admin)/admin/photos/page.tsx

key-decisions:
  - "Removed Google Drive URL section entirely — Supabase Storage is now the single photo source"
  - "Multi-file drops (>1 file) trigger BulkUploadMatcher modal; single file handled by PhotoUploadZone"
  - "BulkUploadMatcher patches menu item image_url after each successful matched upload"

patterns-established:
  - "Bulk upload: modal preview with match/unmatch badges before confirming"
  - "Slug matching: strip extension, replace spaces with hyphens, lowercase"

requirements-completed: [MENU-01, MENU-02, ADMIN-02]

duration: 20min
completed: 2026-03-03
---

# Plan 04: Admin Photo Management & Bulk Upload Summary

**BulkUploadMatcher with slug-based auto-matching and streamlined photo management without Google Drive**

## Performance

- **Duration:** 20 min
- **Tasks:** 2
- **Files modified:** 4
- **Files created:** 1

## Accomplishments

- Created BulkUploadMatcher component with slug-based file-to-menu-item matching
- Updated PhotoUploadZone to use server-side processing (uploadMenuPhotoViaServer)
- Removed Google Drive URL section from MenuItemPhotoSection
- Added page-level drag-drop handler for multi-file bulk upload on admin photos page

## Task Commits

1. **Task 1: Update PhotoUploadZone + streamline MenuItemPhotoSection** - `2c566787` (feat)
2. **Task 2: BulkUploadMatcher + admin photos page integration** - `2c566787` (feat)

## Files Created/Modified

- `src/components/ui/admin/photos/BulkUploadMatcher.tsx` - Bulk upload with slug matching, preview, sequential upload
- `src/components/ui/admin/photos/PhotoUploadZone.tsx` - Switched to uploadMenuPhotoViaServer
- `src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx` - Removed Drive URL, simplified props
- `src/app/(admin)/admin/menu/[id]/page.tsx` - Removed Drive URL prop passing
- `src/app/(admin)/admin/photos/page.tsx` - Added bulk drop handler, BulkUploadMatcher integration, slug in menu items

## Decisions Made

- Google Drive URL removed entirely (Supabase Storage is sole source, simplifies UX)
- Bulk upload threshold: >1 files triggers modal, single file uses inline upload zone
- BulkUploadMatcher calls PATCH /api/admin/menu/{id} to update image_url after each upload

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All photo management features complete
- Admin can upload single or bulk photos with auto-matching

---
*Phase: 90-menu-photo-pipeline*
*Completed: 2026-03-03*
