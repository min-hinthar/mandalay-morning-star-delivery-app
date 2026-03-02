---
phase: 84-production-hardening
plan: 03
status: complete
commit: 5bb3cdd7
requirements: [HARD-03, HARD-04]
---

## What was done

### Task 1: Fix N+1 query on ops dashboard
- Replaced 2-query pattern (orders + separate notification_logs fetch) with single Supabase query joining `notification_logs (status, created_at)` in the select string
- Removed `EmailLogRow` interface and `emailStatusMap` variable
- Email status extracted from joined data with client-side sort by `created_at DESC`
- Response shape unchanged -- same mapped fields returned
- Enriched Sentry context with `userId: auth.userId`

### Task 2: Add pagination to 5 admin list endpoints
All 5 endpoints now return `{ data, pagination: { page, limit, total, totalPages } }`:

| Endpoint | Previous | Now |
|---|---|---|
| admin/orders | `.limit(100)`, raw array | `{ count: "exact" }` + `.range()`, paginated |
| admin/drivers | no limit, raw array | `{ count: "exact" }` + `.range()`, paginated |
| admin/menu | no limit, raw array | `{ count: "exact" }` + `.range()`, paginated |
| admin/categories | no limit, raw array | `{ count: "exact" }` + `.range()`, paginated |
| admin/routes | `.limit(50)`, raw array | `{ count: "exact" }` + `.range()`, paginated |

- Default page size: 25 (max 100)
- Query params: `?page=N&limit=N`
- Enriched Sentry context on admin/routes POST with `driverId, orderIds, routeId`

### Frontend consumer updates (10 files)
Updated all consumers to handle `json.data ?? json` pattern for backward compatibility:
- `(admin)/admin/orders/page.tsx`
- `(admin)/admin/drivers/page.tsx`
- `(admin)/admin/menu/page.tsx`
- `(admin)/admin/menu/[id]/page.tsx`
- `(admin)/admin/photos/page.tsx`
- `(admin)/admin/categories/page.tsx`
- `(admin)/admin/routes/page.tsx`
- `components/ui/admin/ops/OpsDriverPanel.tsx`
- `components/ui/admin/routes/RouteBuilder/RouteBuilderClient.tsx`
- `components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx`

## Verification
- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm format:check` passes
