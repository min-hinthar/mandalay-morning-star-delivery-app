# Phase 3: UX Specification

> **Skill**: `/prd-ux`
> **Input**: Refined PRD from Phase 2
> **Output**: `docs/V3/UX-Specs/UX-Specs.md`

---

## Purpose

Translate the refined PRD into a comprehensive UX specification through 6 forced designer mindset passes. This establishes UX foundations BEFORE any visual design work.

---

## Inputs Required

- Completed and clarified PRD from Phases 1-2
- PRD clarification session document

---

## How to Invoke

Run the following command:

```
/prd-ux
```

When prompted, provide the PRD location:

```
docs/V3/UX-Specs/PRD.md
```

The skill will also reference the clarification session.

---

## The 6 Designer Passes

The skill enforces these passes **in strict order**. No skipping allowed.

### Pass 1: Mental Model
**Questions answered:**
- What is the user trying to accomplish?
- What mental model do they bring?
- What misconceptions might they have?
- How do we align the UI with their expectations?

### Pass 2: Information Architecture
**Questions answered:**
- What concepts/entities exist?
- How should they be grouped?
- What's the visibility priority?
- What's the navigation structure?

### Pass 3: Affordances
**Questions answered:**
- What actions are available?
- What's clickable vs. read-only?
- What's editable vs. display-only?
- How do we signal interactivity?

### Pass 4: Cognitive Load
**Questions answered:**
- Where is friction highest?
- How many choices at each step?
- What causes uncertainty?
- What defaults reduce decisions?

### Pass 5: State Design
**Questions answered:**
- What states exist for each element?
  - Empty state
  - Loading state
  - Success state
  - Partial state
  - Error state
- How do transitions between states work?

### Pass 6: Flow Integrity
**Questions answered:**
- What flow risks exist?
- What must be visible vs. hidden?
- What UX constraints must be enforced?
- How do flows connect across experiences?

---

## Expected Output

A comprehensive UX specification document covering:

| Section | Content |
|---------|---------|
| Mental Models | User intent analysis per experience |
| Information Architecture | Concept groupings, nav structure |
| Affordance Map | Interactive elements catalog |
| Cognitive Load Analysis | Friction points, simplification opportunities |
| State Matrix | All states for all key elements |
| Flow Diagrams | User journeys with decision points |
| UX Constraints | Hard rules that must be enforced |

---

## Quality Checklist

Before proceeding to Phase 4, verify:

- [ ] All 6 passes completed (no skipping)
- [ ] Mental models defined for customer, driver, AND admin
- [ ] Information architecture covers all three experiences
- [ ] Every interactive element has clear affordance signals
- [ ] Cognitive load reduced through smart defaults
- [ ] All states (empty/loading/success/error) documented
- [ ] Flow risks identified with mitigations

---

## Output Location

Save the UX specification to:

```
docs/V3/UX-Specs/UX-Specs.md
```

---

## Important Notes

1. **No Visual Specs Yet**: This phase produces UX foundations, not visual designs
2. **Order Matters**: The 6 passes build on each other — don't skip
3. **Three Experiences**: Ensure customer, driver, and admin are all covered
4. **Reference Design System**: Use existing tokens from `docs/frontend-design-system.md` where relevant

---

## Next Step

After completing this phase, proceed to:
**[Phase 4: Build-Order Prompts](04-ux-prompts-task.md)**
