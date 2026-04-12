---
phase: 117-integration-asset-fixes
plan: 01
subsystem: checkout-toast
tags: [toast, checkout, dead-code-removal, cfix-04]
dependency_graph:
  requires: []
  provides: [persistent-toast-v8, useToastV8-wiring]
  affects: [checkout-timeout-ux]
tech_stack:
  added: []
  patterns: [duration-0-persistent-toast, guard-clause-timer-skip]
key_files:
  created: []
  modified:
    - src/lib/hooks/useToastV8.ts
    - src/components/ui/checkout/usePaymentSubmit.ts
    - src/components/ui/checkout/__tests__/usePaymentSubmit.test.ts
    - src/lib/hooks/__tests__/useToastV8.test.ts
    - src/lib/hooks/index.ts
  deleted:
    - src/lib/hooks/useToast.ts
    - src/lib/hooks/__tests__/useToast.test.ts
decisions:
  - "Guard clause uses `duration > 0 && isFinite(duration)` to skip addToRemoveQueue"
  - "Legacy useToast module deleted entirely (not deprecated) -- zero consumers remain"
metrics:
  duration: 12min
  completed: 2026-04-11
  tasks: 2
  files: 7
---

# Phase 117 Plan 01: Toast Wiring Fix + Persistent Toast Guard Summary

Wire usePaymentSubmit to useToastV8 with duration:0 persistent toast support, delete dead legacy useToast module.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 (TDD) | Patch V8 guard clause + swap import + transform toast call | c42d0ffe (RED), d2c98ac9 (GREEN) | useToastV8.ts, usePaymentSubmit.ts, useToastV8.test.ts |
| 2 | Update tests + delete legacy useToast + clean barrel | f5c1dd88 | usePaymentSubmit.test.ts, useToast.ts (deleted), useToast.test.ts (deleted), index.ts |

## Implementation Details

**Guard clause (useToastV8.ts):** Added `if (duration > 0 && isFinite(duration))` before `addToRemoveQueue(id, duration)`. Prevents `setTimeout(fn, 0)` from firing immediately and removing persistent toasts. Also guards against `Infinity` overflow (T-117-01 threat mitigation).

**Import swap (usePaymentSubmit.ts):** Changed `import { toast } from "@/lib/hooks/useToast"` to `useToastV8`. Transformed toast call from `{ title, description, variant, persistent }` to `{ message, type, duration: 0 }`.

**Legacy removal:** Deleted `useToast.ts` (139 lines) and its test file (68 lines). Removed barrel export from `hooks/index.ts`. Grep confirmed zero dangling imports.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `pnpm lint`: 0 errors (1 pre-existing warning in unrelated file)
- `pnpm lint:css`: clean
- `pnpm format:check`: clean
- `pnpm typecheck`: clean
- `pnpm test`: 67 files, 1033 tests passing
- `pnpm build`: success
- `grep -r "from.*useToast[\"']" src/`: zero results (no dangling imports)
