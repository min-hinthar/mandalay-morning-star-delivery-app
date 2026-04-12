---
phase: 112
slug: order-tracking
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
updated: 2026-04-12
---

# Phase 112 -- Validation Strategy

> Post-execution record of testing performed during order tracking overhaul phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test {path} --run` |
| **Full suite command** | `pnpm test --run` |
| **E2E framework** | Playwright (`playwright.config.ts`) |
| **Estimated runtime** | ~16s for full unit suite |

---

## Sampling Rate

- **After every task commit:** Ran `pnpm test {path} --run` for files under change
- **After every plan wave:** Ran `pnpm test --run` (full unit suite)
- **Before verification:** Full suite green
- **Max feedback latency:** ~16s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Command | Status |
|---------|------|------|-------------|-----------|---------|--------|
| 112-01-01 | 01 | 1 | TRAK-01 | unit (TDD) | `pnpm test src/lib/utils/__tests__/backoff.test.ts --run` | verified |
| 112-01-02 | 01 | 1 | TRAK-01 | unit (TDD) | `pnpm test src/lib/hooks/__tests__/useTrackingSubscription.test.ts --run` | verified |
| 112-01-03 | 01 | 1 | TRAK-01, CFIX-10 | unit+typecheck | `pnpm test src/lib/hooks/__tests__/useTrackingSubscription.test.ts --run && pnpm typecheck` | verified |
| 112-02-01 | 02 | 2 | TRAK-03 | unit (TDD) | `pnpm test src/lib/hooks/__tests__/useMutePreference.test.ts --run` | verified |
| 112-02-02 | 02 | 2 | TRAK-02 | lint+typecheck | `pnpm lint && pnpm typecheck` | verified |
| 112-02-03 | 02 | 2 | TRAK-04 | lint+typecheck+build | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | verified |
| 112-02-04 | 02 | 2 | TRAK-02, TRAK-04 | manual | Mobile UX checkpoint (7 scenarios) | manual_only |

*Status: verified = green at execution time*

---

## Wave 0 Requirements

No additional test infrastructure needed. Vitest + @testing-library/react pre-installed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| Mobile bottom sheet peek bar + full drawer layout | TRAK-04 | Visual/touch UX requires real device testing | Open order tracking on mobile; verify peek bar visible, swipe up for full map, collapse works |
| Reconnecting banner 2s debounce (no flash on blips) | TRAK-02 | Network timing artifact requires throttled network | Throttle network briefly; verify banner only appears after sustained disconnect |
| Mute toggle persists across page reloads | TRAK-03 | localStorage persistence requires browser verification | Toggle mute, reload page; verify mute state preserved |
| Audio gated by !isMuted && !document.hidden | TRAK-03 | Audio playback requires browser with sound | Receive status update with mute off; verify audio plays. Toggle mute; verify silent |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only
- [x] Sampling continuity: every plan has at least one automated test
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 25s (~16s full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** retroactive 2026-04-12

---

## Validation Audit 2026-04-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved (automated) | 0 |
| Manual-only (documented) | 4 |
| Tests added during phase | 30+ (15 backoff + 16 subscription + 8 mute) |
| Suite at phase end | ~970 passing |
| Run by | gsd-nyquist-auditor (retroactive) |
