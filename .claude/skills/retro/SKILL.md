---
name: retro
description: This skill should be used when the user asks to "capture learnings", "run retrospective", "log what we learned", "update error history", or at the end of a session to capture insights. Reviews session and selectively logs insights worth preserving.
---

# Session Retrospective

Review the current session and capture learnings. Be selective—only log insights worth preserving for future sessions.

## Tasks

### 1. Error Patterns
If errors occurred:
- Check `.claude/ERROR_HISTORY.md` for existing entries
- Add new entries only if: error spans >2 files, non-obvious root cause, or likely to recur
- Use format: date, type, severity, files, error, root cause, fix, prevention

### 2. Learnings — Topic Routing
Route new learnings to the correct topic file in `.claude/learnings/`:

| Topic area | Target file |
|-----------|-------------|
| Tailwind v4, CSS utilities, @theme | `tailwind-v4.md` |
| React context, hydration, portals, Radix | `react-patterns.md` |
| Touch, scroll lock, drawer, bottom sheet | `mobile-ux.md` |
| Framer Motion, GSAP, stacking context | `animation.md` |
| Route groups, redirect, Image, build | `nextjs.md` |
| Semantic tokens, contrast, CSS vars | `design-tokens.md` |
| Mutation owner, cart, debounce | `state-management.md` |
| Invite flow, RLS, metadata | `supabase-auth.md` |
| E2E, mocks, AnimatePresence | `testing.md` |
| ESLint, build, Git casing, component org | `tooling.md` |
| Lazy load, IntersectionObserver, willChange | `performance.md` |

After adding entries:
- Update the "Last Updated" column in `.claude/learnings/INDEX.md`
- If a learning doesn't fit existing topics, create a new topic file and add it to INDEX.md

### 3. Consolidation
Within each modified topic file:
- Merge overlapping entries that cover the same root cause
- Add `**Supersedes:**` field when a new entry replaces an older, narrower one
- Remove entries that are fully superseded
- Keep each topic file under 400 lines

### 4. Staleness Check
Flag entries that may be stale:
- Reference files that no longer exist in the codebase
- Reference patterns/components that have been removed or renamed
- Are >90 days old (check date prefix) — flag for review, don't auto-remove

Report stale entries to user for decision.

### 5. CLAUDE.md Updates
If session revealed:
- New verification commands needed
- Additional paths worth documenting
- MCP tool usage patterns
- Agent strategy improvements

## Entry Format

```markdown
## Brief Topic Title

**Context:** [What was being done]
**Learning:** [Key insight]

[Code example if applicable]

**Supersedes:** [Optional — reference to older entry this replaces]
**Apply when:** [Trigger conditions]
```

## Logging Guidelines

**Log if:**
- Error occurred 2+ times
- Error spans multiple files
- Root cause was non-obvious
- Pattern saved significant time
- Would help future debugging

**Skip if:**
- Simple typo or one-off
- Generic/common knowledge
- Already documented in relevant topic file
- Temporary workaround

## Quick Checklist

- [ ] Check ERROR_HISTORY.md before logging (avoid duplicates)
- [ ] Scan `.claude/learnings/INDEX.md` for existing topic coverage
- [ ] Route to correct topic file (see table above)
- [ ] Update INDEX.md "Last Updated" column
- [ ] Consolidate overlapping entries in modified files
- [ ] Flag stale entries for review
- [ ] Keep topic files under 400 lines

## Quick Reference

### What to Log Where

| Category | Example | Destination |
|----------|---------|-------------|
| Hook/API quirk | `estimatedTotal` not `total` | Topic file in `learnings/` |
| Path convention | `layouts/` vs `layout/` | `learnings/tooling.md` |
| Type pattern | `as const` for variants | `learnings/react-patterns.md` |
| Route conflict | Dynamic segment collision | `ERROR_HISTORY.md` |
| Auth bypass | RLS exception needed | `ERROR_HISTORY.md` |
| Import issue | Path resolution mismatch | `ERROR_HISTORY.md` |
