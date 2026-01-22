# Motion System (Domain Expert Rules)

## 1) Tokenize motion
Create tokens:
- durations: fast(120–160), med(200–280), slow(360–520)
- easing curves: standard, emphasized, out, inOut
- spring presets: subtle, bouncy, snappy
- stagger presets: list, grid, hero

## 2) Pattern library (required)
Define reusable patterns:
- Hover lift + shadow bloom
- Press compression (tactile)
- Add-to-cart “pulse + fly”
- Sheet open/close (bottom + side)
- Page transitions (fade/slide/shared element)
- Scroll reveals (stagger + parallax)
- Loading states (skeleton shimmer + subtle motion)

## 3) Library split rule (required)
- Motion (Framer Motion / Motion One):
  - component interactions
  - layout transitions
  - enter/exit
- GSAP:
  - complex hero timelines
  - scroll choreography
  - text splitting/reveals
  - multi-scene orchestrations

## 4) Performance rules
- Prefer transform/opacity
- Avoid animating height/width/top/left; if needed, do it sparingly
- Avoid heavy blur animation; use static blur surfaces

## 5) Verification
Provide “Motion Intensity” samples:
- 3 micro-interactions
- 1 page transition
- 1 scroll sequence
Ask user to approve intensity BEFORE scaling across app.
