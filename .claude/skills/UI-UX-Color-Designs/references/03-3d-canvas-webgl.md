# 3D / Canvas / WebGL (Domain Expert Rules)

## 1) Progressive enhancement (required)
HTML UI remains fully usable without canvas.
Canvas adds delight, not core functionality.

## 2) Input safety
Decorative canvas: pointer-events:none by default.
Interactive canvas: only if explicitly approved; provide clear UI fallback.

## 3) Budgets (required)
Define budgets:
- draw calls target
- postprocessing limits
- max texture sizes
- frame budget goal (60fps; degrade gracefully)

## 4) Rendering strategy
- Prefer on-demand rendering (invalidate) for static scenes
- Reduce updates when tab hidden
- Reduce DPR on low devices

## 5) Where 3D belongs
- Hero background atmospherics
- Card tilt/lighting
- Subtle particles behind CTAs
Avoid:
- Full-screen interactive 3D that competes with ordering flow

## 6) Verification
- No jank on scroll
- No click blocking
- Fallback looks intentional
