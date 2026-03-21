# Phase 104: Enhancement Recommendations

**Phase:** 104 — Type Safety & API Corrections
**Date:** 2026-03-19

---

## Priority Matrix

| # | Enhancement | Priority | Effort | Impact |
|---|---|---|---|---|
| E1 | Replace JS updateRouteStats with SQL RPC call | MUST-HAVE | Low | High |
| E2 | Add `distance_miles` to orders + addresses types | MUST-HAVE | Low | Medium |
| E3 | Add route lifecycle columns to routes type | MUST-HAVE | Low | High |
| E4 | Add `direction` column to delivery_days type | MUST-HAVE | Low | Medium |
| E5 | Remove `eslint-disable` directives alongside `as any` | SHOULD-HAVE | Low | Medium |
| E6 | Add DeliveryZonesRow type alias | SHOULD-HAVE | Low | Low |
| E7 | Verify route completion endpoint stats calc | SHOULD-HAVE | Medium | High |
| E8 | Add `payment_method` to active route stop response | SHOULD-HAVE | Low | Medium |
| E9 | Audit `as any` casts across entire codebase | NICE-TO-HAVE | Medium | Medium |
| E10 | Unify active route and detail route response shapes | NICE-TO-HAVE | High | Low |
| E11 | Add typed helper for revalidation patterns | NICE-TO-HAVE | Low | Low |
| E12 | Create regression test for type completeness | NICE-TO-HAVE | Medium | High |

---

## Detailed Recommendations

### E1: Replace JS `updateRouteStats` with SQL RPC Call (MUST-HAVE)

**What:** The driver stop update handler (`stops/[stopId]/route.ts:206-235`) has its own JS implementation of stats calculation. Replace it with a call to the SQL `update_route_stats` RPC (which is already correct and used by admin paths).

**Why:** Two implementations of the same logic creates drift. The JS version already has a bug (counts enroute as pending). The SQL version is authoritative and correct. The admin helper (`admin/routes/[id]/stops/helpers.ts`) already calls the RPC — driver path should too.

**Design compliance:** Single source of truth for route stats calculation. Eliminates dual-implementation drift.

**Implementation hint:**
```typescript
// Replace lines 206-235 in stops/[stopId]/route.ts with:
async function updateRouteStats(supabase, routeId: string) {
  await supabase.rpc("update_route_stats", { p_route_id: routeId });
}
```

---

### E2: Add `distance_miles` to Orders + Addresses Types (MUST-HAVE)

**What:** Migration `20260312_delivery_direction_zones.sql` added `distance_miles DOUBLE PRECISION` to both `orders` and `addresses` tables. Neither is in `database.ts`.

**Why:** Currently used via `as any` casts or untyped access. Phase 106 (timezone) and delivery zone logic depend on accurate distance values.

**Design compliance:** Type completeness — every DB column should be typed.

**Implementation hint:** Add `distance_miles: number | null` to both OrdersRow and AddressesRow (nullable DOUBLE PRECISION).

---

### E3: Add Route Lifecycle Columns to Routes Type (MUST-HAVE)

**What:** Migration `20260316_route_status_backfill.sql` added `accepted_at`, `declined_at`, `declined_reason` to `routes` table. These are missing from `database.ts`.

**Why:** Phase 105 (Route Lifecycle Guards) directly needs these for type-safe status tracking. Adding now prevents Phase 105 from needing type workarounds.

**Design compliance:** Phase 104's mandate is "accurate types for subsequent phases."

**Implementation hint:**
```typescript
accepted_at: string | null;
declined_at: string | null;
declined_reason: string | null;
```

---

### E4: Add `direction` Column to Delivery Days Type (MUST-HAVE)

**What:** Migration `20260312_delivery_direction_zones.sql` added `direction TEXT NOT NULL DEFAULT 'all'` to `delivery_days`. Missing from `database.ts`.

**Why:** Business rules fetch delivery days with direction; direction-based route assignment depends on typed access. Currently works via runtime but no compile-time safety.

**Design compliance:** Type completeness.

**Implementation hint:** Add `direction: string` to DeliveryDaysRow (NOT NULL with DEFAULT, so non-nullable in Row, optional in Insert).

---

### E5: Remove `eslint-disable` Directives Alongside `as any` (SHOULD-HAVE)

**What:** Each `as any` cast on `delivery_zones` has a paired `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment. Remove both the cast AND the eslint-disable.

**Why:** Leaving orphaned eslint-disable directives is confusing — suggests the line still has an issue. Clean removal.

**Design compliance:** ESLint rule compliance. Zero `eslint-disable` for type safety rules.

**Implementation hint:** Each fix site has 2 lines to remove: the eslint-disable comment and the `as any` cast. Replace `.from("delivery_zones" as any)` with `.from("delivery_zones")`.

---

### E6: Add `DeliveryZonesRow` Type Alias (SHOULD-HAVE)

**What:** After adding the `delivery_zones` table definition, add row/insert/update type aliases at the bottom of `database.ts` (following existing pattern for OrdersRow, AddressesRow, etc.).

**Why:** Consistency with project convention. Other files import `OrdersRow` directly rather than `Database["public"]["Tables"]["orders"]["Row"]`.

**Design compliance:** Convention consistency.

**Implementation hint:**
```typescript
export type DeliveryZonesRow = Database["public"]["Tables"]["delivery_zones"]["Row"];
export type DeliveryZonesInsert = Database["public"]["Tables"]["delivery_zones"]["Insert"];
export type DeliveryZonesUpdate = Database["public"]["Tables"]["delivery_zones"]["Update"];
```

---

### E7: Verify Route Completion Endpoint Stats Calc (SHOULD-HAVE)

**What:** `src/app/api/driver/routes/[routeId]/complete/route.ts:81` has its own inline stats calculation for route completion. Verify it doesn't have the same enroute-as-pending bug.

**Why:** Wave 2 found three stats implementations. The completion endpoint may count completed/pending differently. If it has the same bug, final route stats in DB are wrong.

**Design compliance:** Data integrity — stats should be consistent regardless of code path.

**Implementation hint:** Read lines 70-90 of `complete/route.ts`. If it counts `pending || enroute`, fix to count `pending` only. Better yet, replace with `update_route_stats` RPC call (E1 pattern).

---

### E8: Add `payment_method` to Active Route Stop Response (SHOULD-HAVE)

**What:** The active route query selects orders but doesn't include `payment_method`. The driver needs to know if a stop is COD (requires cash collection) vs Stripe (already paid).

**Why:** The single route detail endpoint (`[routeId]/route.ts`) includes payment_method. Active route doesn't. Driver switching between views gets inconsistent data.

**Design compliance:** API consistency between related endpoints.

**Implementation hint:** Add `payment_method` to orders select in active/route.ts query. Map to response.

---

### E9: Audit `as any` Casts Across Entire Codebase (NICE-TO-HAVE)

**What:** Beyond the 3 `delivery_zones` casts, search for ALL `as any` casts in the codebase. Each represents a type safety gap.

**Why:** Phase 104 is about "type safety." Fixing only the known 3 casts misses potential other gaps introduced during rapid development.

**Design compliance:** TypeScript strict mode compliance.

**Implementation hint:** `grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."` — review each hit, fix or document why cast is necessary.

---

### E10: Unify Active Route and Detail Route Response Shapes (NICE-TO-HAVE)

**What:** Active route wraps response in `{ route: {...} }` while detail route returns flat `{ id, ... }`. Different API consumers get different shapes for similar data.

**Why:** Inconsistency adds cognitive load. Future driver UI development must handle both shapes.

**Design compliance:** API design consistency.

**Implementation hint:** Choose one pattern and align. Breaking change — requires driver UI updates. Defer to v2.3.

---

### E11: Add Typed Helper for Revalidation Patterns (NICE-TO-HAVE)

**What:** Create a small utility that wraps `revalidateTag` with the correct signature, preventing future incorrect usage.

**Why:** The `{ expire: 0 }` bug happened because Next.js `revalidateTag` accepts arguments silently. A typed wrapper would surface compile-time errors.

**Design compliance:** Defensive programming.

**Implementation hint:**
```typescript
// src/lib/cache/revalidate.ts
export function bustBusinessRulesCache() {
  revalidateTag("business-rules");
}
```
Specific named functions prevent wrong tag names AND wrong arguments.

---

### E12: Create Regression Test for Type Completeness (NICE-TO-HAVE)

**What:** A test that verifies `database.ts` includes type definitions for all tables in the Supabase migration history.

**Why:** This phase exists because types drifted from schema. A regression test prevents future drift.

**Design compliance:** Quality — automated detection of schema/type drift.

**Implementation hint:** Parse migration files for `CREATE TABLE` statements, extract table names, verify each appears in `database.ts`. Add to CI.

---

## Summary

| Priority | Count | Effort | Description |
|---|---|---|---|
| MUST-HAVE | 4 | Low | Core type additions that enable Phases 105-109 |
| SHOULD-HAVE | 4 | Low-Medium | Consistency, data integrity, API completeness |
| NICE-TO-HAVE | 4 | Low-High | Future-proofing, codebase hygiene |

**Recommended implementation:** All MUST-HAVE items in Phase 104 plans. SHOULD-HAVE E5 and E7 are trivial enough to include. E6 and E8 if time permits. NICE-TO-HAVE deferred.

---

*Generated: 2026-03-19 | Phase 104 Deep Assumptions Protocol*
