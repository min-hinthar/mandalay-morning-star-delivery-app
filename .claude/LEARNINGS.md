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

---

## 2026-01-17: useCart hook API

**Context:** Building CustomerLayout with cart bar
**Learning:** `useCart()` returns `estimatedTotal` not `total`. Full API: `itemCount`, `items`, `itemsSubtotal`, `estimatedDeliveryFee`, `estimatedTotal`, `isEmpty`, `formattedSubtotal`, etc.
**Apply when:** Accessing cart totals in components

---

## 2026-01-17: V3 Design Token System

**Context:** Implementing Sprint-1 foundation tokens
**Learning:** CSS custom properties go in `src/styles/tokens.css`. Use `var(--color-*)` for colors, `var(--space-*)` for spacing. Dark mode uses warm undertones (`#1A1918` background, `#3D3B38` borders) - never cold grays. Import tokens before animations in globals.css.
**Apply when:** Creating new components or updating theme

---

## 2026-01-17: Layout component directory

**Context:** Creating app shell layouts
**Learning:** New layouts go in `src/components/layouts/` (plural), not `src/components/layout/` (singular, legacy). Export from barrel file `index.ts`. Existing `layout/` has header.tsx, nav-links.tsx, mobile-menu.tsx.
**Apply when:** Adding new layout wrappers or app shells

