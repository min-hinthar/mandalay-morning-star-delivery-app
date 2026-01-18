# Session Learnings

Patterns, conventions, and insights discovered while working on this codebase.

---

## 2026-01-17: Skill/Hook file interpolation

**Context:** Implementing shared prompt between skill and hook using `{{file:...}}` syntax
**Learning:** `{{file:.claude/prompts/foo.md}}` template syntax is NOT expanded in SKILL.md or hook .md files. Must inline content directly.
**Apply when:** Creating skills or hooks that need to share logic - duplicate the content or use a different sharing mechanism

---

## 2026-01-17: UI Assets directory structure

**Context:** Adding design assets from external sources (Google Stitch exports)
**Learning:** UI Assets live in `docs/V3/UI-Assets/P1-Foundation/`, not root `V3/`. Naming convention: `PascalCase-Hyphenated` folders (e.g., `Cart-Overview-1/`, `Design-Tokens-2/`). Each contains `code.html` + `screen.png`.
**Apply when:** Adding new design prototypes or referencing assets in build-tasks

