# Requirements: Morning Star Delivery App v2.2

**Defined:** 2026-03-19
**Core Value:** Every bug found in the codebase deep dive is fixed -- driver routes work, checkout windows are correct, data integrity is protected.

## v2.2 Requirements

### Route Lifecycle

- [ ] **ROUTE-01**: Driver sees "Accept Route" CTA for `assigned` status, not "Start Route" -- tapping Start on an assigned route no longer returns 400
- [x] **ROUTE-02**: `updateRouteStats` counts `enroute` stop as "in progress", not "pending" -- admin dashboard reflects accurate current state
- [ ] **ROUTE-03**: Admin route status override enforces lifecycle guards -- cannot set `in_progress` without driver acceptance, audit trail on manual overrides

### Checkout & Timezone

- [ ] **TZ-01**: Checkout `scheduledDate` uses explicit LA timezone construction via `toISOWithTimezone` instead of fragile `new Date(date + "T12:00:00")`
- [ ] **TZ-02**: COD email delivery window strings include timezone offset (match Stripe path behavior) -- customers see correct times
- [ ] **TZ-03**: Delivery reminder cron computes "today" in LA timezone, not UTC -- reminders go to correct day's orders between midnight UTC and 8AM LA
- [ ] **TZ-04**: `getAvailableDeliveryDatesMultiDay` pre-filters cutoff-passed dates before filling candidate slots -- customers see maximum available future dates
- [ ] **TZ-05**: Checkout API rejects `scheduledDate` more than 30 days in the future -- prevents accidental far-future orders

### Data Integrity

- [ ] **DATA-01**: Route stop next-stop promotion uses atomic `UPDATE...WHERE status='pending' RETURNING` (or PostgreSQL RPC with `FOR UPDATE SKIP LOCKED`) -- eliminates race condition on rapid stop completions
- [ ] **DATA-02**: Remove dead `increment_driver_deliveries` RPC call from route complete endpoint -- trigger `update_driver_deliveries_count` already handles this atomically per stop

### Infrastructure

- [ ] **INFRA-01**: Distributed rate limiting restored -- Upstash REST Redis provisioned, all 13 `Ratelimit` constructors enabled in `client.ts`, verified functional
- [x] **INFRA-02**: Supabase TypeScript types regenerated to include `delivery_zones` table -- all 3 `as any` casts removed with proper type safety

### API Correctness

- [x] **API-01**: Driver `active/route` API includes `customer_name` and `customer_phone` from orders table with profile fallback -- COD customers' contact info visible to driver
- [x] **API-02**: `revalidateTag` calls across 4 files remove invalid `{ expire: 0 }` second argument -- clean API usage

### Quality & Maintenance

- [ ] **QUAL-01**: Integration tests cover full driver route lifecycle: `assigned` -> accept -> start -> stop arrive -> stop deliver -> next-stop promoted -> route complete
- [ ] **QUAL-02**: `handlers.ts` (529 lines) split into per-event-type handler files with barrel re-export -- each handler file under 400-line ESLint limit

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-day delivery time windows | No current business need -- all days use same hours. Schema change + UI refactor for future milestone |
| Business rules cache staleness (5min TTL) | `revalidateTag` works within Vercel's data cache. Multi-instance staleness is a platform limitation, not a bug |
| ContactInfoSection stale closure | Benign -- user already has data from previous session. Would require `useCallback` refactor for no visible benefit |
| `ignoreDuplicates` upsert pattern | Low risk -- `ensureProfile` handles primary path. Fix would require ON CONFLICT DO UPDATE migration |
| Week offset clock skew in TimeSlotPicker | Edge case requiring server/client >12hr skew. Not a realistic production scenario |
| Deprecated `useDeliveryGate` fallback | Only triggers if `delivery_days` table is empty (admin misconfiguration). Safety net, not a bug |
| Admin override audit log table | Overhead for solo operator. Guard the lifecycle first; audit logging deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROUTE-01 | Phase 105 | Pending |
| ROUTE-02 | Phase 104 | Complete |
| ROUTE-03 | Phase 105 | Pending |
| TZ-01 | Phase 106 | Pending |
| TZ-02 | Phase 106 | Pending |
| TZ-03 | Phase 106 | Pending |
| TZ-04 | Phase 106 | Pending |
| TZ-05 | Phase 106 | Pending |
| DATA-01 | Phase 107 | Pending |
| DATA-02 | Phase 107 | Pending |
| INFRA-01 | Phase 108 | Pending |
| INFRA-02 | Phase 104 | Complete |
| API-01 | Phase 104 | Complete |
| API-02 | Phase 104 | Complete |
| QUAL-01 | Phase 109 | Pending |
| QUAL-02 | Phase 109 | Pending |

**Coverage:**
- v2.2 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
