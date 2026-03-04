# Phase 95: Observability, Performance, Testing & Launch Prep - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Production infrastructure is monitored, performant, validated by comprehensive tests, and all pre-launch infrastructure is provisioned. This is the final phase of v2.0 — everything after this is real Saturday deliveries with real money.

Requirements: OBS-01 through OBS-07, TST-01 through TST-07, LAUNCH-01 through LAUNCH-11.

</domain>

<decisions>
## Implementation Decisions

### Health Alerting (OBS-03)
- BetterStack for external uptime monitoring (free tier: 5 monitors, 3-min checks, email + SMS)
- Monitor /api/health?deep=true endpoint only — alerts on 503 (degraded/down)
- No Stripe webhook flow monitoring or custom metrics — keep it simple for launch
- Phase 95 code: document BetterStack setup steps in launch checklist, no code changes to health endpoint

### Database Backups (OBS-04)
- Supabase Pro plan built-in daily backups with point-in-time recovery (PITR)
- No custom pg_dump scripts or automated verification code
- Document the Supabase Pro upgrade requirement in LAUNCH_CHECKLIST.md
- Manual verification via Supabase dashboard — no health endpoint integration

### Load Testing (TST-07)
- k6 for load testing — JavaScript-based, lightweight CLI
- Test scenario: 50 concurrent checkout submissions against test Stripe keys
- Pass/fail: p95 response time < 3 seconds, 0% HTTP errors
- k6 script lives in project (e.g., `scripts/load-test.js` or `k6/checkout.js`)

### Saturday Dry Run (TST-06)
- Automated Node script creates 20 test orders via API
- Walks orders through full lifecycle: placed → confirmed → assigned → delivered
- Uses existing test Stripe keys (sk_test_*, pk_test_* already in .env.local)
- Script is repeatable — can run multiple times to validate

### Launch Checklist (LAUNCH-01 to LAUNCH-11)
- Single LAUNCH_CHECKLIST.md with all 11 items
- CLI validation script (`pnpm launch:check`) verifies programmatic items: env vars, DNS, Stripe, Redis
- Admin training (LAUNCH-09): inline 5-10 step walkthrough in checklist
- Driver test deliveries (LAUNCH-10): inline walkthrough in checklist
- Refund/emergency procedures (LAUNCH-11): section at bottom of LAUNCH_CHECKLIST.md

### Bundle & Performance (OBS-05, OBS-06)
- Run `pnpm analyze` first, then decide cuts based on data — no pre-committed removals
- Target <200KB first-load JS; if 200-250KB, document and move on
- First 4 menu item images preloaded eagerly (not lazy) above the fold
- Rest of menu images stay lazy-loaded

### Timezone (OBS-07)
- Move TIMEZONE constant from `types/delivery.ts` to env var `DELIVERY_TIMEZONE`
- Fallback to "America/Los_Angeles" when env var not set
- Single source of truth preserved — just changes from hardcoded to configurable

### LCP Target
- Maintain existing CI gate at <4s (don't tighten)
- Aim for <2.5s via image preloading + bundle audit
- Don't block launch if LCP is 2.5-4s — it's a stretch goal

### API Error Standardization (OBS-01)
- ~90% of routes already use `{error: {code, message, details?}}` format
- Migrate remaining 2-3 older routes (admin/orders, sections) to standardized format
- No new middleware needed — just fix the outliers

### Webhook Logging (OBS-02)
- Already comprehensive in both Stripe and Resend webhook handlers
- Stripe: event ID + type + order ID logged, signature verified
- Resend: SHA256 body hash, svix HMAC verification, source IP extraction
- May just need audit/verification that all fields are captured

### Claude's Discretion
- k6 script structure and exact test scenarios
- Which API routes to include in load test beyond checkout
- Exact format of LAUNCH_CHECKLIST.md sections
- Test data shape for dry run script (addresses, items, quantities)
- How to implement `pnpm launch:check` (Node script vs bash)
- Specific tree-shaking decisions if bundle is over target

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/api/health/route.ts`: Two-tier health check (shallow/deep) — already production-ready, no code changes needed for OBS-03
- `src/lib/rate-limit/client.ts`: Upstash Redis with fail-open fallback — fully integrated, LAUNCH-05 just needs provisioning
- `src/lib/utils/logger.ts`: Structured logger with Sentry integration — use for any new logging
- `src/lib/utils/image-optimization.ts`: `shouldPriorityLoad(index, viewportItems)` helper exists — use for OBS-05
- `src/app/api/checkout/session/route.ts`: `errorResponse()` helper — reference pattern for OBS-01 error standardization
- `src/test/setup.ts`: Test setup with mock env vars — extend for new tests

### Established Patterns
- Vitest for unit tests, co-located in `__tests__/` directories
- Playwright for E2E in `e2e/` directory
- Zod schemas for API validation (reference for test scenarios)
- `vi.mock()` for external service mocking (Supabase, Stripe)
- `createMockMenuItem()` factory in `src/test/factories/`

### Integration Points
- `types/delivery.ts:21` — TIMEZONE constant (change to env var for OBS-07)
- `src/lib/utils/delivery-dates.ts` — imports TIMEZONE (update import after OBS-07)
- Menu grid component — add priority prop to first 4 images (OBS-05)
- `package.json` scripts — add `launch:check` command
- `next.config.ts` — already has bundle analyzer configured

</code_context>

<specifics>
## Specific Ideas

- Test Stripe keys already exist in .env.local — dry run can start immediately
- BetterStack free tier sufficient for solo operator at 50-150 orders
- Supabase Pro upgrade is a human task, not a code task — just document it
- k6 is preferred because it's JavaScript-based (consistent with codebase) and lightweight

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 95-observability-performance-testing-launch-prep*
*Context gathered: 2026-03-03*
