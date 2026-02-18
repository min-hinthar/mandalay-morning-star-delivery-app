# Phase 58: Deployment Verification - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate production environment is healthy. Build a `/api/health` endpoint that reports service connectivity for Supabase, Stripe, and Resend. Verify all required environment variables are configured in Vercel for production scope. Ensure auth/callback and webhook routes are reachable. App is already deployed at delivery.mandalaymorningstar.com (DEPL-01 complete).

</domain>

<decisions>
## Implementation Decisions

### Health endpoint design

- Check three services: Supabase, Stripe, Resend
- Two-tier health check: quick config-presence check by default, `?deep=true` for live connectivity tests (actually call each service)
- Response includes a top-level `production_ready: true/false` flag summarizing all checks
- Health endpoint also verifies auth/callback route and Stripe webhook route are reachable and configured
- Reports missing env var names (not values) when config is incomplete

### Failure reporting

- Full error details exposed when a service is down (error message and type visible in response)
- Sensitive values (API keys, connection strings) should be redacted — show error type, mask credentials

### Access & security

- Publicly accessible at `/api/health` — no authentication required (standard for uptime monitors)
- CORS: allow all origins (monitoring dashboards can call it from browsers)
- Main domain path only: `delivery.mandalaymorningstar.com/api/health` — no custom subdomain
- Exclude from service worker caching and analytics

### Env var validation

- Same env vars across all Vercel scopes (preview, production, development)
- Health endpoint reports which env vars are missing by name
- Both automated detection (health endpoint) and manual checklist for initial Vercel setup

### Auth/callback & webhook checks

- Health endpoint verifies auth/callback and webhook routes are reachable (not 404)
- Included as part of the health check response, not separate endpoints

### Claude's Discretion

- Response format (JSON structure, field naming)
- Timeout per service check
- Status levels (healthy/degraded/down vs binary)
- Whether to include version/commit hash
- Parallel vs sequential service checks
- Logging/alerting behavior on failure
- Caching strategy for rapid polling
- Rate limiting strategy
- Sensitive value redaction approach
- Zod schema vs presence-only env var validation
- Criticality tiers for env vars (which block start vs warn)
- .env.example template creation
- Separate /api/health/env endpoint vs unified
- Resend check depth (API key, domain verification, or just env var)
- Supabase auth config validation depth
- Stripe webhook signing secret verification depth

</decisions>

<specifics>
## Specific Ideas

- User wants a `production_ready` boolean flag in health response as a single go/no-go signal
- Full error details are acceptable — this is a debugging/operations endpoint, not customer-facing
- Health endpoint should serve as the target for uptime monitoring services (Phase 59 will set up the monitoring)

</specifics>

<deferred>
## Deferred Ideas

- Uptime monitoring service integration (BetterUptime, UptimeRobot) — Phase 59 scope
- Full OAuth redirect URL configuration — Phase 62 scope
- Stripe webhook signing secret configuration — Phase 62 scope
- Resend domain DNS setup (SPF/DKIM/DMARC) — Phase 62 scope

</deferred>

---

_Phase: 58-deployment-verification_
_Context gathered: 2026-02-13_
