# Design Token Learnings

## Semantic Token Naming

`bg-text-primary` inverts in dark mode. Use `text-text-inverse` for auto-contrasting text. Footer: `bg-footer-bg` + `text-footer-text`.

---

## WCAG AA Contrast Ratios

Min 4.5:1 for normal text. Failed values and fixes: `#52A52E` → `#3D8B22`, `#6B6B6B` → `#5C5C5C`, `#F5F5F5` → `#EBEBEB`.

---

## CSS Variables for Theme-Aware Inline Styles

Define custom opacity tokens in `tokens.css` (both light/dark), reference via `var(--color-surface-primary-85)`.

---

## Non-Existent Token Names → Transparent

`bg-info` compiles but resolves to nothing. Actual token: `bg-status-info`. Status colors use `status-` prefix. No build error — detect via computed styles showing `transparent`.
