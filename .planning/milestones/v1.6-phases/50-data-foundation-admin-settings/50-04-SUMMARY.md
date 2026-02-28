---
phase: 50-data-foundation-admin-settings
plan: 04
subsystem: ui
tags: [react, supabase, framer-motion, customer-settings, admin-dashboard]

# Dependency graph
requires:
  - phase: 50-01
    provides: customer_settings table, RLS policies, migration 019
  - phase: 50-03
    provides: SettingsClient integration, form expansion, settings-defaults
provides:
  - SettingsNudgeBanner component for customer engagement on home page
  - PreferenceCounterCard widget for admin dashboard preference visibility
  - CustomerSettings TypeScript types in database.ts
affects: [customer-settings-page, admin-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline save via Supabase client upsert with optimistic feedback"
    - "localStorage-based dismissibility for engagement banners"
    - "Server-side aggregate queries in admin dashboard widgets"

key-files:
  created:
    - src/components/ui/homepage/SettingsNudgeBanner.tsx
    - src/components/ui/admin/PreferenceCounterCard.tsx
  modified:
    - src/app/(public)/page.tsx
    - src/app/(admin)/admin/page.tsx
    - src/types/database.ts

key-decisions:
  - "DFAS-04-UPSERT: Nudge banner uses direct Supabase client upsert (no API route) for inline saves"
  - "DFAS-04-DBTYPES: Added CustomerSettings Row/Insert/Update types to database.ts for type safety"
  - "DFAS-04-PLACEMENT: PreferenceCounterCard placed as new row below 3-column grid (not crowding existing cards)"

patterns-established:
  - "Customer engagement banner: auth-gated, localStorage-dismissible, inline-save pattern"
  - "Admin aggregate widget: server component with Supabase query and sorted counts"

# Metrics
duration: 16min
completed: 2026-02-08
---

# Phase 50 Plan 04: Customer Nudge Banner & Admin Preference Widget Summary

**SettingsNudgeBanner with dietary/delivery/notification mini-toggles on home page + PreferenceCounterCard aggregate widget on admin dashboard**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-08T10:48:36Z
- **Completed:** 2026-02-08T11:05:00Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Branded dismissible nudge card on home page with star mascot, warm amber/orange gradient, and 3 inline-save sections
- Mini-preview toggles: dietary restriction pills, delivery instructions text input, notification toggle switches -- all save inline to customer_settings via Supabase client
- Admin dashboard preference counter widget aggregating dietary restriction counts and notification opt-out summary
- CustomerSettings TypeScript types added to database.ts for full type safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SettingsNudgeBanner with mini-preview toggles** - `a05426b` (feat)
2. **Task 2: Create PreferenceCounterCard for admin dashboard** - `4e46e29` (feat)

## Files Created/Modified

- `src/components/ui/homepage/SettingsNudgeBanner.tsx` - Branded nudge card with auth check, dismiss/visit localStorage, 3 inline-save sections
- `src/components/ui/admin/PreferenceCounterCard.tsx` - Server component aggregating customer_settings for admin dashboard
- `src/app/(public)/page.tsx` - Added SettingsNudgeBanner after Hero section
- `src/app/(admin)/admin/page.tsx` - Added PreferenceCounterCard below 3-column grid
- `src/types/database.ts` - Added CustomerSettingsRow, CustomerSettingsInsert, CustomerSettingsUpdate interfaces and table definition

## Decisions Made

- Used direct Supabase client upsert (no separate API route) for inline saves -- RLS allows customer writes to own row
- Added CustomerSettings types to database.ts rather than a separate types file -- keeps all DB types centralized
- Placed PreferenceCounterCard as a new row below the existing 3-column grid to avoid crowding
- Used `bg-surface-primary` semantic tokens instead of `bg-white` per lint rules
- Cast JSONB fields through `unknown` to satisfy TypeScript Json type compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed semantic token lint errors**

- **Found during:** Task 1 (SettingsNudgeBanner)
- **Issue:** Used `bg-white` and `text-white` which violate no-restricted-syntax lint rule requiring semantic tokens
- **Fix:** Replaced with `bg-surface-primary`, `bg-surface-primary/70`, `bg-surface-primary/80`, `text-text-inverse`
- **Files modified:** src/components/ui/homepage/SettingsNudgeBanner.tsx
- **Verification:** `pnpm lint` passes with 0 errors
- **Committed in:** a05426b (part of Task 1 commit)

**2. [Rule 3 - Blocking] Added CustomerSettings TypeScript types to database.ts**

- **Found during:** Task 1 (SettingsNudgeBanner)
- **Issue:** customer_settings table had no TypeScript type definitions -- Supabase queries fell back to generic types, causing type errors with JSONB fields
- **Fix:** Added CustomerSettingsRow, CustomerSettingsInsert, CustomerSettingsUpdate interfaces and table entry in Database type
- **Files modified:** src/types/database.ts
- **Verification:** `pnpm typecheck` passes
- **Committed in:** a05426b (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correct build. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 50 (Data Foundation & Admin Settings) is now complete (4/4 plans)
- Customer-facing settings nudge drives adoption of customer_settings table
- Admin visibility into customer preferences established
- Ready for next phase in v1.6 Production Polish milestone

---

_Phase: 50-data-foundation-admin-settings_
_Completed: 2026-02-08_
