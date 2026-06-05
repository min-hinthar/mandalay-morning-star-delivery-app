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

---

## Hero "Warm-Paper" Token Family (Anthropic)

Defined in `tokens.css` (`:root`, shared light/dark), mapped to utilities in `globals.css @theme`. Full spec: [`docs/hero-design-language.md`](../../docs/hero-design-language.md).

- **Colors:** `--hero-ink #141413`, `--hero-ink-muted` (use ≥0.7 alpha — 0.58 failed contrast on translucent cream), `--hero-line`, card cream `--hero-card-bg`; accents `--hero-clay #d97757` (book cloth, shapes/CTA), `--hero-accent #9a3412` (deep clay — accent TEXT, AA), `--hero-blue #6a9bcc`, `--hero-sage #788c5d`. **Rule:** triad (clay/blue/sage) on non-text shapes; deep clay for accent text; amber for stars.
- **Fonts (global):** `--font-display` = Fraunces (serif), `--font-body`/`--font-sans` = Hanken Grotesk, `--font-burmese` = Padauk. Loaded via Google Fonts `@import`.
- **Adding a hero color:** add the `--hero-*` var in `tokens.css` → map `--color-hero-*: var(--hero-*)` in `globals.css @theme` → use the `bg-/text-/border-/from-` utility. **Then verify it emits** (`grep` `.next/**/*.css`) — unmapped names silently no-op (transparent). ESLint bans raw white/black/z-index/blur/hex in JSX.
- **Surfaces:** `hero-surface-{glass,vellum,paper}`; grids `hero-dotgrid`/`hero-linegrid` are parameterized via `--dot-*`/`--line-*` vars.
