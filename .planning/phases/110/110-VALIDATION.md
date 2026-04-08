---
phase: 110
slug: critical-fixes-data-reliability
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-07
updated: 2026-04-07
---

# Phase 110 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test {path} --run` |
| **Full suite command** | `pnpm test --run` |
| **E2E framework** | Playwright (`playwright.config.ts`) |
| **Estimated runtime** | ~22s for full unit suite (915 tests / 57 files) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test {path} --run` for the file under change
- **After every plan wave:** Run `pnpm test --run` (full unit suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~22s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 110-01-01 | 01 | 1 | DATA-02 | T-110-03 | queryKeys factory returns `as const` tuples; zero auth tokens; namespace isolation | unit | `pnpm test src/lib/queryKeys.test.ts --run` | ✅ | ✅ green |
| 110-01-02 | 01 | 1 | CFIX-06 | T-110-01, T-110-02, T-110-04 | Queries retry 3x exp backoff on 5xx/429/0; mutations literal `retry: false`; 401/403/404/422 → false | unit | `pnpm test src/lib/providers/__tests__/query-provider.test.tsx --run` | ✅ | ✅ green |
| 110-02-01 | 02 | 2 | CFIX-01 | T-110-09 | Mobile cart `/cart` renders identical SSR/CSR markup with CSS-only `md:hidden`/`hidden md:block`; no useEffect; no useMediaQuery | manual | (visual timing — see Manual-Only) | ❌ | ⚠️ manual_only |
| 110-02-02 | 02 | 2 | CFIX-02 | T-110-08, T-110-10 | `CheckoutClient` renders `EmptyCheckoutError` synchronously when `isEmpty=true`; no spinner; no `router.replace`; not rendered when `isEmpty=false` | unit | `pnpm test "src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx" --run` | ✅ | ✅ green |
| 110-02-03 | 02 | 2 | CFIX-03 | T-110-07, T-110-11 | `PaymentStepV8` submit button has `disabled` attr when `cutoffModalOpen=true`; not disabled when `false` + `canProceed=true` | unit | `pnpm test src/components/ui/checkout/__tests__/PaymentStepV8.test.tsx --run` | ✅ | ✅ green |
| 110-03-01 | 03 | 3 | CFIX-04 | T-110-13, T-110-14, T-110-19, T-110-20 | Stripe fetch aborts after 10s; AbortError → `CHECKOUT_NETWORK_TIMEOUT`; toast `persistent: true` + `variant: "destructive"`; retry preserves order.id; double-click aborts stale controller; unmount cleanup | unit | `pnpm test src/components/ui/checkout/__tests__/usePaymentSubmit.test.ts --run` | ✅ | ✅ green |
| 110-03-02 | 03 | 3 | CFIX-05 | T-110-15, T-110-18, T-110-19 | `useCartValidation` 30s AbortController fires `setTimedOut(true)`; `proceedAnyway` resets state without re-fetch; unmount cleanup; status='error' surfaces via existing gates | unit | `pnpm test src/lib/hooks/__tests__/useCartValidation.test.ts --run` | ✅ | ✅ green |
| 110-03-03 | 03 | 3 | CFIX-04, CFIX-05 | T-110-14 | `useToast` `persistent: true` flag bypasses `addToRemoveQueue`; toasts never auto-dismiss | unit | `pnpm test src/lib/hooks/__tests__/useToast.test.ts --run` | ✅ | ✅ green |
| 110-03-04 | 03 | 3 | CFIX-04, CFIX-05 | — | `ClientErrorCodes` const enum identity + type derivation | unit | `pnpm test src/types/__tests__/errors.test.ts --run` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⚠️ manual_only*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Vitest 4.x + @testing-library/react + Playwright pre-installed; no fixture setup required for the unit gaps.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile cart `/cart` shows zero white flash on a real iPhone 12 viewport (390×844) during SSR→CSR hydration | CFIX-01 | Visual timing artifact — code-level CSS-only contract (`md:hidden` / `hidden md:block`, no useEffect, no useMediaQuery) is grep-verified in `110-VERIFICATION.md`, but the subjective "no flash" experience requires a browser with throttled CPU. | (1) Open `/cart` on iPhone 12 viewport with throttled CPU × 4. (2) Reload. (3) Confirm no blank white frame between SSR paint and hydration. (4) Open devtools console — confirm zero React hydration mismatch warnings. — See `110-HUMAN-UAT.md` test #1. |
| Empty cart `/checkout` direct-link shows error UI instantly | CFIX-02 | Render-time guard is unit-tested, but the subjective zero-spinner-frame experience needs human browser confirmation. | (1) Clear IDB. (2) Navigate directly to `/checkout`. (3) Confirm `EmptyCheckoutError` renders immediately, no spinner, no toast flash, no redirect loop. — See `110-HUMAN-UAT.md` test #2. |
| Cutoff modal disables submit + handler refuses keyboard Enter | CFIX-03 | HTML `disabled` attr + handler early-return are unit-tested (PaymentStepV8.test.tsx + usePaymentSubmit.test.ts), but keyboard `Enter` bypass on a focused form input requires browser-level keyboard testing. | (1) Open checkout with cutoff passed. (2) Confirm submit button is greyed-out. (3) Click submit — no `/api/checkout/session` request fires. (4) Focus a form input, press Enter — no request fires. — See `110-HUMAN-UAT.md` test #3. |
| Stripe 10s timeout shows persistent error + Try Again retries with same order.id | CFIX-04 | AbortController + persistent toast + retry are unit-tested (usePaymentSubmit.test.ts), but live network throttling + DB inspection of duplicate orders requires human verification. | (1) Throttle `/api/checkout/session` to >10s. (2) Submit checkout. (3) Confirm destructive toast appears and does NOT auto-dismiss. (4) Confirm `CheckoutErrorBanner` shows Try Again button. (5) Click Try Again — confirm same `order.id` reused (no duplicate in DB). — See `110-HUMAN-UAT.md` test #4. |
| Cart validation >30s shows `CartValidationTimeoutBanner` with Proceed Anyway in BOTH cart page and drawer | CFIX-05 | Hook timeout flip + `proceedAnyway` state reset are unit-tested (useCartValidation.test.ts), but live banner appearance in both surfaces requires human verification. | (1) Stall `/api/menu` to >30s. (2) Open cart page — confirm banner appears. (3) Open cart drawer — confirm banner appears. (4) Click Proceed Anyway — confirm banner dismisses and checkout button unblocks. — See `110-HUMAN-UAT.md` test #5. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are documented manual-only with browser test instructions
- [x] Sampling continuity: every plan has at least one automated test (no 3 consecutive tasks without automated verify)
- [x] Wave 0 covers all MISSING references (no Wave 0 needed — infrastructure pre-existing)
- [x] No watch-mode flags
- [x] Feedback latency < 25s (~22s full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-07

---

## Validation Audit 2026-04-07

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved (automated) | 3 |
| Manual-only (documented) | 1 |
| Escalated | 0 |
| Tests added | 15 |
| Test files added | 3 |
| Full suite | 900 → 915 passing |
| Run by | gsd-nyquist-auditor (sonnet) |
