---
phase: 81-customer-pre-checkout-gate
plan: "01"
subsystem: delivery-gate
tags: [hooks, components, delivery, countdown, customer-ux]
dependency_graph:
  requires:
    - src/lib/utils/delivery-dates.ts
    - src/types/delivery.ts
    - src/components/ui/Modal
    - src/components/ui/button.tsx
  provides:
    - src/lib/hooks/useDeliveryGate.ts
    - src/lib/hooks/useCountdown.ts
    - src/components/ui/delivery/*
  affects:
    - src/components/ui/admin/ops/OpsCountdownBar.tsx
    - src/components/ui/admin/ops/useCountdown.ts
tech_stack:
  added: []
  patterns:
    - Pure function exported alongside hook for testability (computeDeliveryGate)
    - Backward-compatible re-export pattern for relocated shared utilities
    - Urgency-tier styling (normal/warning/critical) from single hook state
key_files:
  created:
    - src/lib/hooks/useCountdown.ts
    - src/lib/hooks/useDeliveryGate.ts
    - src/lib/hooks/__tests__/useDeliveryGate.test.ts
    - src/components/ui/delivery/DeliveryBanner.tsx
    - src/components/ui/delivery/DeliveryCountdown.tsx
    - src/components/ui/delivery/CutoffModal.tsx
    - src/components/ui/delivery/index.ts
  modified:
    - src/components/ui/admin/ops/useCountdown.ts (converted to re-export)
    - src/components/ui/admin/ops/OpsCountdownBar.tsx (updated import path)
decisions:
  - "computeDeliveryGate pure function exported separately from useDeliveryGate hook for testability without renderHook"
  - "useCountdown relocated to @/lib/hooks with admin re-export for zero breaking changes"
  - "Urgency thresholds: >2h=normal, <=2h=warning, <=30m or past=critical"
  - "DeliveryBanner countdown shows Xh Ym format (customer-readable vs. HH:MM:SS admin style)"
  - "CutoffModal cart items preserved per locked phase decision"
metrics:
  duration: "12 min"
  completed: "2026-03-01"
  tasks_completed: 2
  files_created: 7
  files_modified: 2
---

# Phase 81 Plan 01: Delivery Gate Infrastructure Summary

**One-liner:** Shared delivery gate hook with urgency-tier (normal/warning/critical) from business rule params plus DeliveryBanner, DeliveryCountdown, and CutoffModal customer components.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create useDeliveryGate hook and relocate useCountdown | d635d397 | 5 files (3 new, 2 modified) |
| 2 | Create DeliveryBanner, DeliveryCountdown, and CutoffModal | 5fc6c3f9 | 4 files (all new) |

## What Was Built

### Task 1: Shared Hook Infrastructure

**`src/lib/hooks/useCountdown.ts`** — Moved verbatim from `src/components/ui/admin/ops/useCountdown.ts`. Exports `CountdownState`, `computeCountdown` (pure), and `useCountdown` hook. `'use client'` directive included.

**`src/components/ui/admin/ops/useCountdown.ts`** — Converted to a thin re-export:
```typescript
export { useCountdown, computeCountdown, type CountdownState } from "@/lib/hooks/useCountdown";
```
Admin ops continue to work with zero functional changes. `OpsCountdownBar.tsx` updated to import directly from `@/lib/hooks/useCountdown`.

**`src/lib/hooks/useDeliveryGate.ts`** — New hook with:
- `Urgency` type: `'normal' | 'warning' | 'critical'`
- `DeliveryGateState` interface: `{ isOpen, deliveryDate, cutoffDate, timeUntilCutoff, urgency }`
- `computeDeliveryGate(cutoffDay, cutoffHour, now?)` pure function for tests
- `useDeliveryGate(cutoffDay, cutoffHour)` hook with 60s interval (gate state doesn't need per-second resolution)
- Urgency thresholds: `>120m` → normal, `<=120m` → warning, `<=30m` → critical, past → critical

**15 tests added** for `computeDeliveryGate` covering isOpen, urgency thresholds, deliveryDate, timeUntilCutoff, cutoffDate — all passing.

### Task 2: Customer-Facing Components

**`src/components/ui/delivery/DeliveryCountdown.tsx`** — `useCountdown(cutoffDate, 'cutoff')` rendered as `"Xh Ym"` (not HH:MM:SS). Color tokens by urgency: `text-text-secondary` / `text-amber-600` / `text-destructive`. Returns null when `isPast`.

**`src/components/ui/delivery/DeliveryBanner.tsx`** — Sticky `top-14 z-10` below MenuHeader. Open state shows Clock icon, delivery date, countdown with urgency-colored background. Closed state shows Calendar icon and next delivery date. Neutral `bg-surface-secondary` fallback. Under 80 lines.

**`src/components/ui/delivery/CutoffModal.tsx`** — Uses `Modal` from `@/components/ui/Modal`. Warm tone: "We're preparing this week's deliveries!" with amber Calendar icon. Reassurance: "Your cart items are saved for next time." Two actions: `Got it` (outline, dismiss) + `Browse Menu` (primary, Link to `/menu`).

**`src/components/ui/delivery/index.ts`** — Barrel export for all three components and their prop types.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm test` (15 gate tests) | PASS (432 total) |
| `pnpm typecheck` | PASS (clean) |
| `pnpm lint` | PASS (no warnings) |
| `pnpm build` | PASS |
| Admin ops countdown | PASS (re-export + direct import) |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- FOUND: src/lib/hooks/useDeliveryGate.ts
- FOUND: src/lib/hooks/useCountdown.ts
- FOUND: src/components/ui/delivery/DeliveryBanner.tsx
- FOUND: src/components/ui/delivery/DeliveryCountdown.tsx
- FOUND: src/components/ui/delivery/CutoffModal.tsx
- FOUND: src/components/ui/delivery/index.ts
- FOUND: src/lib/hooks/__tests__/useDeliveryGate.test.ts

Commits verified:
- FOUND: d635d397 (Task 1)
- FOUND: 5fc6c3f9 (Task 2)
