# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 69 in progress (distributed rate limiting). Plan 01 complete (core library).

## Current Position

Phase: 69 of 74 (Distributed Rate Limiting)
Plan: 1 of 3 in current phase (core library)
Status: In progress
Last activity: 2026-02-18 — Completed 69-01-PLAN.md (core rate limit library)

Progress: [███░░░░░░░] ~29% (Phase 69: 1/3 plans complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 292 (across v1.0-v1.8)
- Average duration: ~15 min
- Total execution time: ~70 hours

**By Milestone:**

| Milestone | Phases | Plans | Duration |
| --------- | ------ | ----- | -------- |
| v1.0      | 8      | 32    | 2 days   |
| v1.1      | 6      | 21    | 1 day    |
| v1.2      | 9      | 29    | 4 days   |
| v1.3      | 10     | 53    | 2 days   |
| v1.4      | 8      | 39    | 6 days   |
| v1.5      | 8      | 34    | 3 days   |
| v1.6      | 10     | 47    | 6 days   |
| v1.7      | 9      | 32    | 3 days   |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.

Recent for v1.8:

- CSP uses 'unsafe-inline' for style-src (GSAP has no nonce support, 700+ inline styles)
- Rate limiting moves to Upstash Redis (in-memory Map is non-functional on Vercel)
- Role redirects go in auth callback, NOT proxy.ts (callback has session context)
- Driver availability uses JSONB column on drivers table (not separate table)
- Individual style.property assignments preferred over cssText for CSP compatibility
- String() used for numeric zIndex DOM style values
- app_settings SELECT uses USING(true) for universal read including anon
- order_audit_log restricted to admin-only SELECT/INSERT; service-role bypasses RLS
- All RLS function calls must use (select ...) initplan wrapper
- pgTAP not installed on production; use direct pg_policy/pg_proc queries for RLS verification
- 62-assertion regression test in supabase/tests/00_rls_policies.test.sql for future CI
- RLS isolation test requires DRIVER_A/B and ADMIN env vars for 4-role coverage
- All rate limiters typed as Ratelimit | null; callers must handle null (fail-open pattern)
- Sliding window algorithm for all limiters (prevents boundary-burst exploit)
- analytics: false on all limiters (avoids waitUntil/@vercel/functions dependency)
- .env.example now tracked in git (added !.env.example negation to .gitignore)

### Pending Todos

None.

### Blockers/Concerns

- Human verification needed: OAuth sign-in, email delivery, Stripe webhook, Search Console (8 items from v1.7)
- Upstash Redis provisioning needed via Vercel Marketplace before Phase 69
- Earnings computation join path needs verification (route_stops -> orders.total_cents)
- Availability business rules: confirm day-of-week pattern vs Saturday-only

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 69-01-PLAN.md (core rate limit library). Next: 69-02-PLAN.md (route integration).
Resume file: None
