---
phase: 95
slug: observability-performance-testing-launch-prep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-03
---

# Phase 95 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.17 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 95-01-01 | 01 | 1 | OBS-07 | unit | `pnpm test src/lib/utils/__tests__/delivery-dates.test.ts` | Extend existing | pending |
| 95-01-02 | 01 | 1 | OBS-05, OBS-02 | manual | `pnpm typecheck` + verify webhook logging | existing | pending |
| 95-02-01 | 02 | 1 | OBS-01 | unit | `pnpm typecheck` | New file | pending |
| 95-02-02 | 02 | 1 | OBS-01 | unit | `pnpm typecheck` | Modify 9 routes | pending |
| 95-03-01 | 03 | 1 | OBS-01 | unit | `pnpm typecheck` | Modify 6 routes | pending |
| 95-03-02 | 03 | 1 | OBS-01 | unit | `pnpm typecheck` | Modify 5 routes | pending |
| 95-04-01 | 04 | 2 | OBS-01 | unit | `pnpm typecheck` | Modify 4 pages | pending |
| 95-04-02 | 04 | 2 | OBS-01 | unit | `pnpm typecheck && pnpm build` | Modify 6 components | pending |
| 95-05-01 | 05 | 1 | TST-01, TST-04 | unit | `pnpm test src/lib/stores/__tests__/cart-store.test.ts src/lib/utils/__tests__/delivery-dates.test.ts` | Extend existing | pending |
| 95-05-02 | 05 | 1 | TST-05 | unit | `pnpm test src/lib/utils/__tests__/refund-calc.test.ts` | Wave 0 | pending |
| 95-06-01 | 06 | 1 | TST-02 | unit | `pnpm test src/app/api/webhooks/stripe/__tests__/route.test.ts` | Extend existing | pending |
| 95-06-02 | 06 | 1 | TST-03 | unit | `pnpm test src/lib/__tests__/rls-edge-cases.test.ts` | Wave 0 | pending |
| 95-07-01 | 07 | 1 | TST-06 | integration | `pnpm typecheck` | Wave 0 | pending |
| 95-07-02 | 07 | 1 | TST-07 | load | `pnpm typecheck` | Wave 0 | pending |
| 95-08-01 | 08 | 2 | LAUNCH-01..11, OBS-03, OBS-04 | integration | `pnpm typecheck && pnpm launch:check \|\| true` | Wave 0 | pending |
| 95-08-02 | 08 | 2 | OBS-06 | integration | `pnpm build` | existing | pending |
| 95-08-03 | 08 | 2 | - | checkpoint | Manual review | N/A | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/utils/__tests__/refund-calc.test.ts` -- stubs for TST-05
- [ ] `src/lib/__tests__/rls-edge-cases.test.ts` -- stubs for TST-03
- [ ] `scripts/load-test.js` -- k6 script stub for TST-07
- [ ] `scripts/dry-run.ts` -- Saturday dry run stub for TST-06
- [ ] `scripts/launch-check.ts` -- launch validation for LAUNCH-01..11

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BetterStack uptime alerts | OBS-03 | External SaaS config | Configure BetterStack monitor for /api/health?deep=true, verify email/SMS on 503 |
| Supabase Pro daily backups | OBS-04 | Infrastructure provisioning | Upgrade to Pro plan, verify daily backup in dashboard |
| Admin trained on ops dashboard | LAUNCH-09 | Human training | Walk through checklist steps in LAUNCH_CHECKLIST.md |
| Driver test deliveries | LAUNCH-10 | Human testing | Driver completes test delivery per checklist walkthrough |
| Mobile testing (iOS/Android/PWA) | LAUNCH-08 | Device-specific | Test on actual iOS Safari, Android Chrome, PWA install |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
