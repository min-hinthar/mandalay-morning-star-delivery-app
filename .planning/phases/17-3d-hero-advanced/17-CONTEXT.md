# Phase 17: 3D Hero Advanced - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the 3D hero feel alive with auto-rotation, physics-based momentum, food carousel, and particle effects. Building on the core 3D scene from Phase 16.

</domain>

<decisions>
## Implementation Decisions

### Auto-rotation behavior
- Active display speed: one full rotation every 8-10 seconds
- Instant stop on hover/touch (no deceleration)
- Resume after 3-5 seconds of no interaction
- Alternating direction: reverses each time it resumes after interaction

### Physics & momentum
- Weighty & satisfying feel: slight resistance like spinning a real object
- Unlimited spin: hard throws can spin multiple rotations, smooth deceleration
- No spring-back to home position: stays wherever user left it, auto-rotation resumes from there
- Rubber band at polar limits: can push slightly past angle limits, springs back

### Food carousel
- Navigation: both swipe gestures and clickable dot indicators
- Transition: 3D spin transition (scene rotates 180° revealing new model)
- Auto-advance: fast showcase every 5-7 seconds when not interacting
- Model count: Claude's discretion based on available assets and performance

### Particle effects
- Trigger: both while dragging (subtle trail) and on release (burst)
- Style: contextual per food type
  - Hot foods → steam/smoke wisps
  - Salads → floating herbs/veggies
  - Desserts → stars/sparkles
- Intensity: playful burst (30-50 particles, celebrates the interaction)

### Claude's Discretion
- Number of food models in carousel (3-6 based on assets/performance)
- Exact spring stiffness and damping values
- Particle physics tuning (gravity, spread, fade duration)
- Performance optimizations (particle pooling, LOD)

</decisions>

<specifics>
## Specific Ideas

- Auto-rotation alternating direction adds unpredictability and life
- 3D spin transition for carousel feels magical - like a display turntable
- Contextual particles (steam for hot, herbs for salads) reinforce food identity
- "Weighty" physics feel should be satisfying like spinning a lazy susan

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-3d-hero-advanced*
*Context gathered: 2026-01-24*
