# docs/frontend-design-system.md — UI/UX Design System (v1.0)

> **Aesthetic Direction**: Warm, premium fast-casual dining — NOT generic AI slop
> **Inspiration**: Panda Express web ordering UX + Burmese cultural warmth
> **Last Updated**: 2026-01-13

---

## 1. Design Philosophy

### 1.1 Brand Essence

**Mandalay Morning Star** evokes:
- **Warmth**: Golden saffron, sunrise, hospitality
- **Authenticity**: Burmese heritage, homestyle cooking
- **Accessibility**: Fast-casual ordering, familiar patterns
- **Premium Quality**: Not cheap takeout — elevated comfort food

### 1.2 Key UX Principles

1. **Speed to Order**: Minimize clicks from menu to cart (Panda Express pattern)
2. **Visual Appetite**: Food photography drives decisions
3. **Cultural Pride**: Burmese script prominent but not obstructive
4. **Mobile-First**: 70%+ users on mobile
5. **Forgiving**: Easy to modify, undo, correct mistakes

### 1.3 Anti-Patterns (Avoid)

❌ Generic AI aesthetic (purple gradients, Inter font, card-heavy layouts)
❌ Over-designed animations that slow ordering
❌ Cluttered modals with too many choices
❌ Text-heavy without visual hierarchy
❌ Desktop-first responsive breakpoints
❌ Stock photography of non-Burmese food
❌ Overly formal/corporate tone

---

## 2. Color System

### 2.1 Primary Palette

```css
:root {
  /* Primary — Saffron Gold (warm, inviting, premium) */
  --color-saffron-50: #FFFBEB;
  --color-saffron-100: #FEF3C7;
  --color-saffron-200: #FDE68A;
  --color-saffron-300: #FCD34D;
  --color-saffron-400: #FBBF24;
  --color-saffron-500: #D4A017;  /* Primary brand color */
  --color-saffron-600: #B8860B;
  --color-saffron-700: #92400E;
  --color-saffron-800: #78350F;
  --color-saffron-900: #451A03;
  
  /* Secondary — Curry Brown (earthy, grounded) */
  --color-curry-50: #FDF8F6;
  --color-curry-100: #F2E8E5;
  --color-curry-200: #EADDD7;
  --color-curry-300: #D6C4BC;
  --color-curry-400: #B8A398;
  --color-curry-500: #8B4513;  /* Secondary accent */
  --color-curry-600: #7C3E12;
  --color-curry-700: #6D3710;
  --color-curry-800: #5E300E;
  --color-curry-900: #4A260B;
  
  /* Accent — Jade Green (action, success) */
  --color-jade-50: #ECFDF5;
  --color-jade-100: #D1FAE5;
  --color-jade-200: #A7F3D0;
  --color-jade-300: #6EE7B7;
  --color-jade-400: #34D399;
  --color-jade-500: #2E8B57;  /* Primary action color */
  --color-jade-600: #059669;
  --color-jade-700: #047857;
  --color-jade-800: #065F46;
  --color-jade-900: #064E3B;
}
```

### 2.2 Neutral Palette

```css
:root {
  /* Cream — Background warmth */
  --color-cream-50: #FFFEF7;   /* Primary background */
  --color-cream-100: #FFFCEB;
  --color-cream-200: #FFF8D6;
  
  /* Charcoal — Text hierarchy */
  --color-charcoal-50: #F9FAFB;
  --color-charcoal-100: #F3F4F6;
  --color-charcoal-200: #E5E7EB;
  --color-charcoal-300: #D1D5DB;
  --color-charcoal-400: #9CA3AF;
  --color-charcoal-500: #6B7280;
  --color-charcoal-600: #4B5563;
  --color-charcoal-700: #374151;
  --color-charcoal-800: #1F2937;
  --color-charcoal-900: #1A1A1A;  /* Primary text */
}
```

### 2.3 Semantic Colors

```css
:root {
  /* Semantic */
  --color-success: var(--color-jade-500);
  --color-error: #DC2626;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  
  /* Overlays */
  --color-overlay-light: rgba(255, 255, 247, 0.95);
  --color-overlay-dark: rgba(26, 26, 26, 0.75);
  
  /* Shadows (warm-tinted) */
  --shadow-sm: 0 1px 2px 0 rgba(139, 69, 19, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -1px rgba(139, 69, 19, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(139, 69, 19, 0.1), 0 4px 6px -2px rgba(139, 69, 19, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(139, 69, 19, 0.1), 0 10px 10px -5px rgba(139, 69, 19, 0.04);
}
```

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  /* Display — Elegant serif for headings and brand */
  --font-display: 'Playfair Display', 'Georgia', serif;
  
  /* Body — Clean geometric sans for readability */
  --font-body: 'DM Sans', 'Helvetica Neue', sans-serif;
  
  /* Mono — For prices, order numbers */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  
  /* Burmese — Native script support */
  --font-burmese: 'Padauk', 'Noto Sans Myanmar', sans-serif;
}
```

### 3.2 Type Scale

```css
:root {
  /* Sizes (mobile-first) */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Letter spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

### 3.3 Typography Components

```tsx
// Heading hierarchy
<h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-charcoal-900">
  Our Menu
</h1>

<h2 className="font-display text-2xl md:text-3xl font-semibold text-charcoal-900">
  Curries
</h2>

<h3 className="font-body text-lg font-semibold text-charcoal-800">
  Chicken Curry
</h3>

// Burmese text (secondary)
<span className="font-burmese text-sm text-charcoal-500">
  ကြက်သားဟင်း
</span>

// Price display
<span className="font-mono text-lg font-semibold text-jade-600">
  $14.00
</span>

// Body text
<p className="font-body text-base text-charcoal-600 leading-relaxed">
  Farm-raised chicken curry with aromatic spices...
</p>
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### 4.2 Container Widths

```css
:root {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}

/* Page container */
.container {
  width: 100%;
  max-width: var(--container-xl);
  margin-inline: auto;
  padding-inline: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--space-6);
  }
}
```

### 4.3 Grid System

```tsx
// Menu item grid (responsive)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</div>

// Checkout layout
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
  <main>{/* Checkout form */}</main>
  <aside>{/* Order summary */}</aside>
</div>
```

---

## 5. Components

### 5.1 Buttons

```tsx
// Primary action (Add to Cart, Checkout)
<Button variant="primary" size="lg">
  Add to Cart — $18.00
</Button>

// Styles
const buttonVariants = {
  primary: `
    bg-jade-500 hover:bg-jade-600 active:bg-jade-700
    text-white font-semibold
    shadow-md hover:shadow-lg
    transition-all duration-150
  `,
  secondary: `
    bg-saffron-100 hover:bg-saffron-200 active:bg-saffron-300
    text-curry-700 font-medium
    border border-saffron-300
  `,
  ghost: `
    bg-transparent hover:bg-charcoal-100
    text-charcoal-700 font-medium
  `,
  danger: `
    bg-red-500 hover:bg-red-600
    text-white font-semibold
  `,
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
  xl: 'px-8 py-4 text-xl rounded-2xl',
};
```

### 5.2 Cards

```tsx
// Menu Item Card
<article className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
  {/* Image */}
  <div className="relative aspect-[4/3] overflow-hidden">
    <Image
      src={item.imageUrl}
      alt={item.nameEn}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-500"
    />
    {item.isSoldOut && (
      <div className="absolute inset-0 bg-charcoal-900/60 flex items-center justify-center">
        <span className="text-white font-semibold text-lg">Sold Out</span>
      </div>
    )}
    {item.isPopular && (
      <Badge className="absolute top-3 left-3">Popular</Badge>
    )}
  </div>
  
  {/* Content */}
  <div className="p-4">
    <h3 className="font-body font-semibold text-charcoal-900">
      {item.nameEn}
    </h3>
    <p className="font-burmese text-sm text-charcoal-500 mt-0.5">
      {item.nameMy}
    </p>
    <p className="text-sm text-charcoal-600 mt-2 line-clamp-2">
      {item.descriptionEn}
    </p>
    <div className="flex items-center justify-between mt-4">
      <span className="font-mono font-semibold text-jade-600">
        ${(item.basePriceCents / 100).toFixed(2)}
      </span>
      <AllergenIcons allergens={item.allergens} />
    </div>
  </div>
</article>
```

### 5.3 Category Tabs

```tsx
// Horizontal scrolling category tabs (Panda Express style)
<nav className="sticky top-16 z-40 bg-cream-50/95 backdrop-blur-sm border-b border-saffron-200">
  <div className="container">
    <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3 -mx-4 px-4">
      {categories.map(cat => (
        <button
          key={cat.slug}
          onClick={() => scrollToCategory(cat.slug)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
            activeCategory === cat.slug
              ? "bg-saffron-500 text-white shadow-md"
              : "bg-white text-charcoal-600 hover:bg-saffron-100 border border-charcoal-200"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  </div>
</nav>
```

### 5.4 Cart Drawer

```tsx
// Slide-over drawer (mobile-first)
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right" className="w-full sm:max-w-md bg-cream-50">
    <SheetHeader className="border-b border-saffron-200 pb-4">
      <SheetTitle className="font-display text-2xl">Your Cart</SheetTitle>
      <SheetDescription>
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </SheetDescription>
    </SheetHeader>
    
    <div className="flex-1 overflow-y-auto py-4">
      {items.map(item => (
        <CartItem key={item.cartItemId} {...item} />
      ))}
    </div>
    
    <SheetFooter className="border-t border-saffron-200 pt-4">
      <div className="w-full space-y-3">
        <div className="flex justify-between text-charcoal-600">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        <DeliveryFeeDisplay subtotal={subtotal} />
        <Button variant="primary" size="xl" className="w-full">
          Checkout — ${estimatedTotal.toFixed(2)}
        </Button>
      </div>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### 5.5 Item Detail Modal

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
    {/* Hero image */}
    <div className="relative h-48 sm:h-64">
      <Image src={item.imageUrl} alt={item.nameEn} fill className="object-cover" />
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 bg-white/90 hover:bg-white"
        onClick={() => setIsOpen(false)}
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
    
    {/* Content */}
    <div className="p-6 overflow-y-auto max-h-[50vh]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">{item.nameEn}</h2>
          <p className="font-burmese text-charcoal-500 mt-1">{item.nameMy}</p>
        </div>
        <span className="font-mono text-xl font-semibold text-jade-600">
          ${(item.basePriceCents / 100).toFixed(2)}
        </span>
      </div>
      
      <p className="text-charcoal-600 mt-4">{item.descriptionEn}</p>
      
      {item.allergens.length > 0 && (
        <AllergenWarning allergens={item.allergens} className="mt-4" />
      )}
      
      {/* Modifier groups */}
      {item.modifierGroups.map(group => (
        <ModifierGroup key={group.id} group={group} />
      ))}
      
      {/* Quantity */}
      <QuantitySelector value={quantity} onChange={setQuantity} className="mt-6" />
      
      {/* Notes */}
      <Textarea
        placeholder="Special instructions (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        maxLength={500}
        className="mt-4"
      />
    </div>
    
    {/* Footer */}
    <div className="p-6 border-t border-saffron-200 bg-cream-100">
      <Button
        variant="primary"
        size="xl"
        className="w-full"
        disabled={!isValid}
        onClick={handleAddToCart}
      >
        Add to Cart — ${totalPrice.toFixed(2)}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## 6. Motion & Animation

### 6.1 Timing Tokens

```css
:root {
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;
  
  /* Easings */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

### 6.2 Framer Motion Variants

```tsx
// Page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Staggered list items
export const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Cart drawer
export const drawerVariants = {
  hidden: { x: '100%' },
  visible: { 
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: { 
    x: '100%',
    transition: { duration: 0.2 },
  },
};

// Modal
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 400 },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// Cart badge bounce
export const badgeBounce = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.3, 1],
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};
```

### 6.3 Micro-Interactions

```tsx
// Button press
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>
  Add to Cart
</motion.button>

// Card hover
<motion.article
  whileHover={{ y: -4 }}
  transition={{ duration: 0.2 }}
>
  {/* Card content */}
</motion.article>

// Quantity change
<motion.span
  key={quantity}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="font-mono"
>
  {quantity}
</motion.span>

// Checkbox/Radio selection
<motion.div
  initial={false}
  animate={{ 
    backgroundColor: selected ? 'var(--color-jade-500)' : 'transparent',
    borderColor: selected ? 'var(--color-jade-500)' : 'var(--color-charcoal-300)',
  }}
  transition={{ duration: 0.15 }}
>
  {selected && (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500 }}
    >
      <Check className="w-4 h-4 text-white" />
    </motion.div>
  )}
</motion.div>
```

---

## 7. Iconography

### 7.1 Icon Library

Use **Lucide React** for consistent, clean icons.

```tsx
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Settings,
  LogOut,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
```

### 7.2 Allergen Icons (Custom)

```tsx
// Custom SVG icons for allergens
const ALLERGEN_ICONS = {
  peanuts: <PeanutIcon />,
  tree_nuts: <TreeNutIcon />,
  shellfish: <ShrimpIcon />,
  fish: <FishIcon />,
  egg: <EggIcon />,
  dairy: <MilkIcon />,
  gluten_wheat: <WheatIcon />,
  soy: <SoyIcon />,
  sesame: <SesameIcon />,
};

// Allergen badge component
function AllergenBadge({ allergen }: { allergen: string }) {
  return (
    <Tooltip content={ALLERGEN_LABELS[allergen]}>
      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
        {ALLERGEN_ICONS[allergen]}
      </div>
    </Tooltip>
  );
}
```

---

## 8. Responsive Patterns

### 8.1 Breakpoints

```css
/* Tailwind defaults (don't change) */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### 8.2 Mobile-First Patterns

```tsx
// Navigation: bottom bar on mobile, header on desktop
{isMobile ? (
  <MobileBottomNav />
) : (
  <DesktopHeader />
)}

// Menu grid: 1 → 2 → 3 → 4 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Cart: drawer on mobile, sidebar on desktop checkout
{isMobile ? (
  <CartDrawer />
) : (
  <CartSidebar />
)}

// Checkout: stacked on mobile, two-column on desktop
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">
```

### 8.3 Touch Targets

```css
/* Minimum touch target: 44x44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Generous tap areas for buttons */
button, a {
  @apply min-h-[44px] px-4;
}
```

---

## 9. Accessibility

### 9.1 Color Contrast

- All text meets WCAG 2.1 AA (4.5:1 for normal, 3:1 for large)
- Interactive elements have visible focus states
- Don't rely on color alone (use icons/text too)

### 9.2 Focus States

```css
/* Custom focus ring */
.focus-ring {
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500 focus-visible:ring-offset-2;
}

/* Skip link */
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-jade-500 focus:text-white focus:rounded-lg;
}
```

### 9.3 ARIA Patterns

```tsx
// Modal with proper ARIA
<Dialog aria-labelledby="modal-title" aria-describedby="modal-description">
  <DialogTitle id="modal-title">Item Details</DialogTitle>
  <DialogDescription id="modal-description">
    Customize your order
  </DialogDescription>
</Dialog>

// Live region for cart updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {lastAction}
</div>

// Radio group for modifiers
<RadioGroup aria-label="Choose protein">
  <RadioGroupItem value="chicken" aria-label="Chicken" />
  <RadioGroupItem value="pork" aria-label="Pork" />
</RadioGroup>
```

---

## 10. Loading & Empty States

### 10.1 Skeleton Loaders

```tsx
// Menu item skeleton
function ItemCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white">
      <Skeleton className="aspect-[4/3]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

// Use with staggered animation
<motion.div variants={listVariants} initial="hidden" animate="visible">
  {Array.from({ length: 8 }).map((_, i) => (
    <motion.div key={i} variants={listItemVariants}>
      <ItemCardSkeleton />
    </motion.div>
  ))}
</motion.div>
```

### 10.2 Empty States

```tsx
// Empty cart
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-saffron-100 flex items-center justify-center mb-4">
        <ShoppingCart className="w-10 h-10 text-saffron-500" />
      </div>
      <h3 className="font-display text-xl font-semibold text-charcoal-900">
        Your cart is empty
      </h3>
      <p className="text-charcoal-600 mt-2 max-w-xs">
        Explore our menu and add some delicious Burmese dishes!
      </p>
      <Button variant="primary" className="mt-6" asChild>
        <Link href="/menu">Browse Menu</Link>
      </Button>
    </div>
  );
}

// No search results
function NoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <Search className="w-12 h-12 text-charcoal-300 mx-auto" />
      <h3 className="font-semibold text-charcoal-900 mt-4">
        No results for "{query}"
      </h3>
      <p className="text-charcoal-600 mt-2">
        Try adjusting your search or browse our categories
      </p>
    </div>
  );
}
```

---

## 11. Error States

```tsx
// Form field error
<div className="space-y-2">
  <Label htmlFor="address" className={error ? 'text-red-600' : ''}>
    Delivery Address
  </Label>
  <Input
    id="address"
    className={error ? 'border-red-500 focus:ring-red-500' : ''}
    aria-invalid={!!error}
    aria-describedby={error ? 'address-error' : undefined}
  />
  {error && (
    <p id="address-error" className="text-sm text-red-600 flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      {error}
    </p>
  )}
</div>

// Coverage error banner
function CoverageError({ distance, maxDistance }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="w-5 h-5" />
      <AlertTitle>Outside Delivery Area</AlertTitle>
      <AlertDescription>
        Your address is {distance} miles from our kitchen. 
        We currently deliver within {maxDistance} miles.
      </AlertDescription>
    </Alert>
  );
}

// Full-page error
function ErrorPage({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display text-2xl font-bold mt-6">
          Something went wrong
        </h1>
        <p className="text-charcoal-600 mt-2">{error.message}</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 12. Reference: Panda Express Patterns

### What to Emulate

✅ **Category tabs**: Sticky, horizontally scrollable, clear active state
✅ **Item cards**: Prominent image, clear price, quick visual scan
✅ **Add to cart**: Single tap opens modal, clear "Add" CTA
✅ **Cart summary**: Always visible total, clear checkout path
✅ **Mobile-first**: Bottom navigation, full-width buttons
✅ **Speed**: Fast loading, minimal clicks to checkout

### What to Improve

🔄 **Warmth**: Panda is fast-food neutral; we add cultural warmth (colors, typography)
🔄 **Bilingual**: Burmese script as first-class citizen
🔄 **Photography**: Authentic Burmese dishes, not stock
🔄 **Personality**: Less corporate, more homestyle hospitality

---

## 13. Implementation Checklist

### Phase 1: Foundation
- [ ] Tailwind config with custom colors, fonts, shadows
- [ ] Typography components (headings, body, prices)
- [ ] Button variants (primary, secondary, ghost, danger)
- [ ] Card component base
- [ ] Modal/Dialog wrapper with Framer Motion

### Phase 2: Menu Components
- [ ] Category tabs with scroll behavior
- [ ] Item card with all states (normal, hover, sold out)
- [ ] Item detail modal with modifier groups
- [ ] Search input with results

### Phase 3: Cart & Checkout
- [ ] Cart drawer with animations
- [ ] Cart item with quantity controls
- [ ] Checkout stepper
- [ ] Address form
- [ ] Time slot picker

### Phase 4: Polish
- [ ] Loading skeletons everywhere
- [ ] Empty states
- [ ] Error states
- [ ] Focus states
- [ ] Reduced motion support
- [ ] Print styles for confirmation
