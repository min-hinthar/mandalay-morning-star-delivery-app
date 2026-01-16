# Phase 1: PRD Generation

> **Skill**: `/mvp-prd`
> **Output**: `docs/V3/UX-Specs/PRD.md`

---

## Purpose

Convert the V3 UX vision into a structured Product Requirements Document (PRD) with 7 sections. This establishes the foundation for all subsequent UX work.

---

## Inputs Required

Before invoking the skill, gather:

### 1. V3 Goals
- What UX problems from V2 need solving?
- What new capabilities should V3 enable?
- What's the success metric for the redesign?

### 2. User Pain Points (from V2)
- Customer: Where do users get confused or drop off?
- Driver: What mobile experience friction exists?
- Admin: What dashboard workflows are inefficient?

### 3. Personas (reference: [docs/00-context-pack.md](../../../00-context-pack.md))
- **Aye Aye** (Customer): Busy professional, Saturday meal planning
- **Thiri** (Driver): Part-time delivery, needs efficient mobile app
- **Naing** (Admin): Kitchen manager, needs order visibility

### 4. Competitive Reference
- Panda Express web ordering (fast, intuitive)
- DoorDash/Uber Eats (mobile-first tracking)
- Modern food delivery admin dashboards

---

## How to Invoke

Run the following command:

```
/mvp-prd
```

When prompted, provide context like:

```
I want to create a PRD for V3 of Mandalay Morning Star, a Saturday-only
Burmese food delivery app. We're redesigning the entire UX across three
experiences: customer ordering, driver mobile app, and admin dashboard.

Key V3 goals:
- World-class ordering flow rivaling Panda Express
- Frictionless driver mobile experience with offline support
- Efficient admin dashboard with real-time insights

The app currently has V1 (ordering) and V2 (driver/tracking) complete.
We want to elevate the UI/UX to premium quality while maintaining our
warm Burmese aesthetic.

Reference docs:
- Business context: docs/00-context-pack.md
- V1 features: docs/v1-spec.md
- V2 features: docs/v2-spec.md
- Design system: docs/frontend-design-system.md
```

---

## Expected Output

The skill will generate a PRD with 7 sections:

| Section | Content |
|---------|---------|
| 1. Problem | One-sentence problem statement |
| 2. Demo Goal | Success criteria for V3 |
| 3. Target User | Role-based user definitions |
| 4. Core Use Case | Happy path flow for each experience |
| 5. Functional Decisions | Required capabilities table |
| 6. UX Decisions | Entry points, inputs, outputs, feedback |
| 7. Data & Logic | Inputs, processing, outputs |

---

## Quality Checklist

Before proceeding to Phase 2, verify:

- [ ] Problem statement is clear and specific
- [ ] Demo goals are measurable
- [ ] All three experiences (customer/driver/admin) are covered
- [ ] Core use cases describe complete happy paths
- [ ] Functional decisions align with existing V1/V2 capabilities
- [ ] UX decisions reference the established design system
- [ ] No generic placeholder content

---

## Output Location

Save the generated PRD to:

```
docs/V3/UX-Specs/PRD.md
```

---

## Next Step

After completing this phase, proceed to:
**[Phase 2: PRD Clarification](02-prd-clarify-task.md)**
