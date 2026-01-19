---
name: frontend-design
description: This skill should be used when the user asks to "build a component", "create a page", "design an interface", "implement a UI", "add animations", "make it responsive", or needs guidance on design systems, accessibility, or frontend architecture. Creates distinctive, production-grade interfaces that avoid generic AI aesthetics.
---

# Frontend Design

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Design Thinking

Before coding, commit to a BOLD aesthetic direction:

1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: Pick an extreme—brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco, soft/pastel, industrial
3. **Constraints**: Technical requirements (framework, performance, accessibility)
4. **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**Critical:** Choose a clear conceptual direction and execute with precision. Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

## Output Requirements

Implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with clear aesthetic point-of-view
- Meticulously refined in every detail

## Typography

- Choose distinctive fonts—avoid generic choices (Inter, Roboto, Arial, system fonts)
- Pair a distinctive display font with a refined body font
- Establish type scale using consistent ratios (1.25, 1.333, 1.5)

## Color & Theme

- Commit to cohesive aesthetic using CSS variables
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- Support light/dark themes via semantic tokens

## Motion

- Prioritize high-impact moments over scattered micro-interactions
- One well-orchestrated page load with staggered reveals creates more delight than scattered animations
- Use scroll-triggering and hover states that surprise
- Always provide `prefers-reduced-motion` alternative

## Spatial Composition

- Unexpected layouts, asymmetry, overlap, diagonal flow
- Grid-breaking elements
- Generous negative space OR controlled density

## Backgrounds & Visual Details

- Create atmosphere and depth—don't default to solid colors
- Apply creative forms: gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, grain overlays

## Anti-Patterns to Avoid

- Overused fonts (Inter, Roboto, Space Grotesk)
- Cliched purple gradients on white backgrounds
- Predictable layouts and cookie-cutter patterns
- Design that lacks context-specific character

## Implementation Complexity

Match complexity to vision:
- **Maximalist**: Elaborate code with extensive animations and effects
- **Minimalist**: Restraint, precision, careful spacing, typography, subtle details

Elegance comes from executing the vision well.

---

## Additional Resources

### Reference Files

For detailed patterns and techniques:
- **`references/design-systems.md`** — Token hierarchy, scale systems, color architecture, spacing grid
- **`references/motion-mastery.md`** — Animation categories, timing, spring physics, orchestration
- **`references/responsive-architecture.md`** — Breakpoints, container queries, viewport units, touch targets
- **`references/accessibility-excellence.md`** — ARIA patterns, keyboard navigation, contrast, screen readers
- **`references/test-resilience.md`** — Data attributes, behavior testing, Playwright patterns

### Example Files

Working examples in `examples/`:
- **`token-system.css`** — Complete three-layer token system with dark mode
- **`motion-variants.ts`** — Framer Motion variant patterns and springs
- **`accessible-accordion.tsx`** — ARIA-compliant accordion with animations

---

## Quick Reference

### Token Layers
| Layer | Pattern | Example |
|-------|---------|---------|
| Primitive | `--{property}-{value}` | `--blue-500`, `--space-4` |
| Semantic | `--{role}-{variant}` | `--surface-primary`, `--text-muted` |
| Component | `--{component}-{property}` | `--button-bg`, `--card-shadow` |

### Motion Categories
| Category | Duration | Easing |
|----------|----------|--------|
| Enter | 200-400ms | ease-out |
| Exit | 150-300ms | ease-in |
| Emphasis | 100-200ms | spring |
| Feedback | 150-250ms | snappy |

### Breakpoints
| Name | Width | Context |
|------|-------|---------|
| sm | 640px | Phone landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

### Z-Index Scale
| Layer | Value |
|-------|-------|
| Base | 0 |
| Sticky | 10-20 |
| Dropdown | 30-40 |
| Modal | 50 |
| Toast | 60 |

---

Remember: Claude is capable of extraordinary creative work. Don't hold back—show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
