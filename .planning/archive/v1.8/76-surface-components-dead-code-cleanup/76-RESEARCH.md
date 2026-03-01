# Phase 76: Surface Hidden Components & Dead Code Cleanup - Research

**Researched:** 2026-02-26
**Domain:** Driver availability scheduling (one-off date blocking)
**Confidence:** HIGH

## Summary

Phase 76 closes the final v1.8 gap: **DDASH-07** (one-off unavailability — driver can block specific dates). The entire backend and component infrastructure already exists but is not wired into the UI.

The database schema (`availability_json` JSONB column on `drivers` table) already stores both `available_days` (recurring, DDASH-06) and `blocked_dates` (one-off, DDASH-07) in a single `DriverAvailability` object. The API endpoint (`/api/driver/availability` PATCH) already validates and persists `blocked_dates[]`. The `BlockedDateChips` component exists, is fully functional, and is exported from the `AvailabilityPicker` barrel — but is never imported or rendered anywhere in the app. Similarly, `AvailabilityToggle` exists but is unused.

**Primary recommendation:** Wire `BlockedDateChips` into `SchedulePageClient.tsx` below the existing `DayOfWeekPills`, add blocked-date state management with save logic, and optionally surface `AvailabilityToggle`. No new migrations, no new API endpoints, no new components needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DDASH-07 | One-off unavailability — driver can block specific dates (vacation, sick) | All infrastructure exists: `BlockedDateChips` component, `DriverAvailability.blocked_dates` type, `availability_json` JSONB column, `/api/driver/availability` PATCH endpoint with validation. Only missing: import and render `BlockedDateChips` in `SchedulePageClient`, add state + save handler. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 15.x | Page routing, server components | Already in use |
| Supabase | - | Database, auth, RLS | Already in use |
| Framer Motion | - | Animation (BlockedDateChips uses `m`, `AnimatePresence`) | Already in use |
| date-fns | - | Date formatting in BlockedDateChips | Already in use |
| lucide-react | - | Icons (Plus, X in BlockedDateChips) | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | All dependencies already installed and imported |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="date">` | Calendar picker library (react-day-picker) | Native input is already used in BlockedDateChips; no need for heavier lib |

**Installation:**
```bash
# No new dependencies required
```

## Architecture Patterns

### Existing File Structure (No Changes Needed)
```
src/
├── components/ui/driver/AvailabilityPicker/
│   ├── index.tsx              # Barrel (already exports all 3 components)
│   ├── DayOfWeekPills.tsx     # DDASH-06 (already wired)
│   ├── BlockedDateChips.tsx   # DDASH-07 (EXISTS, needs wiring)
│   └── AvailabilityToggle.tsx # Optional (EXISTS, needs wiring)
├── app/(driver)/driver/schedule/
│   ├── page.tsx               # Server component (already fetches availability)
│   └── SchedulePageClient.tsx # Client component (needs BlockedDateChips added)
├── app/api/driver/availability/
│   └── route.ts               # GET/PATCH (already handles blocked_dates)
├── lib/availability.ts        # isDriverAvailable() (already checks blocked_dates)
└── types/driver.ts            # DriverAvailability type (already has blocked_dates)
```

### Pattern 1: State Co-location in SchedulePageClient
**What:** Add `blockedDates` state alongside existing `selectedDays` state; save both together via existing PATCH endpoint.
**When to use:** Now — mirrors the `handleDaysChange` pattern already in place.
**Example:**
```typescript
// SchedulePageClient.tsx — add alongside existing selectedDays state
const [blockedDates, setBlockedDates] = useState<string[]>(
  availability?.blocked_dates ?? []
);

const handleBlockedDatesChange = useCallback(
  async (dates: string[]) => {
    setBlockedDates(dates);
    setIsSaving(true);
    try {
      await fetch("/api/driver/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available_days: selectedDays,
          blocked_dates: dates,
        }),
      });
    } finally {
      setIsSaving(false);
    }
  },
  [selectedDays]
);
```

### Pattern 2: Render BlockedDateChips Below DayOfWeekPills
**What:** Add a "Blocked Dates" section in SchedulePageClient render, importing `BlockedDateChips` from the existing barrel.
**Example:**
```tsx
import { DayOfWeekPills, BlockedDateChips } from "@/components/ui/driver/AvailabilityPicker";

// In render, below DayOfWeekPills section:
<div className="space-y-2">
  <p className="text-sm font-medium text-text-secondary">Blocked Dates</p>
  <BlockedDateChips dates={blockedDates} onChange={handleBlockedDatesChange} />
</div>
```

### Pattern 3: Cross-Reference Fix in handleDaysChange
**What:** The existing `handleDaysChange` callback currently reads `availability?.blocked_dates` from initial props. After adding local `blockedDates` state, it must reference the state variable instead.
**Why critical:** Without this fix, saving day-of-week changes would overwrite any blocked dates the driver just added (stale closure over initial props).
**Example:**
```typescript
// BEFORE (bug — reads stale prop):
body: JSON.stringify({
  available_days: days,
  blocked_dates: availability?.blocked_dates ?? [],
}),

// AFTER (reads current local state):
body: JSON.stringify({
  available_days: days,
  blocked_dates: blockedDates,
}),
```

### Anti-Patterns to Avoid
- **Separate API calls for days vs dates:** The single PATCH endpoint expects both `available_days` and `blocked_dates` together. Don't create a separate endpoint.
- **Creating new components:** `BlockedDateChips` already exists and is fully functional. Don't rebuild it.
- **New migration:** `blocked_dates` is already part of the `availability_json` JSONB default. No schema change needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date chip UI | Custom date chip component | `BlockedDateChips` (already built) | Handles add/remove, date validation, animation, formatting |
| Date formatting | Manual date string formatting | `date-fns format()` (already used in BlockedDateChips) | Locale-aware, timezone-safe |
| Availability check logic | Custom blocked-date filtering | `isDriverAvailable()` from `lib/availability.ts` | Already handles both available_days AND blocked_dates |
| Date validation | Custom YYYY-MM-DD validator | `isValidDateString()` in availability route.ts | Already handles edge cases |

**Key insight:** This phase is 95% wiring. Every piece — type, schema, migration, API, validation, component — already exists. The only work is importing `BlockedDateChips` into `SchedulePageClient`, adding state, and fixing the stale closure.

## Common Pitfalls

### Pitfall 1: Stale Closure on blocked_dates
**What goes wrong:** `handleDaysChange` captures `availability?.blocked_dates` from props, not the local `blockedDates` state. When driver adds blocked dates then changes available days, the blocked dates get overwritten with the initial prop value.
**Why it happens:** The current code was written when `blocked_dates` was not interactive — it only needed to preserve existing values.
**How to avoid:** Add `blockedDates` to the `useCallback` dependency array; reference local state instead of props.
**Warning signs:** Blocked dates disappear after toggling a day-of-week pill.

### Pitfall 2: Timezone Issues in Date Comparison
**What goes wrong:** `new Date("2026-03-15")` can resolve to March 14 or 15 depending on browser timezone.
**Why it happens:** ISO date strings without time component default to UTC midnight, which shifts in local timezone.
**How to avoid:** Already handled — both `BlockedDateChips` and `isDriverAvailable()` use `T12:00:00Z` suffix pattern. Don't change this.
**Warning signs:** Dates appear off-by-one in UI.

### Pitfall 3: Optimistic UI Without Error Handling
**What goes wrong:** Date changes save optimistically but silently fail.
**Why it happens:** Current `handleDaysChange` has `try/finally` but no error handling in the `try` block — same pattern should be used for blocked dates for consistency, but consider adding toast on error.
**How to avoid:** Match existing pattern (silent save with "Saving..." indicator). If adding error feedback, use existing toast infrastructure.
**Warning signs:** Driver thinks dates are saved but they aren't.

## Code Examples

### Complete SchedulePageClient Integration
```typescript
// Add import (update existing import line):
import { DayOfWeekPills, BlockedDateChips } from "@/components/ui/driver/AvailabilityPicker";

// Add state:
const [blockedDates, setBlockedDates] = useState<string[]>(
  availability?.blocked_dates ?? []
);

// Fix existing handleDaysChange to use blockedDates state:
const handleDaysChange = useCallback(
  async (days: DayOfWeek[]) => {
    setSelectedDays(days);
    setIsSaving(true);
    try {
      await fetch("/api/driver/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available_days: days,
          blocked_dates: blockedDates, // <-- was availability?.blocked_dates ?? []
        }),
      });
    } finally {
      setIsSaving(false);
    }
  },
  [blockedDates] // <-- was [availability?.blocked_dates]
);

// Add blocked dates handler:
const handleBlockedDatesChange = useCallback(
  async (dates: string[]) => {
    setBlockedDates(dates);
    setIsSaving(true);
    try {
      await fetch("/api/driver/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available_days: selectedDays,
          blocked_dates: dates,
        }),
      });
    } finally {
      setIsSaving(false);
    }
  },
  [selectedDays]
);
```

### JSX Addition (below DayOfWeekPills section)
```tsx
{/* Blocked Dates */}
<div className="space-y-2">
  <p className="text-sm font-medium text-text-secondary">Blocked Dates</p>
  <p className="text-xs text-text-muted">
    Block specific dates when you{"'"}re unavailable (vacation, sick, etc.)
  </p>
  <BlockedDateChips dates={blockedDates} onChange={handleBlockedDatesChange} />
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate `blocked_dates` table | JSONB column on `drivers` table | Phase 73 (migration 026) | Simpler queries, no joins needed |
| No availability checking | `isDriverAvailable()` checks both days + blocked dates | Phase 73 | Admin route-creation already shows availability badges |

**Already complete:**
- Database schema (migration 026)
- TypeScript types (`DriverAvailability`)
- API endpoint (GET/PATCH `/api/driver/availability`)
- Validation logic (server-side)
- Helper function (`isDriverAvailable`)
- UI component (`BlockedDateChips`)
- Admin integration (CreateRouteModal + DriverInfoCard both use `isDriverAvailable`)

## Open Questions

1. **AvailabilityToggle — wire or skip?**
   - What we know: `AvailabilityToggle` exists (global on/off for availability) but is never used. It could serve as a "mark unavailable for everything" toggle.
   - What's unclear: Whether the toggle should clear `available_days` or just be a separate boolean. Current type doesn't have a top-level `enabled` field.
   - Recommendation: Skip for DDASH-07 scope. The toggle would require a type change (`DriverAvailability` needs an `enabled` field) and behavior decision. DDASH-07 is specifically about blocking individual dates, not a global toggle. Can be a follow-up if desired.

2. **Past blocked dates cleanup?**
   - What we know: `BlockedDateChips` only allows adding dates >= today (via `min={today}` on the input). But past dates already in `blocked_dates` will render as chips.
   - What's unclear: Whether past dates should be auto-pruned on save or left visible.
   - Recommendation: Leave as-is for now. Past dates are harmless (they don't affect future availability checks) and provide history. Could add cleanup later.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/ui/driver/AvailabilityPicker/BlockedDateChips.tsx` — component exists, fully functional
- Codebase inspection: `src/app/api/driver/availability/route.ts` — PATCH validates both `available_days` and `blocked_dates`
- Codebase inspection: `supabase/migrations/026_driver_availability.sql` — JSONB column with `blocked_dates` in default
- Codebase inspection: `src/types/driver.ts` — `DriverAvailability.blocked_dates: string[]` defined
- Codebase inspection: `src/lib/availability.ts` — `isDriverAvailable()` checks `blocked_dates`
- Codebase inspection: `src/app/(driver)/driver/schedule/SchedulePageClient.tsx` — only `DayOfWeekPills` wired, `BlockedDateChips` not imported

### Secondary (MEDIUM confidence)
- None needed — all findings are from direct codebase inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components and infrastructure exist in the codebase; no new dependencies
- Architecture: HIGH — pattern mirrors existing `DayOfWeekPills` integration exactly
- Pitfalls: HIGH — stale closure bug is the only non-trivial issue; well-understood

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable — no external dependencies or API changes expected)
