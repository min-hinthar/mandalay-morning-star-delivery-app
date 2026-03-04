---
phase: 98
slug: delivery-photo-signed-urls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 98 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | vitest.config.ts |
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
| 98-01-01 | 01 | 1 | DRV-03 | unit | `pnpm test -- src/lib/supabase/__tests__/delivery-photos.test.ts -x` | ❌ W0 | ⬜ pending |
| 98-01-02 | 01 | 1 | DRV-03 | unit | Same file | ❌ W0 | ⬜ pending |
| 98-01-03 | 01 | 1 | DRV-03 | unit | Same file | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/supabase/__tests__/delivery-photos.test.ts` — stubs for DRV-03 (path extraction, null handling, legacy URL backward compat)
- [ ] `src/lib/supabase/delivery-photos.ts` — new server-only module for signed URL helper

*Existing infrastructure covers test framework — only new test/module files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin sees delivery photo in order detail | DRV-03 | Requires Supabase Storage bucket + browser rendering | Upload photo via driver flow, open admin order detail, verify image renders |
| Customer sees delivery photo on tracking page | DRV-03 | Requires live Supabase + browser | Complete delivery with photo, check tracking page as customer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
