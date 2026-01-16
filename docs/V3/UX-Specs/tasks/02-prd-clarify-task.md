# Phase 2: PRD Clarification

> **Skill**: `/prd-clarify`
> **Input**: `docs/V3/UX-Specs/PRD.md`
> **Output**: `docs/V3/UX-Specs/PRD-clarification-session.md`

---

## Purpose

Systematically refine the PRD through structured questioning. This phase identifies ambiguities, gaps, and edge cases that could cause problems during implementation.

---

## Inputs Required

- Completed PRD from Phase 1 (`docs/V3/UX-Specs/PRD.md`)
- Willingness to answer 5-35 questions depending on depth selected

---

## How to Invoke

Run the following command:

```
/prd-clarify
```

When prompted for the PRD location, provide:

```
docs/V3/UX-Specs/PRD.md
```

---

## Depth Selection

The skill will ask you to choose a depth level:

| Depth | Questions | Best For |
|-------|-----------|----------|
| **Quick** | 5-10 | Simple features, tight timelines |
| **Medium** | 10-20 | Standard features, balanced coverage |
| **Long** | 20-30 | Complex features, thorough analysis |
| **Ultralong** | 30-35 | Critical systems, maximum rigor |

**Recommendation for V3**: Choose **Long** or **Ultralong** since this is a full UX redesign affecting all three experiences.

---

## Question Priority

The skill prioritizes questions in this order:

1. **Critical Path** — Blockers that would break the core flow
2. **High Ambiguity** — Unclear requirements open to interpretation
3. **Integration** — How V3 fits with existing V1/V2 features
4. **Edge Cases** — Unusual scenarios and error handling
5. **Non-Functional** — Performance, accessibility, security
6. **User Journey Gaps** — Missing steps in the experience

---

## Expected Process

1. Skill reads the PRD and identifies gaps
2. You select depth level via visual UI
3. Skill asks questions one at a time using `AskUserQuestion`
4. Your answers are recorded in the tracking document
5. Skill adapts follow-up questions based on your answers
6. Final summary highlights remaining ambiguities

---

## Quality Checklist

Before proceeding to Phase 3, verify:

- [ ] All critical path questions answered
- [ ] High ambiguity areas clarified
- [ ] Edge cases for all three experiences documented
- [ ] Error handling approaches defined
- [ ] Integration with existing features addressed
- [ ] Tracking document reflects all Q&A pairs

---

## Output Location

The clarification session will be saved to:

```
docs/V3/UX-Specs/PRD-clarification-session.md
```

This document tracks:
- All questions asked
- Your answers
- Progress through the session
- Final summary and recommendations

---

## Tips for Good Answers

- **Be specific**: "Users can retry payment up to 3 times" not "Users can retry"
- **Reference existing behavior**: "Same as V2 tracking page" when applicable
- **State constraints**: "Must work offline" or "Desktop only for admin"
- **Identify unknowns**: Say "Need to research" rather than guessing

---

## Next Step

After completing this phase, proceed to:
**[Phase 3: UX Specification](03-prd-ux-task.md)**
