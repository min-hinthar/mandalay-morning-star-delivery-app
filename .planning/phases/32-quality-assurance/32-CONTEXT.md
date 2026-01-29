# Phase 32: Quality Assurance - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete documentation, testing, and regression prevention for the v1.3 token consolidation work. Ensure all tokens are documented with visual examples, theme testing validates both modes, ESLint rules prevent regression, and visual tests catch unintended changes. Fix any text/background contrast violations found during audit.

</domain>

<decisions>
## Implementation Decisions

### Documentation Style
- Storybook for token documentation (interactive stories)
- All token categories documented: colors, shadows, blur, motion, spacing, typography, z-index
- Depth per token: visual swatch + token name + Tailwind class + usage guidance
- Theme display: toggle-only (use Storybook's theme switcher, not side-by-side)

### Testing Approach
- Both automated snapshots AND manual visual review
- Manual review covers all user-facing pages: homepage, menu, cart, checkout, tracking, auth
- Full visual audit checklist: contrast, gradients, shadows, hover states, borders
- Failed contrast reported in single audit document (not separate issues)

### Regression Prevention
- All token ESLint rules upgraded to error level (z-index, colors, shadows, blur)
- CI hard fails on any token violation — no exceptions
- Pre-commit hook via Husky + lint-staged catches violations before commit
- Zero violations required — any violation is a regression

### Visual Testing Scope
- Playwright visual regression tests for: Hero section, homepage, menu page, cart, checkout
- Viewport sizes: 375px (mobile) and 1440px (desktop)
- Light mode only in automated tests — dark mode via manual review
- Baseline images stored in repo (committed to git)

### Text/Background Contrast Audit
- WCAG AAA standard (7:1 contrast ratio)
- Manual + automated approach: Lighthouse/axe scans first, then manual for gradients/overlays
- Gradient backgrounds included — text must pass against darkest/lightest gradient point
- Fix all violations immediately in Phase 32 (not deferred)

### Claude's Discretion
- Storybook story organization and naming conventions
- Specific checklist format for manual review
- Playwright test structure and helper utilities
- Lighthouse/axe integration approach

</decisions>

<specifics>
## Specific Ideas

- User explicitly requested audit of all text/bg combinations to ensure no blending
- WCAG AAA is stricter than typical — user prioritizes high accessibility
- All fixes happen in this phase, not deferred

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-quality-assurance*
*Context gathered: 2026-01-28*
