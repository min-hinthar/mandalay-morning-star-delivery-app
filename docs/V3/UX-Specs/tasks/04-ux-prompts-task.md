# Phase 4: Build-Order Prompts

> **Skill**: `/ux-prompts`
> **Input**: `docs/V3/UX-Specs/UX-Specs.md`
> **Output**: `docs/V3/UX-Specs/UX-Prompts.md`

---

## Purpose

Transform the UX specification into sequenced, self-contained prompts optimized for UI generation tools (v0, Bolt, Claude `/frontend-design`, etc.). Each prompt is atomic and includes all context needed for implementation.

---

## Inputs Required

- Completed UX specification from Phase 3 (`docs/V3/UX-Specs/UX-Specs.md`)
- Target UI generation tool preference (optional)

---

## How to Invoke

Run the following command:

```
/ux-prompts
```

When prompted, provide the UX spec location:

```
docs/V3/UX-Specs/UX-Specs.md
```

---

## Build Order Sequence

Prompts are generated in dependency order:

```
1. Foundation
   └── Design tokens, theme setup, base styles

2. Layout Shell
   └── Page structures, navigation, containers

3. Core Components
   └── Buttons, cards, inputs, modals

4. Interactions
   └── Hover states, click behaviors, transitions

5. States & Feedback
   └── Loading, empty, error, success states

6. Polish
   └── Animations, micro-interactions, refinements
```

---

## Prompt Characteristics

Each generated prompt will be:

| Property | Description |
|----------|-------------|
| **Self-Contained** | Includes ALL context — no "see previous" references |
| **Atomic** | Focuses on ONE component or feature |
| **Specific** | Includes exact measurements, colors, states |
| **Dependency-Aware** | Lists what must exist before this prompt |
| **Testable** | Clear success criteria |

---

## Example Prompt Format

```markdown
## Prompt 3: Menu Category Card

**Dependencies**: Design tokens (Prompt 1), Card base component (Prompt 2)

**Component**: Menu category card for the customer ordering flow

**Specifications**:
- Size: 280px × 180px (desktop), full-width (mobile)
- Background: var(--color-cream) with subtle shadow
- Border radius: 12px
- Image: 16:9 aspect ratio, lazy loaded
- Typography:
  - Category name: Playfair Display, 20px, var(--color-charcoal)
  - Item count: DM Sans, 14px, var(--color-curry)

**States**:
- Default: As specified above
- Hover: Slight scale (1.02), shadow increase
- Loading: Skeleton with shimmer animation
- Empty: "Coming soon" overlay

**Interactions**:
- Click: Navigate to category page
- Hover: 150ms ease-out transition

**Accessibility**:
- Role: button (since it's clickable)
- Keyboard: Enter/Space to activate
- Focus: Visible focus ring using var(--color-saffron)
```

---

## Expected Output

A document containing:

1. **Overview**: Summary of all prompts and dependencies
2. **Dependency Graph**: Visual showing prompt order
3. **Numbered Prompts**: 15-40 atomic prompts depending on scope
4. **Verification Checklist**: Ensures all UX spec elements are covered

---

## Quality Checklist

Before using the prompts, verify:

- [ ] Every UX spec element has a corresponding prompt
- [ ] No prompt references "previous" context
- [ ] Dependencies are explicitly listed
- [ ] All measurements are exact (no "approximately")
- [ ] All three experiences (customer/driver/admin) are covered
- [ ] States from Phase 3 are included in relevant prompts
- [ ] Design system tokens are used consistently

---

## Output Location

Save the build-order prompts to:

```
docs/V3/UX-Specs/UX-Prompts.md
```

---

## Using the Prompts

After generation, use prompts with your preferred UI tool:

| Tool | How to Use |
|------|------------|
| **v0** | Paste prompt directly into v0.dev |
| **Bolt** | Use prompt as Bolt input |
| **Claude /frontend-design** | Run `/frontend-design` and paste prompt |
| **Manual** | Use as implementation specification |

**Tip**: Execute prompts in order — later prompts depend on earlier ones being complete.

---

## Workflow Complete

After this phase, you have:

```
docs/V3/UX-Specs/
├── CLAUDE.md                          # Workflow guide
├── PRD.md                             # Phase 1: Requirements
├── PRD-clarification-session.md       # Phase 2: Refined requirements
├── UX-Specs.md                        # Phase 3: UX foundations
├── UX-Prompts.md                      # Phase 4: Build prompts
└── tasks/                             # This guide and others
```

You're now ready to build the V3 UI using the generated prompts!
