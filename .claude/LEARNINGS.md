# Session Learnings

Patterns, conventions, and insights discovered while working on this codebase.

---

## 2026-01-17: Skill/Hook file interpolation

**Context:** Implementing shared prompt between skill and hook using `{{file:...}}` syntax
**Learning:** `{{file:.claude/prompts/foo.md}}` template syntax is NOT expanded in SKILL.md or hook .md files. Must inline content directly.
**Apply when:** Creating skills or hooks that need to share logic - duplicate the content or use a different sharing mechanism

