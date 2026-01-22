# Performance + Quality (Domain Expert Rules)

## Web performance targets
- Smooth interactions (INP-focused)
- No scroll jank
- Reasonable bundle sizes

## Animation performance rules
- Composite-only animations (transform/opacity)
- Avoid layout thrash (batch DOM reads/writes)
- Use will-change sparingly and remove when not needed

## Media rules
- Optimize images (responsive sizes)
- Avoid huge GIFs for “motion”; use video/lottie/canvas instead

## Testing requirements
- E2E: clickability + overlay stacking + cart open/close + checkout
- Visual snapshots for core shells
- A11y checks for dialogs/tooltips/forms
