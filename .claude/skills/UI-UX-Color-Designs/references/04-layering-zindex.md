# Layering / Z-Index / Clickability (Domain Expert Rules)

## 1) Semantic Layer Map (required)
Define tokens for:
- base/content
- sticky nav/header
- dropdown/menu
- popover
- tooltip
- backdrop
- modal/sheet/drawer
- toast
- decorative/canvas

Always output a bottom→top layer map:
Layer | Token | Typical components | Portal root? | Pointer-events policy

## 2) Portal strategy
- Radix portals must mount into a known root or body consistently.
- All overlays must stack predictably.

## 3) Stacking context traps (must check)
Any ancestor with:
- transform
- filter / backdrop-filter
- opacity < 1
- mix-blend-mode
- position + z-index combos
- isolation
…can break expectations.

## 4) Clickability rules
- Closed overlays: unmount OR pointer-events:none + inert + hidden.
- Backdrop: blocks scroll + interaction as required.
- Decorative layers: pointer-events:none.

## 5) Debug playbook (required)
- Inspect element under cursor
- Toggle overlay nodes visibility
- Check computed z-index + stacking context tree
- Temporarily set outline to find invisible blockers
