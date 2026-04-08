# Phase 112: Order Tracking Overhaul - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered and how they were resolved.

**Date:** 2026-04-08
**Phase:** 112-order-tracking-overhaul
**Mode:** `--auto` (assumption-based, all gray areas pre-resolved via deep-phase-assumptions 12-agent protocol)
**Areas analyzed:** Bottom Sheet Library, Snap Points, Exponential Backoff, Visibility Pause Strategy, Reconnecting Banner Debounce, Banner Placement, Mute Scope, Mute Icon Placement, Desktop Scope, Test Coverage, Audio Gate, Realtime RLS, Location Channel Handling, Sheet Drag Performance, Telemetry

---

## Auto-Resolution Source

All 15 gray areas were resolved to **HIGH confidence** by the Wave 1 + Wave 2 deep-phase-assumptions research protocol before `/gsd-discuss-phase 112 --auto` was invoked. Source document:
- `.planning/phases/112/112-PRECONTEXT-RESEARCH.md` §11 "Gray Area Resolutions"
- `.planning/phases/112/112-ENHANCEMENT-RECOMMENDATIONS.md` priority matrix (R1-R12)

No interactive questions were asked in this discussion pass. Decisions below were auto-selected based on the research's recommended options with explicit evidence from file:line citations.

---

## Assumptions Presented & Auto-Resolved

### Bottom Sheet Library (D-01)

| Option | Pros | Cons | Selected |
|--------|------|------|----------|
| `vaul` library | Linear/Vercel use it; clean API | +12KB gzipped, new dep, reintroduces mobile Safari GPU risk | |
| `@radix-ui/react-dialog` custom drag | Already installed | Duplicates Drawer.tsx work; untested for swipe | |
| **Existing `Drawer.tsx`** | Battle-tested, mobile Safari GPU-hardened, swipe+focus trap+scroll lock free, zero new deps | Binary snap only | ✓ |

**Auto-selected:** Existing `Drawer.tsx` — recommended default. Evidence: `Drawer.tsx:52,257` supports bottom sheet natively; commit 4087d3bf documents the mobile Safari GPU fix that vaul would reintroduce.

---

### Snap Points (D-02)

| Option | Description | Selected |
|--------|-------------|----------|
| 3-tier (peek/half/full) | Requires Drawer.tsx extension; flexible | |
| 2-tier extended | Minimal Drawer extension | |
| **Binary (collapsed ↔ expanded 95vh)** | Native Drawer support, YAGNI-compliant for tracking use case | ✓ |

**Auto-selected:** Binary — Drawer.tsx supports natively; tracking use case does not justify 3-tier complexity.

---

### Exponential Backoff Implementation (D-08, D-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Inline `Math.min(1000 * 2 ** i, 30000)` in `useTrackingSubscription.ts` | Simplest | |
| Import directly from `query-provider.tsx` | Cross-module dependency risk | |
| **Extract to `src/lib/utils/backoff.ts`** | Single source of truth; unit-testable; both files import from util | ✓ |

**Auto-selected:** Extract to util. Evidence: Phase 110 DATA-02 mandates centralized infrastructure; pure function tests trivially.

---

### Visibility Pause Aggression (D-12, D-13)

| Option | Behavior | Selected |
|--------|----------|----------|
| Idle channel (keep connected, drop callbacks) | Supabase still bills for active connection | |
| Stop polling only, keep Realtime | Saves polling, Realtime idles | |
| **removeChannel BOTH + stopPolling** | Clean state, no idle billing, fast reconnect via `fetchTrackingData()` | ✓ |

**Auto-selected:** `removeChannel` both channels + `stopPolling`. Evidence: Supabase billing model, TRAK-03 spec spirit, cleanup pattern at `useTrackingSubscription.ts:290-305`.

---

### Reconnect Retries (D-10)

| Option | Behavior | Selected |
|--------|----------|----------|
| Max 3 attempts | Matches `QUERY_RETRY_ATTEMPTS` Phase 110 constant | |
| Max 6-10 attempts | Middle ground | |
| **Infinite while page open** | Delivery window is 30-90 min; user expects continuous retry | ✓ |

**Auto-selected:** Infinite retries. Reset counter on `SUBSCRIBED`. Evidence: delivery domain timing + user expectation that tracking keeps trying.

---

### Reconnecting Banner Debounce (D-18)

| Option | Timing | Selected |
|--------|--------|----------|
| 0ms (immediate) | Flickers on momentary blips | |
| 5s (Phase 111 patient) | Too late, user perceives "stuck" | |
| **2s debounce** | Eliminates 90%+ of blips, surfaces real disconnects quickly | ✓ |

**Auto-selected:** 2s debounce. Evidence: Phase 110 fallback error escalation uses same 2s threshold.

---

### Banner Placement (D-19)

| Option | Location | Selected |
|--------|----------|----------|
| Inside header (replace "Live" indicator) | Too crowded | |
| Floating in info pane | Invisible when sheet collapsed | |
| **Fixed below header, z-25** | Visible regardless of sheet state, escapes scroll | ✓ |

**Auto-selected:** Fixed top, below sticky header (`top: 56px; z-index: 25`).

---

### Mute Scope & Persistence (D-28)

| Option | Storage | Selected |
|--------|---------|----------|
| Per-order localStorage | Unique key per order — user re-mutes every order | |
| Server-side user preference | Overkill; requires schema change | |
| **Global localStorage `trackingAudioMuted`** | Matches `useSoundPreference` precedent; persists across orders | ✓ |

**Auto-selected:** Global localStorage (boolean key).

---

### Mute Icon Placement (D-30)

| Option | Location | Selected |
|--------|----------|----------|
| Floating action button | Non-standard for header action | |
| Inside collapsed sheet | Invisible when sheet expanded | |
| **Header, between ShareButton and RefreshCw** | Adjacent to other connection-related controls | ✓ |

**Auto-selected:** Header placement (`TrackingPageClient.tsx:198-210`).

---

### Desktop Scope (D-03)

| Option | Scope | Selected |
|--------|-------|----------|
| Rewrite desktop with new layout | High regression risk; not in TRAK-01 spec | |
| Progressive enhancement | Adds complexity | |
| **Mobile-only sheet; desktop unchanged** | Zero desktop regression risk; matches TRAK-01 spec wording "on mobile" | ✓ |

**Auto-selected:** Mobile-only — `lg:hidden` wrapper, desktop `lg:grid-cols-2` stays exactly as-is.

---

### Test Coverage Strategy (D-37, D-38)

| Option | Approach | Selected |
|--------|----------|----------|
| Refactor first, test after | Regression-prone for 328-LOC state machine | |
| Skip tests (cover manually) | Violates "frustrations: never skip verification" directive | |
| **Add baseline tests BEFORE refactor** | Safety net for hook refactor, aligns with project test discipline | ✓ |

**Auto-selected:** Test-first. Evidence: `useTrackingSubscription.ts` has zero direct tests today; Phase 110 precedent ships with full coverage.

---

### Realtime RLS (D-41, auto-inherited)

| Option | Behavior | Selected |
|--------|----------|----------|
| Add new RLS filters | Unnecessary; existing RLS covers |  |
| Manual channel filter hardening | Redundant with RLS | |
| **Inherit existing RLS (no changes)** | Tracking tables already RLS-enforced via auth context | ✓ |

**Auto-selected:** No RLS changes. Channel `.on()` calls do not need extra filters.

---

### Location Channel Handling (D-12)

| Option | Cleanup Pattern | Selected |
|--------|-----------------|----------|
| Clean up tracking channel only | Leaks location channel on visibility pause | |
| Independent handlers | Complicates race protection | |
| **Both channels removed together** | Atomic pause; consistent state | ✓ |

**Auto-selected:** Both channels removed in the same `hidden` branch.

---

### Sheet Drag Performance (D-05, inherited from Drawer.tsx)

| Option | Behavior | Selected |
|--------|----------|----------|
| New `will-change` optimization | Drawer.tsx already handles | |
| Custom drag physics | Duplicates existing implementation | |
| **Inherit Drawer.tsx `willChange` handling** | Battle-tested; mobile Safari hardened | ✓ |

**Auto-selected:** Inherit. Phase 112 wraps Drawer, does not reimplement.

---

### Telemetry (D-46)

| Option | Scope | Selected |
|--------|-------|----------|
| No telemetry | Blind to backoff effectiveness in production | |
| Sentry events | High-volume, cost concern | |
| **Sentry breadcrumbs (optional — planner decides)** | Zero-cost in normal operation; attach only to error reports | ✓ (NICE-TO-HAVE) |

**Auto-selected:** Optional breadcrumbs; planner includes or defers based on budget.

---

## Corrections Made

**No corrections — all auto-resolved assumptions confirmed as written.** The 12-agent research protocol produced HIGH-confidence resolutions before this workflow invocation, and every assumption has explicit file:line evidence in `112-PRECONTEXT-RESEARCH.md`. Auto mode accepted all recommended defaults.

---

## Claude's Discretion (deferred to planner)

- Exact banner icon choice from `lucide-react` (`WifiOff` vs `AlertCircle` vs `Radio`)
- Mute-toggle entry animation (scale pulse vs instant)
- Test split between Vitest unit tests and additional integration coverage
- Plan file split (single plan vs two — e.g., `112-01-hook-refactor` + `112-02-ui-layout`)
- Telemetry inclusion vs defer (D-46)
- Component directory — co-locate in `src/components/ui/orders/tracking/` (current convention) vs promote

---

## Deferred Ideas Noted

All 15 captured in `112-CONTEXT.md` `<deferred>` section. Key deferrals:
- Push notifications → v2.4 NOTF-01
- Offline tracking → Phase 114 LOAD
- 3-tier snap points → YAGNI
- Vaul library → N/A (Drawer.tsx covers)
- StatusStepper reduced-motion fix → Phase 113 A11Y
- React Query polling migration → Phase 115 DATA
- Burmese native-speaker review → non-code scope

---

## External Research

No external web/library research performed — codebase analysis was sufficient via the 12-agent protocol. Drawer.tsx, useAnimationPreference, NearbyBanner, and query-provider.tsx provided all needed patterns with file:line evidence.

---

*Audit trail closed 2026-04-08. Canonical decisions live in `112-CONTEXT.md`.*
