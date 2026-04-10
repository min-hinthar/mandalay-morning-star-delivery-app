# Phase 113: Accessibility & Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 113-accessibility-design-system
**Mode:** auto
**Areas discussed:** Touch Target Sizing, Focus Ring Harmonization, Dark Mode Token Audit, Contrast Verification

---

## Touch Target Sizing (A11Y-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Global sm→44px + xs at 36px | Always 44px for sm, new xs escape hatch for icon buttons | auto |
| Responsive breakpoint (sm on desktop, md on mobile) | Keep 36px on desktop, 44px on mobile only | |
| Keep sm at 36px, enforce md minimum | No size change, just audit and replace sm usages | |

**User's choice:** [auto] Global sm→44px + xs at 36px (recommended per pre-context research)
**Notes:** Pre-context research confirmed 68 Button sm usages and ~15 Input sm usages across codebase. Research HIGH confidence this is the correct approach — matches Phase 112 MuteToggle precedent (44px).

---

## Focus Ring Harmonization (A11Y-03)

| Option | Description | Selected |
|--------|-------------|----------|
| 3-tier ring system (standard/small/animated) | ring-2 for most, ring-1 for Checkbox, boxShadow for Card | auto |
| Uniform ring-2 everywhere | Same ring on all elements, accept visual inconsistency on small elements | |
| Per-component custom focus | Each component gets individually tuned focus, no standard | |

**User's choice:** [auto] 3-tier ring system (recommended — Phase 110 precedent + research gotcha analysis)
**Notes:** Research identified 5 distinct focus patterns currently in use. Standard ring-2/ring-primary/ring-offset-2 from Phase 110 as baseline. Checkbox downsized to ring-1 (gotcha G-06). Card uses boxShadow (gotcha G-05). Input layers ring + FM glow (gotcha G-04).

---

## Dark Mode Token Audit (A11Y-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Fix all ~30 files + ESLint guard | Comprehensive cleanup + regression prevention | auto |
| Fix visible customer pages only | Only customer-facing surfaces, leave admin/driver | |
| ESLint rule only (no manual fix) | Let ESLint flag violations, fix as encountered | |

**User's choice:** [auto] Fix all ~30 files + ESLint guard (recommended — shared component library means all surfaces benefit)
**Notes:** tokens.css already 100% complete for dark mode. This is purely cleanup of components that bypass the token system with hardcoded hex/Tailwind colors.

---

## Contrast Verification (A11Y-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Automated Vitest contrast audit | CI regression guard testing all 40 combinations | auto |
| Manual verification in browser | Dev tools contrast check, document results | |
| Skip (research already verified) | Trust pre-context research results | |

**User's choice:** [auto] Automated Vitest contrast audit (recommended — prevents future regression)
**Notes:** Pre-context research confirmed 0 failures across 40 text-muted x surface combinations. Lowest ratio 7.28:1 (well above 4.5:1 WCAG AA threshold). Automated test locks this in.

---

## Claude's Discretion

- ESLint rule patterns for ring color enforcement
- Which h-8/h-7 instances need attention beyond Button/Input sm
- StatusStepper animation gating for focus ring compatibility
- Theme transition flicker handling

## Deferred Ideas

- Full WCAG 2.1 AA compliance audit — separate initiative
- Spring physics harmonization — v2.4
- Keyboard navigation tab order — separate initiative
- Modal/Dialog/Drawer API consolidation — design system refactor
