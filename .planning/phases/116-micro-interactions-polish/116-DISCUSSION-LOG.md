# Phase 116: Micro-Interactions & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 116-micro-interactions-polish
**Mode:** auto (all gray areas auto-resolved with recommended defaults)
**Areas discussed:** Undo UX Pattern, Toast Extension, Swipe Discoverability, Scroll Indicators, Sticky Reorder, OG Strategy

---

## Undo UX Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate remove + snapshot restore | Item removed immediately, snapshot captured pre-mutation, undo restores from snapshot | ✓ |
| Delayed removal (5s hold) | Item stays in cart during window, only removed after timeout | |

**User's choice:** [auto] Immediate remove + snapshot restore (recommended default)
**Notes:** Matches Phase 115 optimistic pattern. Store mutations are synchronous and store-only — no server rollback needed. Pre-context research AD-1 resolved this with HIGH confidence.

---

## Toast System Extension

| Option | Description | Selected |
|--------|-------------|----------|
| Extend useToastV8 | Add `action` prop to existing ToastOptions interface (~30 lines) | ✓ |
| New UndoToast component | Isolated component with its own state management | |

**User's choice:** [auto] Extend useToastV8 (recommended default)
**Notes:** Single toast system maintains consistent UX. Reducer, queue, and portal all reusable. Pre-context research AD-2.

---

## Swipe Discoverability

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle bounce hint | Non-intrusive bounce on first cart item + one-time localStorage flag | ✓ |
| Full tutorial overlay | Modal overlay explaining swipe gesture | |

**User's choice:** [auto] Subtle bounce hint (recommended default)
**Notes:** DoorDash/Uber Eats precedent. No onboarding pattern exists in codebase — lightweight hint is appropriate first step. Pre-context research AD-4.

---

## Scroll Indicators

| Option | Description | Selected |
|--------|-------------|----------|
| Gradient fade indicators | Left/right gradient overlays on overflow (reuse CategoryTabs pattern) | ✓ |
| Arrow buttons | Clickable left/right arrows at edges | |
| Dot indicators | Pagination dots showing scroll position | |

**User's choice:** [auto] Gradient fade indicators (recommended default)
**Notes:** CategoryTabs already implements this exact pattern at :95-105. Copy and apply to MenuHeader dietary chips.

---

## Sticky Reorder Button

| Option | Description | Selected |
|--------|-------------|----------|
| CSS sticky bottom-0 | Sticky positioning with shadow elevation + safe-area inset | ✓ |
| Fixed position | Fixed to bottom of viewport | |

**User's choice:** [auto] CSS sticky bottom-0 (recommended default)
**Notes:** Sticky keeps button in document flow, avoids z-index conflicts with bottom nav. Z-20 token for sticky layer.

---

## OG Meta Tags

| Option | Description | Selected |
|--------|-------------|----------|
| Static brand image + dynamic text | 1200x630 PNG fallback, menu item image when available, dynamic title/description | ✓ |
| Dynamic ImageResponse (Satori) | Generate per-order custom images at request time | |

**User's choice:** [auto] Static brand image + dynamic text (recommended default)
**Notes:** Sufficient for MVP. @vercel/og not in dependencies. Dynamic text via generateMetadata gives rich previews without complexity. Pre-context research AD-3.

---

## Claude's Discretion

- Toast countdown bar visual style
- Bounce animation easing curve tuning
- Scroll fade gradient width
- OG description formatting
- Error toast wording for edge cases

## Deferred Ideas

- Dynamic OG image generation via @vercel/og — future phase if social metrics justify
- Undo for non-cart destructive actions — separate phase
- Spring physics harmonization — QUAL-04 backlog
- Animation system audit — v2.4 candidate
