# Phase 27: Token Enforcement - Colors - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all hardcoded color values with semantic design tokens. This includes text colors, background colors, borders, shadows, and gradients. Both light and dark themes must render correctly after migration. ESLint rules enforce zero violations.

</domain>

<decisions>
## Implementation Decisions

### Token Mapping - Text Colors
- General text: `text-foreground` (not text-primary)
- Muted/secondary text: `text-muted-foreground` (not opacity-based)
- Placeholder text: `placeholder:text-muted-foreground`

### Token Mapping - Background Colors
- General backgrounds: `bg-background`
- Overlay/backdrop: `bg-overlay` token (create dedicated token with appropriate opacity)
- Hover states: `hover:bg-accent`
- Skeleton/loading: `bg-skeleton` token (create dedicated token)
- Selection/highlight: `selection` token (create dedicated token)

### Token Mapping - Other Elements
- Borders: `border-border`
- Shadows: Use shadow tokens (shadow-sm, shadow-md, etc.)
- Focus rings: `ring-ring`
- Disabled states: `text-disabled`, `bg-disabled` tokens

### Token Mapping - Contrast
- Text on colored backgrounds (buttons, badges): Use contrast tokens (btn-foreground, badge-foreground)

### Edge Cases - Brand & Status
- Brand orange (#F97316): Tokenize as `primary` (bg-primary, text-primary-foreground)
- Status colors: Use semantic tokens (text-success, bg-destructive, text-warning)
- Decorative elements: Tokenize all — even decorative should adapt to theme

### External Libraries
- Library components with hardcoded colors: Create wrapper components that apply token styles

### Gradient Conversion
- Hero gradients: Two gradient classes (gradient-hero-light, gradient-hero-dark) applied conditionally
- Card/surface gradients: Keep gradients but make theme-aware (lighter in light mode, darker in dark mode)
- Button gradients: Theme-specific variants (different gradients for light vs dark)
- Text gradients: Theme-aware (shift colors for readability)
- Gradient direction: Component decides based on layout
- Gradient definitions: Tailwind config utilities (bg-gradient-hero, etc.)
- Browser fallbacks: Not needed — modern browsers all support gradients

### Verification Workflow
- Theme verification: Batch fixes, then one verification pass per batch
- Theme priority: Equal — both light and dark must look equally good
- Violation handling: Fix immediately — no TODO comments or tracking files
- Build enforcement: ESLint errors block build — zero tolerance
- Visual comparison: Manual inspection (no Playwright screenshots)
- Rollback strategy: Fix forward — don't revert, fix issues in new commits

### Claude's Discretion
- Exact token shade selection when multiple valid options exist
- Order of file migration within each batch
- New token naming conventions when creating overlay/skeleton/selection/disabled tokens

</decisions>

<specifics>
## Specific Ideas

- Brand orange is the primary color — use primary token everywhere it appears
- Both themes must be equally polished — no "dark mode afterthought"
- Gradients defined in Tailwind config for consistent naming

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-token-enforcement-colors*
*Context gathered: 2026-01-27*
