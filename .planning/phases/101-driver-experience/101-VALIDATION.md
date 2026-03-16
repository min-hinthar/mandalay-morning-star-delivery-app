---
phase: 101
slug: driver-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 101 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | vitest.config.ts (existing) |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 101-01-01 | 01 | 1 | DRV-01 | unit | `pnpm test -- src/lib/hooks/__tests__/useAcceptRoute.test.ts -x` | ❌ W0 | ⬜ pending |
| 101-01-02 | 01 | 1 | DRV-01 | unit | `pnpm test -- src/lib/hooks/__tests__/useDeclineRoute.test.ts -x` | ❌ W0 | ⬜ pending |
| 101-01-03 | 01 | 1 | DRV-01 | unit | `pnpm test -- src/lib/validations/__tests__/route.test.ts -x` | ❌ W0 | ⬜ pending |
| 101-02-01 | 02 | 2 | DRV-02 | manual-only | N/A — manual page-by-page check | N/A | ⬜ pending |
| 101-03-01 | 03 | 1 | DRV-03 | unit | `pnpm test -- src/lib/hooks/__tests__/useDriverReorderStops.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/hooks/__tests__/useAcceptRoute.test.ts` — stubs for DRV-01 (accept route)
- [ ] `src/lib/hooks/__tests__/useDeclineRoute.test.ts` — stubs for DRV-01 (decline route)
- [ ] `src/lib/validations/__tests__/route.test.ts` — stubs for DRV-01 (route status schema)
- [ ] `src/lib/hooks/__tests__/useDriverReorderStops.test.ts` — stubs for DRV-03 (reorder stops)

*Test patterns follow existing `useReorderStops.test.ts` and `useReassignDriver.test.ts` — mock `globalThis.fetch`, use `renderHook` + `act`, verify fetch calls and state transitions*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All driver pages load real data with no empty/stub content | DRV-02 | Visual verification of page content completeness | Navigate each driver page (dashboard, earnings, history, schedule, profile, active route) and confirm real data renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
