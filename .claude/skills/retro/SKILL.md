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
