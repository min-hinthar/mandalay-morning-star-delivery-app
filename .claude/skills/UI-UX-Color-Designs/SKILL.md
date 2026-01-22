---
name: UI-UX-Color-Designs
description: >
  Domain-expert skill for redesigning modern, vibrant, motion-packed UI/UX (including 3D/canvas),
  and building a production-grade color + motion + layering system with verification gates.
triggers:
  - "redesign UI/UX"
  - "modern / iOS-like / DoorDash / Uber Eats style"
  - "animated / lively / motion-packed"
  - "3D / canvas / WebGL"
  - "color palettes / design tokens"
  - "z-index / overlays / click blocked"
---

# UI-UX-Color-Designs Skill

## Always produce these artifacts
1) Inspiration Matrix (brand → traits → what we adapt)
2) 3 Design Directions (named, distinct, with rationale)
3) Color System Spec (roles + ramps + light/dark + gradients)
4) Motion System Spec (tokens + patterns + GSAP vs Motion split)
5) 3D/Canvas Plan (progressive enhancement + budgets + fallbacks)
6) Layer Map (bottom→top z-layers, portals, pointer-events rules)
7) Implementation Plan (PR slices + migration strategy)
8) Verification Checklist (usability + contrast + motion feel + perf)

## Non-negotiable guardrails
- No hardcoded z-index numbers; only semantic tokens.
- Closed/hidden overlays must not intercept clicks (pointer-events + unmount rules).
- Prefer transform/opacity animations; avoid layout/paint unless justified.
- Decorative canvas/3D layers default to pointer-events:none.
- Push creativity, but never break core usability.

## Workflow (strict)
### 0) Intake + Audit
- Inventory: shells, overlays, portals, stacking contexts, tokens, stores/contexts, routing edge cases.
- Output: “Current Risks” list (max 12 bullets).

### 1) Inspiration Matrix (explicit sourcing)
- Use references/00-inspiration-sources.md.
- Summarize what we adapt (patterns), not what we copy (assets/layout verbatim).

### 2) Propose 3 Design Directions + STOP for approval
For each direction: palette, type, spacing, motion tempo, 3D intensity, signature interactions.
Ask the user to pick 1 direction or a hybrid BEFORE building.

### 3) Build Color System
- Semantic roles + tonal ramps + contrast rules + gradients.
- Output tokens + Tailwind usage patterns.

### 4) Build Motion System
- Motion tokens + reusable patterns library.
- Decide GSAP vs Motion responsibilities.

### 5) 3D/Canvas Plan
- Where it lives (hero/background/cards), intensity, budgets, progressive enhancement + fallback.

### 6) Layer Map
- z-layer tokens, portal roots, pointer-events rules, stacking-context traps, debug playbook.

### 7) Implementation Plan (PR slices)
- Order: tokens/layers → shells → overlays/cart → menu → checkout → polish/3D → tests.

## Proactive Verification Gates (must ask)
- Gate A: Pick design direction/hybrid.
- Gate B: Approve palette (light/dark preview).
- Gate C: Approve motion intensity (3 micro + 1 page transition + 1 scroll sequence).
- Gate D: Approve 3D usage (decorative vs interactive).
- Gate E: Confirm overlay clickability proof (header/tooltips/cart).
- Gate F: Confirm performance sanity (no jank on mid devices).

See references/ for deep guidance and examples/ for copy-paste patterns.
