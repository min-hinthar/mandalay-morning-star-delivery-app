# CLAUDE.md — V4 Build Tasks Workflow Guide

> **Purpose**: Guide Claude through implementing V4 refinements using the `/frontend-design` skill
> **Source**: UX-Prompts.md (28 prompts organized into 4 sprints)
> **Scope**: Bug fixes, consistency, polish, and performance optimization
> **Quality Bar**: 95%+ design quality, no bugs, 100% token usage, 60fps animations

---

## Overview

This directory contains sprint-organized build tasks that map the 28 UX prompts from `UX-Prompts.md` into actionable implementation sprints. V4 is a **refinement pass** — no new features, just fixes and polish.

---

## Sprint Organization

| Sprint | Focus | Prompts | Tasks | Dependencies |
|--------|-------|---------|-------|--------------|
| **1** | Bug Fixes | 1-7 | 7 | None (start here, highest priority) |
| **2** | Consistency | 8-15 | 8 | Sprint 1 |
| **3** | Polish | 16-22 | 7 | Sprints 1-2 |
| **4** | Performance & Docs | 23-28 | 6 | Sprints 1-3 |

**Total**: 28 tasks across 4 sprints

---

## Sprint Progress

| Sprint | Status | Tasks Completed |
|--------|--------|-----------------|
| Sprint 1: Bug Fixes | ⬜ Not Started | 0/7 |
| Sprint 2: Consistency | ⬜ Not Started | 0/8 |
| Sprint 3: Polish | ⬜ Not Started | 0/7 |
| Sprint 4: Performance & Docs | ⬜ Not Started | 0/6 |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## Priority Order

Per clarification session Q35:
1. **Bugs first** — Fix blockers before anything else
2. **Consistency second** — Standardize tokens and components
3. **Polish third** — Add premium animations and interactions
4. **Performance last** — Optimize after features stable

---

## Risk Batching (Release Strategy)

Per clarification session Q31, batch by risk:

| Risk Level | Tasks | Ship When |
|------------|-------|-----------|
| **Low** | Token audit (2.6), linting rules (2.7), docs (4.5, 4.6) | Immediately |
| **Medium** | Component rewrites (2.1, 2.2), animation changes (3.1-3.5) | After unit tests |
| **High** | Checkout fix (1.4), header collapse (1.7), A/B infra (3.7) | After E2E tests |

---

## How to Use This Workflow

### Step 1: Start Sprint 1

Begin with [Sprint-1-Bugfixes.md](Sprint-1-Bugfixes.md) — these are blocking issues that prevent normal user flows.

### Step 2: Execute Each Task

For each task in a sprint:

1. **Read the task** — understand what's being fixed/changed
2. **Run `/frontend-design`** — invoke the skill
3. **Paste the prompt content** — use the complete prompt from the task
4. **Review generated code** — ensure it meets specifications
5. **Run tests** — `pnpm typecheck && pnpm test`
6. **Mark task complete** — update the sprint file

### Step 3: Verify Sprint

Before moving to the next sprint:
- [ ] All tasks completed
- [ ] TypeScript clean
- [ ] Tests passing
- [ ] E2E tests for bug fixes (Sprint 1)
- [ ] Visual review in light AND dark mode

### Step 4: Proceed to Next Sprint

Move to the next sprint only after the current one is complete.

---

## Output Locations

Components and files should be placed in these directories:

| Category | Output Directory |
|----------|-----------------|
| Hooks | `src/lib/hooks/` |
| Animations | `src/lib/micro-interactions.ts` |
| UI Components | `src/components/ui/` |
| Layout Components | `src/components/layouts/` |
| Menu Components | `src/components/menu/` |
| Cart Components | `src/components/cart/` |
| Design Tokens | `src/styles/tokens.css` |
| CSS Utilities | `src/styles/` |
| E2E Tests | `tests/e2e/` |

---

## Sprint Files

| File | Description |
|------|-------------|
| [Sprint-1-Bugfixes.md](Sprint-1-Bugfixes.md) | Critical bug fixes (7 tasks) |
| [Sprint-2-Consistency.md](Sprint-2-Consistency.md) | Token and component standardization (8 tasks) |
| [Sprint-3-Polish.md](Sprint-3-Polish.md) | Animations and premium feel (7 tasks) |
| [Sprint-4-Performance.md](Sprint-4-Performance.md) | Performance optimization and docs (6 tasks) |

---

## Quality Checklist

Before marking any sprint complete:

### Technical
- [ ] TypeScript strict mode (no `any`)
- [ ] All components use design tokens (no hardcoded values)
- [ ] Framer Motion for animations
- [ ] Proper accessibility (ARIA labels, focus states)
- [ ] Mobile-first responsive
- [ ] Reduced motion respected

### Visual
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] No layout shifts (CLS)
- [ ] 60fps animations

### Testing
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] E2E tests for Sprint 1 bug fixes
- [ ] Visual review at 375px, 768px, 1024px, 1440px

---

## Using `/frontend-design` Skill

The `/frontend-design` skill creates production-grade UI components. When using it:

1. **Reference existing tokens** — point to `src/styles/tokens.css`
2. **Specify output files** — mention exact file paths
3. **Include TypeScript** — ensure proper typing
4. **Paste the full prompt** — don't summarize

### Example Usage

```
/frontend-design

[Paste full prompt content from sprint task]

Output to: src/lib/hooks/useLuminance.ts
Use existing tokens from: src/styles/tokens.css
```

---

## Design System Quick Reference

```css
/* Colors */
--color-primary: #9B1B1E;
--color-cta: #F4D03F;
--color-charcoal: #1A1A1A;
--color-cream: #FFFEF7;
--color-surface: var(--color-cream);
--color-border: rgba(0,0,0,0.1);

/* Spacing */
--space-1: 4px;   --space-4: 16px;   --space-8: 32px;
--space-2: 8px;   --space-6: 24px;   --space-12: 48px;

/* Z-Index (V4 expanded) */
--z-base: 1;
--z-dropdown: 10;
--z-sticky: 20;
--z-overlay: 30;
--z-modal: 40;
--z-tooltip: 50;
--z-toast: 60;

/* Animation */
Spring: stiffness: 400, damping: 25
Shimmer: 1.5s infinite
Pulse: 0.3s once
Stagger: 30ms → 80ms variable
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [UX-Prompts.md](../UX-Prompts.md) | All 28 implementation prompts |
| [UX-Specs.md](../UX-Specs.md) | Full UX specification (6 passes) |
| [PRD.md](../../PRD.md) | Product requirements |
| [PRD-clarification-session.md](../../PRD-clarification-session.md) | 35 Q&A clarifications |
| [V3 build-tasks](../../../V3/UX-Specs/build-tasks/) | Reference from V3 implementation |

---

## Notes

- **Fix bugs first** — users can't test polish if basic flows are broken
- **Test in both modes** — dark mode parity is a V4 requirement
- **Batch by risk** — ship low-risk changes quickly, high-risk after testing
- **Measure quality** — checklist + linting + visual review
