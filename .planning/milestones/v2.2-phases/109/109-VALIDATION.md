---
phase: 109
slug: quality-maintenance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 109 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.17 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` (lifecycle) or `pnpm vitest run src/app/api/webhooks/stripe/__tests__/route.test.ts` (webhook)
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 109-01-01 | 01 | 1 | QUAL-01 | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | ❌ W0 | ⬜ pending |
| 109-01-02 | 01 | 1 | QUAL-01 | integration | `pnpm vitest run src/app/api/driver/routes/__tests__/lifecycle.test.ts` | ❌ W0 | ⬜ pending |
| 109-02-01 | 02 | 1 | QUAL-02 | typecheck+lint | `pnpm typecheck && pnpm lint` | N/A (structural) | ⬜ pending |
| 109-02-02 | 02 | 1 | QUAL-02 | regression | `pnpm vitest run src/app/api/webhooks/stripe/__tests__/route.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/driver/routes/__tests__/lifecycle.test.ts` — integration test file for QUAL-01 (entire file is new)
- [ ] Route/stop factories in `src/test/factories/index.ts` — shared test fixtures for lifecycle tests
- Framework install: None needed — Vitest 4.0.17 already installed and configured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All split files under 400 lines | QUAL-02 | ESLint max-lines warns but doesn't fail | Verify `/* eslint-disable max-lines */` removed and no lint warnings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
