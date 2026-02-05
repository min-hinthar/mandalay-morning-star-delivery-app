# Phase 39: Animation Optimization - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Device-adaptive animations that scale based on hardware capability. Users on low-power devices see simplified animations (parallax disabled), while high-power devices get the full experience. Resolves GSAP/Framer Motion conflicts and fixes AnimatePresence issues. Adds fly-to-cart animation with optimistic UI.

</domain>

<decisions>
## Implementation Decisions

### Device Detection
- Use navigator.deviceMemory + hardwareConcurrency for JS-based detection
- Low-power threshold: ≤4 GB memory OR ≤4 CPU cores
- prefers-reduced-motion only affects parallax (same set as low-power), not all animations
- Detection runs once on page load, no dynamic re-evaluation
- Safari fallback (no deviceMemory API): treat mobile Safari as low-power, desktop Safari as high-power
- No manual user toggle for animation tier

### Animation Tiers
- Low-power disables: **parallax only**
- Low-power keeps: stagger, floating emojis, micro-interactions, modal animations, card hover effects, scroll-triggered entrances, gradient animation, shimmer, confetti, page transitions (short fade)
- Always enabled regardless of tier: cart bounce/pulse, loading spinners, shimmer placeholders
- prefers-reduced-motion disables same set as low-power (parallax only)

### Conflict Resolution
- Claude decides GSAP vs Framer Motion division based on current code
- GSAP is primary for scroll-linked animations; Framer owns state-driven animations
- AnimatePresence: direct keyed children only (no Fragments — wrap in div if needed)
- Dev mode runtime warnings when GSAP and Framer Motion target same element
- AnimationProvider context exposes: tier, reducedMotion, gsapContext
- GSAP animations auto-kill on unmount via gsap.context()
- ScrollTrigger instances auto-kill via gsapContext cleanup

### Cart Feedback (Fly-to-Cart)
- Fly-to-cart animation: small 64px thumbnail flies from card to cart icon
- Works on all devices (including low-power)
- Curved arc (Bezier) path, 300-400ms duration
- Thumbnail scales down during flight (64px → 24px)
- On landing: cart icon bounces AND count badge pulses
- Same fly animation for quantity increase (+)
- Remove item (quantity 0): fade out badge pulse (no reverse fly)
- Optimistic UI: cart count updates immediately, reverts on error
- If cart icon off-screen: fly to fixed top-right position
- Haptic feedback (light tap via navigator.vibrate())
- Add button shows checkmark briefly (~500ms) while flying
- Multiple rapid clicks: queue multiple flying thumbnails (no debounce)
- Soft pop/click sound effect on add-to-cart
- Sound respects system mute/silent mode

### Claude's Discretion
- Exact GSAP vs Framer Motion division per component
- Animation easing curves and timing fine-tuning
- GSAP context implementation details
- Sound file selection and loading strategy
- Haptic vibration pattern duration

</decisions>

<specifics>
## Specific Ideas

- "I want the fly-to-cart to feel playful — curved arc, shrinking as it approaches"
- Cart feedback is essential UX, should work everywhere including low-power
- Button showing checkmark provides clear confirmation the action registered
- Multiple flying thumbnails when rapidly tapping adds visual delight

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 39-animation-optimization*
*Context gathered: 2026-02-05*
