# Task: V1-S1-003 — Item Card Component ✅

> **Sprint**: 1 (Menu Browse)
> **Priority**: P0
> **Depends On**: V1-S1-001 (Menu Data Layer)
> **Branch**: `feat/item-card-v1`
> **Status**: Complete (2026-01-14)

---

## Objective

Enhance the menu item card from V0 with "Popular" badges, improved sold-out overlay, allergen icons with tooltips, and polished hover/tap interactions. Cards should be clickable to open the item detail modal.

---

## Acceptance Criteria

- [x] Card shows: image, name_en, name_my, base_price
- [x] "Popular" badge on items with `featured` tag
- [x] Sold out items show overlay + disabled state
- [x] Allergen icons displayed with hover tooltips
- [x] Skeleton loading state for images
- [x] Hover lift effect (desktop)
- [x] Tap scale effect (mobile)
- [x] Click triggers `onSelect` callback
- [x] Burmese text renders with Padauk font
- [x] Responsive image sizing
- [x] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Allergen Icons Mapping

Create `src/lib/constants/allergens.ts`:

```typescript
import {
  Egg,
  Fish,
  Shell,
  Wheat,
  Milk,
  Nut,
  type LucideIcon,
} from 'lucide-react';

export interface AllergenInfo {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const ALLERGEN_MAP: Record<string, AllergenInfo> = {
  egg: { label: 'Egg', icon: Egg, color: 'text-yellow-600' },
  fish: { label: 'Fish', icon: Fish, color: 'text-blue-600' },
  shellfish: { label: 'Shellfish', icon: Shell, color: 'text-orange-600' },
  gluten_wheat: { label: 'Gluten', icon: Wheat, color: 'text-amber-700' },
  dairy: { label: 'Dairy', icon: Milk, color: 'text-blue-400' },
  peanuts: { label: 'Peanuts', icon: Nut, color: 'text-amber-800' },
  tree_nuts: { label: 'Tree Nuts', icon: Nut, color: 'text-amber-600' },
  soy: { label: 'Soy', icon: Wheat, color: 'text-green-700' },
  sesame: { label: 'Sesame', icon: Wheat, color: 'text-yellow-800' },
};
```

### 2. Enhanced ItemCard Component

Update `src/components/menu/ItemCard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { ALLERGEN_MAP } from '@/lib/constants/allergens';
import type { MenuItem } from '@/types/menu';

interface ItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isPopular = item.tags.includes('featured') || item.tags.includes('popular');
  const hasAllergens = item.allergens && item.allergens.length > 0;

  const handleClick = () => {
    if (!item.isSoldOut) {
      onSelect(item);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        className={cn(
          'overflow-hidden cursor-pointer transition-shadow',
          'hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand-red',
          item.isSoldOut && 'opacity-60 cursor-not-allowed'
        )}
        onClick={handleClick}
        tabIndex={item.isSoldOut ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        role="button"
        aria-disabled={item.isSoldOut}
        aria-label={`${item.nameEn}${item.isSoldOut ? ' - Sold Out' : ''}`}
      >
        {/* Image Section */}
        <div className="relative h-40 bg-muted">
          {/* Popular Badge */}
          {isPopular && !item.isSoldOut && (
            <Badge
              className="absolute top-2 left-2 z-10 bg-gold text-white border-0 shadow-md"
            >
              <Star className="w-3 h-3 mr-1 fill-current" />
              Popular
            </Badge>
          )}

          {/* Image or Placeholder */}
          {item.imageUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0" />
              )}
              <Image
                src={item.imageUrl}
                alt={item.nameEn}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-brand-red/10 flex items-center justify-center">
              <span className="text-5xl" role="img" aria-label="Food">
                🍜
              </span>
            </div>
          )}

          {/* Sold Out Overlay */}
          {item.isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge
                variant="secondary"
                className="bg-white text-foreground text-base px-4 py-2"
              >
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          {/* Names */}
          <div className="mb-2">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-1">
              {item.nameEn}
            </h3>
            {item.nameMy && (
              <p className="text-sm text-muted-foreground font-burmese line-clamp-1">
                {item.nameMy}
              </p>
            )}
          </div>

          {/* Description */}
          {item.descriptionEn && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.descriptionEn}
            </p>
          )}

          {/* Price and Allergens Row */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-brand-red">
              {formatPrice(item.basePriceCents)}
            </span>

            {/* Allergen Icons */}
            {hasAllergens && (
              <TooltipProvider delayDuration={100}>
                <div className="flex gap-1">
                  {item.allergens.slice(0, 4).map((allergen) => {
                    const info = ALLERGEN_MAP[allergen];
                    if (!info) return null;

                    const IconComponent = info.icon;
                    return (
                      <Tooltip key={allergen}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center',
                              'border border-amber-200'
                            )}
                          >
                            <IconComponent
                              className={cn('w-3.5 h-3.5', info.color)}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Contains {info.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {item.allergens.length > 4 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                          <span className="text-xs text-amber-700 font-medium">
                            +{item.allergens.length - 4}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {item.allergens
                            .slice(4)
                            .map((a) => ALLERGEN_MAP[a]?.label || a)
                            .join(', ')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

### 3. Price Formatting Utility

Create `src/lib/utils/currency.ts`:

```typescript
/**
 * Format cents to display price string
 * @param cents - Price in cents (e.g., 1250 = $12.50)
 * @returns Formatted price string (e.g., "$12.50")
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Parse price string to cents
 * @param price - Price string (e.g., "$12.50")
 * @returns Price in cents (e.g., 1250)
 */
export function parsePriceToCents(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(cleaned) * 100);
}
```

### 4. ItemCard Skeleton

Create `src/components/menu/ItemCardSkeleton.tsx`:

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ItemCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full mb-3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-16" />
          <div className="flex gap-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Test Plan

### Visual Testing

1. **Card Display**
   - [ ] Image loads correctly
   - [ ] Fallback shows when no image
   - [ ] Name (EN + MY) displays
   - [ ] Price formatted correctly

2. **Popular Badge**
   - [ ] Badge shows on featured items
   - [ ] Badge hidden when sold out
   - [ ] Gold color styling

3. **Sold Out State**
   - [ ] Overlay visible
   - [ ] Card is dimmed
   - [ ] Click is disabled
   - [ ] Cursor shows not-allowed

4. **Allergen Icons**
   - [ ] Icons show for allergens
   - [ ] Tooltip on hover
   - [ ] +N badge for overflow

5. **Interactions**
   - [ ] Hover lift effect (desktop)
   - [ ] Tap scale effect (mobile)
   - [ ] Keyboard navigation works

### Accessibility Testing

- [ ] Alt text on images
- [ ] Role="button" on card
- [ ] Aria-disabled for sold out
- [ ] Focus ring visible
- [ ] Screen reader announces state

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [x] Card shows image, name, price
2. [x] Popular badge on featured items
3. [x] Sold out overlay + disabled state
4. [x] Allergen icons with tooltips
5. [x] Image skeleton loading
6. [x] Hover/tap animations
7. [x] Click triggers callback
8. [x] Burmese font renders
9. [x] Keyboard accessible
10. [x] `pnpm lint` passes
11. [x] `pnpm typecheck` passes
12. [x] `pnpm build` succeeds
13. [x] `docs/project_status.md` updated

---

## Notes for Codex

- Use `line-clamp-1` and `line-clamp-2` for text truncation
- Popular tag check: `item.tags.includes('featured')` or `item.tags.includes('popular')`
- Show max 4 allergen icons, then "+N" badge
- Framer Motion `whileHover` and `whileTap` for micro-interactions
- Card must be focusable and keyboard-operable
- Use `next/image` with `fill` for responsive images

---

*Task ready for implementation*
