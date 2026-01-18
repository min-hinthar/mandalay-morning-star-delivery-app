---
description: Capture session learnings manually (use when session may not end cleanly or for mid-session retrospective)
---

# Session Retrospective

Review this session and capture learnings. Be selective - only log insights worth preserving.

## Tasks

1. **Error Patterns** - If errors occurred:
   - Check `.claude/ERROR_HISTORY.md` for existing entries
   - Add new entries only if: error spans >2 files, non-obvious root cause, or likely to recur
   - Use existing format (date, type, severity, files, error, root cause, fix)

2. **Learnings** - Update `.claude/LEARNINGS.md` with:
   - Patterns that worked well in this codebase
   - Conventions discovered (naming, structure, data flow)
   - Gotchas or anti-patterns to avoid
   - Skip obvious/generic knowledge

3. **CLAUDE.md Updates** - If session revealed:
   - New verification commands needed
   - Additional paths worth documenting
   - MCP tool usage patterns

## Format for LEARNINGS.md

```markdown
## YYYY-MM-DD: [Brief Topic]

**Context:** [What was being done]
**Learning:** [Key insight]
**Apply when:** [Trigger conditions]
```

## Guidelines

- Terse, imperative language
- Skip if nothing notable happened
- Don't duplicate existing entries
- Prefer updating existing sections over adding new ones

## What to Log (Specific Examples)

**LEARNINGS.md - Log these:**
| Category | Example | Why Worth Logging |
|----------|---------|-------------------|
| Hook API | `useCart.estimatedTotal` not `total` | Prevents repeated debugging |
| Path conventions | `layouts/` (new) vs `layout/` (legacy) | Avoids file placement errors |
| Token migrations | `--color-cta` → `--color-interactive-primary` | Reference for consistency |
| Test mocks | IntersectionObserver mock pattern | Saves setup time |
| TypeScript quirks | `as const` for Framer Motion variants | Prevents type errors |

**ERROR_HISTORY.md - Log these:**
- Dynamic route slug conflicts
- RLS bypass requirements
- Serverless function flush patterns
- Import path mismatches

## Skill Update Triggers

**Add to `/frontend-design`:**
- New Framer Motion pattern used 2+ times
- New accessibility pattern discovered
- New test resilience pattern

**Add to `/prd-clarify`:**
- Question that revealed major scope change
- Question type that should always be asked

**Add to `/prd-ux`:**
- New state design pattern
- New affordance rule

## Common Patterns to Watch

**TypeScript/React:**
- File casing on Windows (case-insensitive FS vs case-sensitive imports)
- React 19 namespace changes (`JSX.Element` → `ReactElement`)
- Next.js 16+ instrumentation patterns

**Framer Motion:**
- `as const` for variant types
- `useReducedMotion` for accessibility
- Spring configs for natural feel

**Testing:**
- jsdom missing APIs (ResizeObserver, matchMedia, IntersectionObserver)
- Playwright exact matching (`{ exact: true }`)
- Avoid class-based assertions
