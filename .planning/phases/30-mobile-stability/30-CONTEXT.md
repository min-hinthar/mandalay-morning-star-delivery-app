# Phase 30: Mobile Stability - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 3D tilt effects to work reliably on touch devices. Disable tilt where appropriate, fix Safari rendering bugs, and provide quality fallback experiences for touch users. Card content must remain visible during and after all interactions.

</domain>

<decisions>
## Implementation Decisions

### Touch Detection
- CSS media queries only: `@media (hover: hover) and (pointer: fine)`
- Hybrid devices (laptops with touchscreens): enable tilt if mouse/fine pointer detected
- Detection scope: all tilt components, not just UnifiedMenuItemCard
- Static detection at page load (no runtime switching)
- iOS Safari: needs specific handling for quirky touch/hover behavior
- Target iOS 15+ (95%+ users, modern media query support)
- No global CSS class for touch capability (media queries sufficient)
- No console logging for detection results

### Tilt Disable Behavior
- Complete disable on touch devices (no reduced tilt, card stays flat)
- Keep subtle shine effect (static or animated, just no cursor tracking)
- Keep 3D context (preserve-3d) for glassmorphism and other effects
- Smooth transition if card needs to animate back to flat state
- Keep existing press compression effect (scale-down on tap still works)
- Full glassmorphism blur preserved on touch (no performance reduction)
- Long-press (500ms iOS standard) opens item detail sheet

### Fallback Experience
- Shadow elevation change on tap (shadow-sm to shadow-xl, noticeable feedback)
- Small upward translate on tap (-4px lift with shadow)
- Animated shine sweep instead of cursor-tracked shine (4-5 second cycle)
- Shine animation pauses during tap/press interaction
- Unified fallback behavior across all tilt components
- Keep subtle animations for reduced-motion users (same as regular fallback)

### Safari Fixes
- Fix all known issues: clipping, z-index, transform glitches, blur artifacts
- Force GPU layers with `will-change: transform`
- Manual -webkit- prefixes (don't rely solely on Autoprefixer)
- Both `isolation: isolate` and `overflow: hidden` for backdrop-filter bugs
- Safari Technology Preview acceptable for verification (real devices not required)

### Claude's Discretion
- Exact animation easing curves
- Specific will-change properties to use
- Order of compositing fix application
- How to structure the shared fallback behavior utility

</decisions>

<specifics>
## Specific Ideas

- Long-press to show detail sheet matches iOS context menu timing (500ms)
- Shadow transition should feel like card physically lifts toward user
- Shine sweep should be subtle enough to not distract from content
- iOS 15+ targeting allows use of modern CSS features without fallbacks

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 30-mobile-stability*
*Context gathered: 2026-01-28*
