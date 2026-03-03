# Phase 90: Menu & Photo Pipeline - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can manage all menu item photos from the dashboard. Photos are production-quality (WebP, 4:3 crop, min 800x600, max 2MB). Bulk upload with auto-matching. All 53 items have at least a fallback photo. Allergen data is deduplicated. Admin can mark items inactive. Requirements: MENU-01 through MENU-07, ADMIN-02.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation decisions delegated to Claude. User trusts Claude to pick the best approach for each area based on existing code patterns and requirements. Key areas of discretion:

**Photo Processing (MENU-03)**
- Processing location: server-side (sharp) vs client-side (Canvas) vs hybrid — Claude picks based on WebP/AVIF requirement reliability and Vercel serverless constraints
- Output format: WebP only vs WebP+AVIF — Claude picks based on storage cost and browser support at 53-item scale
- Cropping behavior: auto center-crop to 4:3 vs manual crop UI — Claude picks based on admin workflow simplicity
- Google Drive URL flow: keep alongside Supabase Storage uploads or remove — Claude picks based on current owner workflow (owner shares via Drive)

**Bulk Upload Matching (MENU-02)**
- Matching strategy: fuzzy slug match vs exact filename match — Claude picks based on error tolerance
- Unmatched file handling: upload as unassigned vs reject — Claude picks based on existing unassigned folder pattern
- Review step: preview+confirm vs immediate upload — Claude picks based on admin UX
- Overwrite behavior: replace with warning vs skip existing — Claude picks the safest approach

**Allergen Dedup (MENU-05)**
- Source strategy: keep both tags+allergens with overlap removal vs merge into single field — Claude analyzes actual data overlap and picks cleanest approach
- Editability: seed YAML as read-only source vs admin-editable — Claude picks based on food safety best practices
- Customer display: icons on detail sheet vs text badges on card+detail — Claude picks based on existing card design constraints

**Seed & Fallback (MENU-07)**
- Seeding mechanism: extend pnpm seed:menu CLI vs admin button vs migration — Claude picks most reliable approach
- Override behavior: admin photo wins (fallback stays in storage) vs fallback deleted — Claude picks based on storage cost vs safety
- No-photo placeholder: generic food icon vs hide image area — Claude picks based on existing menu card patterns
- Seed matching: filename-to-slug convention vs mapping file — Claude picks based on existing data/menu-photos/ naming

**Item Inactive Toggle (MENU-06)**
- UI approach for marking items inactive — Claude picks (toggle, bulk action, confirmation dialog)

**Photo Freshness (MENU-04)**
- image_updated_at column implementation — straightforward DB migration, Claude handles

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All requirements have clear success criteria in REQUIREMENTS.md. User wants Claude to make pragmatic choices based on existing infrastructure.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(admin)/admin/photos/page.tsx`: Full photo management page with PhotoGrid, PhotoUploadZone, PhotoMetadata, PhotosStatsCards, PhotosFilters — extend rather than rebuild
- `src/lib/supabase/storage.ts`: Upload, validate, optimize (Canvas-based), delete, move, Google Drive verify — enhance with WebP/server processing
- `src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx`: Per-item photo upload + Google Drive URL support
- `src/components/ui/admin/photos/PhotoGrid.tsx`: Grid with selection, assignment badges, hover overlays
- `src/components/ui/admin/photos/PhotoMetadata.tsx`: Photo detail panel with assign/delete/Drive link actions
- `src/lib/utils/image-optimization.ts`: IMAGE_SIZES presets (menuCard 400x225 at 16:9), srcSet, aspect ratio helpers
- `scripts/seed-menu.ts`: Existing seed script — extend for photo seeding
- `data/menu-photos/`: 54 fallback photos named by slug convention

### Established Patterns
- Supabase Storage bucket `menu-photos` with folder structure: `{menuItemId}/{timestamp}.jpg` or `unassigned/{timestamp}.jpg`
- Client-side image optimization via Canvas API (resize to 800px width, JPEG 85% quality)
- API routes at `/api/admin/photos/` and `/api/admin/menu/` for CRUD operations
- PhotoUploadZone component accepts `menuItemId` prop for direct assignment
- Framer Motion animations on all admin page elements (m.div with opacity/y transitions)
- Toast notifications via `useToastV8` for success/error feedback
- Next.js Image component with `sizes` prop for responsive loading

### Integration Points
- Menu item detail page (`/admin/menu/[id]`) — MenuItemPhotoSection connects upload to item
- Admin photos page (`/admin/photos`) — PhotoGrid manages bulk operations
- Customer menu (`/menu`) — reads `image_url` from menu_items table
- Supabase `menu_items` table — `image_url`, `is_active`, `tags`, `allergens` columns
- `menu.seed.yaml` — `allergens_enum` defines canonical allergen list
- `pnpm seed:menu` — existing script to seed menu data from YAML

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 90-menu-photo-pipeline*
*Context gathered: 2026-03-03*
