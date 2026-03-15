---
phase: 100
slug: admin-route-editing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 100 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test:ci` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test:ci`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 100-01-01 | 01 | 1 | ROUTE-01 | unit | `pnpm vitest run src/lib/hooks/__tests__/useReorderStops.test.ts -x` | ❌ W0 | ⬜ pending |
| 100-01-02 | 01 | 1 | ROUTE-02 | unit | `pnpm vitest run src/lib/hooks/__tests__/useReorderStops.test.ts -x` | ❌ W0 | ⬜ pending |
| 100-02-01 | 02 | 1 | ROUTE-03 | unit | `pnpm vitest run src/lib/hooks/__tests__/useSplitRoute.test.ts -x` | ❌ W0 | ⬜ pending |
| 100-02-02 | 02 | 1 | ROUTE-04 | unit | `pnpm vitest run src/lib/hooks/__tests__/useMergeRoutes.test.ts -x` | ❌ W0 | ⬜ pending |
| 100-02-03 | 02 | 1 | ROUTE-05 | unit | `pnpm vitest run src/lib/hooks/__tests__/useReassignDriver.test.ts -x` | ❌ W0 | ⬜ pending |
| 100-xx-xx | all | 1 | ALL | unit | `pnpm vitest run src/lib/validations/__tests__/route.test.ts -x` | ✅ extend | ⬜ pending |
| 100-xx-xx | all | 1 | ROUTE-03 | unit | `pnpm vitest run src/components/ui/admin/routes/__tests__/route-selection.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/hooks/__tests__/useReorderStops.test.ts` — stubs for ROUTE-01, ROUTE-02
- [ ] `src/lib/hooks/__tests__/useSplitRoute.test.ts` — stubs for ROUTE-03
- [ ] `src/lib/hooks/__tests__/useMergeRoutes.test.ts` — stubs for ROUTE-04
- [ ] `src/lib/hooks/__tests__/useReassignDriver.test.ts` — stubs for ROUTE-05
- [ ] `src/components/ui/admin/routes/__tests__/route-selection.test.ts` — selection logic stubs

*Existing infrastructure: Vitest configured, route validation tests exist.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop visual interaction | ROUTE-01 | Drag interactions fragile in headless browser | Manually drag stop card, verify ghost overlay + position change |
| Mobile move button touch targets | ROUTE-02 | 44px touch target validation needs device | Inspect element dimensions on mobile viewport |
| DragOverlay positioning in scrolled container | ROUTE-01 | Scroll + overlay position bugs are visual | Scroll stops list, drag from bottom, verify overlay follows cursor |

*All mutation/validation logic has automated verification via hooks tests.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
