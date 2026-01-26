# Phase 22: Customer Page Polish - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance all customer-facing pages (Menu, Checkout, Order History, Account, Cart) with engaging animations that feel cohesively playful. Each page should have distinct personality while sharing consistent timing and motion patterns.

</domain>

<decisions>
## Implementation Decisions

### Animation Intensity
- Bold playful animations everywhere — same intensity across all pages
- Max 300ms duration for entry effects (quick pop)
- Reuse Phase 20 sound effects on customer pages
- Bold BrandedSpinner for all loading states (large and prominent)
- Full ErrorShake treatment (shake + red pulse overlay) on validation errors
- Hybrid form validation: required fields validate on blur, complex validation on submit

### Entry Choreography
- Section-by-section reveal as user scrolls into viewport
- Individual stagger within sections (80ms gaps between items)
- Mixed direction by element type: cards fade up, buttons scale in, text fades in place
- Early viewport trigger at 25% visibility
- Animations replay on re-enter (engaging scroll experience)
- Menu items stagger individually (not by row or category)
- Order history items stagger individually
- Same stagger pattern across all customer pages (no special treatment for account)

### Transition Style
- Checkout steps: slide + fade + scale morph + glow effect
- Reverse direction when going backward (slide from left on back, from right on forward)
- Form fields within checkout steps stagger in sequence
- Animated step progress indicator (bar fills, checkmarks draw in, numbers morph)
- Checkout completion: celebration burst + animated checkmark
- Page-to-page navigation uses View Transitions API
- BrandedSpinner during page navigation
- Order detail opens in animated modal overlay

### Page Personality
- Each page has distinct personality while staying cohesive:
  - **Menu page:** Playful discovery (encourages exploration, hover reveals, category delight)
  - **Checkout:** Celebratory journey (each step feels like achievement)
  - **Account page:** Match menu playfulness (same level of delight)
  - **Order History:** Proud collection (orders feel like achievements to browse)
- Unique page-specific micro-interactions (1-2 unique touches per page)
- Unique empty state illustrations/animations per page
- Polish cart sidebar with enhanced animations (entry, quantity spring, add/remove effects)
- Animated breadcrumbs (slide/fade in, highlight current)
- Animated filter/sort controls on menu (category tabs slide, dropdown springs, results animate on filter change)

### Glassmorphism Enhancement
- Reapply and enhance glassmorphism on all card surfaces
- More blur (30px+) for stronger frosted glass effect
- Dynamic opacity variance on hover/focus states
- Colored glass tints based on theme
- Apply to: menu cards, order cards, account sections, checkout panels

### Colorful Gradients
- Shadows and highlights use thematic colorful gradients (lovable app aesthetic)
- Hover states show gradient glow around cards/buttons
- Claude's discretion on color palette (brand-appropriate, theme-adaptive)

### Claude's Discretion
- Specific gradient color choices (warm amber vs multi-color vs theme-adaptive)
- Individual unique touches per page (what makes each page distinctive)
- Exact empty state illustrations per page
- Progress indicator implementation details
- View Transitions API fallback behavior

</decisions>

<specifics>
## Specific Ideas

- "Lovable apps" aesthetic — shadows and highlights should feel colorful and premium
- Glassmorphism must work well with the 3D tilt effect on menu cards
- Cart should feel as polished as the homepage now

</specifics>

<deferred>
## Deferred Ideas

- **White text color on light theme blending with background** — This is Phase 21 theme refinements territory. May need a follow-up fix.

</deferred>

<out_of_scope>
## Out of Scope for Phase 22

### Account Page Animations (PAGE-04)
**Issue:** The CONTEXT decisions reference "Account page" animations, but no `/account` page exists in the codebase.

**Resolution:** Account page creation is out of scope for this animation polish phase. Account page animations can be added when:
1. A dedicated "Account Page" phase creates the page structure
2. Or as a gap closure plan after account page exists

This phase focuses on animating **existing** customer pages: Menu, Checkout, Orders, Cart.

</out_of_scope>

---

*Phase: 22-customer-page-polish*
*Context gathered: 2026-01-26*
