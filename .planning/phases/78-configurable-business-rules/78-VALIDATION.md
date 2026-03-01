---
phase: 78
slug: configurable-business-rules
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-01
---

# Phase 78 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.17 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 78-01-01 | 01 | 1 | RULES-07 | unit | `pnpm test -- src/lib/settings/__tests__/business-rules.test.ts` | Wave 0 | ⬜ pending |
| 78-01-02 | 01 | 1 | RULES-01 | unit | `pnpm test -- src/lib/settings/__tests__/business-rules.test.ts -t "cutoff"` | Wave 0 | ⬜ pending |
| 78-01-03 | 01 | 1 | RULES-02, RULES-03 | unit | `pnpm test -- src/lib/utils/__tests__/order.test.ts -t "delivery fee"` | Exists (update) | ⬜ pending |
| 78-01-04 | 01 | 1 | RULES-04 | unit | `pnpm test -- src/lib/settings/__tests__/generate-time-windows.test.ts` | Wave 0 | ⬜ pending |
| 78-01-05 | 01 | 1 | RULES-05 | unit | `pnpm test -- src/lib/settings/__tests__/business-rules.test.ts -t "radius"` | Wave 0 | ⬜ pending |
| 78-01-06 | 01 | 1 | RULES-10 | unit | `pnpm test -- src/app/api/admin/settings/__tests__/route.test.ts -t "revalidate"` | Wave 0 | ⬜ pending |
| 78-02-01 | 02 | 1 | RULES-06 | manual-only | Manual: navigate to admin settings, edit each field, save | N/A | ⬜ pending |
| 78-03-01 | 03 | 2 | RULES-08 | manual-only | Manual: change fee in admin, refresh customer page, verify | N/A | ⬜ pending |
| 78-03-02 | 03 | 2 | RULES-09 | manual-only | Manual: change cutoff, verify ops countdown updates | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/settings/__tests__/business-rules.test.ts` — stubs for RULES-01, RULES-05, RULES-07
- [ ] `src/lib/settings/__tests__/generate-time-windows.test.ts` — stubs for RULES-04
- [ ] Update `src/lib/utils/__tests__/order.test.ts` — parameterized `calculateDeliveryFee` tests for RULES-02, RULES-03
- [ ] Update `src/lib/utils/__tests__/delivery-dates.test.ts` — parameterized cutoff functions
- [ ] Update `src/lib/stores/__tests__/cart-store.test.ts` — mock or inject settings values

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin form edits all values | RULES-06 | UI interaction test | Navigate to admin settings, edit each field, save, verify persistence |
| Customer pages display dynamic values | RULES-08 | E2E cross-page flow | Change fee in admin, refresh customer page, verify display updates |
| Ops dashboard uses configured times | RULES-09 | E2E cross-page flow | Change cutoff in admin, verify ops countdown updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
