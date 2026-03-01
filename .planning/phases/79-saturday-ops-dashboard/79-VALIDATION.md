---
phase: 79
slug: saturday-ops-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-01
---

# Phase 79 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react + jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- --run` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 79-01-01 | 01 | 1 | OPS-01 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "status counts"` | ❌ W0 | ⬜ pending |
| 79-01-02 | 01 | 1 | OPS-02 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "bulk transitions"` | ❌ W0 | ⬜ pending |
| 79-01-03 | 01 | 1 | OPS-03 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/useCountdown.test.ts` | ❌ W0 | ⬜ pending |
| 79-01-04 | 01 | 1 | OPS-04 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "unassigned"` | ❌ W0 | ⬜ pending |
| 79-01-05 | 01 | 1 | OPS-05 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "driver readiness"` | ❌ W0 | ⬜ pending |
| 79-01-06 | 01 | 1 | OPS-06 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "time window"` | ❌ W0 | ⬜ pending |
| 79-01-07 | 01 | 1 | OPS-07 | unit | `pnpm test -- src/components/ui/admin/ops/__tests__/helpers.test.ts -t "toast"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/admin/ops/__tests__/helpers.test.ts` — stubs for OPS-01, OPS-02, OPS-04, OPS-05, OPS-06, OPS-07
- [ ] `src/components/ui/admin/ops/__tests__/useCountdown.test.ts` — stubs for OPS-03, RULES-09

*Existing infrastructure covers framework install (Vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 5-second auto-refresh visual update | OPS-01 | Timing-dependent polling behavior | Open ops dashboard, verify status counts update within 5s of DB change |
| Bulk status change toast notification | OPS-07 | UI toast rendering | Select 3+ orders, bulk transition, verify toast appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
