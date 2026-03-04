---
phase: 96
slug: integration-wiring-dead-code
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-04
---

# Phase 96 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm test` |
| **Full suite command** | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm test`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 96-01-01 | 01 | 1 | CHKT-06, CHKT-07, CHKT-08 | typecheck | `pnpm typecheck` | N/A (type additions) | ⬜ pending |
| 96-01-02 | 01 | 1 | CHKT-06, CHKT-07, CHKT-08 | manual | Server component — browser verification | N/A | ⬜ pending |
| 96-02-01 | 02 | 1 | CUX-11 | typecheck + unit | `pnpm typecheck && pnpm test` | Existing cart-store tests | ⬜ pending |
| 96-03-01 | 03 | 1 | CHKT-02 | typecheck | `pnpm typecheck` (compilation verifies removal) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `pnpm typecheck` verifies type additions and dead code removal
- Existing cart-store tests verify store integrity after changes
- Order detail page is a server component — not unit-testable; typecheck confirms type correctness

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tip displays on order detail | CHKT-07 | Server component, not unit-testable | Place order with tip, navigate to order detail, verify tip row shows |
| Promo code + discount displays | CHKT-06 | Server component, not unit-testable | Place order with promo, navigate to order detail, verify "Discount (CODE)" row |
| Delivery instructions display | CHKT-08 | Server component, not unit-testable | Place order with instructions, navigate to order detail, verify in address card |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
