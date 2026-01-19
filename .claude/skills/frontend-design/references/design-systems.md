# Design System Architecture

## Token Hierarchy

Design tokens follow a three-layer architecture for scalability:

### Layer 1: Primitives
Raw values without semantic meaning.
```css
/* Colors */
--blue-50: #eff6ff;
--blue-500: #3b82f6;
--blue-900: #1e3a8a;

/* Spacing */
--space-1: 4px;
--space-2: 8px;
--space-4: 16px;
--space-8: 32px;

/* Typography */
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
```

### Layer 2: Semantic
Role-based tokens that reference primitives.
```css
/* Surfaces */
--surface-primary: var(--white);
--surface-secondary: var(--gray-50);
--surface-tertiary: var(--gray-100);
--surface-inverse: var(--gray-900);

/* Text */
--text-primary: var(--gray-900);
--text-secondary: var(--gray-600);
--text-muted: var(--gray-400);
--text-inverse: var(--white);

/* Interactive */
--interactive-primary: var(--blue-500);
--interactive-hover: var(--blue-600);
--interactive-active: var(--blue-700);

/* Status */
--status-success: var(--green-500);
--status-error: var(--red-500);
--status-warning: var(--amber-500);
--status-info: var(--blue-500);
```

### Layer 3: Component
Scoped tokens for specific components.
```css
/* Button */
--button-bg: var(--interactive-primary);
--button-text: var(--text-inverse);
--button-radius: var(--radius-md);

/* Card */
--card-bg: var(--surface-primary);
--card-shadow: var(--elevation-1);
--card-radius: var(--radius-lg);
```

## Scale Systems

### Type Scale Ratios
| Scale | Ratio | Use Case | Example Sizes |
|-------|-------|----------|---------------|
| Minor Second | 1.067 | Dense UI, data tables | 12, 13, 14, 15 |
| Major Second | 1.125 | Body text, readable | 14, 16, 18, 20 |
| Minor Third | 1.2 | Headings, hierarchy | 14, 17, 20, 24 |
| Major Third | 1.25 | Display, marketing | 16, 20, 25, 31 |
| Perfect Fourth | 1.333 | Hero, impact | 16, 21, 28, 38 |

### Generating a Type Scale
```
base = 16px
ratio = 1.25 (Major Third)

sizes:
  xs: base / ratio² = 10.24px → 10px
  sm: base / ratio  = 12.8px  → 13px
  base: 16px
  lg: base × ratio  = 20px
  xl: base × ratio² = 25px
  2xl: base × ratio³ = 31.25px → 31px
```

## Color Architecture

### Five-Layer System
1. **Surface**: Backgrounds, containers
2. **Text**: Foreground content
3. **Interactive**: CTAs, links, buttons
4. **Status**: Success, error, warning, info
5. **Border**: Dividers, outlines, focus rings

### Dark Mode Strategy
```css
/* Light mode (default) */
:root {
  --surface-primary: var(--white);
  --text-primary: var(--gray-900);
}

/* Dark mode */
.dark {
  --surface-primary: var(--gray-900);
  --text-primary: var(--gray-50);
}
```

### Contrast Requirements
| Context | Minimum Ratio | Preferred |
|---------|---------------|-----------|
| Body text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |
| Decorative | None | - |

## Spacing System

### 4px Base Unit Grid
```
4, 8, 12, 16, 24, 32, 48, 64, 96, 128
```

### Semantic Spacing
```css
--space-inline-xs: 4px;   /* Between icons and text */
--space-inline-sm: 8px;   /* Between buttons */
--space-inline-md: 16px;  /* Between sections */

--space-stack-xs: 4px;    /* Within form fields */
--space-stack-sm: 8px;    /* Between list items */
--space-stack-md: 16px;   /* Between paragraphs */
--space-stack-lg: 24px;   /* Between sections */
--space-stack-xl: 48px;   /* Between page sections */
```

## Elevation System

### Shadow Tokens
```css
--elevation-0: none;
--elevation-1: 0 1px 2px rgba(0,0,0,0.05);
--elevation-2: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--elevation-3: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
--elevation-4: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
--elevation-5: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
--elevation-6: 0 25px 50px rgba(0,0,0,0.25);
```

### Usage Guidelines
| Level | Use Case |
|-------|----------|
| 0 | Flat elements |
| 1 | Cards, subtle depth |
| 2 | Dropdowns, hover states |
| 3 | Popovers, floating elements |
| 4 | Modals, dialogs |
| 5 | Toast notifications |
| 6 | High-priority overlays |

## Border Radius System

```css
--radius-none: 0;
--radius-sm: 4px;    /* Inputs, buttons */
--radius-md: 8px;    /* Cards, containers */
--radius-lg: 12px;   /* Modals, large cards */
--radius-xl: 16px;   /* Feature sections */
--radius-full: 9999px; /* Pills, avatars */
```

## Implementation Checklist

- [ ] Define primitive tokens (colors, spacing, typography)
- [ ] Create semantic layer mapping primitives to roles
- [ ] Add component-specific overrides where needed
- [ ] Document token usage guidelines
- [ ] Set up dark mode token swaps
- [ ] Validate contrast ratios
- [ ] Add lint rules for hardcoded values
