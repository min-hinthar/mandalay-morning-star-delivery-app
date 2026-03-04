---
phase: 97
slug: verification-traceability-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-04
---

# Phase 97 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test` (no-regression check)
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 97-01-01 | 01 | 1 | BUG-01..07 | manual | `test -f .planning/phases/89-critical-bug-fixes/89-VERIFICATION.md` | ✅ | ⬜ pending |
| 97-01-02 | 01 | 1 | MENU-01..07, ADMIN-02 | manual | `test -f .planning/phases/90-menu-photo-pipeline/90-VERIFICATION.md` | ✅ | ⬜ pending |
| 97-02-01 | 02 | 1 | BUG-01..07, MENU-01..07, ADMIN-02 | manual | `grep -c '\[x\]' .planning/REQUIREMENTS.md` | ✅ | ⬜ pending |
| 97-02-02 | 02 | 1 | — | manual | `grep 'v2.0' .planning/ROADMAP.md \| wc -l` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase produces only documentation files (.md) — no new test stubs needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| VERIFICATION.md per-requirement evidence accuracy | BUG-01..07 | Evidence requires human review of code references | Spot-check 3 requirements: verify file:line references match actual code |
| VERIFICATION.md per-requirement evidence accuracy | MENU-01..07, ADMIN-02 | Evidence requires human review of code references | Spot-check 3 requirements: verify file:line references match actual code |
| REQUIREMENTS.md checkbox accuracy | All 15 | Checkbox should only be checked if code truly implements it | Compare checked boxes against VERIFICATION.md evidence |
| ROADMAP.md formatting consistency | — | Visual formatting check | Verify all phase rows have v2.0 milestone column, no trailing `- \|` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-04
