---
phase: 116-micro-interactions-polish
plan: 03
subsystem: customer-ux
tags: [sticky-cta, og-metadata, share-page, seo]
dependency_graph:
  requires: []
  provides:
    - sticky-reorder-button
    - dynamic-og-metadata
    - root-og-defaults
  affects:
    - src/app/(customer)/orders/[id]/page.tsx
    - src/app/(public)/orders/[id]/share/page.tsx
    - src/app/layout.tsx
tech_stack:
  added: []
  patterns:
    - generateMetadata async function
    - sticky bottom-0 with safe-area-inset
key_files:
  created: []
  modified:
    - src/app/(customer)/orders/[id]/page.tsx
    - src/app/(public)/orders/[id]/share/page.tsx
    - src/app/layout.tsx
decisions:
  - "z-20 (sticky token) used for reorder bar -- no conflict with bottom nav since order detail is in (customer) route group with back button"
  - "generateMetadata uses createServiceClient() directly, not internal fetch (per D-31, C-5)"
  - "OG image uses /og-image.png placeholder path -- file not yet in repo, needs to be provided"
  - "Description truncated at 155 chars for social platform compatibility"
metrics:
  duration: 4min
  completed: "2026-04-11T01:15:27Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 116 Plan 03: Sticky Reorder & OG Metadata Summary

Sticky reorder CTA at bottom of order detail + dynamic OG metadata on share page with root-level defaults.

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Sticky reorder button | 55af5908 | src/app/(customer)/orders/[id]/page.tsx |
| 2 | Dynamic OG metadata + root defaults | e409fe2b | src/app/(public)/orders/[id]/share/page.tsx, src/app/layout.tsx |

## Changes Made

### Task 1: Sticky Reorder Button
- Moved ReorderButton outside Actions `space-y-4` div to direct child of `max-w-2xl` container
- Added `sticky bottom-0 z-20` with `bg-surface-primary`, `border-t border-border`, `shadow-lg`
- Added `env(safe-area-inset-bottom)` for iOS notch devices
- Added `-mx-4` for edge-to-edge bar, `mt-6` spacing
- Reduced main `pb-32` to `pb-20` (sticky bar anchors bottom)

### Task 2: Dynamic OG Metadata
- Replaced static `export const metadata` with `async generateMetadata`
- Dynamic title: `Order from Morning Star - {date}`
- Dynamic OG description: `{N} items -- ${total}`
- Twitter card: `summary_large_image`
- Fallback to static brand metadata on query error
- Root layout: added `openGraph` defaults (siteName, image, description)

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

| File | Detail | Reason |
|------|--------|--------|
| public/og-image.png | File does not exist in repo | Brand image needs to be provided (1200x630 PNG). Metadata references `/og-image.png` as fallback. All OG tags work correctly; social platforms will show no image preview until file is added. |

## Verification

- pnpm typecheck: PASSED
- pnpm build: PASSED
- Acceptance criteria: All met

## Self-Check: PASSED

- All 3 modified files exist on disk
- Both commits (55af5908, e409fe2b) present in git log
- `sticky bottom-0 z-20` found in order detail page
- `generateMetadata` found in share page
- `openGraph` found in root layout
