# Phase 15: Foundation & R3F Setup - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix TailwindCSS 4 z-index blocking bug and establish React Three Fiber foundation for 3D work. Delivers working z-index tokens and SSR-safe R3F setup with test page.

</domain>

<decisions>
## Implementation Decisions

### Z-index token structure
- Standard layer count (8-10 layers): base, sticky, dropdown, popover, overlay, modal, toast, tooltip, max
- Hybrid naming convention: `z-modal-10`, `z-dropdown-20` (purpose + tier within)
- Full Tailwind integration: tokens work with arbitrary value syntax `z-[modal-10]`
- Document tokens in codebase: comment block in tailwind config
- Migrate ALL existing hardcoded z-index values to tokens (not just bug fixes)
- Known issue: clicks pass through dropdown — investigate stacking context
- Multiple z-index issues exist across components — comprehensive audit needed

### R3F test page location
- Styled preview that hints at final hero aesthetic
- Realistic/appetizing aesthetic direction: photorealistic food, restaurant quality

### Claude's Discretion (test page)
- Route location (dev-only or accessible)
- Production accessibility
- Specific demo content beyond aesthetic direction

### 3D Canvas architecture
- Dedicated folder: `src/components/3d/` for all 3D components
- Uncertain future scope: start with hero, architecture should support expansion
- Partial reduce-motion support: reduce complexity but keep some motion when preference set

### Claude's Discretion (Canvas)
- Single vs multiple Canvas approach
- 3D state persistence during navigation
- Asset bundling strategy (local vs CDN)
- Loading state design
- Lighting approach (environment map, positioned lights, or hybrid)
- Background treatment (transparent, solid, gradient)
- Canvas z-index layer placement

### Performance fallback triggers
- Conservative fallback detection: only fallback on very low-end devices

### Claude's Discretion (fallback)
- 2D fallback design
- Manual toggle availability
- Detection timing (pre-detect vs graceful degrade)

</decisions>

<specifics>
## Specific Ideas

- 3D aesthetic: realistic and appetizing, photorealistic food quality (not cartoonish)
- Test page should preview this aesthetic direction
- Z-index issues: signout dropdown clicks pass through (not just visibility issue)
- Multiple components have z-index problems — need comprehensive fix

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-foundation-r3f-setup*
*Context gathered: 2026-01-23*
