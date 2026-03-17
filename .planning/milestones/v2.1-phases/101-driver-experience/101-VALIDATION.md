---
phase: 101
slug: driver-experience
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| 101-01-01 | 01 | 1 | DRV-01 | structural | `grep -c "ADD VALUE IF NOT EXISTS" supabase/migrations/20260316_route_status_enum_extend.sql` | N/A (new) | pending |
| 101-01-02 | 01 | 1 | DRV-01 | typecheck | `pnpm typecheck` | existing | pending |
| 101-02-01 | 02 | 2 | DRV-01 | typecheck | `pnpm typecheck` | N/A (new) | pending |
| 101-02-02 | 02 | 2 | DRV-01 | unit | `pnpm test -- src/lib/hooks/__tests__/useAcceptRoute.test.ts src/lib/hooks/__tests__/useDeclineRoute.test.ts src/lib/hooks/__tests__/useDriverReorderStops.test.ts -x` | W0 (created in task) | pending |
| 101-03-01 | 03 | 2 | DRV-02 | structural | `grep -rn '"planned", "in_progress"' src/app/\(driver\) src/app/api/driver src/app/api/admin/drivers 2>/dev/null \| wc -l` | existing | pending |
| 101-03b-01 | 03b | 3 | DRV-01 | typecheck+lint | `pnpm typecheck && pnpm lint` | existing | pending |
| 101-04-01 | 04 | 4 | DRV-01 | typecheck+lint | `pnpm typecheck && pnpm lint` | N/A (new) | pending |
| 101-04-02 | 04 | 4 | DRV-03 | build | `pnpm typecheck && pnpm build && test ! -f src/components/ui/driver/LocationTracker.tsx` | existing | pending |
| 101-05-01 | 05 | 5 | DRV-02 | full-suite | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` | existing | pending |
| 101-05-02 | 05 | 5 | DRV-02 | manual | N/A -- human checkpoint page audit | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Wave 0 test scaffolds are created inline by Plan 02 Task 2 (TDD: tests written FIRST, then hooks implemented). No separate Wave 0 plan needed.

- Plan 02 Task 2 creates:
  - `src/lib/hooks/__tests__/useAcceptRoute.test.ts` -- DRV-01 (accept route hook)
  - `src/lib/hooks/__tests__/useDeclineRoute.test.ts` -- DRV-01 (decline route hook)
  - `src/lib/hooks/__tests__/useDriverReorderStops.test.ts` -- DRV-03 (reorder stops hook)

*Test patterns follow existing `useReorderStops.test.ts` and `useReassignDriver.test.ts` -- mock `globalThis.fetch`, use `renderHook` + `act`, verify fetch calls and state transitions*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All driver pages load real data with no empty/stub content | DRV-02 | Visual verification of page content completeness | Navigate each driver page (dashboard, earnings, history, schedule, profile, active route) and confirm real data renders |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
