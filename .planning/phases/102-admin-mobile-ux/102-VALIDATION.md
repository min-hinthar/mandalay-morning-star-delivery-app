---
phase: 102
slug: admin-mobile-ux
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-16
---

# Phase 102 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (unit) + Playwright (E2E) |
| **Config file** | `vitest.config.ts` (unit), `playwright.config.ts` (E2E) |
| **Quick run command** | `pnpm lint && pnpm typecheck && pnpm test` |
| **Full suite command** | `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` |
| **Estimated runtime** | ~45 seconds (quick), ~90 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm lint && pnpm typecheck && pnpm test`
- **After every plan wave:** Run `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 102-01-* | 01 | 1 | MOBL-01 | E2E | `pnpm test:e2e -- --grep "admin drawer"` | ❌ W0 | ⬜ pending |
| 102-01-* | 01 | 1 | MOBL-01 | unit | `pnpm test -- AdminMobileHeader` | ❌ W0 | ⬜ pending |
| 102-02-* | 02 | 2 | MOBL-02 | E2E | `pnpm test:e2e -- --grep "admin tables responsive"` | ❌ W0 | ⬜ pending |
| 102-03-* | 03 | 2 | MOBL-03 | E2E | `pnpm test:e2e -- --grep "touch targets"` | ❌ W0 | ⬜ pending |
| 102-04-* | 04 | 3 | MOBL-04 | unit | `pnpm test -- useRouteProgressPolling` | ❌ W0 | ⬜ pending |
| 102-04-* | 04 | 3 | MOBL-04 | unit | `pnpm test -- routes-progress` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `e2e/admin-mobile.spec.ts` — stubs for MOBL-01, MOBL-02, MOBL-03 (viewport resize, drawer, card layouts, touch targets)
- [x] `src/components/ui/admin/__tests__/AdminMobileHeader.test.ts` — MOBL-01 page title derivation
- [x] `src/components/ui/admin/ops/__tests__/useRouteProgressPolling.test.ts` — MOBL-04 polling hook
- [x] `src/app/api/admin/ops/routes-progress/__tests__/route.test.ts` — MOBL-04 API endpoint

*CSS `hidden md:` patterns are NOT unit-testable (JSDOM has no layout engine). Responsive visibility assertions require Playwright E2E with viewport manipulation. Touch target size assertions require Playwright `boundingBox()`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drawer swipe-to-close feels natural | MOBL-01 | Haptic/UX quality not automatable | Open drawer on real phone, tap backdrop, verify close |
| Touch targets feel right during kitchen ops | MOBL-03 | Ergonomic assessment needs human | Tap all admin actions with thumb, verify no misses |
| Route progress widget data freshness | MOBL-04 | Requires real driver activity | Start route, deliver stops, verify widget updates within 5s |
| Safe-area-inset renders correctly on notched phones | MOBL-01 | CSS env() not available in JSDOM/Playwright | Test on real iPhone with notch |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (Phase 103 gap closure)
