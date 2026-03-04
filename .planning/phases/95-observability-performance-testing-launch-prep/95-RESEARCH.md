# Phase 95: Observability, Performance, Testing & Launch Prep - Research

**Researched:** 2026-03-04
**Domain:** Production readiness -- monitoring, performance, integration testing, load testing, launch infrastructure
**Confidence:** HIGH

## Summary

Phase 95 is the final phase before production launch. It spans four distinct sub-domains: (1) observability hardening (error standardization, webhook audit, health alerting, backups, timezone env var), (2) performance optimization (image preloading, bundle audit), (3) comprehensive testing (unit tests for edge cases, dry run script, k6 load test), and (4) launch infrastructure provisioning with a validation checklist.

Most observability items are small surgical changes -- the health endpoint, webhook handlers, and image priority loading already exist. The primary coding work is: standardizing ~30 API routes from flat `{ error: "string" }` to `{ error: { code, message, details? } }` format, writing 5 test suites (cart race, webhook, RLS, cutoff/DST, refund rounding), creating a k6 load test script, creating a Saturday dry run script, and producing a LAUNCH_CHECKLIST.md with a `pnpm launch:check` validation script.

**Primary recommendation:** Split into 4-5 waves: Wave 1 (error standardization + timezone env var), Wave 2 (test suites for TST-01 through TST-05), Wave 3 (bundle audit + image preload verification), Wave 4 (k6 load test + dry run script), Wave 5 (launch checklist + launch:check script + documentation).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- BetterStack for external uptime monitoring (free tier: 5 monitors, 3-min checks, email + SMS)
- Monitor /api/health?deep=true endpoint only -- alerts on 503
- No code changes to health endpoint -- just document BetterStack setup steps
- Supabase Pro plan built-in daily backups with PITR -- no custom pg_dump scripts
- Document Supabase Pro upgrade requirement in LAUNCH_CHECKLIST.md -- no health endpoint integration
- k6 for load testing -- JavaScript-based, lightweight CLI
- 50 concurrent checkout submissions against test Stripe keys; p95 < 3s, 0% HTTP errors
- Automated Node script for Saturday dry run -- 20 test orders via API through full lifecycle
- Single LAUNCH_CHECKLIST.md with all 11 items
- CLI validation script (`pnpm launch:check`) verifies programmatic items
- Admin training (LAUNCH-09): inline 5-10 step walkthrough in checklist
- Driver test deliveries (LAUNCH-10): inline walkthrough in checklist
- Refund/emergency procedures (LAUNCH-11): section at bottom of LAUNCH_CHECKLIST.md
- Run `pnpm analyze` first for bundle audit, then decide cuts based on data
- Target <200KB first-load JS; if 200-250KB, document and move on
- First 4 menu item images preloaded eagerly (already wired -- verify)
- Move TIMEZONE constant from `types/delivery.ts` to env var `DELIVERY_TIMEZONE`
- Fallback to "America/Los_Angeles" when env var not set
- Maintain existing CI gate at <4s LCP (don't tighten)
- ~90% of routes already use standardized format -- migrate remaining outliers
- Webhook logging already comprehensive -- audit/verify only
- No new middleware for error standardization

### Claude's Discretion
- k6 script structure and exact test scenarios
- Which API routes to include in load test beyond checkout
- Exact format of LAUNCH_CHECKLIST.md sections
- Test data shape for dry run script (addresses, items, quantities)
- How to implement `pnpm launch:check` (Node script vs bash)
- Specific tree-shaking decisions if bundle is over target

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OBS-01 | All API routes use standardized error format `{error: {code, message, details?}}` | Audit found ~30 routes in admin/orders, admin/sections, webhooks, driver, cron, emails using flat `{ error: "string" }` format. Checkout pattern (`errorResponse()` helper) is the reference. |
| OBS-02 | Webhook events logged with body hash + signature | Already implemented in both Stripe and Resend handlers. Stripe: event ID/type/order ID logged, signature verified. Resend: SHA256 body hash, svix HMAC, source IP, audit logs table. Needs audit verification only. |
| OBS-03 | Health check has external alerting for downtime | BetterStack free tier. Health endpoint already returns 503 on degraded/down. No code changes -- document setup steps in launch checklist. |
| OBS-04 | Database backed up daily with verification | Supabase Pro plan PITR. No code -- document Pro upgrade requirement in launch checklist. |
| OBS-05 | First 4 menu images preloaded (not lazy above fold) | Already wired: `MenuGrid.tsx:80` passes `priority={index < 4}` to UnifiedMenuItemCard. `shouldPriorityLoad()` helper exists. Needs verification pass only. |
| OBS-06 | Bundle under 200KB first-load JS (tree-shaking audit) | `pnpm analyze` already configured. `next.config.ts` has `optimizePackageImports` for lucide, framer-motion, radix, recharts, date-fns. Large deps to watch: gsap, framer-motion, tiptap, recharts, leaflet. |
| OBS-07 | Timezone from env var (not hardcoded) | `TIMEZONE` constant at `types/delivery.ts:21`. Imported by `delivery-dates.ts` and its formatters. Change to `process.env.DELIVERY_TIMEZONE \|\| "America/Los_Angeles"`. Need to update all importers. |
| TST-01 | Concurrent cart addition race condition tests | Cart store at `cart-store.ts` uses debounce inside Zustand `set()` for atomicity (BUG-06 fix). Test: rapid-fire `addItem()` calls, verify no duplicates, verify debounce blocks. |
| TST-02 | Stripe webhook failure/transition tests | Existing test at `webhooks/stripe/__tests__/route.test.ts` covers event structure + business logic documentation. Need: actual handler invocation tests with mocked Supabase for status transition failures, duplicate events, malformed payloads. |
| TST-03 | RLS policy multi-user edge case tests | Existing `scripts/rls-isolation-test.mjs` covers basic isolation. Need Vitest-based tests for: cross-user order access, driver seeing only assigned routes, admin elevation, anon access denied. |
| TST-04 | Cutoff boundary tests including DST transitions | Existing `delivery-dates.test.ts` has 15 tests including BUG-07 safety buffer. Need: DST spring-forward (March 8, 2026 -- clocks spring forward at 2AM PT), DST fall-back (Nov 1, 2026), cutoff at exact DST boundary. |
| TST-05 | Refund calculation rounding/ceiling tests | BUG-05 ceiling validation exists in refund route. Need: rounding edge cases (odd quantities, fractional unit prices), ceiling exactly at total, ceiling exceeds total, partial refund + second partial refund exceeding remainder. |
| TST-06 | Full Saturday dry run -- 20 test orders through lifecycle | Node script using API endpoints. Creates orders, transitions through placed->confirmed->assigned->delivered. Uses test Stripe keys. |
| TST-07 | Load test -- 50 concurrent checkout submissions via k6 | k6 script targeting checkout/session endpoint. JavaScript-based. p95 < 3s, 0% errors. |
| LAUNCH-01 | Supabase production instance provisioned | Checklist item -- human action with verification step |
| LAUNCH-02 | Production env vars set | launch:check script verifies required vars present |
| LAUNCH-03 | DNS + custom domain verified with SSL | launch:check script verifies DNS resolution + HTTPS |
| LAUNCH-04 | Google Maps API billing enabled with budget cap | Checklist item with verification instructions |
| LAUNCH-05 | Upstash Redis provisioned on Vercel Marketplace | launch:check script checks UPSTASH_REDIS_REST_URL env var |
| LAUNCH-06 | Stripe webhook tested with real test payments | Checklist item with Stripe CLI test instructions |
| LAUNCH-07 | Email delivery confirmed (all 4 templates) | Checklist item with test email send instructions |
| LAUNCH-08 | Mobile testing (iOS Safari, Android Chrome, PWA install) | Checklist item with manual test steps |
| LAUNCH-09 | Admin trained on ops dashboard | Inline walkthrough in checklist |
| LAUNCH-10 | Driver(s) completed test deliveries | Inline walkthrough in checklist |
| LAUNCH-11 | Refund and emergency procedures documented | Section at bottom of LAUNCH_CHECKLIST.md |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 4.0.17 | Unit test framework | Already configured, jsdom env, globals |
| Playwright | 1.57.0 | E2E test framework | Already configured in `e2e/` |
| @next/bundle-analyzer | 16.1.3 | Bundle size analysis | Already configured via `pnpm analyze` |
| Sentry | 10.38.0 | Error tracking + monitoring | Already integrated |

### New for Phase 95
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| k6 | latest | Load testing CLI | TST-07 -- install globally via `brew install k6` or `choco install k6` on Windows |
| BetterStack | SaaS | External uptime monitoring | OBS-03 -- free tier, no npm package needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| k6 | Artillery | Artillery is Node-native but k6 is faster for high concurrency and user decided k6 |
| BetterStack | UptimeRobot | Both have free tiers; BetterStack chosen by user |

**Installation:**
```bash
# k6 (Windows via Chocolatey or winget)
choco install k6
# or
winget install grafana.k6

# No npm packages needed -- k6 is a standalone CLI
```

## Architecture Patterns

### Recommended File Structure for New Artifacts
```
scripts/
  load-test.js          # k6 load test script (TST-07)
  dry-run.ts            # Saturday dry run script (TST-06)
  launch-check.ts       # pnpm launch:check validator
docs/
  LAUNCH_CHECKLIST.md   # All LAUNCH-01 to LAUNCH-11 items
src/
  types/
    delivery.ts         # TIMEZONE -> env var (OBS-07)
  lib/
    utils/
      delivery-dates.ts # Updated TIMEZONE import
      __tests__/
        delivery-dates.test.ts  # Extended with DST tests (TST-04)
        refund-calc.test.ts     # New (TST-05)
    stores/
      __tests__/
        cart-store.test.ts      # Extended with race tests (TST-01)
  app/api/
    webhooks/stripe/__tests__/
      route.test.ts     # Extended with failure tests (TST-02)
    admin/orders/       # Error format standardization (OBS-01)
    admin/sections/     # Error format standardization (OBS-01)
```

### Pattern 1: Standardized API Error Response
**What:** All API routes return errors in `{ error: { code, message, details? } }` format
**When to use:** Every error response across all API routes
**Example:**
```typescript
// Reference: src/app/api/checkout/session/route.ts
function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

// BEFORE (non-standardized -- found in ~30 routes):
return NextResponse.json({ error: "Order not found" }, { status: 404 });
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
return NextResponse.json({ error: auth.error }, { status: auth.status });

// AFTER (standardized):
return NextResponse.json(
  { error: { code: "NOT_FOUND", message: "Order not found" } },
  { status: 404 }
);
return NextResponse.json(
  { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
  { status: 500 }
);
```

### Pattern 2: Environment Variable with Fallback
**What:** Configurable values via env var with sensible defaults
**When to use:** OBS-07 timezone migration
**Example:**
```typescript
// src/types/delivery.ts (or new src/lib/config/timezone.ts)
export const TIMEZONE = process.env.DELIVERY_TIMEZONE || "America/Los_Angeles";
```

### Pattern 3: k6 Load Test Script
**What:** JavaScript-based load test targeting checkout endpoint
**When to use:** TST-07 load testing
**Example:**
```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    checkout_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    items: [{ menuItemId: '...', quantity: 1, modifiers: [] }],
    addressId: '...',
    scheduledDate: '2026-03-07',
    timeWindowStart: '10:00',
    timeWindowEnd: '11:00',
  });

  const res = http.post(`${__ENV.BASE_URL}/api/checkout/session`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has session URL': (r) => JSON.parse(r.body).data?.sessionUrl !== undefined,
  });

  sleep(1);
}
```

### Pattern 4: Dry Run Script
**What:** Automated Node script creating test orders through full lifecycle
**When to use:** TST-06 Saturday dry run
**Example:**
```typescript
// scripts/dry-run.ts
// Uses Supabase service client + Stripe test keys
// 1. Create 20 orders via POST /api/checkout/session
// 2. Simulate webhook: checkout.session.completed
// 3. Admin status transition: confirmed -> preparing -> out_for_delivery -> delivered
// 4. Verify all 20 reach "delivered" status
```

### Anti-Patterns to Avoid
- **Wrapping every route in try/catch with generic error:** Each error should have a specific code. Don't use `INTERNAL_ERROR` for validation failures.
- **Testing with real Stripe live keys:** Always use `sk_test_*` / `pk_test_*` for load tests and dry runs.
- **Hardcoding timezone in multiple places:** After OBS-07, there must be exactly one source: the env var with fallback. Any file importing `TIMEZONE` must get it from the single source.
- **Making launch:check fail on human-action items:** Only verify programmatic items (env vars present, DNS resolves). Human actions are checklisted, not automated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Uptime monitoring | Custom cron + email alerts | BetterStack free tier | False positives, maintenance burden, needs external vantage point |
| Database backups | Custom pg_dump cron | Supabase Pro PITR | Reliability, point-in-time recovery, zero maintenance |
| Load testing framework | Custom concurrent fetch loops | k6 | VU lifecycle, thresholds, metrics collection, reporting |
| Error code constants | Inline string literals per route | Shared `API_ERROR_CODES` constant | Consistency, typo prevention, client-side mapping |

**Key insight:** This phase is about production hardening, not feature development. Prefer managed services (BetterStack, Supabase Pro) and proven tools (k6) over custom code.

## Common Pitfalls

### Pitfall 1: DST Boundary Off-by-One in Tests
**What goes wrong:** Tests use UTC dates but cutoff logic operates in America/Los_Angeles. During DST transitions, PT offset changes from -8 to -7 (spring forward) or -7 to -8 (fall back).
**Why it happens:** `new Date("2026-03-08T14:59:00-08:00")` and `new Date("2026-03-08T14:59:00-07:00")` are different UTC instants. Using wrong offset creates false test results.
**How to avoid:** Use the `makePtDate` helper from existing tests. For spring-forward test (March 8, 2026): clocks jump from 1:59 AM PST to 3:00 AM PDT. Create test dates on both sides of the transition.
**Warning signs:** Tests pass locally but fail in CI (different TZ), or tests pass in winter but fail in summer.

### Pitfall 2: k6 Auth Token Expiry During Load Test
**What goes wrong:** Supabase JWT tokens expire (default 1 hour). A 2-minute load test is fine, but if setup takes too long or test is re-run, tokens expire.
**Why it happens:** k6 `setup()` runs once; tokens generated there may expire before all VUs finish.
**How to avoid:** Generate fresh token in `setup()`, use short test durations (2 min), or use service role key for load testing.
**Warning signs:** First few requests succeed, later ones return 401.

### Pitfall 3: Error Format Migration Breaking Frontend
**What goes wrong:** Frontend code expects `response.error` as a string, but after migration it's `response.error.code` or `response.error.message`.
**Why it happens:** Inconsistent error handling in client-side fetch wrappers.
**How to avoid:** Search all frontend `catch` blocks and error handlers for pattern `data.error` (string) vs `data.error.message` (object). The standardized format wraps the string in an object.
**Warning signs:** Error toasts show "[object Object]" instead of human-readable message.

### Pitfall 4: TIMEZONE as Module-Level Constant Won't Read Env at Runtime
**What goes wrong:** If `TIMEZONE` is defined as `export const TIMEZONE = process.env.DELIVERY_TIMEZONE || "..."` at module top level, it reads the env var at import time (build time for server components), not at runtime.
**Why it happens:** Module-level code executes once when first imported. In Next.js server components, this is fine (re-evaluated per request in serverless). In client components, it's baked at build time.
**How to avoid:** Keep `TIMEZONE` server-side only (it's only used in `delivery-dates.ts` which is server-side). For client-side, pass timezone via API response or React context. Current usage is already server-side -- just verify no client imports.
**Warning signs:** Changing `DELIVERY_TIMEZONE` env var has no effect until redeploy.

### Pitfall 5: Dry Run Script Creating Real Stripe Charges
**What goes wrong:** If the script accidentally uses live Stripe keys, real credit cards get charged.
**Why it happens:** Script reads env vars; if production `.env` is loaded instead of `.env.local`, live keys are used.
**How to avoid:** Script MUST assert `process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')` before proceeding. Abort with clear error if live key detected.
**Warning signs:** Stripe dashboard shows unexpected live charges.

## Code Examples

### Error Standardization Helper (extract to shared utility)
```typescript
// src/lib/utils/api-error.ts
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "STRIPE_ERROR"
  | "DUPLICATE_ORDER"
  | "CUTOFF_PASSED"
  | "ITEM_UNAVAILABLE"
  | "ADDRESS_INVALID"
  | "OUT_OF_COVERAGE";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}
```

### DST Boundary Test Cases (TST-04)
```typescript
// Spring forward: March 8, 2026 at 2:00 AM PT -> 3:00 AM PDT
// If cutoff is Friday 3PM, the Friday before March 7 is in PST (-8:00)
// The Saturday March 8 straddles the DST boundary
describe("DST spring-forward boundary", () => {
  it("cutoff calculated correctly across DST transition", () => {
    // Friday March 6, 2026 at 2:59 PM PST (before cutoff, PST still active)
    const beforeCutoff = new Date("2026-03-06T22:59:00.000Z"); // 2:59 PM PST = 22:59 UTC
    const saturday = new Date("2026-03-07T08:00:00.000Z"); // March 7 Saturday
    expect(isPastCutoff(saturday, beforeCutoff, 5, 15)).toBe(false);
  });
});
```

### Cart Race Condition Test (TST-01)
```typescript
describe("concurrent cart additions", () => {
  it("debounces rapid-fire adds within 300ms", () => {
    const { result } = renderHook(() => useCartStore());
    const item = createMockCartItem();

    // Rapid-fire: 5 adds within 50ms
    for (let i = 0; i < 5; i++) {
      act(() => result.current.addItem(item));
    }

    // Should have quantity 1 (4 debounced)
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
  });
});
```

### Refund Rounding Test (TST-05)
```typescript
describe("refund calculation rounding", () => {
  it("handles odd quantity division correctly", () => {
    // Item: 3 units at $10.00 total = $3.33/unit
    // Refund 1 unit: Math.round(3.33 * 100) = 333 cents
    const unitPrice = 1000 / 3; // 333.33...
    const refundAmount = Math.round(unitPrice * 1);
    expect(refundAmount).toBe(333);
  });

  it("ceiling validation prevents refund exceeding order total", () => {
    // Order total: 1000 cents
    // Two partial refunds: 500 + 501 = 1001 > 1000 -> reject
    const orderTotal = 1000;
    const firstRefund = 500;
    const secondRefund = 501;
    expect(firstRefund + secondRefund).toBeGreaterThan(orderTotal);
  });
});
```

### launch:check Script Pattern
```typescript
// scripts/launch-check.ts
// Run via: npx tsx scripts/launch-check.ts

interface Check {
  name: string;
  check: () => Promise<boolean>;
  required: boolean;
}

const checks: Check[] = [
  {
    name: "LAUNCH-02: Stripe live key",
    check: async () => !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_"),
    required: true,
  },
  {
    name: "LAUNCH-03: DNS resolves",
    check: async () => {
      const res = await fetch(`https://${process.env.NEXT_PUBLIC_APP_URL}/api/health`);
      return res.ok;
    },
    required: true,
  },
  {
    name: "LAUNCH-05: Redis configured",
    check: async () => !!process.env.UPSTASH_REDIS_REST_URL,
    required: true,
  },
  // ... more checks
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded timezone string | Env var with fallback | This phase | Enables multi-region if ever needed |
| Flat error strings | Structured `{code, message, details?}` | This phase | Client-side error handling becomes reliable |
| Manual Saturday testing | Automated dry run script | This phase | Repeatable validation before each launch |
| No external monitoring | BetterStack uptime + alerts | This phase | Downtime detection within 3 minutes |

**Deprecated/outdated:**
- `TIMEZONE` constant in `types/delivery.ts` -- will be replaced by env var

## Existing Code Audit

### Routes Needing Error Standardization (OBS-01)
Routes using flat `{ error: "string" }` format (need migration to `{ error: { code, message } }`):

**admin/orders/ (10 routes):**
- `route.ts` -- GET list orders (3 error responses)
- `[id]/status/route.ts` -- PATCH status (5 error responses)
- `[id]/cancel/route.ts` -- POST cancel (7 error responses)
- `[id]/driver/route.ts` -- PATCH assign driver (7 error responses)
- `[id]/contact/route.ts` -- POST contact (4 error responses)
- `[id]/details/route.ts` -- GET details (4 error responses)
- `[id]/refund/route.ts` -- POST refund (7 error responses)
- `[id]/items/route.ts` -- PATCH items (8 error responses)
- `[id]/priority/route.ts` -- PATCH priority (4 error responses)

**admin/sections/ (7 routes):**
- `route.ts` -- GET/POST sections (5 error responses)
- `[id]/route.ts` -- GET/PATCH/DELETE/POST sections (10 error responses)
- `[id]/items/route.ts` -- GET/POST/DELETE/PATCH items (8 error responses)
- `publish/route.ts` -- POST publish (2 error responses)
- `reorder/route.ts` -- POST reorder (2 error responses)
- `most-popular/suggest/route.ts` -- GET suggest (2 error responses)

**Other routes with flat errors:**
- `webhooks/stripe/route.ts` -- 3 error responses
- `webhooks/resend/route.ts` -- 2 error responses
- `cron/delivery-reminders/route.ts` -- 2 error responses
- `emails/test/route.ts` -- 4 error responses
- `driver/location/route.ts` -- 2 error responses
- `admin/sections/[id]/items/route.ts` -- multiple flat errors

**Routes already standardized (no changes needed):**
- `account/profile/route.ts` -- uses `{ error: { code, message } }` format
- `account/settings/route.ts` -- uses `{ error: { code, message } }` format
- `account/addresses/**` -- uses standardized format
- `account/orders/**` -- uses standardized format
- `checkout/session/route.ts` -- uses `errorResponse()` helper
- `orders/[id]/notes/route.ts` -- uses standardized format
- `menu/route.ts` -- uses standardized format
- `menu/search/route.ts` -- uses standardized format
- `tracking/[orderId]/route.ts` -- uses standardized format

### Image Priority Loading (OBS-05)
Already implemented:
- `MenuGrid.tsx:80`: `priority={index < 4}` -- first 4 cards get priority
- `UnifiedMenuItemCard.tsx`: passes `priority` to image component
- `shouldPriorityLoad()` helper in `image-optimization.ts`
- **Action needed:** Verify FeaturedCarousel and SectionCarousel also use priority for first items

### Webhook Logging (OBS-02)
Already comprehensive:
- **Stripe:** Event ID + type + order ID logged, signature verified via `stripe.webhooks.constructEvent`, idempotency via `webhook_events` table upsert
- **Resend:** SHA256 body hash, svix HMAC verification, source IP extraction, `webhook_audit_logs` table, idempotency by svix-id
- **Action needed:** Audit pass -- verify all expected fields are captured, no gaps

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.17 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test && pnpm test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TST-01 | Cart race condition debounce | unit | `pnpm test src/lib/stores/__tests__/cart-store.test.ts` | Exists -- extend |
| TST-02 | Webhook failure/transition | unit | `pnpm test src/app/api/webhooks/stripe/__tests__/route.test.ts` | Exists -- extend |
| TST-03 | RLS multi-user edge cases | unit | `pnpm test src/lib/__tests__/rls-edge-cases.test.ts` | Wave 0 |
| TST-04 | Cutoff boundary + DST | unit | `pnpm test src/lib/utils/__tests__/delivery-dates.test.ts` | Exists -- extend |
| TST-05 | Refund rounding/ceiling | unit | `pnpm test src/lib/utils/__tests__/refund-calc.test.ts` | Wave 0 |
| OBS-07 | Timezone env var fallback | unit | `pnpm test src/lib/utils/__tests__/delivery-dates.test.ts` | Extend existing |
| TST-06 | Saturday dry run | integration | `npx tsx scripts/dry-run.ts` | Wave 0 |
| TST-07 | Load test 50 VUs | load | `k6 run scripts/load-test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/utils/__tests__/refund-calc.test.ts` -- covers TST-05
- [ ] `scripts/load-test.js` -- k6 script for TST-07
- [ ] `scripts/dry-run.ts` -- Saturday dry run for TST-06
- [ ] `scripts/launch-check.ts` -- launch validation for LAUNCH-01 to LAUNCH-11

## Open Questions

1. **Frontend error handler compatibility**
   - What we know: ~30 routes will change error format from `{ error: "string" }` to `{ error: { code, message } }`
   - What's unclear: How many client-side fetch handlers depend on the flat format? Need to audit `data.error` usage in client code.
   - Recommendation: Search for `\.error` access patterns in client-side fetch responses before migrating. May need to update error display logic in admin components.

2. **k6 authentication for load test**
   - What we know: Checkout endpoint requires Supabase auth. k6 needs a valid JWT.
   - What's unclear: Best way to get auth token for k6 VUs -- Supabase service role? Pre-generated user tokens?
   - Recommendation: Use a pre-created test user account. Generate token in k6 `setup()` function via Supabase auth API, share across VUs.

3. **Dry run script Stripe interaction**
   - What we know: Real checkout creates Stripe sessions. Dry run needs to simulate payment completion.
   - What's unclear: Whether to actually create Stripe sessions (test mode) or mock the webhook.
   - Recommendation: Create real Stripe checkout sessions in test mode, then simulate the `checkout.session.completed` webhook via direct API call to the webhook endpoint with a test signature. This tests the full flow without requiring a browser to complete payment.

## Sources

### Primary (HIGH confidence)
- Codebase audit: All API route files in `src/app/api/` -- direct file reads
- `src/types/delivery.ts:21` -- TIMEZONE constant location confirmed
- `src/lib/utils/delivery-dates.ts` -- all TIMEZONE consumers identified
- `src/components/ui/menu/MenuGrid.tsx:80` -- priority loading already wired
- `src/app/api/webhooks/stripe/route.ts` -- webhook handler with signature verification
- `src/app/api/webhooks/resend/route.ts` -- full audit logging confirmed
- `vitest.config.ts` -- test framework configuration
- `package.json` -- all dependency versions

### Secondary (MEDIUM confidence)
- k6 documentation: JavaScript API, scenarios, thresholds
- BetterStack free tier: 5 monitors, 3-minute intervals, email + SMS alerts

### Tertiary (LOW confidence)
- DST transition dates for 2026 (March 8 spring forward, November 1 fall back) -- need to verify exact dates

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in project or explicitly chosen by user
- Architecture: HIGH -- patterns derived from existing codebase audit
- Pitfalls: HIGH -- identified from direct code inspection and known DST/timezone issues
- Error audit: HIGH -- grep-verified route-by-route analysis
- Test mapping: HIGH -- existing test files inspected, extension points identified

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- no fast-moving dependencies)
