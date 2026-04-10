# Phase 114: Loading States & Offline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 114-loading-states-offline
**Mode:** auto
**Areas discussed:** Skeleton Visual Fidelity, IDB-First Menu UX, Cart Reconnect Sync, Loading Hierarchy Enforcement, SkeletonCrossfade Promotion

---

## Skeleton Visual Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Exact content-shaped match | DOM mirrors real layout — sections, grid, heights, aspect ratios | ✓ |
| Abstract placeholder shapes | Generic rectangles approximating content areas | |
| Minimal skeleton | Simple loading bar or shimmer strip | |

**User's choice:** Exact content-shaped match (auto-selected — recommended default)
**Notes:** Pre-context research gotcha H-1 requires DOM match. Existing OrderCardSkeleton pattern confirms this approach. All three loading.tsx files currently use generic RouteLoading spinner.

---

## IDB-First Menu UX

| Option | Description | Selected |
|--------|-------------|----------|
| StaleBadge + fade transition | Show cache age badge, fade to fresh data on arrival | ✓ |
| Silent swap | Load IDB data, silently replace when network responds | |
| Loading indicator overlay | Show skeleton over stale data until fresh arrives | |

**User's choice:** StaleBadge + fade transition (auto-selected — recommended default)
**Notes:** Pre-context research gotcha H-5 recommends this approach. StaleBadge component already exists at `src/components/ui/offline/StaleBadge.tsx`. Current useMenuCache only loads IDB on error — needs flip to IDB-first.

---

## Cart Reconnect Sync

| Option | Description | Selected |
|--------|-------------|----------|
| CheckoutErrorBanner reuse | Reuse Phase 111 price change banner for reconnect deltas | ✓ |
| Toast notification | Simple toast showing "prices updated" | |
| Modal with item list | Full dialog listing changed items with old/new prices | |

**User's choice:** CheckoutErrorBanner reuse (auto-selected — recommended default)
**Notes:** Phase 111 CHKP-02 already built this pattern. Current setupOnlineListener() at cart-store.ts:291 is a stub that just clears flags. Needs real /api/menu fetch + comparison.

---

## Loading Hierarchy Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| LoadingWithTimeout wrapper + docs | Runtime enforcement via component wrapper, documented pattern | ✓ |
| ESLint rule enforcement | Lint rule blocking raw spinner usage in page-level loading | |
| Documentation only | Written pattern guide without runtime enforcement | |

**User's choice:** LoadingWithTimeout wrapper + docs (auto-selected — recommended default)
**Notes:** LoadingWithTimeout already exists and enforces timeout hierarchy. Wrap new skeletons with it for consistent behavior.

---

## SkeletonCrossfade Promotion

| Option | Description | Selected |
|--------|-------------|----------|
| Move to ui/ | Relocate from admin/ to shared ui/ directory, update imports | ✓ |
| Duplicate | Create copy in ui/, keep admin version | |
| Leave in admin/ | Import from admin/ path in customer code | |

**User's choice:** Move to ui/ (auto-selected — recommended default)
**Notes:** Pre-context research confirms zero admin-specific imports in SkeletonCrossfade. Fully generic component.

---

## Claude's Discretion

- Exact skeleton stagger delay values
- Shimmer gradient colors (use established tokens)
- IntersectionObserver animation pause for off-screen skeletons
- Fade transition duration for IDB→fresh data swap
- Dark mode skeleton styling
- Loading hierarchy documentation format

## Deferred Ideas

None — all decisions within phase scope.
