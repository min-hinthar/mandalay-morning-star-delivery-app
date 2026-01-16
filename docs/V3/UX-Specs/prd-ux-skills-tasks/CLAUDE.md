# CLAUDE.md — V3 UX Workflow Guide

> **Purpose**: Guide Claude through the 4-phase UX redesign pipeline for V3
> **Scope**: Complete UI/UX reinvention for customer, driver, and admin experiences

---

## V3 UX Vision

**Goal**: Transform Mandalay Morning Star into a world-class food ordering experience that rivals the best in the industry.

**Scope**: Full redesign of all three experiences:
- **Customer**: Menu browsing, cart, checkout, order tracking
- **Driver**: Mobile PWA for deliveries, route management, status updates
- **Admin**: Dashboard, analytics, order management, driver coordination

**Quality Bar**: Premium, warm Burmese aesthetic — NOT generic AI slop. Every interaction should feel responsive, active, animated, intentional, exciting, and efficient.

---

## 4-Phase UX Pipeline

```
Phase 1          Phase 2           Phase 3          Phase 4
┌─────────┐     ┌─────────────┐   ┌─────────┐     ┌───────────┐
│ mvp-prd │ ──▶ │ prd-clarify │ ─▶│ prd-ux  │ ──▶ │ux-prompts │
└─────────┘     └─────────────┘   └─────────┘     └───────────┘
    │                 │                │                │
    ▼                 ▼                ▼                ▼
 PRD.md         Clarified         UX-Specs.md    UX-Prompts.md
               Session.md
```

| Phase | Skill | Purpose | Output |
|-------|-------|---------|--------|
| 1 | `/mvp-prd` | Generate structured PRD from V3 vision | `PRD.md` |
| 2 | `/prd-clarify` | Refine PRD through structured Q&A | `PRD-clarification-session.md` |
| 3 | `/prd-ux` | Translate to UX spec (6 designer passes) | `UX-Specs.md` |
| 4 | `/ux-prompts` | Generate build-order prompts for UI tools | `UX-Prompts.md` |

---

## Workflow Progress

| Phase | Status | Task Guide | Output |
|-------|--------|------------|--------|
| 1. PRD Generation | ✅ Complete | [01-mvp-prd-task.md](tasks/01-mvp-prd-task.md) | `PRD.md` |
| 2. PRD Clarification | ✅ Complete | [02-prd-clarify-task.md](tasks/02-prd-clarify-task.md) | `PRD-clarification-session.md` |
| 3. UX Specification | ✅ Complete | [03-prd-ux-task.md](tasks/03-prd-ux-task.md) | `UX-Specs.md` |
| 4. Build Prompts | ✅ Complete | [04-ux-prompts-task.md](tasks/04-ux-prompts-task.md) | `UX-Prompts.md` |

> Update status as phases complete: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## Context References

### Existing Documentation
| Document | Purpose | Location |
|----------|---------|----------|
| V1 Spec | Current customer ordering flow | [docs/v1-spec.md](../../v1-spec.md) |
| V2 Spec | Driver/tracking/analytics features | [docs/v2-spec.md](../../v2-spec.md) |
| Design System | Colors, typography, motion tokens | [docs/frontend-design-system.md](../../frontend-design-system.md) |
| Component Guide | Existing UI patterns | [docs/component-guide.md](../../component-guide.md) |
| Context Pack | Business rules, personas, flows | [docs/00-context-pack.md](../../00-context-pack.md) |

### Design System Quick Reference
```css
/* Brand Colors */
--color-saffron: #D4A017      /* Primary gold */
--color-curry: #8B4513        /* Warm brown */
--color-lotus: #FFE4E1        /* Soft pink */
--color-jade: #2E8B57         /* Success green */
--color-charcoal: #1A1A1A     /* Text */
--color-cream: #FFFEF7        /* Background */

/* Typography */
Display: "Playfair Display" (elegant serif)
Body: "DM Sans" (geometric, readable)
Burmese: "Padauk" / "Noto Sans Myanmar"
```

---

## Quality Criteria

### Must Have
- [ ] Mobile-first responsive design
- [ ] Warm, premium Burmese aesthetic
- [ ] Fast, intuitive ordering flow (Panda Express-level)
- [ ] Clear visual hierarchy and affordances
- [ ] Proper loading/error/empty states
- [ ] Accessibility (WCAG 2.1 AA)

### Must Avoid
- [ ] Generic AI aesthetics (Inter font, purple gradients)
- [ ] Desktop-first layouts
- [ ] Missing state handling
- [ ] Confusing navigation
- [ ] Slow, friction-heavy flows

---

## How to Use This Workflow

1. **Start Phase 1**: Navigate to [01-mvp-prd-task.md](tasks/01-mvp-prd-task.md) and follow the guide to invoke `/mvp-prd`

2. **Complete Each Phase**: Follow the task guide, invoke the skill, and generate the output artifact

3. **Update Progress**: After completing each phase, update the progress table above

4. **Sequential Execution**: Complete phases in order — each phase depends on the previous output

5. **Review Outputs**: Each generated artifact should be reviewed before proceeding to the next phase

---

## Build Implementation

After completing the 4-phase UX pipeline, implementation proceeds via sprint-organized build tasks using the `/frontend-design` skill.

### Build Task Files

| Sprint | Focus | Tasks | Status |
|--------|-------|-------|--------|
| [Sprint-1-Foundation.md](build-tasks/Sprint-1-Foundation.md) | Design tokens, layouts | 7 | 🔄 In Progress |
| [Sprint-2-Base-Components.md](build-tasks/Sprint-2-Base-Components.md) | Buttons, inputs, cards | 6 | ⬜ Not Started |
| [Sprint-3-Cart-Checkout.md](build-tasks/Sprint-3-Cart-Checkout.md) | Cart, checkout flow | 5 | ⬜ Not Started |
| [Sprint-4-Tracking-Driver.md](build-tasks/Sprint-4-Tracking-Driver.md) | Tracking, driver UI | 3 | ⬜ Not Started |
| [Sprint-5-Admin-Interactions.md](build-tasks/Sprint-5-Admin-Interactions.md) | Admin, animations | 6 | ⬜ Not Started |
| [Sprint-6-States-Polish.md](build-tasks/Sprint-6-States-Polish.md) | States, accessibility | 8 | ⬜ Not Started |

**Workflow Guide**: [build-tasks/CLAUDE.md](build-tasks/CLAUDE.md)

---

## Finalized UI Assets

Design prototypes generated from build prompts:

### P1-Foundation (Complete)

| Asset | Description | Files |
|-------|-------------|-------|
| Light Theme | Primary brand colors + components | [HTML](../UI-Assets/P1-Foundation/Light-Theme.html) / [PNG](../UI-Assets/P1-Foundation/Light-Theme.png) |
| Dark Theme | Dark mode with warm undertones | [HTML](../UI-Assets/P1-Foundation/Dark-Theme.html) / [PNG](../UI-Assets/P1-Foundation/Dark-Theme.png) |
| Vibrant Heritage | Alternate warm palette | [HTML](../UI-Assets/P1-Foundation/Vibrant-Heritage.html) / [PNG](../UI-Assets/P1-Foundation/Vibrant-Heritage.png) |

### Finalized Design Tokens (from UI Assets)

```css
/* Brand Colors (updated from finalized assets) */
--primary: #9B1B1E;           /* Bold Red from logo */
--cta: #F4D03F;               /* Bright Gold from logo */
--curry: #8B4513;             /* Warm brown accent */
--jade: #2E8B57;              /* Success green */
--cream: #FFFEF7;             /* Light background */
--charcoal: #1A1A1A;          /* Primary text */
--background-dark: #1a0505;   /* Dark mode background */

/* Typography */
Display: "Manrope" (sans-serif, bold headings)
Serif: "Playfair Display" (elegant accents)
Body: "DM Sans" (readable, geometric)
Burmese: "Padauk" (Myanmar script)
```

---

## Generated Artifacts

All outputs are organized as follows:

```
docs/V3/
├── UX-Specs/
│   ├── CLAUDE.md                          # This file
│   ├── PRD.md                             # Phase 1 output
│   ├── PRD-clarification-session.md       # Phase 2 output
│   ├── UX-Specs.md                        # Phase 3 output
│   ├── UX-Prompts.md                      # Phase 4 output
│   ├── tasks/
│   │   ├── 01-mvp-prd-task.md
│   │   ├── 02-prd-clarify-task.md
│   │   ├── 03-prd-ux-task.md
│   │   └── 04-ux-prompts-task.md
│   └── build-tasks/
│       ├── CLAUDE.md                      # Build workflow guide
│       ├── Sprint-1-Foundation.md
│       ├── Sprint-2-Base-Components.md
│       ├── Sprint-3-Cart-Checkout.md
│       ├── Sprint-4-Tracking-Driver.md
│       ├── Sprint-5-Admin-Interactions.md
│       └── Sprint-6-States-Polish.md
└── UI-Assets/
    └── P1-Foundation/
        ├── Light-Theme.html/.png
        ├── Dark-Theme.html/.png
        └── Vibrant-Heritage.html/.png
```
