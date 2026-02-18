# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 69 complete (distributed rate limiting). Next: Phase 70 (role-based auth redirects).

## Current Position

Phase: 69 of 74 (Distributed Rate Limiting)
Plan: 3 of 3 in current phase (admin rate limiting + client-side 429 handler)
Status: Phase complete
Last activity: 2026-02-18 — Completed 69-03-PLAN.md (admin rate limiting + client-side 429 handler)

Progress: [████░░░░░░] ~38% (Phase 69: 3/3 plans complete, phase done)

## Performance Metrics

**Velocity:**

- Total plans completed: 295 (across v1.0-v1.8)
- Average duration: ~15 min
- Total execution time: ~71 hours

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
- Client-side 429 handler uses context-aware toast (checkout-specific reassuring message)
- Sentry alert rule for rate limit spikes requires manual dashboard setup

### Pending Todos

None.

### Blockers/Concerns

- Human verification needed: OAuth sign-in, email delivery, Stripe webhook, Search Console (8 items from v1.7)
- Upstash Redis provisioning needed via Vercel Marketplace before rate limiting is active in production
- Sentry alert rule "Rate Limit Spike" needs manual creation in Sentry Dashboard
- Earnings computation join path needs verification (route_stops -> orders.total_cents)
- Availability business rules: confirm day-of-week pattern vs Saturday-only

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 69-03-PLAN.md (admin rate limiting + client-side 429 handler). Phase 69 complete. Next: Phase 70 (role-based auth redirects).
Resume file: None
