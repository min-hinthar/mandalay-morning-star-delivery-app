# Responsive Architecture

## Mobile-First Strategy

Write base styles for mobile, enhance for larger screens.

### Why Mobile-First
- Forces prioritization of content
- Smaller CSS payload for mobile
- Progressive enhancement over degradation
- Matches natural complexity growth

### Pattern
```css
/* Base: Mobile */
.container {
  padding: 16px;
  flex-direction: column;
}

/* Enhanced: Tablet+ */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    flex-direction: row;
  }
}
```

## Breakpoint System

### Standard Breakpoints
| Name | Width | Device Context |
|------|-------|----------------|
| xs | 0-639px | Small phones |
| sm | 640px | Large phones landscape |
| md | 768px | Tablets portrait |
| lg | 1024px | Tablets landscape, small laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

### Tailwind Defaults
```js
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

### Content-Based Breakpoints
Prefer breakpoints where content breaks, not arbitrary device widths.

```css
/* Bad: Device-based */
@media (min-width: 768px) { ... }

/* Better: Content-based */
@media (min-width: 45rem) { /* ~720px, where this layout breaks */ }
```

## Container Queries

Component-level responsiveness based on container size, not viewport.

### Setup
```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

### Use Cases
- Cards that adapt in different layouts
- Sidebars that collapse independently
- Widgets used in various contexts

## Viewport Units

### Modern Units
| Unit | Description | Use Case |
|------|-------------|----------|
| `vh` | 1% of viewport height | Legacy, avoid on mobile |
| `dvh` | 1% of dynamic viewport | Full-height mobile layouts |
| `svh` | 1% of small viewport | Minimum safe height |
| `lvh` | 1% of large viewport | Maximum possible height |

### Mobile Address Bar Fix
```css
/* Bad: Jumps when address bar hides */
.hero {
  height: 100vh;
}

/* Good: Accounts for dynamic chrome */
.hero {
  height: 100dvh;
}

/* Fallback for older browsers */
.hero {
  height: 100vh;
  height: 100dvh;
}
```

## Touch Targets

### Minimum Sizes
| Context | Minimum | Recommended |
|---------|---------|-------------|
| Primary actions | 44×44px | 48×48px |
| Secondary actions | 36×36px | 44×44px |
| Dense UI | 32×32px | 36×36px |

### Implementation
```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Invisible touch expansion */
.icon-button {
  position: relative;
}

.icon-button::before {
  content: "";
  position: absolute;
  inset: -8px; /* Expand touch area */
}
```

## Safe Areas

Handle device notches, home indicators, and rounded corners.

### CSS Environment Variables
```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.header {
  padding-top: env(safe-area-inset-top, 0);
}

.sidebar {
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}
```

### Meta Tag Required
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## Responsive Typography

### Fluid Type Scale
```css
/* Clamp: min, preferred, max */
.heading {
  font-size: clamp(1.5rem, 4vw + 1rem, 3rem);
}

.body {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.25rem);
}
```

### Line Length
```css
.prose {
  max-width: 65ch; /* Optimal reading width */
}
```

## Layout Patterns

### Stack (Vertical)
```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

### Cluster (Horizontal, wrapping)
```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
```

### Sidebar (Fixed + Fluid)
```css
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.sidebar {
  flex-basis: 300px;
  flex-grow: 1;
}

.content {
  flex-basis: 0;
  flex-grow: 999;
  min-width: 50%;
}
```

### Grid Auto-Fit
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}
```

## Responsive Images

### Srcset for Density
```html
<img
  src="image.jpg"
  srcset="image.jpg 1x, image@2x.jpg 2x, image@3x.jpg 3x"
  alt="Description"
>
```

### Srcset for Width
```html
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px"
  alt="Description"
>
```

### Art Direction
```html
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.jpg">
  <source media="(min-width: 640px)" srcset="hero-medium.jpg">
  <img src="hero-mobile.jpg" alt="Hero">
</picture>
```

## Testing Checklist

- [ ] Test at all breakpoints (320, 375, 414, 768, 1024, 1280, 1536)
- [ ] Verify touch targets on mobile
- [ ] Test with device toolbar in Chrome/Firefox
- [ ] Check safe area handling on notched devices
- [ ] Verify text remains readable at all sizes
- [ ] Test orientation changes (portrait ↔ landscape)
- [ ] Verify images load appropriate sizes
- [ ] Test container queries in different contexts
