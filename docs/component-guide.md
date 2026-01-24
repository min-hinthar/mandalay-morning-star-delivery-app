# docs/component-guide.md — Frontend Component Implementation Guide

> **Purpose**: Detailed implementation patterns for key UI components
> **Design System**: [docs/frontend-design-system.md](frontend-design-system.md)
> **V4 Updates**: January 2026 - Performance, tokens, hooks

---

## V4 Addendum (January 2026)

### New V4 Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useLuminance` | `src/lib/hooks/useLuminance.ts` | WCAG contrast detection for dynamic backgrounds |
| `useScrollDirection` | `src/lib/hooks/useScrollDirection.ts` | Scroll direction for collapsible headers |
| `useActiveCategory` | `src/lib/hooks/useActiveCategory.ts` | Intersection Observer for scroll spy |
| `useAnimationPreference` | `src/lib/hooks/useAnimationPreference.ts` | User animation toggle (localStorage) |

### V4 Performance Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `web-vitals.ts` | `src/lib/web-vitals.ts` | Core Web Vitals monitoring |
| `dynamic-imports.tsx` | `src/lib/dynamic-imports.tsx` | Lazy loading heavy components |
| `image-optimization.ts` | `src/lib/utils/image-optimization.ts` | Image props helpers for LCP/CLS |

### V4 Component Consolidations

| V3 Components | V4 Unified Component |
|---------------|---------------------|
| `ItemCard` + `MenuItemCard` | `MenuItemCard` with `variant` prop |
| Various badges | `Badge` with semantic variants |

### V4 Token Usage

All V4 components use CSS custom properties:

```tsx
// Color tokens
className="text-[var(--color-charcoal)]"
className="bg-[var(--color-surface)]"

// Z-index tokens (use Tailwind utilities, not CSS variables)
className="z-sticky"  // z-index: 20
className="z-modal"   // z-index: 50

// Animation tokens
className="duration-[var(--duration-fast)]"
```

### V4 Animation Best Practices

```tsx
// GPU-accelerated (60fps)
<motion.div animate={{ scale: 1.05, y: -4 }} />

// ❌ Avoid (triggers layout)
<motion.div animate={{ width: "100%" }} />

// ✅ Use scaleX instead
<motion.div animate={{ scaleX: 1 }} style={{ transformOrigin: "left" }} />
```

### Storybook (Deferred to V5)

Storybook setup is planned for V5. Until then, use this guide for component documentation.

---

## 1. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Saffron Gold
        saffron: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#D4A017',
          600: '#B8860B',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
        },
        // Secondary — Curry Brown
        curry: {
          50: '#FDF8F6',
          100: '#F2E8E5',
          200: '#EADDD7',
          300: '#D6C4BC',
          400: '#B8A398',
          500: '#8B4513',
          600: '#7C3E12',
          700: '#6D3710',
          800: '#5E300E',
          900: '#4A260B',
        },
        // Accent — Jade Green
        jade: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#2E8B57',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Neutral — Cream
        cream: {
          50: '#FFFEF7',
          100: '#FFFCEB',
          200: '#FFF8D6',
        },
        // Neutral — Charcoal
        charcoal: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'Helvetica Neue', 'sans-serif'],  // V5: Updated from DM Sans
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
        burmese: ['Padauk', 'Noto Sans Myanmar', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 2px 0 rgba(139, 69, 19, 0.05)',
        'warm-md': '0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -1px rgba(139, 69, 19, 0.06)',
        'warm-lg': '0 10px 15px -3px rgba(139, 69, 19, 0.1), 0 4px 6px -2px rgba(139, 69, 19, 0.05)',
        'warm-xl': '0 20px 25px -5px rgba(139, 69, 19, 0.1), 0 10px 10px -5px rgba(139, 69, 19, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## 2. Global Styles

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  
  /* Burmese font */
  @import url('https://fonts.googleapis.com/css2?family=Padauk:wght@400;700&display=swap');
  
  :root {
    --background: 255 254 247; /* cream-50 */
    --foreground: 26 26 26;    /* charcoal-900 */
  }
  
  html {
    scroll-behavior: smooth;
  }
  
  body {
    @apply bg-cream-50 text-charcoal-900 font-body antialiased;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-cream-100;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-charcoal-300 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-charcoal-400;
  }
  
  /* Hide scrollbar for category tabs */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}

@layer components {
  /* Focus ring utility */
  .focus-ring {
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50;
  }
  
  /* Card base */
  .card {
    @apply bg-white rounded-2xl shadow-warm-md;
  }
  
  /* Button base */
  .btn {
    @apply inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring;
  }
  
  .btn-primary {
    @apply btn bg-jade-500 text-white hover:bg-jade-600 active:bg-jade-700 shadow-warm-md hover:shadow-warm-lg;
  }
  
  .btn-secondary {
    @apply btn bg-saffron-100 text-curry-700 border border-saffron-300 hover:bg-saffron-200 active:bg-saffron-300;
  }
  
  .btn-ghost {
    @apply btn bg-transparent text-charcoal-700 hover:bg-charcoal-100 active:bg-charcoal-200;
  }
}
```

---

## 3. Menu Components

### 3.1 CategoryTabs

```tsx
// components/menu/CategoryTabs.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function CategoryTabs({ categories, activeSlug, onSelect }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  // Handle scroll shadows
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll active tab into view
  useEffect(() => {
    const activeButton = scrollRef.current?.querySelector(`[data-slug="${activeSlug}"]`);
    activeButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeSlug]);

  return (
    <nav className="sticky top-16 z-40 bg-cream-50/95 backdrop-blur-sm border-b border-saffron-200">
      <div className="relative">
        {/* Left shadow */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-cream-50 to-transparent z-10 pointer-events-none transition-opacity',
            showLeftShadow ? 'opacity-100' : 'opacity-0'
          )}
        />
        
        {/* Tabs container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-4"
        >
          <TabButton
            key="all"
            slug="all"
            name="All"
            isActive={activeSlug === 'all'}
            onClick={() => onSelect('all')}
          />
          {categories.map((cat) => (
            <TabButton
              key={cat.id}
              slug={cat.slug}
              name={cat.name}
              isActive={activeSlug === cat.slug}
              onClick={() => onSelect(cat.slug)}
            />
          ))}
        </div>
        
        {/* Right shadow */}
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-cream-50 to-transparent z-10 pointer-events-none transition-opacity',
            showRightShadow ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </nav>
  );
}

interface TabButtonProps {
  slug: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ slug, name, isActive, onClick }: TabButtonProps) {
  return (
    <motion.button
      data-slug={slug}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all focus-ring',
        isActive
          ? 'bg-saffron-500 text-white shadow-warm-md'
          : 'bg-white text-charcoal-600 hover:bg-saffron-100 border border-charcoal-200'
      )}
    >
      {name}
    </motion.button>
  );
}
```

### 3.2 ItemCard

```tsx
// components/menu/ItemCard.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AllergenBadges } from './AllergenBadges';
import { formatPrice } from '@/lib/utils/currency';
import type { MenuItem } from '@/types/menu';

interface ItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  const isUnavailable = !item.isActive || item.isSoldOut;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => !isUnavailable && onSelect(item)}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden shadow-warm-md cursor-pointer focus-ring',
        isUnavailable && 'cursor-not-allowed'
      )}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !isUnavailable && onSelect(item)}
      aria-label={`${item.nameEn}, ${formatPrice(item.basePriceCents)}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.nameEn}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              'object-cover transition-transform duration-500',
              !isUnavailable && 'group-hover:scale-105'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-charcoal-400 text-sm">No image</span>
          </div>
        )}
        
        {/* Sold out overlay */}
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-charcoal-900/60 flex items-center justify-center">
            <span className="bg-white text-charcoal-900 px-4 py-2 rounded-full font-semibold text-sm">
              Sold Out
            </span>
          </div>
        )}
        
        {/* Popular badge */}
        {item.tags?.includes('popular') && !isUnavailable && (
          <div className="absolute top-3 left-3">
            <span className="bg-saffron-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-warm-md">
              Popular
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-body font-semibold text-charcoal-900 line-clamp-1">
          {item.nameEn}
        </h3>
        {item.nameMy && (
          <p className="font-burmese text-sm text-charcoal-500 mt-0.5 line-clamp-1">
            {item.nameMy}
          </p>
        )}
        {item.descriptionEn && (
          <p className="text-sm text-charcoal-600 mt-2 line-clamp-2">
            {item.descriptionEn}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <span className={cn(
            'font-mono font-semibold',
            isUnavailable ? 'text-charcoal-400' : 'text-jade-600'
          )}>
            {formatPrice(item.basePriceCents)}
          </span>
          
          {item.allergens && item.allergens.length > 0 && (
            <AllergenBadges allergens={item.allergens} size="sm" />
          )}
        </div>
      </div>
    </motion.article>
  );
}
```

### 3.3 ItemDetailModal

```tsx
// components/menu/ItemDetailModal.tsx
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModifierGroup } from './ModifierGroup';
import { AllergenWarning } from './AllergenWarning';
import { formatPrice } from '@/lib/utils/currency';
import { useCartStore } from '@/stores/cart';
import type { MenuItem, SelectedModifier } from '@/types/menu';
import { v4 as uuidv4 } from 'uuid';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, SelectedModifier[]>>({});
  
  const addItem = useCartStore((state) => state.addItem);

  // Reset state when modal opens with new item
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
      // Reset after animation
      setTimeout(() => {
        setQuantity(1);
        setNotes('');
        setSelectedModifiers({});
      }, 200);
    }
  }, [onClose]);

  if (!item) return null;

  // Calculate total price
  const modifierTotal = Object.values(selectedModifiers)
    .flat()
    .reduce((sum, mod) => sum + mod.priceDeltaCents, 0);
  const totalPrice = (item.basePriceCents + modifierTotal) * quantity;

  // Validate required modifiers
  const isValid = item.modifierGroups?.every((group) => {
    const selected = selectedModifiers[group.id] || [];
    return selected.length >= group.minSelect;
  }) ?? true;

  const handleModifierChange = (groupId: string, modifiers: SelectedModifier[]) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: modifiers,
    }));
  };

  const handleAddToCart = () => {
    const allModifiers = Object.values(selectedModifiers).flat();
    
    addItem({
      cartItemId: uuidv4(),
      menuItemId: item.id,
      menuItemSlug: item.slug,
      nameEn: item.nameEn,
      nameMy: item.nameMy || '',
      basePriceCents: item.basePriceCents,
      quantity,
      modifiers: allModifiers,
      notes: notes.trim(),
      addedAt: new Date().toISOString(),
    });
    
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-cream-50">
        {/* Hero image */}
        <div className="relative h-48 sm:h-64 bg-charcoal-100">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-charcoal-400">No image</span>
            </div>
          )}
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full shadow-warm-md"
            onClick={() => handleOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {/* Header */}
          <DialogHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-display text-2xl font-semibold text-charcoal-900">
                  {item.nameEn}
                </DialogTitle>
                {item.nameMy && (
                  <p className="font-burmese text-charcoal-500 mt-1">
                    {item.nameMy}
                  </p>
                )}
              </div>
              <span className="font-mono text-xl font-semibold text-jade-600 flex-shrink-0">
                {formatPrice(item.basePriceCents)}
              </span>
            </div>
          </DialogHeader>
          
          {/* Description */}
          {item.descriptionEn && (
            <p className="text-charcoal-600 mt-4 leading-relaxed">
              {item.descriptionEn}
            </p>
          )}
          
          {/* Allergen warning */}
          {item.allergens && item.allergens.length > 0 && (
            <AllergenWarning allergens={item.allergens} className="mt-4" />
          )}
          
          {/* Modifier groups */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="mt-6 space-y-6">
              {item.modifierGroups.map((group) => (
                <ModifierGroup
                  key={group.id}
                  group={group}
                  selectedModifiers={selectedModifiers[group.id] || []}
                  onChange={(mods) => handleModifierChange(group.id, mods)}
                />
              ))}
            </div>
          )}
          
          {/* Quantity selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 rounded-full"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <motion.span
                key={quantity}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xl font-semibold w-8 text-center"
              >
                {quantity}
              </motion.span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                disabled={quantity >= 50}
                className="h-10 w-10 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Special instructions (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any allergies or special requests..."
              maxLength={500}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-charcoal-500 mt-1 text-right">
              {notes.length}/500
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-saffron-200 bg-cream-100">
          <Button
            onClick={handleAddToCart}
            disabled={!isValid}
            className="w-full btn-primary text-lg h-14 rounded-xl"
          >
            Add to Cart — {formatPrice(totalPrice)}
          </Button>
          {!isValid && (
            <p className="text-sm text-amber-600 mt-2 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Please make required selections
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. Cart Components

### 4.1 CartDrawer

```tsx
// components/cart/CartDrawer.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartItem } from './CartItem';
import { DeliveryFeeDisplay } from './DeliveryFeeDisplay';
import { EmptyCart } from './EmptyCart';
import { useCartStore } from '@/stores/cart';
import { formatPrice } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, clearCart, getItemsSubtotal, getEstimatedDeliveryFee, getItemCount } = useCartStore();
  
  const itemCount = getItemCount();
  const subtotal = getItemsSubtotal();
  const deliveryFee = getEstimatedDeliveryFee();
  const estimatedTotal = subtotal + deliveryFee;

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-cream-50 flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-saffron-200">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="font-display text-2xl text-charcoal-900">
                Your Cart
              </SheetTitle>
              <SheetDescription className="text-charcoal-600">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </SheetDescription>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-charcoal-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>
        
        {/* Items */}
        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 p-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.cartItemId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CartItem item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
            
            {/* Footer */}
            <SheetFooter className="p-6 border-t border-saffron-200 bg-cream-100 mt-auto">
              <div className="w-full space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-charcoal-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                
                {/* Delivery fee */}
                <DeliveryFeeDisplay subtotal={subtotal} />
                
                {/* Divider */}
                <div className="border-t border-saffron-200 pt-4">
                  <div className="flex justify-between text-charcoal-900">
                    <span className="font-semibold">Estimated Total</span>
                    <span className="font-mono font-bold text-lg">
                      {formatPrice(estimatedTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Tax calculated at checkout
                  </p>
                </div>
                
                {/* Checkout button */}
                <Button
                  onClick={handleCheckout}
                  className="w-full btn-primary text-lg h-14 rounded-xl"
                >
                  Checkout — {formatPrice(estimatedTotal)}
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <EmptyCart onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### 4.2 DeliveryFeeDisplay

```tsx
// components/cart/DeliveryFeeDisplay.tsx
import { Truck, Check, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

const FREE_DELIVERY_THRESHOLD_CENTS = 10000; // $100
const DELIVERY_FEE_CENTS = 1500; // $15

interface DeliveryFeeDisplayProps {
  subtotal: number; // in cents
  className?: string;
}

export function DeliveryFeeDisplay({ subtotal, className }: DeliveryFeeDisplayProps) {
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD_CENTS;
  const amountToFree = FREE_DELIVERY_THRESHOLD_CENTS - subtotal;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-charcoal-600">
          <Truck className="w-4 h-4" />
          <span>Delivery</span>
        </div>
        <span className={cn(
          'font-mono font-medium',
          isFreeDelivery ? 'text-jade-600' : 'text-charcoal-900'
        )}>
          {isFreeDelivery ? 'FREE' : formatPrice(DELIVERY_FEE_CENTS)}
        </span>
      </div>
      
      {!isFreeDelivery && (
        <div className="bg-saffron-50 rounded-lg p-3 border border-saffron-200">
          <p className="text-sm text-curry-700 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
            Add {formatPrice(amountToFree)} more for FREE delivery!
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-saffron-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-saffron-500 rounded-full transition-all duration-500"
              style={{ width: `${(subtotal / FREE_DELIVERY_THRESHOLD_CENTS) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {isFreeDelivery && (
        <div className="bg-jade-50 rounded-lg p-3 border border-jade-200">
          <p className="text-sm text-jade-700 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            You qualify for FREE delivery!
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Utility Functions

### 5.1 Currency Formatting

```typescript
// lib/utils/currency.ts
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatPriceCompact(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

### 5.2 Date Utilities

```typescript
// lib/utils/dates.ts
import { addDays, nextSaturday, isBefore, set } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Los_Angeles';
const CUTOFF_HOUR = 15; // 3 PM
const CUTOFF_MINUTE = 0;
const CUTOFF_DAY = 5; // Friday (0 = Sunday)

export function getDeliveryDate(): { date: Date; isNextWeek: boolean; cutoff: Date } {
  const now = new Date();
  const nowPT = toZonedTime(now, TIMEZONE);
  
  // Get this Saturday
  let saturday = nextSaturday(nowPT);
  
  // If today is Saturday, use today
  if (nowPT.getDay() === 6) {
    saturday = nowPT;
  }
  
  // Calculate cutoff (Friday 3 PM before this Saturday)
  const cutoff = set(addDays(saturday, -1), {
    hours: CUTOFF_HOUR,
    minutes: CUTOFF_MINUTE,
    seconds: 0,
    milliseconds: 0,
  });
  
  // If we're past cutoff, use next Saturday
  if (!isBefore(nowPT, cutoff)) {
    saturday = addDays(saturday, 7);
    const nextCutoff = set(addDays(saturday, -1), {
      hours: CUTOFF_HOUR,
      minutes: CUTOFF_MINUTE,
      seconds: 0,
      milliseconds: 0,
    });
    return {
      date: saturday,
      isNextWeek: true,
      cutoff: fromZonedTime(nextCutoff, TIMEZONE),
    };
  }
  
  return {
    date: saturday,
    isNextWeek: false,
    cutoff: fromZonedTime(cutoff, TIMEZONE),
  };
}

export function getTimeWindows() {
  return [
    { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
    { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
    { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
    { start: '17:00', end: '18:00', label: '5:00 PM - 6:00 PM' },
    { start: '18:00', end: '19:00', label: '6:00 PM - 7:00 PM' },
  ];
}
```

---

## 6. Store Implementation

```typescript
// stores/cart.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  menuItemSlug: string;
  nameEn: string;
  nameMy: string;
  basePriceCents: number;
  quantity: number;
  modifiers: SelectedModifier[];
  notes: string;
  addedAt: string;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getItemsSubtotal: () => number;
  getEstimatedDeliveryFee: () => number;
  getItemCount: () => number;
}

const FREE_DELIVERY_THRESHOLD = 10000;
const DELIVERY_FEE = 1500;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => ({
        items: [...state.items, item],
      })),
      
      updateQuantity: (cartItemId, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.max(1, Math.min(50, quantity)) }
            : item
        ),
      })),
      
      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter((item) => item.cartItemId !== cartItemId),
      })),
      
      clearCart: () => set({ items: [] }),
      
      getItemsSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
          const modifierTotal = item.modifiers.reduce(
            (m, mod) => m + mod.priceDeltaCents,
            0
          );
          return sum + (item.basePriceCents + modifierTotal) * item.quantity;
        }, 0);
      },
      
      getEstimatedDeliveryFee: () => {
        const subtotal = get().getItemsSubtotal();
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'mms-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## 7. Types

```typescript
// types/menu.ts
export interface MenuItem {
  id: string;
  slug: string;
  categoryId: string;
  nameEn: string;
  nameMy?: string;
  descriptionEn?: string;
  imageUrl?: string;
  basePriceCents: number;
  isActive: boolean;
  isSoldOut: boolean;
  tags?: string[];
  allergens?: string[];
  modifierGroups?: ModifierGroup[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  items: MenuItem[];
}

export interface ModifierGroup {
  id: string;
  slug: string;
  name: string;
  selectionType: 'single' | 'multiple';
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  slug: string;
  name: string;
  priceDeltaCents: number;
  isActive: boolean;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}
```

---

## 8. Animation Variants

```typescript
// lib/motion/variants.ts
import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { 
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { x: '100%' },
};

export const badgePop: Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.2, 1],
    transition: { duration: 0.3 },
  },
};
```

---

This guide provides production-ready code patterns. Follow these examples to maintain consistency across the codebase.
