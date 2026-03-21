---
phase: 108
slug: rate-limiting-restoration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 108 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (installed, configured in `vitest.config.ts`) |
| **Config file** | `vitest.config.ts` (jsdom environment, `@` alias, globals: true) |
| **Quick run command** | `pnpm test -- --run src/lib/rate-limit` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run src/lib/rate-limit`
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| INFRA-01a | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01b | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01c | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01d | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01e | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01f | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01g | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01h | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/identifiers.test.ts` | ❌ W0 | ⬜ pending |
| INFRA-01i | 01 | 1 | INFRA-01 | unit | `pnpm test -- --run src/lib/rate-limit/__tests__/check.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/rate-limit/__tests__/check.test.ts` — stubs for INFRA-01a through INFRA-01g, INFRA-01i
- [ ] `src/lib/rate-limit/__tests__/identifiers.test.ts` — stubs for INFRA-01h

*Existing infrastructure covers framework setup. Only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upstash REST Redis provisioned | INFRA-01 | Requires Vercel Dashboard access | Verify via Vercel Dashboard -> Storage -> check database exists |
| Env vars set in Vercel | INFRA-01 | Requires Vercel Dashboard access | Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in project env vars |
| 429 with Retry-After in production | INFRA-01 | Requires live Redis + real traffic | Hit rate-limited endpoint repeatedly, verify 429 response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
