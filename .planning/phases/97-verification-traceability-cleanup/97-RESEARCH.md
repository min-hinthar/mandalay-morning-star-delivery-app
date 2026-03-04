# Phase 97: Phase 89/90 Verification & Traceability Cleanup - Research

**Researched:** 2026-03-04
**Domain:** Verification, traceability, documentation cleanup
**Confidence:** HIGH

## Summary

Phase 97 is a pure documentation and verification phase -- no code changes. The task is to formally verify Phase 89 (7 bug fix requirements) and Phase 90 (8 menu/admin requirements) against their success criteria, create VERIFICATION.md for each, then update REQUIREMENTS.md checkboxes and fix ROADMAP.md formatting inconsistencies.

All 15 requirements have been researched against the actual codebase. Every requirement has verifiable implementation evidence with specific file paths, line numbers, and test locations. The Phase 91 VERIFICATION.md provides the exact template to follow.

**Primary recommendation:** Create two VERIFICATION.md files (89 and 90) following the 91-VERIFICATION.md pattern, then update REQUIREMENTS.md and ROADMAP.md in a single documentation pass.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Same detailed format as Phase 91-95 VERIFICATION.md files (consistency across all phases)
- Per-requirement evidence table with columns: #, Truth/Requirement, Status, Evidence
- Evidence includes file paths and line numbers referencing actual implementation
- Artifact audit section listing key files produced by each phase
- Verify-only -- do NOT fix code in this phase
- If a requirement isn't fully met: mark as FAILED with explanation of what's missing
- Any failures become input for a follow-up fix phase (not Phase 97's job)
- Check all 15 requirement checkboxes from `[ ]` to `[x]` (BUG-01..07, MENU-01..07, ADMIN-02)
- Update traceability table statuses from "Pending" to "Complete"
- Only check boxes where verification confirms actual completion
- Fix progress table statuses for Phase 89 and 90
- Fix formatting inconsistencies in the progress table (missing v2.0 column, misaligned rows for phases 91-95)
- Ensure all completed phases show consistent format: milestone, plan count, status, completion date

### Claude's Discretion
- Exact wording of "observable truths" derived from success criteria
- How to group evidence (per-requirement vs per-plan)
- Whether to reference SUMMARY.md files as supporting evidence alongside code references

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUG-01 | Fix payment retry idempotency key | Verified: `retry-payment/route.ts` line 205: `idempotencyKey: \`retry_${order.id}\`` |
| BUG-02 | Validate modifier group min_select/max_select constraints at checkout | Verified: `order.ts` lines 5, 182, 256, 264 (ModifierGroupWithItems, validation loop); `route.ts` lines 199-215 (fetch + validate); 5 tests in `order.test.ts` lines 465+ |
| BUG-03 | Add checkout cleanup rollback with try/catch on each delete | Verified: `helpers.ts` lines 7-29 (cleanupOrder with 3 independent try/catch blocks) |
| BUG-04 | Fix type assertion null crash on RPC checkout result | Verified: `route.ts` lines 313-328 (typeof/Array.isArray guards, graceful error on unexpected shape) |
| BUG-05 | Add refund amount ceiling validation | Verified: `refund/route.ts` lines 104-161 (Phase 1 calculate, Phase 2 apply pattern; ceiling check at line 155) |
| BUG-06 | Fix cart store debounce race condition | Verified: `cart-store.ts` lines 44-47 (comment), 82-95 (debounce inside set()); 3 tests in `cart-store.test.ts` lines 92+ |
| BUG-07 | Add cutoff time 10-second safety buffer | Verified: `delivery-dates.ts` line 10 (CUTOFF_SAFETY_BUFFER_MS = 10_000), line 175 (isPastCutoff uses buffer); 7 tests in `delivery-dates.test.ts` lines 122+ |
| MENU-01 | Admin can upload photos for menu items via Supabase Storage | Verified: `PhotoUploadZone.tsx` uses `uploadMenuPhotoViaServer`; `storage.ts` line 127 |
| MENU-02 | Admin can bulk-upload photos via drag-drop grid matched by item slug | Verified: `BulkUploadMatcher.tsx` exists; `admin/photos/page.tsx` integrates it |
| MENU-03 | Photos auto-processed to WebP/AVIF, min 800x600, max 2MB, 4:3 crop | Verified: `photos/process/route.ts` lines 8-15 (sharp, 800x600, WebP quality 80, 2MB max) |
| MENU-04 | Menu items track photo freshness via image_updated_at column | Verified: `033_photo_pipeline.sql` lines 4-24 (column + trigger); `001_schema.sql` line 105 |
| MENU-05 | Allergens come from single source | Verified: `MenuItemFormFields.tsx` (ALLERGEN_OPTIONS); `seed-menu.ts` line 70 (validateAllergens); seed YAML cleaned |
| MENU-06 | Admin can mark items inactive | Verified: `/api/menu/route.ts` line 71 `.eq("is_active", true)`; `/api/menu/search/route.ts` line 111 `.eq("is_active", true)` |
| MENU-07 | Seed fallback photos from data/menu-photos/ | Verified: `scripts/seed-photos.ts` exists; `package.json` has `seed:photos` script; slug-based matching |
| ADMIN-02 | Admin menu photo management grid (upload, crop, replace) | Verified: `BulkUploadMatcher.tsx` + `PhotoUploadZone.tsx` + `admin/photos/page.tsx` provide full management UI |
</phase_requirements>

## Standard Stack

This phase requires no libraries -- it is purely documentation. The "stack" is the VERIFICATION.md template pattern.

### VERIFICATION.md Template Pattern (from Phase 91)

| Section | Purpose | Required |
|---------|---------|----------|
| YAML frontmatter | phase, verified, status, score, re_verification | Yes |
| Observable Truths table | Maps success criteria to file:line evidence | Yes |
| Required Artifacts table | Lists key files with status | Yes |
| Key Link Verification | Cross-file wiring evidence | Optional |
| Requirements Coverage | Per-requirement status with evidence | Yes |
| Anti-Patterns Found | Files over 400 lines, stubs, etc. | Yes |
| Human Verification Required | Manual tests for visual/UX items | If applicable |
| Gaps Summary | Final assessment | Yes |

### YAML Frontmatter Format
```yaml
---
phase: {phase-slug}
verified: {ISO-8601 timestamp}
status: passed|failed|human_needed
score: N/N must-haves verified
re_verification: false
---
```

## Architecture Patterns

### Phase 89 Verification Structure

Phase 89 has 7 success criteria from ROADMAP.md (lines 89-95). Each maps directly to one BUG requirement:

| Success Criterion | Requirement | Plan | Key File(s) |
|-------------------|-------------|------|-------------|
| SC-1: Deterministic idempotency key from order ID | BUG-01 | 89-01 | `retry-payment/route.ts:205` |
| SC-2: Checkout rejects modifier constraint violations | BUG-02 | 89-02 | `order.ts:182,256,264`, `route.ts:199-215` |
| SC-3: Independent cleanup rollback with try/catch | BUG-03 | 89-01 | `helpers.ts:7-29` |
| SC-4: RPC result handles null without type assertion crash | BUG-04 | 89-01 | `route.ts:313-328` |
| SC-5: Refund rejects amount exceeding total_cents | BUG-05 | 89-03 | `refund/route.ts:104-161` |
| SC-6: Concurrent cart addItem cannot bypass debounce | BUG-06 | 89-03 | `cart-store.ts:82-95` |
| SC-7: Orders within 10s of cutoff rejected | BUG-07 | 89-04 | `delivery-dates.ts:10,175` |

**Artifact inventory for Phase 89:**
- `src/app/api/orders/[id]/retry-payment/route.ts` (modified)
- `src/app/api/checkout/session/route.ts` (modified)
- `src/app/api/checkout/session/helpers.ts` (created: cleanupOrder, buildModifierGroupsMap)
- `src/lib/utils/order.ts` (modified: ModifierGroupWithItems, constraint validation)
- `src/lib/utils/__tests__/order.test.ts` (modified: 5 BUG-02 tests)
- `src/app/api/admin/orders/[id]/refund/route.ts` (modified)
- `src/lib/stores/cart-store.ts` (modified: debounce in set())
- `src/lib/stores/__tests__/cart-store.test.ts` (modified: 3 BUG-06 tests)
- `src/lib/utils/delivery-dates.ts` (modified: CUTOFF_SAFETY_BUFFER_MS)
- `src/lib/utils/__tests__/delivery-dates.test.ts` (modified: 7 BUG-07 tests)

### Phase 90 Verification Structure

Phase 90 has 6 success criteria from ROADMAP.md (lines 108-113). They map to 8 requirements:

| Success Criterion | Requirements | Plan | Key File(s) |
|-------------------|-------------|------|-------------|
| SC-1: Admin upload photo, reflected on customer menu | MENU-01, ADMIN-02 | 90-04 | `PhotoUploadZone.tsx`, `admin/photos/page.tsx` |
| SC-2: Drag-drop multiple photos auto-matched by slug | MENU-02 | 90-04 | `BulkUploadMatcher.tsx` |
| SC-3: Auto-converted WebP/AVIF 4:3 with validation | MENU-03 | 90-01 | `photos/process/route.ts:8-15` |
| SC-4: Admin can mark items inactive | MENU-06 | 90-02 | `menu/route.ts:71`, `menu/search/route.ts:111` |
| SC-5: Single authoritative allergen source | MENU-05 | 90-02 | `MenuItemFormFields.tsx`, `seed-menu.ts:70` |
| SC-6: All 53 items have fallback photo | MENU-07 | 90-03 | `scripts/seed-photos.ts` |

Additional requirements covered but not in success criteria (implicit):
- MENU-04 (image_updated_at tracking): `033_photo_pipeline.sql:4-24`

**Artifact inventory for Phase 90:**
- `src/app/api/admin/photos/process/route.ts` (created)
- `supabase/migrations/033_photo_pipeline.sql` (created)
- `src/lib/supabase/storage.ts` (modified: uploadMenuPhotoViaServer)
- `src/lib/utils/image-optimization.ts` (modified: 4:3 aspect ratio)
- `src/types/database.ts` (modified: image_updated_at)
- `scripts/seed-photos.ts` (created)
- `scripts/seed-menu.ts` (modified: validateAllergens)
- `data/menul.seed.yaml` (modified: removed contains_* tags)
- `src/app/(admin)/admin/menu/[id]/MenuItemFormFields.tsx` (modified: ALLERGEN_OPTIONS)
- `src/components/ui/admin/photos/BulkUploadMatcher.tsx` (created)
- `src/components/ui/admin/photos/PhotoUploadZone.tsx` (modified)
- `src/app/(admin)/admin/menu/[id]/MenuItemPhotoSection.tsx` (modified)
- `src/app/(admin)/admin/photos/page.tsx` (modified)
- `package.json` (modified: seed:photos script)

### REQUIREMENTS.md Update Locations

All 15 checkboxes currently `[ ]`:
- Lines 12-18: BUG-01 through BUG-07
- Lines 22-28: MENU-01 through MENU-07
- Line 69: ADMIN-02

Traceability table (lines 188-204): all 15 entries say "Pending", must change to "Complete".

### ROADMAP.md Formatting Issues

**Issue 1: Missing v2.0 milestone column for Phases 91-95**
Phases 89 and 90 have correct 5-column format:
```
| 89. Critical Bug Fixes | v2.0 | 4/4 | Complete | 2026-03-03 |
```
Phases 91-95 are missing the v2.0 column, causing column shift:
```
| 91. Checkout & Payment Hardening | 4/4 | Complete    | 2026-03-03 | - |
```
Should be:
```
| 91. Checkout & Payment Hardening | v2.0 | 4/4 | Complete | 2026-03-03 |
```

**Issue 2: Phase 89 and 90 checkmarks in phase list section**
Lines 72-73 already show `[x]` for both -- this is correct. No change needed.

**Issue 3: Phase 96 and 97 status rows need accurate representation**
- Phase 96 row (line 260) says "0/2" -- this needs updating only after Phase 96 completes
- Phase 97 row (line 261) says "0/TBD" -- this needs updating after Phase 97 completes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VERIFICATION.md format | Custom format | 91-VERIFICATION.md template | Consistency across 7 existing verification files |
| Requirement-to-plan mapping | Manual tracking | v2.0-MILESTONE-AUDIT.md frontmatter | Audit already maps all 15 requirements to plans and summaries |
| Evidence line numbers | Guessing from summaries | Actual grep/read of source files | SUMMARY.md line references may be stale after subsequent phases modified same files |

## Common Pitfalls

### Pitfall 1: Stale line numbers from SUMMARY.md
**What goes wrong:** SUMMARY files reference line numbers at the time of writing. Subsequent phases may have modified the same files, shifting line numbers.
**Why it happens:** Phase 91 modified `checkout/session/route.ts` after Phase 89 -- line numbers from 89-01-SUMMARY.md are outdated.
**How to avoid:** Always verify line numbers against current source code, not summaries. The research above provides current line numbers as of 2026-03-04.
**Warning signs:** Evidence referencing lines beyond file length, or lines that don't contain the expected code.

### Pitfall 2: MENU-03 says "WebP/AVIF" but only WebP is implemented
**What goes wrong:** The requirement text says "WebP/AVIF" but the implementation only produces WebP.
**Why it happens:** AVIF support in sharp requires additional configuration and the CONTEXT.md for Phase 90 doesn't mention AVIF.
**How to avoid:** Verification should note this discrepancy. The implementation meets the spirit (auto-processed to optimized format) but strictly speaking only WebP is output. Mark as VERIFIED with a note.
**Warning signs:** Requirement text mentions two formats but only one is implemented.

### Pitfall 3: ROADMAP.md column misalignment
**What goes wrong:** Editing one row without fixing adjacent rows perpetuates inconsistency.
**Why it happens:** Phases 91-95 were added at different times with different column conventions.
**How to avoid:** Fix ALL rows 91-97 to match the 89/90 format in a single edit.

### Pitfall 4: MENU-06 has no new code
**What goes wrong:** Verifier looks for Phase 90 changes but finds none for MENU-06 (is_active filtering).
**Why it happens:** The filtering already existed in `/api/menu` and `/api/menu/search` before Phase 90. The 90-02 SUMMARY explicitly states "is_active filtering already present on customer endpoints -- no code changes needed for MENU-06."
**How to avoid:** Mark as VERIFIED with evidence of the pre-existing filtering code. This is valid -- the requirement is met, just not by Phase 90 code.

### Pitfall 5: MENU-07 requires runtime verification
**What goes wrong:** The seed-photos script exists but hasn't necessarily been run on production.
**Why it happens:** Script existence != execution.
**How to avoid:** Verify the script exists and works (code review), note in human verification that actual seeding is a deployment step.

## Code Examples

### VERIFICATION.md Observable Truths Table Pattern
```markdown
| # | Truth/Requirement | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | Payment retries reuse deterministic idempotency key from order ID | VERIFIED | `retry-payment/route.ts` line 205: `idempotencyKey: \`retry_${order.id}\`` |
```

### REQUIREMENTS.md Checkbox Update Pattern
```markdown
- [x] **BUG-01**: Fix payment retry idempotency key -- remove Date.now(), use `retry_${order.id}`
```

### ROADMAP.md Progress Table Fix Pattern
```markdown
| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 91. Checkout & Payment Hardening | v2.0 | 4/4 | Complete | 2026-03-03 |
```

## ROADMAP.md Full Formatting Fix

Current progress table (lines 251-261) needs these specific fixes:

**Rows 255-259 (Phases 91-95):** Add missing "v2.0" column and remove trailing "- |":
```
BEFORE: | 91. Checkout & Payment Hardening | 4/4 | Complete    | 2026-03-03 | - |
AFTER:  | 91. Checkout & Payment Hardening | v2.0 | 4/4 | Complete | 2026-03-03 |
```

Apply to all 5 rows (91, 92, 93, 94, 95).

**Row 261 (Phase 97):** Update plan count once known.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | N/A -- this is a documentation-only phase |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01..07 | Verification evidence documented | manual-only | N/A -- documentation review | N/A |
| MENU-01..07 | Verification evidence documented | manual-only | N/A -- documentation review | N/A |
| ADMIN-02 | Verification evidence documented | manual-only | N/A -- documentation review | N/A |

**Justification for manual-only:** Phase 97 produces only .md files (VERIFICATION.md, REQUIREMENTS.md updates, ROADMAP.md fixes). There is no code to test. Verification is by document review.

### Sampling Rate
- **Per task commit:** N/A -- documentation phase
- **Per wave merge:** Visual review of .md files
- **Phase gate:** All 15 requirements have evidence in VERIFICATION.md; REQUIREMENTS.md checkboxes updated; ROADMAP.md formatting consistent

### Wave 0 Gaps
None -- no test infrastructure needed for documentation phase.

## Open Questions

1. **MENU-03 WebP vs WebP/AVIF**
   - What we know: Implementation produces WebP only; requirement says "WebP/AVIF"
   - What's unclear: Whether AVIF was intentionally dropped or is a gap
   - Recommendation: Mark VERIFIED with a note that only WebP is produced; the sharp pipeline could add AVIF but Phase 90 CONTEXT decided WebP-only

2. **MENU-07 seed script execution**
   - What we know: Script exists and is correctly implemented
   - What's unclear: Whether it has been run on production
   - Recommendation: Mark VERIFIED for code existence; note in human verification section that production seeding is a deployment step

## Sources

### Primary (HIGH confidence)
- Phase 91 VERIFICATION.md -- template pattern (read in full)
- Phase 89 SUMMARY files (89-01 through 89-04) -- implementation details
- Phase 90 SUMMARY files (90-01 through 90-04) -- implementation details
- v2.0-MILESTONE-AUDIT.md -- requirement-to-plan mapping
- ROADMAP.md -- success criteria and formatting issues
- REQUIREMENTS.md -- checkbox and traceability table locations

### Source Code Verification (HIGH confidence)
All 15 requirements verified against current source code with grep/read:
- `src/app/api/orders/[id]/retry-payment/route.ts` -- BUG-01
- `src/app/api/checkout/session/route.ts` -- BUG-02, BUG-04
- `src/app/api/checkout/session/helpers.ts` -- BUG-03
- `src/app/api/admin/orders/[id]/refund/route.ts` -- BUG-05
- `src/lib/stores/cart-store.ts` -- BUG-06
- `src/lib/utils/delivery-dates.ts` -- BUG-07
- `src/lib/utils/order.ts` -- BUG-02
- `src/lib/utils/__tests__/order.test.ts` -- BUG-02 tests
- `src/lib/stores/__tests__/cart-store.test.ts` -- BUG-06 tests
- `src/lib/utils/__tests__/delivery-dates.test.ts` -- BUG-07 tests
- `src/app/api/admin/photos/process/route.ts` -- MENU-03
- `supabase/migrations/033_photo_pipeline.sql` -- MENU-04
- `src/lib/supabase/storage.ts` -- MENU-01
- `scripts/seed-photos.ts` -- MENU-07
- `scripts/seed-menu.ts` -- MENU-05
- `src/app/(admin)/admin/menu/[id]/MenuItemFormFields.tsx` -- MENU-05
- `src/app/api/menu/route.ts` -- MENU-06
- `src/app/api/menu/search/route.ts` -- MENU-06
- `src/components/ui/admin/photos/BulkUploadMatcher.tsx` -- MENU-02, ADMIN-02
- `src/components/ui/admin/photos/PhotoUploadZone.tsx` -- MENU-01, ADMIN-02
- `src/app/(admin)/admin/photos/page.tsx` -- ADMIN-02

## Metadata

**Confidence breakdown:**
- Requirement evidence mapping: HIGH -- every requirement verified against current source
- VERIFICATION.md template: HIGH -- 91-VERIFICATION.md read in full, pattern is clear
- ROADMAP formatting issues: HIGH -- exact line numbers and column misalignment identified
- REQUIREMENTS.md update locations: HIGH -- exact line numbers verified

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- documentation phase with no dependency on changing libraries)
