# CLAUDE.md — V3 Build Tasks Workflow Guide

> **Purpose**: Guide Claude through implementing V3 UI components using the `/frontend-design` skill
> **Source**: UX-Prompts.md (35 prompts organized into 6 sprints)
> **Scope**: Complete UI implementation for customer, driver, and admin experiences
**Quality Bar**: Premium, warm Burmese aesthetic, heritage, modern, retro, complex, layered, shades, shimmers, Apple IOS - Google Android - styles/themes/features/UI/UX inspire yet unique — NOT generic AI slop. Every interaction should feel responsive, active, animated, intentional, exciting, and efficient.
---

## Overview

This directory contains sprint-organized build tasks that map the 35 UX prompts from `UX-Prompts.md` into actionable implementation sprints. Each sprint file contains the full prompt content for direct use with the `/frontend-design` skill.

---

## Sprint Organization

| Sprint | Focus | Prompts | Tasks | Dependencies |
|--------|-------|---------|-------|--------------|
| **1** | Foundation & Layout | 1-7 | 7 | None (start here) |
| **2** | Base UI Components | 8-13 | 6 | Sprint 1 |
| **3** | Cart & Checkout | 14-18 | 5 | Sprints 1-2 |
| **4** | Tracking & Driver | 19-21 | 3 | Sprints 1-2 |
| **5** | Admin & Interactions | 22-27 | 6 | Sprints 1-4 |
| **6** | States & Polish | 28-35 | 8 | All previous |

**Total**: 35 tasks across 6 sprints

---

## Sprint Progress

| Sprint | Status | Tasks Completed |
|--------|--------|-----------------|
| Sprint 1: Foundation & Layout | ✅ Complete | 7/7 |
| Sprint 2: Base UI Components | ✅ Complete | 6/6 |
| Sprint 3: Cart & Checkout | ✅ Complete | 5/5 |
| Sprint 4: Tracking & Driver | ✅ Complete | 3/3 |
| Sprint 5: Admin & Interactions | ✅ Complete | 6/6 |
| Sprint 6: States & Polish | ⬜ Not Started | 0/8 |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## P1-Foundation UI Assets (Finalized)

Design prototypes serve as visual references for implementation. **Note**: `/frontend-design` skill should treat these as templates and make improvements as fitting—enhancing aesthetics, interactions, and polish while preserving core design intent.

### Design Tokens (Sprint 1)
| Asset | Description | Location |
|-------|-------------|----------|
| **Design Tokens 1** | Color palette, typography showcase | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-1/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-1/screen.png) |
| **Design Tokens 2** | Component samples, spacing | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-2/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-2/screen.png) |
| **Design Tokens 3** | Extended tokens, variants | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-3/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-3/screen.png) |
| **Light Theme** | Primary brand colors | [Light-Theme.md](../../UI-Assets/P1-Foundation/Light-Theme.md) / [PNG](../../UI-Assets/P1-Foundation/Light-Theme.png) |
| **Dark Theme** | Dark mode with warm undertones | [Dark-Theme.md](../../UI-Assets/P1-Foundation/Dark-Theme.md) / [PNG](../../UI-Assets/P1-Foundation/Dark-Theme.png) |

### Cart & Checkout (Sprint 3)
| Asset | Description | Location |
|-------|-------------|----------|
| **Cart Overview 1** | Cart bar, item list layout | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-1/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-1/screen.png) |
| **Cart Overview 2** | Cart summary, totals | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-2/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-2/screen.png) |
| **Cart Overview 3** | Cart states, interactions | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-3/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-3/screen.png) |

### Components (Sprint 2)
| Asset | Description | Location |
|-------|-------------|----------|
| **Item Detail Modal** | Full item customization view | [code.html](../../UI-Assets/P1-Foundation/Item-Detail-Modal/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Item-Detail-Modal/screen.png) |

**Usage**: Review screen.png for visual reference, code.html for structure. `/frontend-design` should improve upon these templates.

---

## How to Use This Workflow

### Step 1: Start Sprint 1
Begin with [Sprint-1-Foundation.md](Sprint-1-Foundation.md) — these are the foundational tokens and layouts that all other components depend on.

### Step 2: Execute Each Task
For each task in a sprint:

1. **Read the task** — understand what's being built
2. **Run `/frontend-design`** — invoke the skill
3. **Paste the prompt content** — use the complete prompt from the task
4. **Review generated code** — ensure it meets specifications
5. **Integrate into project** — place files in specified output locations
6. **Mark task complete** — update the sprint file

### Step 3: Verify Sprint
Before moving to the next sprint:
- [ ] All tasks completed
- [ ] Components integrated and working
- [ ] Visual review passed
- [ ] No TypeScript errors

### Step 4: Proceed to Next Sprint
Move to the next sprint only after the current one is complete (dependencies matter).

---

## Output Locations

Components should be placed in the following directories:

| Category | Output Directory |
|----------|-----------------|
| Design Tokens | `src/styles/` |
| Animation Utilities | `src/lib/animations.ts` |
| Layout Components | `src/components/layouts/` |
| UI Base Components | `src/components/ui/` |
| Menu Components | `src/components/menu/` |
| Cart Components | `src/components/cart/` |
| Checkout Components | `src/components/checkout/` |
| Tracking Components | `src/components/tracking/` |
| Driver Components | `src/components/driver/` |
| Admin Components | `src/components/admin/` |

---

## Sprint Files

| File | Description |
|------|-------------|
| [Sprint-1-Foundation.md](Sprint-1-Foundation.md) | Design tokens, animation utilities, app shells |
| [Sprint-2-Base-Components.md](Sprint-2-Base-Components.md) | Button, input, card, category tabs, menu items |
| [Sprint-3-Cart-Checkout.md](Sprint-3-Cart-Checkout.md) | Cart bar, cart view, checkout steps |
| [Sprint-4-Tracking-Driver.md](Sprint-4-Tracking-Driver.md) | Order tracking, driver route/stop cards |
| [Sprint-5-Admin-Interactions.md](Sprint-5-Admin-Interactions.md) | Admin KPIs, interaction patterns |
| [Sprint-6-States-Polish.md](Sprint-6-States-Polish.md) | Loading, empty, error, success states, polish |

---

## Quality Checklist

Before marking any sprint complete:

### Technical
- [ ] TypeScript strict mode (no `any`)
- [ ] All components use design tokens
- [ ] Framer Motion for animations
- [ ] Proper accessibility (ARIA labels, focus states)
- [ ] Mobile-first responsive

### Visual
- [ ] Matches UX spec visual language
- [ ] Uses correct Burmese fonts (Padauk)
- [ ] Warm, premium aesthetic (not generic AI slop)
- [ ] All states implemented (hover, active, disabled, loading)

### Integration
- [ ] Components exported from barrel files
- [ ] Props properly typed
- [ ] Works with existing codebase patterns
- [ ] No duplicate component definitions

---

## Using `/frontend-design` Skill

The `/frontend-design` skill creates distinctive, production-grade UI components. When using it:

1. **Reference UI Assets** — point to relevant screen.png and code.html templates
2. **Improve upon templates** — treat assets as starting points, not rigid specs
3. **Paste the full prompt** — don't summarize
4. **Specify output files** — mention where components should go
5. **Request TypeScript** — ensure proper typing
6. **Include existing tokens** — reference design system

**Important**: The `/frontend-design` skill should enhance templates with better animations, polish, accessibility, and modern patterns while preserving core design intent.

### Example Usage

```
/frontend-design

[Paste full prompt content from sprint task]

Output to: src/components/ui/Button.tsx
Use existing tokens from: src/styles/tokens.css
```

---

## Design System Quick Reference

> **Updated from finalized P1-Foundation UI Assets**

```css
/* Brand Colors (finalized from UI Assets) */
--primary: #9B1B1E;           /* Bold Red from logo */
--cta: #F4D03F;               /* Bright Gold from logo */
--curry: #8B4513;             /* Warm brown accent */
--jade: #2E8B57;              /* Success green */
--cream: #FFFEF7;             /* Light background */
--charcoal: #1A1A1A;          /* Primary text */
--background-dark: #1a0505;   /* Dark mode background */

/* Typography (finalized from UI Assets) */
Display: "Manrope" (sans-serif, bold headings)
Serif: "Playfair Display" (elegant accents)
Body: "DM Sans" (readable, geometric)
Burmese: "Padauk" (Myanmar script)

/* Spacing */
--space-1: 4px   --space-4: 16px   --space-8: 32px
--space-2: 8px   --space-6: 24px   --space-12: 48px

/* Border Radius */
--radius-sm: 6px   --radius-lg: 12px
--radius-md: 8px   --radius-full: 9999px
```

**Reference**: See [P1-Foundation UI Assets](#p1-foundation-ui-assets-finalized) for complete visual reference.

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [UX-Prompts.md](../UX-Prompts.md) | Original 35 prompts (source of truth) |
| [UX-Specs.md](../UX-Specs.md) | Complete UX specification (6 passes) |
| [PRD.md](../PRD.md) | Product requirements |
| [PRD-clarification-session.md](../PRD-clarification-session.md) | 35 Q&A clarifications |
| [frontend-design-system.md](../../../frontend-design-system.md) | Design system tokens |

---

## Notes

- **Build in order** — each sprint assumes previous sprints are complete
- **Don't skip steps** — foundation tokens are required by all components
- **Visual review matters** — screenshots/GIFs for each component
- **Test on mobile first** — mobile-first responsive design
