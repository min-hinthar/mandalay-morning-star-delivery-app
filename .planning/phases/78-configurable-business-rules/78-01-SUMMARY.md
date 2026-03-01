---
phase: 78-configurable-business-rules
plan: 01
subsystem: api
tags: [next-cache, unstable_cache, supabase, zod, settings, business-rules]

# Dependency graph
requires: []
provides:
  - "getBusinessRules() cached server reader for 9 delivery config values"
  - "generateTimeWindows() pure function replacing TIME_WINDOWS constant"
  - "Migration 029 seeding 5 new delivery keys + fixing 2 mismatched seeds"
  - "revalidateTag('business-rules') wiring in PATCH and restore handlers"
  - "Extended Zod schema and TypeScript types for all business rule fields"
affects: [78-02, 78-03, 78-04, admin-settings-ui, checkout, delivery-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "unstable_cache with tag-based invalidation for server-side settings"
    - "Base schema + refine pattern for partial validation compatibility"

key-files:
  created:
    - src/lib/settings/business-rules.ts
    - src/lib/settings/generate-time-windows.ts
    - src/lib/settings/index.ts
    - src/lib/settings/__tests__/business-rules.test.ts
    - src/lib/settings/__tests__/generate-time-windows.test.ts
    - supabase/migrations/029_business_rules_settings.sql
  modified:
    - src/lib/validations/settings.ts
    - src/components/ui/admin/settings/settings-types.ts
    - src/components/ui/admin/settings/SettingsClient/settings-defaults.ts
    - src/app/api/admin/settings/route.ts
    - src/app/api/admin/settings/restore/route.ts
    - src/components/ui/admin/settings/DeliverySettingsForm.tsx
    - src/components/ui/admin/settings/delivery-helpers.ts

key-decisions:
  - "Dropped import 'server-only' -- package not installed, unstable_cache already server-scoped"
  - "Split deliverySettingsBaseSchema from refine for .partial() compatibility in update validation"
  - "Used revalidateTag with { expire: 0 } profile for Next.js 16 API compatibility"

patterns-established:
  - "Settings reader pattern: unstable_cache + tag + DB fallback to defaults"
  - "Base schema + refine separation for Zod cross-field validation with partial updates"

requirements-completed: [RULES-01, RULES-02, RULES-03, RULES-04, RULES-05, RULES-07, RULES-10]

# Metrics
duration: 13min
completed: 2026-03-01
---

# Phase 78 Plan 01: Business Rules Foundation Summary

**Cached getBusinessRules() reader with tag-based invalidation, dynamic time window generator, DB migration for 5 new delivery keys, and Zod/TypeScript extensions**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-01T11:09:57Z
- **Completed:** 2026-03-01T11:22:39Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- `getBusinessRules()` returns all 9 delivery settings via `unstable_cache` with `business-rules` tag and 300s TTL
- `generateTimeWindows(11, 19)` produces 8 windows matching existing `TIME_WINDOWS` format exactly
- Migration 029 seeds 5 new keys and conditionally fixes 2 mismatched defaults (599->1500, 5000->10000)
- Admin settings PATCH and restore handlers call `revalidateTag("business-rules", { expire: 0 })` after upsert
- Zod schema extended with cross-field `delivery_end_hour > delivery_start_hour` validation
- 13 unit tests covering fallback defaults, key mapping, partial data, slot generation, AM/PM formatting

## Task Commits

Each task was committed atomically:

1. **Task 1: Create settings library and DB migration** - `900fcb02` (feat)
2. **Task 2: Extend schemas, types, defaults, and wire cache invalidation** - `0ca9828f` (feat)

## Files Created/Modified

- `src/lib/settings/business-rules.ts` - Cached DB reader for 9 business rule values
- `src/lib/settings/generate-time-windows.ts` - Pure function generating 1-hour TimeWindow[] slots
- `src/lib/settings/index.ts` - Barrel re-exports
- `src/lib/settings/__tests__/business-rules.test.ts` - 6 tests: DB data, error fallback, key mapping, partial data
- `src/lib/settings/__tests__/generate-time-windows.test.ts` - 7 tests: slot count, AM/PM, boundaries
- `supabase/migrations/029_business_rules_settings.sql` - 5 INSERTs + 2 conditional UPDATEs
- `src/lib/validations/settings.ts` - Added 5 new fields, split base schema, removed old fields
- `src/components/ui/admin/settings/settings-types.ts` - New fields on DeliverySettings interface
- `src/components/ui/admin/settings/SettingsClient/settings-defaults.ts` - Updated defaults and mapApiResponse
- `src/app/api/admin/settings/route.ts` - revalidateTag wiring in PATCH handler
- `src/app/api/admin/settings/restore/route.ts` - Updated defaults + revalidateTag wiring
- `src/components/ui/admin/settings/DeliverySettingsForm.tsx` - Replaced cutoff/windows UI with new fields
- `src/components/ui/admin/settings/delivery-helpers.ts` - Updated validation for new field types

## Decisions Made

- Dropped `import "server-only"` -- package not installed, `unstable_cache` + `next/cache` already prevent client bundling
- Split `deliverySettingsBaseSchema` from `.refine()` chain so `updateSettingsSchema` can call `.partial()` (ZodEffects lacks .partial())
- Used `revalidateTag("tag", { expire: 0 })` for Next.js 16 which requires a second profile argument

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed DeliverySettingsForm type errors from removed fields**
- **Found during:** Task 2
- **Issue:** Removing `deliveryCutoffTime` and `deliveryTimeWindows` from `DeliverySettings` broke `DeliverySettingsForm.tsx` and `delivery-helpers.ts`
- **Fix:** Rewrote form to use new numeric fields (cutoffDay, cutoffHour, deliveryStartHour, deliveryEndHour, maxDeliveryDurationMinutes), removed time window manual management, updated validation
- **Files modified:** `src/components/ui/admin/settings/DeliverySettingsForm.tsx`, `src/components/ui/admin/settings/delivery-helpers.ts`
- **Verification:** `pnpm typecheck` passes, `pnpm build` succeeds
- **Committed in:** `0ca9828f` (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed Zod .partial() incompatibility with .refine()**
- **Found during:** Task 2
- **Issue:** Adding `.refine()` to `deliverySettingsSchema` made it a `ZodEffects`, breaking `.partial()` call in `updateSettingsSchema`
- **Fix:** Split into `deliverySettingsBaseSchema` (ZodObject) and `deliverySettingsSchema` (with refine); use base for `.partial()`
- **Files modified:** `src/lib/validations/settings.ts`
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `0ca9828f` (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed revalidateTag signature for Next.js 16**
- **Found during:** Task 2
- **Issue:** Next.js 16 `revalidateTag` requires 2nd argument (profile), calling with 1 arg causes type error
- **Fix:** Added `{ expire: 0 }` as cache life profile
- **Files modified:** `src/app/api/admin/settings/route.ts`, `src/app/api/admin/settings/restore/route.ts`
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `0ca9828f` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for build/type correctness. No scope creep.

## Issues Encountered

- `server-only` package not installed -- resolved by removing the import (not needed for this use case)
- ESLint rejected `Function` type in test mock -- replaced with explicit `(...args: any[]) => any`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `getBusinessRules()` and `generateTimeWindows()` are ready for consumer integration in Plans 02-04
- Migration 029 needs to be applied to production Supabase
- Cache invalidation wiring complete -- any admin settings update for delivery category will bust the business-rules cache

## Self-Check: PASSED

- All 13 files verified present
- Commits `900fcb02` and `0ca9828f` verified in git log

---
*Phase: 78-configurable-business-rules*
*Completed: 2026-03-01*
