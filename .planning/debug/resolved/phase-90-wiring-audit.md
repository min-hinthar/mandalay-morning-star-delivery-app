---
status: resolved
trigger: "Verify that all Phase 90 (Menu & Photo Pipeline) code is properly wired end-to-end"
created: 2026-03-03T00:00:00Z
updated: 2026-03-03T01:15:00Z
---

## Current Focus

hypothesis: Three bugs found and fixed; all 8 requirements now fully wired
test: All CI checks pass (lint, typecheck, format, tests, build)
expecting: User confirms fixes are correct
next_action: Await human verification

## Symptoms

expected: All 8 Phase 90 requirements fully wired end-to-end
actual: Phase 90 just completed via auto-advance pipeline, needs verification
errors: None known - proactive audit
reproduction: Check each requirement's code path
started: Phase 90 completed 2026-03-03

## Eliminated

## Evidence

- timestamp: 2026-03-03T00:10:00Z
  checked: MENU-01 (Single photo upload) full code path
  found: WIRED -- MenuItemPhotoSection -> PhotoUploadZone -> uploadMenuPhotoViaServer -> /api/admin/photos/process -> sharp WebP conversion -> Supabase Storage -> form state update -> user clicks Save -> PATCH /api/admin/menu/[id] -> image_url updated
  implication: End-to-end path exists but blocked by BUG-1 (WebP rejected by bucket)

- timestamp: 2026-03-03T00:15:00Z
  checked: MENU-02 (Bulk upload with slug matching) full code path
  found: WIRED -- AdminPhotosPage drag/drop -> BulkUploadMatcher -> slugify filename -> match to menuItems -> uploadMenuPhotoViaServer -> PATCH /api/admin/menu/[id]. BUT fetchMenuItems() calls /api/admin/menu with no limit param, defaults to 25 items
  implication: BUG-2 -- bulk upload slug matching will miss items beyond page 1 (25+)

- timestamp: 2026-03-03T00:20:00Z
  checked: MENU-03 (Auto-processing to WebP 4:3) full code path
  found: WIRED -- /api/admin/photos/process uses sharp to resize(800x600, fit:cover) + webp(quality:80). Validates min 800x600 input, max 10MB raw, max 2MB processed
  implication: Processing logic correct but output blocked by BUG-1

- timestamp: 2026-03-03T00:22:00Z
  checked: BUG-1 -- Storage bucket mime type restriction
  found: Migration 007_menu_photos_storage.sql sets allowed_mime_types = ARRAY['image/jpeg','image/png'] -- NO WebP. Process route uploads with contentType: "image/webp". No later migration fixes this.
  implication: CRITICAL -- ALL photo uploads through the process route will fail with storage rejection

- timestamp: 2026-03-03T00:25:00Z
  checked: MENU-04 (image_updated_at tracking) full code path
  found: WIRED -- Migration 033 adds column + trigger. Trigger fires BEFORE UPDATE, sets image_updated_at = NOW() when image_url changes. TypeScript types updated.
  implication: Fully wired, no issues

- timestamp: 2026-03-03T00:28:00Z
  checked: MENU-05 (Allergen deduplication) full code path
  found: WIRED -- YAML has allergens_enum with 9 canonical values. seed-menu.ts validates all item allergens against the enum. MenuItemFormFields.tsx uses same 9 ALLERGEN_OPTIONS. No duplicates or mismatches found.
  implication: Fully wired, no issues

- timestamp: 2026-03-03T00:30:00Z
  checked: MENU-06 (Inactive items) full code path
  found: WIRED -- Admin menu page has handleToggleActive with PATCH /api/admin/menu/[id] { is_active: !current }. Admin edit page has is_active toggle. Customer API /api/menu filters .eq("is_active", true). MenuItemsTable renders toggle icons.
  implication: Fully wired, no issues

- timestamp: 2026-03-03T00:32:00Z
  checked: MENU-07 (Fallback photo seeding) full code path
  found: WIRED -- scripts/seed-photos.ts reads data/menu-photos/ (56 photos found), matches by slug, uploads to Supabase Storage, updates image_url. Has --dry-run and --force flags. pnpm seed:photos command exists in package.json.
  implication: Fully wired, no issues

- timestamp: 2026-03-03T00:35:00Z
  checked: ADMIN-02 (Photo management grid) full code path
  found: WIRED -- /admin/photos page imports and renders PhotoGrid, PhotoMetadata, PhotoUploadZone, BulkUploadMatcher, PhotosStatsCards, PhotosFilters. Supports search, filter, select, assign, delete, bulk delete, Google Drive link. All API routes exist and work.
  implication: Fully wired, no issues (though depends on BUG-1 fix for uploads)

- timestamp: 2026-03-03T00:38:00Z
  checked: Client-side validateFile() in storage.ts
  found: MINOR -- Error message says "File exceeds 10MB limit" but MAX_SIZE is 2MB. Also says "Only JPEG and PNG files allowed" but ALLOWED_TYPES includes WebP. However, the client validation is a pre-check; server does proper validation. The 2MB client limit is too strict (server accepts 10MB raw).
  implication: MINOR -- users with files between 2-10MB see incorrect rejection

- timestamp: 2026-03-03T00:40:00Z
  checked: Next.js image remotePatterns config
  found: Properly configured for **.supabase.co and drive.google.com
  implication: No issues

- timestamp: 2026-03-03T01:10:00Z
  checked: CI verification after fixes
  found: All checks pass -- lint, typecheck, format:check, tests (448 passed), build
  implication: Fixes are clean

## Resolution

root_cause: Three bugs found:
  BUG-1 (CRITICAL): Migration 007 menu-photos bucket restricts allowed_mime_types to ['image/jpeg','image/png'] but Phase 90 process route converts all uploads to WebP. WebP uploads rejected by Supabase Storage.
  BUG-2 (MODERATE): Photos page and menu item edit page fetch /api/admin/menu with no limit, defaulting to 25. Bulk upload slug matching and category extraction miss items beyond first page.
  BUG-3 (MINOR): Client-side validateFile() had MAX_SIZE=2MB (should be 10MB to match server) and misleading error messages.
fix: |
  BUG-1: Created migration 034_menu_photos_allow_webp.sql to UPDATE storage.buckets SET allowed_mime_types to include 'image/webp'
  BUG-2: Added ?limit=500 to fetchMenuItems() calls in photos page and menu item edit page
  BUG-3: Updated MAX_SIZE to 10MB and fixed error message strings in storage.ts validateFile()
verification: lint OK, typecheck OK, format OK, 448 tests pass, build OK
files_changed:
  - supabase/migrations/034_menu_photos_allow_webp.sql (new)
  - src/app/(admin)/admin/photos/page.tsx (line 68)
  - src/app/(admin)/admin/menu/[id]/page.tsx (line 97)
  - src/lib/supabase/storage.ts (lines 10, 48, 51)
