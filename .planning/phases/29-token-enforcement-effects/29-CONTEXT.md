# Phase 29: Token Enforcement - Effects - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize all shadow, blur, and motion timing values to use semantic design tokens. Replace hardcoded values with token references. All visual effects use consistent, theme-aware token system.

</domain>

<decisions>
## Implementation Decisions

### Shadow Tokens

**Scale:**
- 5 intensity levels: xs, sm, md, lg, xl
- Plus shadow-none as explicit zero token

**Naming:**
- Size scale (shadow-sm, shadow-lg) for general use
- Semantic aliases (shadow-card, shadow-modal) mapping to sizes
- Hover variants (shadow-card-hover, shadow-button-hover) with intensified values

**Dark mode:**
- Inverted behavior: shadows become subtle glows in dark mode
- Glow color matches component context (neutral = white glow, primary button = primary glow)

**Color variants:**
- Full semantic set: shadow-primary, shadow-success, shadow-warning, shadow-error
- Inner shadows (shadow-inner-*) for pressed states and inputs

**Structure:**
- Compound shadow tokens (shadow-elevated uses multiple layered shadows for realistic depth)
- Ring shadows remain separate (ring-* utilities distinct from shadow-*)
- Text shadows included: text-shadow-sm, text-shadow-md

### Blur Tokens

**Scale:**
- 4 intensity levels: sm, md, lg, xl
- Plus blur-none as explicit zero token

**Naming:**
- Size scale (blur-sm, blur-lg) for general use
- Semantic aliases (blur-overlay, blur-glass) mapping to sizes

**Scope:**
- Both backdrop-blur and regular blur tokens
- Dark mode uses slightly stronger blur for better contrast

**Glass morphism:**
- Compound tokens: blur-glass includes blur + saturate + brightness
- Themed tint included: blur-glass-surface, blur-glass-elevated have appropriate bg tint

**Accessibility:**
- Keep blur regardless of prefers-reduced-motion (blur is static, not motion)

### Motion Timing

**Duration scale:**
- 5 levels: instant (~0ms/token), fast (75ms), normal (150ms), slow (300ms), slower (500ms+)
- Plus duration-none as explicit 0ms token

**Naming:**
- Speed scale (duration-fast, duration-slow) for general use
- Semantic aliases (duration-modal, duration-tooltip) for component consistency
- Delay tokens: delay-sm, delay-md, delay-lg for stagger patterns

**Easing:**
- 5+ curves including spring/bounce for playful UI
- Standard: ease-in, ease-out, ease-in-out
- Playful: ease-spring, ease-bounce, ease-elastic

**Structure:**
- Duration and easing as separate tokens (combined manually, not compound)
- Dual export: CSS variables AND Framer Motion-compatible objects in motion-tokens.ts

**Accessibility:**
- Reduced motion: minimal duration (50ms) instead of zero — keeps context without fancy effects

### Enforcement Approach

**Severity:**
- ESLint rules at error level (block commits)

**Edge cases:**
- Documented exceptions allowed with ESLint disable + comment explaining why

**Detection scope - Shadows:**
- Full detection: arbitrary values, inline boxShadow, and non-token shadow-* utilities

**Detection scope - Blur:**
- Tailwind arbitrary values and inline backdrop-filter/filter

**Detection scope - Motion:**
- Full detection: Tailwind arbitrary, inline CSS, AND Framer Motion transition props

**Audit:**
- Comprehensive migration audit script
- Baseline count documented before migration
- Target: zero violations

### Claude's Discretion
- Exact pixel values for each shadow/blur level
- Specific easing curve definitions
- Order of migration (shadows first vs blur first vs motion first)
- How to structure the token file exports

</decisions>

<specifics>
## Specific Ideas

- Dark mode shadows become glows — similar to how Apple handles elevation in dark mode
- Spring/bounce easing for the "playful UI" design language from v1.2
- Framer Motion integration via dual export keeps existing animation patterns working

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 29-token-enforcement-effects*
*Context gathered: 2026-01-27*
