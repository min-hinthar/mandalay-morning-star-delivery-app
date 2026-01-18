---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## Project-Specific Guidance (Mandalay Morning Star)

### Design Token System

Use V5 design tokens from `src/styles/tokens.css`:

| Category | Token Pattern | Usage |
|----------|---------------|-------|
| Colors | `var(--color-surface-*)`, `var(--color-text-*)` | Backgrounds, text |
| Status | `var(--color-status-error)`, `var(--color-status-success)` | Feedback states |
| Interactive | `var(--color-interactive-primary)` | CTAs, links |
| Z-index | `var(--z-sticky)`, `var(--z-modal)`, `var(--z-toast)` | Stacking |
| Elevation | `var(--elevation-1)` through `var(--elevation-6)` | Shadows |
| Motion | `var(--duration-fast)`, `var(--ease-out)` | Animations |

**V4 → V5 Migration:**
| Old | New |
|-----|-----|
| `--color-cta` | `--color-interactive-primary` |
| `--color-charcoal` | `--color-text-primary` |
| `--color-error` | `--color-status-error` |
| `--shadow-md` | `--elevation-2` |

**Lint enforcement:** ESLint `no-restricted-syntax` catches hardcoded hex/z-index values.

### Framer Motion Patterns

**TypeScript variants:** Use `as const` for type safety:
```tsx
const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { type: "spring" as const } }
};
```

**Swipe-to-delete pattern:**
```tsx
const x = useMotionValue(0);
const opacity = useTransform(x, [-100, 0], [1, 0]);
// outer: overflow-hidden, hidden delete button behind
// content: drag="x", dragConstraints={{ left: -100, right: 0 }}
// onDragEnd: check info.offset.x < -50 to trigger delete
```

**Responsive drawer animations:**
```tsx
const isMobile = useMediaQuery("(max-width: 640px)");
// Mobile: initial={{ y: "100%" }}, animate={{ y: 0 }}, drag="y"
// Desktop: initial={{ x: "100%" }}, animate={{ x: 0 }}
```

**Collapsible header:**
```tsx
const { isCollapsed } = useScrollDirection();
<motion.header animate={{ y: isCollapsed ? -56 : 0 }} />
```

### Theme System Integration

**Required setup:**
1. `ThemeProvider` with `attribute="class"` (Tailwind dark mode)
2. `suppressHydrationWarning` on `<html>` in root layout
3. `ThemeToggle` using `useTheme()` hook from next-themes

**Avoid hard-coded colors:**
- `bg-white` → `bg-background`
- `text-charcoal` → `text-foreground`
- `border-gray-200` → `border-[var(--color-border-default)]`

**Animated gradient contrast:** Add `bg-black/15` overlay for white text on `bg-gradient-animated`.

**CSS variable fallbacks:** `top-[var(--header-height,57px)]` for dynamic positioning.

### Accessibility Patterns

**Accordion ARIA:**
```tsx
const contentId = useId();
const headerId = useId();
<button id={headerId} aria-expanded={isOpen} aria-controls={contentId}>
<div id={contentId} role="region" aria-labelledby={headerId}>
```

**Motion preferences:**
```tsx
const shouldReduceMotion = useReducedMotion();
// Skip or simplify animations when true
```

**Mobile nav z-index hierarchy:**
- Header: `z-50`
- Overlay: `z-[55]`
- Panel: `z-[60]`

### Test Resilience

**Avoid brittle assertions:**
- Don't: `el.classList.contains("h-14")` - breaks on refactors
- Do: `expect(style.position).toBe("sticky")` - tests behavior

**Use data attributes:**
```tsx
<div data-sold-out={isSoldOut} data-testid="menu-item">
// Test: el.getAttribute("data-sold-out") === "true"
```

**Playwright exact matching:**
```ts
// Don't: `:has-text("All")` - matches "All-Day Breakfast"
// Do: getByRole("tab", { name: "All", exact: true })
```

**E2E resilience:**
- Don't: `expect(height).toBe(56)` - fails with borders
- Do: `expect(height).toBeGreaterThanOrEqual(56)` or check behavior