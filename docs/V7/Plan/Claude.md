```md
# CLAUDE.md — V7 Motion-First Redesign Workflow (Pepper-inspired, Elevated)

**Context:** We are fully reconstructing UI (layout/components/sections/nav/footer) with **maximum playfulness + motion**. Inspired by **Pepper home + menu**, but upgraded in composition, color, depth, and interactivity. **No accordions.** **No prefers-reduced-motion handling** (motion always on). Use **GSAP + Framer Motion + optional Canvas/WebGL** freely.
**Reference:** [Animated-Playful-UI-Redesign-Plan.md](docs\V7\Animated-Playful-UI-Redesign-Plan.md)
---

## Workflow (must follow)

### Using `/frontend-design /mvp-prd /prd-clarify /prd-ux /ux-prompts` Skills

### 1) MVP → PRD
- Scan existing pages/routes and list what will be redesigned.
- Produce **MVP PRD**: scope, pages, sections, interaction goals, motion pillars, non-goals, success metrics.
- Include a “Pepper → Morning Star mapping” (Home + Menu patterns → our pages).
- Use /mvp-prd skill

### 2) PRD → Refined PRD
- Tighten: IA, page-by-page objectives, component inventory, motion system primitives, acceptance criteria.
- Add “No-Accordion Replacements” list (animated alternatives only).
- Use /prd-clarify skill (Ultralong)

### 3) Refined PRD → UX
- Write **UX flows** for key paths (browse menu, pick bundle/add-ons, subscribe/checkout, account/manage).
- Define interaction patterns: snapping tabs, FLIP transitions, scroll storytelling, toasts/loaders, reactions, dock, charts.
- Use /prd-ux skill

### 4) UX → UI Prompts
- Output **UI build prompts** (one per page/section/component/build-tasks) that a coding agent can execute.
- Each prompt must specify:
  - Layout structure
  - Key components
  - Motion plan (GSAP timelines + ScrollTrigger + Framer micro-interactions)
  - Visual tone (Pepper-inspired + “more premium”)
  - Files to create/edit
  - Use /frontend-design skill

---

## Motion/Visual Rules (short)

- **Motion maximalism**: layered parallax, cinematic scroll sequences, overlapping timelines, bold color transitions.
- **GSAP**: ScrollTrigger pin/scrub, timelines, FLIP, complex choreography.
- **Framer Motion**: micro-interactions, shared layout (active pill/tabs), hover/tap polish.
- **Canvas/WebGL optional**: particles/steam/grain/gradient mesh; lazy-load if used.
- **No accordions**: replace with animated cards, flip reveals, timeline reveals, snap sections, modal sheets, carousels.
- **Timeline control**: add dev-only controls (play/pause/reverse/restart/seek) for major sequences.

---

## Output Format (always)

When working, always output in this order:
1) **MVP PRD**
2) **Refined PRD**
3) **UX Flows**
4) **UI Prompts (actionable, page/section-scoped/build-tasks)**

```

## Verification
Run before completing: `pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm build`