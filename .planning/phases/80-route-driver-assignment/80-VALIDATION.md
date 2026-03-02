---
phase: 80
slug: route-driver-assignment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-01
---

# Phase 80 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + jsdom |
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
| 80-01-01 | 01 | 1 | ROUTE-01 | unit | `pnpm test -- --run src/lib/utils/__tests__/clustering.test.ts` | ❌ W0 | ⬜ pending |
| 80-01-02 | 01 | 1 | ROUTE-04 | unit | `pnpm test -- --run src/lib/utils/__tests__/clustering.test.ts` | ❌ W0 | ⬜ pending |
| 80-01-03 | 01 | 1 | ROUTE-05 | unit | `pnpm test -- --run src/lib/utils/__tests__/clustering.test.ts` | ❌ W0 | ⬜ pending |
| 80-02-01 | 02 | 1 | ROUTE-03 | unit | `pnpm test -- --run src/lib/validations/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 80-02-02 | 02 | 1 | ROUTE-06 | unit | `pnpm test -- --run src/lib/validations/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 80-03-01 | 03 | 2 | ROUTE-02 | unit | `pnpm test -- --run src/components/ui/admin/ops/__tests__/helpers.test.ts` | ✅ | ⬜ pending |
| 80-04-01 | 04 | 3 | ROUTE-07 | manual | Manual verification -- ownership enforcement already implemented | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/utils/__tests__/clustering.test.ts` — stubs for ROUTE-01, ROUTE-04, ROUTE-05 (clustering, distance, duration)
- [ ] `src/lib/validations/__tests__/route.test.ts` — stubs for ROUTE-03, ROUTE-06 (creation validation, reassignment schema)
- [ ] `pnpm add leaflet react-leaflet @types/leaflet` — new packages per user decision

*Framework already installed (Vitest 3.x).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Driver ownership enforcement | ROUTE-07 | Already implemented in 6+ API endpoints + RLS policies; audit verification only | 1. Authenticate as driver A, 2. Request route belonging to driver B, 3. Verify 403 response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
