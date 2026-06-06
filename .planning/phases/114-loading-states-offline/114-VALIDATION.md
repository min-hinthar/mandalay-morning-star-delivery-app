---
phase: 114
slug: loading-states-offline
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
updated: 2026-04-12
---

# Phase 114 -- Validation Strategy

> Post-execution record of testing performed during loading states and offline phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test {path} --run` |
| **Full suite command** | `pnpm test --run` |
| **E2E framework** | Playwright (`playwright.config.ts`) |
| **Estimated runtime** | ~18s for full unit suite (1025+ tests / 66 files) |

---

## Sampling Rate

- **After every task commit:** Ran `pnpm typecheck` for skeleton components, `pnpm test {path}` for test files
- **After every plan wave:** Ran `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (full suite)
- **Before verification:** Full suite green
- **Max feedback latency:** ~18s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Command | Status |
|---------|------|------|-------------|-----------|---------|--------|
| 114-01-01 | 01 | 1 | LOAD-01 | typecheck | `pnpm typecheck` | verified |
| 114-01-02 | 01 | 1 | LOAD-02 | typecheck | `pnpm typecheck` | verified |
| 114-01-03 | 01 | 1 | LOAD-03 | typecheck | `pnpm typecheck` | verified |
| 114-02-01 | 02 | 2 | LOAD-05 | grep+typecheck | `pnpm typecheck` | verified |
| 114-02-02 | 02 | 2 | LOAD-05 | grep+typecheck | `pnpm typecheck` | verified |
| 114-03-01 | 03 | 3 | LOAD-04 | unit | `pnpm test src/components/ui/menu/__tests__/useMenuCache.test.ts --run` | verified |
| 114-03-02 | 03 | 3 | CFIX-08 | unit | `pnpm test src/lib/stores/__tests__/cart-sync.test.ts --run` | verified |

*Status: verified = green at execution time*

---

## Wave 0 Requirements

No additional test infrastructure needed. Vitest pre-installed; idb-keyval already in deps for IDB testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| Content-shaped skeletons match loaded page structure | LOAD-01, LOAD-02, LOAD-03 | Visual layout fidelity requires browser rendering | Navigate to /orders, /orders/[id], /account with throttled network; verify skeletons mirror real page DOM |
| SkeletonCrossfade opacity transition smooth | LOAD-05 | CSS transition timing requires visual inspection | Load page with slow network; verify fade from skeleton to content has no jarring flash |
| Offline menu cache serves stale data with badge | LOAD-04 | Requires actual offline state in browser | Go offline in DevTools; navigate to /menu; verify cached data shown with stale indicator |
| Cart sync on reconnect validates prices | CFIX-08 | Network reconnect event + toast verification | Go offline, come back online; verify 30s toast if prices changed, items removed if unavailable |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only
- [x] Sampling continuity: every plan has at least one automated test
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 25s (~18s full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Known deviation:** CFIX-08 toast uses `duration: 30_000` instead of `persistent: true` (ToastOptions API gap).

**Approval:** retroactive 2026-04-12

---

## Validation Audit 2026-04-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved (automated) | 0 |
| Manual-only (documented) | 4 |
| Tests added during phase | 12+ (useMenuCache + cart-sync) |
| Suite at phase end | 1025+ passing (66 files) |
| Run by | gsd-nyquist-auditor (retroactive) |
