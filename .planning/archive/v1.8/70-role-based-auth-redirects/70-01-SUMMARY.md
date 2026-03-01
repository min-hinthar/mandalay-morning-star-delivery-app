---
phase: 70-role-based-auth-redirects
plan: 01
subsystem: auth
tags: [middleware, supabase-ssr, role-redirect, session-refresh, layout-guards]
dependency-graph:
  requires: []
  provides:
    - "proxy.ts middleware for session refresh and auth gating"
    - "getRoleDashboard() centralized role-to-dashboard mapping"
    - "Updated auth routes (callback, confirm) with role-based redirects"
    - "Silent wrong-role redirects in admin/driver layout guards"
    - "admin_contact_info seed in app_settings"
  affects:
    - "70-02 (deactivated driver page uses admin_contact_info)"
    - "70-03 (callback spinner relies on role resolution from getRoleDashboard)"
    - "70-04 (onboarding form changes, passwordless flow)"
tech-stack:
  added: []
  patterns:
    - "proxy.ts middleware with updateSession for Supabase SSR cookie refresh"
    - "Centralized getRoleDashboard with self-healing profile creation"
    - "Authorization-checked ?next= deep linking in auth callback"
key-files:
  created:
    - src/proxy.ts
    - src/lib/supabase/middleware.ts
    - src/lib/auth/role-redirect.ts
    - supabase/migrations/023_admin_contact_info.sql
  modified:
    - src/lib/auth/index.ts
    - src/app/auth/callback/route.ts
    - src/app/auth/confirm/route.ts
    - src/app/(admin)/admin/layout.tsx
    - src/app/(driver)/driver/layout.tsx
decisions:
  - id: "proxy-over-middleware"
    decision: "Use proxy.ts (Next.js 16 convention) instead of middleware.ts"
    rationale: "Next.js 16 recognizes both MIDDLEWARE_FILENAME and PROXY_FILENAME; proxy.ts is the v16 convention"
  - id: "no-db-in-middleware"
    decision: "Middleware only checks authentication, no DB queries for role"
    rationale: "Middleware runs on every matched request; DB queries would add 50-200ms latency per navigation"
  - id: "service-client-for-role-lookup"
    decision: "Use createServiceClient() for getRoleDashboard in callback/confirm routes"
    rationale: "SSR cookie state after exchangeCodeForSession can be inconsistent in Route Handlers, causing RLS-gated queries to return no data"
  - id: "authorization-checked-next"
    decision: "Honor ?next= deep links but verify role authorization before redirecting"
    rationale: "Prevents unauthorized users from being redirected to protected routes via crafted ?next= params"
metrics:
  duration: "~21 min"
  completed: "2026-02-19"
---

# Phase 70 Plan 01: Middleware + Centralized Role Redirect Summary

**One-liner:** proxy.ts middleware for Supabase session refresh + centralized getRoleDashboard() with driver status detection and self-healing profile creation

## What Was Built

### Task 1: proxy.ts middleware and updateSession utility
- Created `src/proxy.ts` as the Next.js 16 middleware entry point (exported `proxy` function + `config` matcher)
- Created `src/lib/supabase/middleware.ts` with `updateSession()` that refreshes Supabase auth session cookies on every request
- Matcher excludes: `_next/static`, `_next/image`, `favicon.ico`, `monitoring` (Sentry tunnel), and common static extensions
- Gates `/admin` and `/driver` routes for unauthenticated users, redirecting to `/login?next={path}` to preserve deep links
- No DB queries in middleware -- role checks deferred to layout guards
- Build output confirms: `f Proxy (Middleware)` recognized by Next.js 16

### Task 2: Centralized getRoleDashboard and updated auth routes + layout guards
- Created `src/lib/auth/role-redirect.ts` with `getRoleDashboard()` -- single source of truth for role-to-dashboard mapping
  - Admin -> `/admin`
  - Active driver -> `/driver`
  - Inactive (deactivated) driver -> `/driver/deactivated`
  - Driver with no record -> `/driver/onboard`
  - Customer (or default) -> `/menu`
  - Self-healing: auto-creates profile with `role='customer'` if no profile row exists
  - DB error fallback: returns `/` with `role: "unknown"`
- Updated `src/app/auth/callback/route.ts`:
  - Removed local `getRoleDashboard` function (was duplicated)
  - Imports centralized version from `@/lib/auth/role-redirect`
  - Honors `?next=` deep links with authorization check (e.g., customer with `?next=/admin` gets redirected to `/menu` instead)
- Updated `src/app/auth/confirm/route.ts`:
  - Imports `getRoleDashboard` for role-based redirect after OTP verification
  - Driver invites always redirect to `/driver/onboard`
- Updated `src/app/(admin)/admin/layout.tsx`:
  - Replaced `redirect("/?error=unauthorized")` with silent redirect to user's own dashboard via `getRoleDashboard`
- Updated `src/app/(driver)/driver/layout.tsx`:
  - Removed `.eq("is_active", true)` filter from drivers query to detect deactivated vs no-record
  - Three-way handling: no driver record + driver role -> onboard, no driver record + other role -> their dashboard, deactivated -> `/driver/deactivated`, active -> continue
- Created `supabase/migrations/023_admin_contact_info.sql` seeding `admin_contact_info` in `app_settings`
- Re-exported `getRoleDashboard` and `RoleRedirectResult` from `src/lib/auth/index.ts`

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm build` | Pass (with `f Proxy (Middleware)` in output) |
| No `/?error=unauthorized` in admin layout | Confirmed removed |
| No `/?error=not_driver` in driver layout | Confirmed removed |
| No `.from(` in middleware.ts | Confirmed (no DB queries) |
| `getRoleDashboard` exported from role-redirect.ts | Confirmed |
| Callback imports from `@/lib/auth/role-redirect` | Confirmed |
| Migration 023 exists | Confirmed |

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `ac49b95a` | feat(70-01): create proxy.ts middleware and updateSession utility |
| 2 | `d48482d7` | feat(70-01): centralize getRoleDashboard and update auth routes + layout guards |

## Next Phase Readiness

- **Ready for 70-02:** The `admin_contact_info` setting is seeded; the deactivated driver page can query it
- **Ready for 70-03:** `getRoleDashboard` returns role info needed for branded callback spinner text
- **Ready for 70-04:** Onboarding form changes can proceed -- layout guards are updated, role-redirect handles onboard path
- **No blockers identified**
