# Phase 28: Token Enforcement - Layout - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize spacing, typography, and border-radius across the codebase via design tokens. Replace hardcoded values with Tailwind classes and CSS variable tokens. Add ESLint enforcement to prevent regression.

</domain>

<decisions>
## Implementation Decisions

### Spacing Strategy
- Tailwind scale preferred, custom values allowed for edge cases only
- Custom spacing exceptions use CSS variables (not inline arbitrary values)
- gap follows same rules as margin/padding
- Negative margins must also use Tailwind scale
- Page-specific flexibility for container padding (no universal standard)
- Per-section decision for vertical rhythm between major sections
- ESLint enforcement for spacing violations (error level)
- Cards, list items, and form elements all need spacing attention

### Typography Approach
- Tailwind font-size scale, but clamp() allowed for fluid typography
- Font-weight: semantic only (font-normal, font-medium, font-semibold, font-bold)
- Line-height: Tailwind leading-* only (no arbitrary values)
- Letter-spacing: Tailwind tracking-* only
- Text truncation: Tailwind truncate/line-clamp only (no custom line-clamp)
- Heading scale: Large (h1=text-4xl, h2=text-3xl, h3=text-2xl, h4=text-xl)
- Body text: varies by context (cards smaller, pages larger)

### Border-radius Rules
- Full Tailwind scale allowed (rounded-sm through rounded-full)
- Category-based consistency: buttons share one value, inputs share another
- Cards and modals can have different radii based on role
- Custom radii via CSS variables if needed (not inline arbitrary)

### Migration Strategy
- Claude decides optimal migration order
- Fix all spacing inconsistencies within a component at once (not minimal changes)
- Trust build passing for verification (no visual check required)
- Apply token system to 3rd-party component overrides
- Add ESLint rules during phase (not just fix violations)
- Responsive variants (md:p-6, lg:p-8) encouraged
- Batch by component type (all buttons, then all cards, etc.)
- Claude identifies highest-impact areas from audit data

### Claude's Discretion
- Migration order (core primitives vs page layouts)
- Specific ESLint rule configuration
- Which components need most attention
- Container/section spacing values per page

</decisions>

<specifics>
## Specific Ideas

- "I want headings to feel bold and spacious" — large scale (4xl/3xl/2xl)
- Prefer CSS variables for any exceptions rather than inline arbitrary Tailwind
- When a component is touched, standardize ALL its spacing (not just flagged violations)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 28-token-enforcement-layout*
*Context gathered: 2026-01-28*
