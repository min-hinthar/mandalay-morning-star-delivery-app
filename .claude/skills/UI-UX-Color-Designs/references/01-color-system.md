# Color System (Domain Expert Rules)

## 1) Build palettes by “roles”, not colors
Define semantic roles:
- background (app base)
- surface (cards/panels)
- elevated surfaces (modals/sheets)
- text: primary/secondary/tertiary/inverse
- border/divider
- accent primary (CTA)
- accent secondary (highlights)
- status: success/warn/error/info
- special: gradient bases, hero highlight, glow

## 2) Tonal ramps (required)
- Neutral ramp: 10–12 steps (N0..N1000)
- Each accent: 6–10 steps (A50..A900)
- Status colors: at least 5 steps each
Goal: you can set text, border, background from ramps without “inventing new colors”.

## 3) Contrast policy (required)
- Normal text: aim WCAG AA or better
- Large text/icons: AA minimum
- On gradients/glass: DO NOT rely on “auto”; explicitly choose text tokens.
- Provide a “contrast escape hatch” token if needed (e.g. --text-on-anything)

## 4) Gradients (required, but controlled)
Define gradient tokens:
- hero-gradient-1, hero-gradient-2, accent-gradient
Rules:
- Gradients are used as highlights, not as reading surfaces.
- If gradient is a surface, enforce text-on-gradient tokens.

## 5) Light/Dark strategy
- Same semantic roles in both modes.
- Avoid “inverting everything”; tune ramps per mode.
- Ensure consistent brand accent across modes.

## 6) Deliverables
Always output:
- Token table (role → variable)
- Ramp definitions
- 3 example compositions:
  - Home hero (gradient)
  - Menu list (surface + chips)
  - Modal overlay (elevation + text contrast)
- A quick “Do/Don’t” list

## 7) Verification checklist
- Contrast passes for core screens
- CTA stands out on both modes
- Status colors read as status, not decoration
