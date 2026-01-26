# Phase 20: Micro-interactions - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Every interactive element has delightful, consistent micro-animations. Buttons compress on press, inputs glow on focus, toggles bounce, loading states use branded spinners, success/error states animate appropriately, and specialized controls (quantity, favorites, swipe) have playful feedback.

</domain>

<decisions>
## Implementation Decisions

### Button & Input Feel

- **Button press:** Depth effect — shadow reduction + scale (feels like physical button)
- **Hover states:** Subtle lift + glow + scale up (102-105%)
- **Input focus glow:** Contextual colors — amber default, red error, green success
- **Toggle switches:** Spring overshoot — knob overshoots then settles
- **Disabled buttons:** Show tooltip hint explaining why disabled (on hover/tap)
- **Form validation:** On change (debounced 300-500ms) — validates as user types
- **Checkboxes/radios:** Check draws in (stroke animation) + scale pop
- **Focus ring:** Thick ring (2-3px) + glow behind — accessibility-first

### Loading & Feedback

- **Branded spinner:** Animated Morning Star logo (rotating/pulsing)
- **Success feedback:** Checkmark pops in + confetti particle burst
- **Error feedback:** Shake + pulse — horizontal shake combined with red color pulse
- **Skeleton shimmer:** Gradient glow — animated gradient shifts through skeleton
- **Toast animations:** Spring bounce — bounces in with spring physics
- **Progress bar:** Glowing fill — bar fills with animated glow on leading edge
- **Button loading:** Spinner + text — spinner appears, label changes to "Loading..."
- **Empty states:** Subtle float — illustration gently floats up/down

### Specialized Controls

- **Quantity selector:** Flip counter — old number flips out, new flips in
- **Favorite heart:** Particle burst + scale pop + fill — hearts explode outward, heart pops and fills
- **Swipe-to-delete:** Red reveal + item tilts — red background reveals while item rotates
- **Add-to-cart:** Item flies to cart icon + badge bounces + optional pop sound
- **Dropdown open:** Spring pop — options bounce in with spring physics
- **Accordion:** Height spring — content height animates with spring bounce at end
- **Tab switching:** Sliding indicator + content crossfade
- **Modal animation:** Spring scale — modal springs in with overshoot

### Motion Consistency

- **Spring configs:** Two springs — snappy for quick actions, bouncy for playful interactions
- **Reduced motion:** Shorter + simpler — keep animations but shorter duration, no spring/bounce
- **Sound effects:** Yes for key actions — add-to-cart, success, error get subtle sounds
- **Duration scale:** Snappy (100-200ms base) — quick, responsive, no lag
- **Motion tokens:** Extend existing motion-tokens.ts file
- **Touch hover:** Convert hover effects to trigger on first tap
- **Stagger timing:** Fast stagger (30-50ms) — items appear quickly in sequence
- **Focus trap:** Subtle pulse on boundaries when user tries to tab outside modal/drawer

### Claude's Discretion

- Exact spring stiffness/damping values within "snappy" and "bouncy" categories
- Specific confetti particle count and spread
- Sound effect file format and volume levels
- Exact gradient colors for skeleton shimmer
- Animation easing curves beyond spring physics

</decisions>

<specifics>
## Specific Ideas

- Morning Star logo as spinner — brand recognition during loading
- "Flip counter" for quantity like airport departure boards
- Item flying to cart like DoorDash/Uber Eats celebration
- Focus ring is thick for accessibility but has glow for polish
- Contextual input glow matches validation state (not just brand color)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-micro-interactions*
*Context gathered: 2026-01-25*
