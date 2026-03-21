# Phase 104: Type Safety & API Corrections - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Regenerate missing Supabase types, fix trivial API bugs (revalidateTag, active route contact info, route stats counting), and remove `as any` casts. Subsequent phases (105-109) build on correct types. No UI changes, no new endpoints, no schema changes.

</domain>

<decisions>
## Implementation Decisions

### Type regeneration approach
- Manual targeted updates to `database.ts`, NOT full `npx supabase gen types` CLI regeneration
- Reason: database.ts has ~100 lines of manual type aliases at EOF (OrderStatus, PaymentMethod, ProfileRole, row aliases) that CLI would overwrite
- No `supabase gen types` script in package.json — not part of existing workflow
- Add: `delivery_zones` full table, `orders.customer_name/customer_phone/distance_miles`, `routes.accepted_at/declined_at/declined_reason`, `delivery_days.direction`

### revalidateTag cleanup
- Remove invalid `{ expire: 0 }` second argument from all 4 `revalidateTag` calls
- Files: `admin/delivery-zones/route.ts`, `admin/delivery-days/route.ts`, `admin/settings/route.ts`, `admin/settings/restore/route.ts`
- Next.js `revalidateTag` accepts only a tag string — no options parameter

### Active route customer contact (API-01)
- Add `customer_name` and `customer_phone` to active route query SELECT
- Mapping: `orders.customer_name ?? profiles.full_name` and `orders.customer_phone ?? profiles.phone`
- Response shape stays identical — only data source changes (additive, backward compatible)
- COD customers may not have profiles, so order-level fields take precedence

### Route stats fix (ROUTE-02)
- Fix JS `updateRouteStats` only — remove `|| s.status === "enroute"` from pending_stops filter
- SQL `update_route_stats` RPC already counts only `pending` — correct, no change needed
- Admin path calls SQL RPC via wrapper in `helpers.ts` — already correct
- No new `enroute_stops` field — YAGNI, dashboard doesn't need separate count

### `as any` cast removal (INFRA-02)
- Remove 3 `as any` casts on `delivery_zones` queries after type additions
- Files: `business-rules.ts:125`, `admin/delivery-zones/route.ts:59,103`

### Claude's Discretion
- Exact field ordering in type definitions
- Whether to add JSDoc comments to new type fields
- Test mock update approach (inline vs factory)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Type definitions
- `.planning/phases/104-type-safety-api-corrections/104-PRECONTEXT-RESEARCH.md` — Full schema analysis, data contracts, file map, gotcha inventory
- `supabase/migrations/20260312_delivery_direction_zones.sql` — `delivery_zones` table DDL and `delivery_days.direction` column
- `supabase/migrations/20260310_order_contact_info.sql` — `orders.customer_name/customer_phone` column DDL
- `supabase/migrations/20260316_route_status_backfill.sql` — `routes.accepted_at/declined_at/declined_reason` column DDL

### API corrections
- `src/app/api/driver/routes/active/route.ts` — Active route endpoint to fix (API-01)
- `src/app/api/driver/routes/[routeId]/stops/[stopId]/route.ts` — Stop handler with updateRouteStats bug (ROUTE-02)
- `src/app/api/driver/routes/[routeId]/route.ts` — Reference pattern for customer contact fallback

### Requirements
- `.planning/REQUIREMENTS.md` — INFRA-02, API-01, API-02, ROUTE-02 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Customer contact fallback pattern: `[routeId]/route.ts:199-203` — `order.customer_name ?? profile.full_name`
- Correct `revalidateTag` signature: `signOut` in `actions.ts` — single string argument

### Established Patterns
- `database.ts` manually maintained with type aliases at EOF (~lines 2350+)
- PostgREST FK hints: all `routes->drivers` queries use `!routes_driver_id_fkey` — verified safe
- SQL RPC `update_route_stats` is authoritative; JS inline function is secondary

### Integration Points
- `database.ts` type changes affect all Supabase query consumers
- `RouteStats.pending_stops` semantic change aligns JS with SQL RPC output
- Active route response shape unchanged — additive field sources only

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all decisions driven by bug analysis in precontext research. Implementation is surgical: ~80 lines across 9 files.

</specifics>

<deferred>
## Deferred Ideas

- Full `npx supabase gen types` CLI regeneration — too risky with manual additions, evaluate for future milestone
- RouteStatsBar UI fallback logic (shows enroute in pending) — Phase 105 dependency
- Replace JS `updateRouteStats` with SQL RPC call — larger refactor, not required by success criteria
- Add `enroute_stops` field to RouteStats type — YAGNI for current dashboard

</deferred>

---

*Phase: 104-type-safety-api-corrections*
*Context gathered: 2026-03-19*
