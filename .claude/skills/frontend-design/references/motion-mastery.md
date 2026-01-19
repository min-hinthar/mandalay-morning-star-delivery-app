# Motion Mastery

## The 5 Motion Categories

Every animation falls into one of five categories:

| Category | Purpose | Duration | Easing | Examples |
|----------|---------|----------|--------|----------|
| **Enter** | Introduce elements | 200-400ms | ease-out | Page load, modal open |
| **Exit** | Remove gracefully | 150-300ms | ease-in | Close, dismiss, delete |
| **Emphasis** | Draw attention | 100-200ms | spring | Button press, selection |
| **Feedback** | Confirm actions | 150-250ms | snappy | Success check, error shake |
| **Ambient** | Continuous delight | 1000ms+ | linear | Loading, background |

## Timing Guidelines

### Duration by Distance
| Distance Traveled | Duration |
|-------------------|----------|
| < 100px | 150-200ms |
| 100-500px | 200-350ms |
| > 500px | 300-500ms |

### Duration by Complexity
| Complexity | Duration |
|------------|----------|
| Simple (fade, scale) | 150-250ms |
| Medium (slide, expand) | 200-350ms |
| Complex (orchestrated) | 300-500ms |

## Easing Functions

### Standard Easings
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);      /* Exits */
--ease-out: cubic-bezier(0, 0, 0.2, 1);     /* Enters */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Symmetrical */
```

### Custom Easings
```css
--ease-snappy: cubic-bezier(0.2, 0, 0, 1);     /* Feedback */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);   /* Natural */
```

## Spring Physics

Springs create natural, physical motion.

### Spring Configurations
| Feel | Stiffness | Damping | Mass | Use Case |
|------|-----------|---------|------|----------|
| Snappy | 400 | 30 | 1 | Buttons, toggles |
| Bouncy | 300 | 10 | 1 | Playful interactions |
| Gentle | 100 | 15 | 1 | Page transitions |
| Heavy | 200 | 25 | 2 | Large elements |

### Framer Motion Spring Example
```tsx
const spring = {
  type: "spring",
  stiffness: 400,
  damping: 30
} as const;

<motion.div animate={{ scale: 1.1 }} transition={spring} />
```

## Orchestration Principles

### Stagger Formula
```
delay = baseDelay + (index × staggerDelay)
```

Recommended values:
- `staggerDelay`: 30-75ms per item
- Maximum total delay: 400ms
- Limit visible staggers to 5-8 items

### Stagger Example
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};
```

### Choreography Order
1. **Container** before children
2. **Left to right** for reading direction
3. **Top to bottom** for vertical lists
4. **Center out** for radial patterns

## Common Patterns

### Page Transition
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
  }
};
```

### Modal Open/Close
```tsx
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};
```

### Drawer (Responsive)
```tsx
const drawerVariants = {
  mobile: {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" }
  },
  desktop: {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" }
  }
};
```

### Success Feedback
```tsx
const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};
```

### Error Shake
```tsx
const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};
```

## Reduced Motion

Always respect user preferences.

### Detection
```tsx
const shouldReduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Or with hook
import { useReducedMotion } from "framer-motion";
const shouldReduce = useReducedMotion();
```

### Strategy
```tsx
const variants = shouldReduceMotion
  ? {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    }
  : {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    };
```

### CSS Approach
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Guidelines

### Animate Only Transform and Opacity
```css
/* Good - GPU accelerated */
transform: translateX(100px);
opacity: 0.5;

/* Avoid - triggers layout */
width: 100px;
height: 100px;
top: 50px;
margin: 10px;
```

### Will-Change Sparingly
```css
/* Only on elements about to animate */
.will-animate {
  will-change: transform, opacity;
}

/* Remove after animation */
.animation-complete {
  will-change: auto;
}
```

### Frame Budget
- Target: 60fps (16.67ms per frame)
- Animation JS: < 4ms
- Leave headroom for layout/paint

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Animate width/height | Use transform: scale() |
| Long animations (>500ms) | Keep under 400ms for interactions |
| Everything animates | Choose high-impact moments |
| Same duration everywhere | Match duration to distance/importance |
| Ignore reduced motion | Always provide alternative |
