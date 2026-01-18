# Sprint 1: Foundation (Tokens + Layout)

> **Priority**: CRITICAL — All other sprints depend on this
> **Tasks**: 8
> **Dependencies**: None (first sprint)
> **Source**: docs/V5/PRD.md, docs/V5/UX-spec.md

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 1.1 | ✅ | V5 Color Token System (high contrast + bold) |
| 1.2 | ✅ | Typography Token System (Playfair + Inter optimized) |
| 1.3 | ✅ | Spacing & Elevation Tokens |
| 1.4 | ✅ | Motion Tokens (Framer Motion standardization) |
| 1.5 | ✅ | Container Component (CSS Container Queries) |
| 1.6 | ✅ | Stack & Cluster Layout Primitives |
| 1.7 | ✅ | Grid Component (responsive columns) |
| 1.8 | ✅ | SafeArea Component (all modern devices) |

---

## Task 1.1: V5 Color Token System

**Goal**: Implement high-contrast, bold color palette with semantic naming
**Status**: ✅ Complete

### Prompt

```
Implement V5 color token system with high-contrast, bold palette.

REQUIREMENTS:
- Replace V4 warm neutrals with higher contrast values
- Maintain brand identity (saffron, jade, chili accents)
- WCAG AA minimum (4.5:1), aim for AAA where possible
- Full dark mode support with warm undertones

COLOR SYSTEM (from UX-spec):
Surface Colors:
- --color-surface-primary: #FFFFFF (light) / #1A1918 (dark)
- --color-surface-secondary: #F8F7F6 / #2A2827
- --color-surface-tertiary: #F0EEEC / #3A3837

Text Colors (High Contrast):
- --color-text-primary: #1A1918 / #F8F7F6
- --color-text-secondary: #4A4845 / #B5B3B0
- --color-text-inverse: #FFFFFF / #1A1918

Interactive Colors (Bold):
- --color-interactive-primary: #D4A853 (saffron)
- --color-interactive-hover: #C49843
- --color-interactive-active: #B48833
- --color-accent-secondary: #2D8B6F (jade)
- --color-accent-tertiary: #C45C4A (chili)

Status Colors:
- --color-status-success: #2D8B6F
- --color-status-warning: #D4A853
- --color-status-error: #C45C4A
- --color-status-info: #4A7C9B

Border Colors:
- --color-border-default: #E5E3E0 / #3A3837
- --color-border-strong: #D0CCC7 / #4A4847

IMPLEMENTATION:
1. Update src/styles/tokens.css with new color variables
2. Add .dark class variants for all colors
3. Create color contrast test utility
4. Update Tailwind config to reference new tokens
5. Document color usage guidelines

OUTPUT:
- Updated tokens.css with V5 color system
- Tailwind config updates
- Color contrast verification
```

### Files to Modify
- `src/styles/tokens.css`
- `tailwind.config.ts`

### Verification
- [ ] All colors defined in tokens.css
- [ ] Dark mode variants complete
- [ ] Tailwind config references tokens
- [ ] Contrast ratios meet WCAG AA (verify with tool)
- [ ] No hardcoded hex values in components

---

## Task 1.2: Typography Token System

**Goal**: Implement optimized Playfair + Inter typography scale
**Status**: ✅ Complete

### Prompt

```
Implement V5 typography token system with Playfair Display + Inter.

REQUIREMENTS:
- Optimize font loading (preload, font-display: swap)
- Subset fonts for performance
- Define complete type scale
- Support variable font weights

TYPOGRAPHY SCALE:
Font Families:
- --font-display: 'Playfair Display', serif (headings)
- --font-body: 'Inter', sans-serif (body, UI)

Font Sizes:
- --text-xs: 0.75rem (12px) - Labels, captions
- --text-sm: 0.875rem (14px) - Secondary text
- --text-base: 1rem (16px) - Body
- --text-lg: 1.125rem (18px) - Emphasis
- --text-xl: 1.25rem (20px) - Subheadings
- --text-2xl: 1.5rem (24px) - Section titles
- --text-3xl: 2rem (32px) - Page titles
- --text-4xl: 2.5rem (40px) - Hero

Line Heights:
- --leading-tight: 1.25
- --leading-normal: 1.5
- --leading-relaxed: 1.75

Font Weights:
- --font-normal: 400
- --font-medium: 500
- --font-semibold: 600
- --font-bold: 700

Letter Spacing:
- --tracking-tight: -0.025em
- --tracking-normal: 0
- --tracking-wide: 0.025em

IMPLEMENTATION:
1. Update tokens.css with typography variables
2. Create typography utility classes
3. Update layout.tsx font loading (preconnect, preload)
4. Define prose styles for content areas
5. Add Tailwind typography plugin config

OUTPUT:
- Typography tokens in tokens.css
- Optimized font loading in layout.tsx
- Typography utility classes
```

### Files to Modify
- `src/styles/tokens.css`
- `src/app/layout.tsx`
- `tailwind.config.ts`

### Verification
- [ ] All typography tokens defined
- [ ] Font preloading configured
- [ ] No CLS from font loading (check Lighthouse)
- [ ] Headings use Playfair, body uses Inter
- [ ] Weights load correctly (400, 500, 600, 700)

---

## Task 1.3: Spacing & Elevation Tokens

**Goal**: Implement 4px grid spacing and elevation system
**Status**: ✅ Complete

### Prompt

```
Implement V5 spacing (4px grid) and elevation token systems.

REQUIREMENTS:
- Strict 4px base grid
- Consistent spacing scale
- 6-level elevation system
- Warm shadow colors for brand consistency

SPACING SCALE (4px base):
- --space-0: 0
- --space-1: 0.25rem (4px)
- --space-2: 0.5rem (8px)
- --space-3: 0.75rem (12px)
- --space-4: 1rem (16px)
- --space-5: 1.25rem (20px)
- --space-6: 1.5rem (24px)
- --space-8: 2rem (32px)
- --space-10: 2.5rem (40px)
- --space-12: 3rem (48px)
- --space-16: 4rem (64px)
- --space-20: 5rem (80px)
- --space-24: 6rem (96px)

ELEVATION SYSTEM:
- --elevation-0: none
- --elevation-1: 0 1px 2px rgba(26, 25, 24, 0.05)
- --elevation-2: 0 2px 4px rgba(26, 25, 24, 0.08)
- --elevation-3: 0 4px 8px rgba(26, 25, 24, 0.10)
- --elevation-4: 0 8px 16px rgba(26, 25, 24, 0.12)
- --elevation-5: 0 16px 32px rgba(26, 25, 24, 0.15)

Dark mode shadows (lighter opacity):
- Use rgba(0, 0, 0, 0.3-0.5) for dark mode

Z-INDEX LAYERS:
- --z-base: 0
- --z-dropdown: 10
- --z-sticky: 20
- --z-fixed: 30
- --z-modal-backdrop: 40
- --z-modal: 50
- --z-popover: 60
- --z-tooltip: 70

IMPLEMENTATION:
1. Add spacing tokens to tokens.css
2. Add elevation tokens with dark mode variants
3. Add z-index layer system
4. Update Tailwind spacing config
5. Create elevation utility classes

OUTPUT:
- Spacing tokens in tokens.css
- Elevation system with shadows
- Z-index layer system
- Tailwind config updates
```

### Files to Modify
- `src/styles/tokens.css`
- `tailwind.config.ts`

### Verification
- [ ] All spacing values on 4px grid
- [ ] Elevation shadows render correctly
- [ ] Dark mode shadows appropriate
- [ ] Z-index conflicts resolved
- [ ] Tailwind references token values

---

## Task 1.4: Motion Tokens

**Goal**: Standardize Framer Motion animations via tokens
**Status**: ✅ Complete

### Prompt

```
Implement V5 motion token system for Framer Motion standardization.

REQUIREMENTS:
- Define duration tokens
- Define easing tokens
- Create spring presets
- Support reduced-motion preference
- GPU-accelerated properties only

DURATION TOKENS:
- --duration-instant: 0ms
- --duration-fast: 150ms
- --duration-normal: 250ms
- --duration-slow: 400ms
- --duration-slower: 600ms

EASING TOKENS:
- --ease-default: cubic-bezier(0.4, 0, 0.2, 1)
- --ease-in: cubic-bezier(0.4, 0, 1, 1)
- --ease-out: cubic-bezier(0, 0, 0.2, 1)
- --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
- --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)

FRAMER MOTION PRESETS (in src/lib/motion-tokens.ts):
- fadeIn: opacity 0→1, duration normal
- fadeOut: opacity 1→0, duration fast
- slideUp: y 20→0, opacity 0→1
- slideDown: y -20→0, opacity 0→1
- scaleIn: scale 0.95→1, opacity 0→1
- springBounce: spring with bounce
- gentleSpring: spring without bounce

MICRO-INTERACTIONS:
- buttonTap: scale 0.98, duration instant
- cardHover: elevation +1, duration fast
- accordionExpand: height auto, duration normal
- bottomSheetSlide: y 100%→0, duration normal

IMPLEMENTATION:
1. Add duration/easing tokens to tokens.css
2. Create src/lib/motion-tokens.ts with Framer presets
3. Update src/lib/micro-interactions.ts to use tokens
4. Add reduced-motion media query support
5. Document motion usage patterns

OUTPUT:
- Motion tokens in tokens.css
- Framer Motion presets in motion-tokens.ts
- Updated micro-interactions.ts
- Reduced-motion support
```

### Files to Create/Modify
- `src/styles/tokens.css`
- `src/lib/motion-tokens.ts` (new)
- `src/lib/micro-interactions.ts`

### Verification
- [ ] All durations use tokens
- [ ] All easings use tokens
- [ ] Framer presets exported
- [ ] Reduced-motion respected
- [ ] No jank (GPU-accelerated only)

---

## Task 1.5: Container Component

**Goal**: Create Container layout primitive with CSS Container Queries
**Status**: ✅ Complete

### Prompt

```
Create V5 Container component with CSS Container Queries support.

REQUIREMENTS:
- Size variants (sm, md, lg, xl, full)
- CSS Container Queries for child responsiveness
- Consistent padding/max-width
- Center alignment by default

CONTAINER SIZES:
- sm: max-width 640px (prose, narrow content)
- md: max-width 768px (forms, cards)
- lg: max-width 1024px (default, most pages)
- xl: max-width 1280px (wide layouts)
- full: max-width 100% (edge-to-edge)

CONTAINER QUERY SUPPORT:
- Add container-type: inline-size
- Children can use @container queries
- Named containers for nested queries

PADDING:
- Default: 1rem (16px) mobile, 1.5rem (24px) tablet+
- Flush variant: 0 padding

PROPS:
- size: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
- flush: boolean (no padding)
- center: boolean (default: true)
- as: ElementType (default: 'div')
- className: string

IMPLEMENTATION:
1. Create src/components/layouts/Container.tsx
2. Add container query CSS utilities
3. Export from layouts barrel file
4. Add JSDoc documentation
5. Create usage examples

EXAMPLE USAGE:
<Container size="lg">
  <ChildComponent /> {/* Can use @container queries */}
</Container>

<Container size="sm" as="main">
  <ArticleContent />
</Container>

OUTPUT:
- Container.tsx component
- Container query utilities in tokens.css
- Updated layouts/index.ts export
```

### Files to Create/Modify
- `src/components/layouts/Container.tsx` (new)
- `src/components/layouts/index.ts`
- `src/styles/tokens.css`

### Verification
- [ ] All size variants work
- [ ] Container queries functional
- [ ] Padding responsive
- [ ] TypeScript types complete
- [ ] Exported from barrel file

---

## Task 1.6: Stack & Cluster Layout Primitives

**Goal**: Create Stack (vertical) and Cluster (horizontal) layout components
**Status**: ✅ Complete

### Prompt

```
Create V5 Stack and Cluster layout primitive components.

REQUIREMENTS:
- Stack: vertical spacing with gap
- Cluster: horizontal spacing with wrap
- Use CSS gap (not margins)
- Support all spacing tokens

STACK COMPONENT:
- Vertical flex layout
- Consistent gap between children
- Optional dividers between items

Props:
- gap: SpacingToken (default: 'space-4')
- divider: boolean | ReactNode
- align: 'start' | 'center' | 'end' | 'stretch' (default: 'stretch')
- as: ElementType (default: 'div')

CLUSTER COMPONENT:
- Horizontal flex layout with wrap
- Gap between items (row and column)
- Alignment control

Props:
- gap: SpacingToken (default: 'space-4')
- align: 'start' | 'center' | 'end' | 'baseline' (default: 'center')
- justify: 'start' | 'center' | 'end' | 'between' (default: 'start')
- wrap: boolean (default: true)
- as: ElementType (default: 'div')

SPACING TOKEN TYPE:
type SpacingToken = 'space-1' | 'space-2' | 'space-3' | 'space-4' |
                    'space-6' | 'space-8' | 'space-12' | 'space-16'

IMPLEMENTATION:
1. Create src/components/layouts/Stack.tsx
2. Create src/components/layouts/Cluster.tsx
3. Create SpacingToken type in types file
4. Export from layouts barrel file
5. Add JSDoc documentation

EXAMPLE USAGE:
<Stack gap="space-6">
  <Header />
  <Content />
  <Footer />
</Stack>

<Cluster gap="space-2" justify="between">
  <Tag>Category</Tag>
  <Tag>Popular</Tag>
  <Price>$12.99</Price>
</Cluster>

OUTPUT:
- Stack.tsx component
- Cluster.tsx component
- Type definitions
- Barrel file exports
```

### Files to Create/Modify
- `src/components/layouts/Stack.tsx` (new)
- `src/components/layouts/Cluster.tsx` (new)
- `src/components/layouts/index.ts`
- `src/types/layout.ts` (new)

### Verification
- [ ] Stack renders vertically with gap
- [ ] Cluster renders horizontally with wrap
- [ ] All spacing tokens work
- [ ] Alignment props functional
- [ ] TypeScript types complete

---

## Task 1.7: Grid Component

**Goal**: Create responsive Grid layout component
**Status**: ✅ Complete

### Prompt

```
Create V5 Grid component with responsive column support.

REQUIREMENTS:
- CSS Grid based
- Responsive column counts
- Gap using spacing tokens
- Auto-fit/auto-fill support

GRID PROPS:
- cols: number | ResponsiveCols (columns at each breakpoint)
- gap: SpacingToken (default: 'space-4')
- rowGap: SpacingToken (optional, defaults to gap)
- colGap: SpacingToken (optional, defaults to gap)
- autoFit: boolean (use auto-fit with minmax)
- minChildWidth: string (for autoFit, e.g., '280px')
- as: ElementType (default: 'div')

RESPONSIVE COLS TYPE:
type ResponsiveCols = {
  base?: number;   // mobile first
  sm?: number;     // 640px+
  md?: number;     // 768px+
  lg?: number;     // 1024px+
  xl?: number;     // 1280px+
}

IMPLEMENTATION:
1. Create src/components/layouts/Grid.tsx
2. Handle responsive breakpoints via CSS
3. Support auto-fit with minmax
4. Export from layouts barrel file
5. Add JSDoc documentation

EXAMPLE USAGE:
// Fixed columns
<Grid cols={3} gap="space-6">
  <Card /><Card /><Card />
</Grid>

// Responsive columns
<Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="space-4">
  <MenuItem /><MenuItem /><MenuItem />
</Grid>

// Auto-fit (responsive without breakpoints)
<Grid autoFit minChildWidth="280px" gap="space-4">
  {items.map(item => <Card key={item.id} />)}
</Grid>

OUTPUT:
- Grid.tsx component
- ResponsiveCols type
- Barrel file export
```

### Files to Create/Modify
- `src/components/layouts/Grid.tsx` (new)
- `src/components/layouts/index.ts`
- `src/types/layout.ts`

### Verification
- [ ] Fixed columns work
- [ ] Responsive columns work
- [ ] Auto-fit works with minChildWidth
- [ ] Gap uses spacing tokens
- [ ] TypeScript types complete

---

## Task 1.8: SafeArea Component

**Goal**: Create SafeArea component for mobile device notches/cutouts
**Status**: ✅ Complete

### Prompt

```
Create V5 SafeArea component for all modern device safe areas.

REQUIREMENTS:
- Support iOS notch/Dynamic Island
- Support Android punch-holes and gesture areas
- Use env() safe-area-inset-* values
- Configurable edges (top, bottom, left, right)

SAFE AREA EDGES:
- top: iPhone notch, Android status bar
- bottom: iPhone home indicator, Android gesture bar
- left: Landscape mode cutouts
- right: Landscape mode cutouts

PROPS:
- edges: ('top' | 'bottom' | 'left' | 'right')[] (default: all)
- mode: 'padding' | 'margin' (default: 'padding')
- min: SpacingToken (minimum spacing even without safe area)
- as: ElementType (default: 'div')
- className: string

CSS IMPLEMENTATION:
Use env() with fallbacks:
- padding-top: max(env(safe-area-inset-top), var(--space-4));
- padding-bottom: max(env(safe-area-inset-bottom), var(--space-4));

IMPLEMENTATION:
1. Create src/components/layouts/SafeArea.tsx
2. Add safe-area CSS utilities to tokens.css
3. Support viewport-fit=cover meta tag
4. Export from layouts barrel file
5. Add JSDoc documentation

EXAMPLE USAGE:
// Full safe area wrapper
<SafeArea edges={['top', 'bottom']}>
  <AppContent />
</SafeArea>

// Bottom safe area for fixed footer
<SafeArea edges={['bottom']} min="space-4">
  <BottomNav />
</SafeArea>

// Just for specific component
<SafeArea edges={['top']} as="header">
  <Header />
</SafeArea>

LAYOUT.TSX UPDATE:
Ensure viewport meta tag includes:
<meta name="viewport" content="viewport-fit=cover" />

OUTPUT:
- SafeArea.tsx component
- Safe area CSS utilities
- Updated layout.tsx viewport meta
- Barrel file export
```

### Files to Create/Modify
- `src/components/layouts/SafeArea.tsx` (new)
- `src/components/layouts/index.ts`
- `src/styles/tokens.css`
- `src/app/layout.tsx`

### Verification
- [ ] iOS notch handling works
- [ ] Android gesture bar works
- [ ] Fallback spacing when no safe area
- [ ] viewport-fit=cover in meta
- [ ] All edge combinations work

---

## Sprint 1 Completion Checklist

Before marking Sprint 1 complete:

### Token System
- [ ] Colors: High contrast values, dark mode
- [ ] Typography: Playfair + Inter, optimized loading
- [ ] Spacing: 4px grid, all values defined
- [ ] Elevation: 6 levels, warm shadows
- [ ] Motion: Durations, easings, Framer presets
- [ ] Z-index: Layer system defined

### Layout Primitives
- [ ] Container: Size variants, container queries
- [ ] Stack: Vertical layout with gap
- [ ] Cluster: Horizontal layout with wrap
- [ ] Grid: Responsive columns, auto-fit
- [ ] SafeArea: All device safe areas

### Quality Gates
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] No hardcoded colors/spacing in new code
- [ ] All components have JSDoc
- [ ] Exports in barrel files

### Performance
- [ ] No CLS from font loading
- [ ] CSS tokens load before components
- [ ] Reduced motion respected

---

## Execution Order

Recommended order for dependencies:

1. **Task 1.1** (Colors) — Base for all components
2. **Task 1.2** (Typography) — Affects all text
3. **Task 1.3** (Spacing/Elevation) — Layout foundation
4. **Task 1.4** (Motion) — Animation standardization
5. **Task 1.5** (Container) — Primary layout wrapper
6. **Task 1.6** (Stack/Cluster) — Common patterns
7. **Task 1.7** (Grid) — Complex layouts
8. **Task 1.8** (SafeArea) — Device support

---

## Files Created This Sprint

```
src/
├── components/
│   └── layouts/
│       ├── index.ts (updated)
│       ├── Container.tsx (new)
│       ├── Stack.tsx (new)
│       ├── Cluster.tsx (new)
│       ├── Grid.tsx (new)
│       └── SafeArea.tsx (new)
├── lib/
│   └── motion-tokens.ts (new)
├── styles/
│   └── tokens.css (updated)
└── types/
    └── layout.ts (new)
```
