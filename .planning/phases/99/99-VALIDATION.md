---
phase: 99
slug: foundation-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 99 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + Vitest (unit) |
| **Config file** | `playwright.config.ts` + `vitest.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm test` |
| **Full suite command** | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm test`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 99-01-01 | 01 | 1 | FOUND-01 | E2E | `pnpm test:e2e -- e2e/auth-redirect.spec.ts` | ❌ W0 | ⬜ pending |
| 99-01-02 | 01 | 1 | FOUND-01 | E2E | `pnpm test:e2e -- e2e/auth-redirect.spec.ts` | ❌ W0 | ⬜ pending |
| 99-02-01 | 02 | 1 | FOUND-02, FOUND-03, FOUND-04 | unit | `pnpm test -- OrderDetailPanel` | ❌ W0 | ⬜ pending |
| 99-02-02 | 02 | 1 | FOUND-05 | unit | `pnpm test -- DeliveryNotes` | ❌ W0 | ⬜ pending |
| 99-02-03 | 02 | 1 | FOUND-06 | unit | `pnpm test -- RouteStopCard` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/auth-redirect.spec.ts` — E2E tests for 4 auth flows with role-based redirect assertions
- [ ] Unit tests for OrderDetailPanel component (delivery info, contact display)
- [ ] Unit test for driver notes save API (delivery_notes update + .select("id") verification)
- [ ] Unit test for RouteStopCard timestamp rendering (show when populated, hide when null)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OAuth redirect works in production | FOUND-01 | Real OAuth requires browser interaction | 1. Login via Google OAuth as admin 2. Verify landing on /admin 3. Repeat for driver role |
| Click-to-call/SMS on mobile | FOUND-04 | Device hardware required | 1. Open order detail on mobile 2. Tap phone number 3. Verify tel: link opens dialer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
