# Phase 19: Homepage Redesign - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign homepage with Remotion-generated video hero and enhanced scroll animations. 3D hero moves to Menu page (separate work). This phase delivers: video hero with animated food reveal, scroll choreography across all sections, section-specific animations, side navigation dots, and integrated How It Works + Coverage section.

</domain>

<decisions>
## Implementation Decisions

### Hero Section
- **Technology:** Remotion for pre-rendered MP4/WebM video (not live React animation)
- **Content:** Animated food reveal featuring Tea Leaf Salad, Mohinga, Shan Noodles
- **Effects:** Steam + particles, motion blur + glow, all layered for maximum impact
- **Color mood:** Dark dramatic — dark background, spotlight on food, cinematic feel
- **Layout:** Full viewport (100vh), text/CTA bottom-anchored with gradient overlay
- **Text:** Headline animates in after video starts (fade/slide)
- **CTAs:** "Start Order" + "How It Works" buttons
- **Playback:** Loop with pause — loops continuously but pauses when scrolled out of view
- **Mobile:** Separate portrait-optimized video rendered in Remotion
- **Desktop video:** Render landscape version
- **Headline copy:** Claude's discretion — craft headline matching brand voice

### Scroll Choreography
- **Philosophy:** Combination — parallax depth + staggered element reveals within sections
- **Trigger point:** 50% visible (middle of viewport)
- **Animation speed:** Snappy 200-300ms
- **Stagger delay:** Fast cascade 50ms between elements
- **Replay behavior:** Always replay — re-animate every time section enters view
- **Parallax intensity:** Medium 0.3-0.5 for background layers
- **Scroll snap:** Desktop only — snap on desktop, free scroll on mobile
- **Progress indicator:** Side dots on right side
  - Click to jump to section
  - Hover shows section name label
  - Smooth scroll on click (Claude decides implementation)
- **Reduced motion:** Claude decides accessibility approach

### Section Animations

**Coverage Section:**
- Integrated into How It Works Step 1 (not standalone section)

**How It Works Section:**
- 4 steps: Check Coverage → Order → Track → Enjoy
- Step-by-step reveal with interactive scroll highlighting
- Icons have continuous subtle motion (float, pulse)
- Connectors draw between steps

**Menu Section:**
- Category tabs with full menu (all items, tabbed by category)
- Tab switching: slide left/right animation based on direction
- Uses UnifiedMenuItemCard with existing 3D tilt
- "View Full Menu" prominent button at end

**Testimonials Section:**
- Auto-rotating carousel of reviews

**CTA/Promo Banner:**
- Floating entrance animation (floats up with shadow)
- Pulsing glow border to draw attention

**Footer:**
- Animated reveal — columns stagger in on scroll

### Visual Hierarchy
- **Section order:** Hero → How It Works (with Coverage) → Menu → Testimonials → CTA → Footer
- **Width:** Mixed — Claude decides full-width vs contained per section
- **Spacing:** Claude decides based on content
- **Typography:** Claude decides scale matching brand

### Claude's Discretion
- Scroll indicator below hero (or none)
- Section dividers (wave, diagonal, line, or none)
- Smooth scroll implementation (CSS vs JS)
- Full-width vs contained sections
- Section spacing amounts
- Typography scale
- Reduced motion accessibility approach

</decisions>

<specifics>
## Specific Ideas

- "Remotion-generated video with animated food reveal" — programmatic video generation, not stock footage
- Dark dramatic cinematic mood like high-end restaurant photography
- Side dots with hover labels like modern portfolio sites
- How It Works integrates Coverage check as natural first step
- Icons should feel alive with continuous subtle motion

</specifics>

<deferred>
## Deferred Ideas

- **3D hero on Menu page** — Mentioned as where 3D hero should live instead of homepage. This is separate work, possibly part of Phase 22 or new phase.

</deferred>

---

*Phase: 19-homepage-redesign*
*Context gathered: 2026-01-24*
