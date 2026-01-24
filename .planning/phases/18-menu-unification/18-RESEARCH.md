# Phase 18: Menu Unification - Research

**Researched:** 2026-01-24
**Domain:** React UI Components, Glassmorphism, 3D Tilt Effects, Carousels
**Confidence:** HIGH

## Summary

This phase unifies menu item presentation across the application. The codebase already contains multiple menu card implementations (`MenuItemCard.tsx`, `menu-item-card.tsx`, `MenuItemCardV8.tsx`) with varying designs and features. A new unified `UnifiedMenuItemCard` component will consolidate these variants while adding glassmorphism styling and enhanced 3D tilt effects.

The existing codebase provides strong foundations:
- **Framer Motion** (`v12.26.1`) is already used extensively for animations including 3D tilt in `MenuItemCard.tsx`
- **Design tokens** are established in `tokens.css` with semantic naming
- **Glassmorphism utilities** exist in `globals.css` (`.glass`, `.glass-dark`)
- **Motion tokens** in `motion-tokens.ts` provide spring presets and hover effects
- **FlyToCart animation** is already implemented with GSAP
- **Carousel pattern** exists in `CategoryCarousel.tsx` using native scroll with framer-motion drag

**Primary recommendation:** Create a new `UnifiedMenuItemCard` component that consolidates existing patterns, adds glassmorphism surfaces, and enhances the 3D tilt effect with shine/reflection. Use the existing framer-motion infrastructure rather than adding new dependencies.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.26.1 | Animation library | Already in use, handles 3D transforms, springs |
| gsap | 3.14.2 | Complex animations | Already used for FlyToCart arc animation |
| tailwindcss | 4.x | Styling | Project standard, design tokens |
| lucide-react | 0.562.0 | Icons | Project standard |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | via `cn()` | Class composition | All component styling |
| zustand | 5.0.10 | State management | Cart, favorites state |
| react-hook-form | 7.71.1 | Form handling | Item customization modals |

### No New Dependencies Required
The existing stack fully supports all phase requirements. Do not add:
- react-tilt or vanilla-tilt (use framer-motion `useMotionValue`/`useTransform`)
- embla-carousel or swiper (use existing scroll-based carousel pattern)
- use-sound (haptic feedback via `navigator.vibrate` is already implemented)

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   └── menu/
│       ├── UnifiedMenuItemCard/
│       │   ├── index.ts              # Public exports
│       │   ├── UnifiedMenuItemCard.tsx    # Main component
│       │   ├── CardImage.tsx         # Image with tilt parallax
│       │   ├── CardContent.tsx       # Title, description, price
│       │   ├── AddButton.tsx         # +/- quantity controls
│       │   ├── DietaryBadges.tsx     # Tags and indicators
│       │   └── GlassOverlay.tsx      # Glassmorphism effect
│       ├── FeaturedCarousel/
│       │   ├── index.ts
│       │   ├── FeaturedCarousel.tsx  # Homepage carousel
│       │   └── CarouselControls.tsx  # Arrows + dots
│       └── CartItemCard.tsx          # Simplified cart variant
```

### Pattern 1: 3D Tilt with Framer Motion (Existing Pattern)
**What:** Mouse-tracking 3D rotation with parallax and shine effect
**When to use:** Menu cards on menu page and homepage
**Example:**
```typescript
// Source: src/components/menu/MenuItemCard.tsx (lines 226-270)
const mouseX = useMotionValue(0.5);
const mouseY = useMotionValue(0.5);

const rotateX = useSpring(
  useTransform(mouseY, [0, 1], [8, -8]),
  { stiffness: 150, damping: 15 }
);
const rotateY = useSpring(
  useTransform(mouseX, [0, 1], [-8, 8]),
  { stiffness: 150, damping: 15 }
);

// Shine effect
const shineX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);
const shineY = useTransform(mouseY, [0, 1], ["-100%", "200%"]);

// Apply to card
<motion.article
  style={{
    rotateX: shouldAnimate ? rotateX : 0,
    rotateY: shouldAnimate ? rotateY : 0,
    transformStyle: "preserve-3d",
    transformPerspective: 1000,
  }}
/>
```

### Pattern 2: Glassmorphism Surface
**What:** Frosted glass effect with backdrop blur and semi-transparent background
**When to use:** Card backgrounds, adapts to light/dark theme
**Example:**
```css
/* Source: src/app/globals.css (lines 194-210) */
.glass {
  background: color-mix(in srgb, var(--color-surface-primary) 85%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-subtle);
}

/* Enhanced for menu cards (16-24px blur per CONTEXT.md) */
.glass-menu-card {
  background: color-mix(in srgb, var(--color-surface-primary) 75%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-subtle);
}

/* Hover enhancement */
.glass-menu-card:hover {
  backdrop-filter: blur(24px);
  border-color: var(--color-primary);
  box-shadow: 0 0 20px rgba(164, 16, 52, 0.15);
}
```

### Pattern 3: Add Button State Machine
**What:** Button transforms from "Add" to quantity controls after first add
**When to use:** All menu cards with add-to-cart functionality
**Example:**
```typescript
// State machine: "idle" -> "adding" -> "quantity"
const [state, setState] = useState<"idle" | "adding" | "quantity">("idle");
const [quantity, setQuantity] = useState(0);

// On first add
const handleAdd = () => {
  setState("adding");
  // Fly animation, haptic, sound
  addToCart(item);
  setState("quantity");
  setQuantity(1);
};

// Render based on state
{state === "idle" && <AddButton onClick={handleAdd} />}
{state === "adding" && <LoadingSpinner />}
{state === "quantity" && <QuantityControls value={quantity} />}
```

### Pattern 4: Horizontal Carousel with Auto-scroll
**What:** Native scroll container with framer-motion drag, auto-advance, pause on hover
**When to use:** Homepage featured items (10 items)
**Example:**
```typescript
// Based on: src/components/menu/CategoryCarousel.tsx
const [isPaused, setIsPaused] = useState(false);
const scrollRef = useRef<HTMLDivElement>(null);

// Auto-scroll interval
useEffect(() => {
  if (isPaused) return;
  const interval = setInterval(() => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  }, 4000);
  return () => clearInterval(interval);
}, [isPaused]);

<motion.div
  ref={scrollRef}
  className="flex overflow-x-auto scrollbar-hide gap-4 px-4"
  onMouseEnter={() => setIsPaused(true)}
  onMouseLeave={() => setIsPaused(false)}
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.1}
/>
```

### Anti-Patterns to Avoid
- **Using CSS transform for tilt:** Use framer-motion `useMotionValue`/`useSpring` for smooth physics-based animation
- **Adding third-party carousel libraries:** The native scroll + framer-motion drag pattern already works well
- **Separate components per context:** Create one unified component with variants prop
- **Heavy backdrop-filter on mobile:** Add GPU check, reduce blur on lower-tier devices

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D tilt effect | Custom mouse tracking math | `useMotionValue` + `useSpring` + `useTransform` from framer-motion | Already implemented in MenuItemCard.tsx, physics-based springs |
| Fly-to-cart animation | Custom DOM manipulation | Existing `useFlyToCart` hook | Already GSAP-powered with arc trajectory |
| Quantity selector | Custom +/- controls | Existing `QuantitySelector` component | Already has flip animation, haptics |
| Haptic feedback | Custom vibration patterns | `triggerHaptic()` from `lib/animations/cart.ts` | Already handles different intensities |
| Animation preferences | Manual reduced-motion check | `useAnimationPreference()` hook | Already respects user settings |

**Key insight:** The codebase already has sophisticated animation infrastructure. The task is consolidation and enhancement, not creation.

## Common Pitfalls

### Pitfall 1: Backdrop-filter Performance on Low-end Devices
**What goes wrong:** Glassmorphism causes frame drops on older mobile devices
**Why it happens:** `backdrop-filter: blur()` is GPU-intensive, especially with animations
**How to avoid:**
- Use `detect-gpu` library (already installed) to check GPU tier
- Reduce blur intensity or disable glassmorphism on tier < 2
- Fallback to solid semi-transparent background
**Warning signs:** Choppy animations, high paint times in DevTools

### Pitfall 2: 3D Transform Z-index Issues
**What goes wrong:** Cards overlap incorrectly during hover/tilt
**Why it happens:** `transform: perspective()` creates new stacking context
**How to avoid:**
- Set explicit `z-index` on hovered card
- Use `transformStyle: "preserve-3d"` on parent container
- Increase z-index in `whileHover` state
**Warning signs:** Cards appearing behind others during animation

### Pitfall 3: Auto-scroll Carousel Interrupting User
**What goes wrong:** Auto-advance continues during user drag/scroll
**Why it happens:** No coordination between auto-scroll and user interaction
**How to avoid:**
- Pause auto-scroll on `onMouseEnter`, `onTouchStart`, `onDragStart`
- Resume on `onMouseLeave` with delay
- Cancel auto-scroll entirely if user has manually scrolled
**Warning signs:** Jarring scroll jumps, fighting with user input

### Pitfall 4: Inconsistent Card Heights in Grid
**What goes wrong:** Cards with varying content lengths create jagged grid
**Why it happens:** Dynamic description lengths, optional elements
**How to avoid:**
- Use fixed aspect ratio for image (4:3 per CONTEXT.md)
- Limit description to `line-clamp-2`
- Use `min-height` on content section
- Consider grid `align-items: stretch` with flex column on card
**Warning signs:** Cards at different heights in same row

### Pitfall 5: Sound Effects Without User Gesture
**What goes wrong:** Browser blocks audio playback, console errors
**Why it happens:** Autoplay policies require user interaction first
**How to avoid:**
- Only play sounds in response to click/tap events
- Preload sounds after first user interaction
- Use Web Audio API with user gesture context
- Wrap in try/catch for blocked playback
**Warning signs:** "NotAllowedError" in console

## Code Examples

### Unified Card Component Structure
```typescript
// Source: Based on analysis of existing patterns
interface UnifiedMenuItemCardProps {
  item: MenuItem;
  variant: "menu" | "homepage" | "cart";
  categorySlug?: string;
  onSelect?: (item: MenuItem) => void;
  onQuickAdd?: (item: MenuItem) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  disableTilt?: boolean;
  priority?: boolean; // For above-fold images
  className?: string;
}

// Variant configurations
const variantConfig = {
  menu: {
    orientation: "vertical",
    showDescription: true,
    showBadges: true,
    enableTilt: true,
    imageAspect: "aspect-[4/3]",
    rounded: "rounded-3xl", // 24px+
  },
  homepage: {
    orientation: "vertical",
    showDescription: false,
    showBadges: true,
    enableTilt: true,
    imageAspect: "aspect-[4/3]",
    rounded: "rounded-3xl",
  },
  cart: {
    orientation: "horizontal",
    showDescription: false,
    showBadges: false,
    enableTilt: false,
    imageAspect: "aspect-square",
    rounded: "rounded-xl",
  },
} as const;
```

### Glassmorphism with Theme Adaptation
```typescript
// CSS classes for theming
const glassClasses = cn(
  // Base glass effect
  "backdrop-blur-[20px]",
  "border border-border-subtle",
  // Light mode
  "bg-white/75",
  // Dark mode
  "dark:bg-surface-primary/70 dark:border-border",
  // Hover enhancement
  "hover:backdrop-blur-[24px]",
  "hover:border-primary/50",
  "hover:shadow-[0_0_20px_rgba(164,16,52,0.15)]",
  "dark:hover:shadow-[0_0_20px_rgba(232,67,99,0.2)]"
);
```

### Shine Effect Layer
```typescript
// Animated gradient overlay that follows mouse
<motion.div
  className="absolute inset-0 pointer-events-none rounded-3xl"
  style={{
    background: `linear-gradient(
      135deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    )`,
    left: shineX,  // useTransform from mouseX
    top: shineY,   // useTransform from mouseY
    opacity: isHovered ? 1 : 0,
  }}
  transition={{ opacity: { duration: 0.2 } }}
/>
```

### Featured Badge Component
```typescript
// "Popular" or "Featured" badge
const FeaturedBadge = ({ type }: { type: "popular" | "featured" }) => (
  <motion.span
    className={cn(
      "absolute top-3 left-3 z-10",
      "inline-flex items-center gap-1 px-2.5 py-1",
      "rounded-full text-xs font-semibold uppercase tracking-wide",
      "bg-secondary text-secondary-foreground",
      "shadow-sm"
    )}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={spring.ultraBouncy}
  >
    <Star className="w-3 h-3 fill-current" />
    {type === "popular" ? "Popular" : "Featured"}
  </motion.span>
);
```

### Staggered Scroll Reveal
```typescript
// Cards animate in as they scroll into view
<motion.div
  initial={{ opacity: 0, y: 18 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{
    delay: Math.min(index * 0.08, 0.64), // Cap delay at 0.64s
    duration: 0.55,
  }}
>
  <UnifiedMenuItemCard item={item} variant="menu" />
</motion.div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS transitions for tilt | Framer Motion springs | Already in codebase | Physics-based, interruptible animations |
| Separate card per context | Unified with variants | This phase | Single source of truth, consistent styling |
| Opacity-based glass | `color-mix()` + backdrop-filter | CSS Color Level 4 | Better color control, theme adaptable |
| react-tilt library | Native framer-motion | Reduces dependencies | Already have 3D in motion-tokens |

**Deprecated/outdated:**
- `menu-item-card.tsx` (V6 style): Will be replaced by unified component
- `MenuItemCard.tsx` (multiple variants): Will be consolidated
- `MenuItemCardV8.tsx`: Will be absorbed into unified component

## Open Questions

1. **Sound Effect Implementation**
   - What we know: Context requires "subtle click sounds on add/remove"
   - What's unclear: Whether to use Web Audio API or Audio elements, how to handle autoplay restrictions
   - Recommendation: Implement with Web Audio API, lazy-load sounds after first interaction, provide volume control in settings

2. **Mobile Long-press Tilt Behavior**
   - What we know: Context specifies "long press enables tilt play" on mobile
   - What's unclear: Exact gesture timing, how to communicate this to users
   - Recommendation: Use 300ms long-press threshold, show brief tooltip on first use

3. **Cart Item Styling Scope**
   - What we know: "Simplified list item (different component, not the full card)"
   - What's unclear: Whether CartItemV8 should be refactored or left as-is
   - Recommendation: Keep CartItemV8 separate but ensure visual consistency with unified card's compact styling

## Sources

### Primary (HIGH confidence)
- `src/components/menu/MenuItemCard.tsx` - Existing 3D tilt implementation
- `src/lib/motion-tokens.ts` - Animation presets and spring configurations
- `src/app/globals.css` - Existing glassmorphism utilities
- `src/styles/tokens.css` - Design tokens including radius, shadows
- `src/components/ui-v8/cart/FlyToCart.tsx` - GSAP fly animation pattern
- `src/components/menu/CategoryCarousel.tsx` - Carousel implementation pattern

### Secondary (MEDIUM confidence)
- [3D Shiny Card Tutorial](https://dev.to/arielbk/how-to-make-a-3d-shiny-card-animation-react-ts-and-framer-motion-ijf) - Framer Motion tilt technique
- [Embla Carousel Best Practices](https://www.embla-carousel.com/get-started/react/) - Alternative carousel approach if native scroll proves insufficient

### Tertiary (LOW confidence)
- [React Carousel Comparison 2026](https://blog.croct.com/post/best-react-carousel-slider-libraries) - Library recommendations (not needed for this phase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all libraries already in use
- Architecture: HIGH - Patterns directly based on existing codebase implementations
- Pitfalls: MEDIUM - Based on general web performance knowledge, verify with real device testing
- Sound effects: LOW - Not yet implemented in codebase, needs prototyping

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable patterns, mature libraries)
