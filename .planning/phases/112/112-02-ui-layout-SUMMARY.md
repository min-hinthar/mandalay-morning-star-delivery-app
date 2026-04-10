---
phase: 112
plan: 02
subsystem: customer-tracking
tags: [ui, mobile, drawer, localStorage, mute, reconnecting, banner, framer-motion, tailwind-v4, tdd]
requires:
  - phase: 112-01
    provides: "useTrackingSubscription.isConnected (exponential backoff + visibility pause) consumed by ReconnectingBanner"
provides:
  - "src/lib/hooks/useMutePreference.ts — SSR-safe localStorage mute hook ({ isMuted, setMuted, toggleMuted, isHydrated })"
  - "src/components/ui/orders/tracking/ReconnectingBanner.tsx — 2s-debounced top banner with WifiOff + aria-live polite"
  - "src/components/ui/orders/tracking/MuteToggle.tsx — 44px icon-only button with aria-pressed + Volume2/VolumeX"
  - "borderColor.status-warning alias in tailwind.config.ts"
  - "TrackingPageClient: audio gated by !isMuted && !document.hidden; mobile layout via dual-render (peek bar + Drawer)"
affects:
  - "Phase 113 A11Y — 44px targets + aria-pressed + aria-live already compliant, scoped to StatusStepper reduced-motion audit"
  - "Future tracking features — useMutePreference available globally at @/lib/hooks/useMutePreference"
  - "Future modal/banner work — borderColor.status-warning alias reusable"
tech-stack:
  added: []
  patterns:
    - "Dual-render binary snap: peek bar (static DOM) + Drawer (expanded) instead of extending Drawer.tsx — preserves C-1 exit animation safety"
    - "SSR-safe localStorage hook with isHydrated flag (mirrors useAnimationPreference.ts pattern)"
    - "Stateless presentation component for toggle (MuteToggle) driven by parent hook (useMutePreference) — testable + reusable"
    - "2s debounce pattern for transient connection state via setTimeout + cleanup in useEffect"
    - "Audio gating via composite guard: isMuted || document.hidden (preference + platform signal)"
    - "Mobile/desktop layout split via lg:hidden + hidden lg:block sibling branches (desktop content preserved verbatim)"
key-files:
  created:
    - "src/lib/hooks/useMutePreference.ts (65 LOC)"
    - "src/lib/hooks/__tests__/useMutePreference.test.ts (142 LOC, 8 tests)"
    - "src/components/ui/orders/tracking/ReconnectingBanner.tsx (76 LOC)"
    - "src/components/ui/orders/tracking/MuteToggle.tsx (61 LOC)"
  modified:
    - "src/components/ui/orders/tracking/index.ts (+6 LOC: ReconnectingBanner + MuteToggle barrel exports + prop types)"
    - "src/components/ui/orders/tracking/TrackingPageClient.tsx (+239 / -168 LOC: audio gate, banner mount, mute toggle mount, mobile Drawer wrap — grew from 381 → 452 lines)"
    - "tailwind.config.ts (+6 LOC: borderColor.status-warning alias)"
key-decisions:
  - "Dual-render strategy for mobile bottom sheet: static peek bar at z-40 + Drawer at height='full' mounted conditionally, rather than extending Drawer.tsx with a dismissible=false prop. Avoids touching C-1 protected exit animation and sidesteps adding new Drawer tests."
  - "2s debounce on ReconnectingBanner via setTimeout in useEffect — eliminates flashing on momentary network blips while staying simple (no external debounce util needed)."
  - "MuteToggle is stateless (props in, callback out) with persistence driven by parent via useMutePreference hook. Enables testing each layer independently."
  - "Instant icon swap for mute state (no pulse animation) — UI-SPEC marked pulse as planner-discretion; matches 'don't shout' principle and saves Framer Motion wiring."
  - "Explicit borderColor.status-warning alias in tailwind.config.ts added defensively — existing color token already generated border classes via the color map, but explicit alias future-proofs against Tailwind regeneration edge cases."
  - "Audio gate uses composite guard (!isMuted && typeof document !== 'undefined' && !document.hidden) — typeof check added for SSR safety even though useEffect only runs client-side."
  - "File size hit 452 lines (ESLint max-lines warning threshold 400) — flagged for Phase 113 component subfolder extraction per plan's explicit direction. NOT blocking."
  - "Burmese copy kept inline in ReconnectingBanner with `// BURMESE-REVIEW` marker (D-45) instead of extracted to a locale file — matches no-new-deps spirit and enables one-grep find/replace once native speaker signs off."
  - "No Sentry breadcrumbs (D-46 deferred) — matches Plan 01 disposition; revisit after first production incident."
requirements-completed: [CFIX-10, TRAK-01, TRAK-02]
duration: ~12 min
completed: 2026-04-09
---

# Phase 112 Plan 02: Customer Tracking UI Layout Summary

**Mobile collapsible bottom sheet (peek bar + Drawer dual-render), 2s-debounced Reconnecting banner with calm warmth copy, and persistent mute toggle gating audio notifications — all three Phase 112 visible surfaces shipped in one coordinated plan.**

## Performance

- **Duration:** ~12 min (Tasks 1-3 executed in worktree 18:26:57 → 18:38:19 PT)
- **Started:** 2026-04-09T01:26:57Z (worktree executor spawn)
- **Completed:** 2026-04-09T01:38:19Z (Task 3 commit); CHKP-07 approved by user after main-tree merge + verification suite
- **Tasks:** 4 (3 code + 1 human-verify checkpoint)
- **Files created:** 4
- **Files modified:** 3
- **Tests added:** 8 (useMutePreference)
- **Commits:** 3

## Accomplishments

- **TRAK-01 (mobile bottom sheet):** Full-height map (`h-[calc(100svh-3.5rem)]`) behind a 120px peek bar showing driver name + ETA; tap peek → Drawer expands to 95vh with spring animation; swipe-down or backdrop-tap → snap back to peek (never unmounts). Desktop `lg:grid-cols-2` layout preserved verbatim inside `hidden lg:block`.
- **TRAK-02 (reconnecting banner):** Fixed-top banner (z-30, below sticky header) with 2s debounce, WifiOff icon, "Reconnecting..." headline + subtitle, `aria-live="polite"`, status-warning tokens, reduced-motion gate, slide-down enter + fast easeIn exit (~150ms).
- **CFIX-10 (mute toggle + audio gate):** 44px icon-only button in header between ShareButton and RefreshCw; Volume2/VolumeX swap with dynamic aria-label + aria-pressed; haptic feedback; localStorage persistence (`trackingAudioMuted` key) via SSR-safe hook; audio play gated by `!isMuted && !document.hidden` in status transition effect.
- **useMutePreference hook:** SSR-safe, 8 tests covering hydration, invalid value handling, persistence, toggle, and Storage throw recovery.
- **Tailwind alias:** `borderColor.status-warning` added for defensive resolution.
- **Zero desktop regressions:** `lg:grid-cols-2` branch is a byte-level copy of pre-Phase-112 layout classes (now inside `hidden lg:block` wrapper).
- **Zero Drawer.tsx diff:** dual-render strategy avoided touching the C-1 protected component.

## Task Commits

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | useMutePreference hook + 8 TDD tests (CFIX-10) | `aba8dda5` | PASS |
| 2 | ReconnectingBanner + MuteToggle + border-status-warning alias + barrel exports (TRAK-02, CFIX-10) | `9e6428c4` | PASS |
| 3 | Wire mute hook + audio gate + banner + mobile Drawer into TrackingPageClient (CFIX-10, TRAK-01, TRAK-02) | `921fd74b` | PASS |
| 4 | CHKP-07: Mobile UX smoke test (7 scenarios) | — | APPROVED by user |

**Merge commit:** `92f8319e` (`chore: merge executor worktree (worktree-agent-a69347db) — Wave 2 tasks 1-3`) landed all three task commits on main.

## Files Created/Modified

### Created

| File | LOC | Purpose |
|------|-----|---------|
| `src/lib/hooks/useMutePreference.ts` | 65 | SSR-safe localStorage mute hook ({ isMuted, setMuted, toggleMuted, isHydrated }) |
| `src/lib/hooks/__tests__/useMutePreference.test.ts` | 142 | 8 tests: default unmuted, hydration, invalid value, persistence, toggle, Storage throw recovery |
| `src/components/ui/orders/tracking/ReconnectingBanner.tsx` | 76 | 2s-debounced banner with WifiOff, status-warning tokens, aria-live polite, reduced-motion gate |
| `src/components/ui/orders/tracking/MuteToggle.tsx` | 61 | 44px icon button, Volume2/VolumeX swap, aria-pressed, haptic feedback |

### Modified

| File | Delta | Change |
|------|-------|--------|
| `src/components/ui/orders/tracking/index.ts` | +6 | Barrel exports: ReconnectingBanner, MuteToggle + prop types |
| `src/components/ui/orders/tracking/TrackingPageClient.tsx` | +239 / -168 | Audio gate, MuteToggle header mount, ReconnectingBanner mount, mobile Drawer wrap, `mapContent`/`infoPaneContent`/`cancelledOverlayContent` extracted as shared JSX, semantic z-fixed + z-modal-backdrop tokens (381 → 452 lines) |
| `tailwind.config.ts` | +6 | `borderColor.status-warning: var(--color-status-warning)` alias |

## Decisions Made

See `key-decisions` in frontmatter. Summary:

1. **Dual-render for binary snap** — peek bar static DOM + Drawer expanded, NOT a Drawer extension. Preserves C-1 exit animation safety and avoids new Drawer tests.
2. **2s debounce via setTimeout** — simple useEffect pattern, no external debounce util.
3. **Stateless MuteToggle + parent hook** — props in / callback out; persistence owned by `useMutePreference` in parent. Each layer independently testable.
4. **Instant icon swap (no pulse)** — UI-SPEC planner-discretion; matches "don't shout" principle.
5. **Explicit borderColor alias** — defensive tailwind alias even though color map already generates border classes.
6. **SSR-safe audio gate composite** — `!isMuted && typeof document !== 'undefined' && !document.hidden`.
7. **File size 452 > 400** — flagged for Phase 113 refactor per plan's explicit direction; not blocking.
8. **Burmese copy inline with `// BURMESE-REVIEW`** — no locale file, ready for one-grep find/replace after sign-off.
9. **No Sentry breadcrumbs** — deferred per Plan 01 disposition.

## Deviations from Plan

None - plan executed exactly as written.

No Rule 1 (bugs), Rule 2 (missing critical), Rule 3 (blocking), or Rule 4 (architectural) deviations encountered during Tasks 1-3. The previous executor followed the plan verbatim through TDD RED→GREEN for Tasks 1-2 and the section-by-section major edit protocol for Task 3.

**Planned tech debt (NOT deviations):**
- `TrackingPageClient.tsx` crossed 400-line ESLint warning (452 lines). The plan explicitly anticipated this and directed "flag in SUMMARY — do not split in this task (out of scope), note for Phase 113 refactor." Handled as instructed.
- Burmese strings inline with `// BURMESE-REVIEW` markers per CONTEXT D-45, awaiting native-speaker sign-off before v2.3 prod ship. Non-blocking.

## Issues Encountered

None. Both the autonomous executor pass (Tasks 1-3) and the human-verify checkpoint (Task 4) completed without reported bugs.

## Checkpoint Resolution

**CHKP-07 (Mobile UX smoke test — 7 scenarios):**

User ran the 7 verification scenarios from the plan's `<how-to-verify>` block:

1. **TRAK-01 mobile (peek + Drawer + swipe-dismiss + ESC)** — Verified: map fills viewport, peek bar shows driver name + ETA, tap expands Drawer to 95vh, swipe-down snaps back to peek, backdrop/ESC also snap back, exit animation fast (~150ms, not bouncy) confirming Drawer.tsx untouched.
2. **TRAK-01 desktop regression** — Verified: `lg:grid-cols-2` 50/50 split renders identically to pre-Phase-112; no peek bar, no Drawer on > 1024px viewports.
3. **TRAK-02 reconnecting banner** — Verified: fixed-top banner with WifiOff + "Reconnecting..." headline + subtitle appears ~2s after offline toggle, auto-dismisses on reconnect, 2s debounce suppresses flashing on <2s blips.
4. **TRAK-03 visibility pause** — Verified: WebSocket re-subscribes after tab switch, no stale-closure errors, rapid flip-flop stable (Plan 01 delivery).
5. **TRAK-04 exponential backoff** — Covered by Plan 01 unit tests J/K/L; manual DevTools observation skipped per plan's `<how-to-verify>` guidance ("SKIP this manual verification if tedious").
6. **CFIX-10 mute toggle** — Verified: Volume2 → VolumeX icon swap, `aria-label` + `aria-pressed` flip correctly, state persists across refresh + across orders (global localStorage), no audio during status transitions while muted, no audio on hidden tab even when unmuted.
7. **Accessibility + dark mode** — Verified: tab order Back → Live → Share → Mute → Refresh, Space/Enter activates mute, focus ring visible, banner `role=status` announced, dark mode renders status-warning tokens and peek bar surface colors without hardcoded hex.

**User resume signal:** "approved" — all seven surfaces work as expected on mobile emulation + desktop regression.

## Verification Suite

Full verification suite executed on main branch post-merge — all green:

```
pnpm lint           → CLEAN
pnpm lint:css       → CLEAN
pnpm format:check   → CLEAN
pnpm typecheck      → CLEAN
pnpm test           → 992 / 992 PASS / 0 FAIL
pnpm build          → COMPILED SUCCESSFULLY
```

Test count grew from 984 (post-Plan-01) to 992 (+8 useMutePreference tests), confirming no regression in the existing suite and full Phase 112 Task 1 TDD coverage delivered.

## Regression Guards (all held)

- Plan 01 tests (useTrackingSubscription lifecycle) still pass.
- Existing tracking helper tests (useShowLiveTracking, useLastUpdateDisplay) still pass.
- `src/components/ui/Drawer.tsx` NOT modified — verified via git log (last touch was commit 7c78488d, pre-Phase-112).
- `src/components/ui/LazyMaps.tsx` NOT modified — Lazy map passed through via `mapContent` variable.
- Desktop `lg:grid-cols-2` layout byte-level preserved inside `hidden lg:block` wrapper.
- `100svh` used for mobile map (not 100vh) — iOS safe-area correct.

## Requirement Coverage

| ID | Requirement | Delivered in |
|----|-------------|--------------|
| CFIX-10 | Mute toggle for tracking audio notifications, persists across sessions | 112-02 (useMutePreference + MuteToggle + TrackingPageClient wiring) |
| TRAK-01 | Mobile collapsible bottom sheet; map-dominant layout | 112-02 (dual-render peek bar + Drawer in TrackingPageClient) |
| TRAK-02 | Reconnecting banner with calm warmth copy, 2s debounce | 112-02 (ReconnectingBanner + TrackingPageClient mount) |
| TRAK-03 | Visibility pause for Realtime + polling | 112-01 (useTrackingSubscription refactor) |
| TRAK-04 | Exponential backoff for connection retries | 112-01 (useTrackingSubscription refactor + shared backoff util) |

**Phase 112 complete: all 5 requirements satisfied across Plans 01 + 02.**

## Known Tech Debt

| Item | Severity | Owner | Follow-up |
|------|----------|-------|-----------|
| Burmese companion strings in ReconnectingBanner marked `// BURMESE-REVIEW` | Non-blocking | Project owner | Native-speaker sign-off before v2.3 prod ship (D-45) |
| `TrackingPageClient.tsx` at 452 lines (>400 ESLint warning) | Non-blocking | Phase 113 | Component subfolder extraction (e.g., `TrackingPageClient/MobileLayout.tsx`, `TrackingPageClient/DesktopLayout.tsx`, `TrackingPageClient/PeekBar.tsx`) |
| Sentry breadcrumbs for reconnect events (D-46) | Deferred | Post-incident | Revisit after first production tracking-disconnect incident |
| MuteToggle pulse animation (UI-SPEC planner-discretion) | Deferred | Phase 113 UX polish | Optional — current instant swap matches "don't shout" principle |
| `useMutePreference` multi-instance sync via storage event | Deferred | Future | Each hook instance reads localStorage on mount only — multi-tab sync not critical for a single-page tracking view |

## Locked Assumptions Shipped

All 10 locked assumptions from the plan held through execution:

1. ✅ TRAK-01 binary snap via dual-render strategy (peek bar + Drawer), NOT Drawer extension.
2. ✅ Mobile-only wrapper via `lg:hidden` + `hidden lg:block` split; desktop content byte-identical.
3. ✅ NearbyBanner stays inside mobile Drawer content (sheet-interior banner, distinct from ReconnectingBanner).
4. ✅ Audio gate gates ONLY audio (`!isMuted && !document.hidden`); haptic stays unconditional.
5. ✅ useMutePreference renders `Volume2` during SSR (isHydrated === false); hydration mismatch prevented.
6. ✅ tailwind.config.ts is source of truth for the new alias (not globals.css).
7. ✅ ReconnectingBanner receives `isConnected` as prop (not hook call); TrackingPageClient derives from subscription.
8. ✅ Inline Burmese strings with `// BURMESE-REVIEW` comment; no locale file.
9. ✅ MuteToggle pulse animation omitted v1 (instant swap).
10. ✅ No Sentry breadcrumbs (matches Plan 01 disposition).

## Next Phase Readiness

**Phase 112 complete.** All 5 requirements (CFIX-10, TRAK-01, TRAK-02, TRAK-03, TRAK-04) delivered across Plans 01 + 02. Customer tracking experience live: exponential backoff + visibility pause (Plan 01) + mobile bottom sheet + reconnecting banner + mute toggle (Plan 02).

**Ready for Phase 113 (A11Y audit):**
- 44px touch targets already met (MuteToggle + peek bar)
- aria-live polite + aria-pressed in place
- Focus ring on MuteToggle (ring-2 ring-ring ring-offset-2)
- `role="status"` on ReconnectingBanner
- Reduced-motion honored via `useAnimationPreference().getSpring()`
- **Phase 113 scope:** audit `StatusStepper` reduced-motion gap (M-6, pre-existing), component extraction for `TrackingPageClient.tsx` (>400 lines), optional MuteToggle pulse animation polish.

**No blockers for Phase 113.** Burmese review debt tracked separately (non-blocking for A11Y work).

## Known Stubs

None. All wiring is end-to-end:
- `useMutePreference` → localStorage → MuteToggle → audio gate (full closed loop)
- `useTrackingSubscription.isConnected` → ReconnectingBanner prop → visible banner (closed loop via Plan 01 state machine)
- Mobile peek bar → Drawer → info pane content (all existing tracking components mounted unchanged inside Drawer body)

## Self-Check: PASSED

**Files created (key-files.created):**
- [x] `src/lib/hooks/useMutePreference.ts` (65 LOC)
- [x] `src/lib/hooks/__tests__/useMutePreference.test.ts` (142 LOC, 8 tests)
- [x] `src/components/ui/orders/tracking/ReconnectingBanner.tsx` (76 LOC)
- [x] `src/components/ui/orders/tracking/MuteToggle.tsx` (61 LOC)

**Files modified (key-files.modified):**
- [x] `src/components/ui/orders/tracking/index.ts` (barrel exports present)
- [x] `src/components/ui/orders/tracking/TrackingPageClient.tsx` (useMutePreference, MuteToggle, ReconnectingBanner, audio gate, lg:hidden + hidden lg:block, 100svh all verified)
- [x] `tailwind.config.ts` (borderColor.status-warning alias verified at line 229-234)

**Task commits present in git log:**
- [x] `aba8dda5` — feat(112-02): useMutePreference hook (CFIX-10)
- [x] `9e6428c4` — feat(112-02): ReconnectingBanner + MuteToggle + border-status-warning alias
- [x] `921fd74b` — feat(112-02): wire mute toggle + reconnecting banner + mobile bottom sheet into TrackingPageClient (CFIX-10, TRAK-01, TRAK-02)
- [x] `92f8319e` — chore: merge executor worktree (Wave 2 tasks 1-3) — all three tasks landed on main

**Regression guards:**
- [x] `src/components/ui/Drawer.tsx` NOT modified (last touch: 7c78488d, pre-Phase-112)
- [x] Desktop `lg:grid-cols-2` layout preserved inside `hidden lg:block` wrapper
- [x] `100svh` used for mobile map (not 100vh)
- [x] Audio gate `!isMuted && typeof document !== 'undefined' && !document.hidden` present at line 101
- [x] `useEffect` dep array includes `isMuted` at line 120

**Verification suite (main tree, post-merge):**
- [x] `pnpm lint` clean
- [x] `pnpm lint:css` clean
- [x] `pnpm format:check` clean
- [x] `pnpm typecheck` clean
- [x] `pnpm test` → 992 / 992 PASS
- [x] `pnpm build` compiled successfully

**CHKP-07 (human verification):**
- [x] User ran 7 mobile UX scenarios and replied "approved"

**REQ-ID coverage:**
- [x] CFIX-10 — MuteToggle + useMutePreference + audio gate
- [x] TRAK-01 — Mobile bottom sheet (dual-render peek bar + Drawer)
- [x] TRAK-02 — Reconnecting banner with 2s debounce + calm warmth copy

---

*Phase: 112-customer-tracking*
*Completed: 2026-04-09*
