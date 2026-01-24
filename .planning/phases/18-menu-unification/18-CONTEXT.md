# Phase 18: Menu Unification - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a unified MenuItemCard component used consistently across homepage menu carousel, dedicated menu page, and cart. Cards feature glassmorphism styling with 3D tilt effect on hover.

</domain>

<decisions>
## Implementation Decisions

### Card Layout & Content
- **Orientation:** Vertical (image on top) for menu grid, horizontal for cart — context-dependent
- **Content density:** Claude's discretion based on context (full for menu page, compact elsewhere)
- **Price display:** Subtle, secondary to item name — not screaming
- **Add to cart:** Button transforms to +/- quantity controls after adding
- **Image treatment:** Rounded/clipped shape, 4:3 landscape aspect ratio
- **Dietary/spice indicators:** Small icons/badges AND text labels, positioned next to or below item name

### Visual Styling
- **Surface:** Glassmorphism (frosted glass effect with backdrop blur)
- **Blur intensity:** Medium (16-24px), increases slightly on hover
- **Corner radius:** Very rounded (24px+) — playful, bubbly aesthetic
- **Theme adaptation:** Light glass in light mode, dark glass in dark mode
- **Accent:** Brand color border/glow appears on hover
- **Typography:** Bold name, light description — clear hierarchy
- **Add button:** Solid brand color, pill shape — prominent CTA
- **Out of stock:** Normal appearance with 'Sold Out' badge

### Interaction Behavior
- **3D tilt:** Medium intensity (15-20° max)
- **Shine effect:** Light moves across card during tilt — physical feel
- **Scale on hover:** Slight lift (1.02-1.05x) in addition to tilt
- **Return animation:** Quick snap back to neutral
- **Mobile behavior:** Tap scales card, long press enables tilt play
- **Add feedback:** All three combined — button compresses, success animation, item flies to cart icon, then transforms to quantity controls
- **Sound effects:** Subtle click sounds on add/remove interactions

### Context Variations
- **Homepage:** 10 featured items in horizontal carousel with auto-scroll (pauses on hover)
- **Carousel navigation:** Both arrow buttons on sides AND dots indicator below
- **Menu page:** Grid layout (2-3 columns on desktop)
- **Mobile grid:** Responsive — 1 card on small phones, 2 on larger phones
- **Cart:** Simplified list item (different component, not the full card)
- **3D tilt scope:** Menu page and homepage only — skip in cart where focus is checkout
- **Featured items:** "Popular" or "Featured" badge on select items
- **Scroll reveal:** Staggered entrance animation as cards scroll into view
- **Customization:** Add button opens modal/drawer for items with options (size, add-ons)

### Claude's Discretion
- Exact animation timing/easing curves
- Specific breakpoint thresholds for responsive behavior
- Carousel scroll speed and auto-advance interval
- Loading state skeleton design
- Exact glassmorphism color values per theme

</decisions>

<specifics>
## Specific Ideas

- Tilt effect should feel physical with moving light reflection — like holding a real card
- Button press → checkmark → fly to cart → quantity controls is a 3-part animation sequence
- Glassmorphism should be premium but performant
- Carousel should feel smooth and modern, not jerky

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-menu-unification*
*Context gathered: 2026-01-24*
