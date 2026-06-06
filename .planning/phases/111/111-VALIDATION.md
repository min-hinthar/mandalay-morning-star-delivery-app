---
phase: 111
slug: checkout-conversion
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-09
updated: 2026-04-12
---

# Phase 111 -- Validation Strategy

> Post-execution record of testing performed during checkout conversion phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test {path} --run` |
| **Full suite command** | `pnpm test --run` |
| **E2E framework** | Playwright (`playwright.config.ts`) |
| **Estimated runtime** | ~16s for full unit suite (954 tests / 62 files) |

---

## Sampling Rate

- **After every task commit:** Ran `pnpm test {path} --run` for files under change
- **After every plan wave:** Ran `pnpm test --run` (full unit suite)
- **Before verification:** Full suite green (954/954)
- **Max feedback latency:** ~16s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Command | Status |
|---------|------|------|-------------|-----------|---------|--------|
| 111-01-01 | 01 | 1 | CFIX-07 | unit | `pnpm test src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx --run` | verified |
| 111-01-02 | 01 | 1 | CHKP-04 | unit+typecheck | `pnpm typecheck` | verified |
| 111-01-03 | 01 | 1 | CHKP-04 | unit | `pnpm test src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx --run` | verified |
| 111-02-01 | 02 | 2 | CHKP-01 | typecheck+grep | `pnpm typecheck` | verified |
| 111-02-02 | 02 | 2 | CHKP-01 | unit | `pnpm test src/components/ui/checkout/__tests__/PaymentStepV8.test.tsx --run` | verified |
| 111-02-03 | 02 | 2 | CFIX-07 | unit | `pnpm test src/__tests__/checkout/form-persistence.test.tsx --run` | verified |
| 111-03-01 | 03 | 3 | CFIX-09 | unit+typecheck | `pnpm test src/lib/hooks --run && pnpm typecheck` | verified |
| 111-03-02 | 03 | 3 | CHKP-02 | unit | `pnpm test src/components/ui/checkout/__tests__/CheckoutErrorBanner.test.tsx --run` | verified |
| 111-03-03 | 03 | 3 | CHKP-02 | unit | `pnpm test src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx --run` | verified |
| 111-04-01 | 04 | 4 | CHKP-03 | unit | `pnpm test src/lib/hooks/__tests__/useAddresses.test.ts --run` | verified |
| 111-04-02 | 04 | 4 | CHKP-03 | unit+typecheck | `pnpm test src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx --run && pnpm typecheck` | verified |

*Status: verified = green at execution time*

---

## Wave 0 Requirements

No additional test infrastructure needed. Vitest + @testing-library/react pre-installed from Phase 110.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| Price change banner direction colors render correctly | CHKP-02 | Visual verification of warning/success banner colors | Open checkout with price-changed items; verify amber (up) and green (down) banners display correctly |
| Form state survives Stripe redirect round-trip | CFIX-07 | Requires live Stripe redirect + sessionStorage inspection | Complete checkout partially, get redirected to Stripe, return; verify form fields restored |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only
- [x] Sampling continuity: every plan has at least one automated test
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 25s (~16s full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** retroactive 2026-04-12

---

## Validation Audit 2026-04-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved (automated) | 0 |
| Manual-only (documented) | 2 |
| Tests added during phase | 22+ |
| Suite at phase end | 954 passing (62 files) |
| Run by | gsd-nyquist-auditor (retroactive) |
