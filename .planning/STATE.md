# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 2 overlay infrastructure in progress

## Current Position

Phase: 2 of 7 (Overlay Infrastructure)
Plan: 3 of 4 complete
Status: In progress
Last activity: 2026-01-22 — Completed 02-03-PLAN.md (Drawer and Dropdown Components)

Progress: [███░░░░░░░] 29% (8/28 plans estimated)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 6 min
- Total execution time: 0.75 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-token-system | 5 | 34 min | 7 min |
| 02-overlay-infrastructure | 3 | 11 min | 4 min |

**Recent Trend:**
- Last 5 plans: 01-04 (3 min), 01-05 (7 min), 02-01 (6 min), 02-02 (est), 02-03 (5 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Full frontend rewrite (not incremental fixes) — V7 has systemic layering issues
- Fresh components in parallel development — Build new system without breaking existing
- Customer flows only for V1 — Admin/Driver work; focus on broken customer experience
- Animation everywhere — User wants "over-the-top animated" experience
- Import GSAP from @/lib/gsap, never directly from gsap — Ensures plugins registered
- Use --z-index-* naming for TailwindCSS 4 utility generation — Strips prefix to create z-* utilities
- Triple export pattern for design tokens — zIndex (numbers), zIndexVar (CSS vars), zClass (class names)
- ESLint z-index rules at warn severity — Legacy code awareness without blocking build
- Use built-in Stylelint rules — Plugin incompatible with Stylelint 17
- Phased z-index migration — Violations tracked, fixed during component rebuilds in Phases 2-5
- overlayMotion uses spring for open, duration for close — Natural entrance, snappy exit
- Color tokens include CSS variable fallbacks — Graceful degradation for theming
- Backdrop uses AnimatePresence — Fully removes from DOM when closed (click-blocking fix)
- Focus trap uses querySelectorAll for focusable elements, Tab key interception
- Dropdown uses mousedown for outside click detection (catches before propagation)
- No stopPropagation on dropdown content — Events bubble for form compatibility (V7 fix)

### Pending Todos

None yet.

### Blockers/Concerns

None - build pipeline fully passing.

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed 02-03-PLAN.md (Drawer and Dropdown Components)
Resume file: None

## Phase 2 Progress

Phase 2 (Overlay Infrastructure) in progress with 3 of 4 plans complete:

1. **02-01:** Overlay Primitives - Motion tokens, color tokens, Portal, Backdrop, hooks
2. **02-02:** Modal and BottomSheet - Responsive modal, swipe-to-dismiss bottom sheet
3. **02-03:** Drawer and Dropdown - Focus-trap drawer, event-safe dropdown

**Remaining plans:**
- 02-04: Tooltip and Toast components

**Build status:** All passing (`pnpm lint && pnpm lint:css && pnpm typecheck && pnpm build`)

Ready to proceed to 02-04.
