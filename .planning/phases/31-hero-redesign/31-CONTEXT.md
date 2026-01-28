# Phase 31: Hero Redesign - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign hero section with floating food emojis (placeholders for future food images), multi-layer parallax, theme-aware gradients, and polished layout. No mascot in hero — emojis take that role.

</domain>

<decisions>
## Implementation Decisions

### Floating Emoji System
- **Emoji set:** Burmese-themed (🍜🥟🍲🌶️) — placeholders for later food images
- **Density:** Dense (12-15 emojis visible at once)
- **Animation style:** Mixed organic — each emoji has unique path (drift, spiral, bob)
- **Size:** Varied sizes for depth perception (small = far, large = close)
- **Loop:** Infinite — emojis continuously float and recycle
- **Scroll behavior:** Parallax with page — emojis move slower than scroll
- **Depth effects:** Blur + opacity — far emojis slightly blurred and more transparent
- **Rotation:** Gentle spin/tilt as they float
- **Edge handling:** Gradient fade at hero boundaries (soft, seamless)
- **Mouse interaction:** Emojis subtly shift away from cursor on desktop
- **Touch devices:** Autonomous floating only (no tilt/gyro)

### Parallax Depth Layers
- **Layer count:** 4+ layers for rich immersive depth
- **Layer contents:** Gradient base + gradient orbs (glowing spheres) + floating emojis
- **Orb style:** Radial gradients with soft glow/bloom effect
- **Orb colors:** Mix of brand colors (saffron, jade, ruby) and neutral tones
- **Scroll range:** Continuous — parallax as long as elements visible
- **Movement feel:** 1:1 smooth (direct proportion to scroll, no lag)
- **Text parallax:** Hero text and CTA have subtle parallax (part of depth)

### Theme Transitions
- **Switch animation:** Smooth 300ms crossfade when toggling light↔dark
- **Light mode gradient:** Warm saffron→cream (golden warmth fading to light)
- **Dark mode gradient:** Rich black→subtle saffron glow (dramatic warm accent)
- **Element adaptation:** Emojis and orbs shift saturation/brightness per theme
- **Gradient scroll animation:** Position shift on scroll (dynamic spotlight effect)
- **Orb glow intensity:** Brighter in dark mode against dark background
- **Background shimmer:** Subtle traveling light effect adds liveliness
- **Emoji shadows:** Theme-adaptive — light shadows in light mode, darker in dark mode

### Hero Layout
- **Mascot:** None in hero — floating emojis replace mascot role
- **Text alignment:** Split — headline centered, CTA buttons below left
- **Height:** Full viewport (100vh) on both desktop and mobile
- **CTA button:** Large pill with brand gradient (saffron→jade)
- **CTA hover:** Scale + shadow lift + gradient shift + subtle glow (all three effects)
- **Scroll indicator:** Animated bouncing chevron/arrow at bottom
- **Headline entrance:** Fade up with stagger — words/lines reveal sequentially
- **Tagline:** Short subtitle below headline (e.g., "Authentic Burmese delivered")

### Claude's Discretion
- Exact emoji positions and animation timing
- Orb sizes and placement
- Specific gradient color stops
- Parallax speed ratios for each layer
- Stagger timing for headline animation
- Shimmer animation implementation

</decisions>

<specifics>
## Specific Ideas

- Emojis are placeholders for future real food images
- "Mixed organic" motion — variety prevents robotic uniformity
- Depth-of-field blur on far emojis mimics camera focus
- Mouse interaction creates subtle engagement without distraction
- 100vh height on mobile for full immersion
- All three CTA hover effects combined for rich interactivity
- Headline stagger reveals text dramatically on load

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-hero-redesign*
*Context gathered: 2026-01-28*
