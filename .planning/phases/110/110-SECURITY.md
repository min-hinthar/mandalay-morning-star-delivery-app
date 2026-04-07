---
phase: 110
slug: critical-fixes-data-reliability
status: verified
threats_open: 0
threats_closed: 20
asvs_level: 1
created: 2026-04-06
updated: 2026-04-07
---

# Phase 110 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Block On:** high, critical
**Audited:** 2026-04-06
**Status:** SECURED — 20/20 threats closed

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Next.js API | Authenticated customer session calling `/api/checkout/session` | Cart payload, idempotency key, auth cookie |
| Next.js API → Stripe | Server creates Stripe Checkout session via SDK | Order amount, idempotency key, customer email |
| Browser → Next.js API (cart) | Cart validation refetch via `useCartValidation` | Cart item IDs, quantities |
| React Query Client → Browser | Cached query data, retry policy | Resource IDs only — no auth tokens |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-110-01 | DoS | query-provider.tsx | mitigate | `QUERY_RETRY_ATTEMPTS=3`, `RETRY_BACKOFF_MAX_MS=30000` (line 20-22); 4xx filtered by predicate (line 35) | closed |
| T-110-02 | Tampering | query-provider.tsx | mitigate | Literal `mutations: { retry: false }` (line 56-58); test assertion `expect(opts.mutations?.retry).toBe(false)` (test:81) | closed |
| T-110-03 | Information Disclosure | queryKeys.ts | mitigate | Factory contains only resource IDs (`menu`, `addresses`, `orders`) and user inputs (line 12-29); zero auth tokens; `as const` typed | closed |
| T-110-04 | Repudiation | query-provider.tsx | mitigate | `shouldRetryQuery` returns `status >= 500 \|\| status === 429 \|\| status === 0` (line 35); 401/403/404/422 → false; test matrix at test:18-26 | closed |
| T-110-05 | DoS | query-provider.tsx | accept | Up to 12 requests per customer over 16s during sustained 5xx; low traffic (1–5 concurrent), 30s cap, Sentry monitors | closed |
| T-110-06 | Spoofing | RetryableError type | accept | `RetryableError.status?: number` trusts error shape; all current hooks throw `Error(string)` → status undefined → 0 → retried as network | closed |
| T-110-07 | Tampering | PaymentStepV8.tsx + usePaymentSubmit.ts + route.ts | mitigate | HTML disabled (PaymentStepV8.tsx:309) + handler early-return (usePaymentSubmit.ts:111) + server `checkoutLimiter` + CUTOFF_PASSED (route.ts:119) | closed |
| T-110-08 | Elevation of Privilege | CheckoutClient.tsx | mitigate | Synchronous render-time guard `if (isEmpty) return <EmptyCheckoutError />` (line 172-174); no useEffect, no race window | closed |
| T-110-09 | DoS | cart/page.tsx | accept | CSS-only `md:hidden`/`hidden md:block` renders identical SSR/CSR; eliminates JS-gated render and 100ms null window; no server load | closed |
| T-110-10 | Information Disclosure | EmptyCheckoutError.tsx | accept | Renders to authenticated user viewing own cart; no cross-user disclosure; no PII or order history exposed | closed |
| T-110-11 | Repudiation | route.ts + usePaymentSubmit.ts | mitigate | Server CUTOFF_PASSED enforced (route.ts:119, 392-406); client guard (usePaymentSubmit.ts:111) is defense in depth; server is authoritative | closed |
| T-110-12 | DoS | EmptyCheckoutError.tsx | accept | `/menu` is public route with own rate limiting; "Browse Menu" link is normal navigation, not API call | closed |
| T-110-13 | Tampering | usePaymentSubmit.ts + CheckoutErrorBanner.tsx | mitigate | `onRetry={handleCheckout}` re-invokes full handler (banner:159-166); fetches `/api/checkout/session` (usePaymentSubmit.ts:133); idempotency key `checkout_${order.id}` stable across retries (route.ts:406) | closed |
| T-110-14 | Repudiation | useToast.ts + usePaymentSubmit.ts | mitigate | `toast({ persistent: true, variant: "destructive" })` (usePaymentSubmit.ts:220-226); `if (!options.persistent) { addToRemoveQueue }` (useToast.ts:110-112) bypasses removal | closed |
| T-110-15 | DoS | useCartValidation.ts | mitigate | `proceedAnyway = useCallback(() => { setTimedOut(false); }, [])` (line 183-185) — local state only, no fetch; server `fetchAndValidateCart` (route.ts:119) authoritative | closed |
| T-110-16 | DoS | useToast.ts | accept | `TOAST_LIMIT = 5` (line 3); each toast has dismiss control; no amplification mechanism | closed |
| T-110-17 | Information Disclosure | usePaymentSubmit.ts | accept | Message at line 217-218 contains no Stripe internals, no status codes, no API URLs | closed |
| T-110-18 | Tampering | useCartValidation.ts | mitigate | `proceedAnyway` calls `setTimedOut(false)` only (line 183-185); no fetch; server-side `fetchAndValidateCart` (route.ts:119) authoritative; sold-out items hit `ITEM_UNAVAILABLE` from server | closed |
| T-110-19 | DoS | useCartValidation.ts + usePaymentSubmit.ts | mitigate | Cleanup useEffects with `[]` deps (useCartValidation.ts:227-236, usePaymentSubmit.ts:70-81) clear timeout refs and abort controllers | closed |
| T-110-20 | DoS | usePaymentSubmit.ts | mitigate | Single `setTimeout` (line 128-130) fires once per click; no loop, no auto-retry; explicit user click required for retry; `checkoutLimiter` (3/1m) is final server defense | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-110-01 | T-110-05 | Retry amplification during sustained 5xx outage — low traffic app (1–5 concurrent users); 3 retry cap + 30s backoff ceiling; Sentry surfaces spikes | gsd-security-auditor | 2026-04-06 |
| R-110-02 | T-110-06 | `RetryableError.status` trusts error shape — all current hooks throw `Error(string)` → status=0 → retried as network; no third-party fetch wrappers in scope | gsd-security-auditor | 2026-04-06 |
| R-110-03 | T-110-09 | No explicit DoS mitigation for cart page render — CSS-only approach eliminates failure mode entirely; `/cart` is static layout | gsd-security-auditor | 2026-04-06 |
| R-110-04 | T-110-10 | EmptyCheckoutError reveals cart is empty — authenticated-only route; own-data disclosure; no PII or order history | gsd-security-auditor | 2026-04-06 |
| R-110-05 | T-110-12 | `/menu` link from EmptyCheckoutError — `/menu` has own rate limiting; link is normal navigation | gsd-security-auditor | 2026-04-06 |
| R-110-06 | T-110-16 | Persistent toast accumulation — `TOAST_LIMIT=5` enforced; dismiss control on every toast | gsd-security-auditor | 2026-04-06 |
| R-110-07 | T-110-17 | `CHECKOUT_NETWORK_TIMEOUT` user-facing message — reviewed; no internal error details, no API endpoints, no Stripe error codes | gsd-security-auditor | 2026-04-06 |

---

## Verification Evidence

Mitigations verified by direct file reads against implementation. Key checkpoints:

- `mutations: { retry: false }` — query-provider.tsx:57 (literal), test:81
- `shouldRetryQuery` returns false for 401/403/404/422 — query-provider.tsx:35, test matrix:18-26
- `cutoffModalOpen` submit gate — PaymentStepV8.tsx:309 (HTML disabled), usePaymentSubmit.ts:111 (handler guard), CheckoutClient.tsx:269 (prop wiring)
- Empty checkout guard — CheckoutClient.tsx:172-174, synchronous, no useEffect
- Retry via handleCheckout only — CheckoutErrorBanner.tsx:159-166 `onRetry={handleCheckout}`, fetch at usePaymentSubmit.ts:133
- Persistent toast — usePaymentSubmit.ts:225, gated at useToast.ts:110-112
- `proceedAnyway` is client-only — useCartValidation.ts:183-185, no fetch/API call
- AbortController cleanup — useCartValidation.ts:227-236 (`[]` deps), usePaymentSubmit.ts:70-81 (`[]` deps)
- No auto-retry loop — usePaymentSubmit.ts:128-130 single setTimeout, no loop

---

## Unregistered Threat Flags

110-03-SUMMARY.md `## Threat Flags` section: "No new security-relevant surface introduced." No unregistered flags to log.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-06 | 20 | 20 | 0 | gsd-security-auditor (sonnet, ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-06
