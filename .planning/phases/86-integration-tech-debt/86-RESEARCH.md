# Phase 86: Deferred Integration & Tech Debt Cleanup - Research

**Researched:** 2026-03-02
**Domain:** Integration gaps and documentation tech debt
**Confidence:** HIGH

## Summary

Phase 86 closes 4 specific gaps from the v1.9 milestone audit. Two callsites (`retry-payment/route.ts` and `orders/[id]/page.tsx`) call `isPastCutoff()` without passing DB-sourced business rules — they rely on hardcoded defaults instead. The SUMMARY frontmatter for phases 78 and 79 already has `requirements-completed` populated (verified via git history). The `deliveryRadiusMiles`/`maxDeliveryDurationMinutes` fields need a deferred-enforcement doc.

**Primary recommendation:** Wire `getBusinessRules()` into the 2 remaining callsites following the checkout session route pattern, document radius/duration as intentionally deferred, and verify SUMMARY frontmatter completeness.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Document radius/duration enforcement as **intentionally deferred** — do NOT implement
- Both callsites are server-side — call `getBusinessRules()` directly
- Pass DB-sourced `cutoffDay` and `cutoffHour` to `isPastCutoff()` instead of relying on hardcoded defaults
- Pattern matches how checkout session route already wires business rules
- Populate `requirements-completed` in frontmatter of all 7 SUMMARY files (4 for phase 78, 3 for phase 79)

### Claude's Discretion
- Where to place deferred enforcement documentation (inline code comment vs ADR vs both)
- Whether admin settings UI needs hint text for unenforced radius/duration fields
- Exact requirement-to-plan mapping for SUMMARY frontmatter population
- Error handling approach for `getBusinessRules()` failures in cutoff callsites

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Codebase Analysis

### Callsite 1: retry-payment route
**File:** `src/app/api/orders/[id]/retry-payment/route.ts`
**Line 107:** `isPastCutoff(deliveryDate)` — no cutoff params passed
**Fix:** Import `getBusinessRules` from `@/lib/settings`, call it, pass `rules.cutoffDay, rules.cutoffHour` to `isPastCutoff()`

### Callsite 2: customer orders/[id] page
**File:** `src/app/(customer)/orders/[id]/page.tsx`
**Lines 334-336:** `isPastCutoff(parseISO(order.deliveryWindowStart))` — no cutoff params passed
**Fix:** Import `getBusinessRules` from `@/lib/settings`, call at top of component, pass params

### Reference Pattern (checkout session route)
**File:** `src/app/api/checkout/session/route.ts`
```typescript
import { getBusinessRules } from "@/lib/settings";
// ...
const rules = await getBusinessRules();
// ...
if (isPastCutoff(scheduledSaturday, now, rules.cutoffDay, rules.cutoffHour)) {
```

### isPastCutoff Signature
**File:** `src/lib/utils/delivery-dates.ts` lines 161-166
```typescript
export function isPastCutoff(
  saturday: Date,
  now: Date = new Date(),
  cutoffDay: number = DEFAULT_CUTOFF_DAY,
  cutoffHour: number = DEFAULT_CUTOFF_HOUR
): boolean
```
Already accepts optional cutoffDay/cutoffHour — no signature changes needed.

### getBusinessRules
**File:** `src/lib/settings/business-rules.ts`
- Returns `BusinessRules` interface with `cutoffDay`, `cutoffHour`, etc.
- Uses `unstable_cache` with 5-min revalidation and `business-rules` tag
- Falls back to `BUSINESS_RULES_DEFAULTS` on error
- Importable from `@/lib/settings` (barrel export)

## SUMMARY Frontmatter Status

### Phase 78 (all populated)
| Plan | requirements-completed |
|------|----------------------|
| 78-01 | RULES-01, RULES-02, RULES-03, RULES-04, RULES-05, RULES-07, RULES-10 |
| 78-02 | RULES-07 |
| 78-03 | RULES-06 |
| 78-04 | RULES-08 |

**Coverage:** RULES-01 through RULES-08, RULES-10 all present. RULES-09 correctly mapped to Phase 79.

### Phase 79 (all populated)
| Plan | requirements-completed |
|------|----------------------|
| 79-01 | OPS-01, OPS-03, OPS-04, OPS-05, OPS-06, RULES-09 |
| 79-02 | OPS-01, OPS-02, OPS-04, OPS-06, OPS-07 |
| 79-03 | OPS-05, OPS-07 |

**Coverage:** OPS-01 through OPS-07 and RULES-09 all present.

**Conclusion:** Success criterion 3 ("SUMMARY frontmatter `requirements-completed` populated for phases 78 and 79") is ALREADY MET. The v1.9 audit was conducted before Phase 85 work populated these fields. All 7 files already have correct `requirements-completed` arrays.

## Radius/Duration Enforcement

### Current State
- `deliveryRadiusMiles` and `maxDeliveryDurationMinutes` are configurable via admin settings (RULES-05)
- Values are stored in `app_settings` DB table
- `getBusinessRules()` returns them
- **No enforcement exists** — no code checks customer distance or estimated delivery duration
- Enforcement requires geocoding (address → coordinates) and distance calculation — neither exists

### Recommendation
Document as intentionally deferred with:
1. Inline code comment in `business-rules.ts` near the field definitions
2. Brief ADR in the phase SUMMARY explaining the rationale

## Common Pitfalls

### Pitfall 1: Forgetting `await` on getBusinessRules
`getBusinessRules()` is async (returns `Promise<BusinessRules>`). Both callsites are already async, so this is straightforward but must not be forgotten.

### Pitfall 2: Import path
Import from `@/lib/settings` (barrel), not from `@/lib/settings/business-rules` directly. This follows established patterns.

### Pitfall 3: Server component async call
The `orders/[id]/page.tsx` is a server component — calling `await getBusinessRules()` is fine. But it's passed to `PendingOrderActions` as a prop (`isPastCutoff` boolean), so the call must happen in the server component before rendering.

## Architecture Patterns

### Pattern: Server-side business rules wiring
1. Import `getBusinessRules` from `@/lib/settings`
2. Call `const rules = await getBusinessRules()` early in the handler/component
3. Pass `rules.cutoffDay, rules.cutoffHour` to `isPastCutoff()`
4. Fallback handled internally by `getBusinessRules()` (returns defaults on error)

### Anti-Patterns to Avoid
- **Don't add try/catch around getBusinessRules:** It already handles errors internally with fallback
- **Don't pass the entire rules object:** Only pass the needed fields (cutoffDay, cutoffHour)

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/app/api/checkout/session/route.ts` (reference pattern)
- Codebase inspection: `src/lib/settings/business-rules.ts` (getBusinessRules implementation)
- Codebase inspection: `src/lib/utils/delivery-dates.ts` (isPastCutoff signature)
- Codebase inspection: All 7 SUMMARY files for phases 78 and 79

## Metadata

**Confidence breakdown:**
- Cutoff wiring: HIGH — direct codebase inspection, reference pattern exists
- SUMMARY status: HIGH — git history confirms fields present
- Radius/duration: HIGH — codebase confirms no enforcement code exists

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable codebase patterns)
