# Design Token Learnings

## Semantic Token Naming vs Usage Intent

`bg-text-primary` uses the text color as a background — in light mode it's dark, in dark mode it's light. Breaks hardcoded `text-white`.

```tsx
// bg-text-primary inverts, text-white doesn't
<section className="bg-text-primary">
  <h3 className="text-white">...</h3>  // Dark mode: invisible

// Use semantic inverse token for contrast
<section className="bg-primary">
  <h3 className="text-text-inverse">...</h3>  // Auto-contrasts
```

Key tokens:
- `text-text-inverse`: White in light mode, black in dark mode
- `bg-footer-bg` / `text-footer-text`: Theme-aware footer pair

**Apply when:** Sections with solid backgrounds needing contrasting text in both themes.

---

## WCAG AA Contrast Ratios

Verify contrast ratios when defining tokens:

| Token pair | Min ratio |
|-----------|-----------|
| Button text on bg | 4.5:1 (AA normal) |
| Muted text on surface | 4.5:1 (target ~6:1) |
| Track/progress bg on card | ~1.3:1 luminance diff |

Values that failed and fixes:
- `#52A52E` (green) on white = ~3.6:1 -> `#3D8B22` (~5.3:1)
- `#6B6B6B` (muted) on white = ~4.8:1 -> `#5C5C5C` (~6:1)
- `#F5F5F5` (surface-tertiary) on white = invisible -> `#EBEBEB`

**Apply when:** Creating or auditing color tokens for text-on-background pairs.

---

## CSS Variables for Theme-Aware Inline Styles

When Tailwind classes don't support exact opacity values, define CSS variable in `tokens.css`:

```css
/* tokens.css */
--color-surface-primary-85: rgba(255, 255, 255, 0.85);
/* dark theme */
--color-surface-primary-85: rgba(0, 0, 0, 0.85);
```

```tsx
style={{ backgroundColor: "var(--color-surface-primary-85)" }}
```

**Apply when:** Glassmorphism effects, custom opacity backgrounds. Prefer tokens.css over component-level CSS variables.

---

## Fallback Code Token Violations

Fallback CSS (non-WebGL, polyfills, error handlers) often has hardcoded values. ESLint catches className violations but misses inline style objects.

```bash
grep -r "zIndex.*[0-9][0-9][0-9]" src/lib src/components --include="*.ts" --include="*.tsx"
```

---

## ESLint Severity for Legacy Migration

Add rules at "warn" first, upgrade to "error" after migration complete. Create migration tracker with violation inventory.
