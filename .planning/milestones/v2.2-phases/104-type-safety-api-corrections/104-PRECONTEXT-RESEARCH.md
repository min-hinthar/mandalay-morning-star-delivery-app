# Phase 104: Type Safety & API Corrections — Precontext Research

**Phase:** 104 | **Milestone:** v2.2 Stability & Correctness
**Research Date:** 2026-03-19 | **Agents:** 12 (2 waves x 6)
**Requirements:** INFRA-02, API-01, API-02, ROUTE-02

---

## 1. Resolved Assumptions

### 1.1 Technical Approach

| Assumption | Resolution | Confidence |
|---|---|---|
| `database.ts` is auto-generated via CLI | **MANUALLY MAINTAINED** — file follows Supabase CLI format but has manual type aliases at EOF (lines 2350+). No `supabase gen types` script in package.json. | HIGH |
| Type regen via `npx supabase gen types` is safe | **RISKY** — would overwrite manual additions (OrderStatus, PaymentMethod, ProfileRole, row aliases). Manual targeted updates are safer. | HIGH |
| `delivery_zones` is the only missing table | **FALSE** — orders table also missing `customer_name`, `customer_phone`, `distance_miles`. Routes missing `accepted_at`, `declined_at`, `declined_reason`. Delivery_days missing `direction`. | HIGH |
| `revalidateTag` has 3 invalid instances | **FALSE** — 4 instances (restore endpoint was missed in original CONCERNS). | HIGH |
| `updateRouteStats` JS function is the only implementation | **FALSE** — SQL RPC `update_route_stats` is authoritative (defined in migration 20260312). JS function in driver stop handler is separate inline implementation. Admin path calls SQL RPC via wrapper in `helpers.ts`. | HIGH |
| Active route endpoint is actively used | **UNCERTAIN** — no callers found in current codebase via grep. May be called from driver PWA dynamically or via fetch. Fix anyway for API correctness. | MEDIUM |

### 1.2 Implementation Order

1. **INFRA-02** first — manual type additions to `database.ts` (foundation for all other fixes)
2. **API-02** second — trivial `revalidateTag` cleanup (4 files, zero risk)
3. **API-01** third — active route customer contact fix (depends on correct order types)
4. **ROUTE-02** last — `updateRouteStats` fix (depends on correct stop status types)

### 1.3 Scope Boundaries

**In Scope:**
- Manual type additions to `database.ts` for missing tables/columns
- Remove 3 `as any` casts on `delivery_zones`
- Remove invalid `{ expire: 0 }` from 4 `revalidateTag` calls
- Add `customer_name`/`customer_phone` to active route API query and mapping
- Fix JS `updateRouteStats` to exclude `enroute` from `pending_stops`

**Out of Scope (Deferred):**
- Full `npx supabase gen types` CLI regeneration (too risky with manual additions)
- RouteStatsBar UI fallback logic changes (depends on Phase 105 lifecycle clarity)
- Adding `enroute_stops` as new field to RouteStats type (YAGNI — dashboard doesn't need it)
- Fixing SQL RPC `update_route_stats` (SQL already counts only `pending` — it's correct)
- Active route response structure changes (wraps in `{ route: {...} }` vs flat — different contract)

**Ambiguous → Resolved:**
- `completed_at`/`driver_id` missing from active route query: OUT — not required by SC#2
- FK hint audit: OUT — all existing queries correctly use `!routes_driver_id_fkey`

---

## 2. Realistic Data/Scale Analysis

| Metric | Current Value | Phase 104 Impact |
|---|---|---|
| Tables in database.ts | 28 (confirmed) | +1 (`delivery_zones`) |
| Missing columns across tables | 8 total | All added manually |
| `as any` casts to remove | 3 | All in delivery_zones queries |
| `revalidateTag` invalid calls | 4 | All cleaned up |
| Routes with enroute stops | ~2-4 per Saturday | Stats now accurate |
| COD orders needing customer phone | ~30% of orders | Driver now sees phone |
| Total lines changed estimate | ~80-100 | Low blast radius |

---

## 3. Cross-Phase Contract Inventory

### 3.1 Phase 104 Produces → Downstream Consumes

| Artifact | Phase 105 | Phase 106 | Phase 107 | Phase 108 | Phase 109 |
|---|---|---|---|---|---|
| `delivery_zones` table type | - | Direction filtering | - | - | Test fixtures |
| `orders.customer_name/phone` type | - | - | - | - | Test assertions |
| `routes.accepted_at/declined_at` type | Status narrowing | - | - | - | Test factories |
| Clean `revalidateTag` calls | - | Cache invalidation | - | - | - |
| Correct `pending_stops` semantics | Dashboard accuracy | - | Stop promotion | - | Integration tests |

### 3.2 Phase 104 Must NOT Break

| Contract | File | Why |
|---|---|---|
| Driver route API response shape | `active/route.ts` | Adding fields is additive — safe |
| Admin route list response | `admin/routes/route.ts` | No changes to this file |
| Route stop status enum | `database.ts` | Adding to file, not modifying enum |
| `toISOWithTimezone` signature | `delivery-dates.ts` | Not touched |
| `getBusinessRules` return type | `business-rules.ts` | Removing `as any` only — same runtime behavior |
| FK hints on routes→drivers | All admin API routes | All already use `!routes_driver_id_fkey` |

### 3.3 Contracts from Prior Phases

| Phase | Contract | Status |
|---|---|---|
| v2.1 Phase 100 | `split_route`/`merge_routes` RPCs call `update_route_stats` | SQL RPC is correct; JS fix doesn't affect |
| v2.1 Phase 101 | Route status enum: planned/assigned/accepted/in_progress/completed | Preserved in type additions |
| v2.1 Phase 102 | RouteStatsBar reads `stats_json.pending_stops` | JS fix aligns with SQL RPC output |
| v1.9 Phase 78 | `revalidateTag("business-rules")` invalidation pattern | Fixed to correct API signature |
| v1.9 Phase 80 | Route builder uses `delivery_zones` | Type safety restored after `as any` removal |

---

## 4. Database Schema Deep Analysis

### 4.1 Missing `delivery_zones` Table (Migration 20260312)

```sql
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL UNIQUE CHECK (direction IN ('east', 'west', 'south')),
  bearing_start DOUBLE PRECISION NOT NULL,
  bearing_end DOUBLE PRECISION NOT NULL,
  reference_cities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

TypeScript type needed:
```typescript
delivery_zones: {
  Row: {
    id: string;
    direction: string;
    bearing_start: number;
    bearing_end: number;
    reference_cities: string[];
    created_at: string;
    updated_at: string;
  };
  Insert: { /* id?, direction, bearing_start, bearing_end, reference_cities?, created_at?, updated_at? */ };
  Update: { /* all optional */ };
  Relationships: [];
};
```

### 4.2 Missing `orders` Columns (Migration 20260310)

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;
```

Add to OrdersRow: `customer_phone: string | null`, `customer_name: string | null`
Add to OrdersInsert: `customer_phone?: string | null`, `customer_name?: string | null`
Add to OrdersUpdate: same as Insert

### 4.3 Missing `routes` Columns (Migration 20260316)

From `20260316_route_status_backfill.sql`:
- `accepted_at TIMESTAMPTZ` → `string | null`
- `declined_at TIMESTAMPTZ` → `string | null`
- `declined_reason TEXT` → `string | null`

### 4.4 Missing `delivery_days` Column (Migration 20260312)

- `direction TEXT NOT NULL DEFAULT 'all'` → `string`

### 4.5 Route Stop Status Enum (CORRECT)

Already defined: `"pending" | "enroute" | "arrived" | "delivered" | "skipped"` — no changes needed.

---

## 5. Gotcha Inventory

### Critical

| # | Gotcha | Fix | Source | Confidence |
|---|---|---|---|---|
| G1 | `database.ts` manual additions wiped by CLI regen | Use manual targeted updates, not full regen | Wave2-9 analysis | HIGH |
| G2 | PostgREST FK hints: 2nd FK to same table breaks ALL queries | All `routes→drivers` queries already use `!routes_driver_id_fkey` — verified safe | data-schema.md | HIGH |
| G3 | `update_route_stats` SQL RPC exists separately from JS function | Fix JS function only; SQL already counts `pending` correctly | Wave2-8 analysis | HIGH |
| G4 | `.update()` returns no row count | Chain `.select("id")` to verify update — already done in stats update code | stripe.md | HIGH |

### High

| # | Gotcha | Fix | Source | Confidence |
|---|---|---|---|---|
| G5 | `customer_name`/`customer_phone` also missing from database.ts OrdersRow | Add alongside delivery_zones type additions | Wave2-4 analysis | HIGH |
| G6 | Denormalized contact: order fields take precedence over profile | Pattern: `order.customer_name ?? profile.full_name ?? null` | data-schema.md | HIGH |
| G7 | `revalidateTag` accepts only tag string, no options | Remove `{ expire: 0 }` second argument | nextjs.md | HIGH |
| G8 | Vercel kills fire-and-forget — `void asyncFn()` | `revalidateTag` is synchronous, so not affected here | nextjs.md | HIGH |
| G9 | Adding fields to Supabase query requires matching test mock updates | Grep for `from("orders")` and `from("routes")` in test files | testing.md | HIGH |

### Medium

| # | Gotcha | Fix | Source | Confidence |
|---|---|---|---|---|
| G10 | `!value` falsy check treats 0 as missing | Use `value == null` for nullable number checks | CLAUDE.md gotchas | MEDIUM |
| G11 | `revalidatePath` defaults to `"page"` not `"layout"` | Not relevant — we're fixing `revalidateTag` not `revalidatePath` | nextjs.md | MEDIUM |
| G12 | RouteStatsBar fallback includes enroute in pending count | Defer UI fix to Phase 105 — doesn't affect Phase 104 scope | Wave2-12 | MEDIUM |
| G13 | `process.env.KEY` inlined at build | Not relevant to Phase 104 fixes | nextjs.md | LOW |

---

## 6. Data Contracts

### 6.1 Type Definitions to Add/Modify

**database.ts additions:**

| Table | Field | TypeScript Type | Insert | Update |
|---|---|---|---|---|
| `delivery_zones` | (full table) | See §4.1 | Full definition | Full definition |
| `orders` | `customer_phone` | `string \| null` | `?: string \| null` | `?: string \| null` |
| `orders` | `customer_name` | `string \| null` | `?: string \| null` | `?: string \| null` |
| `orders` | `distance_miles` | `number \| null` | `?: number \| null` | `?: number \| null` |
| `routes` | `accepted_at` | `string \| null` | `?: string \| null` | `?: string \| null` |
| `routes` | `declined_at` | `string \| null` | `?: string \| null` | `?: string \| null` |
| `routes` | `declined_reason` | `string \| null` | `?: string \| null` | `?: string \| null` |
| `delivery_days` | `direction` | `string` | `?: string` | `?: string` |

### 6.2 API Response Contracts

**Active Route API (Fix API-01):**

Current response for stop customer:
```typescript
customer: {
  id: string;
  fullName: string | null;    // from profiles only
  phone: string | null;       // from profiles only
}
```

Fixed response:
```typescript
customer: {
  id: string;
  fullName: string | null;    // orders.customer_name ?? profiles.full_name
  phone: string | null;       // orders.customer_phone ?? profiles.phone
}
```

Response shape is IDENTICAL — only the source of data changes. Fully backward compatible.

### 6.3 Stats Contract

**RouteStats type (src/types/driver.ts:108-116):**
```typescript
interface RouteStats {
  total_stops: number;
  pending_stops: number;      // FIXED: now excludes enroute
  delivered_stops: number;
  skipped_stops: number;
  completion_rate: number;
}
```

No new fields added. `pending_stops` semantic changes from "pending + enroute" to "pending only" in JS function. SQL RPC already returns "pending only."

---

## 7. Design Compliance Matrix

| Principle | Phase 104 Compliance | Notes |
|---|---|---|
| Type safety (strict TS) | Directly addressed | Primary purpose of this phase |
| API correctness | Fixed 4 trivial bugs | No new endpoints |
| Data integrity | Stats now match SQL RPC | pending_stops consistent |
| Backward compatibility | All changes additive | No breaking API changes |
| File size (<400 lines) | N/A | No new files created |
| ESLint compliance | 3 `as any` casts removed | Removes `eslint-disable` directives |
| Testing | Existing tests must pass | No new test files in scope |

---

## 8. Architectural Decisions

### AD-1: Manual Type Updates vs CLI Regeneration

**Options evaluated:**
1. Run `npx supabase gen types typescript` — full regeneration
2. Manual targeted updates — add missing types only
3. Hybrid — run CLI, then re-add manual additions

**Chosen: Option 2 (Manual targeted updates)**

**Rationale:**
- database.ts has ~100 lines of manual type aliases at EOF (lines 2350+)
- No `supabase gen types` script in package.json — not part of workflow
- CLI regen requires Supabase project credentials and CLI setup
- Manual additions are surgical — 8 column additions + 1 table definition
- Risk of CLI overwriting custom exports is HIGH

### AD-2: Fix JS updateRouteStats Only (Not SQL RPC)

**Options evaluated:**
1. Fix both JS and SQL implementations
2. Fix JS only (SQL already correct)
3. Replace JS with SQL RPC call

**Chosen: Option 2 (Fix JS only)**

**Rationale:**
- SQL `update_route_stats` RPC counts only `pending` — already correct
- JS function in `stops/[stopId]/route.ts` counts `pending || enroute` — BUG
- Admin path already calls SQL RPC via wrapper in `helpers.ts`
- Replacing JS with RPC call is a larger refactor (Option 3) — deferred

### AD-3: No New `enroute_stops` Field

**Options evaluated:**
1. Add `enroute_stops` field to RouteStats
2. Keep existing fields, fix semantics only

**Chosen: Option 2 (Fix semantics only)**

**Rationale:**
- ROADMAP SC#4 says "enroute stops not counted as pending" — doesn't ask for new field
- RouteStatsBar has its own fallback that handles display
- Adding new field ripples into SQL RPC, type definition, all consumers
- YAGNI — admin dashboard doesn't show separate "enroute" count

---

## 9. File Map

### Create

None — no new files.

### Modify

| File | Changes | Fix |
|---|---|---|
| `src/types/database.ts` | Add `delivery_zones` table, add missing columns to orders/routes/delivery_days/addresses | INFRA-02 |
| `src/lib/settings/business-rules.ts:125` | Remove `as any` cast on `delivery_zones` | INFRA-02 |
| `src/app/api/admin/delivery-zones/route.ts:59,103` | Remove 2x `as any` casts on `delivery_zones` | INFRA-02 |
| `src/app/api/admin/delivery-zones/route.ts:116` | Remove `{ expire: 0 }` from `revalidateTag` | API-02 |
| `src/app/api/admin/delivery-days/route.ts:122` | Remove `{ expire: 0 }` from `revalidateTag` | API-02 |
| `src/app/api/admin/settings/route.ts:221` | Remove `{ expire: 0 }` from `revalidateTag` | API-02 |
| `src/app/api/admin/settings/restore/route.ts:121` | Remove `{ expire: 0 }` from `revalidateTag` | API-02 |
| `src/app/api/driver/routes/active/route.ts` | Add `customer_name`,`customer_phone` to query + interface + mapping | API-01 |
| `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts:220` | Remove `\|\| s.status === "enroute"` from pending_stops filter | ROUTE-02 |

### Read (Reference)

| File | Purpose |
|---|---|
| `src/app/api/driver/routes/[routeId]/route.ts` | Reference pattern for customer contact fallback |
| `supabase/migrations/20260312_delivery_direction_zones.sql` | delivery_zones schema |
| `supabase/migrations/20260310_order_contact_info.sql` | customer_name/phone schema |
| `supabase/migrations/20260316_route_status_backfill.sql` | accepted_at/declined_at schema |
| `supabase/migrations/20260312_route_pipeline_hardening.sql` | SQL update_route_stats RPC |
| `src/app/api/admin/routes/[id]/stops/helpers.ts` | Admin stats wrapper pattern |

### Reuse

| Component | From | In |
|---|---|---|
| Customer contact fallback pattern | `[routeId]/route.ts:199-203` | `active/route.ts` mapping |
| `revalidateTag` correct signature | `signOut` in `actions.ts` | All 4 fixed calls |

---

## 10. Gray Area Resolutions

| # | Gray Area | Resolution | Evidence | Confidence |
|---|---|---|---|---|
| 1 | Type regen approach | Manual targeted updates | database.ts has custom aliases; no CLI script | HIGH |
| 2 | Which updateRouteStats to fix | JS only (SQL correct) | SQL counts `pending` only; JS adds `enroute` | HIGH |
| 3 | pending_stops consumers | Fix source, defer UI | RouteStatsBar has own fallback; Phase 105 dependency | HIGH |
| 4 | customer_name/phone nullability | `string \| null` | Project convention from addresses table examples | HIGH |
| 5 | Scope: updateRouteStats trivial? | YES — single filter change | Removing `\|\| enroute` is trivial | HIGH |
| 6 | revalidateTag 4th instance | CONFIRMED — restore endpoint | All 4 files verified with exact line numbers | HIGH |
| 7 | FK hint risk from type changes | SAFE — all hints correct | Grepped all routes→drivers joins | HIGH |
| 8 | Phase 104 → 105 dependency | No hard blockers | Phase 105 uses types but no blocking conflict | HIGH |
| 9 | Phase 104 → 106 dependency | Independent | Phase 106 is timezone, not type-dependent | HIGH |
| 10 | Active route endpoint usage | May be unused | No callers found; fix anyway for correctness | MEDIUM |

---

## 11. Expanded Gotcha Inventory (Wave 2 Merged)

### From Wave 2-7 (Complete Learnings Mapping)

| Gotcha | Fix | Severity | Applies To |
|---|---|---|---|
| Supabase mock chains must match query shape | Update test mocks if query changes | High | API-01 |
| `getBusinessRules` tests mock `delivery_zones` | May need mock update after `as any` removal | Medium | INFRA-02 |
| Vacuous test guards hide broken assertions | Assert existence before asserting properties | Medium | All |
| `.update()` needs `.select("id")` for row count | Already done in stats code | High | ROUTE-02 |
| Fire-and-forget on Vercel — use `after()` | `revalidateTag` is sync; not affected | Low | API-02 |

### From Wave 2-8 (Stats Implementation Analysis)

| Gotcha | Fix | Severity |
|---|---|---|
| Three implementations of stats (SQL primary, JS wrapper, JS inline) | Only fix JS inline; SQL and wrapper are correct | Critical |
| RouteStatsBar fallback includes enroute+arrived in pending | Defer to Phase 105 | Medium |
| `calculate_route_stats` (older SQL) also counts only pending | Unused — superseded by `update_route_stats` | Low |
| Route completion endpoint has separate inline stats calc | Check if it also has the bug | High |

### From Wave 2-11 (Active Route Deep Read)

| Gotcha | Fix | Severity |
|---|---|---|
| Active route wraps response in `{ route: {...} }` vs flat | Different contract — don't change | Medium |
| Active route missing `completed_at`/`driver_id` | Out of scope — not in SC#2 | Low |
| No tests exist for active route endpoint | Add tests in Phase 109 | Medium |

---

## 12. Design Token Audit Results

N/A — Phase 104 is backend/type-safety only. No UI components modified.

---

## 13. Testing Strategy

### Existing Tests to Verify

Run full verification suite: `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`

### Post-Fix Checks

| Check | Command | Expected |
|---|---|---|
| Types compile | `pnpm typecheck` | 0 errors |
| No `as any` on delivery_zones | `grep -r "delivery_zones.*as any" src/` | 0 matches |
| No invalid revalidateTag args | `grep -r "revalidateTag.*{" src/` | 0 matches |
| Tests pass | `pnpm test` | All green |
| Build succeeds | `pnpm build` | 0 errors |
| customer_name in active route | Read `active/route.ts` query | Fields present |
| pending_stops excludes enroute | Read `stops/[stopId]/route.ts:220` | No `enroute` in filter |

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Type additions have wrong nullable/optional | Low | High | Cross-reference with migration DDL |
| Removing `as any` breaks compile | Low | Medium | `pnpm typecheck` immediately after |
| Active route API breaks driver app | Very Low | High | Additive change only; response shape preserved |
| Stats change affects admin dashboard | Low | Medium | SQL RPC already returns same semantics |
| Test mocks need updating | Medium | Low | Grep for affected table mocks |

---

## 15. Timeline

| Step | Estimated LOC | Dependency |
|---|---|---|
| 1. Manual type additions to database.ts | ~60 lines | None |
| 2. Remove `as any` casts (3 locations) | ~6 lines | Step 1 |
| 3. Fix revalidateTag (4 locations) | ~4 lines | None |
| 4. Fix active route query + mapping | ~10 lines | Step 1 |
| 5. Fix updateRouteStats pending filter | ~2 lines | None |
| 6. Verification suite | — | Steps 1-5 |
| **Total** | **~80 lines** | |

---

*Research completed: 2026-03-19 | 12 agents, 2 waves*
