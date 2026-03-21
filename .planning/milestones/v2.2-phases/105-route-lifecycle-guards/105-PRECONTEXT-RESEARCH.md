# Phase 105: Route Lifecycle Guards — Pre-Context Research

Generated: 2026-03-19 | 12-agent protocol | All assumptions HIGH confidence

---

## 1. Resolved Assumptions

### Technical Approach

| Assumption | Resolution | Confidence | Evidence |
|---|---|---|---|
| Start endpoint `planned` is a bug | YES — lifecycle requires `accepted` before start | HIGH | Phase 101 added accept flow; backfill converted all `planned`+driver_id to `assigned` |
| Admin PATCH needs transition guard | YES — currently allows any→any (zero validation) | HIGH | route.ts:340-366 sets status directly with no check |
| Audit trail = Sentry events, not DB table | YES — REQUIREMENTS.md defers full audit table | HIGH | REQUIREMENTS.md:52 "Overhead for solo operator" |
| Driver UI is already correct | YES — AcceptDeclineBar for assigned, Start for accepted | HIGH | DriverRouteSwitch.tsx:44, ActiveRouteView shows Start only for accepted/planned |
| Frontend + backend guards needed | YES — defense in depth | HIGH | RouteHeader.tsx dropdown unfiltered; backend is authoritative |
| Re-backfill migration needed | YES — admin PATCH can create planned+driver_id after initial backfill | HIGH | No CHECK constraint prevents invalid state |
| Completed routes are terminal | YES — no reversal allowed | HIGH | Orders/stops already transitioned; cascading undo too complex |

### Scope Boundaries

| In Scope | Out of Scope |
|---|---|
| Fix start endpoint (remove `planned`) | Full audit log table (deferred post-v2.2) |
| Admin PATCH lifecycle guard | Email notifications on admin overrides |
| Frontend dropdown filtering | Split/merge guard changes |
| Sentry audit logging | Push notifications |
| Re-backfill migration + CHECK constraint | Emergency force-override UI |
| Timestamp clearing on downgrades | Driver notification on admin status change |

### Implementation Order

1. Validation constant (`VALID_ROUTE_TRANSITIONS`) — shared dependency
2. Start endpoint fix — single line change + test update
3. Admin PATCH guard — backend enforcement
4. Frontend dropdown filter — UX enforcement
5. Migration — re-backfill + CHECK constraint
6. Sentry audit logging — observability
7. Tests — verify all transitions

---

## 2. Realistic Data/Scale Analysis

| Metric | Value | Source |
|---|---|---|
| Routes per Saturday | 2-4 | 20-50 orders, 2-4 drivers |
| Admin status overrides/week | ~1-2 (emergency only) | Solo operator pattern |
| Driver accept/decline actions/day | 2-4 per driver | One route assignment per delivery day |
| Concurrent admin users | 1 | Solo operator |
| Rate limiters active | 0/13 (all null) | Phase 108 will fix |
| Test suite baseline | 782/782 passing | Phase 104 verification |

---

## 3. Cross-Phase Contract Inventory

### From Phase 104 (Type Safety)

| Contract | File | Impact on 105 |
|---|---|---|
| `RouteStatus` type: 5-value union | `src/types/driver.ts:12` | Use for transition map typing |
| `accepted_at`, `declined_at` columns typed | `src/types/database.ts:1281-1346` | Clear on status downgrades |
| `.select("id")` pattern on updates | Phase 104 precedent | Apply to all PATCH mutations |
| FK hints: `!routes_driver_id_fkey` | 4 API files fixed in `1191f45e` | Maintain in any new route queries |
| `pending_stops` excludes enroute | `updateRouteStats` semantic fix | No impact on status guards |

### From Phase 101 (Driver Experience)

| Contract | File | Impact on 105 |
|---|---|---|
| Accept: `assigned` → `accepted` only | `accept/route.ts:52` | Correct, no changes |
| Decline: `assigned`/`accepted` → `planned` | `decline/route.tsx:63` | Correct, no changes |
| Service client for decline (RLS bypass) | `decline/route.tsx:75` | Pattern to follow if needed |
| `after()` for decline email | `decline/route.tsx:113` | Use for Sentry logging |
| Auto-transition on driver assign | `admin/routes/[id]/route.ts:329-338` | Extend with lifecycle guard |
| `prevent_duplicate_active_assignment` trigger | Migration | No changes needed |
| Split/merge reset to `assigned` | `20260316_route_rpc_status_update.sql` | Out of scope for 105 |

### Feeds Into Future Phases

| Phase | What 105 Provides | Contract |
|---|---|---|
| 106 (Timezone) | Clean lifecycle — no status confusion masking TZ bugs | `accepted_at`/`declined_at` storage format unchanged |
| 107 (Data Integrity) | Correct status transitions — stop promotion only in `in_progress` | Route must be `in_progress` for stop mutations |
| 108 (Rate Limiting) | No new endpoints — existing rate limiters cover all routes | `driverActionLimiter`, `adminLimiter` already applied |
| 109 (Integration Tests) | Stable lifecycle to test against | `VALID_ROUTE_TRANSITIONS` constant as test fixture |

---

## 4. Route Lifecycle State Machine

### Current (Buggy)

```
                    Admin PATCH (ANY → ANY) ← NO GUARD

planned ──────────── assigned ──── accepted ──── in_progress ──── completed
  ↑ decline             ↑ assign      ↑ accept       ↑ start          ↑ auto
  └─────────────────────┘              │              │                │
                                       └──────────────┘                │
                            Start allows BOTH planned+accepted ← BUG  │
                                                                       │
                            Admin can set completed from ANY ← NO GUARD│
```

### Target (Phase 105)

```
planned ──→ assigned ──→ accepted ──→ in_progress ──→ completed (TERMINAL)
  ↑            │  ↑          │  ↑          │
  │ unassign   │  │ reassign │  │ downgrade│
  └────────────┘  └──────────┘  └──────────┘

Driver:  accept(assigned→accepted), start(accepted→in_progress), decline(assigned|accepted→planned)
Admin:   Full matrix below, with guard + audit
```

### Valid Route Transitions

```typescript
export const VALID_ROUTE_TRANSITIONS: Record<RouteStatus, RouteStatus[]> = {
  planned:     ["assigned"],                          // Admin assigns driver
  assigned:    ["planned", "accepted"],               // Unassign or accept
  accepted:    ["planned", "assigned", "in_progress"],// Reset, reassign, or start
  in_progress: ["completed"],                         // Only forward to completed
  completed:   [],                                    // Terminal — no transitions
};
```

**Admin-specific overrides:**
- `assigned` → `accepted`: Admin fast-track (driver not responding)
- `accepted` → `assigned`: Reverse acceptance (driver flagged issue)
- `accepted`/`assigned` → `planned`: Emergency unassign
- Any → `completed`: Only if all stops are terminal (existing validation)
- `completed` → anything: **BLOCKED** (terminal state)

---

## 5. Gotcha Inventory

### Critical (Will Break in Production)

| # | Gotcha | Source | Applies To | Fix |
|---|---|---|---|---|
| G1 | PostgREST FK hints: `routes` has 2 FKs to `drivers` | data-schema.md | Any new route query | Use `!routes_driver_id_fkey` hint |
| G2 | `.update()` returns no row count | stripe.md | Admin PATCH guard | Chain `.select("id")` to verify |
| G3 | `void asyncFn()` killed on Vercel | nextjs.md | Sentry audit logging | Use `after()` or `await` |
| G4 | Never return 200 on DB errors | stripe.md | Admin PATCH | Return 500 for retryable failures |
| G5 | Stale tests after validation changes | testing.md | Start endpoint fix | Grep `'planned'` in test files |

### High (Silent Failures)

| # | Gotcha | Source | Applies To | Fix |
|---|---|---|---|---|
| G6 | Supabase mock chains must match query shape | testing.md | Adding `.select("id")` | Update test mocks |
| G7 | RLS initplan wrappers for performance | supabase-auth.md | If adding route audit RLS | Use `(SELECT auth.uid())` |
| G8 | Idempotent migration DROP+CREATE | supabase-auth.md | Re-backfill migration | `DROP POLICY IF EXISTS` before `CREATE` |
| G9 | `DO NOTHING` won't fill NULLs | supabase-auth.md | Backfill migration | Use explicit `UPDATE SET` |

### Medium (Confusing Behavior)

| # | Gotcha | Source | Applies To | Fix |
|---|---|---|---|---|
| G10 | Single mutation owner principle | state-management.md | Route status | Only admin PATCH mutates status server-side |
| G11 | CI build needs dummy Supabase env vars | tooling.md | Any new API routes | Already configured |
| G12 | Service client `auth.getUser()` returns null | supabase-auth.md | If using service client | Use `admin.getUserById()` |

---

## 6. Data Contracts

### Route Table Schema (Relevant Columns)

```typescript
// src/types/database.ts — routes table
{
  id: string;                    // UUID PK
  delivery_date: string;         // DATE
  driver_id: string | null;      // FK → drivers.id (FK #1)
  status: RouteStatus;           // enum: 5 values
  started_at: string | null;     // TIMESTAMPTZ
  completed_at: string | null;   // TIMESTAMPTZ
  accepted_at: string | null;    // TIMESTAMPTZ (Phase 101)
  declined_at: string | null;    // TIMESTAMPTZ (Phase 101)
  declined_reason: string | null;// TEXT (Phase 101)
  declined_by: string | null;    // FK → drivers.id (FK #2) ← PGRST201 risk
  stats_json: Json | null;       // JSONB
}
```

### API Shapes

**Admin PATCH `/api/admin/routes/[id]`:**
```typescript
// Request (updateRouteSchema)
{ driverId?: string | null; status?: RouteStatus }

// Response (current)
{ id: string; status: RouteStatus; driverId: string | null; message: string }

// Response (Phase 105 — add rejection)
{ error: string } // 400 for invalid transitions
```

**Driver Start `/api/driver/routes/[routeId]/start`:**
```typescript
// Guard change: line 57
// Current: route.status !== "planned" && route.status !== "accepted"
// Phase 105: route.status !== "accepted"
```

### Existing Audit Pattern (order_audit_log)

```sql
-- supabase/migrations/011_order_audit_log.sql
CREATE TABLE order_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('status_change','cancel','refund','edit')),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('customer','admin','driver','system')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Insert pattern** (used in 6 places):
```typescript
await supabase.from("order_audit_log").insert({
  order_id: orderId,
  action: "status_change",
  actor_id: userId,      // from requireAdmin().userId
  actor_role: "admin",
  old_value: { status: previousStatus } as Json,
  new_value: { status: newStatus } as Json,
  reason: reason ?? null,
});
```

---

## 7. Design Compliance Matrix

| Principle | Phase 105 Compliance | Notes |
|---|---|---|
| Mobile-first (44px touch targets) | N/A — no new UI elements | Dropdown already meets targets |
| WCAG AA contrast | N/A — no color changes | Existing status badges compliant |
| Animation-first | N/A — no new animations | Status changes are instant |
| Teal admin accent | Maintained | Status badge colors already defined |
| Defense in depth | YES — frontend + backend guards | Both filter invalid transitions |
| Error messaging | YES — clear 400 responses | "Cannot transition from X to Y" |

---

## 8. Architectural Decisions

### Decision 1: Sentry Events vs Audit Table

| Option | Pros | Cons | Chosen |
|---|---|---|---|
| **Sentry events** | No migration, no new table, immediate | Not queryable in-app, retention limits | **YES** |
| Audit log table | Queryable, replicates order pattern | REQUIREMENTS.md defers it, overhead | No |
| JSONB column on routes | No new table, queryable | Unbounded growth, complex queries | No |

**Rationale:** REQUIREMENTS.md explicitly defers audit table. Sentry captures the required data (who, what, when, from, to) with zero schema changes. Can migrate to table in future milestone.

### Decision 2: Transition Map Location

| Option | Chosen |
|---|---|
| `src/lib/validations/route.ts` (alongside `routeStatusSchema`) | **YES** |
| `src/lib/validations/admin-api.ts` (new file) | No — avoids file proliferation |
| Inline in admin PATCH handler | No — not reusable for frontend |

### Decision 3: CHECK Constraint vs Application Guard

| Option | Chosen |
|---|---|
| **Both** — CHECK constraint + app-level guard | **YES** |
| App-level only | No — admin can still bypass via SQL |
| CHECK only | No — poor error messages for API consumers |

### Decision 4: Completed Route Terminal

| Option | Chosen |
|---|---|
| **Terminal — no reversal** | **YES** |
| Reversible with force flag | No — cascading undo too complex |
| Reversible with admin privilege | No — deferred to future milestone |

---

## 9. File Map

### Create

| File | Purpose |
|---|---|
| `supabase/migrations/YYYYMMDD_route_lifecycle_guards.sql` | Re-backfill + CHECK constraint |

### Modify

| File | Lines | Change |
|---|---|---|
| `src/lib/validations/route.ts` | After line 47 | Add `VALID_ROUTE_TRANSITIONS`, `isValidRouteTransition()`, `getValidRouteTransitions()` |
| `src/app/api/driver/routes/[routeId]/start/route.ts` | Line 57 | Remove `planned` from guard |
| `src/app/api/admin/routes/[id]/route.ts` | Lines 340-366 | Add transition validation, timestamp clearing, Sentry logging |
| `src/components/ui/admin/routes/RouteDetailClient/RouteHeader.tsx` | Lines 134-139 | Filter dropdown to valid transitions |

### Read (No Changes)

| File | Why |
|---|---|
| `src/app/api/driver/routes/[routeId]/accept/route.ts` | Verify guard is correct (it is) |
| `src/app/api/driver/routes/[routeId]/decline/route.tsx` | Verify guard is correct (it is) |
| `src/app/api/driver/routes/[routeId]/complete/route.ts` | Verify guard is correct (it is) |
| `src/app/api/driver/routes/active/route.ts` | Check `planned` in filter (may need removal) |
| `src/types/driver.ts` | RouteStatus type reference |
| `src/types/database.ts` | Route table type reference |
| `supabase/migrations/20260316_route_status_backfill.sql` | Understand original backfill scope |

---

## 10. Gray Area Resolutions

| # | Gray Area | Resolution | Confidence |
|---|---|---|---|
| 1 | Audit trail scope | Sentry events, not DB table (REQUIREMENTS.md defers table) | HIGH |
| 2 | Valid admin transitions | 8 valid transitions mapped; completed is terminal | HIGH |
| 3 | Start `planned` bug | Bug, not intentional — remove from guard | HIGH |
| 4 | Backfill needed | Yes — admin PATCH can create planned+driver_id after initial backfill | HIGH |
| 5 | Timestamp clearing | Clear `accepted_at` when status → `assigned`; clear decline fields when reviving | HIGH |
| 6 | Rate limiting | Already in place on all endpoints (null but present) | HIGH |
| 7 | Email on admin override | No — admin made the change, no notification needed | HIGH |
| 8 | Frontend vs backend guard | Both — defense in depth | HIGH |
| 9 | Completed reversibility | Terminal — no reversal allowed | HIGH |
| 10 | Split/merge interaction | Out of scope — existing RPC resets to `assigned` already | HIGH |

---

## 11. Admin Auth Pattern

```typescript
// src/lib/auth/admin.ts
export async function requireAdmin(): Promise<AdminAuthResult> {
  // Returns: { success: true, supabase, userId } or { success: false, error, status }
  // Checks JWT claims first, then DB fallback
  // userId is the admin's profile UUID — use for audit logging
}

// Usage in PATCH handler:
const auth = await requireAdmin();
if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
const adminUserId = auth.userId; // For Sentry audit event
```

---

## 12. Active Route Query Analysis

**File:** `src/app/api/driver/routes/active/route.ts:170-172`

```typescript
.in("status", ["assigned", "accepted", "planned", "in_progress"])
```

**Finding:** Includes `planned` in filter. After Phase 105:
- `planned` routes have `driver_id: null` (enforced by CHECK constraint)
- Query filters by `driver_id = driverId`, so `planned` results are impossible
- **No code change needed** — CHECK constraint makes it logically impossible

**Driver SSR page** (`src/app/(driver)/driver/route/page.tsx:77`):
- Same filter includes `planned` — same logic applies, no change needed

---

## 13. Existing Test Coverage

| Test Area | File | Count | Phase 105 Impact |
|---|---|---|---|
| Accept hook | `useAcceptRoute.test.ts` | ~5 tests | No changes |
| Decline hook | `useDeclineRoute.test.ts` | ~5 tests | No changes |
| Reorder hook | `useDriverReorderStops.test.ts` | ~4 tests | No changes |
| Stop transitions | `driver-api.test.ts` | ~6 tests | No changes |
| Route progress API | `routes-progress.test.ts` | ~6 tests | No changes |
| Start endpoint | (inline or missing) | TBD | Add rejection test for `planned` |
| Admin PATCH | (missing) | 0 | Add transition validation tests |

---

## 14. Verification Checklist

```bash
# Must pass before Phase 105 ships
pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

| Check | Baseline (Phase 104) |
|---|---|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Test failures | 0/782 |
| Build | Clean |

**Phase 105 additions to verify:**
- [ ] Start endpoint rejects `planned` status with 400
- [ ] Start endpoint accepts `accepted` status (regression check)
- [ ] Admin PATCH rejects invalid transitions with 400
- [ ] Admin PATCH allows all valid transitions
- [ ] Admin PATCH clears `accepted_at` on downgrade to `assigned`
- [ ] Admin PATCH blocks transitions from `completed`
- [ ] Frontend dropdown shows only valid options per current status
- [ ] Sentry event emitted on admin override
- [ ] CHECK constraint prevents `planned` + `driver_id`
- [ ] Re-backfill converts any orphaned routes
