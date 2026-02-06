# Phase 21: Theme Refinements - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish light and dark modes with smooth transitions. Fix footer text visibility, refine dark mode surfaces, animate theme toggle with sun/moon morph, implement circular reveal transition, and adapt 3D scene lighting to theme. Theme toggle integration in header is Phase 23.

</domain>

<decisions>
## Implementation Decisions

### Color palette refinement
- Pure dark (near-black) surfaces for dark mode — OLED-friendly, high contrast
- Accents vibrant in dark mode, muted in light mode for optimal contrast
- Full contrast audit across all text/background combinations
- Lighter blur for glassmorphism in light mode (more subtle effect)
- Bold text hierarchy steps — dramatic contrast between headings, body, muted
- Subtle colored shadows in dark mode for floating effect
- Theme-optimized input fields — different border/fill approach per theme
- Dark mode hovers: brighten surface + subtle accent glow combined
- Build fresh color treatment based on brand colors (no external reference)

### Theme toggle animation
- Circular button shape
- Snappy spring physics (quick, responsive)
- Subtle background behind icon
- Themed sounds: nature-inspired (light = bright chime, dark = low tone)
- Theme-dependent border: border in light mode, glow in dark mode
- Icon hints on hover — subtle morph starts before click

### Theme transition effect
- Circular reveal expanding from toggle button location
- Fast duration (300ms)
- Spring easing with slight overshoot at edges — playful feel
- Thin amber accent line at the expanding edge
- Debounce rapid toggles — only last toggle fires
- Origin always from toggle button location

### 3D scene adaptation
- Warm directional light in light mode, cool ambient in dark mode
- HDRI environment changes between themes (studio vs night feel)
- Smooth lighting transition (~500ms lerp)
- Contact shadows adapt: darker in light mode, subtle glow in dark mode

### Claude's Discretion
- Footer text contrast level (AA vs AAA based on brand colors)
- Border/divider treatment per component
- Disabled state styling per component
- Sun/moon icon morph animation style
- Reduced-motion accessibility approach for circular reveal
- System theme change animation (reveal vs instant)

</decisions>

<specifics>
## Specific Ideas

- Dark mode should feel OLED-friendly with pure blacks
- Theme toggle sounds should feel natural — bright chime for light, low tone for dark
- Circular reveal should have playful spring overshoot, not feel mechanical
- 3D scene should feel like different times of day — warm studio light vs cool night ambient

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-theme-refinements*
*Context gathered: 2026-01-26*
